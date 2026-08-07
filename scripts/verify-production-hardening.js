const fs = require('fs');
const path = require('path');

const appPath = path.resolve(__dirname, '..', 'app.js');
const source = fs.readFileSync(appPath, 'utf8');
const requirements = [
  ['loopback default host', /const HOST = process\.env\.HOST \|\| ['"]127\.0\.0\.1['"]/],
  ['listen uses explicit host', /app\.listen\(PORT,\s*HOST\s*,/],
  ['5xx logs retain diagnostics', /console\.error\(\s*['"]\[wms\] internal error['"],\s*errorContext,\s*err\s*\)/],
  ['expected errors omit stack noise', /console\.warn\(\s*['"]\[wms\] request rejected['"],\s*errorContext\s*\)/],
];

const missing = requirements
  .filter(([, pattern]) => !pattern.test(source))
  .map(([name]) => name);

if (missing.length > 0) {
  console.error(`Production hardening check failed: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Production hardening check passed.');
