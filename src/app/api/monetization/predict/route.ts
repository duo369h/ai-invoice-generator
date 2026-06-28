import { NextResponse } from 'next/server';
import { requireInternalAdmin } from '../../../lib/internal-admin';
import {
  getUpgradeDecision,
  type UserSignals,
} from '../../../../../lib/monetization/upgradeTriggerEngine';

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeSignals(value: Record<string, unknown>): UserSignals {
  return {
    invoice_count: Math.max(0, toNumber(value.invoice_count ?? value.invoices_count, 0)),
    quote_count: Math.max(0, toNumber(value.quote_count ?? value.quotes_count, 0)),
    export_count: Math.max(0, toNumber(value.export_count ?? value.export_attempts, 0)),
    pricing_view_count: Math.max(0, toNumber(value.pricing_view_count, 0)),
    scroll_depth: Math.max(0, Math.min(100, toNumber(value.scroll_depth, 0))),
    return_user_frequency: Math.max(0, toNumber(value.return_user_frequency, 0)),
    is_authenticated: Boolean(value.is_authenticated),
    plan: String(value.plan ?? value.user_plan ?? 'free'),
    time_on_page: Math.max(0, toNumber(value.time_on_page, 0)),
    tab_switch_count: Math.max(0, toNumber(value.tab_switch_count, 0)),
    session_duration: Math.max(0, toNumber(value.session_duration, 0)),
    last_active_time: Math.max(0, toNumber(value.last_active_time, 0)),
    user_goal: typeof value.user_goal === 'string' ? value.user_goal : undefined,
    clicked_feature: typeof value.clicked_feature === 'string' ? value.clicked_feature : undefined,
    selected_plan: typeof value.selected_plan === 'string' ? value.selected_plan : undefined,
  };
}

export async function POST(request: Request) {
  try {
    const gate = await requireInternalAdmin(request);
    if (gate.response) return gate.response;
    const body = await request.json().catch(() => ({}));
    const { signals } = body;

    if (!signals || typeof signals !== 'object') {
      return NextResponse.json({ error: 'Missing signals' }, { status: 400 });
    }

    const decision = getUpgradeDecision(normalizeSignals(signals), {
      suppressTracking: true,
    });

    return NextResponse.json({
      deterministic: true,
      engine: 'rule_based_upgrade_engine',
      result: {
        should_show_upgrade: decision.should_show_upgrade,
        plan: decision.target_plan,
        strength: decision.confidence,
        trigger_type: decision.trigger_type,
        explanation_text: decision.reason || 'No upgrade rule matched.',
      },
    });
  } catch (error: any) {
    console.error('Unexpected error in deterministic monetization route:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
