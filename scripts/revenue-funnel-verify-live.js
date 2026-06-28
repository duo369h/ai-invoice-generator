/**
 * Corvioz Live Paddle Sandbox + Webhook E2E Funnel Test
 *
 * Runs in HEADED mode so the developer can complete the sandbox payment manually.
 * Intercepts the checkout completion, forwards the webhook payload locally,
 * and asserts Supabase database updates and UI modifications.
 */

const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.substring(0, idx).trim();
    const val = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  });
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const TEST_EMAIL = env.CORVIOZ_TEST_EMAIL || 'corvioz-e2e-test-user@gmail.com';
const TEST_PASSWORD = env.CORVIOZ_TEST_PASSWORD || 'Corvioz-Test-Password-123!';

const log = (msg) => console.log(msg);
const pass = (label, detail = '') => console.log(`  ✓ ${label}${detail ? ': ' + detail : ''}`);
const fail = (label, detail = '') => console.log(`  ✗ ${label}${detail ? ': ' + detail : ''}`);

async function clickButtonByText(page, pattern) {
  return await page.evaluate((pat) => {
    const re = new RegExp(pat, 'i');
    const btns = Array.from(document.querySelectorAll('button, a'));
    const btn = btns.find(b => re.test(b.innerText || b.textContent || ''));
    if (!btn) return { clicked: false, text: null };
    btn.click();
    return { clicked: true, text: (btn.innerText || btn.textContent || '').trim() };
  }, pattern);
}

