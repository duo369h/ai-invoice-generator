import assert from 'node:assert/strict';
import fs from 'node:fs';

const dashboardPath = 'src/components/dashboard/Dashboard.js';
const dashboard = fs.readFileSync(dashboardPath, 'utf8');

const tabsStart = dashboard.indexOf('const getDashboardTabs =');
const tabsEnd = dashboard.indexOf('const handleDashboardTabChange =', tabsStart);
assert.notEqual(tabsStart, -1, 'Dashboard tab definition must remain present');
assert.notEqual(tabsEnd, -1, 'Dashboard tab handler must remain present');
const tabsSource = dashboard.slice(tabsStart, tabsEnd);

const tabIds = [...tabsSource.matchAll(/\{ id: '([^']+)', label:/g)].map((match) => match[1]);
assert.deepEqual(
  tabIds,
  ['overview', 'quotes', 'invoices', 'clients', 'profile'],
  'Primary navigation order must remain Overview, Quotes, Invoices, Clients, Public Profile',
);
assert.match(tabsSource, /\{ id: 'profile', label: 'Public Profile', sectionBefore: true \}/);

const navStart = dashboard.indexOf('<nav className="dashboard-sidebar-nav"');
const navEnd = dashboard.indexOf('</nav>', navStart);
assert.notEqual(navStart, -1, 'Dashboard sidebar navigation must remain present');
assert.notEqual(navEnd, -1, 'Dashboard sidebar navigation must remain closed');
const navSource = dashboard.slice(navStart, navEnd);

assert.doesNotMatch(navSource, /Settings|sidebar_settings/, 'Misleading standalone Settings navigation must be removed');
assert.doesNotMatch(dashboard, /handleDashboardTabChange\('profile',\s*['"]sidebar_settings['"]\)/);
assert.doesNotMatch(dashboard, /(?:href|router\.(?:push|replace))\s*\(?['"`]\/settings\b/);
assert.equal(fs.existsSync('src/app/settings'), false, 'S3 must not introduce a /settings route');

assert.match(navSource, /aria-label=\{tab\.label\}/, 'Primary navigation controls must retain accessible names');
assert.equal((navSource.match(/label: 'Public Profile'/g) || []).length, 0, 'Sidebar must not add a second profile label outside the canonical tab list');

assert.match(dashboard, /aria-label="Account"/);
assert.match(dashboard, /aria-haspopup="menu"/);
assert.match(dashboard, /aria-expanded=\{accountMenuOpen\}/);
assert.match(dashboard, /\{accountMenuOpen && session\?\.user\?\.email &&/);
assert.match(dashboard, /role="menu"/);
assert.match(dashboard, /const handleSignOut = async \(\) =>/);
assert.match(dashboard, /onClick=\{\(\) => \{\s*handleSignOut\(\);/);
assert.match(dashboard, /<Link href="\/auth"[\s\S]*?>\s*Sign in\s*<\/Link>/);

assert.match(dashboard, /if \(invoiceFlowLocked && activeTab === 'invoices' && invoiceView !== 'list'/);
assert.doesNotMatch(navSource, /fetch\s*\(/, 'S3 navigation cleanup must not introduce navigation fetches');

console.log('R56E-S3 NAVIGATION ACCOUNT TRUTH TEST=PASS');
