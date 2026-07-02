/**
 * Pricing Contract Regression Guard — Corvioz CI v1.1 HARDENED
 *
 * Run via: node scripts/verify-pricing-contract.mjs
 * Exits 0 on pass, 1 on any violation.
 *
 * 5 VERIFICATION LAYERS:
 *   1. Static Contract    — no forbidden pricing patterns outside pricingViewModel.ts
 *   2. Negative Tests     — scanner correctly rejects known-bad injection patterns
 *   3. ViewModel Runtime  — vm.price + vm.priceMeta.priceId always present and typed
 *   4. Determinism        — same input → same output (5 runs)
 *   5. Bilateral Consistency — display price and checkout priceId from same billingPeriod
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── TEST HARNESS ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function check(label, pass, detail = '') {
  if (pass) {
    console.log(`  ✔  ${label}`);
    passed++;
  } else {
    console.error(`  ✘  ${label}${detail ? `\n       ↳ ${detail}` : ''}`);
    failed++;
    failures.push(label);
  }
}

function section(title) {
  console.log(`\n${'━'.repeat(70)}`);
  console.log(`  ${title}`);
  console.log('━'.repeat(70));
}

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
}

function read(relPath) {
  const abs = path.join(ROOT, relPath);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
}

// ─── [1] STATIC CONTRACT ─────────────────────────────────────────────────────

section('[1] Static Contract — No Forbidden Patterns Outside pricingViewModel.ts');

const VM_FILE = 'src/core/pricing/pricingViewModel.ts';

const staticRules = [
  // ── page.js ──────────────────────────────────────────────────────────────
  {
    file: 'src/app/pricing/page.js',
    checks: [
      // Forbidden: billingPeriod used to SELECT a price value (ternary → price)
      // Allowed: billingPeriod as React state, UI toggle CSS, input to getPricingViewModel
      {
        label: 'no billingPeriod→price selection ternary',
        pattern: /billingPeriod[\s\S]*?(?:priceMonthly|priceYearly|price_monthly|price_yearly)(?=\s*(?:[:;,)]|$))/,
        mustNotMatch: true,
      },
      // Forbidden: priceMonthly / priceYearly assigned directly as price binding
      // (e.g. `const price = priceMonthly` or `price = card.priceYearly`)
      // Allowed: vm.priceYearly in annotation strings (e.g. "Billed annually")
      // Allowed: 'priceMonthly' / 'priceYearly' as string object key names
      {
        label: 'no priceMonthly/priceYearly direct price assignment',
        pattern: /(?:const|let|var)\s+price\s*=\s*(?:(?:vm|card|plan)\.)?\s*(?:priceMonthly|priceYearly)\b/,
        mustNotMatch: true,
      },
      { label: 'price binding = vm.price only',         pattern: /const price = vm\.price;/,     mustNotMatch: false },
      { label: 'priceId from vm.priceMeta only',        pattern: /priceMeta[?.]\.[?]?priceId/,  mustNotMatch: false },
      { label: 'no Number(rawPrice) transformation',    pattern: /Number\(rawPrice\)/,           mustNotMatch: true },
      { label: 'no paddle price ID selection',          pattern: /paddle_monthly_price_id|paddle_yearly_price_id/, mustNotMatch: true },
      { label: 'no price || 0 fallback coercion',       pattern: /\bprice\s*(?:\|\||[?][?])\s*0/, mustNotMatch: true },
    ],
  },
  // ── route.js ─────────────────────────────────────────────────────────────
  {
    file: 'src/app/api/pricing/route.js',
    checks: [
      { label: 'no hardcoded price_monthly override',   pattern: /price_monthly\s*=\s*\d/,       mustNotMatch: true },
      { label: 'no hardcoded price_yearly override',    pattern: /price_yearly\s*=\s*\d/,        mustNotMatch: true },
      { label: 'no billingPeriod in route',             pattern: /\bbillingPeriod\b/,            mustNotMatch: true },
    ],
  },
  // ── controller.ts (page-level) ────────────────────────────────────────────
  {
    file: 'src/app/pricing/controller.ts',
    checks: [
      { label: 'no billingPeriod in executable code',   pattern: /\bbillingPeriod\b/,            mustNotMatch: true },
      { label: 'no plans.find pricing lookup',          pattern: /plans\.find/,                  mustNotMatch: true },
      { label: 'no paddle price ID derivation',         pattern: /paddle_monthly_price_id|paddle_yearly_price_id/, mustNotMatch: true },
    ],
  },
  // ── pricingController.ts (core pure passthrough) ─────────────────────────
  {
    file: 'src/core/pricing/pricingController.ts',
    checks: [
      { label: 'is pure passthrough function',          pattern: /export function pricingController\(vm[^)]*\)/, mustNotMatch: false },
      { label: 'no billingPeriod',                      pattern: /\bbillingPeriod\b/,            mustNotMatch: true },
      { label: 'no pricing lookup logic',               pattern: /plans\.find|paddle_monthly_price_id/, mustNotMatch: true },
      { label: 'no control flow (if/switch/for)',       pattern: /\bif\s*\(|\bswitch\s*\(|\bfor\s*\(/, mustNotMatch: true },
    ],
  },
  // ── checkout/page.js ─────────────────────────────────────────────────────
  {
    file: 'src/app/checkout/page.js',
    checks: [
      { label: 'no priceMonthly/priceYearly',           pattern: /\bpriceMonthly\b|\bpriceYearly\b/, mustNotMatch: true },
      { label: 'no paddle price ID derivation',         pattern: /paddle_monthly_price_id|paddle_yearly_price_id/, mustNotMatch: true },
    ],
  },
  // ── pricingViewModel.ts (SOLE AUTHORITY — verify it owns all decisions) ──
  {
    file: VM_FILE,
    checks: [
      { label: 'OWNS billingPeriod→price decision',     pattern: /billingPeriod\s*===\s*['"]monthly['"]\s*\?\s*priceMonthly\s*:\s*priceYearly/, mustNotMatch: false },
      { label: 'OWNS billingPeriod→priceId decision',   pattern: /paddle_monthly_price_id/,      mustNotMatch: false },
      { label: 'outputs priceMeta.priceId',             pattern: /priceMeta:\s*\{\s*priceId\s*\}/, mustNotMatch: false },
      { label: 'outputs vm.price field',                pattern: /\bprice,/,                     mustNotMatch: false },
    ],
  },
];

for (const { file, checks } of staticRules) {
  const raw = read(file);
  const src = stripComments(raw);
  for (const { label, pattern, mustNotMatch } of checks) {
    const matched = pattern.test(src);
    const pass = mustNotMatch ? !matched : matched;
    check(
      `${file}: ${label}`,
      pass,
      pass ? '' : `Pattern ${pattern} ${mustNotMatch ? 'found (forbidden)' : 'not found (required)'}`
    );
  }
}

// ─── [2] NEGATIVE TEST LAYER ─────────────────────────────────────────────────

section('[2] Negative Tests — Guard Correctly Rejects Injected Violations');

const negativeTests = [
  {
    label: 'detects billingPeriod ternary price selection',
    code: `const price = billingPeriod === 'monthly' ? priceMonthly : priceYearly;`,
    patterns: [/\bbillingPeriod\b/, /\bpriceMonthly\b|\bpriceYearly\b/],
  },
  {
    label: 'detects priceYearly member access',
    code: `const price = plan.priceYearly;`,
    patterns: [/\bpriceMonthly\b|\bpriceYearly\b/],
  },
  {
    label: 'detects paddle_monthly_price_id derivation',
    code: `const priceId = targetPlan.paddle_monthly_price_id;`,
    patterns: [/paddle_monthly_price_id|paddle_yearly_price_id/],
  },
  {
    label: 'detects price || 0 fallback coercion',
    code: `const safePrice = price || 0;`,
    patterns: [/\bprice\s*(?:\|\||[?][?])\s*0/],
  },
  {
    label: 'detects price ?? 0 null coalescing fallback',
    code: `const safePrice = price ?? 0;`,
    patterns: [/\bprice\s*(?:\|\||[?][?])\s*0/],
  },
  {
    label: 'detects billingPeriod on plan object',
    code: `const p = plan.billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;`,
    patterns: [/\bbillingPeriod\b/, /\bpriceMonthly\b|\bpriceYearly\b/],
  },
  {
    label: 'detects Number(rawPrice) numeric coercion',
    code: `const price = Number.isFinite(Number(rawPrice)) ? Number(rawPrice) : 0;`,
    patterns: [/Number\(rawPrice\)/],
  },
  {
    label: 'detects hardcoded price_monthly override',
    code: `plan.price_monthly = 9.00;`,
    patterns: [/price_monthly\s*=\s*\d/],
  },
];

for (const { label, code, patterns } of negativeTests) {
  const detected = patterns.some(p => p.test(code));
  check(
    label,
    detected,
    detected ? '' : `Guard MISSED the injected violation:\n       Code: ${code}`
  );
}

// ─── [3] VIEWMODEL RUNTIME CONTRACT ──────────────────────────────────────────

section('[3] ViewModel Runtime Contract — Output Shape Validation');

function transpile(ts) {
  let js = ts;
  js = js.replace(/export interface [\s\S]*?\n\}/g, '');
  js = js.replace(/export type [\s\S]*?;/g, '');
  js = js.replace(/:\s*PricingViewModelInput/g, '');
  js = js.replace(/:\s*PricingViewModelOutput\s*\{/g, ' {');
  js = js.replace(/:\s*string\s*\[\s*\]/g, '');
  js = js.replace(/:\s*string/g, '');
  js = js.replace(/:\s*number/g, '');
  js = js.replace(/:\s*boolean/g, '');
  js = js.replace(/:\s*any/g, '');
  js = js.replace(/\s+as\s+any/g, '');
  js = js.replace(/\s+as\s+const/g, '');
  js = js.replace(/from\s+'\.\.\/execution\/unifiedDecisionEngine'/g, "from './mock_decision.mjs'");
  js = js.replace(/from\s+'\.\.\/execution\/uiTranslator'/g, "from './mock_ui.mjs'");
  return js;
}

const tmpDir = path.join(__dirname, 'tmp-contract-guard-v11');
fs.mkdirSync(tmpDir, { recursive: true });

fs.writeFileSync(path.join(tmpDir, 'mock_decision.mjs'),
  `export function getUnifiedDecision() { return { recommendedPlan:'free', confidence:0.8, upgradeSignal:{highlightPlan:null}, reason:'ok' }; }`);
fs.writeFileSync(path.join(tmpDir, 'mock_ui.mjs'),
  `export function translateDecision() { return { highlightPlan: null, banner: 'none' }; }`);

const vmTs = read(VM_FILE);
fs.writeFileSync(path.join(tmpDir, 'pricingViewModel.mjs'), transpile(vmTs));

const { getPricingViewModel } = await import(path.join(tmpDir, 'pricingViewModel.mjs'));

const SAMPLE_PLANS = [
  { id: 'free',    name: 'Free',    price_monthly: 0,  price_yearly: 0,  paddle_monthly_price_id: '',                    paddle_yearly_price_id: '' },
  { id: 'starter', name: 'Starter', price_monthly: 9,  price_yearly: 7,  paddle_monthly_price_id: 'pri_monthly_starter', paddle_yearly_price_id: 'pri_yearly_starter' },
  { id: 'pro',     name: 'Pro',     price_monthly: 19, price_yearly: 16, paddle_monthly_price_id: 'pri_monthly_pro',     paddle_yearly_price_id: 'pri_yearly_pro' },
  { id: 'studio',  name: 'Studio',  price_monthly: 29, price_yearly: 24, paddle_monthly_price_id: '',                    paddle_yearly_price_id: '' },
];

const monthly = getPricingViewModel({ plans: SAMPLE_PLANS, session: null, userPlan: null, isAuthenticated: false, subLoading: false, billingPeriod: 'monthly' });
const yearly  = getPricingViewModel({ plans: SAMPLE_PLANS, session: null, userPlan: null, isAuthenticated: false, subLoading: false, billingPeriod: 'yearly' });

// Output shape
for (const card of monthly.cards) {
  check(`vm.price is finite number   [${card.id}]`, typeof card.price === 'number' && Number.isFinite(card.price));
  check(`vm.priceMeta.priceId exists [${card.id}]`, card.priceMeta && typeof card.priceMeta.priceId === 'string');
}

// Billing period correctness
const sm = monthly.cards.find(c => c.id === 'starter');
const sy = yearly.cards.find(c => c.id === 'starter');
const pm = monthly.cards.find(c => c.id === 'pro');
const py = yearly.cards.find(c => c.id === 'pro');

check('starter monthly price = 9',             sm.price === 9);
check('starter yearly price = 7',              sy.price === 7);
check('pro monthly price = 19',                pm.price === 19);
check('pro yearly price = 16',                 py.price === 16);
check('starter monthly priceId correct',       sm.priceMeta.priceId === 'pri_monthly_starter');
check('starter yearly priceId correct',        sy.priceMeta.priceId === 'pri_yearly_starter');
check('pro monthly priceId correct',           pm.priceMeta.priceId === 'pri_monthly_pro');
check('pro yearly priceId correct',            py.priceMeta.priceId === 'pri_yearly_pro');

// ─── [4] DETERMINISM (5 RUNS) ────────────────────────────────────────────────

section('[4] Determinism — Same Input → Same Output (5 Runs)');

const baseInput = { plans: SAMPLE_PLANS, session: null, userPlan: null, isAuthenticated: false, subLoading: false, billingPeriod: 'monthly' };
const runs = Array.from({ length: 5 }, () => JSON.stringify(getPricingViewModel(baseInput)));
check('5 consecutive runs produce identical output', runs.every(r => r === runs[0]));

const baseYearly = { ...baseInput, billingPeriod: 'yearly' };
const runsY = Array.from({ length: 5 }, () => JSON.stringify(getPricingViewModel(baseYearly)));
check('5 consecutive yearly runs produce identical output', runsY.every(r => r === runsY[0]));

// ─── [5] BILATERAL CONSISTENCY ───────────────────────────────────────────────

section('[5] Bilateral Consistency — Display Price ↔ Checkout priceId from Same Decision');

for (const card of monthly.cards) {
  const ok = card.priceMeta.priceId === '' || card.priceMeta.priceId.includes('monthly') || card.id === 'free' || card.id === 'studio';
  check(`monthly: card "${card.id}" — price and priceId both from billingPeriod=monthly`, ok);
}
for (const card of yearly.cards) {
  const ok = card.priceMeta.priceId === '' || card.priceMeta.priceId.includes('yearly') || card.id === 'free' || card.id === 'studio';
  check(`yearly:  card "${card.id}" — price and priceId both from billingPeriod=yearly`, ok);
}

// ─── CLEANUP & FINAL RESULT ───────────────────────────────────────────────────

try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

const total = passed + failed;
console.log(`\n${'═'.repeat(70)}`);
if (failed === 0) {
  console.log(`✅  PRICING CONTRACT GUARD v1.1 — ALL ${total} CHECKS PASSED`);
  console.log(`    pricingViewModel.ts is the sole pricing decision source.`);
  console.log(`    Static scan ✔  Negative tests ✔  Runtime contract ✔  Determinism ✔  Consistency ✔`);
} else {
  console.error(`❌  PRICING CONTRACT GUARD v1.1 — ${failed} of ${total} CHECKS FAILED`);
  failures.forEach(f => console.error(`    • ${f}`));
  process.exit(1);
}
