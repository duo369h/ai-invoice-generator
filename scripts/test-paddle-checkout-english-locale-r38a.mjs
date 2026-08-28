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

const failures = [];

function check(label, condition) {
  if (condition) {
    console.log(`${label}=PASS`);
  } else {
    console.error(`${label}=FAIL`);
    failures.push(label);
  }
}

function findMatchingBrace(source, openingBraceIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = openingBraceIndex; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') depth += 1;
    if (character === '}' && --depth === 0) return index;
  }

  return -1;
}

function splitTopLevelProperties(objectBody) {
  const properties = [];
  let start = 0;
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = 0; index < objectBody.length; index += 1) {
    const character = objectBody[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{' || character === '[' || character === '(') depth += 1;
    if (character === '}' || character === ']' || character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      properties.push(objectBody.slice(start, index));
      start = index + 1;
    }
  }

  properties.push(objectBody.slice(start));
  return properties;
}

function extractCheckoutObjects(source) {
  const objects = [];
  const callPattern = /paddle\.Checkout\.open\(\{/g;
  let match;

  while ((match = callPattern.exec(source))) {
    const openingBraceIndex = match.index + match[0].length - 1;
    const closingBraceIndex = findMatchingBrace(source, openingBraceIndex);
    if (closingBraceIndex === -1) continue;
    objects.push(source.slice(openingBraceIndex + 1, closingBraceIndex));
  }

  return objects;
}

function getTopLevelProperty(properties, name) {
  return properties.find((property) => new RegExp(`^\\s*${name}\\s*:`).test(property));
}

function hasSettingsLocaleEn(source) {
  const checkoutObjects = extractCheckoutObjects(source);
  if (checkoutObjects.length !== 1) return false;

  const properties = splitTopLevelProperties(checkoutObjects[0]);
  if (getTopLevelProperty(properties, 'locale')) return false;

  const settingsProperty = getTopLevelProperty(properties, 'settings');
  if (!settingsProperty) return false;

  const settingsOpeningBraceIndex = settingsProperty.indexOf('{');
  const settingsClosingBraceIndex = findMatchingBrace(settingsProperty, settingsOpeningBraceIndex);
  if (settingsOpeningBraceIndex === -1 || settingsClosingBraceIndex === -1) return false;

  const settingsBody = settingsProperty.slice(settingsOpeningBraceIndex + 1, settingsClosingBraceIndex);
  return /^\s*locale\s*:\s*["']en["']\s*$/m.test(settingsBody);
}

const pageCheckoutObjects = extractCheckoutObjects(page);
const controllerCheckoutObjects = extractCheckoutObjects(controller);
const allCheckoutSources = [page, controller];

check(
  'CHECKOUT_OPEN_SETTINGS_SHAPE_TEST',
  allCheckoutSources.every((source) => hasSettingsLocaleEn(source)),
);
check(
  'PRICING_PAGE_SETTINGS_LOCALE_TEST',
  pageCheckoutObjects.length === 1 && hasSettingsLocaleEn(page),
);
check(
  'PRICING_CONTROLLER_SETTINGS_LOCALE_TEST',
  controllerCheckoutObjects.length === 1 && hasSettingsLocaleEn(controller),
);
check(
  'PADDLE_CHECKOUT_SETTINGS_LOCALE_EN',
  allCheckoutSources.every((source) => hasSettingsLocaleEn(source)),
);
check(
  'TOP_LEVEL_CHECKOUT_LOCALE_ABSENT',
  allCheckoutSources.every((source) => extractCheckoutObjects(source).every((objectBody) => {
    return !getTopLevelProperty(splitTopLevelProperties(objectBody), 'locale');
  })),
);
check(
  'TOP_LEVEL_LOCALE_REGRESSION_TEST',
  !hasSettingsLocaleEn('paddle.Checkout.open({ locale: "en" });')
    && !hasSettingsLocaleEn('paddle.Checkout.open({ items: [], locale: "en" });'),
);
check(
  'AUTO_BROWSER_LOCALE_DISABLED_BY_EXPLICIT_SETTING',
  allCheckoutSources.every((source) => hasSettingsLocaleEn(source))
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

check('PADDLE_ENVIRONMENT_UNCHANGED', paddleClient === readBaseline('src/app/lib/paddle-client.js'));
check('PADDLE_CLIENT_TOKEN_CONTRACT_UNCHANGED', paddleClient === readBaseline('src/app/lib/paddle-client.js'));
check('CSP_CONTRACT_UNCHANGED', middleware === readBaseline('middleware.js'));

assert.deepEqual(failures, [], `Locale contract failures: ${failures.join(', ')}`);
