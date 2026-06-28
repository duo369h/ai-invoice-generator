/**
 * Corvioz — Revenue Semantic Debug Panel (DEV ONLY)
 *
 * Outputs the full semantic state of the current revenue UI for debugging.
 *
 * ⚠️  NOT for production use. Only enabled when NODE_ENV !== "production".
 */

import type { RevenueUIAdapter } from "../core/revenue/REVENUE_ADAPTER_LAYER.ts";
import type { SemanticValidationResult } from "../core/semantic/REVENUE_SEMANTIC_VALIDATOR.ts";

export interface SemanticDebugState {
  uiState: RevenueUIAdapter;
  violations: string[];
  correctedUI?: RevenueUIAdapter;
  confidenceScore: number;
  timestamp: string;
}

export function getSemanticDebugPanel(
  uiState: RevenueUIAdapter,
  validation: SemanticValidationResult
): SemanticDebugState | null {
  if (process.env.NODE_ENV === "production") return null;

  return {
    uiState,
    violations: validation.violations,
    correctedUI: validation.corrected,
    confidenceScore: uiState.semanticScore,
    timestamp: new Date().toISOString(),
  };
}

export function logSemanticDebug(
  uiState: RevenueUIAdapter,
  validation: SemanticValidationResult
): void {
  if (process.env.NODE_ENV === "production") return;

  const panel = getSemanticDebugPanel(uiState, validation);
  if (!panel) return;

  console.group("[CORVIOZ] Revenue Semantic Debug Panel");
  console.log("UI State:", panel.uiState);
  console.log("Semantic Score:", panel.confidenceScore.toFixed(2));
  if (panel.violations.length > 0) {
    console.warn("Violations:", panel.violations);
    if (panel.correctedUI) {
      console.warn("Corrected UI applied:", panel.correctedUI);
    }
  } else {
    console.log("✔ No semantic violations");
  }
  console.groupEnd();
}
