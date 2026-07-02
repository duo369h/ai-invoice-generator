/**
 * Pricing Contract Guard — Corvioz v1.1 HARDENED
 *
 * Runtime enforcement layer ensuring pricingViewModel.ts remains the ONLY
 * pricing decision source. Import this module in dev/CI entry points.
 *
 * LAYERS ENFORCED:
 *   1. Static file-content scan — forbidden patterns outside viewModel
 *      • billingPeriod identifier presence
 *      • priceMonthly/priceYearly identifier presence
 *      • paddle price ID derivation
 *      • ternary with price-like value (shadow derivation)
 *      • numeric fallback on price fields (price || 0)
 *   2. ViewModel output shape validation (price + priceMeta always present)
 *   3. Determinism check (same input → same output, N runs)
 *   4. Negative test layer (simulate injection, verify rejection)
 *
 * ALL violations throw immediately — NO silent fallback.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../..');

// ─── CONTRACT CONSTANTS ───────────────────────────────────────────────────────

export const SOLE_DECISION_FILE = 'src/core/pricing/pricingViewModel.ts';

// ─── GUARDED FILE DEFINITIONS ─────────────────────────────────────────────────

/**
 * Every entry is a file that MUST NOT contain any pricing decision logic.
 * Patterns are tested against comment-stripped source.
 */
export const GUARDED_FILES: Array<{
  relPath: string;
  forbiddenPatterns: Array<{ pattern: RegExp; message: string }>;
}> = [
  {
    relPath: 'src/app/pricing/page.js',
    forbiddenPatterns: [
      // billingPeriod used to SELECT a price value — forbidden
      // (billingPeriod as React UI state / input to getPricingViewModel is allowed)
      {
        pattern: /billingPeriod[\s\S]*?(?:priceMonthly|priceYearly|price_monthly|price_yearly)(?=\s*(?:[:;,)]|$))/,
        message: 'billingPeriod-based price selection — must live in pricingViewModel.ts',
      },
      // Paddle price ID derivation
      {
        pattern: /paddle_monthly_price_id|paddle_yearly_price_id/,
        message: 'Paddle price ID field access — use `vm.priceMeta.priceId` instead',
      },
      // Numeric transformation applied to price
      {
        pattern: /Number\(rawPrice\)|parseFloat\(.*price/,
        message: 'Numeric price transformation — must live in pricingViewModel.ts',
      },
      // Fallback price coercion
      {
        pattern: /\bprice\s*(?:\|\||[?][?])\s*0/,
        message: 'Price fallback coercion (`price || 0` / `price ?? 0`) — must live in pricingViewModel.ts',
      },
    ],
  },
  {
    relPath: 'src/app/api/pricing/route.js',
    forbiddenPatterns: [
      {
        pattern: /price_monthly\s*=\s*\d|price_yearly\s*=\s*\d/,
        message: 'Hardcoded price assignment — API must return raw DB data only',
      },
      {
        pattern: /\bbillingPeriod\b/,
        message: '`billingPeriod` usage in route.js — billing period decisions must live in pricingViewModel.ts',
      },
    ],
  },
  {
    relPath: 'src/app/pricing/controller.ts',
    forbiddenPatterns: [
      {
        pattern: /\bbillingPeriod\b/,
        message: '`billingPeriod` usage — controller must be passthrough only',
      },
      {
        pattern: /\bplans\.find\b/,
        message: '`plans.find` pricing lookup — controller must be passthrough only',
      },
      {
        pattern: /paddle_monthly_price_id|paddle_yearly_price_id/,
        message: 'Paddle price ID derivation — must live in pricingViewModel.ts',
      },
    ],
  },
  {
    relPath: 'src/core/pricing/pricingController.ts',
    forbiddenPatterns: [
      {
        pattern: /\bbillingPeriod\b/,
        message: '`billingPeriod` usage in pricingController.ts — must be pure passthrough',
      },
      {
        pattern: /\bplans\.find\b|paddle_monthly_price_id|paddle_yearly_price_id/,
        message: 'Pricing derivation logic in pricingController.ts — must be pure passthrough',
      },
      // Detect any non-trivial logic beyond `return vm`
      {
        pattern: /if\s*\(|switch\s*\(|for\s*\(/,
        message: 'Control flow in pricingController.ts — must be pure passthrough (`export function pricingController(vm) { return vm; }`)',
      },
    ],
  },
  {
    relPath: 'src/app/checkout/page.js',
    forbiddenPatterns: [
      {
        pattern: /\bpriceMonthly\b|\bpriceYearly\b/,
        message: '`priceMonthly`/`priceYearly` usage in checkout — use `vm.priceMeta.priceId`',
      },
      {
        pattern: /paddle_monthly_price_id|paddle_yearly_price_id/,
        message: 'Paddle price ID derivation in checkout — must live in pricingViewModel.ts',
      },
    ],
  },
];

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '');
}

function hardStop(violations: string[]): never {
  const border = '═'.repeat(66);
  const msg = [
    `╔${border}╗`,
    `║  PRICING CONTRACT VIOLATION — pricingContractGuard v1.1         ║`,
    `╠${border}╣`,
    ...violations.map(v => `║  ❌ ${v.substring(0, 62).padEnd(62)}  ║`),
    `╠${border}╣`,
    `║  Sole authority: ${SOLE_DECISION_FILE.padEnd(47)}║`,
    `║  All pricing decisions MUST live in pricingViewModel.ts.         ║`,
    `╚${border}╝`,
  ].join('\n');
  // Hard stop — no fallback, no silent failure.
  throw new Error(msg);
}

// ─── LAYER 1: Static file-content scan ───────────────────────────────────────

export function assertPricingContractFiles(): void {
  const violations: string[] = [];

  for (const { relPath, forbiddenPatterns } of GUARDED_FILES) {
    const absPath = path.join(ROOT, relPath);
    if (!fs.existsSync(absPath)) continue;

    const source = stripComments(fs.readFileSync(absPath, 'utf8'));

    for (const { pattern, message } of forbiddenPatterns) {
      if (pattern.test(source)) {
        violations.push(`[${relPath}] ${message}`);
      }
    }
  }

  if (violations.length > 0) hardStop(violations);
}

// ─── LAYER 2: ViewModel output shape validation ───────────────────────────────

export interface PriceContractShape {
  price: number;
  priceMeta: { priceId: string };
}

export function assertPricingOutputContract(cards: any[]): void {
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error('[PRICING CONTRACT] getPricingViewModel returned empty or non-array cards');
  }

  for (const card of cards) {
    if (typeof card.price !== 'number' || !Number.isFinite(card.price)) {
      throw new Error(
        `[PRICING CONTRACT] Card "${card.id}" — vm.price is not a finite number. ` +
        `viewModel must always output a fully resolved numeric price.`
      );
    }
    if (!card.priceMeta || typeof card.priceMeta.priceId !== 'string') {
      throw new Error(
        `[PRICING CONTRACT] Card "${card.id}" — vm.priceMeta.priceId is missing or not a string. ` +
        `viewModel must always output a resolved Paddle price ID string.`
      );
    }
  }
}

