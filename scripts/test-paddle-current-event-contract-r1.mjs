import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const routePath = path.join(scriptDir, '..', 'src/app/api/webhooks/paddle/route.js');
const source = fs.readFileSync(routePath, 'utf8');

const expectedHandledEvents = [
  'subscription.created',
  'subscription.updated',
  'subscription.activated',
  'subscription.canceled',
  'subscription.paused',
  'subscription.resumed',
  'transaction.completed',
];

const handledEventsMatch = source.match(/const handledEvents = \[(.*?)\];/s);
assert.ok(handledEventsMatch, 'webhook route must declare its handled event set');

const handledEvents = [...handledEventsMatch[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
assert.deepEqual(
  handledEvents,
  expectedHandledEvents,
  'current Paddle handled event set must remain unchanged except for stale payment.completed removal'
);

assert.equal(
  source.includes("'payment.completed'"),
  false,
  'stale payment.completed must not be executable production webhook handling'
);
assert.equal(
  handledEvents.includes('payment.completed'),
  false,
  'payment.completed must not be recognized as a supported business event'
);

const unsupportedEventResponse = 'return NextResponse.json({ received: true, processed: false });';
const unsupportedEventIndex = source.indexOf(unsupportedEventResponse);
const supabaseInitIndex = source.indexOf('const supabase = createServiceSupabaseClient();');
assert.ok(unsupportedEventIndex >= 0, 'unsupported events must retain the existing acknowledgement response');
assert.ok(supabaseInitIndex > unsupportedEventIndex, 'unsupported events must return before Supabase/business writes');

const signatureGuard = 'if (!verifyPaddleSignature(signature, rawBody, secret))';
const signatureGuardIndex = source.indexOf(signatureGuard);
const payloadParseIndex = source.indexOf('const payload = JSON.parse(rawBody);');
assert.ok(signatureGuardIndex >= 0, 'signature verification path must remain present');
assert.ok(payloadParseIndex > signatureGuardIndex, 'signature verification must precede payload parsing');

const atomicRpc = "supabase.rpc('apply_paddle_webhook_event'";
const eventIdArgument = 'p_event_id: payload.event_id';
const occurredAtArgument = 'p_occurred_at: occurredAt.toISOString()';
assert.ok(source.includes(atomicRpc), 'webhook side effects must use the atomic ordering/idempotency RPC');
assert.ok(source.includes(eventIdArgument), 'atomic webhook RPC must be keyed by payload.event_id');
assert.ok(source.includes(occurredAtArgument), 'atomic webhook RPC must persist occurred_at for ordering');
assert.ok(source.includes("p_payload: payload"), 'atomic webhook RPC must retain the full event payload');

console.log('PADDLE_CURRENT_EVENT_CONTRACT_R1=PASS');
console.log(`CURRENT_VALID_HANDLED_EVENT_SET=${handledEvents.join(',')}`);
console.log('PAYMENT_COMPLETED_POST_CLEANUP_CLASSIFICATION=UNSUPPORTED_EVENT');
console.log('UNSUPPORTED_EVENT_RESPONSE=200_RECEIVED_FALSE_PROCESSED');
console.log('SIGNATURE_VERIFICATION_PATH=UNCHANGED');
console.log('EVENT_ID_DEDUPE_PATH=ATOMIC_RPC');
