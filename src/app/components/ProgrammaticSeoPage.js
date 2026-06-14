import React from 'react';
import SeoPageLayout from './SeoPageLayout';

export default function ProgrammaticSeoPage({
  occupation,
  title,
  subtitle,
  ctaText = 'Create Invoice Now',
  scenarioTitle = 'Typical Billing Scenarios',
  scenarioText,
  scenarios = [],
  fieldsTitle = 'Recommended Invoice Fields',
  fields = [],
  exampleInvoiceTitle = 'Sample Invoice Layout',
  exampleInvoice = {
    invoiceNumber: '',
    date: '',
    clientName: '',
    clientEmail: '',
    businessName: '',
    businessEmail: '',
    items: [],
    taxRate: 0,
    discountRate: 0,
    currency: 'USD',
    currencySymbol: '$',
    notes: ''
  },
  faqItems = []
}) {
  // Compute invoice financial figures
  const subtotal = exampleInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = subtotal * (exampleInvoice.discountRate / 100);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxableAmount * (exampleInvoice.taxRate / 100);
  const total = taxableAmount + taxAmount;

  const contentHtml = (
    <div>
      {/* Scenario Section */}
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0', color: 'var(--text-main)' }}>
        {scenarioTitle}
      </h2>
      <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
        {scenarioText}
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {scenarios.map((s, index) => (
          <div key={index} className="card" style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--primary)' }}>
              {s.title}
            </h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
              {s.description}
            </p>
          </div>
        ))}
      </div>

      {/* Fields Table Section */}
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0', color: 'var(--text-main)' }}>
        {fieldsTitle}
      </h2>
      <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
        An invoice template for a {occupation} must capture specific line items to ensure client clarity and prompt payment. We suggest including:
      </p>

      <div style={{ overflowX: 'auto', marginBottom: '40px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-main)' }}>
              <th style={{ padding: '12px 8px', width: '30%' }}>Field Name</th>
              <th style={{ padding: '12px 8px' }}>Purpose & Professional Context</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((f, index) => (
              <tr key={index} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--text-main)' }}>{f.name}</td>
                <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{f.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interactive PDF Example Preview */}
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0', color: 'var(--text-main)' }}>
        {exampleInvoiceTitle}
      </h2>
      <p style={{ marginBottom: '20px', color: 'var(--text-muted)' }}>
        Below is a realistic sample of how your billing document will be formatted and printed using the Freelancer Business OS freelance assistant.
      </p>

      <div style={{
        background: '#ffffff',
        color: '#1e293b',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        fontFamily: 'monospace',
        marginBottom: '40px',
        border: '1px solid #e2e8f0'
      }}>
        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #cbd5e1', paddingBottom: '15px', marginBottom: '15px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>INVOICE</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Generated via Freelancer Business OS</p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#475569' }}>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#0f172a' }}>#{exampleInvoice.invoiceNumber}</p>
            <p style={{ margin: '3px 0 0 0' }}>Date: {exampleInvoice.date}</p>
            <p style={{ margin: '3px 0 0 0' }}>Due Date: On Receipt</p>
          </div>
        </div>

        {/* Client & Business info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', fontSize: '0.85rem' }}>
          <div>
            <h5 style={{ margin: '0 0 4px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.7rem' }}>Billed To:</h5>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#0f172a' }}>{exampleInvoice.clientName}</p>
            <p style={{ margin: 0, color: '#475569' }}>{exampleInvoice.clientEmail}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h5 style={{ margin: '0 0 4px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.7rem' }}>From:</h5>
            <p style={{ margin: 0, fontWeight: 'bold', color: '#0f172a' }}>{exampleInvoice.businessName}</p>
            <p style={{ margin: 0, color: '#475569' }}>{exampleInvoice.businessEmail}</p>
          </div>
        </div>

        {/* Invoice Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#64748b' }}>
              <th style={{ padding: '6px 0' }}>Item & Description</th>
              <th style={{ padding: '6px 0', textAlign: 'center', width: '10%' }}>Qty</th>
              <th style={{ padding: '6px 0', textAlign: 'right', width: '20%' }}>Rate</th>
              <th style={{ padding: '6px 0', textAlign: 'right', width: '20%' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {exampleInvoice.items.map((item, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                <td style={{ padding: '8px 0' }}>{item.description}</td>
                <td style={{ padding: '8px 0', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '8px 0', textAlign: 'right' }}>
                  {exampleInvoice.currencySymbol}{item.unitPrice.toFixed(2)}
                </td>
                <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                  {exampleInvoice.currencySymbol}{(item.quantity * item.unitPrice).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', fontSize: '0.85rem' }}>
          <div style={{ color: '#475569' }}>
            {exampleInvoice.notes && (
              <>
                <h6 style={{ margin: '0 0 4px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.65rem' }}>Payment Notes:</h6>
                <p style={{ margin: 0, fontSize: '0.75rem', lineHeight: '1.4' }}>{exampleInvoice.notes}</p>
              </>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', textAlign: 'right' }}>
            <div style={{ width: '100%', maxWidth: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#475569' }}>
                <span>Subtotal:</span>
                <span>{exampleInvoice.currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              {exampleInvoice.discountRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#e11d48' }}>
                  <span>Discount ({exampleInvoice.discountRate}%):</span>
                  <span>-{exampleInvoice.currencySymbol}{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {exampleInvoice.taxRate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#475569' }}>
                  <span>Tax ({exampleInvoice.taxRate}%):</span>
                  <span>{exampleInvoice.currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid #0f172a', fontWeight: 'bold', fontSize: '0.95rem', color: '#0f172a' }}>
                <span>Total:</span>
                <span>{exampleInvoice.currencySymbol}{total.toFixed(2)} {exampleInvoice.currency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <SeoPageLayout
      title={title}
      subtitle={subtitle}
      ctaText={ctaText}
      contentHtml={contentHtml}
      faqItems={faqItems}
      lang="en"
    />
  );
}
