export function shouldBypassOnboardingForFirstQuote(search = '') {
  const normalizedSearch = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(normalizedSearch).get('flow') === 'first-quote';
}

export function buildFirstQuoteActivationEvent({
  userId,
  quoteId,
  quoteNumber,
  presetId,
  completedAt,
}) {
  return {
    event: 'FIRST_VALUE_CREATED',
    userId,
    timestamp: completedAt,
    metadata: {
      type: 'quote',
      source: 'first_quote_onboarding',
      quote_id: quoteId,
      quote_number: quoteNumber,
      preset_id: presetId,
    },
  };
}
