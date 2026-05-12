const bcrypt = require('bcryptjs');
const { verifyPassword } = require('../utils/password');
const path = require('path');
const fs = require('fs');
const { SysUser, SysRole } = require('../models');
const UserLoginLog = require('../models/user_login_log');

exports.securityLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 10));
    const { count, rows } = await UserLoginLog.findAndCountAll({
      where: { username: req.user.username },
      order: [['createTime', 'DESC']],
      limit: pageSize,
      offset: (page - 1) * pageSize
    });
    const list = rows.map(r => {
      const x = r.get({ plain: true });
      return {
        id: x.id,
        summary: x.status === 1 ? '登录成功' : `登录失败${x.failReason ? `（${x.failReason}）` : ''}`,
        ip: x.ip || '',
        address: '—',
        system: x.osName || '—',
        browser: x.browserName || '—',
        operatingTime: x.createTime
      };
    });
    res.json({
      code: 200,
      data: { list, total: count, pageSize, currentPage: page }
    });
  } catch (err) {
    console.error('安全日志查询失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.profile = async (req, res) => {
  try {
    const user = await SysUser.findOne({
      where: { id: req.user.id, del_flag: 0 },
      attributes: { exclude: ['password'] },
      include: [{ model: SysRole, as: 'sys_roles', attributes: ['role_code', 'role_name'], through: { attributes: [] } }]
    });
    if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
    const j = user.toJSON();
    const role = j.sys_roles?.[0];
    const data = {
      ...j,
      roleCode: role?.role_code || '',
      roleName: role?.role_name || '',
      wechat_bound: Boolean(j.openid)
    };
    delete data.sys_roles;
    delete data.openid;
    delete data.password;
    res.json({ code: 200, data });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await SysUser.findOne({ where: { id: req.user.id, del_flag: 0 } });
    if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
    const { nickname, email, phone } = req.body;
    await user.update({ nickname, email, phone, update_by: req.user.username });
    res.json({ code: 200, message: '更新成功', data: { nickname, email, phone } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    const { image } = req.body; // base64 encoded
    if (!image) return res.status(400).json({ code: 400, message: '请选择图片' });

    const user = await SysUser.findOne({ where: { id: req.user.id, del_flag: 0 } });
    if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });

    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) return res.status(400).json({ code: 400, message: '图片格式错误' });

    const ext = matches[1] === 'png' ? 'png' : 'jpg';
    if (ext !== 'jpg' && ext !== 'png') return res.status(400).json({ code: 400, message: '仅支持 JPG/PNG 格式' });

    const data = Buffer.from(matches[2], 'base64');
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (data.length > maxSize) return res.status(400).json({ code: 400, message: '图片大小不能超过 2MB' });

    const filename = `avatar_${req.user.id}_${Date.now()}.${ext}`;
    const dir = path.join(__dirname, '..', 'public', 'avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), data);

    // 删除旧的自定义头像（跳过默认头像）
    if (user.avatar && user.avatar.startsWith('/public/avatars/')) {
      const oldPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatar = `/public/avatars/${filename}`;
    await user.update({ avatar, update_by: req.user.username });
    res.json({ code: 200, message: '头像上传成功', data: { avatar } });
  } catch (err) {
    console.error('头像上传失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const user = await SysUser.findOne({ where: { id: req.user.id, del_flag: 0 } });
    if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ code: 400, message: '旧密码和新密码不能为空' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ code: 400, message: '新密码长度不能少于6位' });
    }

    const valid = verifyPassword(oldPassword, user.password);
    if (!valid) return res.status(400).json({ code: 400, message: '旧密码不正确' });

    const hashed = bcrypt.hashSync(newPassword, 10);
    await user.update({ password: hashed, update_by: req.user.username });
    res.json({ code: 200, message: '密码修改成功' });
  } catch (err) {
    console.error('修改密码失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
