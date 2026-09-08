import assert from 'node:assert/strict';

const billing = await import('../src/core/quotes/lineItemBilling.js');
const { ValidationError, validateQuotePayload } = await import('../src/app/lib/validation.js');

assert.equal(billing.resolveLineItemMultiplier({ quantity: 2, secondaryQuantity: 2 }), 4);
assert.equal(billing.calculateLineItemAmount({ quantity: 2, secondaryQuantity: 2, unitPrice: 500 }), 2000);
assert.equal(billing.formatLineItemQuantityBasis({ quantity: 2, billingUnit: 'person', secondaryQuantity: 2, secondaryUnit: 'day' }), '2 people × 2 days');
assert.equal(billing.formatLineItemRateBasis({ billingUnit: 'person', secondaryUnit: 'day' }), '/person/day');
assert.equal(billing.formatLineItemQuantityBasis({ quantity: 2 }), '2');
assert.equal(billing.formatLineItemRateBasis({}), '');
assert.deepEqual(
  billing.setLineItemBillingUnit({ quantity: 2, billingUnit: 'person', secondaryQuantity: 2, secondaryUnit: 'day' }, ''),
  { quantity: 2 },
  'clearing the primary unit clears an orphan secondary basis',
);
assert.deepEqual([
  billing.calculateLineItemAmount({ quantity: 1, unitPrice: 2000 }),
  billing.calculateLineItemAmount({ quantity: 2, billingUnit: 'day', unitPrice: 2500 }),
  billing.calculateLineItemAmount({ quantity: 8, billingUnit: 'image', unitPrice: 120 }),
  billing.calculateLineItemAmount({ quantity: 12, billingUnit: 'hour', unitPrice: 150 }),
  billing.calculateLineItemAmount({ quantity: 2, billingUnit: 'person', secondaryQuantity: 2, secondaryUnit: 'day', unitPrice: 500 }),
], [2000, 5000, 960, 1800, 2000]);

const validatedQuote = validateQuotePayload({
  client_name: 'Client',
  items: [{ description: 'Photo Assistant', quantity: 2, unitPrice: 500, billingUnit: 'person', secondaryQuantity: 2, secondaryUnit: 'day', ignored: 'drop-me' }],
  discount_rate: 0,
  tax_rate: 0,
  currency: 'USD',
  notes: '',
});
assert.deepEqual(validatedQuote.items[0], {
  description: 'Photo Assistant',
  quantity: 2,
  unitPrice: 500,
  billingUnit: 'person',
  secondaryQuantity: 2,
  secondaryUnit: 'day',
});
assert.throws(
  () => validateQuotePayload({ client_name: 'Client', items: [{ description: 'Studio', quantity: 2, unitPrice: 500, secondaryUnit: 'day' }], discount_rate: 0, tax_rate: 0, currency: 'USD', notes: '' }),
  ValidationError,
);

console.log('Line-item billing basis: PASS');
