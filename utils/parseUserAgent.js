'use strict';

/**
 * 轻量 UA 解析（不引入额外依赖）
 * @param {string} [ua]
 * @returns {{ os: string; browser: string }}
 */
function parseUserAgent(ua) {
  const s = String(ua || '');
  let os = '未知';
  let browser = '未知';

  if (/Windows NT 10/.test(s)) os = 'Windows 10/11';
  else if (/Windows NT 6\.3/.test(s)) os = 'Windows 8.1';
  else if (/Windows NT 6/.test(s)) os = 'Windows';
  else if (/Mac OS X/.test(s)) os = 'macOS';
  else if (/Android/.test(s)) os = 'Android';
  else if (/iPhone|iPad|iPod/.test(s)) os = 'iOS';
  else if (/Linux/.test(s)) os = 'Linux';

  if (/Edg\//.test(s)) browser = 'Edge';
  else if (/Chrome\//.test(s) && !/Edg\//.test(s)) browser = 'Chrome';
  else if (/Firefox\//.test(s)) browser = 'Firefox';
  else if (/Safari\//.test(s) && !/Chrome\//.test(s)) browser = 'Safari';
  else if (/MSIE |Trident\//.test(s)) browser = 'IE';

  return { os, browser };
}

module.exports = { parseUserAgent };
