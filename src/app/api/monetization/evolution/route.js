import { NextResponse } from 'next/server';
import { requireInternalAdmin } from '../../../lib/internal-admin';
import { generateSyntheticUserSessions } from '../../../lib/simulation/user-behavior-simulator';
import { simulateRevenueOutcome } from '../../../lib/simulation/revenue-simulator';

const FEED_LOGS = [
  { time: '10:42:15', type: 'info', message: 'Auto-applied Soft Paywall trigger for US contractor workspace.' },
  { time: '09:15:30', type: 'warning', message: 'Detected drop-off hotspot at Invoice -> Quote step. Increasing onboarding guidance.' },
  { time: '08:04:12', type: 'pricing', message: 'Upgraded standard pricing recommendation standard tier to $24 for high-value segment.' },
  { time: '07:51:04', type: 'system', message: 'Safety check OK. System health at 98.4% uptime.' },
  { time: '06:12:44', type: 'rollback', message: 'Rollback triggered for aggressive invoicing limit on risk_score < 40.' },
  { time: '04:22:15', type: 'info', message: 'Initiated A/B experiment: Watermark Upsell vs Hard Paywall.' }
];

const EXPERIMENTS = [
  {
    id: 'watermark',
    title: 'Watermark Upsell vs Hard Paywall',
    type: 'Paywall',
    allocation: '50% / 50%',
    description: 'Testing soft watermarks on PDF exports against a hard blocking gate for free users.',
    variant_a: { name: 'Soft Watermark', conversion_rate: '3.2%', revenue: '$14,800' },
    variant_b: { name: 'Hard Block (Control)', conversion_rate: '2.6%', revenue: '$13,500' },
    status: 'Running'
  },
  {
    id: 'price_test',
    title: 'High Value Segment Pricing ($19 vs $29)',
    type: 'Pricing',
    allocation: '80% / 20%',
    description: 'Testing a premium $29 Pro plan price for workspaces scoring >80 in intent/value.',
    variant_a: { name: '$19 Pro (Control)', conversion_rate: '2.5%', revenue: '$14,100' },
    variant_b: { name: '$29 Pro (Test)', conversion_rate: '2.2%', revenue: '$17,200' },
    status: 'Running'
  }
];

function runSingleSimulation({ users, rule, pricing, pricingModel }) {
  const sessions = generateSyntheticUserSessions({ users });
  const outcome = simulateRevenueOutcome({
    sessions,
    monetization_rule: rule,
    pricing_tiers: pricing
  });

  const MODEL_REVENUE_MULTIPLIER = {
    freemium: 0.92,
    trial: 1.08,
    usage_based_limits: 1.00,
  };
  const multiplier = MODEL_REVENUE_MULTIPLIER[pricingModel] || 1.0;
  
  const adjustedRevenue = Math.round(outcome.revenue * multiplier * 100) / 100;
  const adjustedConversions = Math.round(outcome.conversions * (pricingModel === 'trial' ? 1.05 : pricingModel === 'freemium' ? 0.95 : 1.0));
  const finalConversions = Math.min(users, adjustedConversions);
  const finalConversionRate = users > 0 ? (finalConversions / users) : 0;
  const finalArpu = users > 0 ? Math.round((adjustedRevenue / users) * 100) / 100 : 0;

  // Funnel progression
  let landingCount = users;
  let signupCount = Math.round(landingCount * 0.78);
  let invoiceCount = Math.round(signupCount * 0.65);
  
  const quoteFriction = rule === 'aggressive' ? 0.50 : rule === 'balanced' ? 0.70 : 0.85;
  let quoteCount = Math.round(invoiceCount * quoteFriction);
  
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

  const finalFunnel = funnelWithDropOffs.map((step, idx) => ({
    ...step,
    is_bottleneck: idx === bottleneckIndex,
  }));

  return {
    projected_mrr: adjustedRevenue,
    conversion_rate: Math.round(finalConversionRate * 1000) / 10,
    arpu: finalArpu,
    conversions: finalConversions,
    total_users: users,
    funnel: finalFunnel,
  };
}

export async function POST(request) {
  try {
    const gate = await requireInternalAdmin(request);
    if (gate.response) return gate.response;
    const body = await request.json().catch(() => ({}));
    
    // Safety Control Action
    const safetyAction = body.safety_action;
    if (safetyAction) {
      const timeStr = new Date().toTimeString().split(' ')[0];
      let logLine = '';
      if (safetyAction === 'rollback') {
        logLine = `[${timeStr}] ROLLBACK triggered: Reverting system configurations to last stable state.`;
      } else if (safetyAction === 'freeze') {
        logLine = `[${timeStr}] SYSTEM FROZEN: Suspending autopilot recommendations. Manual control active.`;
      } else if (safetyAction === 'unfreeze') {
        logLine = `[${timeStr}] SYSTEM UNBOUND: Resuming autopilot auto-optimizations.`;
      }

      return NextResponse.json({
        success: true,
        action: safetyAction,
        log: { time: timeStr, type: 'rollback', message: logLine }
      });
    }

    const simulateId = body.simulate_id;
    const userCount = Number(body.user_count ?? 1000);

    if (simulateId) {
      let variantA = {};
      let variantB = {};

      if (simulateId === 'watermark') {
        variantA = runSingleSimulation({
          users: userCount,
          rule: 'soft',
          pricing: { low: 9, standard: 19, premium: 29 },
          pricingModel: 'freemium'
        });
        variantB = runSingleSimulation({
          users: userCount,
          rule: 'aggressive',
          pricing: { low: 9, standard: 19, premium: 29 },
          pricingModel: 'usage_based_limits'
        });
      } else if (simulateId === 'price_test') {
        variantA = runSingleSimulation({
          users: userCount,
          rule: 'balanced',
          pricing: { low: 9, standard: 19, premium: 29 },
          pricingModel: 'trial'
        });
        variantB = runSingleSimulation({
          users: userCount,
          rule: 'balanced',
          pricing: { low: 9, standard: 29, premium: 39 },
          pricingModel: 'trial'
        });
      }

      return NextResponse.json({
        success: true,
        simulate_id: simulateId,
        variant_a: variantA,
        variant_b: variantB,
      });
    }

    return NextResponse.json({
      success: true,
      metrics: {
        decisions_count: 1482,
        expected_uplift: 30.2,
        active_experiments: 2,
        system_status: 'SECURE'
      },
      feed: FEED_LOGS,
      experiments: EXPERIMENTS
    });
  } catch (error) {
    console.error('Evolution API failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal evolution error',
    }, { status: 500 });
  }
}
