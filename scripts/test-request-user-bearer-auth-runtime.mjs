import assert from 'node:assert/strict';
import { getRequestUser } from '../src/app/lib/supabase.js';
import {
  getSupabaseRequestAuthClients,
  getSupabaseRequestAuthGetUserTokens,
  resetSupabaseRequestAuthRuntime,
} from './test-support/supabase-request-auth-mock.mjs';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-ref.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

const storageKey = 'sb-test-ref-auth-token';
const cookieFor = (accessToken) => `${storageKey}.0=${encodeURIComponent(JSON.stringify({ access_token: accessToken }))}`;
const request = (headers = {}) => new Request('https://www.corvioz.com/api/events/activation/claim', { headers });

resetSupabaseRequestAuthRuntime();
let context = await getRequestUser(request({ authorization: 'Bearer valid-bearer-token' }));
assert.equal(context.mode, 'supabase', 'a valid bearer token authenticates the request');
assert.equal(context.user.id, 'bearer-user');
assert.equal(getSupabaseRequestAuthClients().at(-1)?.global?.headers?.Authorization, 'Bearer valid-bearer-token');
assert.deepEqual(getSupabaseRequestAuthGetUserTokens(), ['valid-bearer-token'], 'a bearer request verifies that exact token with Supabase Auth');

resetSupabaseRequestAuthRuntime();
context = await getRequestUser(request({ cookie: cookieFor('valid-cookie-token') }));
assert.equal(context.mode, 'supabase', 'the existing cookie session remains authenticated');
assert.equal(context.user.id, 'cookie-user');

resetSupabaseRequestAuthRuntime();
context = await getRequestUser(request());
assert.equal(context.mode, 'unauthenticated', 'a request without credentials is unauthenticated');

resetSupabaseRequestAuthRuntime();
context = await getRequestUser(request({ authorization: 'Bearer invalid-token', cookie: cookieFor('valid-cookie-token') }));
assert.equal(context.mode, 'unauthenticated', 'an invalid bearer token cannot fall back to a different cookie user');
assert.equal(context.user, null);
assert.equal(getSupabaseRequestAuthClients().at(-1)?.auth?.storage?.getItem(storageKey), null, 'a bearer request never exposes a cookie session to Supabase Auth');

console.log('Request user bearer authentication runtime tests passed.');
