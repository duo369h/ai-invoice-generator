const authMock = new URL('./supabase-request-auth-mock.mjs', import.meta.url).href;
const routeMock = new URL('./route-runtime-mocks.mjs', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@supabase/supabase-js') return { url: authMock, shortCircuit: true };
  if (specifier === 'next/server') return { url: routeMock, shortCircuit: true };
  if (specifier === './security' && context.parentURL?.endsWith('/src/app/lib/supabase.js')) {
    return { url: new URL('../../src/app/lib/security.js', import.meta.url).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
