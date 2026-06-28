// SINGLE SOURCE OF TRUTH POLICY
// DO NOT BYPASS
export const AI_ARCHITECTURE_RULES = {
  learningSource: "AI_DECISION_CORE",
  forbiddenSources: [
    "injectLearningSignal",
    "syncCrossFlowLearning",
    "localHeuristics",
    "flowLevelBias"
  ]
};
