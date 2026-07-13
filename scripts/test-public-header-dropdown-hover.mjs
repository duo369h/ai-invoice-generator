import { chromium } from 'playwright';

const baseUrl = process.env.CORVIOZ_BASE_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

try {
  await page.goto(baseUrl, { waitUntil: 'networkidle' });

  const resources = page.getByRole('link', { name: 'Resources', exact: true });
  const photographer = page.getByRole('link', { name: 'For Photographers', exact: true });
  const resourcesGroup = resources.locator('xpath=..');

  await resources.hover();
  await photographer.waitFor({ state: 'visible', timeout: 1_000 });
  const triggerBox = await resourcesGroup.boundingBox();
  const dropdownBox = await photographer.boundingBox();

  if (!triggerBox || !dropdownBox) {
    throw new Error('Resources trigger or dropdown item was not measurable.');
  }

  await page.mouse.move(
    triggerBox.x + (triggerBox.width / 2),
    triggerBox.y + triggerBox.height + 5,
  );
  await photographer.waitFor({ state: 'visible', timeout: 1_000 });
  await photographer.hover();
  await photographer.click();
  await page.waitForURL(/\/for-photographers$/);

  console.log('PASS: Resources dropdown stays open when moving to and clicking a dropdown item.');
} finally {
  await browser.close();
}
