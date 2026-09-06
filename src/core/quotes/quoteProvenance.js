import { normalizePhotographyScope } from './photographyQuoteScope.js';

const isRecord = (value) => value && typeof value === 'object' && !Array.isArray(value);

export function isRecognizedRawClientSource(value) {
  return isRecord(value)
    && value.kind === 'lead_message'
    && typeof value.lead_id === 'string'
    && value.lead_id.trim().length > 0
    && value.source_field === 'message';
}

export function isSuggestionOnlyMachineDraft(value) {
  return isRecord(value)
    && value.source === 'quotes_generate'
    && value.authority === 'suggestion_only';
}

export function createLeadQuoteProvenance(leadId) {
  const normalizedLeadId = typeof leadId === 'string' ? leadId.trim() : '';
  if (!normalizedLeadId) return null;
  return {
    raw_client_source: {
      kind: 'lead_message',
      lead_id: normalizedLeadId,
      source_field: 'message',
    },
    machine_draft: {
      source: 'quotes_generate',
      authority: 'suggestion_only',
    },
  };
}

export function buildQuoteProvenanceForSave({
  existingProvenance = null,
  draftProvenance = null,
  existingScope = null,
  currentScope = null,
} = {}) {
  const existing = isRecord(existingProvenance) ? existingProvenance : {};
  const draft = isRecord(draftProvenance) ? draftProvenance : {};
  const baselineSource = existing.original_scope_baseline || existingScope || currentScope;
  const originalScopeBaseline = baselineSource ? normalizePhotographyScope(baselineSource) : null;
  const rawClientSource = isRecognizedRawClientSource(existing.raw_client_source)
    ? existing.raw_client_source
    : (isRecognizedRawClientSource(draft.raw_client_source) ? draft.raw_client_source : null);
  const machineDraft = isSuggestionOnlyMachineDraft(existing.machine_draft)
    ? existing.machine_draft
    : (isSuggestionOnlyMachineDraft(draft.machine_draft) ? draft.machine_draft : null);

  return {
    ...(rawClientSource ? { raw_client_source: rawClientSource } : {}),
    ...(machineDraft ? { machine_draft: machineDraft } : {}),
    ...(originalScopeBaseline ? { original_scope_baseline: originalScopeBaseline } : {}),
    canonical_authority: {
      authority: 'photographer',
      confirmation_action: 'explicit_quote_save',
    },
  };
}
