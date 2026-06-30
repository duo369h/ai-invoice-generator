/**
 * Corvioz v5.1 Plan State Adapter
 *
 * Compatibility layer only. Existing plan sources remain intact.
 * This adapter normalizes reads and exposes shadow comparison helpers
 * without changing production callers.
 */

import { recordPlanStateDrift } from "../telemetry/planStateDrift";

export type CanonicalPlan = "free" | "starter" | "pro" | "studio";
export type LegacyPlan = "growth" | "agency" | "professional";
export type PlanSource =
  | "explicit"
  | "server_profile"
  | "entitlement"
  | "legacy_local_storage"
  | "user_scoped_local_storage"
  | "legacy_session_storage"
  | "selected_plan_intent"
  | "default";

export type StorageLike = Pick<Storage, "getItem">;

export type PlanStateInput = {
  userId?: string | null;
  explicitPlan?: unknown;
  serverPlan?: unknown;
  entitlementPlan?: unknown;
  localStorage?: StorageLike | null;
  sessionStorage?: StorageLike | null;
  defaultPlan?: CanonicalPlan;
};

export type PlanStateCandidate = Readonly<{
  source: PlanSource;
  key?: string;
  raw: unknown;
  normalized: CanonicalPlan | null;
}>;

export type PlanState = Readonly<{
  plan: CanonicalPlan;
  rawPlan: unknown;
  source: PlanSource;
  key?: string;
  userId?: string | null;
  candidates: readonly PlanStateCandidate[];
  legacyCompatible: boolean;
}>;

export type PlanShadowValidation = Readonly<{
  label: string;
  legacySource: string;
  adapterSource: PlanSource;
  legacyResult: unknown;
  adapterResult: CanonicalPlan;
  identical: boolean;
  equal: boolean;
  mismatchReason: string | null;
  source: PlanSource;
  key?: string;
}>;

const DEFAULT_PLAN: CanonicalPlan = "free";
const CANONICAL_PLANS = new Set(["free", "starter", "pro", "studio"]);
const LEGACY_PLAN_ALIASES: Record<string, CanonicalPlan> = {
  growth: "pro",
  agency: "studio",
  professional: "pro",
};

function canUseWindowStorage(kind: "localStorage" | "sessionStorage"): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window[kind] ?? null;
  } catch (_) {
    return null;
  }
}

function safeGet(storage: StorageLike | null | undefined, key: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch (_) {
    return null;
  }
}

export function normalizePlan(value: unknown, fallback: CanonicalPlan | null = null): CanonicalPlan | null {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return fallback;
  if (CANONICAL_PLANS.has(raw)) return raw as CanonicalPlan;
  return LEGACY_PLAN_ALIASES[raw] ?? fallback;
}

export function getPlanStorageKeys(userId?: string | null): string[] {
  return [
    ...(userId ? [`corvioz_user_plan_${userId}`] : []),
    "corvioz_user_plan",
    "corvioz_selected_plan",
  ];
}

export function resolvePlanState(input: PlanStateInput = {}): PlanState {
  const defaultPlan = input.defaultPlan ?? DEFAULT_PLAN;
  const local = input.localStorage ?? canUseWindowStorage("localStorage");
  const session = input.sessionStorage ?? canUseWindowStorage("sessionStorage");
  const userId = input.userId ?? null;

  const candidates: PlanStateCandidate[] = [
    {
      source: "explicit",
      raw: input.explicitPlan,
      normalized: normalizePlan(input.explicitPlan),
    },
    {
      source: "server_profile",
      raw: input.serverPlan,
      normalized: normalizePlan(input.serverPlan),
    },
    {
      source: "entitlement",
      raw: input.entitlementPlan,
      normalized: normalizePlan(input.entitlementPlan),
    },
  ];

  if (userId) {
    const key = `corvioz_user_plan_${userId}`;
    const raw = safeGet(local, key);
    candidates.push({
      source: "user_scoped_local_storage",
      key,
      raw,
      normalized: normalizePlan(raw),
    });
  }

  const legacyLocalKey = "corvioz_user_plan";
  const legacyLocal = safeGet(local, legacyLocalKey);
  candidates.push({
    source: "legacy_local_storage",
    key: legacyLocalKey,
    raw: legacyLocal,
    normalized: normalizePlan(legacyLocal),
  });

  const selectedPlan = safeGet(local, "corvioz_selected_plan") ?? safeGet(session, "corvioz_selected_plan");
  candidates.push({
    source: "selected_plan_intent",
    key: "corvioz_selected_plan",
    raw: selectedPlan,
    normalized: normalizePlan(selectedPlan),
  });

  const sessionPlan = safeGet(session, "corvioz_user_plan");
  candidates.push({
    source: "legacy_session_storage",
    key: "corvioz_user_plan",
    raw: sessionPlan,
    normalized: normalizePlan(sessionPlan),
  });

  const winner = candidates.find((candidate) => candidate.normalized);

  return {
    plan: winner?.normalized ?? defaultPlan,
    rawPlan: winner?.raw ?? defaultPlan,
    source: winner?.source ?? "default",
    key: winner?.key,
    userId,
    candidates,
    legacyCompatible: true,
  };
}

export function getCurrentPlan(input: Omit<PlanStateInput, "userId"> = {}): CanonicalPlan {
  return resolvePlanState(input).plan;
}

export function getCurrentPlanForUser(userId?: string | null, input: Omit<PlanStateInput, "userId"> = {}): CanonicalPlan {
  return resolvePlanState({ ...input, userId }).plan;
}

export function shadowValidatePlanRead(
  label: string,
  legacyResult: unknown,
  input: PlanStateInput = {},
  legacySource = "legacy",
  logger: Pick<Console, "info"> | null = console,
): PlanShadowValidation {
  const resolved = resolvePlanState(input);
  const legacyNormalized = normalizePlan(legacyResult, DEFAULT_PLAN);
  const equal = legacyNormalized === resolved.plan;
  const result = {
    label,
    legacySource,
    adapterSource: resolved.source,
    legacyResult,
    adapterResult: resolved.plan,
    identical: equal,
    equal,
    mismatchReason: equal
      ? null
      : `legacy normalized to ${legacyNormalized}; adapter resolved ${resolved.plan} from ${resolved.source}`,
    source: resolved.source,
    key: resolved.key,
  };

  recordPlanStateDrift({
    source: label,
    selectedPlan: input.explicitPlan,
    userPlan: legacyResult,
    subscriptionPlan: input.serverPlan ?? input.entitlementPlan,
    billingState: resolved.plan,
  });

  if (logger && typeof logger.info === "function") {
    logger.info("[plan-state-shadow]", result);
  }

  return result;
}
