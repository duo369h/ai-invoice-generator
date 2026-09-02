import { getPhotographyWorkflowTemplateById } from './photographyWorkflowTemplates.js';

export const PHOTOGRAPHY_KNOWLEDGE_VERSION = 'r55c-v1';

const KNOWLEDGE = Object.freeze({
  'wedding-shoot': {
    focus: ['coverage timeline', 'ceremony and reception expectations', 'second photographer where relevant', 'gallery or album delivery', 'overtime boundaries'],
  },
  'portrait-session': {
    focus: ['portrait subtype', 'looks, outfits or setups', 'final selection expectations', 'retouching', 'RAW expectations', 'branding usage when relevant'],
  },
  'event-photography': {
    focus: ['coverage hours', 'key moments', 'same-day selects', 'overtime boundaries', 'travel', 'delivery expectations'],
  },
  'commercial-shoot': {
    focus: ['usage purpose', 'media channels', 'territory', 'license duration', 'exclusivity', 'production responsibilities', 'talent, styling and compositing boundaries', 'deliverable clarity'],
  },
  'product-photography': {
    focus: ['products or SKUs', 'angles', 'backgrounds', 'packshot, lifestyle or detail coverage', 'color accuracy', 'product preparation', 'retouching'],
  },
  'food-photography': {
    focus: ['dishes', 'setups', 'food styling responsibility', 'ingredient and preparation responsibility', 'freshness and timing', 'menu or hero imagery', 'compositing'],
  },
  'architecture-interior': {
    focus: ['spaces', 'interior and exterior coverage', 'access', 'natural light or twilight', 'staging', 'people in the space', 'perspective correction', 'usage and delivery'],
  },
});

export function getPhotographyKnowledge(templateId) {
  const template = getPhotographyWorkflowTemplateById(templateId);
  if (!template || !KNOWLEDGE[template.id]) return null;
  return Object.freeze({
    version: PHOTOGRAPHY_KNOWLEDGE_VERSION,
    templateId: template.id,
    templateLabel: template.label,
    focus: KNOWLEDGE[template.id].focus,
  });
}

export const PHOTOGRAPHY_KNOWLEDGE = KNOWLEDGE;
