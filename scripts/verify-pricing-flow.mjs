import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Setup Mock Unified Decision Engine
global.mockDecision = {
  recommendedPlan: 'free',
  confidence: 0.8,
  upgradeSignal: { showBanner: false, showModal: false, highlightPlan: null },
  riskSignal: { churnRisk: 'low', abuseRisk: 'low', riskLevel: 'low', recommendation: 'allow' },
  reason: 'Normal usage.'
};

// 2. Transpile TS to ESM JS
function transpile(tsContent) {
  let js = tsContent;
  js = js.replace(/export interface [\s\S]*?\n\}/g, '');
  js = js.replace(/export type [\s\S]*?;/g, '');
  js = js.replace(/userPlan\?\s*:\s*string\s*\|\s*null/g, 'userPlan = null');
  js = js.replace(/plan\?\s*:\s*string\s*\|\s*null/g, 'plan = null');
  js = js.replace(/:\s*PricingViewModelInput/g, '');
  js = js.replace(/:\s*Promise<.*?>\s*\{/g, ' {');
  js = js.replace(/:\s*PricingViewModelOutput\s*\{/g, ' {');
  js = js.replace(/:\s*Entitlements\s*\{/g, ' {');
  js = js.replace(/:\s*boolean\s*\{/g, ' {');
  js = js.replace(/:\s*string\s*\[\s*\]/g, '');
  js = js.replace(/:\s*string/g, '');
  js = js.replace(/:\s*number/g, '');
  js = js.replace(/:\s*boolean/g, '');
  js = js.replace(/:\s*any/g, '');
  js = js.replace(/\s+as\s+any/g, '');
  js = js.replace(/\s+as\s+const/g, '');
  js = js.replace(/\s+as\s+keyof\s+Entitlements/g, '');
  js = js.replace(/as const;/g, ';');
  js = js.replace(/from\s+'(\.\/.*?)'/g, "from '$1.mjs'");
  js = js.replace(/from\s+'(\.\.\/.*?)'/g, "from '$1.mjs'");
  js = js.replace(/from\s+'\.\.\/execution\/unifiedDecisionEngine\.mjs'/g, "from './unifiedDecisionEngine.mjs'");
  js = js.replace(/from\s+'\.\.\/execution\/uiTranslator\.mjs'/g, "from './uiTranslator.mjs'");
  return js;
}

const tmpDir = path.resolve(__dirname, './tmp-pricing-test');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

// Mock unifiedDecisionEngine and uiTranslator imports in pricingViewModel
fs.writeFileSync(
  path.resolve(tmpDir, './unifiedDecisionEngine.mjs'),
  `export function getUnifiedDecision() { return global.mockDecision; }`,
  'utf8'
);
fs.writeFileSync(
  path.resolve(tmpDir, './uiTranslator.mjs'),
  `export function translateDecision() { return { highlightPlan: null, banner: 'none' }; }`,
  'utf8'
);

const tsContent = fs.readFileSync(path.resolve(__dirname, '../lib/pricing/pricingViewModel.ts'), 'utf8');
const jsContent = transpile(tsContent);
fs.writeFileSync(path.resolve(tmpDir, './pricingViewModel.mjs'), jsContent, 'utf8');

const entitlementsTs = fs.readFileSync(path.resolve(__dirname, '../lib/entitlements.ts'), 'utf8');
const entitlementsJs = transpile(entitlementsTs);
fs.writeFileSync(path.resolve(tmpDir, './entitlements.mjs'), entitlementsJs, 'utf8');

async function runTests() {
  console.log('Running Corvioz Pricing Flow & Entitlements Verification...');

  const { getPricingViewModel } = await import('./tmp-pricing-test/pricingViewModel.mjs');
  const { getUserEntitlements } = await import('./tmp-pricing-test/entitlements.mjs');

  const plans = [
    { id: 'free', name: 'Free', price_monthly: 0, price_yearly: 0 },
    { id: 'pro', name: 'Starter', price_monthly: 9, price_yearly: 7 },
    { id: 'growth', name: 'Pro', price_monthly: 19, price_yearly: 15 },
    { id: 'studio', name: 'Client Growth Pack', price_monthly: 29, price_yearly: 24 }
  ];

  const vm = getPricingViewModel({
    plans,
    session: null,
    userPlan: 'free',
    isAuthenticated: false,
    subLoading: false
  });

  const cards = vm.cards;
  assert(cards.length === 4, 'Should map exactly 4 plans');

  const freeCard = cards.find(c => c.id === 'free');
  assert(freeCard.name === 'Free', 'Free tier name');
  assert(freeCard.identity === 'Try', 'Free tier identity');

  const proCard = cards.find(c => c.id === 'pro');
  assert(proCard.name === 'Starter', 'Starter tier name');
  assert(proCard.identity === 'Starter', 'Starter tier identity');
  assert(proCard.outcome === 'Get paid faster', 'Starter tier outcome');
  assert(proCard.features.includes('Auto-fill client details on future documents'), 'Starter has auto-fill details');

  const growthCard = cards.find(c => c.id === 'growth');
  assert(growthCard.name === 'Pro', 'Pro tier name');
  assert(growthCard.identity === 'Pro', 'Pro tier identity');
  assert(growthCard.outcome === 'Never miss a payment', 'Pro tier outcome');
  assert(growthCard.features.includes('Qualify and capture prospective client inquiries'), 'Pro has lead capture');

  const studioCard = cards.find(c => c.id === 'studio');
  assert(studioCard.name === 'Client Growth Pack', 'Studio tier name');
  assert(studioCard.identity === 'Agency', 'Studio tier identity');
  assert(studioCard.outcome === 'Scale client operations', 'Studio tier outcome');

  // Verify entitlements mapping
  const proEnt = getUserEntitlements('pro');
  assert(proEnt.export_pdf === false, 'Starter plan has export PDF disabled');

  const growthEnt = getUserEntitlements('growth');
  assert(growthEnt.export_pdf === true, 'Pro plan has export PDF enabled');

  console.log('✅ Corvioz Pricing Flow & Entitlements Verification PASSED.');
  
  // Cleanup
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}
}

runTests().catch(err => {
  console.error('❌ Pricing Flow test failed:', err);
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}
  process.exit(1);
});
