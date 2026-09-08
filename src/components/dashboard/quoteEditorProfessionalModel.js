export const A4_DOCUMENT_WIDTH = 794;
export const A4_DOCUMENT_HEIGHT = 1123;
export const QUOTE_ITEMS_PER_PAGE = 11;

const normalizeItems = (items = []) => items.map((item, index) => ({
  ...item,
  originalIndex: Number.isInteger(item.originalIndex) ? item.originalIndex : index,
}));

export function paginateQuoteItems(items = [], capacity = QUOTE_ITEMS_PER_PAGE) {
  const normalized = normalizeItems(items);
  if (normalized.length === 0) return [[]];
  const pages = [];
  for (let index = 0; index < normalized.length; index += capacity) {
    pages.push(normalized.slice(index, index + capacity));
  }
  return pages;
}

function resolveQuoteItemInsertionIndex(sourceIndex, targetIndex, insertBefore) {
  const targetAfterRemoval = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  return Math.max(0, targetAfterRemoval + (insertBefore ? 0 : 1));
}

export function reorderQuoteItems(items = [], sourceIndex, targetIndex, insertBefore = true) {
  if (!Array.isArray(items) || sourceIndex === targetIndex || !Number.isInteger(sourceIndex) || !Number.isInteger(targetIndex)) {
    return Array.isArray(items) ? items.slice() : [];
  }
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex >= items.length || targetIndex >= items.length) return items.slice();

  const nextItems = items.slice();
  const [movedItem] = nextItems.splice(sourceIndex, 1);
  nextItems.splice(resolveQuoteItemInsertionIndex(sourceIndex, targetIndex, insertBefore), 0, movedItem);
  return nextItems;
}

export function remapActiveItemIndex(activeIndex, sourceIndex, targetIndex, insertBefore = true) {
  if (!Number.isInteger(activeIndex)) return null;
  if (activeIndex === sourceIndex) return resolveQuoteItemInsertionIndex(sourceIndex, targetIndex, insertBefore);
  if (sourceIndex < targetIndex && activeIndex > sourceIndex && activeIndex <= targetIndex) return activeIndex - 1;
  if (sourceIndex > targetIndex && activeIndex >= targetIndex && activeIndex < sourceIndex) return activeIndex + 1;
  return activeIndex;
}

export function derivePricingSections(items = []) {
  return [{ label: null, items: normalizeItems(items) }];
}

export function buildQuoteDraftFingerprint(quote = {}) {
  return JSON.stringify({
    qNumber: quote.qNumber || '',
    qClientId: quote.qClientId || null,
    qClientName: quote.qClientName || '',
    qClientEmail: quote.qClientEmail || '',
    qClientAddress: quote.qClientAddress || '',
    qItems: Array.isArray(quote.qItems) ? quote.qItems : [],
    qTaxRate: Number(quote.qTaxRate || 0),
    qDiscountRate: Number(quote.qDiscountRate || 0),
    qCurrency: quote.qCurrency || 'USD',
    qNotes: quote.qNotes || '',
    qDate: quote.qDate || '',
    qPhotographyScope: quote.qPhotographyScope || null,
  });
}

export function resolveDesktopQuoteAction({ hasSavedQuote, isDirty, status }) {
  if (!hasSavedQuote || isDirty) {
    return { statusLabel: 'Unsaved changes', action: 'save', actionLabel: 'Save' };
  }
  if (status === 'draft') {
    return { statusLabel: 'Saved', action: 'send', actionLabel: 'Send Quote' };
  }
  return { statusLabel: 'Saved', action: 'none', actionLabel: '' };
}

export const PHOTOGRAPHY_ITEM_SUGGESTIONS = [
  'Photography / Creative Fee',
  'Photo Assistant',
  'Producer',
  'Digital Tech',
  'Equipment / Lighting',
  'Studio / Location',
  'Talent',
  'Styling',
  'Props',
  'Retouching',
  'Travel / Expenses',
  'Production Fee',
];
