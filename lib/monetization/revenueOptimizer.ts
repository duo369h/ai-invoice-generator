/**
 * Revenue Optimizer Engine — Corvioz v3
 *
 * Analyzes conversion funnel data and dynamically tunes pricing thresholds,
 * scoring weights, offer types, and paywall pressure levels.
 *
 * Supports batch optimization triggered client-side periodically.
 */

import { getRevenueEventsFromStorage, RevenueEvent } from './revenueFeedbackCollector';
import { updateEngineConfig } from './upgradeTriggerEngine';

export interface EngineConfig {
  thresholds: {
    pro_invoice_count: number;
    pro_export_count: number;
    growth_invoice_count: number;
    growth_quote_count: number;
    studio_export_count: number;
    studio_return_frequency: number;
  };
  weights: {
    usage_multiplier: number;
    behavior_multiplier: number;
    intent_multiplier: number;
    churn_risk_multiplier: number;
  };
  ui_pressure: 'soft' | 'modal' | 'hard';
  cta_strategy: 'value' | 'urgency' | 'benefit';
  last_optimized_at: string;
  version: number;
}

export const DEFAULT_CONFIG: EngineConfig = {
  thresholds: {
    pro_invoice_count: 3,
    pro_export_count: 1,
    growth_invoice_count: 10,
    growth_quote_count: 5,
    studio_export_count: 20,
    studio_return_frequency: 5,
  },
  weights: {
    usage_multiplier: 1.0,
    behavior_multiplier: 1.0,
    intent_multiplier: 1.0,
    churn_risk_multiplier: 1.0,
  },
  ui_pressure: 'soft',
  cta_strategy: 'value',
  last_optimized_at: new Date(0).toISOString(),
  version: 1,
};

const OPTIMIZED_CONFIG_KEY = 'corvioz_optimized_revenue_config';
const BATCH_EVENT_THRESHOLD = 5; // optimize every 5 events or 24 hours

/**
 * Pure function: Computes the next optimized EngineConfig based on collected events
 */
export function calculateOptimization(
  events: RevenueEvent[],
  currentConfig: EngineConfig
): EngineConfig {
  if (events.length === 0) return currentConfig;

  // 1. Group events by type
  let offerShown = 0;
  let ctaClick = 0;
  let checkoutStart = 0;
  let paymentSuccess = 0;
  let paymentFailed = 0;
  let dropOff = 0;

  // Track conversions per trigger type
  const shownByTriggerType: Record<string, number> = {};
  const successByTriggerType: Record<string, number> = {};

  for (const e of events) {
    if (e.event_name === 'offer_shown') {
      offerShown++;
      if (e.trigger_type) {
        shownByTriggerType[e.trigger_type] = (shownByTriggerType[e.trigger_type] || 0) + 1;
      }
    } else if (e.event_name === 'cta_click') {
      ctaClick++;
    } else if (e.event_name === 'checkout_start') {
      checkoutStart++;
    } else if (e.event_name === 'payment_success') {
      paymentSuccess++;
      // Check if e.properties contains trigger_type
      const trig = e.properties?.trigger_type || e.trigger_type;
      if (trig) {
        successByTriggerType[trig] = (successByTriggerType[trig] || 0) + 1;
      }
    } else if (e.event_name === 'payment_failed') {
      paymentFailed++;
    } else if (e.event_name === 'drop_off') {
      dropOff++;
    }
  }

  // 2. Conversion and funnel drop-off rates
  const clickThroughRate = offerShown > 0 ? ctaClick / offerShown : 0;
  const overallConversionRate = offerShown > 0 ? paymentSuccess / offerShown : 0;
  const dropOffRate = offerShown > 0 ? dropOff / offerShown : 0;

  // Start with current values to tweak
  const nextConfig = {
    ...currentConfig,
    thresholds: { ...currentConfig.thresholds },
    weights: { ...currentConfig.weights },
    version: currentConfig.version + 1,
  };

  // 3. Optimization Rules: Thresholds and UI Pressure
  // Goal: Maximize conversions while keeping drop-offs reasonable.
  if (offerShown >= 10) {
    if (overallConversionRate < 0.02) {
      // High drop-off or low conversion: Paywall might be too aggressive/early
      // Increase thresholds by +1 to let users experience product value first
      nextConfig.thresholds.pro_invoice_count = Math.min(5, currentConfig.thresholds.pro_invoice_count + 1);
      nextConfig.thresholds.pro_export_count = Math.min(3, currentConfig.thresholds.pro_export_count + 1);
      
      // Dial back UI pressure to rebuild trust/reduce churn risk
      if (currentConfig.ui_pressure === 'hard') {
        nextConfig.ui_pressure = 'modal';
      } else if (currentConfig.ui_pressure === 'modal') {
        nextConfig.ui_pressure = 'soft';
      }
      
      // Shift copywriting strategy to value/benefit explanation
      nextConfig.cta_strategy = 'benefit';
    } else if (overallConversionRate > 0.06) {
      // High conversion rate: Users have high willingness to pay!
      // Tighten thresholds to accelerate monetization
      nextConfig.thresholds.pro_invoice_count = Math.max(2, currentConfig.thresholds.pro_invoice_count - 1);
      nextConfig.thresholds.pro_export_count = Math.max(1, currentConfig.thresholds.pro_export_count - 1);
      
      // Escalate UI pressure to drive checkout conversion
      if (currentConfig.ui_pressure === 'soft') {
        nextConfig.ui_pressure = 'modal';
      } else if (currentConfig.ui_pressure === 'modal') {
        nextConfig.ui_pressure = 'hard';
      }
      
      // Leverage urgency wording
      nextConfig.cta_strategy = 'urgency';
    }
  }

  // 4. Optimization Rules: Scoring Multipliers (Weights)
  // Increase multipliers for trigger channels that perform better
  const triggerTypes = ['usage', 'intent', 'risk', 'revenue_opportunity'];
  for (const t of triggerTypes) {
    const shown = shownByTriggerType[t] || 0;
    const success = successByTriggerType[t] || 0;
    const rate = shown > 0 ? success / shown : 0;

    if (shown >= 3) {
      const multiplierAdjustment = rate > 0.05 ? 0.15 : rate < 0.015 ? -0.1 : 0;
      
      if (t === 'usage') {
        nextConfig.weights.usage_multiplier = Math.max(0.5, Math.min(2.0, currentConfig.weights.usage_multiplier + multiplierAdjustment));
      } else if (t === 'intent') {
        nextConfig.weights.intent_multiplier = Math.max(0.5, Math.min(2.0, currentConfig.weights.intent_multiplier + multiplierAdjustment));
      } else if (t === 'risk') {
        nextConfig.weights.churn_risk_multiplier = Math.max(0.5, Math.min(2.0, currentConfig.weights.churn_risk_multiplier + multiplierAdjustment));
      } else if (t === 'revenue_opportunity') {
        nextConfig.weights.behavior_multiplier = Math.max(0.5, Math.min(2.0, currentConfig.weights.behavior_multiplier + multiplierAdjustment));
      }
    }
  }

  return nextConfig;
}

