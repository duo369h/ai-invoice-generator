import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { getSystemView } from "../src/core/orchestrator/CORVIOZ_INTERPRETATION_ENGINE.ts";
import { getNextRoute } from "../src/core/orchestrator/CORVIOZ_ORCHESTRATOR.ts";
import { getRevenueIntelligence } from "../src/core/revenue/REVENUE_INTELLIGENCE_ENGINE.ts";
import { adaptRevenueToUI } from "../src/core/revenue/REVENUE_ADAPTER_LAYER.ts";
import { runArchitectureGuard } from "../src/archived/governance/REVENUE_ARCHITECTURE_GUARD.ts";
import { enforceUIGraphOnly } from "../src/core/ui/UI_GRAPH_ENFORCER.ts";
import { getDashboardUI } from "../src/core/ui/GET_DASHBOARD_UI.ts";

const failedModules: string[] = [];

function fail(moduleName: "ENTRY" | "REVENUE" | "MONETIZATION" | "DASHBOARD" | "ARCHITECTURE", reason: string) {
  console.error(`[FAIL] ${moduleName}: ${reason}`);
  if (!failedModules.includes(moduleName)) failedModules.push(moduleName);
}

function readCode(relPath: string): string | null {
  const abs = path.resolve(__dirname, "..", relPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, "utf-8");
}

function codeOnly(content: string): string {
  return content
    .split("\n")
    .filter(l => !l.trimStart().startsWith("//") && !l.trimStart().startsWith("*") && !l.trimStart().startsWith("/*"))
    .join("\n");
}

const ROOT = path.resolve(__dirname, "..");

