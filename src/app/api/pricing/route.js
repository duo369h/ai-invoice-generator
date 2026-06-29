// This is NOT a feature hierarchy system.
// This is a revenue track system.
// Each tier is an independent product experience.
// No cross-tier dependency is allowed.

import { NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '../../lib/supabase';

// Static fallback plans if the database table pricing_plans is not yet initialized
const FALLBACK_PLANS = [
  {
    id: 'free',
    name: 'Free',
    description: 'Try the core tools before you commit.',
    price_monthly: 0.00,
    price_yearly: 0.00,
    paddle_monthly_price_id: '',
    paddle_yearly_price_id: '',
    features: [
      'Draft quotes and estimates',
      'Basic profile creation',
      'Watermarked PDF exports'
    ],
    badge_text: 'Try',
    display_order: 1,
    active: true
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Get your first client faster',
    price_monthly: 9.00,
    price_yearly: 7.00,
    paddle_monthly_price_id: 'pri_starter_placeholder',
    paddle_yearly_price_id: 'pri_starter_yearly_placeholder',
    features: [
      '1 proposal/day & 1 profile/day',
      'Watermark preview enabled',
      'Export disabled'
    ],
    badge_text: 'Starter',
    display_order: 2,
    active: true
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Start getting paid professionally',
    price_monthly: 19.00,
    price_yearly: 16.00,
    paddle_monthly_price_id: 'pri_pro_placeholder',
    paddle_yearly_price_id: 'pri_pro_yearly_placeholder',
    features: [
      'Unlimited proposals & profiles',
      'Secure PDF export (No watermark)',
      'Share client links instantly'
    ],
    badge_text: 'Recommended',
    display_order: 3,
    active: true
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'Scale client operations',
    price_monthly: 0.00,
    price_yearly: 0.00,
    paddle_monthly_price_id: '',
    paddle_yearly_price_id: '',
    features: [
      'Brand client workspaces under your custom domain',
      'Qualify inbound inquiries with budget filters',
      'Present specialist team members to secure larger contracts'
    ],
    badge_text: 'Coming Soon',
    display_order: 4,
    active: true
  }
];

function hasPlaceholderPriceId(value) {
  const priceId = String(value || '').trim().toLowerCase();
  return !priceId || priceId.includes('placeholder') || priceId.startsWith('pri_') && priceId.includes('_placeholder');
}

export async function GET() {
  try {
    const supabase = createServiceSupabaseClient();
    let plans = [];

    if (supabase) {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        plans = data;
      } else {
        console.warn('pricing_plans table query failed or returned empty; using fallback plans. Error:', error?.message);
        plans = FALLBACK_PLANS;
      }
    } else {
      plans = FALLBACK_PLANS;
    }

    const STRICT_PLAN_IDS = ['free', 'starter', 'pro', 'studio'];
    const filteredPlans = [];
    const seenIds = new Set();
    
    for (const id of STRICT_PLAN_IDS) {
      let plan = plans.find((p) => p.id === id);
      if (!plan) {
        plan = FALLBACK_PLANS.find((p) => p.id === id);
      }
      if (plan && !seenIds.has(plan.id)) {
        seenIds.add(plan.id);
        filteredPlans.push(plan);
      }
    }

    // Dynamic mapping of price IDs from environment variables if present
    const mappedPlans = filteredPlans.map(plan => {
      const starterPrice = process.env.NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID;
      const starterYearlyPrice = process.env.NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID;
      const proPrice = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID;
      const proYearlyPrice = process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID;

      let paddle_monthly_price_id = plan.paddle_monthly_price_id;
      let paddle_yearly_price_id = plan.paddle_yearly_price_id;

      if (plan.id === 'starter') {
        if (starterPrice) paddle_monthly_price_id = starterPrice;
        if (starterYearlyPrice) paddle_yearly_price_id = starterYearlyPrice;
      } else if (plan.id === 'pro') {
        if (proPrice) paddle_monthly_price_id = proPrice;
        if (proYearlyPrice) paddle_yearly_price_id = proYearlyPrice;
      } else if (plan.id === 'studio') {
        paddle_monthly_price_id = '';
        paddle_yearly_price_id = '';
      }

      // Overrides to lock deterministic outcome names & descriptions
      let name = plan.name;
      let description = plan.description;
      let features = plan.features || [];
      let badge_text = plan.badge_text;
      let price_monthly = 0;
      let price_yearly = 0;

      if (plan.id === 'free') {
        name = 'Free';
        description = 'Try the core tools before you commit.';
        badge_text = 'Try';
        features = [
          'Draft quotes and estimates',
          'Basic profile creation',
          'Watermarked PDF exports'
        ];
        price_monthly = 0.00;
        price_yearly = 0.00;
      } else if (plan.id === 'starter') {
        name = 'Starter';
        description = 'Get your first client faster';
        badge_text = 'Starter';
        features = [
          '1 proposal/day & 1 profile/day',
          'Watermark preview enabled',
          'Export disabled'
        ];
        price_monthly = 9.00;
        price_yearly = 7.00;
      } else if (plan.id === 'pro') {
        name = 'Pro';
        description = 'Start getting paid professionally';
        badge_text = 'Recommended';
        features = [
          'Unlimited proposals & profiles',
          'Secure PDF export (No watermark)',
          'Share client links instantly'
        ];
        price_monthly = 19.00;
        price_yearly = 16.00;
      } else if (plan.id === 'studio') {
        name = 'Studio';
        description = 'Scale client operations';
        badge_text = 'Coming Soon';
        features = [
          'Brand client workspaces under your custom domain',
          'Qualify inbound inquiries with budget filters',
          'Present specialist team members to secure larger contracts'
        ];
        price_monthly = 0.00;
        price_yearly = 0.00;
      }

      return {
        ...plan,
        name,
        description,
        features,
        badge_text,
        paddle_monthly_price_id,
        paddle_yearly_price_id,
        price_monthly,
        price_yearly
      };
    });

    if (process.env.NODE_ENV === 'production') {
      const invalidPlan = mappedPlans.find((plan) => {
        if (plan.id === 'free' || plan.id === 'studio') return false;
        return hasPlaceholderPriceId(plan.paddle_monthly_price_id) || hasPlaceholderPriceId(plan.paddle_yearly_price_id);
      });

      if (invalidPlan) {
        return NextResponse.json({
          success: false,
          error: `Paddle production price IDs are missing or invalid for plan: ${invalidPlan.id}`,
        }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, plans: mappedPlans.slice(0, STRICT_PLAN_IDS.length) });
  } catch (err) {
    console.error('Error in GET /api/pricing:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
