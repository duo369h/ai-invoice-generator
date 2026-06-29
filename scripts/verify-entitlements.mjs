import { chromium } from 'playwright';
import assert from 'assert';

const TEST_EMAIL = 'corvioz-e2e-test-user@gmail.com';
const TEST_PASSWORD = 'Corvioz-Test-Password-123!';

async function verify() {
  console.log('Starting Entitlement Enforcement Verification...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let passed = true;

  try {
    // 1. Log in to get the Supabase session token
    await page.goto('http://localhost:3000/auth');
    await page.waitForFunction(() => typeof window !== 'undefined' && typeof window.supabaseClientInstance !== 'undefined');

    const loginResult = await page.evaluate(async ({ email, password }) => {
      const client = window.supabaseClientInstance;
      if (!client) return { success: false, error: 'supabaseClientInstance is not exposed' };
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }, { email: TEST_EMAIL, password: TEST_PASSWORD });

    if (!loginResult.success) {
      throw new Error(`Login failed: ${loginResult.error}`);
    }

    const session = await page.evaluate(async () => {
      const client = window.supabaseClientInstance;
      const { data } = await client.auth.getSession();
      return data.session;
    });

    const token = session?.access_token;
    if (!token) {
      throw new Error('Failed to retrieve Supabase session access token');
    }
    console.log('✓ Successfully retrieved Supabase session token. Token length:', token.length);

    // Helper fetch function
    const apiFetch = async (path, options = {}) => {
      const url = `http://localhost:3000${path}`;
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers
      };
      const res = await fetch(url, {
        ...options,
        headers
      });
      const data = await res.json().catch(() => ({}));
      return { status: res.status, data };
    };

    // --- TEST 1: Unauthenticated Requests ---
    console.log('\n--- Running Unauthenticated Tests ---');
    
    // Invoices POST
    const unauthInvoice = await apiFetch('/api/invoices', { method: 'POST', body: JSON.stringify({}) });
    assert.strictEqual(unauthInvoice.status, 401, 'Unauthenticated invoice creation must return 401');
    console.log('✓ POST /api/invoices (Unauthenticated) -> 401');

    // Quotes POST
    const unauthQuote = await apiFetch('/api/quotes', { method: 'POST', body: JSON.stringify({}) });
    assert.strictEqual(unauthQuote.status, 401, 'Unauthenticated quote creation must return 401');
    console.log('✓ POST /api/quotes (Unauthenticated) -> 401');

    // PDF Export
    const unauthPdf = await apiFetch('/api/pdf/export', { method: 'POST', body: JSON.stringify({}) });
    assert.strictEqual(unauthPdf.status, 401, 'Unauthenticated PDF export must return 401');
    console.log('✓ POST /api/pdf/export (Unauthenticated) -> 401');

    // Portal Token Generate
    const unauthPortal = await apiFetch('/api/portal/token/generate', { method: 'POST', body: JSON.stringify({}) });
    assert.strictEqual(unauthPortal.status, 401, 'Unauthenticated portal token generation must return 401');
    console.log('✓ POST /api/portal/token/generate (Unauthenticated) -> 401');

    // --- TEST 2: Authenticated but Free Plan Entitlement Checks ---
    console.log('\n--- Running Authenticated Plan Restriction Tests ---');
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    // Invoices POST: Free plan should block invoices with 403 & UPGRADE_REQUIRED
    const authInvoice = await apiFetch('/api/invoices', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        client_name: 'Test Client',
        client_email: 'client@test.com',
        items: [{ description: 'Test Item', quantity: 1, unitPrice: 100 }],
        currency: 'usd',
        doc_type: 'invoice'
      })
    });
    assert.strictEqual(authInvoice.status, 403, 'Free plan must be blocked from creating invoices (403)');
    assert.strictEqual(authInvoice.data.error, 'UPGRADE_REQUIRED');
    assert.strictEqual(authInvoice.data.requiredPlan, 'pro');
    console.log('✓ POST /api/invoices (Authenticated - Free Plan) -> 403 UPGRADE_REQUIRED (Required: pro)');

    // PDF Export: Free plan should block secure export with 403 & UPGRADE_REQUIRED
    const authPdf = await apiFetch('/api/pdf/export', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({})
    });
    assert.strictEqual(authPdf.status, 403, 'Free plan must be blocked from secure PDF export (403)');
    assert.strictEqual(authPdf.data.error, 'UPGRADE_REQUIRED');
    assert.strictEqual(authPdf.data.requiredPlan, 'pro');
    console.log('✓ POST /api/pdf/export (Authenticated - Free Plan) -> 403 UPGRADE_REQUIRED (Required: pro)');

    // Portal Token Generate: Free plan should block client portal token generation with 403 & UPGRADE_REQUIRED
    const authPortal = await apiFetch('/api/portal/token/generate', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        resource_id: 'any-id',
        resource_type: 'invoice'
      })
    });
    assert.strictEqual(authPortal.status, 403, 'Free plan must be blocked from portal token generation (403)');
    assert.strictEqual(authPortal.data.error, 'UPGRADE_REQUIRED');
    assert.strictEqual(authPortal.data.requiredPlan, 'pro');
    console.log('✓ POST /api/portal/token/generate (Authenticated - Free Plan) -> 403 UPGRADE_REQUIRED (Required: pro)');

    // Quotes POST limit check
    console.log('\n--- Running Quotes Limit Checks ---');
    const quotePayload = {
      client_name: 'Test Client',
      client_email: 'client@test.com',
      items: [{ description: 'Test Item', quantity: 1, unitPrice: 100 }],
      currency: 'usd',
      status: 'draft'
    };

    const firstQuote = await apiFetch('/api/quotes', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(quotePayload)
    });

    if (firstQuote.status === 200) {
      console.log('✓ First quote created successfully (allowed for free plan).');
      // Attempt to create second quote -> should be blocked
      const secondQuote = await apiFetch('/api/quotes', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(quotePayload)
      });
      assert.strictEqual(secondQuote.status, 403, 'Second quote creation must be blocked with 403');
      assert.strictEqual(secondQuote.data.error, 'UPGRADE_REQUIRED');
      assert.strictEqual(secondQuote.data.requiredPlan, 'starter');
      console.log('✓ POST /api/quotes (Second Quote - Free Plan) -> 403 UPGRADE_REQUIRED (Required: starter)');
    } else {
      assert.strictEqual(firstQuote.status, 403, 'Quote creation should be blocked if limit is already met');
      assert.strictEqual(firstQuote.data.error, 'UPGRADE_REQUIRED');
      assert.strictEqual(firstQuote.data.requiredPlan, 'starter');
      console.log('✓ POST /api/quotes (Limit already met - Free Plan) -> 403 UPGRADE_REQUIRED (Required: starter)');
    }

  } catch (error) {
    console.error('❌ Entitlements Verification failed:', error);
    passed = false;
  } finally {
    await browser.close();
  }

  if (passed) {
    console.log('\n✅ SERVER-SIDE ENTITLEMENTS VERIFICATION PASSED.');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

verify().catch(console.error);
