import { sanitizePlainText } from '../../app/lib/security.js';

// Canonical parser for the legacy notes column format used by Quotes and Invoices.
export const PUBLIC_QUOTE_NOTES_MAX_LENGTH = 4000;
export const MAX_SERIALIZED_QUOTE_NOTES_LENGTH = 16000;
const defaultMetadata = () => ({
  notes: '',
  metadata: {},
  billing_type: 'standard',
  edit_count: 0,
  comments: [],
  files: [],
});

const parsedMetadata = (notes, metadata) => ({
  ...metadata,
  notes,
  metadata,
  billing_type: metadata.billing_type || 'standard',
  edit_count: metadata.edit_count || 0,
  comments: metadata.comments || [],
  files: metadata.files || [],
});

const decodeMetadata = (rawMeta) => {
  try {
    return JSON.parse(rawMeta);
  } catch {
    const decodedMeta = rawMeta
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'");
    return JSON.parse(decodedMeta);
  }
};

const readMetadataEnvelope = (fullNotes) => {
  const marker = '---METADATA---';
  const markerMatches = [...fullNotes.matchAll(/(?:^|\n\n)---METADATA---\n/g)];
  if (markerMatches.length === 0) return null;
  const firstMarkerIndex = markerMatches[0].index + (markerMatches[0][0].startsWith('\n\n') ? 2 : 0);
  const lastMatch = markerMatches[markerMatches.length - 1];
  const lastMarkerIndex = lastMatch.index + (lastMatch[0].startsWith('\n\n') ? 2 : 0);
  const publicNotes = fullNotes.slice(0, firstMarkerIndex).trim();
  const rawMeta = fullNotes.slice(lastMarkerIndex + marker.length).trim();
  const metadata = decodeMetadata(rawMeta);
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('Quote notes metadata must be a JSON object');
  }
  return { publicNotes, metadata };
};

export const deserializeQuoteNotes = (fullNotes) => {
  if (!fullNotes) return defaultMetadata();
  try {
    const envelope = readMetadataEnvelope(fullNotes);
    if (envelope) return parsedMetadata(envelope.publicNotes, envelope.metadata);
  } catch {
    // Ignore legacy/malformed metadata.
  }
  const parts = fullNotes.split('\n\n---METADATA---\n');
  if (parts.length > 1) {
    try {
      const meta = JSON.parse(parts[1]);
      if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return defaultMetadata();
      return parsedMetadata(parts[0], meta);
    } catch (e) {}
  }
  return { ...defaultMetadata(), notes: fullNotes };
};

export const serializeQuoteNotes = (baseNotes, metadata = {}) => {
  const safeMetadata = metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {};
  return `${baseNotes || ''}\n\n---METADATA---\n${JSON.stringify(safeMetadata)}`;
};

export const validateSerializedQuoteNotes = (value) => {
  const fullNotes = String(value || '');
  let envelope;
  try {
    envelope = readMetadataEnvelope(fullNotes);
  } catch (error) {
    throw new Error(`Quote notes metadata is invalid: ${error.message}`);
  }
  if (!envelope) return sanitizePlainText(fullNotes, PUBLIC_QUOTE_NOTES_MAX_LENGTH);
  const publicNotes = sanitizePlainText(envelope.publicNotes, PUBLIC_QUOTE_NOTES_MAX_LENGTH);
  const serialized = serializeQuoteNotes(publicNotes, envelope.metadata);
  if (serialized.length > MAX_SERIALIZED_QUOTE_NOTES_LENGTH) {
    throw new Error('Quote notes metadata exceeds the supported safety limit');
  }
  return serialized;
};
