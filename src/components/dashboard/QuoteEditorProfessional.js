import { useEffect, useMemo, useRef, useState } from 'react';
import QuoteClientDocument from './QuoteClientDocument';
import QuoteClientDocumentPreviewFrame from './QuoteClientDocumentPreviewFrame';
import { useQuoteEditorShared } from './QuoteEditorSharedContext';
import {
  buildQuoteDraftFingerprint,
  PHOTOGRAPHY_ITEM_SUGGESTIONS,
  remapActiveItemIndex,
  reorderQuoteItems,
  resolveDesktopQuoteAction,
} from './quoteEditorProfessionalModel';

const TEMPLATE_INDEXES = [
  ['commercial-shoot', 'Commercial'],
  ['wedding-shoot', 'Wedding'],
  ['portrait-session', 'Portrait'],
  ['event-photography', 'Event'],
  ['product-photography', 'Product'],
  ['food-photography', 'Food'],
  ['architecture-interior', 'Architecture'],
];

const USAGE_DEFAULTS = {
  purpose: '',
  mediaChannels: '',
  territory: '',
  duration: '',
  exclusivity: '',
};

export default function QuoteEditorProfessional() {
  const { quote, setters, workflow, derived, actions, scope, ui } = useQuoteEditorShared();
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [activePreparedFor, setActivePreparedFor] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const editorRef = useRef(null);
  const [frontPaper, setFrontPaper] = useState('commercial-shoot');
  const [previousFrontPaper, setPreviousFrontPaper] = useState(null);
  const [paperSwitchStarted, setPaperSwitchStarted] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [usageDraft, setUsageDraft] = useState(USAGE_DEFAULTS);
  const [provisionalItemIndex, setProvisionalItemIndex] = useState(null);
  const [suggestionMenuIndex, setSuggestionMenuIndex] = useState(null);
  const [suggestionMenuOpen, setSuggestionMenuOpen] = useState(false);
  const suggestionFocusSuppressedRef = useRef(null);
  const [savedFingerprint, setSavedFingerprint] = useState(() => buildQuoteDraftFingerprint(quote));
  const draftFingerprint = useMemo(() => buildQuoteDraftFingerprint(quote), [quote]);
  const isDirty = !quote.qId || savedFingerprint !== draftFingerprint;
  const authority = resolveDesktopQuoteAction({ hasSavedQuote: Boolean(quote.qId), isDirty, status: quote.qStatus });

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (Number.isInteger(activeItemIndex) && !event.target.closest?.(`[data-testid="professional-pricing-row-${activeItemIndex}"]`)) {
        setActiveItemIndex(null);
      }
      if (activePreparedFor && !event.target.closest?.('[data-testid="quote-prepared-for"]')) {
        setActivePreparedFor(false);
      }
      if (Number.isInteger(provisionalItemIndex) && !event.target.closest?.(`[data-testid="professional-pricing-row-${provisionalItemIndex}"]`)) {
        const provisionalItem = quote.qItems[provisionalItemIndex];
        if (!provisionalItem?.description?.trim()) {
          setters.setQuoteItems((current) => current.filter((_, itemIndex) => itemIndex !== provisionalItemIndex));
        }
        setProvisionalItemIndex(null);
        setSuggestionMenuIndex(null);
        setSuggestionMenuOpen(false);
        suggestionFocusSuppressedRef.current = null;
      }
    };
    if (!Number.isInteger(activeItemIndex) && !activePreparedFor && !Number.isInteger(provisionalItemIndex)) return undefined;
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [activeItemIndex, activePreparedFor, provisionalItemIndex, quote.qItems, setters]);

  const documentProps = {
    quoteNumber: quote.qNumber,
    date: quote.qDate,
    status: quote.qStatus,
    clientName: quote.qClientName,
    clientEmail: quote.qClientEmail,
    clientAddress: quote.qClientAddress,
    photographerName: quote.photographerName,
    photographerEmail: quote.photographerEmail,
    items: quote.qItems,
    discountRate: quote.qDiscountRate,
    taxRate: quote.qTaxRate,
    currency: quote.qCurrency,
    notes: quote.qNotes,
    formatMoney: derived.formatMoney,
    totals: derived.totals,
    scope: quote.qPhotographyScope,
    projectName: quote.qPhotographyScope?.common?.shoot_type,
  };

  const updateItem = (index, field, value) => {
    const nextValue = field === 'description' ? value : (value === '' ? '' : Number(value));
    if (field !== 'description' && value !== '' && !Number.isFinite(nextValue)) return;
    setters.setQuoteItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: nextValue } : item));
  };

  const addItem = (description = '') => {
    const nextIndex = quote.qItems.length;
    setters.setQuoteItems((current) => [...current, { description, quantity: 1, unitPrice: 0 }]);
    setActiveItemIndex(nextIndex);
  };

  const beginAddItem = () => {
    if (Number.isInteger(provisionalItemIndex)) return;
    const nextIndex = quote.qItems.length;
    setters.setQuoteItems((current) => [...current, { description: '', quantity: 1, unitPrice: 0 }]);
    setProvisionalItemIndex(nextIndex);
    setActiveItemIndex(nextIndex);
    setSuggestionMenuIndex(nextIndex);
    setSuggestionMenuOpen(true);
    suggestionFocusSuppressedRef.current = null;
  };

  const selectSuggestion = (index, description) => {
    suggestionFocusSuppressedRef.current = index;
    setters.setQuoteItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description } : item));
    setProvisionalItemIndex(null);
    setSuggestionMenuIndex(null);
    setSuggestionMenuOpen(false);
    setActiveItemIndex(index);
  };

  const selectCustomDescription = (index) => {
    suggestionFocusSuppressedRef.current = index;
    setSuggestionMenuIndex(null);
    setSuggestionMenuOpen(false);
    setActiveItemIndex(index);
  };

  const exitAddItem = (index = provisionalItemIndex) => {
    if (!Number.isInteger(index)) return;
    const provisionalItem = quote.qItems[index];
    if (!provisionalItem?.description?.trim()) {
      setters.setQuoteItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    }
    setProvisionalItemIndex(null);
    setSuggestionMenuIndex(null);
    setSuggestionMenuOpen(false);
    suggestionFocusSuppressedRef.current = null;
    setActiveItemIndex((current) => current === index ? null : current);
  };

  const availableItemSuggestions = useMemo(() => {
    const existingDescriptions = new Set((quote.qItems || []).map((item) => item.description?.trim().toLowerCase()).filter(Boolean));
    return PHOTOGRAPHY_ITEM_SUGGESTIONS.filter((suggestion) => !existingDescriptions.has(suggestion.toLowerCase()));
  }, [quote.qItems]);

  const focusDescription = (index) => {
    if (suggestionFocusSuppressedRef.current === index) {
      suggestionFocusSuppressedRef.current = null;
      return;
    }
    setSuggestionMenuIndex(index);
    setSuggestionMenuOpen(true);
  };

  const removeItem = (index) => {
    if (quote.qItems.length <= 1) return;
    setters.setQuoteItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setActiveItemIndex(null);
  };

  const reorderItem = (sourceIndex, targetIndex, insertBefore) => {
    setters.setQuoteItems((current) => reorderQuoteItems(current, sourceIndex, targetIndex, insertBefore));
    setActiveItemIndex((current) => remapActiveItemIndex(current, sourceIndex, targetIndex, insertBefore));
    setDraggedItemIndex(null);
  };

  const updateField = (field, value) => {
    const fieldSetters = {
      number: setters.setQuoteNumber,
      date: setters.setQuoteDate,
      clientName: setters.setQuoteClientName,
      clientEmail: setters.setQuoteClientEmail,
      clientAddress: setters.setQuoteClientAddress,
      notes: setters.setQuoteNotes,
      taxRate: setters.setQuoteTaxRate,
      currency: setters.setQuoteCurrency,
      project: (nextValue) => scope.updateField('shoot_type', nextValue),
    };
    fieldSetters[field]?.(value);
  };

  const openUsage = () => {
    const usage = quote.qPhotographyScope?.common?.usage_rights || {};
    setUsageDraft({
      purpose: usage.purpose || '',
      mediaChannels: Array.isArray(usage.media_channels) ? usage.media_channels.join(' / ') : '',
      territory: usage.territory || '',
      duration: usage.license_duration || '',
      exclusivity: usage.exclusivity || '',
    });
    setUsageOpen(true);
  };

  const applyUsage = () => {
    scope.setUsageRightsStatus('specified');
    scope.updateField('usage_rights.purpose', usageDraft.purpose);
    scope.updateField('usage_rights.media_channels', usageDraft.mediaChannels.split('/').map((entry) => entry.trim()).filter(Boolean));
    scope.updateField('usage_rights.territory', usageDraft.territory);
    scope.updateField('usage_rights.license_duration', usageDraft.duration);
    scope.updateField('usage_rights.exclusivity', usageDraft.exclusivity);
    setUsageOpen(false);
  };

  const handleSave = async () => {
    const savedSnapshot = draftFingerprint;
    const didSave = await actions.save();
    if (didSave) {
      setSavedFingerprint(savedSnapshot);
    }
  };

  const handlePrimaryAction = () => {
    if (authority.action === 'save') handleSave();
    if (authority.action === 'send') actions.send();
  };

  const intelligenceFinding = derived.reviewFindings?.[0] || null;
  const applyIntelligenceSuggestion = () => {
    const suggestion = /assistant/i.test(`${intelligenceFinding?.title || ''} ${intelligenceFinding?.message || ''}`)
      ? 'Photo Assistant'
      : 'Photography / Creative Fee';
    const existingIndex = quote.qItems.findIndex((item) => item.description?.toLowerCase() === suggestion.toLowerCase());
    if (existingIndex >= 0) setActiveItemIndex(existingIndex);
    else addItem(suggestion);
  };

  return (
    <section ref={editorRef} className={`professional-quote-editor${usageOpen ? ' has-floating-sheet' : ''}`} data-testid="professional-quote-editor" data-workspace-mode={previewOpen ? 'preview' : 'edit'}>
      <header className="professional-editor-header">
        <button type="button" className="professional-back" onClick={actions.cancel}>← <span>Back</span></button>
        <div className="professional-editor-title">
          <h1>{quote.qId ? `Edit Quote ${quote.qNumber}` : 'Create Quote'}</h1>
          <span className={isDirty ? 'is-unsaved' : 'is-saved'}><i />{authority.statusLabel}</span>
        </div>
        <div className="professional-editor-actions">
          <button type="button" className="professional-preview-action" onClick={() => setPreviewOpen((current) => !current)}>{previewOpen ? 'Edit' : 'Preview'}</button>
          {authority.action !== 'none' && <button type="button" className="professional-primary-action" onClick={handlePrimaryAction} disabled={ui.isSaving || ui.isSendingQuote}>{ui.isSaving ? 'Saving…' : ui.isSendingQuote ? 'Sending…' : authority.actionLabel}</button>}
        </div>
      </header>

      {(ui.formError || ui.formSuccess) && <div className={`professional-editor-feedback${ui.formError ? ' is-error' : ''}`} role="status">{ui.formError || ui.formSuccess}</div>}

      <nav className="professional-template-indexes" data-testid="quote-workspace-index" aria-label="Photography workflow templates">
        {TEMPLATE_INDEXES.map(([templateId, label]) => (
          <button
            type="button"
            key={templateId}
            className={workflow.selectedQuotePresetId === templateId ? 'is-selected' : ''}
            aria-pressed={workflow.selectedQuotePresetId === templateId}
            onClick={() => workflow.applyPreset(templateId)}
          >{label}</button>
        ))}
      </nav>

      <main className="professional-paper-workspace" data-testid="quote-business-editor">
        <div className="professional-paper-stage" data-testid="quote-client-document-canvas">
          <div className="professional-paper-stack" data-testid="professional-paper-stack" data-front-paper={frontPaper} data-paper-switch-started={paperSwitchStarted}>
            {[...TEMPLATE_INDEXES.slice(1), TEMPLATE_INDEXES[0]].map(([templateId, label]) => {
              const isFront = templateId === frontPaper;
              const frontPaperIndex = TEMPLATE_INDEXES.findIndex(([id]) => id === frontPaper);
              const papersBeforeFront = TEMPLATE_INDEXES.slice(0, frontPaperIndex).reverse();
              const rearPaperOrder = [
                ...papersBeforeFront,
                ...TEMPLATE_INDEXES.slice(frontPaperIndex + 1),
              ];
              const depth = isFront ? 0 : rearPaperOrder.findIndex(([id]) => id === templateId) + 1;
              return (
                <div
                  key={templateId}
                  className={`professional-paper-layer ${isFront ? 'is-front' : 'is-recessed'} is-switchable${paperSwitchStarted && templateId === previousFrontPaper ? ' is-previous-front' : ''}`}
                  data-paper-template={templateId}
                  data-paper-depth={depth}
                  style={{ '--paper-depth': depth, '--paper-index-slot': depth }}
                  onAnimationEnd={(event) => {
                    if (event.target === event.currentTarget && event.animationName === 'professional-paper-recede' && templateId === previousFrontPaper) {
                      setPreviousFrontPaper(null);
                    }
                  }}
                >
                  <button
                    type="button"
                    className={`professional-paper-attached-index${isFront ? ' is-selected' : ''}`}
                    data-testid={`paper-index-${templateId}`}
                    aria-label={`Bring ${label} paper to front`}
                    aria-pressed={isFront}
                    onClick={() => {
                      if (templateId === frontPaper) return;
                      setPreviousFrontPaper(frontPaper);
                      setPaperSwitchStarted(true);
                      setFrontPaper(templateId);
                    }}
                  >{label}</button>
                  <QuoteClientDocumentPreviewFrame>
                    <QuoteClientDocument
                      {...documentProps}
                      editable={!previewOpen}
                      preview={previewOpen}
                      activeItemIndex={activeItemIndex}
                      draggedItemIndex={draggedItemIndex}
                      onActivateItem={setActiveItemIndex}
                      onItemChange={updateItem}
                      onRemoveItem={removeItem}
                      onItemDragStart={setDraggedItemIndex}
                      onItemDragEnd={() => setDraggedItemIndex(null)}
                      onItemDrop={reorderItem}
                      onAddItem={beginAddItem}
                      provisionalItemIndex={provisionalItemIndex}
                      itemSuggestions={availableItemSuggestions}
                      suggestionMenuOpen={suggestionMenuOpen}
                      suggestionMenuIndex={suggestionMenuIndex}
                      onSuggestionSelect={selectSuggestion}
                      onCustomSelect={selectCustomDescription}
                      onDescriptionFocus={focusDescription}
                      onDescriptionBlur={() => setSuggestionMenuOpen(false)}
                      onExitAddItem={exitAddItem}
                      onFieldChange={updateField}
                      onOpenUsage={openUsage}
                      sourceFocus={usageOpen}
                      intelligenceFinding={intelligenceFinding}
                      onOpenIntelligence={applyIntelligenceSuggestion}
                      preparedForActive={activePreparedFor}
                      onActivatePreparedFor={() => setActivePreparedFor(true)}
                    />
                  </QuoteClientDocumentPreviewFrame>
                </div>
              );
            })}
          </div>
        </div>
        {usageOpen && <div className="professional-guidance-line non-printing" aria-hidden="true"><i /></div>}
      </main>

      {usageOpen && (
        <aside className="professional-floating-sheet non-printing" data-testid="professional-floating-sheet" aria-labelledby="professional-floating-sheet-heading">
          <div className="professional-floating-sheet-scroll">
            <header><span>Deep edit</span><h2 id="professional-floating-sheet-heading">Usage &amp; licensing</h2><p>Define where, how long, and under what terms the work may be used.</p></header>
            <label className="professional-open-field"><span>Purpose</span><input value={usageDraft.purpose} onChange={(event) => setUsageDraft((current) => ({ ...current, purpose: event.target.value }))} placeholder="Brand campaign" /></label>
            <label className="professional-open-field"><span>Channels</span><select value={usageDraft.mediaChannels} onChange={(event) => setUsageDraft((current) => ({ ...current, mediaChannels: event.target.value }))}><option value="">Not specified</option><option value="Digital / Social">Digital / Social</option><option value="Website / Print">Website / Print</option><option value="Digital / Social / Print">Digital / Social / Print</option>{usageDraft.mediaChannels && !['Digital / Social', 'Website / Print', 'Digital / Social / Print'].includes(usageDraft.mediaChannels) && <option value={usageDraft.mediaChannels}>{usageDraft.mediaChannels}</option>}</select><b aria-hidden="true">⌄</b></label>
            <label className="professional-open-field"><span>Territory</span><select value={usageDraft.territory} onChange={(event) => setUsageDraft((current) => ({ ...current, territory: event.target.value }))}><option value="">Not specified</option><option value="North America">North America</option><option value="Worldwide">Worldwide</option>{usageDraft.territory && !['North America', 'Worldwide'].includes(usageDraft.territory) && <option value={usageDraft.territory}>{usageDraft.territory}</option>}</select><b aria-hidden="true">⌄</b></label>
            <label className="professional-open-field is-active"><span>Duration</span><select value={usageDraft.duration} onChange={(event) => setUsageDraft((current) => ({ ...current, duration: event.target.value }))}><option value="">Not specified</option><option value="3 months">3 months</option><option value="6 months">6 months</option><option value="12 months">12 months</option><option value="Perpetual">Perpetual</option>{usageDraft.duration && !['3 months', '6 months', '12 months', 'Perpetual'].includes(usageDraft.duration) && <option value={usageDraft.duration}>{usageDraft.duration}</option>}</select><b aria-hidden="true">⌄</b><small>Confirm the campaign period.</small></label>
            <label className="professional-open-field"><span>Exclusivity</span><select value={usageDraft.exclusivity} onChange={(event) => setUsageDraft((current) => ({ ...current, exclusivity: event.target.value }))}><option value="">Not specified</option><option value="Non-exclusive">Non-exclusive</option><option value="Category exclusive">Category exclusive</option><option value="Fully exclusive">Fully exclusive</option>{usageDraft.exclusivity && !['Non-exclusive', 'Category exclusive', 'Fully exclusive'].includes(usageDraft.exclusivity) && <option value={usageDraft.exclusivity}>{usageDraft.exclusivity}</option>}</select><b aria-hidden="true">⌄</b></label>
          </div>
          <footer><button type="button" onClick={() => setUsageOpen(false)}>Cancel</button><button type="button" onClick={applyUsage}>Apply to Quote</button></footer>
        </aside>
      )}

      <div className="professional-print-actions non-printing">
        <button type="button" onClick={() => actions.exportPdf('printable-quote', `quote_${quote.qNumber}`, quote.qId)} disabled={ui.isDownloadingPdf}>{ui.isDownloadingPdf ? 'Generating PDF…' : 'Download PDF'}</button>
      </div>

      <div className="quote-printable-target" aria-hidden="true">
        <div id="printable-quote"><QuoteClientDocument {...documentProps} /></div>
      </div>
      <div className="professional-suggestion-bank" aria-hidden="true">{PHOTOGRAPHY_ITEM_SUGGESTIONS.join(' · ')}</div>
    </section>
  );
}
