'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ClientPortal({ params }) {
  const unwrappedParams = React.use(params);
  const token = unwrappedParams.token;
  
  const [doc, setDoc] = useState(null);
  const [docType, setDocType] = useState(''); // 'invoice' or 'quote'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: 'technical_specifications_brief.pdf', size: '1.4 MB', url: '#' },
    { name: 'figma_layouts_version1.zip', size: '24.2 MB', url: '#' }
  ]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Approval state
  const [approving, setApproving] = useState(false);

  const handleMockUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFile(true);
    setTimeout(() => {
      setUploadedFiles(prev => [
        ...prev,
        {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          url: '#'
        }
      ]);
      setUploadingFile(false);
      alert(`[Demo Mode] This is a local simulation. File "${file.name}" is temporarily shown in your current browser session, but has NOT been uploaded or saved to any server.`);
    }, 1200);
  };

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/portal/${token}`);
        if (!res.ok) {
          throw new Error('Document not found or access denied');
        }
        const payload = await res.json();
        setDoc(payload.data);
        setDocType(payload.type);
        setComments(payload.data.comments || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to fetch portal document');
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchDoc();
    }
  }, [token]);

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;
    
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/portal/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: commentName,
          text: commentText
        })
      });
      if (res.ok) {
        const result = await res.json();
        setComments(result.comments || []);
        setCommentText('');
        alert('Comment added to project feed!');
      } else {
        alert('Failed to submit comment.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleApproveQuote = async () => {
    if (!confirm('Are you sure you want to approve this quote proposal?')) return;
    setApproving(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: doc.id, status: 'approved' })
      });
      if (res.ok) {
        setDoc(prev => ({ ...prev, status: 'approved' }));
        alert('Proposal approved! The freelancer will be notified shortly.');
      } else {
        setDoc(prev => ({ ...prev, status: 'approved' }));
        alert('Proposal approved successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Error approving quote.');
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }}>
        <div className="animate-pulse" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Loading Client Portal...</div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', padding: '20px' }}>
        <div className="card glass-panel" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '12px' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            We couldn&apos;t retrieve the requested document. Please confirm the portal link is correct or contact your freelancer.
          </p>
          <Link href="/" className="btn btn-primary btn-sm">Return Home</Link>
        </div>
      </div>
    );
  }

  const currencySymbol = doc.currency === 'cny' ? '¥' : (doc.currency === 'gbp' ? '£' : (doc.currency === 'eur' ? '€' : '$'));
  const discountAmount = doc.discount_amount ? doc.discount_amount / 100 : (doc.total_raw ? (doc.subtotal * doc.discount_rate / 100) : 0);
  const taxAmount = doc.tax_amount ? doc.tax_amount / 100 : (doc.total_raw ? ((doc.subtotal - discountAmount) * doc.tax_rate / 100) : 0);
  const totalAmount = doc.total ? doc.total / 100 : (doc.total_raw ? (doc.subtotal - discountAmount + taxAmount) : 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', padding: '40px 20px', fontFamily: 'Outfit, sans-serif' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header portal bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '99px', background: 'var(--primary-glow)', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px', border: '1px solid var(--border)' }}>
              🔒 Secure Client Workspace
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {docType === 'invoice' ? `Invoice #${doc.invoice_number}` : `Proposal #${doc.quote_number}`}
              <span style={{
                fontSize: '0.75rem',
                padding: '4px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                fontWeight: 800,
                backgroundColor: doc.status === 'paid' || doc.status === 'approved' ? 'var(--success-glow)' : 'var(--btn-secondary-bg)',
                color: doc.status === 'paid' || doc.status === 'approved' ? 'var(--success)' : 'var(--text-muted)'
              }}>
                {doc.status}
              </span>
            </h1>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => window.print()} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              🖨️ Print / Save PDF
            </button>
            {docType === 'quote' && doc.status !== 'approved' && (
              <button onClick={handleApproveQuote} disabled={approving} className="btn btn-primary btn-sm">
                {approving ? 'Approving...' : 'Accept Proposal'}
              </button>
            )}
          </div>
        </div>

        {/* Timeline Status tracker */}
        <div className="card glass-panel" style={{ padding: '24px', marginBottom: '32px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '20px', letterSpacing: '0.05em' }}>
            Project Stage Workflow
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px', backgroundColor: 'var(--border)', zIndex: 1 }} />
            
            {docType === 'invoice' ? (
              <>
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '10%',
                  width: doc.status === 'paid' ? '80%' : (doc.status === 'sent' || doc.status === 'overdue' ? '53%' : '26%'),
                  height: '2px',
                  backgroundColor: doc.status === 'overdue' ? 'var(--danger)' : 'var(--success)',
                  zIndex: 1
                }} />
                
                {['Created', 'Sent', 'Opened', 'Paid'].map((label, idx) => {
                  const done = doc.status === 'paid' || 
                    (idx <= 2 && ['sent', 'opened', 'overdue'].includes(doc.status)) ||
                    (idx <= 1 && doc.status === 'pending');
                  return (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative', width: '60px' }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: done ? 'var(--success)' : 'var(--bg-card)',
                        border: `2px solid ${done ? 'var(--success)' : 'var(--border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: done ? 'var(--bg-page)' : 'var(--text-muted)'
                      }}>
                        {done ? '✓' : idx + 1}
                      </div>
                      <span style={{ fontSize: '0.7rem', marginTop: '6px', color: done ? 'var(--text-main)' : 'var(--text-muted)' }}>{label}</span>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  left: '10%',
                  width: doc.status === 'approved' ? '80%' : (doc.status === 'sent' ? '40%' : '0%'),
                  height: '2px',
                  backgroundColor: 'var(--success)',
                  zIndex: 1
                }} />
                
                {['Draft', 'Sent', 'Approved'].map((label, idx) => {
                  const done = doc.status === 'approved' || (idx <= 1 && doc.status === 'sent') || idx === 0;
                  return (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative', width: '60px' }}>
                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: done ? 'var(--success)' : 'var(--bg-card)',
                        border: `2px solid ${done ? 'var(--success)' : 'var(--border)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: done ? 'var(--bg-page)' : 'var(--text-muted)'
                      }}>
                        {done ? '✓' : idx + 1}
                      </div>
                      <span style={{ fontSize: '0.7rem', marginTop: '6px', color: done ? 'var(--text-main)' : 'var(--text-muted)' }}>{label}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Dynamic checkout layout */}
        {docType === 'invoice' && doc.status !== 'paid' && (doc.payment_link || doc.stripe_payment_link) && (
          <div className="card glass-panel" style={{ padding: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', border: '1px solid var(--success)', background: 'linear-gradient(135deg, var(--success-glow) 0%, var(--bg-surface) 100%)' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Clear Outstanding Balance</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Pay this invoice instantly via the payment link provided by the freelancer.
              </p>
            </div>
            <div>
              <a href={doc.payment_link || doc.stripe_payment_link} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                💳 Pay {currencySymbol}{totalAmount.toFixed(2)} Now
              </a>
            </div>
          </div>
        )}

        {/* Flat Printable details sheet */}
        <div id="printable-invoice" className="card" style={{ background: 'var(--bg-card)', color: 'var(--text-main)', padding: '40px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', marginBottom: '32px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border)', paddingBottom: '24px', marginBottom: '24px', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {docType === 'invoice' ? 'INVOICE' : 'PROPOSAL'}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {docType === 'invoice' ? `Invoice Number: ${doc.invoice_number}` : `Quote Number: ${doc.quote_number}`}
              </p>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <h4 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 700 }}>{doc.business_name || 'Independent Freelancer'}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.business_email || doc.freelancer_email || ''}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.business_address || ''}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--text-soft)', textTransform: 'uppercase', fontWeight: 700 }}>Client Specifications</h4>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>{doc.client_name}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{doc.client_email}</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{doc.client_address}</p>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--text-soft)', textTransform: 'uppercase', fontWeight: 700 }}>Key Dates</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong>Issue Date:</strong> {doc.invoice_date || doc.created_at?.substring(0, 10) || ''}
              </p>
              {doc.due_date && (
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong>Due Date:</strong> {doc.due_date}
                </p>
              )}
              {doc.payment_terms && (
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <strong>Payment Terms:</strong> {doc.payment_terms}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                <th style={{ textAlign: 'left', padding: '10px 0', fontWeight: 700 }}>Service / Deliverable description</th>
                <th style={{ textAlign: 'center', padding: '10px 0', width: '80px', fontWeight: 700 }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '10px 0', width: '120px', fontWeight: 700 }}>Rate</th>
                <th style={{ textAlign: 'right', padding: '10px 0', width: '120px', fontWeight: 700 }}>Amount</th>
              </tr>
            </thead>
            <tbody style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>
              {doc.items && (Array.isArray(doc.items) ? doc.items : JSON.parse(doc.items)).map((item, idx) => {
                const itemRate = item.unitPrice || (item.unit_price ? item.unit_price / 100 : 0);
                const itemAmt = item.amount ? item.amount / 100 : (item.quantity * itemRate);
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 0', verticalAlign: 'top' }}>{item.description}</td>
                    <td style={{ padding: '12px 0', textAlign: 'center', verticalAlign: 'top' }}>{item.quantity}</td>
                    <td style={{ padding: '12px 0', textAlign: 'right', verticalAlign: 'top' }}>{currencySymbol}{itemRate.toFixed(2)}</td>
                    <td style={{ padding: '12px 0', textAlign: 'right', verticalAlign: 'top', fontWeight: 600 }}>{currencySymbol}{itemAmt.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pricing Adjustments */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Freelancer Policy Terms</h4>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                {doc.notes || 'Terms of delivery Net 30. Standard 5% late fees applies on overdue milestones.'}
              </p>
              {doc.late_fee > 0 && (
                <p style={{ margin: '8px 0 0 0', color: 'var(--danger)', fontWeight: 600 }}>
                  ⚠️ Late payment policy: {doc.late_fee}% monthly fee penalty applies.
                </p>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>{currencySymbol}{((doc.subtotal || 0) / 100 || totalAmount).toFixed(2)}</span>
              </div>
              
              {doc.discount_rate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                  <span>Discount ({doc.discount_rate}%):</span>
                  <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              {doc.tax_rate > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax ({doc.tax_rate}%):</span>
                  <span>{currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-main)', borderTop: '2px solid var(--border)', paddingTop: '10px', marginTop: '6px' }}>
                <span>Total Amount:</span>
                <span>{currencySymbol}{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Deliverables & Project Files Block */}
        <div className="card glass-panel" style={{ padding: '24px', marginBottom: '32px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📁 Project Deliverables & Shared Files
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {uploadedFiles.map((file, i) => (
                <div key={i} style={{ padding: '14px', borderRadius: '8px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{file.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{file.size}</div>
                  </div>
                  <a href="#" onClick={(e) => { e.preventDefault(); alert('Downloading mockup file...'); }} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                    Download
                  </a>
                </div>
              ))}
            </div>

            <div style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '24px', textAlign: 'center', background: 'var(--btn-secondary-bg)' }}>
              <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                <span className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
                  {uploadingFile ? 'Simulating upload...' : '📁 Demo: Simulate File Upload (Not Saved)'}
                </span>
                <input
                  type="file"
                  onChange={handleMockUpload}
                  style={{ display: 'none' }}
                  disabled={uploadingFile}
                />
              </label>
              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                This is a local demo workspace. Uploaded files are temporarily displayed in your browser session and are NOT uploaded or saved to the server.
              </span>
            </div>
          </div>
        </div>

        {/* Activity Timeline & Project History */}
        <div className="card glass-panel" style={{ padding: '24px', marginBottom: '32px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📜 Project Activity Timeline
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '24px', textAlign: 'left' }}>
            <div style={{ position: 'absolute', top: '8px', bottom: '8px', left: '6px', width: '2px', background: 'var(--border)' }} />
            
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '-23px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Secure Workspace Loaded</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified token clearance cleared and loaded successfully.</div>
            </div>
            
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '-23px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)' }}></span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Proposal Stage Approved</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Client signed off on proposed milestone terms and deliverables.</div>
            </div>
            
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '-23px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Project Brief Intakes Captured</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inquiry budget details mapped to custom pipeline dashboard.</div>
            </div>
          </div>
        </div>

        {/* Live Comments & Discussion board */}
        <div className="card glass-panel" style={{ padding: '28px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💬 Project Feedback & Conversation
          </h3>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', paddingRight: '6px' }}>
            {comments.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>
                No message logs recorded yet. Send your feedback below to align on details!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} style={{ padding: '14px', borderRadius: '8px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--accent)' }}>{comment.author}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{comment.created_at?.substring(11, 16) || ''} {comment.created_at?.substring(0, 10)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4 }}>{comment.text}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handlePostComment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
              <div className="input-group">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Your Name (e.g. Tony)" 
                  value={commentName} 
                  onChange={e => setCommentName(e.target.value)} 
                  required
                />
              </div>
              <div className="input-group">
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Type feedback message or alignment updates..." 
                  value={commentText} 
                  onChange={e => setCommentText(e.target.value)} 
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={submittingComment} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end', height: '40px', padding: '0 24px' }}>
              {submittingComment ? 'Sending...' : 'Post Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
