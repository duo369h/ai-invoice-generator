import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';
import * as ts from 'typescript';

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
  let js = ts.transpileModule(tsContent, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  js = js.replace(/from\s+'(\.\/.*?)'/g, "from '$1.mjs'");
  js = js.replace(/from\s+'(\.\.\/.*?)'/g, "from '$1.mjs'");
  js = js.replace(/from\s+'\.\.\/execution\/unifiedDecisionEngine\.mjs'/g, "from './unifiedDecisionEngine.mjs'");
  js = js.replace(/from\s+'\.\.\/execution\/uiTranslator\.mjs'/g, "from './uiTranslator.mjs'");
  js = js.replace(/from\s+'\.\.\/src\/core\/state\/planStateAdapter\.mjs'/g, "from './planStateAdapter.mjs'");
  js = js.replace(/from\s+'\.\.\/src\/core\/telemetry\/decisionTelemetry\.mjs'/g, "from './decisionTelemetry.mjs'");
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
fs.writeFileSync(
  path.resolve(tmpDir, './planStateAdapter.mjs'),
  `export function shadowValidatePlanRead() { return null; }`,
  'utf8'
);
fs.writeFileSync(
  path.resolve(tmpDir, './decisionTelemetry.mjs'),
  `export function recordDecisionTelemetry() { return null; }`,
  'utf8'
);

const tsContent = fs.readFileSync(path.resolve(__dirname, '../src/core/pricing/pricingViewModel.ts'), 'utf8');
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
    {
      id: 'free',
      name: 'Free',
      description: 'For trying Corvioz with the client work you already have.',
      price_monthly: 0,
      price_yearly: 0,
      features: ['Quotes and invoices', '5 new documents each cycle', 'PDF exports with Corvioz branding'],
    },
    {
      id: 'starter',
      name: 'Starter',
      description: 'For regular client work, with more room and clean documents.',
      price_monthly: 9,
      price_yearly: 90,
      features: ['Quotes and invoices', '30 new documents each billing cycle', 'Clean PDF exports'],
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For unlimited work and a client experience that lives in Corvioz too.',
      price_monthly: 19,
      price_yearly: 190,
      features: ['Everything in Starter', 'Unlimited new documents', 'Client Portal with client approval'],
    },
    {
      id: 'studio',
      name: 'Studio',
      status: 'coming_soon',
      active: false,
      description: 'Future roadmap tier',
      price_monthly: null,
      price_yearly: null,
      features: [],
    },
  ];

  const vm = getPricingViewModel({
    plans,
    session: null,
    userPlan: 'free',
    isAuthenticated: false,
    subLoading: false
    ,billingPeriod: 'monthly'
  });

  const cards = vm.cards;
  assert(cards.length === 4, 'Should map exactly 4 plans');

  const freeCard = cards.find(c => c.id === 'free');
  assert(freeCard.name === 'Free', 'Free tier name');
  assert(freeCard.identity === 'Free', 'Free tier identity');
  assert(freeCard.outcome === 'For trying Corvioz with the client work you already have.', 'Free tier outcome');
  assert(freeCard.features.includes('5 new documents each cycle'), 'Free tier document quota');

  const starterCard = cards.find(c => c.id === 'starter');
  assert(starterCard.name === 'Starter', 'Starter tier name');
  assert(starterCard.identity === 'Starter', 'Starter tier identity');
  assert(starterCard.outcome === 'For regular client work, with more room and clean documents.', 'Starter tier outcome');
  assert(starterCard.features.includes('30 new documents each billing cycle'), 'Starter has current document quota');
  assert(starterCard.features.includes('Clean PDF exports'), 'Starter has clean PDFs');

  const proCard = cards.find(c => c.id === 'pro');
  assert(proCard.name === 'Pro', 'Pro tier name');
  assert(proCard.identity === 'Pro', 'Pro tier identity');
  assert(proCard.outcome === 'For unlimited work and a client experience that lives in Corvioz too.', 'Pro tier outcome');
  assert(proCard.features.includes('Unlimited new documents'), 'Pro has unlimited new documents');
  assert(proCard.features.includes('Client Portal with client approval'), 'Pro has client approval');

  const studioCard = cards.find(c => c.id === 'studio');
  assert(studioCard.name === 'Studio', 'Studio tier name');
  assert(studioCard.identity === 'Studio', 'Studio tier identity');
  assert(studioCard.outcome === 'Future roadmap tier', 'Studio tier outcome');
  assert(studioCard.priceMonthly === 0, 'Studio has no monthly purchase price');

  // Verify entitlements mapping
  const starterEnt = getUserEntitlements('starter');
  assert(starterEnt.export_pdf === true, 'Starter plan has clean PDF export');
  assert(starterEnt.approval_scope === 'none', 'Starter has no quote approval');

  const proEnt = getUserEntitlements('pro');
  assert(proEnt.export_pdf === true, 'Pro plan has export PDF enabled');
  assert(proEnt.approval_scope === 'quotes_only', 'Pro approval is quote-only');

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
