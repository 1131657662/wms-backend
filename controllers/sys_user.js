const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const logService = require('../services/logService');
const { SysUser, SysRole, SysUserRole } = require('../models');
const { clearSoftDeletedConflicts } = require('../utils/clearSoftDeleted');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { HttpError, rethrowIfHttpError, rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');
const { clampPage, clampPageSize } = require('../utils/pagination');

function throwIfUserDuplicate(err) {
  if (err.name !== 'SequelizeUniqueConstraintError') return;
  throw new HttpError(400, '用户名已存在');
}

exports.list = async (req, res) => {
  try {
    const { keyword } = req.query;
    const page = clampPage(req.query.page);
    const pageSize = clampPageSize(req.query.pageSize, 10);
    const where = { del_flag: 0 };
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const { count, rows } = await SysUser.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [{ model: SysRole, as: 'sys_roles', attributes: ['id', 'role_code', 'role_name'], through: { attributes: [] } }],
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    return sendSuccess(res, { list: rows, total: count, page, pageSize });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('用户列表失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.create = async (req, res) => {
  try {
    const { username, nickname, email, phone, status, remark, role_ids } = req.body;
    if (!username) throw new HttpError(400, '用户名不能为空');

    const exist = await SysUser.findOne({ where: { username, del_flag: 0 } });
    if (exist) throw new HttpError(400, '用户名已存在');
    await clearSoftDeletedConflicts(SysUser, req.body, ['username']);

    const hashed = bcrypt.hashSync('123456', 10);
    const avatarIndex = Math.floor(Math.random() * 6) + 1;
    const avatar = `/public/default-avatars/${avatarIndex}.svg`;
    const user = await SysUser.create({
      username, nickname, email, phone, avatar,
      status: status !== undefined ? status : 1,
      remark,
      password: hashed,
      create_by: req.user.username
    });

    if (role_ids && role_ids.length > 0) {
      await SysUserRole.bulkCreate(role_ids.map(rid => ({ user_id: user.id, role_id: rid })));
    }

    logService.log({ userId: req.user.id, username: req.user.username, module: '系统管理', operation: '创建用户', operationDesc: `创建用户「${user.username}」`, businessType: 'user', businessId: String(user.id), method: 'POST', ip: req.ip, status: 1 });
    return sendSuccess(res, user, '创建成功');
  } catch (err) {
    rethrowIfHttpError(err);
    throwIfUserDuplicate(err);
    rethrowIfHttpErrorOrSequelize(err);
    console.error('创建用户失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.update = async (req, res) => {
  try {
    const user = await SysUser.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!user) throw new HttpError(404, '用户不存在');

    const { username, nickname, email, phone, status, remark, role_ids } = req.body;
    if (username && username !== user.username) {
      const exist = await SysUser.findOne({ where: { username, del_flag: 0, id: { [Op.ne]: user.id } } });
      if (exist) throw new HttpError(400, '用户名已存在');
    }
    await clearSoftDeletedConflicts(SysUser, req.body, ['username']);

    await user.update({
      ...(username ? { username } : {}),
      nickname, email, phone, status, remark,
      update_by: req.user.username
    });

    if (role_ids !== undefined) {
      await SysUserRole.destroy({ where: { user_id: user.id } });
      if (role_ids.length > 0) {
        await SysUserRole.bulkCreate(role_ids.map(rid => ({ user_id: user.id, role_id: rid })));
      }
    }

    logService.log({ userId: req.user.id, username: req.user.username, module: '系统管理', operation: '编辑用户', operationDesc: `编辑用户「${user.username}」`, businessType: 'user', businessId: String(user.id), method: 'PUT', ip: req.ip, status: 1 });
    return sendSuccess(res, user, '更新成功');
  } catch (err) {
    rethrowIfHttpError(err);
    throwIfUserDuplicate(err);
    rethrowIfHttpErrorOrSequelize(err);
    console.error('更新用户失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.remove = async (req, res) => {
  try {
    const user = await SysUser.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!user) throw new HttpError(404, '用户不存在');
    await user.update({ del_flag: 1, update_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '系统管理', operation: '删除用户', operationDesc: `删除用户「${user.username}」`, businessType: 'user', businessId: String(user.id), method: 'DELETE', ip: req.ip, status: 1 });
    return sendSuccess(res, null, '删除成功');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('删除用户失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const user = await SysUser.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!user) throw new HttpError(404, '用户不存在');
    const hashed = bcrypt.hashSync('123456', 10);
    await user.update({ password: hashed, update_by: req.user.username });
    logService.log({ userId: req.user.id, username: req.user.username, module: '系统管理', operation: '重置密码', operationDesc: `重置用户「${user.username}」的密码`, businessType: 'user', businessId: String(user.id), method: 'PUT', ip: req.ip, status: 1 });
    return sendSuccess(res, null, '密码已重置为 123456');
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('重置密码失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};
