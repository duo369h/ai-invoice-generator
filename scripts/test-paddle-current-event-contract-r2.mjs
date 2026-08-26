import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'src/app/api/webhooks/paddle/route.js'), 'utf8');
const expected = [
  'subscription.created',
  'subscription.updated',
  'subscription.activated',
  'subscription.canceled',
  'subscription.paused',
  'subscription.resumed',
  'transaction.completed',
];
const match = source.match(/const handledEvents = \[(.*?)\];/s);
assert.ok(match, 'handled event set must exist');
assert.deepEqual([...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]), expected);
assert.equal(source.includes("'payment.completed'"), false);
const unsupported = source.indexOf('return NextResponse.json({ received: true, processed: false });');
const supabaseInit = source.indexOf('const supabase = createServiceSupabaseClient();');
assert.ok(unsupported >= 0 && supabaseInit > unsupported, 'unsupported event must ack before DB access');
const signature = source.indexOf('if (!verifyPaddleSignature(signature, rawBody, secret))');
const parse = source.indexOf('const payload = JSON.parse(rawBody);');
assert.ok(signature >= 0 && parse > signature, 'signature verification must precede payload parsing');
assert.ok(source.includes("supabase.rpc('apply_paddle_webhook_event'"), 'atomic RPC must own event writes');
assert.ok(source.includes('payload.occurred_at'), 'route must pass occurred_at into ordering contract');
assert.ok(source.includes("eventType === 'transaction.completed'\n      ? 'active'"), 'transaction.completed must map to active subscription state');
assert.ok(source.includes("eventType === 'subscription.paused'\n        ? 'paused'"), 'subscription.paused must map to paused state');
assert.ok(source.includes("if (!payload.event_id)"), 'missing event_id must fail closed');
console.log('PADDLE_CURRENT_EVENT_CONTRACT_R2=PASS');
console.log(`CURRENT_VALID_HANDLED_EVENT_COUNT=${expected.length}`);
console.log('PAYMENT_COMPLETED_PRODUCTION_EXECUTABLE_OCCURRENCES=0');
console.log('UNSUPPORTED_EVENT_RESPONSE=200_RECEIVED_FALSE_PROCESSED');
