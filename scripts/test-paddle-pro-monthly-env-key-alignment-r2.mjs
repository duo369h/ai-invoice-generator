import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const route = fs.readFileSync(path.join(root, 'src/app/api/webhooks/paddle/route.js'), 'utf8');
const start = route.indexOf('function resolvePlanFromPriceId');
const end = route.indexOf('function extractPriceId');
if (start < 0 || end < 0) throw new Error('resolver source not found');

const resolvePlanFromPriceId = new Function(
  `${route.slice(start, end)}; return resolvePlanFromPriceId;`,
)();

const original = {
  canonical: process.env.NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID,
  legacy: process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID,
  yearly: process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID,
  starter: process.env.NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID,
  starterYearly: process.env.NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID,
};

function setEnv({ canonical, legacy, yearly = 'pri_pro_yearly', starter = 'pri_starter_monthly', starterYearly = 'pri_starter_yearly' }) {
  for (const [key, value] of Object.entries({
    NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID: canonical,
    NEXT_PUBLIC_PADDLE_PRO_PRICE_ID: legacy,
    NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID: yearly,
    NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID: starter,
    NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID: starterYearly,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function check(label, actual, expected) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, received ${actual}`);
  console.log(`PASS=${label}`);
}

try {
  setEnv({ canonical: 'pri_pro_canonical', legacy: undefined });
  check('CANONICAL_ONLY', resolvePlanFromPriceId('pri_pro_canonical'), 'pro');

  setEnv({ canonical: undefined, legacy: 'pri_pro_legacy' });
  check('LEGACY_ONLY', resolvePlanFromPriceId('pri_pro_legacy'), 'pro');

  setEnv({ canonical: 'pri_pro_same', legacy: 'pri_pro_same' });
  check('BOTH_EQUAL', resolvePlanFromPriceId('pri_pro_same'), 'pro');

  setEnv({ canonical: 'pri_pro_canonical', legacy: 'pri_pro_legacy' });
  check('CONFLICT_FAIL_CLOSED', resolvePlanFromPriceId('pri_pro_canonical'), null);
  check('CONFLICT_LEGACY_FAIL_CLOSED', resolvePlanFromPriceId('pri_pro_legacy'), null);
  check('CONFLICT_UNKNOWN_FAIL_CLOSED', resolvePlanFromPriceId('pri_unknown'), null);

  setEnv({ canonical: 'pri_pro_canonical', legacy: 'pri_pro_legacy' });
  check('YEARLY_REMAINS_INDEPENDENT', resolvePlanFromPriceId('pri_pro_yearly'), 'pro');
  check('STARTER_REMAINS_INDEPENDENT', resolvePlanFromPriceId('pri_starter_monthly'), 'starter');
} finally {
  const restore = {
    NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID: original.canonical,
    NEXT_PUBLIC_PADDLE_PRO_PRICE_ID: original.legacy,
    NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID: original.yearly,
    NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID: original.starter,
    NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID: original.starterYearly,
  };
  for (const [key, value] of Object.entries(restore)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

console.log('PRO_MONTHLY_ENV_FAIL_CLOSED=PASS');
