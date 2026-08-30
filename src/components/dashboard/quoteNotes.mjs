// Canonical parser for the legacy notes column format used by Quotes and Invoices.
export const deserializeQuoteNotes = (fullNotes) => {
  if (!fullNotes) return { notes: '', billing_type: 'standard', edit_count: 0, comments: [], files: [] };
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
      return {
        notes: publicNotes,
        billing_type: meta.billing_type || 'standard',
        edit_count: meta.edit_count || 0,
        comments: meta.comments || [],
        files: meta.files || []
      };
    } catch {
      // Ignore legacy/malformed metadata.
    }
  }
  const parts = fullNotes.split('\n\n---METADATA---\n');
  if (parts.length > 1) {
    try {
      const meta = JSON.parse(parts[1]);
      return {
        notes: parts[0],
        billing_type: meta.billing_type || 'standard',
        edit_count: meta.edit_count || 0,
        comments: meta.comments || [],
        files: meta.files || []
      };
    } catch (e) {}
  }
  return { notes: fullNotes, billing_type: 'standard', edit_count: 0, comments: [], files: [] };
};