// ─────────────────────────────────────────────────────────────────────────────
// 1️⃣ SCHEMA VALIDATION & TYPE SAFETY — getSystemView structure
// ─────────────────────────────────────────────────────────────────────────────
try {
  const view = getSystemView({ entry_state: "AUTHENTICATED" });
  if (view.route !== "/proposal/create") {
    fail("ENTRY", `ROUTE INVALID: expected '/proposal/create', got '${view.route}'`);
  }
  const ru = view.uiHints?.revenueUI;
  if (!ru) {
    fail("DASHBOARD", "MISSING uiHints.revenueUI");
  } else {
    if (!ru.badge?.label)      fail("DASHBOARD", "uiHints.revenueUI.badge.label missing");
    if (!ru.cta?.label)        fail("DASHBOARD", "uiHints.revenueUI.cta.label missing");
    if (!ru.insight?.headline) fail("DASHBOARD", "uiHints.revenueUI.insight.headline missing");
    if (!ru.pricingTag?.price) fail("DASHBOARD", "uiHints.revenueUI.pricingTag.price missing");
    if (typeof ru.semanticScore !== "number") {
      fail("DASHBOARD", "uiHints.revenueUI.semanticScore missing");
    }
  }

  const cold = getSystemView({});
  if (cold.route !== "/demo/proposal-preview") {
    fail("ENTRY", `COLD START ROUTE INVALID: got '${cold.route}'`);
  }

  const kill = getSystemView({ killSwitchActive: true });
  if (kill.route !== "/dashboard/activation") {
    fail("ENTRY", "KILL SWITCH NOT RESPECTED");
  }
} catch (err) {
  fail("ENTRY", `Interpretation Engine validation failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2️⃣ TYPE SAFETY & CORRECTNESS — Revenue Intelligence Engine
// ─────────────────────────────────────────────────────────────────────────────
try {
  const validStrategies = ["ACQUIRE", "CONVERT", "MONETIZE", "EXPAND"];
  const validBottlenecks = ["TRAFFIC", "CONVERSION", "PAYMENT", "RETENTION", "NONE"];
  const validPrices = ["$9", "$19", "$29"];

  const intel = getRevenueIntelligence({});
  if (!validStrategies.includes(intel.revenueStrategy))  fail("REVENUE", `STRATEGY INVALID: '${intel.revenueStrategy}'`);
  if (!validBottlenecks.includes(intel.funnelBottleneck)) fail("REVENUE", `BOTTLENECK INVALID: '${intel.funnelBottleneck}'`);
  if (!validPrices.includes(intel.pricingSuggestion))    fail("REVENUE", `PRICING INVALID: '${intel.pricingSuggestion}'`);
  if (typeof intel.revenueProbability !== "number")      fail("REVENUE", "revenueProbability must be a number");
} catch (err) {
  fail("REVENUE", `Revenue Intelligence type correctness check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3️⃣ ADAPTER EXISTENCE & BASIC COMPLIANCE
// ─────────────────────────────────────────────────────────────────────────────
try {
  const intel = getRevenueIntelligence({});
  const ui = adaptRevenueToUI(intel);
  if (!ui.cta || !ui.badge || !ui.insight || !ui.pricingTag) {
    fail("ARCHITECTURE", "Adapter output is missing required structure");
  }
} catch (err) {
  fail("ARCHITECTURE", `Adapter compliance check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4️⃣ FORBIDDEN IMPORTS & KERNEL ISOLATION — Static scan
// ─────────────────────────────────────────────────────────────────────────────
try {
  const violations = runArchitectureGuard(ROOT);
  for (const v of violations) {
    fail("ARCHITECTURE", `[${v.severity}] ${v.file} — ${v.rule} (evidence: "${v.evidence}")`);
  }
} catch (err) {
  fail("ARCHITECTURE", `Architecture Guard scan failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5️⃣ UI GRAPH ISOLATION (v6)
// ─────────────────────────────────────────────────────────────────────────────
try {
  const dashboardFile = "src/app/dashboard/components/DashboardOverview.js";
  const raw = readCode(dashboardFile);
  if (raw) {
    const code = codeOnly(raw);
    if (code.toLowerCase().includes("systemview")) {
      fail("ARCHITECTURE", "UI layer must not reference systemView in DashboardOverview.js");
    }
    if (code.toLowerCase().includes("orchestrator")) {
      fail("ARCHITECTURE", "UI layer must not reference orchestrator in DashboardOverview.js");
    }
    if (code.toLowerCase().includes("kernel")) {
      fail("ARCHITECTURE", "UI layer must not reference kernel in DashboardOverview.js");
    }
    if (!code.includes("getDashboardUI")) {
      fail("ARCHITECTURE", "UI layer must consume GET_DASHBOARD_UI");
    }
    const uiGraphViolations = enforceUIGraphOnly(ROOT);
    for (const violation of uiGraphViolations) {
      fail("ARCHITECTURE", `${violation.rule}: ${violation.file} contains "${violation.evidence}"`);
    }
  }
} catch (err) {
  fail("ARCHITECTURE", `UI graph isolation check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6️⃣ UI PIPELINE DECOMPOSITION (v6.3)
// ─────────────────────────────────────────────────────────────────────────────
try {
  const composerFile = "src/core/ui/pipeline/UI_GRAPH_COMPOSER.ts";
  const composerRaw = readCode(composerFile);
  if (composerRaw) {
    const code = codeOnly(composerRaw);
    if (code.includes(".filter(") || code.includes(".reduce(")) {
      fail("ARCHITECTURE", "UI_GRAPH_COMPOSER must not contain .filter( or .reduce(");
    }
    if (code.includes("due_date") || code.includes("new Date()")) {
      fail("ARCHITECTURE", "UI_GRAPH_COMPOSER must not calculate overdue invoices inline");
    }
    if (code.includes("wonProposals") || code.includes("decidedProposals")) {
      fail("ARCHITECTURE", "UI_GRAPH_COMPOSER must not compute winRate inline");
    }
  }

  const aggregatorFile = "src/core/ui/pipeline/UI_DATA_AGGREGATOR.ts";
  const aggregatorRaw = readCode(aggregatorFile);
  if (aggregatorRaw) {
    const code = codeOnly(aggregatorRaw);
    if (code.includes("/") || code.includes("score") || code.includes("rank") || code.includes("filter") || code.includes("reduce")) {
      fail("ARCHITECTURE", "UI_DATA_AGGREGATOR must not perform derivations (ratios, scores, ranks, filtering, reductions)");
    }
  }
} catch (err) {
  fail("ARCHITECTURE", `UI pipeline decomposition check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7️⃣ UI RUNTIME DECISION ENGINE (v6.4)
// ─────────────────────────────────────────────────────────────────────────────
try {

  // Require UI_RUNTIME_DECISION_ENGINE and UI_SIGNAL_NORMALIZER
  const runtimeEngineFile = path.resolve(ROOT, "src/core/ui/runtime/UI_RUNTIME_DECISION_ENGINE.ts");
  const signalNormalizerFile = path.resolve(ROOT, "src/core/ui/runtime/UI_SIGNAL_NORMALIZER.ts");
  if (!fs.existsSync(runtimeEngineFile)) {
    fail("ARCHITECTURE", "UI_RUNTIME_DECISION_ENGINE.ts is required but missing");
  }
  if (!fs.existsSync(signalNormalizerFile)) {
    fail("ARCHITECTURE", "UI_SIGNAL_NORMALIZER.ts is required but missing");
  }

  // Verify getDashboardUI output matches the v6.4 contract (signals, uiDecision, sections have uiDecision)
  const graph = getDashboardUI({ entry_state: "AUTHENTICATED" });
  if (!graph.signals || typeof graph.signals.revenueProbability !== "number") {
    fail("ARCHITECTURE", "getDashboardUI output is missing signals field");
  }
  if (!graph.uiDecision || typeof graph.uiDecision.priority !== "number") {
    fail("ARCHITECTURE", "getDashboardUI output is missing uiDecision field");
  }
  if (!Array.isArray(graph.sections) || graph.sections.length === 0) {
    fail("ARCHITECTURE", "getDashboardUI output sections is not a valid array");
  } else {
    for (const section of graph.sections) {
      if (!section.uiDecision || typeof section.uiDecision.priority !== "number") {
        fail("ARCHITECTURE", `Section ${section.type} is missing uiDecision`);
      }
    }
  }
} catch (err) {
  fail("ARCHITECTURE", `UI Runtime Decision Engine check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8️⃣ UI GROWTH MUTATION ENGINE (v6.5)
// ─────────────────────────────────────────────────────────────────────────────
try {
  // Required files
  const mutationEngineFile = path.resolve(ROOT, "src/core/growth/UI_GROWTH_MUTATION_ENGINE.ts");
  const mutationStrategyFile = path.resolve(ROOT, "src/core/growth/UI_MUTATION_STRATEGY.ts");
  if (!fs.existsSync(mutationEngineFile)) {
    fail("ARCHITECTURE", "UI_GROWTH_MUTATION_ENGINE.ts is required but missing");
  }
  if (!fs.existsSync(mutationStrategyFile)) {
    fail("ARCHITECTURE", "UI_MUTATION_STRATEGY.ts is required but missing");
  }

  // Scan mutation files for imports of kernel or orchestrator
  const rawMutation = readCode("src/core/growth/UI_GROWTH_MUTATION_ENGINE.ts");
  if (rawMutation) {
    const code = codeOnly(rawMutation);
    if (code.toLowerCase().includes("kernel") || code.toLowerCase().includes("orchestrator")) {
      fail("ARCHITECTURE", "UI Growth Mutation Engine must only affect the UI layer and is forbidden from interacting with Kernel or Orchestrator routing");
    }
  }

  const rawStrategy = readCode("src/core/growth/UI_MUTATION_STRATEGY.ts");
  if (rawStrategy) {
    const code = codeOnly(rawStrategy);
    if (code.toLowerCase().includes("kernel") || code.toLowerCase().includes("orchestrator")) {
      fail("ARCHITECTURE", "UI Mutation Strategy must only affect the UI layer and is forbidden from interacting with Kernel or Orchestrator routing");
    }
  }

  // Verify that the graph composer defines MUTATION_SCOPE = "UI_ONLY"
  const composerFile = "src/core/ui/pipeline/UI_GRAPH_COMPOSER.ts";
  const composerRaw = readCode(composerFile);
  if (composerRaw) {
    const code = codeOnly(composerRaw);
    if (!code.includes("MUTATION_SCOPE") || !code.includes("UI_ONLY")) {
      fail("ARCHITECTURE", "UI_GRAPH_COMPOSER must define MUTATION_SCOPE = 'UI_ONLY'");
    }
  }

  // Verify getDashboardUI output includes growthMutation property
  const graph = getDashboardUI({ entry_state: "AUTHENTICATED" });
  if (!graph.growthMutation || typeof graph.growthMutation.proposalsCount !== "number") {
    fail("ARCHITECTURE", "getDashboardUI output is missing growthMutation metrics");
  }
} catch (err) {
  fail("ARCHITECTURE", `UI Growth Mutation Engine check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 9️⃣ UI AUTHORITY & STABILITY (v6.6)
// ─────────────────────────────────────────────────────────────────────────────
try {
  // Required files existence
  const authorityLayerFile = path.resolve(ROOT, "src/core/ui/runtime/UI_AUTHORITY_LAYER.ts");
  const stabilityEngineFile = path.resolve(ROOT, "src/core/ui/runtime/UI_STABILITY_ENGINE.ts");
  if (!fs.existsSync(authorityLayerFile)) {
    fail("ARCHITECTURE", "UI_AUTHORITY_LAYER.ts is required but missing");
  }
  if (!fs.existsSync(stabilityEngineFile)) {
    fail("ARCHITECTURE", "UI_STABILITY_ENGINE.ts is required but missing");
  }

  // Verify Composer is the final authority and overrides mutations
  const composerRaw = readCode("src/core/ui/pipeline/UI_GRAPH_COMPOSER.ts");
  if (composerRaw) {
    const code = codeOnly(composerRaw);
    if (!code.includes("validateAuthority")) {
      fail("ARCHITECTURE", "UI_GRAPH_COMPOSER must call validateAuthority to enforce structural boundaries");
    }
  }

  // Verify DashboardOverview is a pure registry and has no switch rendering blocks
  const dashboardRaw = readCode("src/app/dashboard/components/DashboardOverview.js");
  if (dashboardRaw) {
    const code = codeOnly(dashboardRaw);
    if (code.includes("switch (section.type)") || code.includes("switch(section.type)")) {
      fail("ARCHITECTURE", "DashboardOverview.js must not contain a switch statement for rendering sections; it must be a pure registry");
    }
    if (!code.includes("SECTION_REGISTRY")) {
      fail("ARCHITECTURE", "DashboardOverview.js must define and use SECTION_REGISTRY");
    }
  }

  // Verify getDashboardUI output has uiStability metrics
  const graph = getDashboardUI({ entry_state: "AUTHENTICATED" });
  if (!graph.uiStability || typeof graph.uiStability.stabilityScore !== "number") {
    fail("ARCHITECTURE", "getDashboardUI output is missing uiStability metrics");
  }
} catch (err) {
  fail("ARCHITECTURE", `UI Authority & Stability check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔟 UI INTENTS & FEEDBACK LOOP (v6.7)
// ─────────────────────────────────────────────────────────────────────────────
try {
  // Required files existence
  const intentEngineFile = path.resolve(ROOT, "src/core/ui/UI_INTENT_ENGINE.ts");
  const feedbackLoopEngineFile = path.resolve(ROOT, "src/core/ui/runtime/UI_FEEDBACK_LOOP_ENGINE.ts");
  if (!fs.existsSync(intentEngineFile)) {
    fail("ARCHITECTURE", "UI_INTENT_ENGINE.ts is required but missing");
  }
  if (!fs.existsSync(feedbackLoopEngineFile)) {
    fail("ARCHITECTURE", "UI_FEEDBACK_LOOP_ENGINE.ts is required but missing");
  }
} catch (err) {
  fail("ARCHITECTURE", `UI Intents & Feedback Loop check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1️⃣1️⃣ UI STRIPE GROWTH RECOVERY PATCH (v6.9.1)
// ─────────────────────────────────────────────────────────────────────────────
try {
  // Verify UI_CONTROL_PLANE exists
  const cpFile = path.resolve(ROOT, "src/core/ui/UI_CONTROL_PLANE.ts");
  if (!fs.existsSync(cpFile)) {
    fail("ARCHITECTURE", "UI_CONTROL_PLANE.ts is required but missing");
  }

  // Verify UI_LOCAL_EXECUTION_AUTHORITY exists
  const localAuthFile = path.resolve(ROOT, "src/core/ui/authority/UI_LOCAL_EXECUTION_AUTHORITY.ts");
  if (!fs.existsSync(localAuthFile)) {
    fail("ARCHITECTURE", "UI_LOCAL_EXECUTION_AUTHORITY.ts is required but missing");
  }

  // Verify UI_FEEDBACK_WEIGHT_ENGINE exists
  const weightEngineFile = path.resolve(ROOT, "src/core/ui/feedback/UI_FEEDBACK_WEIGHT_ENGINE.ts");
  if (!fs.existsSync(weightEngineFile)) {
    fail("ARCHITECTURE", "UI_FEEDBACK_WEIGHT_ENGINE.ts is required but missing");
  }

  // Verify Composer contains no business keywords and no filtering logic
  const composerRaw = readCode("src/core/ui/pipeline/UI_GRAPH_COMPOSER.ts");
  if (composerRaw) {
    const code = codeOnly(composerRaw).toLowerCase().replace("mutation_scope", "").replace("ui_only", "");
    if (code.includes("intent") || code.includes("mutation") || code.includes("feedback")) {
      fail("ARCHITECTURE", "UI_GRAPH_COMPOSER must not contain business logic keywords: intent, mutation, feedback");
    }
    if (code.includes(".filter(")) {
      fail("ARCHITECTURE", "UI_GRAPH_COMPOSER must be a pure renderer: no filter operations allowed");
    }
  }

  // Verify Control Plane does not perform mutation or execution guard decisions in its core logic
  const cpRaw = readCode("src/core/ui/UI_CONTROL_PLANE.ts");
  if (cpRaw) {
    const code = codeOnly(cpRaw);
    const match = code.match(/function\s+executeControlPlane[\s\S]*?}/);
    if (match) {
      const fnCode = match[0];
      if (fnCode.includes("proposeMutation") || fnCode.includes("enforceExecution")) {
        fail("ARCHITECTURE", "Control Plane core decision must not perform mutation or execution guard decisions");
      }
    }
  }

  // Verify GET_DASHBOARD_UI delegates entirely to the control plane
  const dashboardUIRaw = readCode("src/core/ui/GET_DASHBOARD_UI.ts");
  if (dashboardUIRaw) {
    const code = codeOnly(dashboardUIRaw);
    if (!code.includes("execute(")) {
      fail("ARCHITECTURE", "GET_DASHBOARD_UI.ts must delegate entirely to UI_CONTROL_PLANE.execute()");
    }
  }

  // Verify UI has no awareness of mutation/feedback loops
  const dashboardRaw = readCode("src/app/dashboard/components/DashboardOverview.js");
  if (dashboardRaw) {
    const code = codeOnly(dashboardRaw);
    if (code.includes("GrowthMutationCard") || code.includes("UI_FEEDBACK_LOOP")) {
      fail("ARCHITECTURE", "DashboardOverview.js must not contain references to GrowthMutationCard or UI_FEEDBACK_LOOP");
    }
  }
} catch (err) {
  fail("ARCHITECTURE", `UI Control Plane Consolidation check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1️⃣2️⃣ PRICING INTELLIGENCE ENGINE (v9.5)
// ─────────────────────────────────────────────────────────────────────────────
try {
  // Verify PRICING_INTELLIGENCE_ENGINE exists
  const pricingFile = path.resolve(ROOT, "src/core/pricing/PRICING_INTELLIGENCE_ENGINE.ts");
  if (!fs.existsSync(pricingFile)) {
    fail("ARCHITECTURE", "PRICING_INTELLIGENCE_ENGINE.ts is required but missing");
  }

  // Verify deterministic pricing core is isolated and has multiplier logic
  const pricingCoreFile = path.resolve(ROOT, "src/core/pricing/PRICING_CORE_ENGINE.ts");
  if (!fs.existsSync(pricingCoreFile)) {
    fail("ARCHITECTURE", "PRICING_CORE_ENGINE.ts is required but missing");
  }

  const pricingCoreRaw = readCode("src/core/pricing/PRICING_CORE_ENGINE.ts");
  if (pricingCoreRaw) {
    const code = codeOnly(pricingCoreRaw);
    if (!code.includes("deterministicPricingEngine")) {
      fail("ARCHITECTURE", "PRICING_CORE_ENGINE must export deterministicPricingEngine");
    }
    if (!code.includes("basePrice") || !code.includes("adjustedPrice") || !code.includes("range")) {
      fail("ARCHITECTURE", "PRICING_CORE_ENGINE must return basePrice, adjustedPrice, and range");
    }
    if (!code.includes("CLIENT_MULTIPLIER") || !code.includes("URGENCY_MULTIPLIER") || !code.includes("CLARITY_MULTIPLIER")) {
      fail("ARCHITECTURE", "PRICING_CORE_ENGINE must contain multiplier logic");
    }
  }

  // Verify compatibility wrapper delegates to deterministic pricing core
  const pricingRaw = readCode("src/core/pricing/PRICING_INTELLIGENCE_ENGINE.ts");
  if (pricingRaw) {
    const code = codeOnly(pricingRaw);
    if (!code.includes("deterministicPricingEngine")) {
      fail("ARCHITECTURE", "PRICING_INTELLIGENCE_ENGINE must delegate to deterministicPricingEngine");
    }
  }

  // Verify dashboard does not import pricing logic directly
  const dashboardRaw = readCode("src/app/dashboard/components/DashboardOverview.js");
  if (dashboardRaw) {
    const code = codeOnly(dashboardRaw);
    if (code.includes("PRICING_INTELLIGENCE_ENGINE") || code.includes("getPricingIntelligence")) {
      fail("ARCHITECTURE", "Dashboard components must not import pricing engine directly");
    }
    if (!code.includes("RevenueDecisionCard")) {
      fail("ARCHITECTURE", "Dashboard overview must implement and register RevenueDecisionCard");
    }
  }

  // Verify REVENUE_DECISION_ENGINE exists and is integrated
  const decisionFile = path.resolve(ROOT, "src/core/revenue/REVENUE_DECISION_ENGINE.ts");
  if (!fs.existsSync(decisionFile)) {
    fail("ARCHITECTURE", "REVENUE_DECISION_ENGINE.ts is required but missing");
  }

  const proposalRaw = readCode("src/app/api/proposals/generate/route.js");
  if (proposalRaw && !proposalRaw.includes("getRevenueDecision")) {
    fail("ARCHITECTURE", "Proposal API must use getRevenueDecision");
  }

  const quoteRaw = readCode("src/app/api/quotes/generate/route.js");
  if (quoteRaw && !quoteRaw.includes("getRevenueDecision")) {
    fail("ARCHITECTURE", "Quote API must use getRevenueDecision");
  }

  const invoiceRaw = readCode("src/app/api/invoices/parse/route.js");
  if (invoiceRaw && !invoiceRaw.includes("getRevenueDecision")) {
    fail("ARCHITECTURE", "Invoice API must use getRevenueDecision");
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1️⃣3️⃣ REVENUE AUTOPILOT V2
  // ─────────────────────────────────────────────────────────────────────────────
  const learningFile = path.resolve(ROOT, "src/core/revenue/v2/PRICING_LEARNING_ENGINE.ts");
  if (!fs.existsSync(learningFile)) {
    fail("ARCHITECTURE", "PRICING_LEARNING_ENGINE.ts is required but missing");
  }

  const clientIntelFile = path.resolve(ROOT, "src/core/revenue/v2/CLIENT_INTELLIGENCE_ENGINE.ts");
  if (!fs.existsSync(clientIntelFile)) {
    fail("ARCHITECTURE", "CLIENT_INTELLIGENCE_ENGINE.ts is required but missing");
  }

  const optimizationFile = path.resolve(ROOT, "src/core/revenue/v2/REVENUE_OPTIMIZATION_ENGINE.ts");
  if (!fs.existsSync(optimizationFile)) {
    fail("ARCHITECTURE", "REVENUE_OPTIMIZATION_ENGINE.ts is required but missing");
  }

  const apiDecisionRaw = readCode("src/app/api/revenue/decision/route.js");
  if (apiDecisionRaw) {
    const code = codeOnly(apiDecisionRaw);
    if (!code.includes("getPricingIntelligence") || !code.includes("buildPricingProfile") || !code.includes("adjustedPrice")) {
      fail("ARCHITECTURE", "Revenue Decision API must consume pricing intelligence, buildPricingProfile, and return adjustedPrice");
    }
    if (!code.includes(".eq('user_id', context.user.id)") && !code.includes('.eq("user_id", context.user.id)')) {
      fail("ARCHITECTURE", "Revenue Decision API must scope revenue_decisions queries by current user_id");
    }
    if (code.includes("logDecision(") || code.includes("saveLearningState(") || code.includes(".from('revenue_decisions').insert") || code.includes('.from("revenue_decisions").insert')) {
      fail("ARCHITECTURE", "Revenue Decision API must not write learning state during the request cycle");
    }
    if (!code.includes("enqueueLearningEvent")) {
      fail("ARCHITECTURE", "Revenue Decision API must enqueue learning events instead of inline learning writes");
    }
  } else {
    fail("ARCHITECTURE", "Revenue Decision API route.js is required but missing");
  }

  const tsxCardFile = path.resolve(ROOT, "src/app/dashboard/components/RevenueDecisionCard.tsx");
  if (!fs.existsSync(tsxCardFile)) {
    fail("ARCHITECTURE", "RevenueDecisionCard.tsx component is required but missing");
  }

  // Verify learning loop v3.1 modules exist
  const loggerFile = path.resolve(ROOT, "src/core/learning/REVENUE_DECISION_LOGGER.ts");
  if (!fs.existsSync(loggerFile)) {
    fail("ARCHITECTURE", "REVENUE_DECISION_LOGGER.ts is required but missing");
  }

  const profileEngineFile = path.resolve(ROOT, "src/core/learning/PRICING_LEARNING_PROFILE_ENGINE.ts");
  if (!fs.existsSync(profileEngineFile)) {
    fail("ARCHITECTURE", "PRICING_LEARNING_PROFILE_ENGINE.ts is required but missing");
  }

  const stateStoreFile = path.resolve(ROOT, "src/core/learning/LEARNING_STATE_STORE.ts");
  if (!fs.existsSync(stateStoreFile)) {
    fail("ARCHITECTURE", "LEARNING_STATE_STORE.ts is required but missing");
  }

  // Verify UI has simplified structure and maps the strategy options
  const tsxCardRaw = readCode("src/app/dashboard/components/RevenueDecisionCard.tsx");
  if (tsxCardRaw) {
    const code = codeOnly(tsxCardRaw);
    if (!code.includes("marketRange") || !code.includes("suggestedPrice") || !code.includes("learningState") || !code.includes("HIGH") || !code.includes("FAST")) {
      fail("ARCHITECTURE", "RevenueDecisionCard.tsx must display marketRange, suggestedPrice, learningState, and Option strategies");
    }
  }

  // 🚫 AI Leakage Scan (Task 7)
  const pricingEngineCode = readCode("src/core/pricing/PRICING_INTELLIGENCE_ENGINE.ts");
  if (pricingEngineCode) {
    const code = codeOnly(pricingEngineCode);
    const forbiddenTerms = ["openai", "gpt", "llm", "ai.call", "completion", "aiRouter"];
    forbiddenTerms.forEach((term) => {
      if (code.toLowerCase().includes(term.toLowerCase())) {
        fail("ARCHITECTURE", `AI Leakage Violation: pricing engine contains forbidden AI reference "${term}"`);
      }
    });
  }
} catch (err) {
  fail("ARCHITECTURE", `Pricing/Revenue Decision Engine check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1️⃣4️⃣ v3.1.1 AI PURGE PATCH — hard decision-path lock
// ─────────────────────────────────────────────────────────────────────────────
try {
  const forbiddenDecisionTerms = [
    "deepseek",
    "chat/completions",
    "aiPrediction",
    "aiScoreOverride",
    "AI_TEXT_WRITER",
    "UI_TEXT_WRITER",
  ];

  const decisionPathFiles = [
    "src/app/api/proposals/generate/route.js",
    "src/app/api/quotes/generate/route.js",
    "src/app/api/invoices/parse/route.js",
    "src/app/api/monetization/predict/route.ts",
    "src/app/api/revenue/decision/route.js",
    "lib/monetization/upgradeTriggerEngine.ts",
    "src/core/pricing/PRICING_CORE_ENGINE.ts",
    "src/core/pricing/PRICING_INTELLIGENCE_ENGINE.ts",
  ];

  for (const file of decisionPathFiles) {
    const raw = readCode(file);
    if (!raw) continue;
    const code = codeOnly(raw);
    for (const term of forbiddenDecisionTerms) {
      if (code.toLowerCase().includes(term.toLowerCase())) {
        fail("ARCHITECTURE", `AI decision-path violation: ${file} contains "${term}"`);
      }
    }
  }

  const proposalRaw = readCode("src/app/api/proposals/generate/route.js");
  if (proposalRaw) {
    const code = codeOnly(proposalRaw);
    const structuredRevenueFields = [
      '"pricing"',
      "'pricing'",
      "recommended_price",
      "pricing_reason",
      "ai_pricing_suggestion",
    ];
    for (const field of structuredRevenueFields) {
      if (code.includes(field) && !code.includes("stripRevenueOutputFields")) {
        fail("ARCHITECTURE", `AI cannot write structured revenue output field ${field} in proposal route`);
      }
    }
  }

  const roleRegistryRaw = readCode("src/core/ai/AI_ROLE_REGISTRY.ts");
  if (roleRegistryRaw) {
    const code = codeOnly(roleRegistryRaw);
    for (const role of ["UI_TEXT_WRITER", "DECISION_MAKER", "PRICING_ENGINE", "REVENUE_CONTROLLER"]) {
      if (!code.includes("FORBIDDEN_ROLES") || !code.includes(role)) {
        fail("ARCHITECTURE", `AI role hard block missing for ${role}`);
      }
    }
  }

  const runtimeDecisionFiles = [
    "src/core/pricing/PRICING_CORE_ENGINE.ts",
    "src/core/pricing/PRICING_INTELLIGENCE_ENGINE.ts",
    "src/core/revenue/REVENUE_DECISION_ENGINE.ts",
    "lib/monetization/upgradeTriggerEngine.ts",
    "src/app/api/revenue/decision/route.js",
    "src/app/api/monetization/predict/route.ts",
  ];
  for (const file of runtimeDecisionFiles) {
    const raw = readCode(file);
    if (!raw) continue;
    const code = codeOnly(raw);
    if (code.includes("aiRouter(") || code.includes("validateAIOperation(") || code.includes("AI_ROLE_PERMISSIONS")) {
      fail("ARCHITECTURE", `ai_role_used_in_runtime_decision: ${file}`);
    }
  }
} catch (err) {
  fail("ARCHITECTURE", `AI purge decision-path check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.1.2 — REVENUE FEEDBACK INTELLIGENCE LAYER CHECKS
// ─────────────────────────────────────────────────────────────────────────────
try {
  const v312Files = [
    "src/core/revenue/v3/REVENUE_OUTCOME_ENGINE.ts",
    "src/core/revenue/v3/STRATEGY_PERFORMANCE_ANALYZER.ts",
    "src/core/revenue/v3/USER_SEGMENT_ENGINE.ts",
    "src/core/revenue/v3/REVENUE_FEEDBACK_INTELLIGENCE.ts",
  ];

  for (const file of v312Files) {
    const raw = readCode(file);
    if (!raw) {
      fail("ARCHITECTURE", `v3.1.2 missing file: ${file}`);
    }
  }

  // Verify REVENUE_OUTCOME_ENGINE exports
  const outcomeRaw = readCode("src/core/revenue/v3/REVENUE_OUTCOME_ENGINE.ts");
  if (outcomeRaw) {
    if (!outcomeRaw.includes("recordOutcome"))
      fail("ARCHITECTURE", "REVENUE_OUTCOME_ENGINE missing recordOutcome export");
    if (!outcomeRaw.includes("computeOutcomeStats"))
      fail("ARCHITECTURE", "REVENUE_OUTCOME_ENGINE missing computeOutcomeStats export");
    if (!outcomeRaw.includes("updateOutcome"))
      fail("ARCHITECTURE", "REVENUE_OUTCOME_ENGINE missing updateOutcome export");
  }

  // Verify Strategy Analyzer
  const stratRaw = readCode("src/core/revenue/v3/STRATEGY_PERFORMANCE_ANALYZER.ts");
  if (stratRaw && !stratRaw.includes("analyzeStrategyPerformance")) {
    fail("ARCHITECTURE", "STRATEGY_PERFORMANCE_ANALYZER missing analyzeStrategyPerformance export");
  }

  // Verify User Segment Engine
  const segmentRaw = readCode("src/core/revenue/v3/USER_SEGMENT_ENGINE.ts");
  if (segmentRaw && !segmentRaw.includes("getSegmentProfile")) {
    fail("ARCHITECTURE", "USER_SEGMENT_ENGINE missing getSegmentProfile export");
  }

  // Verify master aggregator
  const aggregatorRaw = readCode("src/core/revenue/v3/REVENUE_FEEDBACK_INTELLIGENCE.ts");
  if (aggregatorRaw && !aggregatorRaw.includes("buildFeedbackSnapshot")) {
    fail("ARCHITECTURE", "REVENUE_FEEDBACK_INTELLIGENCE missing buildFeedbackSnapshot export");
  }

  // Verify API route exists
  const outcomesRoute = readCode("src/app/api/revenue/outcomes/route.js");
  if (!outcomesRoute) {
    fail("ARCHITECTURE", "v3.1.2 missing API route: /api/revenue/outcomes");
  }

  // Verify AI is not leaking into outcome engine (no AI SDK imports)
  const AI_SDK_MARKERS = ["openai", "anthropic", "gemini", "@google/generative-ai", "aiRouter"];
  const coreFiles = v312Files;
  for (const file of coreFiles) {
    const raw = readCode(file);
    if (!raw) continue;
    const code = codeOnly(raw);
    for (const marker of AI_SDK_MARKERS) {
      if (code.includes(marker)) {
        fail("ARCHITECTURE", `AI SDK leaked into v3.1.2 core file: ${file} (marker: ${marker})`);
      }
    }
  }

  console.log("✔ v3.1.2 Feedback Intelligence Layer checks passed");
} catch (err) {
  fail("ARCHITECTURE", `v3.1.2 feedback intelligence check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.2 — STRATEGY LEARNING LAYER CHECKS
// ─────────────────────────────────────────────────────────────────────────────
try {
  const v32Files = [
    "src/core/revenue/v3/REVENUE_STRATEGY_SEGMENT_ENGINE.ts",
    "src/core/revenue/v3/REVENUE_STRATEGY_RECOMMENDER.ts",
    "src/core/revenue/v3/REVENUE_LEARNING_GATE.ts",
  ];

  // 1️⃣ All new engine files must exist
  for (const file of v32Files) {
    const raw = readCode(file);
    if (!raw) {
      fail("ARCHITECTURE", `v3.2 missing file: ${file}`);
    }
  }

  // 2️⃣ GUARD: REVENUE_STRATEGY_ENGINE must NOT import REVENUE_OUTCOME_ENGINE directly
  // Learning must flow through REVENUE_STRATEGY_RECOMMENDER → REVENUE_LEARNING_GATE only
  const strategyEngineRaw = readCode("src/core/revenue/v3/REVENUE_STRATEGY_ENGINE.ts");
  if (strategyEngineRaw) {
    const stratCode = codeOnly(strategyEngineRaw);
    if (stratCode.includes("REVENUE_OUTCOME_ENGINE")) {
      fail(
        "ARCHITECTURE",
        "v3.2 VIOLATION: REVENUE_STRATEGY_ENGINE imports REVENUE_OUTCOME_ENGINE directly. " +
        "Learning must route through REVENUE_STRATEGY_RECOMMENDER only."
      );
    }
  }

  // 3️⃣ GUARD: recommendedStrategy must not be assigned as the final strategy
  // Check that applyLearningBias preserves base strategy (never assigns recommendedStrategy to strategy)
  const recommenderRaw = readCode("src/core/revenue/v3/REVENUE_STRATEGY_RECOMMENDER.ts");
  if (recommenderRaw) {
    if (!recommenderRaw.includes("applyLearningBias")) {
      fail("ARCHITECTURE", "v3.2 REVENUE_STRATEGY_RECOMMENDER missing applyLearningBias export");
    }
    // Ensure the function returns { strategy: baseStrategy } (not the recommended one)
    if (!recommenderRaw.includes("strategy: baseStrategy")) {
      fail(
        "ARCHITECTURE",
        "v3.2 VIOLATION: applyLearningBias must return { strategy: baseStrategy } — " +
        "recommendation must never override execution strategy."
      );
    }
  }

  // 4️⃣ GUARD: REVENUE_LEARNING_GATE must enforce safeToUseForDecision = false
  const gateRaw = readCode("src/core/revenue/v3/REVENUE_LEARNING_GATE.ts");
  if (gateRaw) {
    const hasDecisionBlock =
      gateRaw.includes("safeToUseForDecision: false") ||
      gateRaw.includes("safeToUseForDecision = false");
    if (!hasDecisionBlock) {
      fail(
        "ARCHITECTURE",
        "v3.2 VIOLATION: REVENUE_LEARNING_GATE must set safeToUseForDecision: false for all sources."
      );
    }
    if (!gateRaw.includes("assertLearningGate")) {
      fail("ARCHITECTURE", "v3.2 REVENUE_LEARNING_GATE missing assertLearningGate export");
    }
  }

  // 5️⃣ GUARD: No AI SDK imports in ANY v3 core file (extended scan)
  const allV3Files = [
    ...v32Files,
    "src/core/revenue/v3/REVENUE_OUTCOME_ENGINE.ts",
    "src/core/revenue/v3/REVENUE_STRATEGY_ENGINE.ts",
    "src/core/revenue/v3/REVENUE_FEEDBACK_INTELLIGENCE.ts",
    "src/core/revenue/v3/REVENUE_GAME_THEORY_ENGINE.ts",
    "src/core/revenue/v3/STRATEGY_PERFORMANCE_ANALYZER.ts",
    "src/core/revenue/v3/USER_SEGMENT_ENGINE.ts",
  ];

  const AI_MARKERS_V32 = [
    "from 'openai'", "from \"openai\"",
    "from 'anthropic'", "from \"anthropic\"",
    "from '@google/generative-ai'", "from \"@google/generative-ai\"",
    "from 'deepseek'", "from \"deepseek\"",
    "aiRouter(", "validateAIOperation(",
  ];

  for (const file of allV3Files) {
    const raw = readCode(file);
    if (!raw) continue;
    const code = codeOnly(raw);
    for (const marker of AI_MARKERS_V32) {
      if (code.includes(marker)) {
        fail("ARCHITECTURE", `v3.2 AI LEAK: ${file} references AI SDK (${marker})`);
      }
    }
  }

  // 6️⃣ Verify v3.2 key exports exist
  const segmentEngineRaw = readCode("src/core/revenue/v3/REVENUE_STRATEGY_SEGMENT_ENGINE.ts");
  if (segmentEngineRaw) {
    if (!segmentEngineRaw.includes("buildStrategyMatrix"))
      fail("ARCHITECTURE", "v3.2 REVENUE_STRATEGY_SEGMENT_ENGINE missing buildStrategyMatrix export");
    if (!segmentEngineRaw.includes("getBestStrategyForSegment"))
      fail("ARCHITECTURE", "v3.2 REVENUE_STRATEGY_SEGMENT_ENGINE missing getBestStrategyForSegment export");
  }

  const stratEngineRaw2 = readCode("src/core/revenue/v3/REVENUE_STRATEGY_ENGINE.ts");
  if (stratEngineRaw2 && !stratEngineRaw2.includes("getStrategyWithLearning")) {
    fail("ARCHITECTURE", "v3.2 REVENUE_STRATEGY_ENGINE missing getStrategyWithLearning export");
  }

  console.log("✔ v3.2 Strategy Learning Layer checks passed");
} catch (err) {
  fail("ARCHITECTURE", `v3.2 strategy learning check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.2 & v3.3 CLOSED LOOP & STRATEGY BIAS SAFETY GATE CHECKS
// ─────────────────────────────────────────────────────────────────────────────
try {
  const v33Files = [
    "src/core/revenue/v3/REVENUE_STRATEGY_LEARNING_MATRIX.ts",
    "src/core/revenue/v3/REVENUE_LEARNING_RECOMMENDER.ts",
    "src/core/revenue/v3/REVENUE_LEARNING_AGGREGATOR.ts",
    "src/core/revenue/v3/REVENUE_STRATEGY_BIAS_ENGINE.ts",
    "src/core/revenue/v3/REVENUE_SEGMENT_MATRIX_ENGINE.ts",
  ];

  // 1️⃣ All new closed loop & bias files must exist
  for (const file of v33Files) {
    const raw = readCode(file);
    if (!raw) {
      fail("ARCHITECTURE", `v3.3 missing file: ${file}`);
    }
  }

  // 2️⃣ GUARD: Learning cannot affect execution directly
  // REVENUE_LEARNING_RECOMMENDER must ONLY be imported by REVENUE_STRATEGY_ENGINE or route.js (advisory)
  // Scan all other hot execution path files for direct imports of recommender or bias engines
  const allowedLearningImporters = [
    "src/core/revenue/v3/REVENUE_STRATEGY_ENGINE.ts",
    "src/app/api/revenue/decision/route.js",
  ];
  const filesToScan = [
    "src/app/api/invoices/parse/route.js",
    "src/app/api/proposals/generate/route.js",
    "src/core/pricing/PRICING_INTELLIGENCE_ENGINE.ts",
    "src/core/revenue/REVENUE_DECISION_ENGINE.ts",
  ];

  for (const file of filesToScan) {
    const raw = readCode(file);
    if (!raw) continue;
    const code = codeOnly(raw);
    if (code.includes("REVENUE_LEARNING_RECOMMENDER") || code.includes("applySoftBias") || code.includes("getStrategyWithBiasInjection")) {
      fail(
        "ARCHITECTURE",
        `v3.3 VIOLATION: ${file} imports learning recommender directly. ` +
        `Only strategy engine or decision route are authorized importer contexts.`
      );
    }
  }

  // 3️⃣ GUARD: No AI in learning / bias layer (strict scan)
  const AI_MARKERS_CL = [
    "from 'openai'", "from \"openai\"",
    "from 'anthropic'", "from \"anthropic\"",
    "from '@google/generative-ai'", "from \"@google/generative-ai\"",
    "from 'deepseek'", "from \"deepseek\"",
    "require('openai')", "require(\"openai\")",
    "openai.chat", "anthropic.messages",
  ];

  for (const file of v33Files) {
    const raw = readCode(file);
    if (!raw) continue;
    const code = codeOnly(raw);
    for (const marker of AI_MARKERS_CL) {
      if (code.includes(marker)) {
        fail("ARCHITECTURE", `v3.3 AI LEAK: ${file} references AI SDK (${marker})`);
      }
    }
  }

  // 4️⃣ GUARD: Matrix must be deterministic — random() is banned
  const ALL_LEARNING_FILES = [
    ...v33Files,
    "src/core/revenue/v3/REVENUE_STRATEGY_ENGINE.ts",
  ];

  for (const file of ALL_LEARNING_FILES) {
    const raw = readCode(file);
    if (!raw) continue;
    const code = codeOnly(raw);
    if (code.includes("Math.random()") || code.includes("Math.random(")) {
      fail(
        "ARCHITECTURE",
        `v3.3 VIOLATION: ${file} uses Math.random() in learning module. ` +
        "Matrix scoring must be fully deterministic."
      );
    }
  }

  // 5️⃣ Verify key exports of new files
  const matrixRaw = readCode("src/core/revenue/v3/REVENUE_STRATEGY_LEARNING_MATRIX.ts");
  if (matrixRaw) {
    if (!matrixRaw.includes("buildLearningMatrix"))
      fail("ARCHITECTURE", "v3.3 REVENUE_STRATEGY_LEARNING_MATRIX missing buildLearningMatrix export");
  }

  const biasEngineRaw = readCode("src/core/revenue/v3/REVENUE_STRATEGY_BIAS_ENGINE.ts");
  if (biasEngineRaw) {
    if (!biasEngineRaw.includes("buildStrategyBias"))
      fail("ARCHITECTURE", "v3.3 REVENUE_STRATEGY_BIAS_ENGINE missing buildStrategyBias export");
    if (!biasEngineRaw.includes("getBiasForSegment"))
      fail("ARCHITECTURE", "v3.3 REVENUE_STRATEGY_BIAS_ENGINE missing getBiasForSegment export");
  }

  const segmentMatrixRaw = readCode("src/core/revenue/v3/REVENUE_SEGMENT_MATRIX_ENGINE.ts");
  if (segmentMatrixRaw) {
    if (!segmentMatrixRaw.includes("buildSegmentMatrix"))
      fail("ARCHITECTURE", "v3.3 REVENUE_SEGMENT_MATRIX_ENGINE missing buildSegmentMatrix export");
  }

  const recommenderRaw2 = readCode("src/core/revenue/v3/REVENUE_LEARNING_RECOMMENDER.ts");
  if (recommenderRaw2) {
    if (!recommenderRaw2.includes("getLearningRecommendation"))
      fail("ARCHITECTURE", "v3.3 REVENUE_LEARNING_RECOMMENDER missing getLearningRecommendation export");
    if (!recommenderRaw2.includes("applySoftBias"))
      fail("ARCHITECTURE", "v3.3 REVENUE_LEARNING_RECOMMENDER missing applySoftBias export");
    // Verify applySoftBias returns baseStrategy unchanged
    if (!recommenderRaw2.includes("strategy: baseStrategy")) {
      fail(
        "ARCHITECTURE",
        "v3.3 VIOLATION: applySoftBias must return { strategy: baseStrategy } — learning cannot override execution."
      );
    }
  }

  // 6️⃣ REVENUE_STRATEGY_ENGINE must export getStrategyWithBiasInjection
  const engineRaw2 = readCode("src/core/revenue/v3/REVENUE_STRATEGY_ENGINE.ts");
  if (engineRaw2 && !engineRaw2.includes("getStrategyWithBiasInjection")) {
    fail("ARCHITECTURE", "v3.3 REVENUE_STRATEGY_ENGINE missing getStrategyWithBiasInjection export");
  }

  // 7️⃣ Decision route.js must have the strategy bias hooks
  const routeRaw = readCode("src/app/api/revenue/decision/route.js");
  if (routeRaw) {
    if (!routeRaw.includes("getStrategyBias") || !routeRaw.includes("applyBias")) {
      fail("ARCHITECTURE", "v3.3 VIOLATION: decision route.js missing getStrategyBias or applyBias hooks");
    }
    // Verify that applyBias is implemented safely and does not override the rule engine pricing output
    if (!routeRaw.includes("return biasSig ? biasSig.strategy : base")) {
      fail("ARCHITECTURE", "v3.3 VIOLATION: decision route.js applyBias must be advisory only and return base strategy if no bias signal exists");
    }
  }

  console.log("✔ v3.3 Strategy Learning Injection Layer checks passed");
} catch (err) {
  fail("ARCHITECTURE", `v3.3 closed loop & bias check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.5 — REVENUE AUTOPILOT SAFETY GATE CHECKS
// ─────────────────────────────────────────────────────────────────────────────
try {
  const v35Files = [
    "src/core/revenue/v3/v3_5/REVENUE_AUTOPILOT_ENGINE.ts",
    "src/core/revenue/v3/v3_5/REVENUE_STRATEGY_PRUNING_ENGINE.ts",
    "src/core/revenue/v3/v3_5/REVENUE_FLOW_ALLOCATOR_ENGINE.ts",
    "src/core/revenue/v3/v3_5/REVENUE_STRATEGY_DRIFT_AUTOCORRECTOR.ts",
    "src/core/revenue/v3/v3_5/REVENUE_EXPERIMENT_SCALER.ts",
  ];

  // 1️⃣ Verify all files exist
  for (const file of v35Files) {
    const raw = readCode(file);
    if (!raw) {
      fail("ARCHITECTURE", `v3.5 Autopilot missing file: ${file}`);
    }
  }

  // 2️⃣ GUARD: No AI SDKs in Autopilot layer
  const AI_MARKERS_V35 = [
    "from 'openai'", "from \"openai\"",
    "from 'anthropic'", "from \"anthropic\"",
    "from '@google/generative-ai'", "from \"@google/generative-ai\"",
    "from 'deepseek'", "from \"deepseek\"",
    "require('openai')", "require(\"openai\")",
  ];

  for (const file of v35Files) {
    const raw = readCode(file);
    if (!raw) continue;
    const code = codeOnly(raw);
    for (const marker of AI_MARKERS_V35) {
      if (code.includes(marker)) {
        fail("ARCHITECTURE", `v3.5 AI LEAK: ${file} references AI SDK (${marker})`);
      }
    }
  }

  // 3️⃣ GUARD: Autopilot must be deterministic — Math.random() is banned
  for (const file of v35Files) {
    const raw = readCode(file);
    if (!raw) continue;
    const code = codeOnly(raw);
    if (code.includes("Math.random()") || code.includes("Math.random(")) {
      fail(
        "ARCHITECTURE",
        `v3.5 VIOLATION: ${file} uses Math.random(). Autopilot portfolio operations must be fully deterministic.`
      );
    }
  }

  // 4️⃣ Verify key exports and return behavior
  const engineRaw = readCode("src/core/revenue/v3/REVENUE_STRATEGY_ENGINE.ts");
  if (engineRaw) {
    if (!engineRaw.includes("getStrategyWithAutopilot")) {
      fail("ARCHITECTURE", "v3.5 REVENUE_STRATEGY_ENGINE missing getStrategyWithAutopilot export");
    }
    // Verify that autopilotMetadata is appended but strategy is not overridden
    if (!engineRaw.includes("autopilotMetadata:")) {
      fail("ARCHITECTURE", "v3.5 VIOLATION: REVENUE_STRATEGY_ENGINE must output autopilotMetadata");
    }
  }

  const routeRaw = readCode("src/app/api/revenue/decision/route.js");
  if (routeRaw) {
    if (!routeRaw.includes("getStrategyWithAutopilot") || !routeRaw.includes("autopilot:")) {
      fail("ARCHITECTURE", "v3.5 VIOLATION: decision route.js must consume and output autopilot metadata");
    }
  }

  console.log("✔ v3.5 Revenue Autopilot checks passed");
} catch (err) {
  fail("ARCHITECTURE", `v3.5 Autopilot check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.6 — REVENUE EVOLUTION SAFETY GATE CHECKS
// ─────────────────────────────────────────────────────────────────────────────
try {
  const v36Files = [
    "src/core/revenue/v3/v3_5/REVENUE_EVOLUTION_ENGINE.ts",
    "src/core/revenue/v3/v3_5/STRATEGY_EVOLUTION_MEMORY.ts",
    "src/core/revenue/v3/v3_5/REVENUE_TRAJECTORY_OPTIMIZER.ts",
  ];

  // 1️⃣ Verify all evolution files exist
  for (const file of v36Files) {
    const raw = readCode(file);
    if (!raw) {
      fail("ARCHITECTURE", `v3.6 Evolution Layer missing file: ${file}`);
    }
  }

  // 2️⃣ GUARD: No AI SDKs in Evolution layer
  const AI_MARKERS_V36 = [
    "from 'openai'", "from \"openai\"",
    "from 'anthropic'", "from \"anthropic\"",
    "from '@google/generative-ai'", "from \"@google/generative-ai\"",
    "from 'deepseek'", "from \"deepseek\"",
    "require('openai')", "require(\"openai\")",
  ];

  for (const file of v36Files) {
    const raw = readCode(file);
    if (!raw) continue;
    const code = codeOnly(raw);
    for (const marker of AI_MARKERS_V36) {
      if (code.includes(marker)) {
        fail("ARCHITECTURE", `v3.6 AI LEAK: ${file} references AI SDK (${marker})`);
      }
    }
  }

  // 3️⃣ GUARD: Evolution must be deterministic — Math.random() is banned
  for (const file of v36Files) {
    const raw = readCode(file);
    if (!raw) continue;
    const code = codeOnly(raw);
    if (code.includes("Math.random()") || code.includes("Math.random(")) {
      fail(
        "ARCHITECTURE",
        `v3.6 VIOLATION: ${file} uses Math.random(). Evolution operations must be fully deterministic.`
      );
    }
  }

  // 4️⃣ Verify key exports and return behavior
  const engineRaw = readCode("src/core/revenue/v3/REVENUE_STRATEGY_ENGINE.ts");
  if (engineRaw) {
    if (!engineRaw.includes("revenueTrend:") || !engineRaw.includes("growthDirection:")) {
      fail("ARCHITECTURE", "v3.6 VIOLATION: REVENUE_STRATEGY_ENGINE must export revenueTrend and growthDirection in autopilotMetadata");
    }
  }

  const cardRaw = readCode("src/app/dashboard/components/RevenueDecisionCard.tsx");
  if (cardRaw) {
    if (!cardRaw.includes("Revenue Evolution Status") || !cardRaw.includes("revenueTrend")) {
      fail("ARCHITECTURE", "v3.6 VIOLATION: RevenueDecisionCard.tsx must render the Revenue Evolution Panel");
    }
  }

  console.log("✔ v3.6 Revenue Evolution checks passed");
} catch (err) {
  fail("ARCHITECTURE", `v3.6 Evolution check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.7 — REVENUE MODEL INNOVATION SAFETY GATE CHECKS
// ─────────────────────────────────────────────────────────────────────────────
try {
  const v37Files = [
    "src/core/revenue/v3/v3_7/REVENUE_MODEL_INNOVATION_ENGINE.ts",
    "src/core/revenue/v3/v3_7/REVENUE_MODEL_GENERATOR.ts",
    "src/core/revenue/v3/v3_7/REVENUE_MODEL_SIMULATION_ENGINE.ts",
    "src/core/revenue/v3/v3_7/REVENUE_MODEL_RANKING_ENGINE.ts",
    "src/core/revenue/v3/v3_7/REVENUE_INNOVATION_TRIGGER_ENGINE.ts",
  ];

  // 1️⃣ Verify all innovation files exist
  for (const file of v37Files) {
    const raw = readCode(file);
    if (!raw) {
      fail("ARCHITECTURE", `v3.7 Innovation Layer missing file: ${file}`);
    }
  }

  // 2️⃣ GUARD: No AI SDKs in Innovation layer
  const AI_MARKERS_V37 = [
    "from 'openai'", "from \"openai\"",
    "from 'anthropic'", "from \"anthropic\"",
    "from '@google/generative-ai'", "from \"@google/generative-ai\"",
    "from 'deepseek'", "from \"deepseek\"",
    "require('openai')", "require(\"openai\")",
  ];

  for (const file of v37Files) {
    const raw = readCode(file);
    if (!raw) continue;
    const code = codeOnly(raw);
    for (const marker of AI_MARKERS_V37) {
      if (code.includes(marker)) {
        fail("ARCHITECTURE", `v3.7 AI LEAK: ${file} references AI SDK (${marker})`);
      }
    }
  }

  // 3️⃣ GUARD: Innovation must be deterministic — Math.random() is banned
  for (const file of v37Files) {
    const raw = readCode(file);
    if (!raw) continue;
    const code = codeOnly(raw);
    if (code.includes("Math.random()") || code.includes("Math.random(")) {
      fail(
        "ARCHITECTURE",
        `v3.7 VIOLATION: ${file} uses Math.random(). Innovation operations must be fully deterministic.`
      );
    }
  }

  // 4️⃣ Verify key exports and return behavior (innovation is advisory only)
  const engineRaw = readCode("src/core/revenue/v3/REVENUE_STRATEGY_ENGINE.ts");
  if (engineRaw) {
    if (!engineRaw.includes("innovationModels:") || !engineRaw.includes("bestModel:")) {
      fail("ARCHITECTURE", "v3.7 VIOLATION: REVENUE_STRATEGY_ENGINE must export innovationModels and bestModel in autopilotMetadata");
    }
  }

  const cardRaw = readCode("src/app/dashboard/components/RevenueDecisionCard.tsx");
  if (cardRaw) {
    if (!cardRaw.includes("Revenue Model Innovation") || !cardRaw.includes("innovationModels")) {
      fail("ARCHITECTURE", "v3.7 VIOLATION: RevenueDecisionCard.tsx must render the Revenue Model Innovation Panel");
    }
  }

  console.log("✔ v3.7 Revenue Model Innovation checks passed");
} catch (err) {
  fail("ARCHITECTURE", `v3.7 Model Innovation check failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Private Beta Gate — Production Hardening & Cleanliness
// ─────────────────────────────────────────────────────────────────────────────
try {
  // 1️⃣ No Debug UI in Production check
  const dashboardRaw = fs.readFileSync("src/components/dashboard/Dashboard.js", "utf-8");
  if (dashboardRaw.includes("Corvioz Verification Audit") || dashboardRaw.includes("Audit Debug UI")) {
    if (!dashboardRaw.includes("process.env.NODE_ENV === 'development'")) {
      fail("HARDENING", "VIOLATION: Dashboard.js contains debug panel or button without process.env.NODE_ENV === 'development' guard.");
    }
  }

  // 2️⃣ Protected monetization routes check
  const routes = [
    "src/app/api/monetization/analytics/route.ts",
    "src/app/api/monetization/simulation/route.ts",
    "src/app/api/monetization/predict/route.ts",
    "src/app/api/revenue/control-plane/route.ts",
    "src/app/api/monetization/audit/route.js",
    "src/app/api/monetization/evolution/route.js",
    "src/app/api/monetization/optimization/route.js",
    "src/app/api/monetization/revenue-events/route.ts",
    "src/app/api/monetization/validation/route.js"
  ];
	  for (const routePath of routes) {
	    const raw = fs.readFileSync(routePath, "utf-8");
	    if (!raw.includes("requireInternalAdmin")) {
	      fail("HARDENING", `VIOLATION: Route ${routePath} does not implement the strict internal admin gate.`);
	    }
	    if (raw.includes("corvioz-e2e-test-user@gmail.com") || raw.includes("admin@corvioz.com")) {
	      fail("HARDENING", `VIOLATION: Route ${routePath} contains fallback admin emails.`);
	    }
	  }

	  const adminGateRaw = fs.readFileSync("src/app/lib/internal-admin.js", "utf-8");
	  if (!adminGateRaw.includes("process.env.INTERNAL_ADMIN_EMAILS || ''") || !adminGateRaw.includes("adminEmails.length === 0")) {
	    fail("HARDENING", "VIOLATION: internal-admin.js must fail closed when INTERNAL_ADMIN_EMAILS is missing in production.");
	  }

	  const middlewareRaw = fs.readFileSync("middleware.js", "utf-8");
	  if (middlewareRaw.includes("'/dashboard/control-' + 'pla' + 'ne'") || middlewareRaw.includes("\"/dashboard/control-\" + \"pla\" + \"ne\"")) {
	    fail("HARDENING", "VIOLATION: middleware.js contains obfuscated dashboard control-plane route matching.");
	  }

  // 3️⃣ RevenueDecisionCard safe props check
  const cardRawText = fs.readFileSync("src/app/dashboard/components/RevenueDecisionCard.tsx", "utf-8");
  if (!cardRawText.includes("typeof ui.marketRange.min !== \"number\"") || !cardRawText.includes("typeof ui.marketRange.max !== \"number\"")) {
    fail("HARDENING", "VIOLATION: RevenueDecisionCard.tsx does not safely guard min/max properties of marketRange.");
  }

  // 4️⃣ Production bundle clean check (runs if .next directory exists)
  const nextDir = path.resolve(__dirname, "..", ".next");
  if (fs.existsSync(nextDir)) {
    const forbiddenWords = [
      "Autopilot",
      "Learning Matrix",
      "Evolution",
      "Innovation",
      "Strategy Engine",
      "Revenue Engine",
      "Deterministic Engine",
      "Revenue Model",
      "Internal CI Tokens"
    ];

    const scanDir = (dir: string) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const abs = path.join(dir, file);
        if (fs.statSync(abs).isDirectory()) {
          scanDir(abs);
        } else if (file.endsWith(".js") && !file.includes("_._.js") && !file.includes("._.js") && !file.includes(".hot-update.")) {
          const content = fs.readFileSync(abs, "utf-8");
          for (const word of forbiddenWords) {
            if (content.includes(word)) {
              if (abs.includes("static/chunks")) {
                fail("HARDENING", `VIOLATION: Production client bundle file ${file} contains internal token: "${word}".`);
              }
            }
          }
        }
      }
    };
    scanDir(nextDir);
  }

  console.log("✔ Private Beta Gate safety checks passed");
} catch (err) {
  fail("HARDENING", `Private Beta Gate checks failed: ${String(err)}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTPUT
// ─────────────────────────────────────────────────────────────────────────────
if (failedModules.length === 0) {
  console.log("✔ Launch Control Validation Passed");
  process.exit(0);
} else {
  console.log("❌ Launch Control Validation Failed");
  failedModules.forEach(m => console.log(`- ${m}`));
  process.exit(1);
}
