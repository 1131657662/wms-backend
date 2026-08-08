const fs = require('fs');
const path = require('path');

const appPath = path.resolve(__dirname, '..', 'app.js');
const source = fs.readFileSync(appPath, 'utf8');
const backupRoot = path.resolve(__dirname, '..', 'services', 'backup');
const backupSource = fs.readdirSync(backupRoot)
  .filter(name => name.endsWith('.js') && !name.endsWith('.test.js'))
  .map(name => fs.readFileSync(path.join(backupRoot, name), 'utf8'))
  .concat(fs.readFileSync(path.resolve(__dirname, '..', 'controllers', 'backup.js'), 'utf8'))
  .join('\n');
const backupRoutes = fs.readFileSync(path.resolve(__dirname, '..', 'routes', 'backup.js'), 'utf8');
const scheduledTaskRoutes = fs.readFileSync(path.resolve(__dirname, '..', 'routes', 'scheduled_task.js'), 'utf8');
const requirements = [
  ['loopback default host', /const HOST = process\.env\.HOST \|\| ['"]127\.0\.0\.1['"]/],
  ['listen uses explicit host', /app\.listen\(PORT,\s*HOST\s*,/],
  ['5xx logs retain diagnostics', /console\.error\(\s*['"]\[wms\] internal error['"],\s*errorContext,\s*err\s*\)/],
  ['expected errors omit stack noise', /console\.warn\(\s*['"]\[wms\] request rejected['"],\s*errorContext\s*\)/],
  ['backup disables tablespace metadata', /--no-tablespaces/],
  ['backup child processes disable shell', /shell:\s*false/],
  ['backup streams output to disk', /createWriteStream/],
  ['backup web restore is explicit in production', /WMS_ALLOW_WEB_RESTORE/],
];

const missing = requirements
  .filter(([name, pattern]) => !pattern.test(name.startsWith('backup ') ? backupSource : source))
  .map(([name]) => name);

if (/\bexecSync\b/.test(backupSource)) missing.push('backup must not use execSync');
if (!/router\.use\(auth,\s*requireAdmin\)/.test(backupRoutes)) missing.push('backup routes require admin');
if (!/router\.use\(auth,\s*requireAdmin\)/.test(scheduledTaskRoutes)) missing.push('scheduled task routes require admin');

if (missing.length > 0) {
  console.error(`Production hardening check failed: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Production hardening check passed.');
