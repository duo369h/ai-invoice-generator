import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.CORVIOZ_BASE_URL || 'http://127.0.0.1:3000';
const ctas = [
  '.btn-primary-cta',
  '.btn-hero-cta',
  '.btn-final-cta-primary',
];

const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 768, height: 900 },
    { width: 390, height: 844 },
    { width: 320, height: 844 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    const runtime = await page.evaluate((selectors) => ({
      ctas: selectors.map((selector) => {
        const element = document.querySelector(selector);
        const style = element ? getComputedStyle(element) : null;
        return {
          selector,
          exists: Boolean(element),
          background: style?.backgroundColor,
          color: style?.color,
        };
      }),
      separators: [...document.querySelectorAll('.footer-trust-sep')].map((element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { width: rect.width, height: rect.height, flex: style.flex };
      }),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }), ctas);

    assert.ok(runtime.ctas.every((cta) => cta.exists), `missing HOME CTA at ${viewport.width}: ${JSON.stringify(runtime.ctas)}`);
    assert.ok(runtime.ctas.every((cta) => cta.background === 'rgb(79, 70, 229)'), `incorrect CTA background at ${viewport.width}: ${JSON.stringify(runtime.ctas)}`);
    assert.ok(runtime.ctas.every((cta) => cta.color === 'rgb(255, 255, 255)'), `incorrect CTA text color at ${viewport.width}: ${JSON.stringify(runtime.ctas)}`);

    assert.equal(runtime.separators.length, 2, `incorrect separator count at ${viewport.width}: ${JSON.stringify(runtime.separators)}`);
    if (viewport.width >= 1100) {
      assert.ok(runtime.separators.every((separator) => Math.abs(separator.width - 1) <= 0.5), `footer separators must be 1px at ${viewport.width}: ${JSON.stringify(runtime.separators)}`);
    } else {
      assert.ok(runtime.separators.every((separator) => separator.width === 0), `mobile footer separators must remain hidden at ${viewport.width}: ${JSON.stringify(runtime.separators)}`);
    }
    assert.equal(runtime.overflow, false, `HOME has horizontal overflow at ${viewport.width}`);
    await context.close();
  }
  console.log('home CTA/footer runtime contract: PASS');
} finally {
  await browser.close();
}
