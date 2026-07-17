import assert from 'node:assert/strict';

import { safeAuthRedirect, startDocumentNavigation } from '../src/app/auth/auth-redirect.js';

const location = {
  origin: 'https://corvioz.test',
  assigned: null,
  assign(target) {
    this.assigned = target;
  },
};

function assertFallback(value, message) {
  assert.equal(safeAuthRedirect(value, location), '/dashboard', message);
}

assertFallback('/\\evil.example', 'literal backslashes must be rejected');
assertFallback('/%5Cevil.example', 'uppercase encoded backslashes must be rejected');
assertFallback('/%5cevil.example', 'lowercase encoded backslashes must be rejected');
assertFallback('https://evil.example', 'absolute external URLs must be rejected');
assertFallback('//evil.example', 'protocol-relative URLs must be rejected');
assertFallback('javascript:alert(1)', 'non-path protocols must be rejected');
assertFallback('/dashboard\nunsafe', 'ASCII control characters must be rejected');
assertFallback('/dashboard\u0000unsafe', 'NUL characters must be rejected');
assertFallback(
  new URLSearchParams('next=%2F%255Cevil.example').get('next'),
  'a backslash left after URLSearchParams decodes once must be rejected without decoding again',
);
assert.equal(
  safeAuthRedirect('/dashboard?tab=quotes#section', location),
  '/dashboard?tab=quotes#section',
  'safe internal paths must preserve their query and hash',
);
assert.equal(
  safeAuthRedirect('/dashboard?value=%252Fnot-decoded-again', location),
  '/dashboard?value=%252Fnot-decoded-again',
  'safeAuthRedirect must not apply a second URI decode',
);

startDocumentNavigation('/dashboard', location);
assert.equal(location.assigned, '/dashboard', 'document navigation must use the injected location assign method');

assert.throws(
  () => startDocumentNavigation('/dashboard', { origin: location.origin, assign() { throw new Error('assign failed'); } }),
  /assign failed/,
  'document navigation must preserve assign errors so the caller can recover its lock',
);

console.log('Auth redirect runtime tests passed.');
