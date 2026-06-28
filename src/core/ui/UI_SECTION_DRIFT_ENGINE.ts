/**
 * Corvioz — UI Section Drift Engine
 *
 * Bounded local section adaptation only.
 */

import type { Section } from "./UI_GRAPH_CONTRACT.ts";

export type SectionDriftAuthority = {
  allowedActions?: {
    reorder?: boolean;
    emphasisShift?: boolean;
    visibilitySoftToggle?: boolean;
  };
  constraints?: {
    maxDriftScore?: number;
  };
};

function bounded(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function drift(section: Section, authority: SectionDriftAuthority = {}): Section {
  const maxDriftScore = bounded(Number(authority.constraints?.maxDriftScore ?? 0), 0, 1);
  const driftPriority = Math.round(maxDriftScore * 10);
  const currentPriority = Number(section.uiDecision?.priority || 0);
  const currentEmphasis = Number(section.props?.emphasisWeight || 1);

  return {
    ...section,
    props: {
      ...section.props,
      emphasisWeight: authority.allowedActions?.emphasisShift
        ? bounded(currentEmphasis + maxDriftScore * 0.25, 0.75, 1.5)
        : currentEmphasis,
    },
    uiDecision: {
      ...section.uiDecision,
      priority: authority.allowedActions?.reorder
        ? bounded(currentPriority + driftPriority, 0, 100)
        : currentPriority,
      visibility: authority.allowedActions?.visibilitySoftToggle
        ? section.uiDecision?.visibility !== false
        : section.uiDecision?.visibility,
    },
  };
}
