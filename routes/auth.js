const express = require('express');
const { verifyPassword } = require('../utils/password');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const { SysUser, SysRole, SysPermission, SysRolePermission } = require('../models');
const logService = require('../services/logService');
const { writeUserLoginLog } = require('../services/userLoginLogService');
const { loginLimiter, wxAuthLimiter } = require('../middleware/rateLimit');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { asyncHandler } = require('../utils/asyncHandler');
require('dotenv').config();

const router = express.Router();

async function writeLoginLog({ userId, username, req, status, failReason }) {
  await writeUserLoginLog({ userId, username, req, status, failReason });
}

function assertJwtSecret() {
  if (!process.env.JWT_SECRET || !String(process.env.JWT_SECRET).trim()) {
    console.error('JWT_SECRET 未配置，无法签发 token');
    throw new HttpError(500, '服务器未配置 JWT_SECRET，请在 .env 中设置', { expose: true });
  }
}

router.post('/login', loginLimiter, asyncHandler(async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new HttpError(400, '用户名和密码不能为空');
    }

    const user = await SysUser.findOne({
      where: { username, status: 1, del_flag: 0 },
      include: [{ model: SysRole, as: 'sys_roles', attributes: ['id', 'role_code', 'role_name'] }]
    });

    if (!user) {
      await writeLoginLog({
        userId: null,
        username,
        req,
        status: 0,
        failReason: '用户不存在'
      });
      logService.log({
        username, module: '登录', operation: 'POST /api/login',
        operationDesc: '登录失败（用户不存在）', method: 'POST',
        ip: req.ip, status: 0, errorMsg: '用户名或密码错误'
      });
      throw new HttpError(401, '用户名或密码错误');
    }

    const valid = verifyPassword(password, user.password);
    if (!valid) {
      await writeLoginLog({
        userId: user.id,
        username,
        req,
        status: 0,
        failReason: '密码错误'
      });
      logService.log({
        username, module: '登录', operation: 'POST /api/login',
        operationDesc: '登录失败（密码错误）', method: 'POST',
        ip: req.ip, status: 0, errorMsg: '用户名或密码错误'
      });
      throw new HttpError(401, '用户名或密码错误');
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

    assertJwtSecret();

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

    await writeLoginLog({
      userId: user.id,
      username: user.username,
      req,
      status: 1,
      failReason: null
    });

    logService.log({
      userId: user.id, username: user.username, module: '登录',
      operation: 'POST /api/login', operationDesc: '用户登录成功',
      method: 'POST', ip: req.ip, status: 1
    });
    return sendSuccess(res, {
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        roleCode,
        avatar: user.avatar || '',
        permissions
      }
    });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('登录失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
}));

// 登出
router.post('/logout', asyncHandler(async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const SysOnlineUser = require('../models/sys_online_user');
      await SysOnlineUser.destroy({ where: { token_hash: tokenHash } });
    }
    return sendSuccess(res, null, '登出成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('登出失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
}));

// 微信静默登录
router.post('/wx-login', wxAuthLimiter, asyncHandler(async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      throw new HttpError(400, '微信授权码不能为空');
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
      throw new HttpError(400, '微信登录失败: ' + (errmsg || '无法获取openid'));
    }

    // 查找已绑定 openid 的用户
    const user = await SysUser.findOne({
      where: { openid, status: 1, del_flag: 0 },
      include: [{ model: SysRole, as: 'sys_roles', attributes: ['id', 'role_code', 'role_name'] }]
    });

    if (!user) {
      return sendSuccess(res, { needBind: true, openid });
    }

    const roleCode = user.sys_roles?.[0]?.role_code || '';
    const roleId = user.sys_roles?.[0]?.id || null;
    const roleName = user.sys_roles?.[0]?.role_name || '';

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

    assertJwtSecret();

    const token = jwt.sign(
      { id: user.id, username: user.username, nickname: user.nickname, roleCode, permissions },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    logService.log({
      userId: user.id, username: user.username, module: '微信登录',
      operation: 'POST /api/wx-login', operationDesc: '微信用户登录成功',
      method: 'POST', ip: req.ip, status: 1
    });
    await writeUserLoginLog({
      userId: user.id,
      username: user.username,
      req,
      status: 1,
      failReason: null
    });
    return sendSuccess(res, {
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        roleCode,
        roleName,
        avatar: user.avatar || '',
        permissions
      }
    });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('微信登录失败:', err);
    const sql = err.parent?.sqlMessage || '';
    if (sql.includes('openid')) {
      throw new HttpError(
        503,
        '数据库缺少字段 openid：请重启后端自动迁移，或执行 migrations/003_add_openid.sql',
        { expose: true }
      );
    }
    return sendError(res, 500, '服务器内部错误');
  }
}));

// 绑定微信 openid 到已有账号（openid 可由前端缓存传入，也可传 code 由服务端换 openid）
router.post('/bind-openid', wxAuthLimiter, asyncHandler(async (req, res) => {
  try {
    let { openid, username, password, code } = req.body;

    if ((!openid || !String(openid).trim()) && code) {
      let wxRes;
      try {
        wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
          params: {
            appid: process.env.WX_APPID,
            secret: process.env.WX_APP_SECRET,
            js_code: code,
            grant_type: 'authorization_code'
          },
          timeout: 15000
        });
      } catch (netErr) {
        console.error('bind-openid jscode2session 网络错误:', netErr.message);
        throw new HttpError(503, '无法连接微信服务器，请检查网络后重试', { expose: true });
      }
      const { openid: oid, errcode, errmsg } = wxRes.data;
      if (errcode || !oid) {
        console.error('bind-openid jscode2session:', errcode, errmsg);
        throw new HttpError(400, '微信授权失败，请检查 WX_APPID/WX_APP_SECRET 与小程序是否一致: ' + (errmsg || ''));
      }
      openid = oid;
    }

    if (!openid || !username || !password) {
      throw new HttpError(400, '缺少微信凭证（openid/code）或账号密码');
    }

    const user = await SysUser.findOne({
      where: { username, status: 1, del_flag: 0 }
    });

    if (!user) {
      throw new HttpError(401, '用户名或密码错误');
    }

    const valid = verifyPassword(password, user.password);
    if (!valid) {
      throw new HttpError(401, '用户名或密码错误');
    }

    // 检查 openid 是否已被其他用户绑定
    const existing = await SysUser.findOne({ where: { openid } });
    if (existing && existing.id !== user.id) {
      throw new HttpError(400, '该微信已绑定其他账号');
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

    assertJwtSecret();

    const token = jwt.sign(
      { id: userWithRole.id, username: userWithRole.username, nickname: userWithRole.nickname, roleCode, permissions },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    logService.log({
      userId: userWithRole.id, username: userWithRole.username, module: '微信绑定',
      operation: 'POST /api/bind-openid', operationDesc: '绑定微信openid成功',
      method: 'POST', ip: req.ip, status: 1
    });
    return sendSuccess(res, {
      token,
      userInfo: {
        id: userWithRole.id,
        username: userWithRole.username,
        nickname: userWithRole.nickname,
        roleCode,
        roleName: userWithRole.sys_roles?.[0]?.role_name || '',
        avatar: userWithRole.avatar || '',
        permissions
      }
    });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('绑定微信失败:', err);
    const sql = err.parent?.sqlMessage || '';
    if (sql.includes('openid')) {
      throw new HttpError(
        503,
        '数据库缺少字段 openid：请重启后端自动迁移，或执行 migrations/003_add_openid.sql',
        { expose: true }
      );
    }
    return sendError(res, 500, '服务器内部错误');
  }
}));

module.exports = router;
