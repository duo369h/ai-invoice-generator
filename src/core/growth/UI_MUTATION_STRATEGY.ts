export const MutationStrategy = {
  AGGRESSIVE: "maximize revenue now",
  BALANCED: "optimize conversion",
  SAFE: "minimize UI disruption",
} as const;

export type MutationStrategyKey = keyof typeof MutationStrategy;
export type MutationStrategyValue = (typeof MutationStrategy)[MutationStrategyKey];
