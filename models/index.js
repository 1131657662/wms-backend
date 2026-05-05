const SysUser = require('./sys_user');
const SysRole = require('./sys_role');
const SysUserRole = require('./sys_user_role');
const SysPermission = require('./sys_permission');
const SysRolePermission = require('./sys_role_permission');

// 用户 <-> 角色 多对多
SysUser.belongsToMany(SysRole, {
  through: SysUserRole,
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'sys_roles'
});
SysRole.belongsToMany(SysUser, {
  through: SysUserRole,
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'sys_users'
});

// 角色 <-> 权限 多对多
SysRole.belongsToMany(SysPermission, {
  through: SysRolePermission,
  foreignKey: 'role_id',
  otherKey: 'perm_id',
  as: 'sys_permissions'
});
SysPermission.belongsToMany(SysRole, {
  through: SysRolePermission,
  foreignKey: 'perm_id',
  otherKey: 'role_id',
  as: 'sys_roles'
});

module.exports = { SysUser, SysRole, SysUserRole, SysPermission, SysRolePermission };
