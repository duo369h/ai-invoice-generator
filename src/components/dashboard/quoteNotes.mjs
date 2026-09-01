// Canonical parser for the legacy notes column format used by Quotes and Invoices.
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

export const deserializeQuoteNotes = (fullNotes) => {
  if (!fullNotes) return defaultMetadata();
  const marker = '---METADATA---';
  const markerMatches = [...fullNotes.matchAll(/(?:^|\n\n)---METADATA---\n/g)];
  if (markerMatches.length > 0) {
    const firstMarkerIndex = markerMatches[0].index + (markerMatches[0][0].startsWith('\n\n') ? 2 : 0);
    const lastMatch = markerMatches[markerMatches.length - 1];
    const lastMarkerIndex = lastMatch.index + (lastMatch[0].startsWith('\n\n') ? 2 : 0);
    const publicNotes = fullNotes.slice(0, firstMarkerIndex).trim();
    const rawMeta = fullNotes.slice(lastMarkerIndex + marker.length).trim();
    try {
      let meta;
      try {
        meta = JSON.parse(rawMeta);
      } catch {
        const decodedMeta = rawMeta
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'");
        meta = JSON.parse(decodedMeta);
      }
      if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return defaultMetadata();
      return parsedMetadata(publicNotes, meta);
    } catch {
      // Ignore legacy/malformed metadata.
    }
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