/**
 * Retrieve current active optimizer config
 */
export function getActiveOptimizerConfig(): EngineConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const stored = window.localStorage.getItem(OPTIMIZED_CONFIG_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('[REVENUE OPTIMIZER] Failed to read optimizer config:', e);
  }
  return DEFAULT_CONFIG;
}

/**
 * Persist optimized configuration
 */
export function saveOptimizerConfig(config: EngineConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(OPTIMIZED_CONFIG_KEY, JSON.stringify(config));
    // Apply updates to the UpgradeTriggerEngine immediately
    updateEngineConfig(config);
  } catch (e) {
    console.warn('[REVENUE OPTIMIZER] Failed to write optimizer config:', e);
  }
}

/**
 * Core loop orchestrator: Runs periodic batch optimization.
 * Can be called during page view, layout mount, or after a telemetry event.
 */
export function optimizeRevenueLoop(force = false): void {
  if (typeof window === 'undefined') return;

  try {
    const currentConfig = getActiveOptimizerConfig();
    const events = getRevenueEventsFromStorage();

    // Check time condition (24 hours)
    const lastOptTime = new Date(currentConfig.last_optimized_at).getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const timeCondition = Date.now() - lastOptTime > oneDayInMs;

    // Check event count condition
    // We count events created since last_optimized_at
    const newEvents = events.filter(
      (e) => new Date(e.created_at).getTime() > lastOptTime
    );
    const countCondition = newEvents.length >= BATCH_EVENT_THRESHOLD;

    if (force || timeCondition || countCondition) {
      console.info(
        `[REVENUE OPTIMIZER] Running optimization. New events: ${newEvents.length}, Time elapsed: ${timeCondition}`
      );

      const optimized = calculateOptimization(events, currentConfig);
      optimized.last_optimized_at = new Date().toISOString();

      saveOptimizerConfig(optimized);
    } else {
      // Still apply currentConfig to engine runtime config
      updateEngineConfig(currentConfig);
    }
  } catch (err) {
    console.error('[REVENUE OPTIMIZER] Optimization loop failed:', err);
  }
}
