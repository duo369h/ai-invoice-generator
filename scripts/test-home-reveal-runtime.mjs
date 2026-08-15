import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.CORVIOZ_BASE_URL || 'http://127.0.0.1:3000';
const revealIds = [
  'fp-section-reveal',
  'resources-surface-reveal',
  'founder-trust-reveal',
  'final-cta-reveal',
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

const readRevealState = () => page.evaluate((ids) => ids.map((id) => {
  const element = document.getElementById(id);
  const style = element ? getComputedStyle(element) : null;
  return {
    id,
    exists: Boolean(element),
    revealed: element?.classList.contains('revealed') ?? false,
    opacity: style?.opacity ?? 'missing',
  };
}), revealIds);

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  for (const id of revealIds) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
  }
  const state = await readRevealState();
  assert.ok(state.every((item) => item.exists && item.revealed && Number(item.opacity) > 0), `reveal state invalid: ${JSON.stringify(state)}`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), await page.evaluate(() => document.documentElement.clientWidth), 'HOME has no horizontal overflow');
  assert.deepEqual(consoleErrors, [], `HOME browser errors: ${consoleErrors.join(' | ')}`);

  await context.close();
  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(baseUrl, { waitUntil: 'networkidle' });
  const reducedState = await reducedPage.evaluate((ids) => ids.map((id) => {
    const element = document.getElementById(id);
    return { id, opacity: element ? getComputedStyle(element).opacity : 'missing' };
  }), revealIds);
  assert.ok(reducedState.every((item) => Number(item.opacity) > 0), `reduced-motion reveal state invalid: ${JSON.stringify(reducedState)}`);
  assert.equal(await reducedPage.evaluate(() => document.documentElement.scrollWidth), await reducedPage.evaluate(() => document.documentElement.clientWidth), 'HOME reduced-motion has no horizontal overflow');
  await reducedContext.close();
  console.log('home reveal runtime contract: PASS');
} finally {
  await browser.close();
}
