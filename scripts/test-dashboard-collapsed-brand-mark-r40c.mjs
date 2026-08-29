import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dashboard = fs.readFileSync(path.join(root, 'src/components/dashboard/Dashboard.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'src/app/styles/components.css'), 'utf8');
const assetPath = path.join(root, 'public/brand/corvioz-icon-small.svg');

assert.match(dashboard, /<Logo className="dashboard-sidebar-wordmark"/,
  'expanded Corvioz wordmark must remain in the sidebar');
assert.doesNotMatch(dashboard, /dashboard-sidebar-mark[^\n]*aria-hidden="true">C</,
  'temporary collapsed C must be removed');
assert.match(dashboard, /<span className="dashboard-sidebar-mark" aria-label="Corvioz" role="img">\s*<img src="\/brand\/corvioz-icon-small\.svg" alt="" aria-hidden="true" \/>\s*<\/span>/,
  'collapsed sidebar must present the locked small Corvioz mark with an accessible name');
assert.match(dashboard, /data-testid="dashboard-sidebar-collapse"/,
  'existing sidebar collapse control must remain');
assert.match(dashboard, /localStorage\.getItem\(DASHBOARD_SIDEBAR_STORAGE_KEY\)/,
  'existing sidebar collapse persistence must remain');
assert.match(styles, /\.dashboard-sidebar-mark\s*\{[^}]*width:\s*30px;[^}]*height:\s*30px;[^}]*border:\s*1px solid var\(--border(?:,\s*#[0-9a-f]+)?\)[^}]*border-radius:\s*9px/s,
  'collapsed mark container must be 30px with a subtle rounded outline');
assert.match(styles, /\.dashboard-sidebar-mark\s+img\s*\{[^}]*width:\s*18px;[^}]*height:\s*18px;/s,
  'collapsed mark image must render at 18px');
assert.match(styles, /\.dashboard-sidebar-mark:hover\s*\{[^}]*background:\s*#f8fafc;[^}]*border-color:\s*#aeb9c8;/s,
  'collapsed mark hover must only strengthen neutral surface treatment');
const markCss = styles.match(/\.dashboard-sidebar-mark\s*\{[^}]*\}/s)?.[0] || '';
assert.doesNotMatch(markCss, /var\(--primary\)|#4f46e5|#4F46E5|#635bce/i,
  'collapsed mark container must not use saturated brand color');
assert.match(styles, /@media \(max-width: 768px\)[\s\S]*?\.dashboard-sidebar-mark,[\s\S]*?display:\s*none !important;/,
  'mobile sidebar presentation must remain expanded and unchanged');
assert.match(styles, /\.dashboard-sidebar-collapsed \.dashboard-sidebar-label,[\s\S]*?display:\s*none;/,
  'collapsed navigation labels must remain hidden on desktop');

assert.ok(fs.existsSync(assetPath), 'locked small icon must be available locally for Dashboard use');
const assetHash = crypto.createHash('sha256').update(fs.readFileSync(assetPath)).digest('hex');
assert.equal(assetHash, '30651af08c9bdd9b8f719064f90559fb512a443f4d00a59b94f78303f1fe6800',
  'local small icon must be byte-identical to the locked authority asset');

console.log('PASS R40C Dashboard collapsed brand mark contract');
