import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baselineSha = 'beaa965cc17e8e20d9c19534b88820c234450316';
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const readBaseline = (relativePath) => execFileSync(
  'git',
  ['show', `${baselineSha}:${relativePath}`],
  { cwd: root, encoding: 'utf8' },
);

const page = read('src/app/pricing/page.js');
const controller = read('src/app/pricing/controller.ts');
const viewModel = read('src/core/pricing/pricingViewModel.ts');
const paddleClient = read('src/app/lib/paddle-client.js');
const middleware = read('middleware.js');

const checkoutBlocks = (source) => [...source.matchAll(/paddle\.Checkout\.open\(\{([\s\S]*?)\n\s*\}\);/g)].map((match) => match[1]);
const pageCheckoutBlocks = checkoutBlocks(page);
const controllerCheckoutBlocks = checkoutBlocks(controller);
const failures = [];

function check(label, condition) {
  if (condition) {
    console.log(`${label}=PASS`);
  } else {
    console.error(`${label}=FAIL`);
    failures.push(label);
  }
}

check(
  'PADDLE_EXPLICIT_EN_LOCALE',
  pageCheckoutBlocks.length === 1
    && controllerCheckoutBlocks.length === 1
    && [...pageCheckoutBlocks, ...controllerCheckoutBlocks].every((block) => /locale\s*:\s*["']en["']/.test(block)),
);
check(
  'PRICING_PAGE_CHECKOUT_LOCALE_EN',
  pageCheckoutBlocks.length === 1 && /locale\s*:\s*["']en["']/.test(pageCheckoutBlocks[0]),
);
check(
  'PRICING_CONTROLLER_CHECKOUT_LOCALE_EN',
  controllerCheckoutBlocks.length === 1 && /locale\s*:\s*["']en["']/.test(controllerCheckoutBlocks[0]),
);
check(
  'AUTO_BROWSER_LOCALE_DISABLED_BY_EXPLICIT_SETTING',
  [...pageCheckoutBlocks, ...controllerCheckoutBlocks].every((block) => /locale\s*:\s*["']en["']/.test(block))
    && !`${page}\n${controller}`.match(/navigator\.language|navigator\.languages|language\s*:\s*window\./),
);

check(
  'MONTHLY_PRICE_MAPPING_UNCHANGED',
  viewModel === readBaseline('src/core/pricing/pricingViewModel.ts')
    && /billingPeriod\s*===\s*['"]monthly['"]\s*\?\s*priceMonthly\s*:\s*priceYearly/.test(viewModel)
    && /billingPeriod\s*===\s*['"]monthly['"]\s*\n\s*\?\s*\(plan\.paddle_monthly_price_id\s*\|\|\s*['"]['"]\)/.test(viewModel),
);
check(
  'ANNUAL_PRICE_MAPPING_UNCHANGED',
  viewModel === readBaseline('src/core/pricing/pricingViewModel.ts')
    && /billingPeriod\s*===\s*['"]monthly['"]\s*\?\s*\(plan\.paddle_monthly_price_id\s*\|\|\s*['"]['"]\)\s*:\s*\(plan\.paddle_yearly_price_id\s*\|\|\s*['"]['"]\)/.test(viewModel),
);

check('PADDLE_LIVE_ENVIRONMENT_CONTRACT_UNCHANGED', paddleClient === readBaseline('src/app/lib/paddle-client.js'));
check('PADDLE_CLIENT_TOKEN_CONTRACT_UNCHANGED', paddleClient === readBaseline('src/app/lib/paddle-client.js'));
check('CSP_CONTRACT_UNCHANGED', middleware === readBaseline('middleware.js'));

assert.deepEqual(failures, [], `Locale contract failures: ${failures.join(', ')}`);
