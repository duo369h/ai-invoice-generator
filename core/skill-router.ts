import {
  DEFAULT_CORVIOZ_BUSINESS_CONTEXT,
  createSkillExecutionContext,
  skillRegistry,
} from "./skill-registry.ts";
import type { Skill, SkillExecutionResult, SkillInput, SkillName } from "./skill-registry.ts";

export interface SkillMatch {
  skill: Skill;
  confidence: number;
  matchedTriggers: string[];
  keywordOverlap: number;
}

export interface SkillRouterOptions {
  threshold?: number;
  maxChainLength?: number;
  enableMultiSkillChaining?: boolean;
}

export interface SkillRouterResult {
  route: "skill" | "multi-skill" | "fallback";
  confidence: number;
  selectedSkills: SkillName[];
  matches: Array<{
    skill: SkillName;
    confidence: number;
    matchedTriggers: string[];
  }>;
  results: SkillExecutionResult[];
  uiResponse: {
    status: "ready" | "needs-human-readable-fallback" | "failed";
    message: string;
    actions: string[];
    data?: Record<string, unknown>;
  };
}

const DEFAULT_THRESHOLD = 0.6;
const BUSINESS_TERMS = ["invoice", "quote", "proposal", "client", "payment", "checkout", "bill", "receipt"];
const ACTION_TERMS = ["create", "generate", "save", "send", "download", "export", "collect", "write"];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return new Set(normalize(value).split(" ").filter(Boolean));
}

function triggerScore(inputText: string, inputTokens: Set<string>, trigger: string) {
  const normalizedTrigger = normalize(trigger);
  const triggerTokens = tokenize(normalizedTrigger);

  if (!normalizedTrigger) return 0;
  if (inputText.includes(normalizedTrigger)) return 1;

  let overlap = 0;
  for (const token of triggerTokens) {
    if (inputTokens.has(token)) overlap += 1;
  }

  return triggerTokens.size > 0 ? overlap / triggerTokens.size : 0;
}

export function calculateSkillMatch(input: SkillInput, skill: Skill): SkillMatch {
  const inputText = normalize(input.rawInput);
  const inputTokens = tokenize(inputText);
  const matchedTriggers: string[] = [];
  let bestTriggerScore = 0;
  let aggregateTriggerScore = 0;

  for (const trigger of skill.triggers) {
    const score = triggerScore(inputText, inputTokens, trigger);
    if (score >= 0.6) matchedTriggers.push(trigger);
    bestTriggerScore = Math.max(bestTriggerScore, score);
    aggregateTriggerScore += score;
  }

  const skillKeywords = tokenize(skill.triggers.join(" "));
  let keywordHits = 0;
  for (const keyword of skillKeywords) {
    if (inputTokens.has(keyword)) keywordHits += 1;
  }

  const keywordOverlap = skillKeywords.size > 0 ? keywordHits / skillKeywords.size : 0;
  const hasBusinessTerm = BUSINESS_TERMS.some((term) => inputTokens.has(term));
  const hasActionTerm = ACTION_TERMS.some((term) => inputTokens.has(term));
  const contextBoost = hasBusinessTerm && hasActionTerm ? 0.12 : hasBusinessTerm ? 0.06 : 0;
  const memoryBoost =
    input.memoryContext?.clientName || input.memoryContext?.recentClients?.length ? 0.04 : 0;

  const confidence = Math.min(
    1,
    Number(
      (
        bestTriggerScore * 0.72 +
        (aggregateTriggerScore / Math.max(skill.triggers.length, 1)) * 0.16 +
        keywordOverlap * 0.08 +
        contextBoost +
        memoryBoost
      ).toFixed(4)
    )
  );

  return {
    skill,
    confidence,
    matchedTriggers,
    keywordOverlap,
  };
}

function orderMatchesForExecution(matches: SkillMatch[]) {
  const domainOrder: Record<string, number> = {
    "client-management": 0,
    "quote-generator": 1,
    "proposal-generator": 2,
    "invoice-generator": 3,
    "payment-flow": 4,
  };

  return [...matches].sort((a, b) => {
    const orderDelta = domainOrder[a.skill.name] - domainOrder[b.skill.name];
    if (orderDelta !== 0) return orderDelta;
    return b.confidence - a.confidence;
  });
}

