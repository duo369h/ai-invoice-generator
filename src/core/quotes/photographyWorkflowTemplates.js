export const PHOTOGRAPHY_TEMPLATE_FIELD_IMPORTANCE = Object.freeze({
  CORE: 'CORE',
  RECOMMENDED: 'RECOMMENDED',
  OPTIONAL: 'OPTIONAL',
});

const { CORE, RECOMMENDED, OPTIONAL } = PHOTOGRAPHY_TEMPLATE_FIELD_IMPORTANCE;

const template = (definition) => Object.freeze({
  ...definition,
  fieldImportance: Object.freeze({
    CORE: Object.freeze(definition.fieldImportance.CORE),
    RECOMMENDED: Object.freeze(definition.fieldImportance.RECOMMENDED),
    OPTIONAL: Object.freeze(definition.fieldImportance.OPTIONAL),
  }),
  scopeEmphasis: Object.freeze(definition.scopeEmphasis),
  fieldPromptOverrides: Object.freeze(definition.fieldPromptOverrides || {}),
  fieldExamples: Object.freeze(definition.fieldExamples || {}),
  optionalSubtypeSuggestions: Object.freeze(definition.optionalSubtypeSuggestions || []),
  deterministicReviewRules: Object.freeze(definition.deterministicReviewRules || []),
});

const commonRecommended = [
  'shoot_date',
  'shoot_duration',
  'primary_location',
  'coverage_expectation',
  'deliverables',
  'final_image_count',
  'delivery_deadline',
  'exclusions',
];

const commonOptional = [
  'retouched_image_count',
  'delivery_format',
  'assumptions',
  'usage_rights.purpose',
  'usage_rights.media_channels',
  'usage_rights.territory',
  'usage_rights.license_duration',
  'usage_rights.exclusivity',
];

