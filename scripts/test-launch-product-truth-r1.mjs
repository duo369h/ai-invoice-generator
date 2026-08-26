import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const checks = [];

function check(label, condition) {
  checks.push({ label, condition: Boolean(condition) });
  if (!condition) failures.push(label);
}

const pricing = read('src/app/pricing/page.js');
const clientPortal = read('src/app/client-portal/page.js');
const paymentInstructions = read('src/app/payment-instructions/page.js');
const dashboard = read('src/components/dashboard/Dashboard.js');
const dashboardOverview = read('src/app/dashboard/components/DashboardOverview.js');
const profileCard = read('src/app/components/ProfileCardClient.js');
const proposalRoute = read('src/app/proposal/page.js');
const proposalsRoute = read('src/app/proposals/page.js');

check('Pricing binds visible price through vm.price', /const price = vm\.price;/.test(pricing));
check('Pricing binds checkout identity through vm.priceMeta.priceId', /vm\.priceMeta\?\.priceId/.test(pricing));
check('Pricing page does not derive Paddle IDs from environment fields', !/NEXT_PUBLIC_PADDLE_(STARTER|PRO).*PRICE_ID/.test(pricing));

const dashboardTabs = dashboard.match(/const getDashboardTabs[\s\S]*?\n  }, \[\]\);/)?.[0] || '';
const validDashboardTabs = dashboard.match(/const validTabs = \[\s\S]*?\n    \];/)?.[0] || '';
check('Launch dashboard navigation has no Proposal entry', !/(proposal|proposals)/i.test(dashboardTabs + validDashboardTabs));
check('Launch dashboard navigation has no CRM/Leads entry', !/(crm|leads)/i.test(dashboardTabs + validDashboardTabs));
check('Launch dashboard overview has no Proposal demo entry', !/demo\/proposal-preview/i.test(dashboardOverview));

const deferredBrandKit = dashboard.match(/const SHOW_DEFERRED_BRAND_KIT = false;[\s\S]*?Brand Kit & Logo Customization/)?.[0] || '';
check('Unsupported Brand Kit UI is explicitly unreachable', /SHOW_DEFERRED_BRAND_KIT = false/.test(deferredBrandKit));
const businessModeModal = dashboard.match(/showBusinessModeModal[\s\S]*?\n      \{showStudioPreviewModal/)?.[0] || '';
check('Business-mode launch copy does not promise custom branding', !/custom branding/i.test(businessModeModal));
check('Business-mode launch copy does not promise e-signature', !/(signature approvals|e-signature|electronic signature)/i.test(businessModeModal));

check('Client Portal launch copy says client records, not CRM', !/CRM-style|client CRM|CRM pipeline/i.test(clientPortal));
check('Public Profile launch copy says client inquiries, not CRM', !/CRM system|CRM pipeline|Send Inquiry to CRM|active CRM leads/i.test(profileCard));
check('Subscription instructions do not promise custom branding', !/custom branding|custom logo|brand customization/i.test(paymentInstructions));
check('Direct proposal routes are redirect-only deferred routes', /redirect\(['"]\/dashboard\?tool=proposal['"]\)/.test(proposalRoute) && /redirect\(['"]\/dashboard\?tool=proposal['"]\)/.test(proposalsRoute));

for (const result of checks) {
  console.log((result.condition ? 'PASS ' : 'FAIL ') + result.label);
}
console.log('LAUNCH_PRODUCT_TRUTH_GUARD=' + (failures.length === 0 ? 'PASS' : 'FAIL'));
if (failures.length > 0) process.exit(1);
