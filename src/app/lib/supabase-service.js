import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { defaultPortalExpiry, generatePortalToken, hashPortalToken } from './security';

export function createServiceSupabaseClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL
    || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return null;
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export async function ensureProfile(supabase, user) {
  const email = user.email || '';
  const name =
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    email.split('@')[0] ||
    'User';

  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email,
      name,
      plan: 'free',
    })
    .select('*')
    .single();

  if (error) throw error;

  try {
    const { seedDemoData } = await import('./demo-data');
    await seedDemoData(supabase, user.id, email, name);
  } catch (seedErr) {
    console.error('Failed to seed demo data on user registration:', seedErr);
  }

  try {
    const { sendWelcomeEmail } = await import('./email');
    await sendWelcomeEmail(email, name);
  } catch (emailErr) {
    console.error('Failed to send welcome email on registration:', emailErr);
  }

  return data;
}

export async function createSupabasePortalToken(supabase, {
  ownerId,
  resourceType,
  resourceId,
  scope = 'view:comment',
  expiresAt = defaultPortalExpiry(),
}) {
  const writer = createServiceSupabaseClient() || supabase;
  const token = generatePortalToken();
  const tokenHash = hashPortalToken(token);

  const { error } = await writer.from('portal_tokens').insert({
    token_hash: tokenHash,
    owner_id: ownerId,
    resource_type: resourceType,
    resource_id: resourceId,
    scope,
    expires_at: expiresAt,
  });

  if (error) throw error;
  return token;
}

export async function writeAuditLog(supabase, {
  userId,
  action,
  resourceType,
  resourceId = null,
  ip = '',
}) {
  const writer = createServiceSupabaseClient() || supabase;
  if (!writer || !userId || !action || !resourceType) return;

  const { error } = await writer.from('audit_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    ip,
  });

  if (error) {
    console.error('Failed to write audit log:', error);
  }
}

export async function trackProfileMetric(supabase, userId, field) {
  const writer = createServiceSupabaseClient() || supabase;
  if (!writer || !userId) return;

  try {
    const { data: profile } = await writer
      .from('profiles')
      .select('created_at, first_invoice_created_at, first_client_added_at, invoice_sent_timestamp, quote_sent_timestamp, time_to_first_export, time_to_first_client_response')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return;

    const updates = {};
    const nowStr = new Date().toISOString();
    const createdTime = new Date(profile.created_at).getTime();
    const durationSeconds = Math.max(0, Math.floor((Date.now() - createdTime) / 1000));

    if (field === 'first_invoice_created_at' && !profile.first_invoice_created_at) {
      updates.first_invoice_created_at = nowStr;
    }
    if (field === 'first_client_added_at' && !profile.first_client_added_at) {
      updates.first_client_added_at = nowStr;
    }
    if (field === 'invoice_sent_timestamp') {
      updates.invoice_sent_timestamp = nowStr;
    }
    if (field === 'quote_sent_timestamp') {
      updates.quote_sent_timestamp = nowStr;
    }
    if (field === 'time_to_first_export' && profile.time_to_first_export === null) {
      updates.time_to_first_export = durationSeconds;
    }
    if (field === 'time_to_first_client_response' && profile.time_to_first_client_response === null) {
      updates.time_to_first_client_response = durationSeconds;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await writer
        .from('profiles')
        .update({ ...updates, updated_at: nowStr })
        .eq('id', userId);
      if (error) throw error;
    }
  } catch (err) {
    console.error(`Failed to update profile metric ${field}:`, err);
  }
}

export async function recordServerGrowthEvent(supabase, {
  eventName,
  userId,
  sessionId = '',
  pagePath = '',
  pageLocation = '',
  source = 'system',
  properties = {}
}) {
  const ALLOWED_EVENTS = new Set(['invoice_created', 'invoice_sent', 'invoice_paid']);
  if (!ALLOWED_EVENTS.has(eventName)) {
    return;
  }

  const writer = createServiceSupabaseClient() || supabase;
  if (!writer) return;

  const payload = {
    event_name: eventName,
    session_id: sessionId,
    user_id: userId || null,
    page_path: pagePath,
    page_location: pageLocation,
    source,
    properties: {
      ...properties,
      timestamp: Date.now(),
      received_at: new Date().toISOString(),
    }
  };

  const { error } = await writer.from('growth_events').insert(payload);
  if (error) {
    console.error(`Failed to record server growth event ${eventName}:`, error);
  }
}
