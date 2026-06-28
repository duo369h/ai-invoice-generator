import { NextResponse } from 'next/server';
import { createServiceSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase';
import { requireInternalAdmin } from '../../../lib/internal-admin';
import { generateSyntheticUserSessions } from '../../../lib/simulation/user-behavior-simulator';
import { simulateRevenueOutcome, MonetizationRuleMode } from '../../../lib/simulation/revenue-simulator';
import {
  evaluateRevenueDecision,
  computeUserRevenueTruth,
  computeUserBehaviorSignals
} from '../../../../../lib/monetization/revenue-decision-engine';
import { simulateRevenueScenario } from '../../../../../lib/monetization/autonomous-revenue-engine';
import { getUpgradeDecision } from '../../../../../lib/monetization/upgradeTriggerEngine';
import { computeUpgradeScores } from '../../../../../lib/monetization/upgradeScoringEngine';

export async function POST(request: Request) {
  try {
    const gate = await requireInternalAdmin(request);
    if (gate.response) return gate.response;
    const body = await request.json().catch(() => ({}));
    
    // Inputs
    const userCount = Number(body.user_count ?? 1000);
    const scenario = String(body.scenario || 'balanced'); // 'aggressive' | 'balanced' | 'soft' | 'freemium'
    const pricingTiers = body.pricing || { low: 9, standard: 19, premium: 29 };
    const pricingModel = String(body.pricing_model || 'freemium'); // 'freemium' | 'trial' | 'usage_based_limits'
    const usageLimit = Number(body.usage_limit ?? 5);

    // 1. Establish database context or synthetic events
    let dbEvents: any[] = [];
    if (isSupabaseConfigured()) {
      const supabase = createServiceSupabaseClient();
      if (supabase) {
        const { data } = await supabase
          .from('revenue_events')
          .select('*')
          .limit(200);
        if (data) {
          dbEvents = data;
        }
      }
    }

    // 2. Generate synthetic sessions for baseline simulation
    let ruleMode: MonetizationRuleMode = 'balanced';
    if (scenario === 'aggressive') ruleMode = 'aggressive';
    else if (scenario === 'soft') ruleMode = 'soft';
    else if (scenario === 'freemium') ruleMode = 'soft';

    const sessions = generateSyntheticUserSessions({ users: userCount });

    // 3. Evaluate baseline outcome
    const outcome = simulateRevenueOutcome({
      sessions,
      monetization_rule: ruleMode,
      pricing_tiers: pricingTiers
    });

    const MODEL_REVENUE_MULTIPLIER: Record<string, number> = {
      freemium: 0.92,
      trial: 1.08,
      usage_based_limits: 1.00,
    };
    const multiplier = MODEL_REVENUE_MULTIPLIER[pricingModel] || 1.0;
    
    const adjustedRevenue = Math.round(outcome.revenue * multiplier * 100) / 100;
    const adjustedConversions = Math.round(outcome.conversions * (pricingModel === 'trial' ? 1.05 : pricingModel === 'freemium' ? 0.95 : 1.0));
    const finalConversions = Math.min(outcome.total_users, adjustedConversions);
    const finalConversionRate = outcome.total_users > 0 ? (finalConversions / outcome.total_users) : 0;
    const finalArpu = outcome.total_users > 0 ? Math.round((adjustedRevenue / outcome.total_users) * 100) / 100 : 0;

    // 4. Run the v4.5 + v5 Engines
    // Create typical signals based on inputs to evaluate recommendation
    const sampleSignals = {
      invoice_count: usageLimit + 1,
      quote_count: Math.round(usageLimit / 2),
      export_count: scenario === 'aggressive' ? 8 : scenario === 'balanced' ? 4 : 1,
      pricing_view_count: scenario === 'aggressive' ? 4 : 2,
      scroll_depth: 80,
      return_user_frequency: scenario === 'aggressive' ? 6 : 2,
      is_authenticated: true,
      plan: 'free'
    };

    // Calculate score using v2 Scoring Engine
    const scoringInputs = {
      usage: {
        invoice_count: sampleSignals.invoice_count,
        quote_count: sampleSignals.quote_count,
        export_count: sampleSignals.export_count
      },
      behavior: {
        scroll_depth: sampleSignals.scroll_depth,
        return_user_frequency: sampleSignals.return_user_frequency
      },
      session: {
        pricing_view_count: sampleSignals.pricing_view_count
      },
      intent: {},
      current_plan: sampleSignals.plan,
      is_authenticated: sampleSignals.is_authenticated
    };

    const scores = computeUpgradeScores(scoringInputs);
    // Calculate v3 Upgrade Trigger Decision
    const v3Decision = getUpgradeDecision(sampleSignals, { suppressTracking: true });
    // Calculate v4 Truth
    const truth = computeUserRevenueTruth(sampleSignals, scores);
    // Calculate Behavior
    const behavior = computeUserBehaviorSignals(sampleSignals);
    // Calculate v4.5 Decision Layer Recommendations
    const decision = evaluateRevenueDecision(truth, behavior, v3Decision, {
      growth_export_threshold: usageLimit
    });

    // Translate UI pressure from scenario
    const pressureLevel = scenario === 'aggressive' ? 'modal' : scenario === 'soft' ? 'soft_banner' : 'checkout_nudge';

    // Calculate v5 Sandbox Simulation
    const v5Simulation = simulateRevenueScenario(truth, decision, dbEvents, {
      proposed_prices: {
        pro: pricingTiers.standard,
        growth: pricingTiers.premium,
        studio: 99
      },
      pressure_level: pressureLevel
    });

    // 5. Build funnel steps: Landing -> Signup -> Invoice -> Quote -> Payment
    let landingCount = outcome.total_users;
    let signupCount = Math.round(landingCount * 0.78);
    let invoiceCount = Math.round(signupCount * 0.65);
    
    const quoteFriction = scenario === 'aggressive' ? 0.50 : scenario === 'balanced' ? 0.70 : 0.85;
    let quoteCount = Math.round(invoiceCount * quoteFriction);
    
    if (usageLimit < 5) {
      quoteCount = Math.round(quoteCount * (usageLimit / 5));
    }
    
    let paymentCount = Math.min(quoteCount, finalConversions);
    if (finalConversions > 0 && paymentCount === 0) {
      paymentCount = Math.min(quoteCount || 1, finalConversions);
    }

    const funnel = [
      { step: 'Landing', count: landingCount, label: 'Visits' },
      { step: 'Signup', count: signupCount, label: 'Registrations' },
      { step: 'Invoice', count: invoiceCount, label: 'Invoices Created' },
      { step: 'Quote', count: quoteCount, label: 'Quotes Created' },
      { step: 'Payment', count: paymentCount, label: 'Paid Subscriptions' },
    ];

    let maxDropOff = -1;
    let bottleneckIndex = -1;
    
    const funnelWithDropOffs = funnel.map((step, idx) => {
      let dropOff = 0;
      if (idx > 0) {
        const prevCount = funnel[idx - 1].count;
        dropOff = prevCount > 0 ? (prevCount - step.count) / prevCount : 0;
        if (dropOff > maxDropOff) {
          maxDropOff = dropOff;
          bottleneckIndex = idx;
        }
      }
      return {
        ...step,
        drop_off_rate: Math.round(dropOff * 100),
      };
    });

    const funnelWithBottlenecks = funnelWithDropOffs.map((step, idx) => ({
      ...step,
      is_bottleneck: idx === bottleneckIndex,
    }));

    // 6. Calculate curve data for "What if" Mode
    const volumes = [100, 1000, 10000];
    const curve: Record<number, any> = {};

    volumes.forEach((vol) => {
      const volSessions = generateSyntheticUserSessions({ users: vol });
      const volOutcome = simulateRevenueOutcome({
        sessions: volSessions,
        monetization_rule: ruleMode,
        pricing_tiers: pricingTiers
      });
      const volRevenue = Math.round(volOutcome.revenue * multiplier * 100) / 100;
      const volConversions = Math.round(volOutcome.conversions * (pricingModel === 'trial' ? 1.05 : pricingModel === 'freemium' ? 0.95 : 1.0));
      const volFinalConversions = Math.min(vol, volConversions);

      curve[vol] = {
        users: vol,
        revenue: volRevenue,
        conversions: volFinalConversions,
        conversion_rate: vol > 0 ? Math.round((volFinalConversions / vol) * 1000) / 10 : 0,
      };
    });

    return NextResponse.json({
      success: true,
      projected_mrr: adjustedRevenue,
      conversion_rate: Math.round(finalConversionRate * 1000) / 10,
      arpu: finalArpu,
      conversions: finalConversions,
      total_users: outcome.total_users,
      funnel: funnelWithBottlenecks,
      curve,
      v4_5_decision: decision,
      v5_simulation: v5Simulation
    });
  } catch (error: any) {
    console.error('Simulation API failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal simulation error',
    }, { status: 500 });
  }
}
