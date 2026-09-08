import { LINE_ITEM_BILLING_UNITS } from '../../core/quotes/lineItemBilling.js';

export const MORE_UNITS_OPTION = '__more__';

const GENERAL_UNIT_OPTIONS = ['', ...LINE_ITEM_BILLING_UNITS];
const SHORTLISTS = {
  studio: ['day', 'hour', ''],
  retouching: ['image', 'hour', 'day', ''],
  photographer: ['day', 'hour', 'person', ''],
  'photo assistant': ['person', 'day', 'hour', ''],
  equipment: ['day', 'item', 'hour', ''],
  'post-production': ['hour', 'day', ''],
};

const normalizeKnownLabel = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/[–—]/g, '-')
  .replace(/\s+/g, ' ');

const shortlistFor = (description) => {
  const normalized = normalizeKnownLabel(description);
  if (normalized === 'studio' || normalized === 'studio hire') return SHORTLISTS.studio;
  if (normalized === 'retouching') return SHORTLISTS.retouching;
  if (['photographer', 'photography fee', 'creative fee', 'photography / creative fee'].includes(normalized)) return SHORTLISTS.photographer;
  if (normalized === 'photo assistant') return SHORTLISTS['photo assistant'];
  if (['equipment', 'equipment / lighting', 'lighting'].includes(normalized)) return SHORTLISTS.equipment;
  if (normalized === 'post-production') return SHORTLISTS['post-production'];
  return null;
};

export function getQuantityUnitOptions(description, expanded = false) {
  if (expanded) return GENERAL_UNIT_OPTIONS;
  const shortlist = shortlistFor(description);
  return shortlist ? [...shortlist, MORE_UNITS_OPTION] : GENERAL_UNIT_OPTIONS;
}
