/**
 * Corvioz Dashboard UI Graph
 */

import { UI_CONTROL_PLANE } from "./UI_CONTROL_PLANE.ts";
import type { UIGraph } from "./UI_GRAPH_CONTRACT.ts";

export function getDashboardUI(rawData: any = {}): UIGraph {
  return UI_CONTROL_PLANE.execute(rawData);
}

export function getFeedUI(rawData: any = {}): any {
  return getDashboardUI(rawData).feedUI;
}

export function getOnboardingUI(rawData: any = {}): any {
  return getDashboardUI(rawData).onboardingUI;
}
