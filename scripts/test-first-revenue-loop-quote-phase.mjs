import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isFirstRevenueTrackedResource,
  canTransitionFirstRevenueQuote,
  resolveFirstRevenueLoop,
} from "../src/core/revenue/firstRevenueLoop.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migrationPath = path.join(root, "supabase/migration-first-revenue-loops.sql");
const anchorLoop = { quote_id: "quote-1", invoice_id: null, legacy_blocked_at: null };

assert.equal(
  resolveFirstRevenueLoop({ plan: "free" }).canCreateQuote,
  true,
  "a new free user may claim one first quote"
);

assert.equal(
  resolveFirstRevenueLoop({
    plan: "free",
    loop: anchorLoop,
    quote: { id: "quote-1", status: "draft" },
  }).canCreateQuote,
  false,
  "an anchored free user cannot create another quote"
);

assert.deepEqual(
  canTransitionFirstRevenueQuote({
    plan: "free",
    loop: anchorLoop,
    quote: { id: "quote-1", status: "draft" },
    requestedStatus: "sent",
  }),
  { allowed: true, reason: null },
  "a free anchor quote may transition from draft to sent"
);

assert.equal(
  canTransitionFirstRevenueQuote({
    plan: "free",
    loop: anchorLoop,
    quote: { id: "quote-1", status: "sent" },
    requestedStatus: "approved",
  }).allowed,
  false,
  "a freelancer cannot self-approve the free anchor quote"
);

assert.equal(
  canTransitionFirstRevenueQuote({
    plan: "free",
    loop: { ...anchorLoop, legacy_blocked_at: "2026-07-10T00:00:00.000Z" },
    quote: { id: "quote-1", status: "draft" },
    requestedStatus: "sent",
  }).allowed,
  false,
  "a historical free user cannot use the first revenue exception"
);

assert.equal(
  canTransitionFirstRevenueQuote({
    plan: "pro",
    loop: null,
    quote: { id: "quote-2", status: "sent" },
    requestedStatus: "approved",
  }).allowed,
  true,
  "paid plan behavior remains outside the free allowance restriction"
);

assert.equal(
  isFirstRevenueTrackedResource({
    loop: anchorLoop,
    quote: { id: "quote-1", status: "sent" },
    resourceType: "quote",
    resourceId: "quote-1",
  }),
  true,
  "the anchor quote is recognized as a tracked first revenue loop resource"
);

assert.equal(
  isFirstRevenueTrackedResource({
    loop: anchorLoop,
    quote: { id: "quote-1", status: "sent" },
    resourceType: "invoice",
    resourceId: "invoice-1",
  }),
  false,
  "unclaimed invoice is not recognized as tracked"
);

const migration = fs.readFileSync(migrationPath, "utf8");
assert.ok(
  migration.includes("CREATE OR REPLACE FUNCTION public.create_first_revenue_quote"),
  "the migration must create the quote and its anchor in one transaction"
);
assert.ok(
  migration.includes("GRANT EXECUTE ON FUNCTION public.create_first_revenue_quote"),
  "the atomic quote creation RPC must remain service-role-only"
);
assert.ok(
  migration.includes("REVOKE INSERT, UPDATE, DELETE ON TABLE public.quotes FROM authenticated"),
  "direct browser quote writes must not bypass the atomic free-user claim"
);
assert.ok(
  migration.includes("FOR UPDATE"),
  "the atomic quote claim must lock the per-user loop row under concurrency"
);

console.log("First revenue loop quote enforcement tests passed.");
