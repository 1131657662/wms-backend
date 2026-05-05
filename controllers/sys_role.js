const { Op } = require('sequelize');
const { SysRole, SysPermission, SysRolePermission } = require('../models');
const logService = require('../services/logService');

exports.list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword } = req.query;
    const where = { del_flag: 0 };
    if (keyword) {
      where[Op.or] = [
        { role_code: { [Op.like]: `%${keyword}%` } },
        { role_name: { [Op.like]: `%${keyword}%` } }
      ];
    }
    const { count, rows } = await SysRole.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: Number(pageSize)
    });
    res.json({ code: 200, data: { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    console.error('角色列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.create = async (req, res) => {
  try {
    const { role_code, role_name, remark } = req.body;
    if (!role_code || !role_name) return res.status(400).json({ code: 400, message: '角色编码和名称不能为空' });
    const exist = await SysRole.findOne({ where: { role_code, del_flag: 0 } });
    if (exist) return res.status(400).json({ code: 400, message: '角色编码已存在' });
    const role = await SysRole.create({ role_code, role_name, remark, create_by: req.user.username });
    res.json({ code: 200, message: '创建成功', data: role });
logService.log({ userId: req.user.id, username: req.user.username, module: '系统管理', operation: '创建角色', operationDesc: `创建角色「${role.role_name}」`, businessType: 'role', businessId: String(role.id), method: 'POST', ip: req.ip, status: 1 });
  } catch (err) {
    console.error('创建角色失败:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ code: 400, message: '角色编码已存在' });
    }
    res.status(500).json({ code: 500, message: err.message || '服务器内部错误' });
  }
};

exports.update = async (req, res) => {
  try {
    const role = await SysRole.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!role) return res.status(404).json({ code: 404, message: '角色不存在' });
    const { role_code, role_name, remark } = req.body;
    if (role_code && role_code !== role.role_code) {
      const exist = await SysRole.findOne({ where: { role_code, del_flag: 0, id: { [Op.ne]: role.id } } });
      if (exist) return res.status(400).json({ code: 400, message: '角色编码已存在' });
    }
    await role.update({
      ...(role_code ? { role_code } : {}),
      role_name, remark,
      update_by: req.user.username
    });
    res.json({ code: 200, message: '更新成功', data: role });
logService.log({ userId: req.user.id, username: req.user.username, module: '系统管理', operation: '编辑角色', operationDesc: `编辑角色「${role.role_name}」`, businessType: 'role', businessId: String(role.id), method: 'PUT', ip: req.ip, status: 1 });
  } catch (err) {
    console.error('更新角色失败:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ code: 400, message: '角色编码已存在' });
    }
    res.status(500).json({ code: 500, message: err.message || '服务器内部错误' });
  }
};

exports.remove = async (req, res) => {
  try {
    const role = await SysRole.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!role) return res.status(404).json({ code: 404, message: '角色不存在' });
    await role.update({ del_flag: 1, update_by: req.user.username });
    await SysRolePermission.destroy({ where: { role_id: role.id } });
    res.json({ code: 200, message: '删除成功' });
logService.log({ userId: req.user.id, username: req.user.username, module: '系统管理', operation: '删除角色', operationDesc: `删除角色「${role.role_name}」`, businessType: 'role', businessId: String(role.id), method: 'DELETE', ip: req.ip, status: 1 });
  } catch (err) {
    console.error('删除角色失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.getPermissions = async (req, res) => {
  try {
    const role = await SysRole.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!role) return res.status(404).json({ code: 404, message: '角色不存在' });
    const allPerms = await SysPermission.findAll({ where: { del_flag: 0 }, order: [['sort_order', 'ASC'], ['id', 'ASC']] });
    const bindings = await SysRolePermission.findAll({ where: { role_id: role.id } });
    const checkedIds = bindings.map(b => b.perm_id);

    // Build tree: parent nodes have type='M', children have type='B'
    const tree = [];
    const map = {};
    allPerms.forEach(p => { map[p.id] = { id: p.id, perm_name: p.perm_name, perm_code: p.perm_code, type: p.type, parent_id: p.parent_id, children: [] }; });
    allPerms.forEach(p => {
      const node = map[p.id];
      if (p.parent_id && map[p.parent_id] && p.type !== 'M') {
        map[p.parent_id].children.push(node);
      } else if (p.type === 'M') {
        tree.push(node);
      }
    });
    // Clean empty children arrays for leaf nodes
    function clean(n) {
      if (n.children && n.children.length === 0) delete n.children;
      else if (n.children) n.children.forEach(clean);
    }
    tree.forEach(clean);

    res.json({ code: 200, data: { permissionTree: tree, checkedPermIds: checkedIds } });
  } catch (err) {
    console.error('获取角色权限失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

exports.setPermissions = async (req, res) => {
  try {
    const role = await SysRole.findOne({ where: { id: req.params.id, del_flag: 0 } });
    if (!role) return res.status(404).json({ code: 404, message: '角色不存在' });
    const { perm_ids } = req.body;
    await SysRolePermission.destroy({ where: { role_id: role.id } });
    if (perm_ids && perm_ids.length > 0) {
      await SysRolePermission.bulkCreate(perm_ids.map(pid => ({ role_id: role.id, perm_id: pid })));
    }
    res.json({ code: 200, message: '权限分配成功' });
    logService.log({ userId: req.user.id, username: req.user.username, module: '系统管理', operation: '分配权限', operationDesc: `分配角色「${role.role_name}」的权限`, businessType: 'role', businessId: String(role.id), method: 'PUT', ip: req.ip, status: 1 });
  } catch (err) {
    console.error('分配权限失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};
