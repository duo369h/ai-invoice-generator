export const PHOTOGRAPHY_QUOTE_PRESETS = [
  {
    id: 'wedding-shoot',
    name: 'Wedding Shoot',
    category: 'Wedding',
    description: 'Coverage, second shooter options, album add-ons, deposit, delivery, and final balance terms.',
    defaultCurrency: 'USD',
    defaultLineItems: [
      { description: 'Wedding day photography coverage', quantity: 8, unitPrice: 250 },
      { description: 'Second shooter add-on', quantity: 1, unitPrice: 600 },
      { description: 'Online gallery delivery', quantity: 1, unitPrice: 250 },
    ],
    defaultContractClauses: [
      'Deposit reserves the shoot date and is applied to the final balance.',
      'Delivery timeline starts after the shoot date and final image selection.',
      'Usage rights cover personal sharing and print use unless otherwise agreed.',
      'Final payment is due before full gallery delivery.',
    ],
  },
  {
    id: 'portrait-session',
    name: 'Portrait Session',
    category: 'Portrait',
    description: 'Session fee, retouching add-ons, deposit, delivery window, and final balance.',
    defaultCurrency: 'USD',
    defaultLineItems: [
      { description: 'Portrait session fee', quantity: 1, unitPrice: 350 },
      { description: 'Retouched image set', quantity: 10, unitPrice: 35 },
      { description: 'Online gallery delivery', quantity: 1, unitPrice: 100 },
    ],
    defaultContractClauses: [
      'Deposit confirms the session date and time.',
      'Retouching scope is limited to the selected image count listed above.',
      'Delivery timeline starts after final image selections are received.',
      'Final payment is due before high-resolution files are delivered.',
    ],
  },
  {
    id: 'event-photography',
    name: 'Event Photography',
    category: 'Event',
    description: 'Hourly or package coverage, extended coverage add-ons, deposit, delivery, and final payment.',
    defaultCurrency: 'USD',
    defaultLineItems: [
      { description: 'Event photography coverage', quantity: 4, unitPrice: 220 },
      { description: 'Extended coverage add-on', quantity: 1, unitPrice: 220 },
      { description: 'Edited gallery delivery', quantity: 1, unitPrice: 180 },
    ],
    defaultContractClauses: [
      'Deposit holds the event date on the calendar.',
      'Additional coverage is billed at the agreed hourly rate.',
      'Delivery timeline starts after the event date.',
      'Final payment is due when the edited gallery is ready for delivery.',
    ],
  },
  {
    id: 'commercial-shoot',
    name: 'Commercial Shoot',
    category: 'Commercial',
    description: 'Campaign deliverables, staged payments, usage rights, revision limits, delivery, and final payment.',
    defaultCurrency: 'USD',
    defaultLineItems: [
      { description: 'Commercial shoot production fee', quantity: 1, unitPrice: 1800 },
      { description: 'Usage rights package', quantity: 1, unitPrice: 900 },
      { description: 'Post-production and delivery', quantity: 1, unitPrice: 700 },
    ],
    defaultContractClauses: [
      'Deposit starts pre-production and reserves the shoot schedule.',
      'Usage rights are limited to the scope and duration agreed in writing.',
      'Revision rounds are limited to the quantity listed in the quote notes.',
      'Final payment is due before release of final high-resolution assets.',
    ],
  },
  {
    id: 'product-photography',
    name: 'Product Photography',
    category: 'Product',
    description: 'SKU or batch-based product shots, deposit, revision limits, usage rights, delivery, and balance.',
    defaultCurrency: 'USD',
    defaultLineItems: [
      { description: 'Product photography batch', quantity: 20, unitPrice: 45 },
      { description: 'Basic retouching per selected image', quantity: 20, unitPrice: 18 },
      { description: 'Usage rights and delivery package', quantity: 1, unitPrice: 350 },
    ],
    defaultContractClauses: [
      'Deposit starts production for the listed product batch.',
      'Product count, angles, and retouching scope are limited to the line items above.',
      'Usage rights apply to the approved final images only.',
      'Final payment is due before final files are delivered.',
    ],
  },
];

export function getPhotographyQuotePresetById(id) {
  return PHOTOGRAPHY_QUOTE_PRESETS.find((preset) => preset.id === id) || null;
}
