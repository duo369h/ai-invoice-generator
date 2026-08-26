import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadLocalEnv() {
  const envPath = path.join(root, '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!url || !serviceRoleKey) throw new Error('Sandbox Supabase env is unavailable');
if (!url.includes('ibdysgdgkdoxfsyepxrq')) throw new Error('Refusing non-Sandbox Supabase target');

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `corvioz-r2-ordering-${suffix}@example.invalid`;
const password = `R2-${suffix}-safe-test-password`;
let userId = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function entitlements(plan) {
  const pro = plan === 'pro' || plan === 'studio';
  return {
    p_invoice: true,
    p_quote: true,
    p_export_pdf: true,
    p_pdf_branding: pro ? 'clean' : 'branded',
    p_client_portal: pro,
    p_client_approval: pro,
    p_approval_scope: pro ? 'quotes_only' : 'none',
    p_crm: pro,
    p_automation: plan === 'studio',
    p_advanced_invoicing: pro,
    p_unlimited_invoices: pro,
  };
}

async function apply({ eventId, eventType, occurredAt, plan, status, subscriptionId = 'sub_r2_ordering', priceId = 'pri_r2_pro' }) {
  const { data, error } = await supabase.rpc('apply_paddle_webhook_event', {
    p_event_id: eventId,
    p_event_type: eventType,
    p_user_id: userId,
    p_customer_id: 'ctm_r2_sandbox_fixture',
    p_subscription_id: subscriptionId,
    p_price_id: priceId,
    p_plan: plan,
    p_status: status,
    p_billing_interval: 'monthly',
    p_period_start: '2026-08-26T00:00:00.000Z',
    p_period_end: '2026-09-26T00:00:00.000Z',
    p_occurred_at: occurredAt,
    p_payload: { event_id: eventId, event_type: eventType, occurred_at: occurredAt, synthetic: true },
    ...entitlements(plan),
  });
  if (error) throw error;
  return data;
}

async function readState() {
  const [{ data: profile, error: profileError }, { data: subscriptions, error: subscriptionError }, { data: entitlement, error: entitlementError }, { data: events, error: eventError }] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', userId).single(),
    supabase.from('subscriptions').select('plan,status,latest_event_occurred_at').eq('user_id', userId).single(),
    supabase.from('entitlements').select('plan,client_approval,approval_scope,unlimited_invoices').eq('user_id', userId).single(),
    supabase.from('billing_events').select('event_id,occurred_at,applied').eq('user_id', userId).order('occurred_at'),
  ]);
  for (const error of [profileError, subscriptionError, entitlementError, eventError]) if (error) throw error;
  return { profile, subscription: subscriptions, entitlement, events };
}

