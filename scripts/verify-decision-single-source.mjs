import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Mock Browser Environment
global.window = {
  localStorage: {
    store: {},
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, val) {
      this.store[key] = String(val);
    },
    removeItem(key) {
      delete this.store[key];
    },
    clear() {
      this.store = {};
    }
  }
};

// 2. Transpile TS to ESM JS
function transpile(tsContent) {
  let js = tsContent;
  // Strip interface block up to the export function declaration to handle nested braces
  js = js.replace(/export interface [\s\S]*?(?=export function)/g, '');
  js = js.replace(/export type [\s\S]*?;/g, '');
  js = js.replace(/:\s*UnifiedDecision\b/g, '');
  js = js.replace(/userId:\s*string\s*\|\s*null/g, 'userId');
  js = js.replace(/userId:\s*string/g, 'userId');
  js = js.replace(/decision:\s*any/g, 'decision');
  js = js.replace(/:\s*void\b/g, '');
  
  // Strip plan union types and primitive type annotations
  js = js.replace(/:\s*(?:['"a-z]+\s*\|\s*)+['"a-z]+/gi, '');
  js = js.replace(/:\s*number/g, '');
  js = js.replace(/:\s*boolean/g, '');
  js = js.replace(/:\s*string/g, '');
  
  js = js.replace(/ as const/g, '');
  
  // Fix imports extension
  js = js.replace(/from\s+'(\.\/.*?)'/g, "from '$1.mjs'");
  js = js.replace(/from\s+'(\.\.\/.*?)'/g, "from '$1.mjs'");
  
  return js;
}

const tmpDir = path.resolve(__dirname, './tmp-decision-test');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

const filesToTranspile = [
  { src: '../lib/execution/unifiedDecisionEngine.ts', dest: './unifiedDecisionEngine.mjs' },
  { src: '../lib/execution/uiTranslator.ts', dest: './uiTranslator.mjs' },
];

for (const file of filesToTranspile) {
  const srcPath = path.resolve(__dirname, file.src);
  const destPath = path.resolve(tmpDir, file.dest);
  const tsContent = fs.readFileSync(srcPath, 'utf8');
  const jsContent = transpile(tsContent);
  console.log(`--- Transpiled ${file.dest} ---`);
  console.log(jsContent);
  fs.writeFileSync(destPath, jsContent, 'utf8');
}

async function runTests() {
  console.log('Running Corvioz Decision Single-Source Verification...');

  const { getUnifiedDecision } = await import('./tmp-decision-test/unifiedDecisionEngine.mjs');
  const { translateDecision } = await import('./tmp-decision-test/uiTranslator.mjs');

  let failed = false;

  const assert = (condition, message) => {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      failed = true;
    } else {
      console.log(`✓ PASS: ${message}`);
    }
  };

  const userId = 'user_audit_1';

  // --- Scenario A: Anonymous User / SSR ---
  window.localStorage.clear();
  const anonDecision = getUnifiedDecision(null);
  assert(anonDecision.recommendedPlan === 'free', 'Anonymous defaults to free plan');
  assert(anonDecision.upgradeSignal.showBanner === false, 'Anonymous upgrade banner is hidden');
  assert(anonDecision.upgradeSignal.showModal === false, 'Anonymous upgrade modal is hidden');

  // --- Scenario B: Starter Plan (Basic creation usage) ---
  window.localStorage.clear();
  window.localStorage.setItem('corvioz_usage_stats', JSON.stringify({ invoicesCount: 1 }));
  const proDecision = getUnifiedDecision(userId);
  assert(proDecision.recommendedPlan === 'starter', 'Usage (invoicesCount > 0) recommends Starter plan');
  assert(proDecision.confidence > 0.15, 'Starter plan confidence matches (>0.15)');
  assert(proDecision.upgradeSignal.showBanner === true, 'Starter plan exposes banner (confidence > 0.25)');
  assert(proDecision.upgradeSignal.showModal === false, 'Starter plan hides modal (confidence <= 0.45)');

  // --- Scenario C: Pro Plan (Repeated usage + exports) ---
  window.localStorage.clear();
  window.localStorage.setItem('corvioz_usage_stats', JSON.stringify({ invoicesCount: 6 }));
  window.localStorage.setItem('corvioz_export_count', '3');
  const growthDecision = getUnifiedDecision(userId);
  assert(growthDecision.recommendedPlan === 'pro', 'Repeated usage (invoices > 5 & exports > 2) recommends Pro plan');
  assert(growthDecision.confidence > 0.45, 'Pro plan confidence matches (>0.45)');
  assert(growthDecision.upgradeSignal.showBanner === true, 'Pro plan exposes banner');
  assert(growthDecision.upgradeSignal.showModal === true, 'Pro plan exposes modal (low churn risk)');

  // --- Scenario D: Studio Plan (Portal usage) ---
  window.localStorage.clear();
  window.localStorage.setItem('corvioz_usage_stats', JSON.stringify({ invoicesCount: 2 }));
  window.localStorage.setItem('corvioz_client_portal_views', '6');
  const studioDecision = getUnifiedDecision(userId);
  assert(studioDecision.recommendedPlan === 'studio', 'Client portal heavy usage (>5) recommends Studio plan');
  assert(studioDecision.upgradeSignal.showModal === true, 'Studio plan exposes modal');

  // --- Scenario E: Churn Risk Blocking ---
  window.localStorage.clear();
  // Zero documents created -> high churn risk
  window.localStorage.setItem('corvioz_selected_plan', 'pro');
  window.localStorage.setItem('corvioz_pricing_view_count', '5'); // Triggers Starter plan on confidence
  const churnDecision = getUnifiedDecision(userId);
  assert(churnDecision.recommendedPlan === 'starter', 'Pricing viewed recommends Starter plan');
  assert(churnDecision.riskSignal.churnRisk === 0.75, 'Zero creation activity causes high churn risk (0.75)');
  assert(churnDecision.riskSignal.isChurnBlocked === true, 'High churn risk blocks monetization exposure');
  assert(churnDecision.upgradeSignal.showModal === false, 'Upgrade modal is blocked under high churn risk');

  // --- Test UI Translator Mapping (Pure Mapper) ---
  const mapped = translateDecision(churnDecision);
  assert(mapped.banner === 'starter', 'Translator maps active banner to recommendedPlan');
  assert(mapped.modal === null, 'Translator maps showModal=false to modal=null');
  assert(mapped.highlightPlan === 'starter', 'Translator maps highlightPlan to recommendedPlan');
  assert(mapped.disabled === true, 'Translator maps disabled to isChurnBlocked');

  // --- Static Verifications on View Layer ---
  console.log('Running static audits on components for decision logic leakage...');
  const pricingViewModelCode = fs.readFileSync(path.resolve(__dirname, '../src/core/pricing/pricingViewModel.ts'), 'utf8');
  const dashboardCode = fs.readFileSync(path.resolve(__dirname, '../src/components/dashboard/Dashboard.js'), 'utf8');

  // Ensure no local conditionals on usage count exist in the view layer
  const forbiddenPatterns = [
    /invoicesCount\s*>\s*\d/,
    /invoice_count\s*>\s*\d/,
    /export_actions\s*>\s*\d/,
    /client_portal_usage\s*>\s*/,
    /clientPortalViews\s*>\s*/,
  ];

  for (const pattern of forbiddenPatterns) {
    assert(!pattern.test(pricingViewModelCode), `Pricing View Model has zero local usage conditional: ${pattern}`);
  }

  // Dashboard component should render read-only insights without calculations
  const forbiddenDashboardRules = [
    /confidence\s*>\s*25/,
    /churn_risk\s*>\s*0.7/,
  ];
  for (const pattern of forbiddenDashboardRules) {
    // Exclude comments/docs
    const filteredLines = dashboardCode.split('\n').filter(line => 
      pattern.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*')
    );
    assert(filteredLines.length === 0, `Dashboard component has zero local rule evaluations: ${pattern}`);
  }

  // Cleanup temp files
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}

  if (failed) {
    console.error('❌ Corvioz Decision Single-Source Verification FAILED.');
    process.exit(1);
  } else {
    console.log('✅ Corvioz Decision Single-Source Verification PASSED.');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error(err);
  try {
    const tmpDir = path.resolve(__dirname, './tmp-decision-test');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}
  process.exit(1);
});
