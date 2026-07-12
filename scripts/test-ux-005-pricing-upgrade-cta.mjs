import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const pricingPage = read('src/app/pricing/page.js');
const dashboard = read('src/components/dashboard/Dashboard.js');
const upgradeModal = read('src/components/ui/UpgradeModal.js');

assert.match(
  dashboard,
  /modalProps,\s*\n\s*setModalProps,/,
  'Dashboard must obtain setModalProps from useRevenueAction before invoking it.'
);
assert.match(
  pricingPage,
  /const \[selectedUpgradePlan, setSelectedUpgradePlan\] = useState\(null\);/,
  'Pricing must keep the selected upgrade plan in local modal state.'
);
assert.match(
  pricingPage,
  /setSelectedUpgradePlan\(vm\.id\);/,
  'Choosing a paid plan must open the selected plan modal.'
);
assert.match(
  pricingPage,
  /<UpgradeModal[\s\S]*?isOpen=\{Boolean\(selectedUpgradePlan\)\}[\s\S]*?targetPlan=\{selectedUpgradePlan \|\| 'pro'\}/,
  'Pricing must render the upgrade modal for the selected plan.'
);
assert.match(
  upgradeModal,
  /\/checkout\?plan=\$\{targetPlan\}&intent=high/,
  'The upgrade modal must continue into the existing checkout flow.'
);

console.log('UX-005 pricing upgrade CTA regression check passed.');
