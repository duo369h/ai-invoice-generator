import { normalizeUrlList, safeUrl, sanitizePlainText } from './security';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ID_RE = /^[a-zA-Z0-9_\-]{1,80}$/;
const CURRENCY_RE = /^[A-Z]{3}$/i;
const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{2,39}$/;

export class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function validateObject(value, name = 'body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ValidationError(`${name} must be an object`);
  }
  return value;
}

export function text(value, field, { required = false, max = 500 } = {}) {
  const cleaned = sanitizePlainText(value, max);
  if (required && !cleaned) throw new ValidationError(`${field} is required`);
  return cleaned;
}

export function email(value, field, { required = false, max = 254 } = {}) {
  const cleaned = text(value, field, { required, max }).toLowerCase();
  if (cleaned && !EMAIL_RE.test(cleaned)) throw new ValidationError(`${field} must be a valid email`);
  return cleaned;
}

export function id(value, field, { required = false } = {}) {
  const cleaned = text(value, field, { required, max: 80 });
  if (cleaned && !ID_RE.test(cleaned)) throw new ValidationError(`${field} is invalid`);
  return cleaned;
}

export function username(value, field = 'username') {
  const cleaned = text(value, field, { required: true, max: 40 }).toLowerCase();
  if (!USERNAME_RE.test(cleaned)) throw new ValidationError(`${field} must be 3-40 lowercase letters, numbers, dashes, or underscores`);
  return cleaned;
}

export function numberValue(value, field, { min = 0, max = 999999999, defaultValue = 0 } = {}) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const num = Number(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    throw new ValidationError(`${field} must be between ${min} and ${max}`);
  }
  return num;
}

export function enumValue(value, field, allowed, defaultValue) {
  const cleaned = text(value ?? defaultValue, field, { required: defaultValue === undefined, max: 80 });
  if (!allowed.includes(cleaned)) {
    throw new ValidationError(`${field} must be one of: ${allowed.join(', ')}`);
  }
  return cleaned;
}

export function currency(value = 'USD') {
  const cleaned = String(value || 'USD').trim().toUpperCase();
  if (!CURRENCY_RE.test(cleaned)) throw new ValidationError('currency must be a 3-letter ISO code');
  return cleaned;
}

export function lineItems(items, { required = true } = {}) {
  if (!Array.isArray(items)) {
    if (required) throw new ValidationError('items must be an array');
    return [];
  }
  if (required && items.length === 0) throw new ValidationError('items must include at least one item');
  if (items.length > 50) throw new ValidationError('items cannot exceed 50 rows');

  return items.map((item, index) => {
    validateObject(item, `items[${index}]`);
    return {
      description: text(item.description, `items[${index}].description`, { required: true, max: 300 }),
      quantity: numberValue(item.quantity ?? 1, `items[${index}].quantity`, { min: 0.01, max: 100000, defaultValue: 1 }),
      unitPrice: numberValue(item.unitPrice ?? item.unit_price ?? 0, `items[${index}].unitPrice`, { min: 0, max: 100000000, defaultValue: 0 }),
    };
  });
}

export function validateInvoicePayload(body) {
  const obj = validateObject(body);
  const items = lineItems(obj.items);
  const paymentLink = safeUrl(obj.payment_link || obj.stripe_payment_link || '', { payment: true });
  return {
    client_name: text(obj.client_name, 'client_name', { required: true, max: 180 }),
    client_email: email(obj.client_email, 'client_email'),
    client_address: text(obj.client_address, 'client_address', { max: 600 }),
    business_name: text(obj.business_name, 'business_name', { max: 180 }),
    business_email: email(obj.business_email, 'business_email'),
    business_address: text(obj.business_address, 'business_address', { max: 600 }),
    logo_url: safeUrl(obj.logo_url || ''),
    currency: currency(obj.currency || 'USD'),
    items,
    discount_rate: numberValue(obj.discount_rate, 'discount_rate', { min: 0, max: 100 }),
    tax_rate: numberValue(obj.tax_rate, 'tax_rate', { min: 0, max: 100 }),
    invoice_number: text(obj.invoice_number, 'invoice_number', { max: 80 }),
    payment_terms: text(obj.payment_terms || 'Net 30', 'payment_terms', { max: 80 }),
    notes: text(obj.notes, 'notes', { max: 4000 }),
    invoice_date: text(obj.invoice_date, 'invoice_date', { max: 20 }),
    due_date: text(obj.due_date, 'due_date', { max: 20 }),
    doc_type: enumValue(obj.doc_type || 'invoice', 'doc_type', ['invoice', 'receipt', 'quote'], 'invoice'),
    client_id: text(obj.client_id, 'client_id', { max: 80 }),
    quote_id: obj.quote_id ? id(obj.quote_id, 'quote_id') : null,
    stripe_payment_link: paymentLink,
    payment_link: paymentLink,
  };
}

