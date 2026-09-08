import { calculateLineItemAmount } from '../../core/quotes/lineItemBilling.js';

export function calculateQuoteTotals(items = [], discountRate = 0, taxRate = 0) {
  const subtotal = items.reduce(
    (sum, item) => sum + calculateLineItemAmount(item),
    0,
  );
  const discount = subtotal * (Number(discountRate || 0) / 100);
  const discountedSubtotal = subtotal - discount;
  const tax = discountedSubtotal * (Number(taxRate || 0) / 100);

  return {
    subtotal,
    discount,
    discountedSubtotal,
    tax,
    total: discountedSubtotal + tax,
  };
}
