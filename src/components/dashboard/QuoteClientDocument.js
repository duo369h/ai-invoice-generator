import { derivePricingSections, paginateQuoteItems, PHOTOGRAPHY_ITEM_SUGGESTIONS } from './quoteEditorProfessionalModel';
import { calculateLineItemAmount, formatLineItemQuantityBasis, formatLineItemRateBasis, LINE_ITEM_BILLING_UNITS } from '../../core/quotes/lineItemBilling.js';

const normalizeDate = (value) => {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
};

const usageSummary = (scope) => {
  const usage = scope?.common?.usage_rights || {};
  const parts = [
    Array.isArray(usage.media_channels) ? usage.media_channels.filter(Boolean).join(' / ') : '',
    usage.territory,
    usage.license_duration,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Usage terms not specified';
};

function DocumentField({ editable, value, ariaLabel, className = '', onChange, type = 'text', testId }) {
  if (!editable) return <span className={className}>{value}</span>;
  return (
    <input
      className={`professional-document-field ${className}`.trim()}
      data-testid={testId}
      aria-label={ariaLabel}
      type={type}
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  );
}

function PricingRows({ items, editable, activeItemIndex, onActivateItem, onItemChange, onRemoveItem, onItemDragStart, onItemDragEnd, onItemDrop, draggedItemIndex, formatMoney, currency, itemSuggestions, suggestionMenuOpen, suggestionMenuIndex, onSuggestionSelect, onCustomSelect, onDescriptionFocus, onDescriptionBlur, onExitAddItem }) {
  const sections = derivePricingSections(items);
  return sections.map((section) => (
    <tbody key={section.label || 'simple'}>
      {section.label && (
        <tr className="quote-client-document-group-row">
          <th colSpan={4} scope="rowgroup"><span>{section.label}</span></th>
        </tr>
      )}
      {section.items.map((item) => {
        const index = item.originalIndex;
        const active = editable && activeItemIndex === index;
        const dragging = editable && draggedItemIndex === index;
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);
        return (
          <tr
            key={`${index}-${item.description}`}
            className={`quote-client-document-item-row${active ? ' is-editing' : ''}`}
            data-testid={`professional-pricing-row-${index}`}
            data-item-index={index}
            data-item-dragging={dragging ? 'true' : 'false'}
            onClick={(event) => {
              const selectedText = typeof window === 'undefined' ? '' : window.getSelection()?.toString().trim();
              const interactiveTarget = event.target.closest?.('input, button, select, textarea');
              if (!editable || selectedText || interactiveTarget) return;
              onActivateItem?.(active ? null : index);
            }}
            onDragOver={(event) => {
              if (!editable || draggedItemIndex === null || draggedItemIndex === index) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(event) => {
              if (!editable) return;
              event.preventDefault();
              const sourceIndex = draggedItemIndex ?? Number(event.dataTransfer.getData('text/plain'));
              if (!Number.isInteger(sourceIndex) || sourceIndex === index) return;
              const bounds = event.currentTarget.getBoundingClientRect();
              onItemDrop?.(sourceIndex, index, event.clientY < bounds.top + (bounds.height / 2));
            }}
          >
            <td className="quote-client-document-description-cell">
              {editable ? <span className="professional-row-paper-strip non-printing" aria-hidden="true" /> : null}
              {editable && (
                <button
                  type="button"
                  className="professional-row-drag-handle non-printing"
                  draggable="true"
                  aria-label={`Reorder ${item.description || 'line item'}`}
                  data-testid={`professional-pricing-drag-handle-${index}`}
                  onClick={(event) => event.stopPropagation()}
                  onDragStart={(event) => {
                    event.stopPropagation();
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', String(index));
                    onItemDragStart?.(index);
                  }}
                  onDragEnd={() => onItemDragEnd?.()}
                >⋮⋮</button>
              )}
              {active ? (
                <input
                  data-testid={`quote-line-description-${index}`}
                  className="professional-row-field"
                  aria-label={`Description for item ${index + 1}`}
                  autoFocus={activeItemIndex === index}
                  value={item.description || ''}
                  onFocus={() => onDescriptionFocus?.(index)}
                  onBlur={onDescriptionBlur}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') onExitAddItem?.(index);
                  }}
                  onChange={(event) => onItemChange?.(index, 'description', event.target.value)}
                />
              ) : (item.description || 'Untitled item')}
              {active && suggestionMenuOpen && suggestionMenuIndex === index && (
                <div className="professional-add-item-suggestion-menu non-printing" data-testid="professional-add-item-suggestion-menu" aria-label="Line item suggestions">
                  {itemSuggestions.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      data-testid={`professional-add-suggestion-${suggestion}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => onSuggestionSelect?.(index, suggestion)}
                    >{suggestion}</button>
                  ))}
                  <button
                    type="button"
                    className="professional-add-item-suggestion-custom"
                    data-testid="professional-add-suggestion-custom"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onCustomSelect?.(index)}
                  >Custom…</button>
                </div>
              )}
              {active && (
                <button type="button" className="professional-row-remove non-printing" aria-label={`Remove ${item.description || 'line item'}`} onClick={(event) => { event.stopPropagation(); onRemoveItem?.(index); }}>Remove</button>
              )}
            </td>
            <td className="quote-client-document-number-cell">
              {active ? <><input data-testid={`professional-pricing-quantity-${index}`} className="professional-row-field professional-row-field-number" aria-label={`Quantity for item ${index + 1}`} type="number" step="any" inputMode="decimal" value={item.quantity ?? ''} onChange={(event) => onItemChange?.(index, 'quantity', event.target.value)} /><select className="professional-row-billing-unit non-printing" data-testid={`professional-pricing-unit-${index}`} aria-label={`Billing unit for item ${index + 1}`} value={item.billingUnit || ''} onChange={(event) => onItemChange?.(index, 'billingUnit', event.target.value || undefined)}><option value="">No unit</option>{LINE_ITEM_BILLING_UNITS.map((unit) => <option value={unit} key={unit}>{unit}</option>)}</select>{item.billingUnit && <button type="button" className="professional-row-billing-toggle non-printing" onClick={() => onItemChange?.(index, 'secondaryQuantity', item.secondaryQuantity ? undefined : 1)}>{item.secondaryQuantity ? 'Remove second factor' : 'Add second factor'}</button>}{item.secondaryQuantity ? <><input className="professional-row-field professional-row-field-number" aria-label={`Secondary quantity for item ${index + 1}`} type="number" value={item.secondaryQuantity} onChange={(event) => onItemChange?.(index, 'secondaryQuantity', event.target.value)} /><select className="professional-row-billing-unit non-printing" aria-label={`Secondary unit for item ${index + 1}`} value={item.secondaryUnit || 'day'} onChange={(event) => onItemChange?.(index, 'secondaryUnit', event.target.value)}>{LINE_ITEM_BILLING_UNITS.map((unit) => <option value={unit} key={unit}>{unit}</option>)}</select></> : null}</> : formatLineItemQuantityBasis(item)}
            </td>
            <td className="quote-client-document-number-cell">
              {active ? <input data-testid={`professional-pricing-rate-${index}`} className="professional-row-field professional-row-field-number" aria-label={`Rate for item ${index + 1}`} type="number" step="any" inputMode="decimal" value={item.unitPrice ?? ''} onChange={(event) => onItemChange?.(index, 'unitPrice', event.target.value)} /> : `${formatMoney(unitPrice, currency)}${formatLineItemRateBasis(item)}`}
            </td>
            <td className="quote-client-document-number-cell quote-client-document-amount-cell">{formatMoney(calculateLineItemAmount(item), currency)}</td>
          </tr>
        );
      })}
    </tbody>
  ));
}

export default function QuoteClientDocument({
  quoteNumber,
  date,
  status,
  clientName,
  clientEmail,
  clientAddress,
  photographerName,
  photographerEmail,
  items = [],
  discountRate = 0,
  taxRate = 0,
  currency,
  notes,
  formatMoney,
  totals,
  scope,
  projectName,
  editable = false,
  preview = false,
  activeItemIndex = null,
  onActivateItem,
  onItemChange,
  onRemoveItem,
  onItemDragStart,
  onItemDragEnd,
  onItemDrop,
  draggedItemIndex = null,
  onAddItem,
  provisionalItemIndex = null,
  itemSuggestions = PHOTOGRAPHY_ITEM_SUGGESTIONS,
  suggestionMenuOpen = false,
  suggestionMenuIndex = null,
  onSuggestionSelect,
  onCustomSelect,
  onDescriptionFocus,
  onDescriptionBlur,
  onExitAddItem,
  onFieldChange,
  onOpenUsage,
  onOpenIntelligence,
  sourceFocus = false,
  intelligenceFinding,
  preparedForActive = false,
  onActivatePreparedFor,
}) {
  const pages = paginateQuoteItems(items);
  const resolvedProject = projectName || scope?.common?.shoot_type || 'Photography production';
  const money = typeof formatMoney === 'function' ? formatMoney : (value) => Number(value || 0).toFixed(2);

  return (
    <article
      className={`quote-client-document${editable ? ' is-editable' : ''}${preview ? ' is-preview' : ''}`}
      style={{ width: '794px' }}
      data-page-ratio="210:297"
      data-page-count={pages.length}
    >
      {pages.map((pageItems, pageIndex) => {
        const firstPage = pageIndex === 0;
        const lastPage = pageIndex === pages.length - 1;
        return (
          <section className="quote-client-document-page" data-testid={`quote-client-document-page-${pageIndex + 1}`} key={pageIndex} aria-label={`Quote page ${pageIndex + 1} of ${pages.length}`}>
            <header className={`quote-client-document-header${firstPage ? '' : ' is-continuation'}`}>
              <div>
                <h2>{firstPage ? 'QUOTE' : 'QUOTE · CONTINUED'}</h2>
                <DocumentField editable={editable && firstPage} value={quoteNumber || ''} ariaLabel="Quote number" className="quote-client-document-number" testId="quote-number-input" onChange={(value) => onFieldChange?.('number', value)} />
              </div>
              <div className="quote-client-document-meta">
                <DocumentField editable={editable && firstPage} value={editable ? (date || '') : normalizeDate(date)} ariaLabel="Quote date" className="quote-client-document-date" testId="quote-date-input" onChange={(value) => onFieldChange?.('date', value)} />
                {!firstPage && <span>Page {pageIndex + 1} of {pages.length}</span>}
                {firstPage && status && <span className="quote-client-document-status">{status === 'draft' ? 'Draft' : status}</span>}
              </div>
            </header>

            {firstPage && (
              <div className="quote-client-document-parties">
                <div
                  className={`quote-client-document-prepared-for${editable && preparedForActive ? ' is-active' : ''}`}
                  data-testid="quote-prepared-for"
                  data-prepared-for-active={editable && preparedForActive ? 'true' : 'false'}
                  onClick={(event) => {
                    const selectedText = typeof window === 'undefined' ? '' : window.getSelection()?.toString().trim();
                    const interactiveTarget = event.target.closest?.('input, button, select, textarea');
                    if (!editable || preparedForActive || selectedText || interactiveTarget) return;
                    onActivatePreparedFor?.();
                  }}
                >
                  <span className="quote-client-document-label">Prepared for</span>
                  <DocumentField editable={editable && preparedForActive} value={clientName || 'Client Name'} ariaLabel="Client name" className="quote-client-document-primary" testId="quote-client-name-input" onChange={(value) => onFieldChange?.('clientName', value)} />
                  <DocumentField editable={editable && preparedForActive} value={clientEmail || ''} ariaLabel="Client email" className="quote-client-document-secondary" type="email" onChange={(value) => onFieldChange?.('clientEmail', value)} />
                  <DocumentField editable={editable && preparedForActive} value={clientAddress || ''} ariaLabel="Client address" className="quote-client-document-secondary" onChange={(value) => onFieldChange?.('clientAddress', value)} />
                </div>
                <div>
                  <span className="quote-client-document-label">Project</span>
                  <DocumentField editable={editable} value={resolvedProject} ariaLabel="Project" className="quote-client-document-primary" onChange={(value) => onFieldChange?.('project', value)} />
                  <span className="quote-client-document-secondary">{photographerName || 'Photographer'}</span>
                  {photographerEmail && <span className="quote-client-document-secondary">{photographerEmail}</span>}
                </div>
              </div>
            )}

            <div className="quote-client-document-table-wrap">
              <table className="quote-client-document-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>
                      Rate ({editable ? (
                        <select className="professional-currency-select" data-testid="quote-currency-select" aria-label="Quote currency" value={currency} onChange={(event) => onFieldChange?.('currency', event.target.value)}>
                          {['USD', 'CAD', 'EUR', 'GBP', 'CNY'].map((option) => <option value={option} key={option}>{option}</option>)}
                        </select>
                      ) : currency})
                    </th>
                    <th>Amount ({currency})</th>
                  </tr>
                </thead>
                <PricingRows
                  items={pageItems}
                  editable={editable}
                  activeItemIndex={activeItemIndex}
                  onActivateItem={onActivateItem}
                  onItemChange={onItemChange}
                  onRemoveItem={onRemoveItem}
                  onItemDragStart={onItemDragStart}
                  onItemDragEnd={onItemDragEnd}
                  onItemDrop={onItemDrop}
                  draggedItemIndex={draggedItemIndex}
                  formatMoney={money}
                  currency={currency}
                  itemSuggestions={itemSuggestions}
                  suggestionMenuOpen={suggestionMenuOpen}
                  suggestionMenuIndex={suggestionMenuIndex}
                  onSuggestionSelect={onSuggestionSelect}
                  onCustomSelect={onCustomSelect}
                  onDescriptionFocus={onDescriptionFocus}
                  onDescriptionBlur={onDescriptionBlur}
                  onExitAddItem={onExitAddItem}
                />
              </table>
              {lastPage && editable && !preview && !Number.isInteger(provisionalItemIndex) && (
                <button type="button" className="professional-add-item non-printing" data-testid="professional-add-item" onClick={onAddItem}>Add item</button>
              )}
              {lastPage && editable && !preview && intelligenceFinding && (
                <button type="button" className="professional-intelligence-annotation non-printing" data-testid="professional-intelligence" onClick={onOpenIntelligence}>
                  <span>Needs attention</span>
                  <strong>{intelligenceFinding.title}</strong>
                  <small>{intelligenceFinding.message}</small>
                </button>
              )}
            </div>

            {lastPage && (
              <div className="quote-client-document-summary">
                <div className="quote-client-document-terms">
                  <button type="button" data-testid="professional-usage-summary" className={`quote-client-document-summary-block${sourceFocus ? ' is-source-focused' : ''}`} disabled={!editable} onClick={onOpenUsage}>
                    <span className="quote-client-document-label">Usage</span>
                    <strong>{usageSummary(scope)}</strong>
                  </button>
                  <div className="quote-client-document-summary-block">
                    <span className="quote-client-document-label">Payment terms</span>
                    {editable ? (
                      <textarea className="professional-document-notes" aria-label="Payment terms and notes" value={notes || ''} onChange={(event) => onFieldChange?.('notes', event.target.value)} />
                    ) : <strong>{notes || 'Net 30 days from invoice date.'}</strong>}
                  </div>
                </div>
                <div className="quote-client-document-totals">
                  <div><span>Subtotal</span><strong>{money(totals.subtotal, currency)}</strong></div>
                  {discountRate > 0 && <div><span>Discount ({discountRate}%)</span><strong>−{money(totals.discount, currency)}</strong></div>}
                  <div>
                    <span>
                      Tax ({editable ? <input className="professional-total-rate" data-testid="quote-tax-input" aria-label="Tax rate" inputMode="decimal" value={taxRate} onChange={(event) => onFieldChange?.('taxRate', event.target.value)} /> : taxRate}%)
                    </span>
                    <strong>{money(totals.tax, currency)}</strong>
                  </div>
                  <div className="quote-client-document-total"><span>Total ({currency})</span><strong>{money(totals.total, currency)}</strong></div>
                </div>
              </div>
            )}
            <footer className="quote-client-document-page-number">{pages.length > 1 ? `${pageIndex + 1} / ${pages.length}` : ''}</footer>
          </section>
        );
      })}
    </article>
  );
}
