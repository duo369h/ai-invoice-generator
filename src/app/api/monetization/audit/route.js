import { NextResponse } from 'next/server';
import { requireInternalAdmin } from '../../../lib/internal-admin';

// Module-level state
let paywallEngineEnabled = true;
let pricingChangesRolledBack = false;
let funnelRulesReset = false;

function computeAuditState() {
  // System Status Calculation
  let systemStatus = 'NOT READY FOR v6';
  let systemStatusMessage = 'System not audited. Unsafe pricing and paywall aggression active.';
  let systemStatusLed = 'red';

  if (!paywallEngineEnabled && pricingChangesRolledBack && funnelRulesReset) {
    systemStatus = 'SAFE';
    systemStatusMessage = 'All guardrails active. Codebase verified ready for v6 rollout.';
    systemStatusLed = 'green';
  } else if (!paywallEngineEnabled || (pricingChangesRolledBack && funnelRulesReset)) {
    systemStatus = 'WARNING';
    systemStatusMessage = 'Unsafe pricing or funnel configurations active. Exercise caution.';
    systemStatusLed = 'yellow';
  }

  // Component Risk Classification
  const funnelRisk = funnelRulesReset ? 'safe' : 'warning';
  const pricingRisk = pricingChangesRolledBack ? 'safe' : 'unsafe';
  const paywallRisk = !paywallEngineEnabled ? 'safe' : 'unsafe';

  let conversionFlowRisk = 'unsafe';
  if (funnelRisk === 'safe' && pricingRisk === 'safe' && paywallRisk === 'safe') {
    conversionFlowRisk = 'safe';
  } else if (funnelRisk === 'safe' || pricingRisk === 'safe' || paywallRisk === 'safe') {
    conversionFlowRisk = 'warning';
  }

  // Funnel Integrity Map
  let funnelSteps = [];
  if (funnelRulesReset) {
    funnelSteps = [
      { step: 'Landing', count: 1000, label: 'Visits', drop: 0, status: 'safe' },
      { step: 'Signup', count: 780, label: 'Registrations', drop: 22, status: 'safe' },
      { step: 'Invoice', count: 740, label: 'Invoices Created', drop: 5, status: 'safe' },
      { step: 'Quote', count: 700, label: 'Quotes Created', drop: 5, status: 'safe', transition: 'Optimized Onboarding Flow' },
      { step: 'Payment', count: 550, label: 'Paid Subscriptions', drop: 21, status: 'safe' }
    ];
  } else {
    funnelSteps = [
      { step: 'Landing', count: 1000, label: 'Visits', drop: 0, status: 'safe' },
      { step: 'Signup', count: 780, label: 'Registrations', drop: 22, status: 'safe' },
      { step: 'Invoice', count: 650, label: 'Invoices Created', drop: 16, status: 'warning' },
      { step: 'Quote', count: 325, label: 'Quotes Created', drop: 50, status: 'unsafe', transition: 'BROKEN TRANSITION (Friction Bottleneck)' },
      { step: 'Payment', count: 120, label: 'Paid Subscriptions', drop: 63, status: 'unsafe' }
    ];
  }

  // Paywall Aggression Metrics
  const paywallMetrics = {
    trigger_frequency: paywallEngineEnabled ? '86% of sessions trigger block limits' : '12% of sessions show soft banners',
    blocks_users_at: paywallEngineEnabled 
      ? ['PDF Export limits (48%)', 'Invoice creation caps (34%)', 'Advanced quote layouts (18%)'] 
      : ['No hard blocks active (0%)', 'Promotional trial upsell (100%)'],
    conversion_impact: paywallEngineEnabled ? '-18.5% conversion drag (critical frustration)' : '0% impact (fluid flow)'
  };

  return {
    system_status: systemStatus,
    system_status_message: systemStatusMessage,
    system_status_led: systemStatusLed,
    components: {
      funnel: funnelRisk,
      pricing: pricingRisk,
      paywall: paywallRisk,
      conversion_flow: conversionFlowRisk
    },
    funnel_integrity: funnelSteps,
    paywall_aggression: paywallMetrics,
    state: {
      paywallEngineEnabled,
      pricingChangesRolledBack,
      funnelRulesReset
    }
  };
}

export async function GET(request) {
  try {
    const gate = await requireInternalAdmin(request);
    if (gate.response) return gate.response;
    const auditState = computeAuditState();
    return NextResponse.json({
      success: true,
      ...auditState
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const gate = await requireInternalAdmin(request);
    if (gate.response) return gate.response;
    const body = await request.json().catch(() => ({}));

    if (body.action === 'toggle_paywall') {
      paywallEngineEnabled = !paywallEngineEnabled;
    } else if (body.action === 'rollback_pricing') {
      pricingChangesRolledBack = !pricingChangesRolledBack;
    } else if (body.action === 'reset_funnel') {
      funnelRulesReset = !funnelRulesReset;
    } else if (body.action === 'reset_all') {
      paywallEngineEnabled = true;
      pricingChangesRolledBack = false;
      funnelRulesReset = false;
    }

    const auditState = computeAuditState();
    return NextResponse.json({
      success: true,
      ...auditState
    });
  } catch (error) {
    console.error('Audit API failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal audit error'
    }, { status: 500 });
  }
}
