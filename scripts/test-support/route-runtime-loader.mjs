import { pathToFileURL } from 'node:url';

const mocks = pathToFileURL(new URL('./route-runtime-mocks.mjs', import.meta.url).pathname).href;

const mockedSpecifiers = new Set([
  'next/server',
  '../../lib/supabase',
  '../../lib/rate-limit',
  '../../lib/security',
  '../../lib/validation',
  '../../lib/product-analytics-server',
  '../../lib/first-revenue-loop',
  '../../../core/revenue/firstRevenueLoop',
  '../../../core/ai/AI_DECISION_INJECTION_MAP',
  '../../../core/ai/AI_DECISION_CORE',
  '../../../core/ai/AI_DECISION_GUARD',
  '../../lib/config',
  '../../../../lib/entitlements',
  '../../../../lib/supabase',
  '../../../../lib/security',
]);

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '../../../../lib/product-analytics-server') {
    return { url: new URL('../../src/app/lib/product-analytics-server.js', import.meta.url).href, shortCircuit: true };
  }
  if (specifier === './supabase' && context.parentURL?.endsWith('/product-analytics-server.js')) {
    return { url: `${mocks}?specifier=product-analytics-supabase`, shortCircuit: true };
  }
  if (specifier === 'next/headers') {
    return { url: `${mocks}?specifier=next-headers`, shortCircuit: true };
  }
  if (mockedSpecifiers.has(specifier)) {
    return { url: `${mocks}?specifier=${encodeURIComponent(specifier)}`, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
