/**
 * Corvioz — Orchestrator (Pure Composer)
 *
 * The Orchestrator is a PURE COMPOSER: delegates entirely to the
 * Interpretation Engine. Revenue Intelligence is already embedded in
 * SystemView.uiHints.revenueUI — no duplicate computation here.
 *
 * Architecture:
 *   Growth → Kernel → Revenue Adapter → Interpretation Engine → Orchestrator → Route
 *
 * Rules:
 *   - Orchestrator NEVER contains routing logic
 *   - Orchestrator NEVER reads Growth signals directly
 *   - Orchestrator NEVER reads Kernel directly
 *   - Orchestrator NEVER re-computes Revenue Intelligence
 *   - Single source: getSystemView() from Interpretation Engine
 */

import { getSystemView } from "./CORVIOZ_INTERPRETATION_ENGINE.ts";
import type { SystemView } from "./CORVIOZ_INTERPRETATION_ENGINE.ts";

export type OrchestratorResult = {
  route: SystemView["route"];
  reason: string;
  killSwitchActive: boolean;
  systemView: SystemView;
};

export function getNextRoute(userState: any = {}): OrchestratorResult {
  const view = getSystemView(userState);

  return {
    route: view.route,
    reason: view.kernelDecision.reason,
    killSwitchActive: view.kernelDecision.killSwitchActive,
    systemView: view,
  };
}