export function validateQuotePayload(body) {
  const obj = validateObject(body);
  return {
    id: obj.id ? id(obj.id, 'id') : '',
    quote_number: text(obj.quote_number, 'quote_number', { max: 80 }),
    client_name: text(obj.client_name, 'client_name', { required: true, max: 180 }),
    client_email: email(obj.client_email, 'client_email'),
    client_address: text(obj.client_address, 'client_address', { max: 600 }),
    items: lineItems(obj.items),
    discount_rate: numberValue(obj.discount_rate, 'discount_rate', { min: 0, max: 100 }),
    tax_rate: numberValue(obj.tax_rate, 'tax_rate', { min: 0, max: 100 }),
    currency: currency(obj.currency || 'USD'),
    notes: text(obj.notes, 'notes', { max: 4000 }),
    status: enumValue(obj.status || 'draft', 'status', ['draft', 'sent', 'approved', 'declined', 'converted'], 'draft'),
  };
}

export function validateLeadPayload(body) {
  const obj = validateObject(body);
  return {
    username: username(obj.username),
    name: text(obj.name, 'name', { required: true, max: 120 }),
    email: email(obj.email, 'email', { required: true }),
    message: text(obj.message, 'message', { max: 4000 }),
    source_utm: validateObject(obj.source_utm || {}, 'source_utm'),
  };
}

export function validateClientPayload(body) {
  const obj = validateObject(body);
  return {
    id: obj.id ? id(obj.id, 'id') : '',
    name: text(obj.name, 'name', { required: true, max: 180 }),
    email: email(obj.email, 'email'),
    address: text(obj.address, 'address', { max: 600 }),
  };
}

export function validateCardProfilePayload(body) {
  const obj = validateObject(body);
  const social = validateObject(obj.social_links || {}, 'social_links');
  return {
    username: username(obj.username),
    name: text(obj.name, 'name', { max: 120 }),
    title: text(obj.title, 'title', { max: 180 }),
    bio: text(obj.bio, 'bio', { max: 2000 }),
    tags: Array.isArray(obj.tags) ? obj.tags.map((tag) => text(tag, 'tag', { max: 60 })).slice(0, 30) : [],
    services: normalizeUrlList(Array.isArray(obj.services) ? obj.services : []),
    portfolio: normalizeUrlList(Array.isArray(obj.portfolio) ? obj.portfolio : []),
    contact_email: email(obj.contact_email, 'contact_email'),
    contact_phone: text(obj.contact_phone, 'contact_phone', { max: 50 }),
    avatar_url: safeUrl(obj.avatar_url || ''),
    cover_banner: text(obj.cover_banner, 'cover_banner', { max: 300 }),
    location: text(obj.location, 'location', { max: 120 }),
    timezone: text(obj.timezone, 'timezone', { max: 80 }),
    languages: text(obj.languages, 'languages', { max: 160 }),
    availability_status: text(obj.availability_status, 'availability_status', { max: 80 }),
    response_time: text(obj.response_time, 'response_time', { max: 80 }),
    starting_price: text(obj.starting_price, 'starting_price', { max: 80 }),
    calendly_link: safeUrl(obj.calendly_link || ''),
    verified_badge: Boolean(obj.verified_badge),
    top_rated_badge: Boolean(obj.top_rated_badge),
    fast_response_badge: Boolean(obj.fast_response_badge),
    testimonials: Array.isArray(obj.testimonials) ? obj.testimonials.slice(0, 20).map((item) => {
      const entry = validateObject(item, 'testimonial');
      return {
        client_name: text(entry.client_name, 'testimonial.client_name', { max: 120 }),
        client_project: text(entry.client_project, 'testimonial.client_project', { max: 180 }),
        feedback: text(entry.feedback, 'testimonial.feedback', { max: 600 }),
      };
    }) : [],
    social_links: {
      github: safeUrl(social.github || ''),
      twitter: safeUrl(social.twitter || ''),
      linkedin: safeUrl(social.linkedin || ''),
      website: safeUrl(social.website || ''),
    },
  };
}

export function validatePortalCommentPayload(body) {
  const obj = validateObject(body);
  const website = String(obj.website || '').trim();
  if (website) throw new ValidationError('Comment rejected', 400);
  return {
    author: text(obj.author, 'author', { required: true, max: 80 }),
    text: text(obj.text, 'text', { required: true, max: 2000 }),
  };
}

export function validateParsePayload(body, fieldName = 'raw_text') {
  const obj = validateObject(body);
  return {
    [fieldName]: text(obj[fieldName], fieldName, { required: true, max: 8000 }),
    type: enumValue(obj.type || 'invoice', 'type', ['invoice', 'receipt', 'quote'], 'invoice'),
  };
}

export function validatePlanPayload(body) {
  const obj = validateObject(body);
  return {
    plan: enumValue(obj.plan, 'plan', ['free', 'pro', 'agency'], 'free'),
  };
}

export function validationResponse(error) {
  if (error instanceof ValidationError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return null;
}
