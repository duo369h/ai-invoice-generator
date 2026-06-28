import { NextResponse } from 'next/server';
import { requireInternalAdmin } from '../../../lib/internal-admin';
import { generateSyntheticUserSessions } from '../../../lib/simulation/user-behavior-simulator';
import { simulateRevenueOutcome } from '../../../lib/simulation/revenue-simulator';

const RECOMMENDATIONS = [
  {
    id: 'pricing',
    title: 'Standard & Premium Price Increase',
    type: 'pricing',
    description: 'Increase Standard plan standard price from $19 to $24 and Premium price from $29 to $39 based on high willingness-to-pay intent scores.',
    expected_revenue_change: 18,
    conversion_rate_change: -2,
    details: {
      old_pricing: { standard: 19, premium: 29 },
      new_pricing: { standard: 24, premium: 39 },
      reason: 'Value scores exceed 80 on 45% of user workspaces.'
    }
  },
  {
    id: 'paywall',
    title: 'Soft Watermarked PDF Exports',
    type: 'paywall',
    description: 'Switch PDF exports from standard balanced hard blocking to soft watermark upsell triggers to capture low-intent users before paywall pressure.',
    expected_revenue_change: 8,
    conversion_rate_change: 12,
    details: {
      old_strategy: 'Balanced (Hard Block)',
      new_strategy: 'Soft (Watermarked PDF)',
      reason: 'Reduces export step drop-offs by up to 25%.'
    }
  },
  {
    id: 'funnel',
    title: 'Onboarding Invoice Template Presets',
    type: 'funnel',
    description: 'Inject customizable template presets on signup to reduce invoice creation drop-off from 35% to 20% by minimizing friction.',
    expected_revenue_change: 14,
    conversion_rate_change: 8,
    details: {
      old_dropoff: '35% drop-off',
      new_dropoff: '20% drop-off',
      reason: 'Boosts invoice activation by pre-filling layout styles.'
    }
  }
];

function runSingleSimulation({ users, rule, pricing, pricingModel, funnelOptimization }) {
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
  
  const invoiceConversionRate = funnelOptimization ? 0.80 : 0.65;
  let invoiceCount = Math.round(signupCount * invoiceConversionRate);
  
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
    
    // Check if we are simulating a specific suggestion
    const simulateId = body.simulate_id; // 'pricing' | 'paywall' | 'funnel'
    const userCount = Number(body.user_count ?? 1000);

    if (simulateId) {
      // 1. Run Baseline (Before)
      const beforePricing = { low: 9, standard: 19, premium: 29 };
      const beforeRule = 'balanced';
      const beforePricingModel = 'trial';
      const before = runSingleSimulation({
        users: userCount,
        rule: beforeRule,
        pricing: beforePricing,
        pricingModel: beforePricingModel,
        funnelOptimization: false
      });

      // 2. Run After based on the selected recommendation
      let afterPricing = { ...beforePricing };
      let afterRule = beforeRule;
      let afterPricingModel = beforePricingModel;
      let afterFunnelOpt = false;

      if (simulateId === 'pricing') {
        afterPricing = { low: 9, standard: 24, premium: 39 };
      } else if (simulateId === 'paywall') {
        afterRule = 'soft';
        afterPricingModel = 'freemium';
      } else if (simulateId === 'funnel') {
        afterFunnelOpt = true;
      }

      const after = runSingleSimulation({
        users: userCount,
        rule: afterRule,
        pricing: afterPricing,
        pricingModel: afterPricingModel,
        funnelOptimization: afterFunnelOpt
      });

      return NextResponse.json({
        success: true,
        simulate_id: simulateId,
        before,
        after,
      });
    }

    // Default: return lists of recommendations
    return NextResponse.json({
      success: true,
      recommendations: RECOMMENDATIONS,
    });
  } catch (error) {
    console.error('Optimization API failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal optimization error',
    }, { status: 500 });
  }
}