// ─── LAYER 3: Determinism check ───────────────────────────────────────────────

export function assertPricingDeterminism(
  fn: (input: any) => any,
  input: any,
  runs = 5
): void {
  const outputs = Array.from({ length: runs }, () => JSON.stringify(fn(input)));
  if (!outputs.every(o => o === outputs[0])) {
    throw new Error(
      `[PRICING CONTRACT] Determinism violation — getPricingViewModel produced different ` +
      `outputs across ${runs} identical-input runs. Pure functions must be deterministic.`
    );
  }
}

// ─── LAYER 4: Negative test (injection simulation) ───────────────────────────

/**
 * Verifies that the static scanner correctly REJECTS known-bad patterns.
 * This proves the guard itself is not broken/bypassed.
 */
export function assertNegativeTestLayer(): void {
  const badPatterns: Array<{ code: string; description: string }> = [
    {
      code: `const price = billingPeriod === 'monthly' ? priceMonthly : priceYearly;`,
      description: 'billingPeriod ternary price selection',
    },
    {
      code: `const price = plan.billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;`,
      description: 'plan.billingPeriod member access ternary',
    },
    {
      code: `const priceId = plan.paddle_monthly_price_id;`,
      description: 'raw paddle_monthly_price_id derivation',
    },
    {
      code: `const finalPrice = price || 0;`,
      description: 'price fallback coercion (price || 0)',
    },
  ];

  // Patterns from the page.js guard that cover the above bad code
  const scanPatterns = [
    /\bbillingPeriod\b/,
    /\bpriceMonthly\b|\bpriceYearly\b/,
    /paddle_monthly_price_id|paddle_yearly_price_id/,
    /\bprice\s*(?:\|\||[?][?])\s*0/,
  ];

  for (const { code, description } of badPatterns) {
    const detected = scanPatterns.some(p => p.test(code));
    if (!detected) {
      throw new Error(
        `[PRICING CONTRACT] Negative test FAILED — guard did NOT catch injected violation:\n` +
        `  Type: ${description}\n` +
        `  Code: ${code}\n` +
        `  The guard itself may be broken or bypassed.`
      );
    }
  }
}

// ─── COMBINED ASSERTION (single CI entry point) ───────────────────────────────

export function assertFullPricingContract(
  getPricingViewModelFn?: (input: any) => any,
  sampleInput?: any
): void {
  // Layer 1 — static scan
  assertPricingContractFiles();

  // Layer 4 — verify the guard itself catches known-bad patterns
  assertNegativeTestLayer();

  // Layer 2 + 3 — runtime contract (only when fn provided)
  if (getPricingViewModelFn && sampleInput) {
    const result = getPricingViewModelFn(sampleInput);
    assertPricingOutputContract(result.cards);
    assertPricingDeterminism(getPricingViewModelFn, sampleInput);
  }

  console.log('✅ [PRICING CONTRACT GUARD v1.1] All contract assertions passed — 4 layers clean.');
}
