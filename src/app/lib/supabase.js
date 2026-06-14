import { createClient } from '@supabase/supabase-js';
import { getUserById, saveUser } from './db';
import { defaultPortalExpiry, generatePortalToken, hashPortalToken } from './security';

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createRequestSupabaseClient(request) {
  if (!isSupabaseConfigured()) return null;

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export function createPublicSupabaseClient() {
  if (!isSupabaseConfigured()) return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export function createServiceSupabaseClient() {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

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

export async function getRequestUser(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (process.env.NODE_ENV === 'development' && authHeader === 'Bearer mock_freelancer_token') {
    const db = await import('./db');
    let mockUser = db.getUserById('usr_mock123');
    if (!mockUser) {
      mockUser = saveUser({
        id: 'usr_mock123',
        email: 'freelancer@example.com',
        name: 'Simulated Freelancer',
        plan: 'free',
        created_at: new Date().toISOString()
      });
    }
    return { 
      mode: 'mock', 
      user: { id: mockUser.id, email: mockUser.email, name: mockUser.name } 
    };
  }

  const supabase = createRequestSupabaseClient(request);
  if (!supabase) return { mode: 'demo', supabase: null, user: null };

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return { mode: 'demo', supabase: null, user: null };
  }

  return { mode: 'supabase', supabase, user: data.user };
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
  return data;
}

export function mapSupabaseInvoice(row) {
  return {
    ...row,
    object: 'invoice',
    status: row.status || 'draft',
    currency: (row.currency || 'USD').toLowerCase(),
    discount_rate: Number(row.discount_rate || 0),
    tax_rate: Number(row.tax_rate || 0),
    payment_link: row.stripe_payment_link || '',
  };
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

export async function resolveSupabasePortalToken(supabase, token) {
  const tokenHash = hashPortalToken(token);
  const { data, error } = await supabase
    .from('portal_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at) <= new Date()) return null;
  return data;
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

export async function getSupabaseQuota(supabase, userId, plan = 'free') {
  const normalizedPlan = String(plan || 'free').toLowerCase() === 'pro' ? 'pro' : 'free';
  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthStart = `${currentMonth}-01T00:00:00.000Z`;

  const { count: invoicesUsed = 0 } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart);

  const { data: usage } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .maybeSingle();

  const limits = {
    free: { invoices: 5, ai: 3 },
    pro: { invoices: 999999, ai: 100 },
  };

  const currentLimits = limits[normalizedPlan];
  const aiUsed = usage?.ai_parses_used || 0;

  return {
    plan: normalizedPlan,
    invoicesUsed: invoicesUsed || 0,
    invoicesLimit: currentLimits.invoices,
    invoicesAllowed: (invoicesUsed || 0) < currentLimits.invoices,
    aiUsed,
    aiLimit: currentLimits.ai,
    aiAllowed: aiUsed < currentLimits.ai,
  };
}

export async function incrementSupabaseAiUsage(supabase, userId) {
  const currentMonth = new Date().toISOString().substring(0, 7);

  const { data: existing } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('usage')
      .update({ ai_parses_used: (existing.ai_parses_used || 0) + 1 })
      .eq('id', existing.id)
      .eq('user_id', userId)
      .eq('month', currentMonth);
    return;
  }

  await supabase.from('usage').insert({
    user_id: userId,
    month: currentMonth,
    invoices_created: 0,
    ai_parses_used: 1,
  });
}

export async function incrementSupabaseInvoiceUsage(supabase, userId) {
  const currentMonth = new Date().toISOString().substring(0, 7);

  const { data: existing } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('usage')
      .update({ invoices_created: (existing.invoices_created || 0) + 1 })
      .eq('id', existing.id)
      .eq('user_id', userId)
      .eq('month', currentMonth);
    return;
  }

  await supabase.from('usage').insert({
    user_id: userId,
    month: currentMonth,
    invoices_created: 1,
    ai_parses_used: 0,
  });
}