async function main() {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError) throw createError;
  userId = created.user.id;

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    email,
    plan: 'free',
  });
  if (profileError) throw profileError;

  const t0 = '2026-08-26T00:00:10.000Z';
  const applied = await apply({ eventId: 'evt-r2-new', eventType: 'subscription.created', occurredAt: t0, plan: 'pro', status: 'active' });
  assert(applied.applied === true && applied.duplicate === false && applied.stale === false, 'newer event was not applied');
  let state = await readState();
  assert(state.profile.plan === 'pro' && state.subscription.status === 'active' && state.entitlement.plan === 'pro', 'newer event side effects are incomplete');
  console.log('WEBHOOK_NEWER_EVENT_APPLIED=PASS');

  const duplicate = await apply({ eventId: 'evt-r2-new', eventType: 'subscription.paused', occurredAt: '2026-08-26T00:00:50.000Z', plan: 'free', status: 'paused' });
  assert(duplicate.duplicate === true && duplicate.applied === false, 'duplicate event was not idempotent');
  state = await readState();
  assert(state.profile.plan === 'pro' && state.subscription.status === 'active' && state.events.filter((event) => event.event_id === 'evt-r2-new').length === 1, 'duplicate caused side effects');
  console.log('WEBHOOK_DUPLICATE_IDEMPOTENCY=PASS');

  const stale = await apply({ eventId: 'evt-r2-stale', eventType: 'subscription.paused', occurredAt: '2026-08-26T00:00:05.000Z', plan: 'free', status: 'paused' });
  assert(stale.stale === true && stale.applied === false, 'older event was not rejected as stale');
  state = await readState();
  assert(state.profile.plan === 'pro' && state.subscription.status === 'active' && state.entitlement.plan === 'pro', 'stale event regressed business state');
  assert(state.events.find((event) => event.event_id === 'evt-r2-stale')?.applied === false, 'stale event audit row is not marked unapplied');
  console.log('WEBHOOK_STALE_OCCURRED_AT_IGNORED=PASS');

  const paused = await apply({ eventId: 'evt-r2-paused', eventType: 'subscription.paused', occurredAt: '2026-08-26T00:00:20.000Z', plan: 'free', status: 'paused' });
  assert(paused.applied === true, 'paused event was not applied');
  state = await readState();
  assert(state.profile.plan === 'free' && state.subscription.status === 'paused' && state.entitlement.plan === 'free' && state.entitlement.approval_scope === 'none', 'paused contract did not downgrade access');
  console.log('PAUSED_RUNTIME_CONTRACT=PASS');

  const pausedUpdated = await apply({ eventId: 'evt-r2-paused-updated', eventType: 'subscription.updated', occurredAt: '2026-08-26T00:00:25.000Z', plan: 'free', status: 'paused' });
  assert(pausedUpdated.applied === true, 'subscription.updated paused event was not applied');
  state = await readState();
  assert(state.subscription.status === 'paused' && state.entitlement.plan === 'free', 'subscription.updated paused state is unsafe');
  console.log('PAUSED_UPDATED_RUNTIME_CONTRACT=PASS');

  const resumed = await apply({ eventId: 'evt-r2-resumed', eventType: 'subscription.resumed', occurredAt: '2026-08-26T00:00:30.000Z', plan: 'pro', status: 'active' });
  assert(resumed.applied === true, 'resumed event was not applied');
  state = await readState();
  assert(state.profile.plan === 'pro' && state.subscription.status === 'active' && state.entitlement.plan === 'pro' && state.entitlement.approval_scope === 'quotes_only', 'resumed contract did not restore access');
  console.log('RESUMED_RUNTIME_CONTRACT=PASS');

  const transaction = await apply({ eventId: 'evt-r2-transaction', eventType: 'transaction.completed', occurredAt: '2026-08-26T00:00:40.000Z', plan: 'pro', status: 'active' });
  assert(transaction.applied === true, 'transaction.completed event was not applied');
  state = await readState();
  assert(state.subscription.status !== 'completed' && state.subscription.status === 'active', 'transaction.completed persisted completed subscription status');
  console.log('TRANSACTION_COMPLETED_STATUS_SAFE=PASS');

  const concurrent = await Promise.all([
    apply({ eventId: 'evt-r2-concurrent-newer', eventType: 'subscription.updated', occurredAt: '2026-08-26T00:01:00.000Z', plan: 'pro', status: 'active' }),
    apply({ eventId: 'evt-r2-concurrent-older', eventType: 'subscription.paused', occurredAt: '2026-08-26T00:00:50.000Z', plan: 'free', status: 'paused' }),
  ]);
  assert(concurrent.some((result) => result.applied === true), 'concurrent newer event was not applied');
  state = await readState();
  assert(new Date(state.subscription.latest_event_occurred_at).toISOString() === '2026-08-26T00:01:00.000Z', 'atomic ordering did not retain newest timestamp');
  assert(state.profile.plan === 'pro' && state.subscription.status === 'active', 'concurrent older event regressed state');
  console.log('WEBHOOK_ATOMIC_ORDERING_RACE=PASS');

  assert(state.events.length === 8, `unexpected event audit count: ${state.events.length}`);
  assert(state.events.filter((event) => event.event_id === 'evt-r2-new').length === 1, 'event id was not recorded exactly once');
  console.log('EVENT_ID_RECORDED_EXACTLY_ONCE=PASS');
  console.log('SANDBOX_WEBHOOK_ORDERING_SUITE=PASS');
}

try {
  await main();
} finally {
  if (userId) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
  }
}
