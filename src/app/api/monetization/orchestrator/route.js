import { NextResponse } from 'next/server';
import { getRequestUser, ensureProfile } from '../../../lib/supabase';
import { evaluateAutonomousMonetization } from '../../../lib/monetization/orchestrator';

const ACTION_MAP = {
  create_invoice: 'invoice_create',
  create_quote: 'quote_create',
  quote_export: 'export_pdf',
  pricing_cta: 'pricing_view',
  client_portal: 'export_pdf',
  send_invoice: 'export_pdf',
  payment_reminder: 'export_pdf',
};

function toNumber(value, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeAction(action) {
  const key = String(action || '').toLowerCase();
  return ACTION_MAP[key] || key;
}

function uiMessage(result) {
  if (result.final_action === 'block') {
    return result.scores.risk_score > 70
      ? 'Upgrade required to continue high-volume free usage.'
      : 'This action is available on Pro.';
  }
  if (result.final_action === 'redirect') return 'Opening pricing so you can continue with Pro.';
  if (result.final_action === 'upsell') return 'Pro is recommended for your current workflow.';
  if (result.pricing_tier === 'premium') return 'Pro is recommended for your current workflow.';
  return '';
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    let userState = body.user_state || body.userPlan || 'free';

    const context = await getRequestUser(request).catch(() => null);
    if (context?.mode === 'supabase' && context.user) {
      const profile = await ensureProfile(context.supabase, context.user).catch(() => null);
      userState = profile?.plan || userState;
    }

    const result = evaluateAutonomousMonetization({
      action_type: normalizeAction(body.action_type || body.action),
      user_state: userState,
      invoice_created_count: toNumber(body.invoice_created_count ?? body.invoicesCount),
      quote_created_count: toNumber(body.quote_created_count ?? body.quotesCount),
      export_actions: toNumber(body.export_actions ?? body.exportsCount),
      pricing_page_visits: toNumber(body.pricing_page_visits ?? body.pricingViewCount),
      session_time: toNumber(body.session_time),
      return_user_frequency: toNumber(body.return_user_frequency),
    });

    const shouldBlock = result.final_action === 'block' || result.final_action === 'redirect';
    return NextResponse.json({
      ...result,
      action: result.final_action,
      shouldBlock,
      uiState: result.ui_behavior,
      message: uiMessage(result),
      targetPlan: result.pricing_tier === 'premium' ? 'pro' : 'pro',
    });
  } catch (error) {
    console.error('Monetization orchestrator failed:', error);
    return NextResponse.json({
      final_action: 'allow',
      pricing_tier: 'standard',
      ui_behavior: 'allow_standard_flow',
      reason: 'orchestrator_error_fallback',
      action: 'allow',
      shouldBlock: false,
      uiState: 'allow_standard_flow',
      message: '',
      scores: {
        intent_score: 0,
        value_score: 0,
        conversion_probability: 0,
        risk_score: 0,
      },
    });
  }
}
