export const LINE_ITEM_BILLING_UNITS = ['day', 'hour', 'image', 'person', 'item'];

const PLURAL_UNITS = {
  day: 'days',
  hour: 'hours',
  image: 'images',
  person: 'people',
  item: 'items',
};

function numeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function unitLabel(unit, quantity) {
  if (!unit) return '';
  return numeric(quantity) === 1 ? unit : PLURAL_UNITS[unit] || unit;
}

export function resolveLineItemMultiplier(item = {}) {
  const quantity = numeric(item.quantity, 0);
  const secondaryQuantity = item.secondaryQuantity;
  return secondaryQuantity === undefined || secondaryQuantity === null || secondaryQuantity === ''
    ? quantity
    : quantity * numeric(secondaryQuantity, 0);
}

export function calculateLineItemAmount(item = {}) {
  return resolveLineItemMultiplier(item) * numeric(item.unitPrice ?? item.unit_price, 0);
}

export function formatLineItemQuantityBasis(item = {}) {
  const quantity = item.quantity ?? '';
  const primary = item.billingUnit ? `${quantity} ${unitLabel(item.billingUnit, quantity)}` : String(quantity);
  if (item.secondaryQuantity === undefined || item.secondaryQuantity === null || item.secondaryQuantity === '') return primary;
  return `${primary} × ${item.secondaryQuantity} ${unitLabel(item.secondaryUnit, item.secondaryQuantity)}`;
}

export function formatLineItemRateBasis(item = {}) {
  const units = [item.billingUnit, item.secondaryUnit].filter(Boolean);
  return units.length ? `/${units.join('/')}` : '';
}

export function setLineItemBillingUnit(item = {}, billingUnit) {
  if (billingUnit) return { ...item, billingUnit };
  const { billingUnit: _billingUnit, secondaryQuantity: _secondaryQuantity, secondaryUnit: _secondaryUnit, ...simpleItem } = item;
  return simpleItem;
}
