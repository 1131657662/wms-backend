const crypto = require('crypto');
const { Op } = require('sequelize');
const SysOnlineUser = require('../models/sys_online_user');
const SysTokenBlacklist = require('../models/sys_token_blacklist');

// 获取在线用户列表（最近5分钟内有活动的用户视为在线）
exports.list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, username } = req.query;
    const where = {};
    if (username) where.username = { [Op.like]: `%${username}%` };

    // 清理超过5分钟无活动的用户
    const timeout = new Date(Date.now() - 5 * 60 * 1000);
    await SysOnlineUser.destroy({ where: { last_active_time: { [Op.lt]: timeout } } });

    const { count, rows } = await SysOnlineUser.findAndCountAll({
      where,
      order: [['last_active_time', 'DESC']],
      offset: (Number(page) - 1) * Number(pageSize),
      limit: Number(pageSize),
      attributes: { exclude: ['token_hash'] } // 不返回 token_hash
    });

    res.json({ code: 200, data: { list: rows, total: count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    console.error('在线用户列表失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 强制下线（该用户所有登录设备全部踢出）
exports.kick = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ code: 400, message: '缺少 user_id' });
    }

    // 查找该用户所有在线记录
    const onlineUsers = await SysOnlineUser.findAll({ where: { user_id } });
    for (const ou of onlineUsers) {
      if (ou.token_hash) {
        // 将 token hash 加入黑名单（7天后过期，与 JWT 一致）
        await SysTokenBlacklist.findOrCreate({
          where: { token_hash: ou.token_hash },
          defaults: {
            token_hash: ou.token_hash,
            user_id,
            username: ou.username || '',
            expire_time: new Date(Date.now() + 7 * 86400000)
          }
        });
      }
    }

    // 从在线用户表中移除该用户所有记录
    await SysOnlineUser.destroy({ where: { user_id } });

    res.json({ code: 200, message: '已强制下线' });
  } catch (err) {
    console.error('强制下线失败:', err);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
};

// 清理过期黑名单
async function cleanExpiredBlacklist() {
  const deleted = await SysTokenBlacklist.destroy({ where: { expire_time: { [Op.lt]: new Date() } } });
  if (deleted > 0) console.log(`[黑名单清理] 删除 ${deleted} 条过期黑名单`);
}

exports.cleanExpiredBlacklist = cleanExpiredBlacklist;
