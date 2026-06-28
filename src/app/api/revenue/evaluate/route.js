import { NextResponse } from 'next/server';
import { getRequestUser } from '../../../lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, invoicesCount = 0, quotesCount = 0, intentScore = 0, pricingViewCount = 0 } = body;

    // Resolve authenticated user profile from database context (if active)
    let userPlan = body.userPlan || 'free';
    const context = await getRequestUser(request).catch(() => null);
    if (context && context.user) {
      if (context.mode === 'supabase') {
        const { ensureProfile } = await import('../../../lib/supabase');
        const profile = await ensureProfile(context.supabase, context.user).catch(() => null);
        if (profile && profile.plan) {
          userPlan = profile.plan;
        }
      }
    }

    const isPaid = ['pro', 'professional', 'agency'].includes(String(userPlan).toLowerCase());

    if (isPaid) {
      return NextResponse.json({
        shouldBlock: false,
        action: 'allow',
        uiState: 'none',
        reason: 'paid_plan_active',
        targetPlan: 'pro',
        message: 'Premium tier active.'
      });
    }

    let shouldBlock = false;
    let responseAction = 'allow'; // 'allow' | 'upsell' | 'block' | 'redirect'
    let uiState = 'none'; // 'none' | 'soft_upsell' | 'hard_paywall' | 'pricing_redirect' | 'upgrade_banner'
    let reason = 'no_rule_matched';
    let targetPlan = 'pro';
    let message = '';

    // Enforce limits and paywall triggers defined by the backend business rules
    switch (action) {
      case 'create_invoice':
        if (invoicesCount >= 2) {
          shouldBlock = true;
          responseAction = 'block';
          uiState = 'hard_paywall';
          reason = 'invoice_limit_reached';
          message = 'You have reached the free limit of 2 invoices. Upgrade to continue billing clients without interruption.';
        } else if (invoicesCount === 1) {
          shouldBlock = false;
          responseAction = 'upsell';
          uiState = 'upgrade_banner';
          reason = 'invoice_limit_approaching';
          message = 'You have 1 invoice left on the free tier. Upgrade to Pro for unlimited billing.';
        } else {
          responseAction = 'allow';
        }
        break;

      case 'create_quote':
        if (quotesCount >= 1) {
          shouldBlock = true;
          responseAction = 'block';
          uiState = 'hard_paywall';
          reason = 'quote_limit_reached';
          message = 'You have reached the free limit of 1 quote. Upgrade to Pro to send unlimited proposals.';
        } else {
          responseAction = 'allow';
        }
        break;

      case 'export_pdf':
        shouldBlock = false;
        responseAction = 'upsell';
        uiState = 'soft_upsell';
        reason = 'export_watermark_restriction';
        message = 'Free exports include a Corvioz watermark. Upgrade to Pro to remove it.';
        break;

      case 'client_portal':
        shouldBlock = true;
        responseAction = 'redirect';
        uiState = 'pricing_redirect';
        reason = 'client_portal_locked';
        message = 'Client Portal is a premium capability. Redirecting to pricing...';
        break;

      case 'send_invoice':
      case 'payment_reminder':
        shouldBlock = true;
        responseAction = 'block';
        uiState = 'hard_paywall';
        reason = 'automation_features_locked';
        message = 'Client email automation and reminder links are premium capabilities. Upgrade to manage client operations.';
        break;

      case 'pricing_cta':
        shouldBlock = false;
        responseAction = 'redirect';
        uiState = 'pricing_redirect';
        reason = 'pricing_cta_click';
        message = 'Loading payment plans...';
        break;

      default:
        // Score-based or count-based fallbacks
        if (pricingViewCount >= 3) {
          shouldBlock = false;
          responseAction = 'upsell';
          uiState = 'show_pricing_modal';
          reason = 'revisited_pricing_recommends_pro';
          message = 'Pro is the best fit for your billing workflow.';
        } else if (intentScore > 60) {
          shouldBlock = false;
          responseAction = 'upsell';
          uiState = 'soft_upsell';
          reason = 'high_intent_user';
          message = 'Ready to upgrade? Start with Pro to unlock full power.';
        } else {
          responseAction = 'allow';
        }
        break;
    }

    return NextResponse.json({
      shouldBlock,
      action: responseAction,
      uiState,
      reason,
      targetPlan,
      message
    });
  } catch (error) {
    console.error('Error evaluating revenue decision:', error);
    return NextResponse.json({
      shouldBlock: false,
      action: 'allow',
      uiState: 'none',
      reason: 'error_fallback',
      message: 'Safety fallback: allowed.'
    });
  }
}
