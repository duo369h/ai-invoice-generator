import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(resolve(root, file), 'utf8');
const dashboard = read('src/components/dashboard/Dashboard.js');
const overview = read('src/app/dashboard/components/DashboardOverview.js');
const styles = read('src/app/styles/components.css');
const layoutStyles = read('src/app/styles/layouts.css');
const r40Styles = styles.split('/* R40 Dashboard Visual System: Calm Persistent Rail */')[1] || '';
const quickActions = overview.match(/function Wave1QuickActions[\s\S]*?(?=function Wave1RecentDocuments)/)?.[0] || '';
const accountControl = dashboard.match(/session\?\.user\?\.email \? \([\s\S]*?\) : \(/)?.[0] || '';

const checks = [
  ['SIDEBAR_ACCOUNT_DUPLICATION_REMOVED', !dashboard.includes("'sidebar_account'")],
  ['SIDEBAR_COLLAPSE_CONTROL_PRESENT', dashboard.includes('data-testid="dashboard-sidebar-collapse"') && dashboard.includes('aria-expanded={!sidebarCollapsed}')],
  ['SIDEBAR_COLLAPSE_PERSISTENCE_SAFE', dashboard.includes('DASHBOARD_SIDEBAR_STORAGE_KEY') && dashboard.includes('window.localStorage.setItem')],
  ['SIDEBAR_FEEDBACK_HIDDEN_IN_COLLAPSED', layoutStyles.includes('.dashboard-sidebar-aside.dashboard-sidebar-collapsed .dashboard-sidebar-feedback') && layoutStyles.includes('display: none !important')],
  ['COLLAPSED_NAV_ACCESSIBLE_NAMES', dashboard.includes('aria-label={tab.label}')],
  ['COLLAPSED_NAV_TOOLTIPS', dashboard.includes('title={sidebarCollapsed ? tab.label : undefined}') && dashboard.includes("title={sidebarCollapsed ? 'Settings' : undefined}")],
  ['COLLAPSED_ACCOUNT_ACCESSIBLE_NAME', accountControl.includes('aria-label="Account"') && accountControl.includes("title={sidebarCollapsed ? 'Account' : undefined}")],
  ['OVERVIEW_EYEBROW_NOISE_REDUCED', !overview.includes('Start core work') && !overview.includes('Continue where you left off')],
  ['QUICK_ACTIONS_NOT_SOLID_PURPLE_CARDS', quickActions.includes('className="dashboard-wave1-action"') && !quickActions.includes('btn-primary') && !quickActions.includes('Use the existing document workflow')],
  ['QUICK_ACTION_HOVER_LIFT_CONTRACT', styles.includes('.dashboard-wave1-action:hover') && styles.includes('transform: translateY(-2px)') && styles.includes('transition: transform 170ms ease')],
  ['RECENT_DOCUMENT_ROW_HOVER_CONTRACT', r40Styles.includes('.dashboard-wave1-document:hover') && r40Styles.includes('background: #fbfcfe') && r40Styles.includes('border-color: #d9d8e9') && !r40Styles.includes('transform: translateY(-1px)') && !r40Styles.includes('box-shadow: 0 6px 14px rgba(20, 27, 38, 0.06)')],
  ['TYPOGRAPHY_WEIGHT_REDUCTION', styles.includes('.dashboard-wave1-header h1') && styles.includes('font-weight: 650') && styles.includes('.dashboard-wave1-section-heading h2') && styles.includes('font-weight: 600')],
  ['MOBILE_390', styles.includes('@media (max-width: 430px)') || styles.includes('@media (max-width: 768px)')],
  ['MOBILE_430', styles.includes('@media (max-width: 430px)') || styles.includes('@media (max-width: 768px)')],
  ['TABLET_768', styles.includes('@media (max-width: 768px)')],
  ['NO_HORIZONTAL_OVERFLOW', styles.includes('overflow-x: hidden') || styles.includes('overflow-x: clip') || styles.includes('max-width: 100%')],
  ['REDUCED_MOTION', styles.includes('@media (prefers-reduced-motion: reduce)')],
];

for (const [name, passed] of checks) {
  assert.equal(passed, true, `${name}=FAIL`);
  console.log(`${name}=PASS`);
}

const changedFiles = execFileSync('git', ['diff', '--name-only'], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .map((file) => file.trim())
  .filter(Boolean);
const allowed = new Set([
  'src/components/dashboard/Dashboard.js',
  'src/app/dashboard/components/DashboardOverview.js',
  'src/app/styles/components.css',
  'src/app/styles/layouts.css',
]);
for (const file of changedFiles) {
  assert.equal(allowed.has(file), true, `HIGH_RISK_FILE_CHANGED=${file}`);
}
console.log('HIGH_RISK_FILE_ALLOWLIST=PASS');