export const PHOTOGRAPHY_WORKFLOW_TEMPLATES = Object.freeze([
  template({
    id: 'wedding-shoot',
    label: 'Wedding',
    shortDescription: 'Weddings, ceremonies & receptions',
    iconIdentifier: 'rings',
    scopeEmphasis: ['shoot_date', 'shoot_duration', 'primary_location', 'coverage_expectation', 'deliverables', 'delivery_deadline'],
    fieldImportance: {
      CORE: ['shoot_type', 'shoot_date', 'primary_location', 'coverage_expectation', 'deliverables', 'delivery_deadline'],
      RECOMMENDED: [...commonRecommended, 'final_image_count', 'retouched_image_count', 'assumptions'],
      OPTIONAL: commonOptional,
    },
    fieldPromptOverrides: {
      coverage_expectation: 'Coverage expectations',
      deliverables: 'Gallery, album or other deliverables',
    },
    fieldExamples: {
      coverage_expectation: 'Getting ready, ceremony, portraits and reception',
      deliverables: 'Edited gallery\nAlbum design',
      assumptions: 'Couple provides the final timeline',
      exclusions: 'Second photographer\nTravel beyond the agreed area',
    },
    deterministicReviewRules: ['delivery_deadline_before_shoot_date', 'missing_deliverables', 'missing_duration'],
  }),
  template({
    id: 'portrait-session',
    label: 'Portrait',
    shortDescription: 'Portraits, headshots & personal branding',
    iconIdentifier: 'portrait',
    scopeEmphasis: ['shoot_type', 'shoot_date', 'shoot_duration', 'primary_location', 'coverage_expectation', 'final_image_count'],
    fieldImportance: {
      CORE: ['shoot_type', 'shoot_date', 'shoot_duration', 'primary_location', 'coverage_expectation', 'final_image_count', 'deliverables'],
      RECOMMENDED: ['retouched_image_count', 'delivery_format', 'delivery_deadline', 'assumptions', 'exclusions'],
      OPTIONAL: commonOptional,
    },
    fieldPromptOverrides: {
      shoot_type: 'Portrait subtype (optional)',
      coverage_expectation: 'Looks, outfits or setups',
      final_image_count: 'Expected final images',
    },
    fieldExamples: {
      shoot_type: 'Headshot',
      coverage_expectation: 'Two looks in studio; client selects final images',
      exclusions: 'RAW files\nAdditional retouching beyond the selected set',
    },
    optionalSubtypeSuggestions: ['Personal portrait', 'Headshot', 'Personal branding', 'Family', 'Couple / Engagement', 'Maternity', 'Other'],
    deterministicReviewRules: ['delivery_deadline_before_shoot_date', 'portrait_image_expectation_unclear', 'missing_deliverables'],
  }),
  template({
    id: 'event-photography',
    label: 'Event',
    shortDescription: 'Corporate events, conferences & live coverage',
    iconIdentifier: 'spark',
    scopeEmphasis: ['shoot_date', 'shoot_duration', 'primary_location', 'coverage_expectation', 'deliverables', 'delivery_deadline'],
    fieldImportance: {
      CORE: ['shoot_type', 'shoot_date', 'shoot_duration', 'primary_location', 'coverage_expectation', 'deliverables', 'delivery_deadline'],
      RECOMMENDED: ['final_image_count', 'retouched_image_count', 'assumptions', 'exclusions'],
      OPTIONAL: commonOptional,
    },
    fieldPromptOverrides: {
      coverage_expectation: 'Key moments and coverage',
      deliverables: 'Event deliverables',
    },
    fieldExamples: {
      coverage_expectation: 'Keynote, stage, candid coverage and group photos',
      deliverables: 'Edited event gallery\nSame-day selects',
      assumptions: 'Access begins 30 minutes before the event',
      exclusions: 'Overtime\nTravel outside the agreed area',
    },
    deterministicReviewRules: ['delivery_deadline_before_shoot_date', 'missing_deliverables', 'missing_duration'],
  }),
  template({
    id: 'commercial-shoot',
    label: 'Commercial / Advertising',
    shortDescription: 'Campaigns, brands & advertising shoots',
    iconIdentifier: 'campaign',
    scopeEmphasis: ['shoot_type', 'shoot_date', 'shoot_duration', 'primary_location', 'coverage_expectation', 'deliverables', 'usage_rights'],
    fieldImportance: {
      CORE: ['shoot_type', 'shoot_date', 'shoot_duration', 'primary_location', 'coverage_expectation', 'deliverables', 'final_image_count', 'delivery_deadline', 'usage_rights.purpose'],
      RECOMMENDED: ['retouched_image_count', 'delivery_format', 'usage_rights.media_channels', 'usage_rights.territory', 'usage_rights.license_duration', 'assumptions', 'exclusions'],
      OPTIONAL: ['usage_rights.exclusivity'],
    },
    fieldPromptOverrides: {
      coverage_expectation: 'Production and coverage expectations',
      usage_rights: 'Usage rights for this campaign',
    },
    fieldExamples: {
      coverage_expectation: 'Talent, styling, studio and compositing responsibilities',
      deliverables: '12 campaign selects\n6 retouched hero images',
      usage_rights: 'Website, paid social and print; North America; 12 months',
      exclusions: 'Talent fees\nLocation fees\nExclusivity beyond the agreed license',
    },
    deterministicReviewRules: ['delivery_deadline_before_shoot_date', 'missing_deliverables', 'commercial_usage_unspecified'],
  }),
  template({
    id: 'product-photography',
    label: 'Product',
    shortDescription: 'Products, packshots & ecommerce imagery',
    iconIdentifier: 'product',
    scopeEmphasis: ['coverage_expectation', 'deliverables', 'final_image_count', 'retouched_image_count', 'delivery_format', 'delivery_deadline'],
    fieldImportance: {
      CORE: ['coverage_expectation', 'deliverables', 'final_image_count', 'retouched_image_count', 'delivery_deadline'],
      RECOMMENDED: ['delivery_format', 'usage_rights.purpose', 'assumptions', 'exclusions'],
      OPTIONAL: commonOptional,
    },
    fieldPromptOverrides: {
      coverage_expectation: 'Angles, backgrounds and image treatment',
      deliverables: 'Packshots, lifestyle or detail deliverables',
    },
    fieldExamples: {
      coverage_expectation: 'Front, side and detail angles on white background',
      deliverables: 'Packshot per product\nLifestyle hero images',
      assumptions: 'Products arrive prepared and ready to photograph',
      exclusions: 'Product styling\nAdditional SKUs outside the agreed list',
    },
    deterministicReviewRules: ['missing_deliverables', 'product_coverage_unclear'],
  }),
  template({
    id: 'food-photography',
    label: 'Food',
    shortDescription: 'Food, menus & hospitality imagery',
    iconIdentifier: 'plate',
    scopeEmphasis: ['coverage_expectation', 'deliverables', 'final_image_count', 'retouched_image_count', 'delivery_deadline'],
    fieldImportance: {
      CORE: ['coverage_expectation', 'deliverables', 'final_image_count', 'retouched_image_count', 'delivery_deadline'],
      RECOMMENDED: ['primary_location', 'delivery_format', 'usage_rights.purpose', 'assumptions', 'exclusions'],
      OPTIONAL: commonOptional,
    },
    fieldPromptOverrides: {
      coverage_expectation: 'Dishes, setups and styling expectations',
      deliverables: 'Hero, menu or hospitality deliverables',
    },
    fieldExamples: {
      coverage_expectation: 'Hero dishes, tabletop scenes and menu details',
      deliverables: '8 hero images\nMenu image set',
      assumptions: 'Ingredients and props are prepared before the shoot window',
      exclusions: 'Food stylist\nProp styling\nCompositing beyond the agreed images',
    },
    deterministicReviewRules: ['missing_deliverables', 'food_coverage_unclear'],
  }),
  template({
    id: 'architecture-interior',
    label: 'Architecture & Interior',
    shortDescription: 'Buildings, interiors & spaces',
    iconIdentifier: 'building',
    scopeEmphasis: ['shoot_date', 'shoot_duration', 'primary_location', 'coverage_expectation', 'deliverables', 'delivery_deadline', 'usage_rights'],
    fieldImportance: {
      CORE: ['shoot_date', 'shoot_duration', 'primary_location', 'coverage_expectation', 'deliverables', 'final_image_count', 'delivery_deadline'],
      RECOMMENDED: ['retouched_image_count', 'delivery_format', 'usage_rights.purpose', 'assumptions', 'exclusions'],
      OPTIONAL: commonOptional,
    },
    fieldPromptOverrides: {
      coverage_expectation: 'Spaces, access and light conditions',
      deliverables: 'Hero spaces and detail deliverables',
    },
    fieldExamples: {
      coverage_expectation: 'Interior hero spaces, details and twilight exterior',
      deliverables: '10 corrected interior images\n2 exterior images',
      assumptions: 'Space is staged and accessible during the agreed hours',
      exclusions: 'Staging\nAccess outside operating hours\nAdditional spaces',
    },
    deterministicReviewRules: ['delivery_deadline_before_shoot_date', 'missing_deliverables', 'architecture_coverage_unclear'],
  }),
]);

export const LEGACY_PHOTOGRAPHY_PRESET_COMPATIBILITY = Object.freeze({
  'wedding-shoot': 'wedding-shoot',
  'portrait-session': 'portrait-session',
  'event-photography': 'event-photography',
  'commercial-shoot': 'commercial-shoot',
  'commercial-advertising': 'commercial-shoot',
  'product-photography': 'product-photography',
  'food-shoot': 'food-photography',
  'architecture-shoot': 'architecture-interior',
});

export function getPhotographyWorkflowTemplateById(id) {
  const resolvedId = LEGACY_PHOTOGRAPHY_PRESET_COMPATIBILITY[id] || id;
  return PHOTOGRAPHY_WORKFLOW_TEMPLATES.find((candidate) => candidate.id === resolvedId) || null;
}

export function getPhotographyWorkflowFieldImportance(templateId, field) {
  const selectedTemplate = getPhotographyWorkflowTemplateById(templateId);
  if (!selectedTemplate) return OPTIONAL;
  if (selectedTemplate.fieldImportance.CORE.includes(field)) return CORE;
  if (selectedTemplate.fieldImportance.RECOMMENDED.includes(field)) return RECOMMENDED;
  return OPTIONAL;
}
