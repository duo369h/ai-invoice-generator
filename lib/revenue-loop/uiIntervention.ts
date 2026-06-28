/**
 * Revenue Optimization Loop - UI Interventions — Corvioz v8
 *
 * Applies safe layout parameters (pricing card order, card visibility) without bypassing safety limits.
 */

import { UIDecisionOutput } from '../execution/index';
import { InterventionSignals } from './revenueEngine';
import { ARPUOptimizationOutput } from './arpuOptimizer';

export interface RevenueLoopOutput {
  funnelStage: string;
  opportunity: InterventionSignals;
  arpuUplift: ARPUOptimizationOutput;
}

/**
 * Generates and applies safe UI adjustments on top of base decisions.
 * MUST NOT override base deterministic target plan or shouldShowUpgrade flags.
 */
export function applyUIInterventions(
  baseDecision: UIDecisionOutput,
  opportunity: InterventionSignals,
  arpu: ARPUOptimizationOutput,
  funnelStage: string
): UIDecisionOutput {
  console.log('[REVENUE_LOOP_UI] Applying interventions to base decision...');

  // Safe UI Adjustments (additive properties only)
  const ui = {
    ...baseDecision.ui,
    planOrder: ['free', 'pro', 'growth', 'studio'], // Default order
    pricingCardHighlight: baseDecision.ui.highlightPlan,
    dashboardCardVisible: false,
    ctaState: baseDecision.ui.ctaState,
  };

  // 1. Pricing card ordering: Move recommended plan to the front
  if (baseDecision.targetPlan) {
    const recommended = baseDecision.targetPlan;
    ui.planOrder = [
      recommended,
      ...['free', 'pro', 'growth', 'studio'].filter((p) => p !== recommended),
    ];
  }

  // 2. CTA Emphasis: Boost CTA emphasis for high uplift opportunities
  if (opportunity.opportunityDetected && arpu.expectedUplift > 5.0) {
    ui.ctaState = 'emphasized';
  }

  // 3. Dashboard card visibility: Show educational cards for near-conversion/active users
  if (funnelStage === 'near_conversion' || funnelStage === 'active') {
    ui.dashboardCardVisible = true;
  }

  // Add revenue loop metadata strictly as additive properties
  const revenueLoopMetadata: RevenueLoopOutput = {
    funnelStage,
    opportunity,
    arpuUplift: arpu,
  };

  return {
    ...baseDecision,
    ui: {
      ...ui,
    },
    // Additive property ONLY
    revenueLoop: revenueLoopMetadata,
  };
}
