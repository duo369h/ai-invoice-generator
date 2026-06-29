import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TEST_EMAIL = 'corvioz-e2e-test-user@gmail.com';
const TEST_PASSWORD = 'Corvioz-Test-Password-123!';

async function verify() {
  console.log('Starting Auth Route Verification...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  let passed = true;

  // Helper assert function
  const assert = (condition, message) => {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      passed = false;
    } else {
      console.log(`✓ PASS: ${message}`);
    }
  };

  try {
    // 1. Verify /api/auth/login redirects to /auth (GET)
    console.log('\n1. Verifying GET /api/auth/login...');
    const responseLogin = await page.goto('http://localhost:3000/api/auth/login');
    const finalUrlLogin = page.url();
    assert(
      finalUrlLogin.includes('/auth') || finalUrlLogin.endsWith('/auth'),
      `GET /api/auth/login should redirect to /auth. Final URL: ${finalUrlLogin}`
    );

    // 2. Verify /api/auth/signout redirects to / (GET)
    console.log('\n2. Verifying GET /api/auth/signout...');
    const responseSignout = await page.goto('http://localhost:3000/api/auth/signout');
    const finalUrlSignout = page.url();
    assert(
      finalUrlSignout === 'http://localhost:3000/' || finalUrlSignout === 'http://localhost:3000',
      `GET /api/auth/signout should redirect to /. Final URL: ${finalUrlSignout}`
    );

    // 3. Verify /api/auth/callback exists (GET)
    console.log('\n3. Verifying GET /api/auth/callback exists...');
    const responseCallback = await page.goto('http://localhost:3000/api/auth/callback');
    const finalUrlCallback = page.url();
    // Without code parameter, callback should redirect to /auth
    assert(
      finalUrlCallback.includes('/auth'),
      `GET /api/auth/callback without code should redirect to /auth. Final URL: ${finalUrlCallback}`
    );

    // 4. Verify Dashboard access works after login
    console.log('\n4. Verifying Dashboard access after login...');
    
    // Go to /auth page
    await page.goto('http://localhost:3000/auth');
    
    // Wait for Supabase to be loaded in the page context
    await page.waitForFunction(() => typeof window !== 'undefined' && typeof window.supabaseClientInstance !== 'undefined');

    // Run login script on page to authenticate using signInWithPassword
    const loginResult = await page.evaluate(async ({ email, password }) => {
      const client = window.supabaseClientInstance;
      if (!client) return { success: false, error: 'supabaseClientInstance is not exposed' };
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    }, { email: TEST_EMAIL, password: TEST_PASSWORD });

    assert(loginResult.success, `Login via signInWithPassword failed: ${loginResult.error}`);

    if (loginResult.success) {
      // Navigate to /dashboard
      console.log('Navigating to /dashboard after login...');
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForTimeout(2000); // Wait for initial loading
      
      const finalUrlDashboard = page.url();
      assert(
        finalUrlDashboard.includes('/dashboard'),
        `Should access /dashboard after login. Final URL: ${finalUrlDashboard}`
      );
      
      // Verify we are not in sandbox mode or showing unauthorized screen
      const pageTitle = await page.title();
      console.log(`Dashboard page title: "${pageTitle}"`);
      assert(
        !pageTitle.includes('404') && !pageTitle.includes('Error'),
        `Dashboard should load correctly. Title: ${pageTitle}`
      );
    }

  } catch (error) {
    console.error('Verification encountered an error:', error);
    passed = false;
  } finally {
    await browser.close();
  }

  if (passed) {
    console.log('\n✅ AUTH ROUTE VERIFICATION PASSED SUCCESSFULLY.');
    process.exit(0);
  } else {
    console.error('\n❌ AUTH ROUTE VERIFICATION FAILED.');
    process.exit(1);
  }
}

verify().catch(console.error);
