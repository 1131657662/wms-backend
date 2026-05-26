const bcrypt = require('bcryptjs');
const { verifyPassword } = require('../utils/password');
const path = require('path');
const fs = require('fs');
const { SysUser, SysRole } = require('../models');
const UserLoginLog = require('../models/user_login_log');
const SysConfig = require('../models/sys_config');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { clampPage, clampPageSize } = require('../utils/pagination');
const { writeUserLoginLog } = require('../services/userLoginLogService');
const { LOGIN_LOG_EVENT, securityLogSummaryWithTag } = require('../constants/audit');

exports.securityLogs = async (req, res) => {
  try {
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 10, 100);
    const cfg = await SysConfig.findOne({ where: { config_key: 'log_retention_days' } });
    const retentionDays = parseInt((cfg && cfg.config_value) || 90, 10);
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
        eventType: x.eventType || LOGIN_LOG_EVENT.LOGIN,
        summary: securityLogSummaryWithTag(x),
        ip: x.ip || '',
        address: '—',
        system: x.osName || '—',
        browser: x.browserName || '—',
        operatingTime: x.createTime
      };
    });
    return sendSuccess(res, { list, total: count, pageSize, currentPage: page, retentionDays });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('安全日志查询失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.profile = async (req, res) => {
  try {
    const user = await SysUser.findOne({
      where: { id: req.user.id, del_flag: 0 },
      attributes: { exclude: ['password'] },
      include: [{ model: SysRole, as: 'sys_roles', attributes: ['role_code', 'role_name'], through: { attributes: [] } }]
    });
    if (!user) throw new HttpError(404, '用户不存在');
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
    return sendSuccess(res, data);
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await SysUser.findOne({ where: { id: req.user.id, del_flag: 0 } });
    if (!user) throw new HttpError(404, '用户不存在');
    const { nickname, email, phone } = req.body;
    await user.update({ nickname, email, phone, update_by: req.user.username });
    await writeUserLoginLog({
      userId: user.id,
      username: user.username,
      req,
      status: 1,
      failReason: null,
      eventType: LOGIN_LOG_EVENT.PROFILE_UPDATE
    });
    return sendSuccess(res, { nickname, email, phone }, '更新成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    let data, ext;

    // 优先取 multipart FormData 文件，其次取 JSON base64
    if (req.file) {
      ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
      data = req.file.buffer;
    } else {
      const { image } = req.body;
      if (!image) throw new HttpError(400, '请选择图片');

      const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) throw new HttpError(400, '图片格式错误');

      ext = matches[1] === 'png' ? 'png' : 'jpg';
      data = Buffer.from(matches[2], 'base64');
    }

    if (ext !== 'jpg' && ext !== 'png') throw new HttpError(400, '仅支持 JPG/PNG 格式');

    const maxSize = 2 * 1024 * 1024;
    if (data.length > maxSize) throw new HttpError(400, '图片大小不能超过 2MB');

    const user = await SysUser.findOne({ where: { id: req.user.id, del_flag: 0 } });
    if (!user) throw new HttpError(404, '用户不存在');

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
    await writeUserLoginLog({
      userId: user.id,
      username: user.username,
      req,
      status: 1,
      failReason: null,
      eventType: LOGIN_LOG_EVENT.AVATAR_UPDATE
    });
    return sendSuccess(res, { avatar }, '头像上传成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('头像上传失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.changePassword = async (req, res) => {
  try {
    const user = await SysUser.findOne({ where: { id: req.user.id, del_flag: 0 } });
    if (!user) throw new HttpError(404, '用户不存在');

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      throw new HttpError(400, '旧密码和新密码不能为空');
    }
    if (newPassword.length < 6) {
      throw new HttpError(400, '新密码长度不能少于6位');
    }

    const valid = verifyPassword(oldPassword, user.password);
    if (!valid) throw new HttpError(400, '旧密码不正确');

    const hashed = bcrypt.hashSync(newPassword, 10);
    await user.update({ password: hashed, update_by: req.user.username });
    await writeUserLoginLog({
      userId: user.id,
      username: user.username,
      req,
      status: 1,
      failReason: null,
      eventType: LOGIN_LOG_EVENT.PASSWORD_CHANGE
    });
    return sendSuccess(res, null, '密码修改成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('修改密码失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};
