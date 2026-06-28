import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.substring(0, idx).trim();
    const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) {
      process.env[key] = val;
    }
  });
}

loadEnv();

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
};

const baseUrl = (process.env.CORVIOZ_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const supabaseUrl = required('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = required('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const testEmail = process.env.CORVIOZ_TEST_EMAIL || `corvioz-e2e-${Date.now()}@example.com`;
const testPassword = process.env.CORVIOZ_TEST_PASSWORD || `Corvioz-${Date.now()}-E2E!`;
const expectTokenlessDoc404 = process.env.CORVIOZ_EXPECT_PRODUCTION_DOC_404 !== 'false';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const serviceSupabase = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
}) : null;

function log(step, detail = '') {
  console.log(`✓ ${step}${detail ? `: ${detail}` : ''}`);
}

async function api(path, { token, method = 'GET', body, expected = [200] } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }

  if (!expected.includes(response.status)) {
    throw new Error(`${method} ${path} returned ${response.status}; expected ${expected.join(', ')}. Body: ${text}`);
  }

  return { response, json };
}

async function getSession() {
  if (process.env.CORVIOZ_TEST_EMAIL && process.env.CORVIOZ_TEST_PASSWORD) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    if (error) throw error;
    return data.session;
  }

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });
  if (error) throw error;
  if (!data.session) {
    throw new Error(
      'Supabase signup did not return a session. Email confirmation is probably enabled. Set CORVIOZ_TEST_EMAIL and CORVIOZ_TEST_PASSWORD for an already-confirmed test user.'
    );
  }
  return data.session;
}

async function main() {
  console.log(`Running Corvioz production loop verification against ${baseUrl}`);

  const session = await getSession();
  const token = session?.access_token;
  if (!token) throw new Error('No Supabase access token returned');
  log('Supabase auth session acquired', testEmail);

  await api('/api/user', { token });
  log('Dashboard user API returns authenticated profile/quota');

  if (serviceSupabase && session?.user?.id) {
    console.log("Cleaning up old test data (leads, card_profiles, quotes, invoices) to reset inbox capacity...");
    await serviceSupabase.from('leads').delete().eq('freelancer_id', session.user.id);
    await serviceSupabase.from('card_profiles').delete().eq('user_id', session.user.id);
    await serviceSupabase.from('quotes').delete().eq('user_id', session.user.id);
    await serviceSupabase.from('invoices').delete().eq('user_id', session.user.id);
    console.log("Cleanup done.");
  }

  const suffix = Date.now().toString(36);
  const username = `e2e-${suffix}`;

  const profilePayload = {
    username,
    name: 'Corvioz E2E Freelancer',
    title: 'Production Verification Consultant',
    bio: 'This temporary profile verifies the production Supabase public profile, lead capture, and client portal workflow for Corvioz deployment readiness.',
    tags: ['verification', 'consulting'],
    contact_email: testEmail,
    is_public: true,
    services: [
      {
        name: 'Production readiness verification',
        description: 'End-to-end Supabase and portal workflow validation.',
        type: 'fixed',
        amount: 500,
      },
    ],
    portfolio: [],
    social_links: {},
    testimonials: [],
  };

  const { json: profile } = await api('/api/card-profile', {
    token,
    method: 'POST',
    body: profilePayload,
    expected: [200],
  });
  log('Public profile created', `/card/${profile.username}`);

  await api(`/api/card-profile?username=${encodeURIComponent(username)}`, { expected: [200] });
  log('Public profile API can read published profile');

  await api('/api/leads', {
    method: 'POST',
    body: {
      username,
      name: 'Verification Client',
      email: `client-${suffix}@example.com`,
      message: 'Please verify the Corvioz production lead capture flow.',
      source_utm: { source: 'production-verification' },
    },
    expected: [201],
  });
  log('Public lead submitted to published profile');

  const { json: leads } = await api('/api/leads', { token });
  if (!Array.isArray(leads.data) || !leads.data.some((lead) => lead.email === `client-${suffix}@example.com`)) {
    throw new Error('Created lead was not visible to authenticated freelancer');
  }
  log('Dashboard leads API returns created lead');

  const quotePayload = {
    quote_number: `QT-E2E-${suffix}`,
    client_name: 'Verification Client',
    client_email: `client-${suffix}@example.com`,
    client_address: '',
    currency: 'USD',
    discount_rate: 0,
    tax_rate: 0,
    status: 'draft',
    notes: 'Production verification quote.',
    items: [{ description: 'Production verification quote', quantity: 1, unitPrice: 500 }],
  };

  const { json: quote } = await api('/api/quotes', {
    token,
    method: 'POST',
    body: quotePayload,
    expected: [201],
  });
  if (!quote.portal_token) throw new Error('Quote did not return portal_token');
  log('Quote created with portal token', quote.id);

  const invoicePayload = {
    invoice_number: `INV-E2E-${suffix}`,
    client_name: 'Verification Client',
    client_email: `client-${suffix}@example.com`,
    client_address: '',
    currency: 'USD',
    discount_rate: 0,
    tax_rate: 0,
    payment_terms: 'Net 30',
    doc_type: 'invoice',
    notes: 'Production verification invoice.',
    payment_link: 'https://paypal.me/corvioz',
    items: [{ description: 'Production verification invoice', quantity: 1, unitPrice: 500 }],
  };

  const { json: invoice } = await api('/api/invoices', {
    token,
    method: 'POST',
    body: invoicePayload,
    expected: [201],
  });
  if (!invoice.portal_token) throw new Error('Invoice did not return portal_token');
  log('Invoice created with portal token', invoice.id);

  await api(`/api/portal/token/${encodeURIComponent(invoice.portal_token)}`, { expected: [200] });
  log('Portal token resolves invoice');

  await api(`/api/portal/token/${encodeURIComponent(invoice.portal_token)}`, {
    method: 'POST',
    body: {
      author: 'Verification Client',
      text: 'Production portal comment verification.',
      website: '',
    },
    expected: [200],
  });
  log('Portal comment saved');

  await api(`/api/portal/doc/${encodeURIComponent(invoice.id)}`, {
    expected: expectTokenlessDoc404 ? [404] : [200, 404],
  });
  log('Tokenless portal document route checked', expectTokenlessDoc404 ? 'expected 404' : 'local/dev flexible');

  console.log('Corvioz production loop verification completed successfully.');
}

main().catch((error) => {
  console.error('Production loop verification failed.');
  console.error(error);
  process.exit(1);
});
