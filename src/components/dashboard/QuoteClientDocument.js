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
}) {
  return (
    <article className="quote-client-document" style={{ width: '794px', padding: '44px', background: '#fffdf9', color: '#1e293b', fontFamily: 'var(--font-sans)' }}>
      <header className="quote-client-document-header" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #cbd5e1', paddingBottom: '15px', marginBottom: '15px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a' }}>QUOTE</h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Generated via Corvioz</p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>#{quoteNumber}</p>
          <p style={{ margin: '3px 0 0 0' }}>Date: {date}</p>
          <p style={{ margin: '3px 0 0 0' }}>Status: {status}</p>
        </div>
      </header>

      <div className="quote-client-document-parties" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', fontSize: '0.9rem' }}>
        <div>
          <h5 style={{ margin: '0 0 4px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.75rem' }}>Prepared For:</h5>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{clientName || 'Client Name'}</p>
          <p style={{ margin: 0 }}>{clientEmail}</p>
          <p style={{ margin: 0 }}>{clientAddress}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h5 style={{ margin: '0 0 4px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.75rem' }}>From:</h5>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{photographerName || 'Photographer'}</p>
          <p style={{ margin: 0 }}>{photographerEmail}</p>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#64748b' }}>
            <th style={{ padding: '8px 0' }}>Deliverable</th>
            <th style={{ padding: '8px 0', textAlign: 'center', width: '10%' }}>Qty</th>
            <th style={{ padding: '8px 0', textAlign: 'right', width: '20%' }}>Rate</th>
            <th style={{ padding: '8px 0', textAlign: 'right', width: '20%' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
              <td style={{ padding: '10px 0' }}>{item.description || 'Service / Deliverable'}</td>
              <td style={{ padding: '10px 0', textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ padding: '10px 0', textAlign: 'right' }}>{formatMoney(Number(item.unitPrice || 0), currency)}</td>
              <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                {formatMoney(Number(item.quantity || 0) * Number(item.unitPrice || 0), currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="quote-client-document-summary" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', fontSize: '0.9rem' }}>
        <div>
          {notes && (
            <>
              <h6 style={{ margin: '0 0 4px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.7rem' }}>Quote Notes:</h6>
              <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>{notes}</p>
            </>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', textAlign: 'right' }}>
          <div style={{ width: '100%', maxWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span>Subtotal:</span>
              <span>{formatMoney(totals.subtotal, currency)}</span>
            </div>
            {discountRate > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#e11d48' }}>
                <span>Discount ({discountRate}%):</span>
                <span>-{formatMoney(totals.discount, currency)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span>Tax ({taxRate}%):</span>
                <span>{formatMoney(totals.tax, currency)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #0f172a', fontWeight: 'bold', fontSize: '1.05rem', color: '#0f172a' }}>
              <span>Total:</span>
              <span>{formatMoney(totals.total, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