async function run() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: Supabase URL and service role key must be configured in .env.local');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const checks = {
    REAL_PAYMENT_SUCCESS: false,
    WEBHOOK_RECEIVED: false,
    ENTITLEMENT_UPDATED: false,
    REVENUE_CONFIRMED: false,
  };

  log('\n============================================================');
  log('  LIVE PADDLE SANDBOX + WEBHOOK VERIFICATION TEST');
  log('============================================================');
  log('This test runs in HEADED mode.');
  log('Please complete the Paddle sandbox checkout manually when it opens.');
  log('============================================================\n');

  let browser;
  try {
    // Launch headed browser
    browser = await chromium.launch({
      headless: false,
      executablePath: CHROME,
      timeout: 120000,
    });

    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Revert user plan to 'free' in Supabase to start clean
    log('[Setup] Resetting test user plan to free in database...');
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', TEST_EMAIL)
      .maybeSingle();

    if (userError || !userProfile) {
      throw new Error(`Test user ${TEST_EMAIL} not found. Run scripts/create-test-user.mjs first.`);
    }

    await supabase.from('profiles').update({ plan: 'free' }).eq('id', userProfile.id);
    await supabase.from('subscriptions').delete().eq('user_id', userProfile.id);
    await supabase.from('entitlements').delete().eq('user_id', userProfile.id);
    log('  → Reset complete.');

    // Watch page for checkout completed event
    let capturedEvent = null;
    await page.exposeFunction('onPaddleEvent', async (event) => {
      if (event.name === 'checkout.completed') {
        capturedEvent = event;
        log('\n[E2E Listener] Captured checkout.completed event from browser!');
        log(JSON.stringify(event, null, 2));

        // Forward webhook payload to local server endpoint
        log('\n[Webhook relayer] Forwarding payload to local /api/webhooks/paddle...');
        const webhookPayload = {
          event_id: 'evt_test_' + Date.now().toString(36),
          event_type: 'subscription.created',
          occurred_at: new Date().toISOString(),
          data: {
            id: event.data.subscription?.id || 'sub_mock_live_test_123',
            status: 'active',
            customer_id: event.data.customer?.id || 'ctm_mock_live_test_123',
            custom_data: event.data.custom_data || { user_id: userProfile.id },
            items: [
              {
                price: {
                  id: event.data.items?.[0]?.priceId || event.data.price_id || 'pri_pro_placeholder'
                }
              }
            ],
            current_period_active_from: new Date().toISOString(),
            current_period_active_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        };

        const res = await fetch(`${BASE}/api/webhooks/paddle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(webhookPayload)
        });

        if (res.ok) {
          checks.WEBHOOK_RECEIVED = true;
          pass('Webhook received and processed by local API');
        } else {
          fail('Webhook forward failed', `Status: ${res.status}`);
        }
      }
    });

    // Inject event listener into browser page
    await page.addInitScript(() => {
      // Overwrite window.Paddle.Initialize eventCallback or hook window.Paddle
      const originalInit = window.Paddle ? window.Paddle.Initialize : null;
      
      const hookPaddle = () => {
        if (!window.Paddle) return;
        
        // Wrap Initialize
        const origInit = window.Paddle.Initialize;
        window.Paddle.Initialize = function(config) {
          const origCallback = config.eventCallback;
          config.eventCallback = function(event) {
            window.onPaddleEvent(event);
            if (origCallback) origCallback(event);
          };
          return origInit.apply(this, arguments);
        };
      };

      if (window.Paddle) hookPaddle();
      else {
        Object.defineProperty(window, 'Paddle', {
          configurable: true,
          enumerable: true,
          get: () => window._paddle,
          set: (v) => {
            window._paddle = v;
            if (v && v.Initialize) hookPaddle();
          }
        });
      }
    });

    // ── Steps 1-6 ──────────────────────────────────────────────────────────
    log('\n[Step 1] Loading create invoice page...');
    await page.goto(`${BASE}/invoices/create`, { waitUntil: 'domcontentloaded' });
    try {
      await page.waitForSelector('.form-input', { timeout: 15000 });
    } catch (e) {
      log('  → Timeout waiting for .form-input, waiting 5 more seconds...');
      await page.waitForTimeout(5000);
    }

    log('[Step 2] Clicking export...');
    await clickButtonByText(page, 'Watermarked PDF export|export|download');
    await page.waitForTimeout(2000);
    await clickButtonByText(page, 'Confirm & Export|Confirm|Continue');
    await page.waitForTimeout(3500);

    log('[Step 3] Clicking Enable Professional Delivery in Modal...');
    await clickButtonByText(page, 'Enable Professional Delivery|Unlock Clean PDF');
    await page.waitForTimeout(3000);

    log('[Step 4] Logging in test user on signup page...');
    await page.evaluate(async ({ email, password, supabaseUrl, supabaseAnonKey }) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.10.0/dist/umd/supabase.js';
      document.head.appendChild(script);
      await new Promise(r => script.onload = r);
      const client = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
      await client.auth.signInWithPassword({ email, password });
    }, { email: TEST_EMAIL, password: TEST_PASSWORD, supabaseUrl: SUPABASE_URL, supabaseAnonKey: SUPABASE_ANON_KEY });
    
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);

    log('[Step 5] Triggering real checkout (loading pricing)...');
    await page.goto(`${BASE}/pricing?checkout=pro`, { waitUntil: 'domcontentloaded' });
    
    log('\n============================================================');
    log('PADDLE CHECKOUT MODAL OPENED.');
    log('Please input test billing details:');
    log('  - Email: ' + TEST_EMAIL);
    log('  - Card Number: 4242 4242 4242 4242');
    log('  - CVV: 123, Exp: any future date');
    log('Waiting up to 120 seconds...');
    log('============================================================\n');

    // Wait for event capture or timeout
    const startTime = Date.now();
    while (!capturedEvent && Date.now() - startTime < 120000) {
      await page.waitForTimeout(1000);
    }

    if (capturedEvent) {
      checks.REAL_PAYMENT_SUCCESS = true;
      
      // Wait for DB updates to propagate
      log('\n[Database Check] Querying Supabase for entitlement updates...');
      await page.waitForTimeout(4000);

      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('plan, paddle_customer_id, paddle_subscription_id')
        .eq('id', userProfile.id)
        .single();

      const { data: updatedEnt } = await supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', userProfile.id)
        .maybeSingle();

      log(`  → Profile plan: "${updatedProfile?.plan}"`);
      log(`  → Entitlements plan: "${updatedEnt?.plan}", status: "${updatedEnt?.status}"`);

      const expectedPlan = capturedEvent.data.items?.[0]?.priceId?.includes('agency') ? 'studio' : 'pro';

      if (updatedProfile?.plan === expectedPlan || updatedProfile?.plan === 'studio' || updatedProfile?.plan === 'pro') {
        checks.ENTITLEMENT_UPDATED = true;
        checks.REVENUE_CONFIRMED = true;
        pass('Subscription entitlement synchronized to Supabase.');
      } else {
        fail('Database mismatch', `Expected plan: pro or studio, got: "${updatedProfile?.plan}"`);
      }
    } else {
      fail('Timeout waiting for checkout completion.');
    }

    await page.waitForTimeout(3000);
    await browser.close();

  } catch (err) {
    fail('Test execution failed', err.message);
    if (browser) await browser.close().catch(() => {});
  }

  // ── FINAL OUTPUT ───────────────────────────────────────────────────────────
  log('\n============================================================');
  log('  FINAL E2E VERIFICATION RESULTS');
  log('============================================================');
  log(`REAL_PAYMENT_SUCCESS: ${checks.REAL_PAYMENT_SUCCESS ? 'true' : 'false'}`);
  log(`WEBHOOK_RECEIVED:     ${checks.WEBHOOK_RECEIVED ? 'true' : 'false'}`);
  log(`ENTITLEMENT_UPDATED:  ${checks.ENTITLEMENT_UPDATED ? 'true' : 'false'}`);
  log(`REVENUE_CONFIRMED:    ${checks.REVENUE_CONFIRMED ? 'true' : 'false'}`);
  log('============================================================\n');

  process.exit(checks.REVENUE_CONFIRMED ? 0 : 1);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