function buildFallbackResponse(input: SkillInput, bestMatch?: SkillMatch): SkillRouterResult {
  const readableBest = bestMatch
    ? `Closest skill was ${bestMatch.skill.name} at ${Math.round(bestMatch.confidence * 100)}% confidence.`
    : "No revenue skill matched the request.";

  return {
    route: "fallback",
    confidence: bestMatch?.confidence || 0,
    selectedSkills: [],
    matches: bestMatch
      ? [
          {
            skill: bestMatch.skill.name,
            confidence: bestMatch.confidence,
            matchedTriggers: bestMatch.matchedTriggers,
          },
        ]
      : [],
    results: [],
    uiResponse: {
      status: "needs-human-readable-fallback",
      message: `${readableBest} Please phrase the request around invoice generation, quote generation, proposal generation, client management, or payment flow.`,
      actions: ["fallback-ai-response"],
      data: {
        rawInput: input.rawInput,
        businessContext: input.businessContext || DEFAULT_CORVIOZ_BUSINESS_CONTEXT,
      },
    },
  };
}

function aggregateData(results: SkillExecutionResult[]) {
  return results.reduce<Record<string, unknown>>((acc, result) => {
    acc[result.skill] = result.data || {};
    return acc;
  }, {});
}

function formatResult(results: SkillExecutionResult[], matches: SkillMatch[]): SkillRouterResult["uiResponse"] {
  const failed = results.some((result) => result.status === "failed");
  const needsReview = results.some((result) => result.status === "needs-human-review");
  const actions = results.map((result) => result.summary);

  return {
    status: failed ? "failed" : needsReview ? "needs-human-readable-fallback" : "ready",
    message: results.length
      ? results.map((result) => result.summary).join(" ")
      : "No skill execution result was produced.",
    actions,
    data: {
      confidence: matches.map((match) => ({
        skill: match.skill.name,
        score: match.confidence,
        matchedTriggers: match.matchedTriggers,
      })),
      outputs: aggregateData(results),
    },
  };
}

export async function routeSkillInput(
  input: SkillInput,
  options: SkillRouterOptions = {}
): Promise<SkillRouterResult> {
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const maxChainLength = options.maxChainLength ?? 4;
  const enableMultiSkillChaining = options.enableMultiSkillChaining ?? true;
  const matches = skillRegistry
    .map((skill) => calculateSkillMatch(input, skill))
    .sort((a, b) => b.confidence - a.confidence);

  const executableMatches = matches.filter((match) => match.confidence >= threshold);
  const bestMatch = matches[0];

  if (!executableMatches.length) {
    return buildFallbackResponse(input, bestMatch);
  }

  const selectedMatches = enableMultiSkillChaining
    ? orderMatchesForExecution(executableMatches).slice(0, maxChainLength)
    : [bestMatch];

  const results: SkillExecutionResult[] = [];
  const executed = new Set<SkillName>();

  for (const match of selectedMatches) {
    if (executed.has(match.skill.name)) continue;

    const context = createSkillExecutionContext(input, match.skill);
    const result = await match.skill.handler(context);
    result.confidence = match.confidence;
    results.push(result);
    executed.add(match.skill.name);

    if (result.status === "failed") break;
  }

  const selectedSkills = results.map((result) => result.skill);

  return {
    route: selectedSkills.length > 1 ? "multi-skill" : "skill",
    confidence: Math.max(...selectedMatches.map((match) => match.confidence)),
    selectedSkills,
    matches: matches.map((match) => ({
      skill: match.skill.name,
      confidence: match.confidence,
      matchedTriggers: match.matchedTriggers,
    })),
    results,
    uiResponse: formatResult(results, selectedMatches),
  };
}

export async function handleCorviozUserInput(rawInput: string, input: Partial<SkillInput> = {}) {
  return routeSkillInput({
    rawInput,
    payload: input.payload || {},
    userId: input.userId,
    memoryContext: input.memoryContext || {},
    businessContext: input.businessContext || DEFAULT_CORVIOZ_BUSINESS_CONTEXT,
    supabaseClient: input.supabaseClient,
    paymentProvider: input.paymentProvider,
  });
}
