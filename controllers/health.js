const os = require('os');
const sequelize = require('../config/database');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { rethrowIfHttpErrorOrSequelize } = require('../utils/httpError');

exports.status = async (req, res) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsage = ((totalMem - freeMem) / totalMem * 100).toFixed(1);
    const cpuLoad = os.loadavg()[0].toFixed(2);
    const cpuCount = os.cpus().length;
    const uptime = Math.floor(os.uptime());

    // 数据库连接检查
    let dbStatus = '正常';
    let dbResponseMs = 0;
    try {
      const start = Date.now();
      await sequelize.query('SELECT 1');
      dbResponseMs = Date.now() - start;
    } catch { dbStatus = '异常'; }

    // 磁盘信息（Windows 兼容）
    let diskInfo = { total: 0, free: 0, usedPercent: 0 };
    try {
      const { execSync } = require('child_process');
      if (process.platform === 'win32') {
        const result = execSync('wmic logicaldisk get size,freespace,caption', { timeout: 5000 }).toString();
        const lines = result.trim().split('\n').filter(l => l.trim());
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].trim().split(/\s+/);
          if (parts.length >= 3) {
            diskInfo.free = parseInt(parts[1]) || 0;
            diskInfo.total = parseInt(parts[2]) || 0;
            diskInfo.usedPercent = diskInfo.total > 0 ? ((diskInfo.total - diskInfo.free) / diskInfo.total * 100).toFixed(1) : 0;
            break;
          }
        }
      } else {
        // Linux: df -B1 / 获取根分区
        const result = execSync('df -B1 /', { timeout: 5000 }).toString();
        const lines = result.trim().split('\n');
        if (lines.length >= 2) {
          const parts = lines[1].trim().split(/\s+/);
          diskInfo.total = parseInt(parts[1]) || 0;
          diskInfo.free = parseInt(parts[3]) || 0;
          diskInfo.usedPercent = diskInfo.total > 0 ? ((diskInfo.total - diskInfo.free) / diskInfo.total * 100).toFixed(1) : 0;
        }
      }
    } catch { /* ignore disk info errors */ }

    return sendSuccess(res, {
        server: {
          platform: os.platform(),
          hostname: os.hostname(),
          uptime,
          uptimeStr: formatUptime(uptime),
          nodeVersion: process.version
        },
        memory: {
          total: (totalMem / 1024 / 1024 / 1024).toFixed(1) + ' GB',
          free: (freeMem / 1024 / 1024 / 1024).toFixed(1) + ' GB',
          usedPercent: memUsage + '%'
        },
        cpu: {
          load1: cpuLoad,
          load5: os.loadavg()[1].toFixed(2),
          load15: os.loadavg()[2].toFixed(2),
          count: cpuCount
        },
        db: {
          status: dbStatus,
          responseMs: dbResponseMs
        },
        disk: diskInfo.total > 0 ? {
          total: (diskInfo.total / 1024 / 1024 / 1024).toFixed(1) + ' GB',
          free: (diskInfo.free / 1024 / 1024 / 1024).toFixed(1) + ' GB',
          usedPercent: diskInfo.usedPercent + '%'
        } : null
    });
  } catch (err) {
    rethrowIfHttpErrorOrSequelize(err);
    console.error('健康检查失败:', err);
    return sendError(res, 500, '服务器内部错误');
  }
};

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(d + '天');
  if (h > 0) parts.push(h + '小时');
  parts.push(m + '分钟');
  return parts.join(' ');
}
