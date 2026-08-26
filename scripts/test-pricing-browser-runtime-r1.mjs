import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.PRICING_BASE_URL || 'http://127.0.0.1:3330';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error' && !message.text().includes('webpack-hmr')) consoleErrors.push(message.text());
});

try {
  const pricingResponsePromise = page.waitForResponse((response) => {
    return new URL(response.url()).pathname === '/api/pricing';
  }, { timeout: 5000 });
  await page.goto(`${baseUrl}/pricing`, { waitUntil: 'domcontentloaded' });
  const pricingResponse = await pricingResponsePromise;
  assert.equal(pricingResponse.status(), 200);
  const pricingPayload = await pricingResponse.json();
  assert.equal(pricingPayload.success, true);
  assert.deepEqual(pricingPayload.plans.map((plan) => [plan.id, plan.price_monthly, plan.price_yearly]), [
    ['free', 0, 0], ['starter', 9, 90], ['pro', 19, 190], ['studio', null, null],
  ]);
  await page.waitForFunction(() => (
    document.querySelector('.a3-card.card-free .a3-price-figure')?.textContent === '$0'
    && document.querySelector('#price-starter')?.textContent === '$9'
    && document.querySelector('#price-pro')?.textContent === '$19'
  ), { timeout: 5000 });

  const visible = async () => ({
    free: await page.locator('.a3-card.card-free .a3-price-figure').innerText(),
    starter: await page.locator('#price-starter').innerText(),
    pro: await page.locator('#price-pro').innerText(),
    studio: await page.locator('.studio-status-pill').innerText(),
  });

  assert.deepEqual(await visible(), { free: '$0', starter: '$9', pro: '$19', studio: 'Coming Soon' });
  await page.locator('#label-yearly').click({ force: true });
  await page.waitForFunction(() => document.querySelector('#price-starter')?.textContent === '$90' && document.querySelector('#price-pro')?.textContent === '$190');
  assert.deepEqual(await visible(), { free: '$0', starter: '$90', pro: '$190', studio: 'Coming Soon' });
  await page.locator('#label-monthly').click({ force: true });
  await page.waitForFunction(() => document.querySelector('#price-starter')?.textContent === '$9' && document.querySelector('#price-pro')?.textContent === '$19');
  assert.deepEqual(await visible(), { free: '$0', starter: '$9', pro: '$19', studio: 'Coming Soon' });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert.equal(overflow, false, 'mobile pricing page must not overflow horizontally');
  assert.equal(consoleErrors.length, 0, `pricing runtime console errors: ${consoleErrors.join(' | ')}`);
  console.log('PRICING_FETCH_STATUS=200');
  console.log(`BROWSER_CONSOLE_ERRORS=${consoleErrors.length}`);
  console.log('PRICING_BROWSER_RUNTIME_R1=PASS');
} finally {
  await browser.close();
}
