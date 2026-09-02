import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

globalThis.__r55cNextResponse = {
  json(body, init = {}) {
    return { body, status: init.status || 200, async json() { return this.body; } };
  },
};

const route = await import('../src/app/api/intelligence/photography-quote-review/route.js');
const { createEmptyPhotographyScope } = await import('../src/core/quotes/photographyQuoteScope.js');

const request = (body) => ({ async json() { return body; } });
const invalidJsonRequest = { async json() { throw new Error('invalid json'); } };
const scope = createEmptyPhotographyScope();
const body = {
  templateId: 'portrait-session',
  scope,
  lineItems: [{ description: 'Portrait session', quantity: 1 }],
  publicNotes: 'Final images are selected by the client.',
  currency: 'USD',
};

const unauthenticated = await route.POST(request(body));
assert.equal(unauthenticated.status, 401);

const authenticatedDependencies = {
  getRequestUser: async () => ({ mode: 'supabase', user: { id: 'user-1' } }),
  requestContextResponse: () => null,
  rateLimitAuthenticated: async () => ({ success: true }),
  getSemanticReviewProvider: () => ({
    async review() {
      return { findings: [{ code: 'selection-clarity', category: 'IMPROVE', severity: 'medium', title: 'Clarify selection', message: 'Selection timing is unclear.', evidence: 'Public Notes: Final images are selected by the client.', recommendedAction: 'Add the selection timing.', confidence: 'high' }] };
    },
  }),
};
const accepted = await route.handlePhotographyQuoteReview(request(body), authenticatedDependencies);
assert.equal(accepted.status, 200);
assert.equal(accepted.body.status, 'COMPLETE');
assert.equal(accepted.body.semanticFindings[0].source, 'llm');
assert.equal(accepted.body.findings.some((finding) => finding.source === 'llm'), true);

const piiRejected = await route.handlePhotographyQuoteReview(request({ ...body, client_email: 'client@example.com' }), authenticatedDependencies);
assert.equal(piiRejected.status, 400);
const invalidJsonRejected = await route.handlePhotographyQuoteReview(invalidJsonRequest, authenticatedDependencies);
assert.equal(invalidJsonRejected.status, 400);
const oversizedRejected = await route.handlePhotographyQuoteReview(request({ ...body, publicNotes: 'x'.repeat(4001) }), authenticatedDependencies);
assert.equal(oversizedRejected.status, 400);

const source = fs.readFileSync(path.join(path.resolve(new URL('..', import.meta.url).pathname), 'src/app/api/intelligence/photography-quote-review/route.js'), 'utf8');
assert.doesNotMatch(source, /\.insert\(|\.update\(|\.delete\(/);
assert.match(source, /requestContextResponse/);
assert.match(source, /getRequestUser/);

console.log('R55C AUTHENTICATED ROUTE TESTS: PASS');
