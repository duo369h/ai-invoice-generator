import { pathToFileURL } from 'node:url';

const mocks = pathToFileURL(new URL('./r55c-route-mocks.mjs', import.meta.url).pathname).href;
const mockedSpecifiers = new Set([
  'next/server',
  '../../../lib/supabase',
  '../../../lib/rate-limit',
  '../../../lib/security',
]);

export async function resolve(specifier, context, nextResolve) {
  if (mockedSpecifiers.has(specifier)) return { url: `${mocks}?specifier=${encodeURIComponent(specifier)}`, shortCircuit: true };
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (!url.startsWith(mocks)) return nextLoad(url, context);
  const specifier = new URL(url).searchParams.get('specifier');
  if (!specifier) return nextLoad(url, context);
  if (specifier === 'next/server') return {
    format: 'module',
    shortCircuit: true,
    source: `export const NextResponse = globalThis.__r55cNextResponse;`,
  };
  const exportsBySpecifier = {
    '../../../lib/supabase': 'getRequestUser',
    '../../../lib/rate-limit': 'rateLimitAuthenticated',
    '../../../lib/security': 'authRequiredResponse, requestContextResponse',
  };
  return {
    format: 'module',
    shortCircuit: true,
    source: `export { ${exportsBySpecifier[specifier]} } from '${mocks}';`,
  };
}
