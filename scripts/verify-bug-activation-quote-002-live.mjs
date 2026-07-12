import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this verification.');
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function payload(label, overrides = {}) {
  return {
    quote_number: `QT-ACT-${label}`,
    client_name: 'Activation Quote QA',
    client_email: 'activation-qa@example.invalid',
    client_address: '',
    items: [],
    subtotal: 12000,
    discount_rate: 10,
    discount_amount: 1200,
    tax_rate: 8.5,
    tax_amount: 918,
    total: 11718,
    currency: 'USD',
    notes: '',
    ...overrides,
  };
}

async function createVerifiedUser(label) {
  const suffix = crypto.randomUUID();
  const { data, error } = await supabase.auth.admin.createUser({
    email: `activation-quote-${label}-${suffix}@example.invalid`,
    password: `Pass-${suffix}-123!`,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user;
}

async function claimQuote(user, quotePayload) {
  const { data, error } = await supabase.rpc('create_first_revenue_quote', {
    p_user_id: user.id,
    p_quote: quotePayload,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

const createdUserIds = [];

try {
  const newUser = await createVerifiedUser('new');
  createdUserIds.push(newUser.id);

  const newQuote = await claimQuote(newUser, payload('NEW', {
    _profile_email: newUser.email,
    _profile_name: 'New Activation QA',
  }));
  assert.ok(newQuote?.id, 'brand-new verified Free user must receive a quote from the RPC');

  const { data: newProfile, error: newProfileError } = await supabase
    .from('profiles')
    .select('id, plan')
    .eq('id', newUser.id)
    .single();
  if (newProfileError) throw newProfileError;
  assert.equal(newProfile.plan, 'free', 'RPC must create the missing Free profile');

  const { data: newLoop, error: newLoopError } = await supabase
    .from('first_revenue_loops')
    .select('user_id, quote_id')
    .eq('user_id', newUser.id)
    .single();
  if (newLoopError) throw newLoopError;
  assert.equal(newLoop.quote_id, newQuote.id, 'RPC must atomically bind the first quote to its loop');

  const existingUser = await createVerifiedUser('existing');
  createdUserIds.push(existingUser.id);
  const { error: existingProfileError } = await supabase.from('profiles').insert({
    id: existingUser.id,
    email: existingUser.email,
    name: 'Existing Activation QA',
    plan: 'free',
  });
  if (existingProfileError) throw existingProfileError;

  const existingQuote = await claimQuote(existingUser, payload('EXISTING', {
    _profile_email: existingUser.email,
    _profile_name: 'Existing Activation QA',
    subtotal: 'not-a-number',
    discount_rate: 'bad-rate',
    discount_amount: '',
    tax_rate: null,
    tax_amount: 'invalid',
    total: 'NaN',
  }));
  assert.equal(existingQuote.subtotal, 0, 'invalid integer JSONB values must safely fall back to zero');
  assert.equal(Number(existingQuote.discount_rate), 0, 'invalid decimal JSONB values must safely fall back to zero');
  assert.equal(existingQuote.total, 0, 'invalid totals must safely fall back to zero');

  console.log('BUG-ACTIVATION-QUOTE-002 live verification passed.');
} finally {
  await Promise.all(createdUserIds.map((id) => supabase.auth.admin.deleteUser(id).catch(() => {})));
}
