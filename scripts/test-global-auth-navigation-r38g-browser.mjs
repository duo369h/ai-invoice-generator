import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.CORVIOZ_BASE_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  const header = page.locator('nav[data-public-header="v2"]');
  await header.getByRole('link', { name: 'Sign in', exact: true }).waitFor({ state: 'visible' });
  await header.getByRole('link', { name: 'Create Quote', exact: true }).waitFor({ state: 'visible' });
  console.log('GLOBAL_AUTH_NAV_R38G_UNAUTHENTICATED_PUBLIC_HOME=PASS');

  await page.goto(`${baseUrl}/pricing`, { waitUntil: 'networkidle' });
  await header.getByRole('link', { name: 'Sign in', exact: true }).waitFor({ state: 'visible' });
  await header.getByRole('link', { name: 'Create Quote', exact: true }).waitFor({ state: 'visible' });
  console.log('GLOBAL_AUTH_NAV_R38G_UNAUTHENTICATED_PRICING=PASS');

  const clientReady = await page.evaluate(() => Boolean(window.supabaseClientInstance));
  assert.equal(clientReady, true, 'Supabase browser client must initialize for the authenticated fixture');
  const storageKey = 'sb-127-auth-token';
  const session = {
    access_token: 'header-test-access-token',
    refresh_token: 'header-test-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: 'bearer',
    user: { id: 'header-test-user', email: 'header-test@example.com' },
  };
  await context.addInitScript(({ key, storedSession }) => {
    window.localStorage.setItem(key, JSON.stringify(storedSession));
  }, { key: storageKey, storedSession: session });

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelectorAll('nav[data-public-header="v2"] a.public-v2-signin').length > 0
    && !Array.from(document.querySelectorAll('nav[data-public-header="v2"] a.public-v2-signin')).some((link) => link.textContent?.trim() === 'Sign in'));
  await header.getByRole('link', { name: 'Dashboard', exact: true }).first().waitFor({ state: 'visible' });
  await header.getByRole('link', { name: 'Create Quote', exact: true }).first().waitFor({ state: 'visible' });
  assert.equal(await header.getByRole('link', { name: 'Sign in', exact: true }).count(), 0);
  assert.equal(await header.getByRole('link', { name: 'Start free', exact: true }).count(), 0);
  assert.equal(await header.getByRole('link', { name: 'Create Account', exact: true }).count(), 0);
  console.log('GLOBAL_AUTH_NAV_R38G_AUTHENTICATED_PUBLIC_HOME=PASS');

  await page.goto(`${baseUrl}/pricing`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !Array.from(document.querySelectorAll('nav[data-public-header="v2"] a.public-v2-signin')).some((link) => link.textContent?.trim() === 'Sign in'));
  await header.getByRole('link', { name: 'Dashboard', exact: true }).first().waitFor({ state: 'visible' });
  assert.equal(await header.getByRole('link', { name: 'Sign in', exact: true }).count(), 0);
  console.log('GLOBAL_AUTH_NAV_R38G_AUTHENTICATED_PRICING=PASS');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Open navigation menu', exact: true }).click();
  const mobileMenu = page.locator('nav[aria-label="Mobile navigation"]');
  await mobileMenu.getByRole('link', { name: 'Dashboard', exact: true }).waitFor({ state: 'visible' });
  await mobileMenu.getByRole('link', { name: 'Create Quote', exact: true }).waitFor({ state: 'visible' });
  assert.equal(await mobileMenu.getByRole('link', { name: 'Sign in', exact: true }).count(), 0);
  assert.equal(await mobileMenu.getByRole('link', { name: 'Start quoting for free', exact: true }).count(), 0);
  console.log('GLOBAL_AUTH_NAV_R38G_MOBILE_AUTHENTICATED=PASS');
} finally {
  await context.close();
  await browser.close();
}
