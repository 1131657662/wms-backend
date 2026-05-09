const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const { SysUser, SysRole, SysPermission, SysRolePermission } = require('../models');
const logService = require('../services/logService');
require('dotenv').config();

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }

    const user = await SysUser.findOne({
      where: { username, status: 1, del_flag: 0 },
      include: [{ model: SysRole, as: 'sys_roles', attributes: ['id', 'role_code', 'role_name'] }]
    });

    if (!user) {
      logService.log({
        username, module: '登录', operation: 'POST /api/login',
        operationDesc: '登录失败（用户不存在）', method: 'POST',
        ip: req.ip, status: 0, errorMsg: '用户名或密码错误'
      });
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      logService.log({
        username, module: '登录', operation: 'POST /api/login',
        operationDesc: '登录失败（密码错误）', method: 'POST',
        ip: req.ip, status: 0, errorMsg: '用户名或密码错误'
      });
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const roleCode = user.sys_roles?.[0]?.role_code || '';
    const roleId = user.sys_roles?.[0]?.id || null;

    let permissions = [];
    if (roleId) {
      const bindings = await SysRolePermission.findAll({ where: { role_id: roleId } });
      if (bindings.length > 0) {
        const perms = await SysPermission.findAll({
          where: { id: bindings.map(b => b.perm_id), del_flag: 0 },
          attributes: ['perm_code'],
          raw: true
        });
        permissions = perms.map(p => p.perm_code);
      }
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, nickname: user.nickname, roleCode, permissions },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 写入在线用户记录（登录时即时写入，不等 logger 的异步 finish 回调）
    try {
      const SysOnlineUser = require('../models/sys_online_user');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await SysOnlineUser.upsert({
        user_id: user.id,
        username: user.username,
        nickname: user.nickname || '',
        ip: req.ip || req.connection?.remoteAddress || '',
        login_time: new Date(),
        last_active_time: new Date(),
        token_hash: tokenHash
      }, { conflictFields: ['token_hash'] });
    } catch { /* 不影响登录流程 */ }

    res.json({
      code: 200,
      message: 'success',
      data: {
        token,
        userInfo: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          roleCode,
          avatar: user.avatar || '',
          permissions
        }
      }
    });

    logService.log({
      userId: user.id, username: user.username, module: '登录',
      operation: 'POST /api/login', operationDesc: '用户登录成功',
      method: 'POST', ip: req.ip, status: 1
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 登出
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const SysOnlineUser = require('../models/sys_online_user');
      await SysOnlineUser.destroy({ where: { token_hash: tokenHash } });
    }
    res.json({ code: 200, message: '登出成功' });
  } catch (err) {
    console.error('登出失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 微信静默登录
router.post('/wx-login', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ code: 400, message: '微信授权码不能为空' });
    }

    // 调用微信 jscode2session 换取 openid
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WX_APPID,
        secret: process.env.WX_APP_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const { openid, errcode, errmsg } = wxRes.data;
    if (errcode || !openid) {
      console.error('微信 jscode2session 失败:', errcode, errmsg);
      return res.status(400).json({ code: 400, message: '微信登录失败: ' + (errmsg || '无法获取openid') });
    }

    // 查找已绑定 openid 的用户
    const user = await SysUser.findOne({
      where: { openid, status: 1, del_flag: 0 },
      include: [{ model: SysRole, as: 'sys_roles', attributes: ['id', 'role_code', 'role_name'] }]
    });

    if (!user) {
      return res.json({
        code: 200,
        message: 'success',
        data: { needBind: true, openid }
      });
    }

    const roleCode = user.sys_roles?.[0]?.role_code || '';

    const token = jwt.sign(
      { id: user.id, username: user.username, nickname: user.nickname, roleCode, permissions: [] },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      code: 200,
      message: 'success',
      data: {
        token,
        userInfo: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          roleCode,
          avatar: user.avatar || '',
          permissions: []
        }
      }
    });

    logService.log({
      userId: user.id, username: user.username, module: '微信登录',
      operation: 'POST /api/wx-login', operationDesc: '微信用户登录成功',
      method: 'POST', ip: req.ip, status: 1
    });
  } catch (err) {
    console.error('微信登录失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

// 绑定微信 openid 到已有账号
router.post('/bind-openid', async (req, res) => {
  try {
    const { openid, username, password } = req.body;
    if (!openid || !username || !password) {
      return res.status(400).json({ code: 400, message: 'openid、用户名和密码不能为空' });
    }

    const user = await SysUser.findOne({
      where: { username, status: 1, del_flag: 0 }
    });

    if (!user) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    // 检查 openid 是否已被其他用户绑定
    const existing = await SysUser.findOne({ where: { openid } });
    if (existing && existing.id !== user.id) {
      return res.status(400).json({ code: 400, message: '该微信已绑定其他账号' });
    }

    // 绑定 openid
    user.openid = openid;
    await user.save();

    // 重新查询带角色信息
    const userWithRole = await SysUser.findOne({
      where: { id: user.id },
      include: [{ model: SysRole, as: 'sys_roles', attributes: ['id', 'role_code', 'role_name'] }]
    });

    const roleCode = userWithRole.sys_roles?.[0]?.role_code || '';
    const roleId = userWithRole.sys_roles?.[0]?.id || null;

    let permissions = [];
    if (roleId) {
      const bindings = await SysRolePermission.findAll({ where: { role_id: roleId } });
      if (bindings.length > 0) {
        const perms = await SysPermission.findAll({
          where: { id: bindings.map(b => b.perm_id), del_flag: 0 },
          attributes: ['perm_code'],
          raw: true
        });
        permissions = perms.map(p => p.perm_code);
      }
    }

    const token = jwt.sign(
      { id: userWithRole.id, username: userWithRole.username, nickname: userWithRole.nickname, roleCode, permissions },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      code: 200,
      message: 'success',
      data: {
        token,
        userInfo: {
          id: userWithRole.id,
          username: userWithRole.username,
          nickname: userWithRole.nickname,
          roleCode,
          avatar: userWithRole.avatar || '',
          permissions
        }
      }
    });

    logService.log({
      userId: userWithRole.id, username: userWithRole.username, module: '微信绑定',
      operation: 'POST /api/bind-openid', operationDesc: '绑定微信openid成功',
      method: 'POST', ip: req.ip, status: 1
    });
  } catch (err) {
    console.error('绑定微信失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
});

module.exports = router;
