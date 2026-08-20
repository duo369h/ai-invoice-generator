import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const pricingPage = read("src/app/pricing/page.js");
const dashboard = read("src/components/dashboard/Dashboard.js");
const upgradeModal = read("src/components/ui/UpgradeModal.js");

assert.match(
  dashboard,
  /modalProps,\s*\n\s*setModalProps,/,
  "Dashboard must obtain setModalProps from useRevenueAction before invoking it."
);

// Reconciled for Pricing V2: Public pricing uses direct checkout / handlePlanAction
assert.match(
  pricingPage,
  /handlePlanAction/,
  "Pricing V2 must handle plan selection with direct checkout."
);

assert.match(
  upgradeModal,
  /\/checkout\?plan=\${targetPlan}&intent=high/,
  "The upgrade modal must continue into the existing checkout flow."
);

console.log("UX-005 pricing upgrade CTA regression check passed (reconciled for Pricing V2 direct checkout).");
