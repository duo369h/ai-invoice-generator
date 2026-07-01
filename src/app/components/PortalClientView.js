'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
// Telemetry layer purged - UI is pure render only
const trackEvent = () => {};

export default function PortalClientView({ fetchUrl, postCommentUrl, identifier }) {
  const [doc, setDoc] = useState(null);
  const [docType, setDocType] = useState(''); // 'invoice' or 'quote'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commentAuthor, setCommentAuthor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('portal_comment_author') || '';
    }
    return '';
  });
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  
  // Approval and Payment states
  const [approving, setApproving] = useState(false);
  const [paying, setPaying] = useState(false);
  const [ownerPlan, setOwnerPlan] = useState('free');
  const [ownerId, setOwnerId] = useState('');

  const [toast, setToast] = useState(null);
  const triggerToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      if (identifier && identifier.startsWith('sandbox-')) {
        try {
          const parts = identifier.split('-'); // ['sandbox', 'quote', '12345']
          const type = parts[1] || 'quote';
          const id = parts.slice(2).join('-');
          const localData = typeof window !== 'undefined' ? window.localStorage.getItem(`sandbox-${type}-${id}`) : null;
          if (localData) {
            const parsed = JSON.parse(localData);
            setDoc(parsed);
            setDocType(type);
            setOwnerPlan('free');
            setLoading(false);
            return;
          } else {
            // fallback mock template data if not found in localStorage
            const mockDoc = type === 'quote' ? {
              quote_number: 'Q-SAMPLE',
              client_name: 'Acme Corporation',
              client_email: 'billing@acme.com',
              client_address: '100 Acme Way, Metropolis',
              currency: 'USD',
              items: [
                { description: 'Phase 1: Initial Discovery & Strategy Mockups', quantity: 1, unitPrice: 1500 },
                { description: 'Phase 2: Custom Development & API Integrations', quantity: 1, unitPrice: 2500 },
                { description: 'Phase 3: Launch Support, QA, and Performance Optimization', quantity: 1, unitPrice: 1000 }
              ],
              discount_rate: 10,
              tax_rate: 5,
              notes: 'Terms of delivery: Net 15. Standard revisions included.',
              status: 'sent',
              total: 472500, // in cents
              created_at: new Date().toISOString()
            } : {
              invoice_number: 'INV-SAMPLE',
              client_name: 'Acme Corporation',
              client_email: 'billing@acme.com',
              client_address: '100 Acme Way, Metropolis',
              currency: 'USD',
              items: [
                { description: 'Phase 1 Milestone: Design System Completed', quantity: 1, unitPrice: 1500 },
                { description: 'Phase 2 Milestone: Core Functionality Deployed', quantity: 1, unitPrice: 2500 }
              ],
              discount_rate: 0,
              tax_rate: 8,
              notes: 'Please settle within 30 days. Thank you for your business!',
              status: 'sent',
              total: 432000, // in cents
              invoice_date: new Date().toISOString().substring(0, 10),
              due_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().substring(0, 10),
              created_at: new Date().toISOString()
            };
            setDoc(mockDoc);
            setDocType(type);
            setOwnerPlan('free');
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error loading sandbox document:', e);
        }
      }

      try {
        const res = await fetch(fetchUrl);
        if (!res.ok) {
          throw new Error('Document not found or access denied');
        }
        const payload = await res.json();
        setDoc(payload.data);
        setDocType(payload.type);
        setOwnerPlan(payload.plan || 'free');
        setOwnerId(payload.owner_id || '');
        trackEvent('portal_opened', {
          doc_type: payload.type || 'unknown',
          doc_status: payload.data?.status || 'unknown',
        });
        
        // Track v1.4 Client Reality Loop events on view
        if (payload.type === 'invoice') {
          trackEvent('invoice_viewed', {
            user_id: payload.owner_id,
            invoice_id: payload.data?.id,
            invoice_number: payload.data?.invoice_number,
            client_email: payload.data?.client_email
          });
        } else if (payload.type === 'quote' && payload.data?.status === 'sent') {
          trackEvent('quote_status_pending', {
            user_id: payload.owner_id,
            quote_id: payload.data?.id,
            quote_number: payload.data?.quote_number,
            client_email: payload.data?.client_email
          });
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to fetch portal document');
      } finally {
        setLoading(false);
      }
    };
    if (identifier) {
      fetchDoc();
    }
  }, [fetchUrl, identifier]);

  const handleApproveQuote = async () => {
    if (!confirm('Are you sure you want to approve this quote?')) return;
    setApproving(true);
    
    // Sandbox mode check
    if (identifier && identifier.startsWith('sandbox-')) {
      setTimeout(() => {
        setDoc(prev => {
          const next = { ...prev, status: 'approved' };
          const parts = identifier.split('-');
          const type = parts[1] || 'quote';
          const id = parts.slice(2).join('-');
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(`sandbox-${type}-${id}`, JSON.stringify(next));
          }
          return next;
        });
        triggerToast('Quote approved! The freelancer will be notified shortly (Sandbox Mode).', 'success');
        setApproving(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch(fetchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });
      if (res.ok) {
        setDoc(prev => ({ ...prev, status: 'approved' }));
        trackEvent('quote_accepted', {
          user_id: ownerId || 'mock-owner-id',
          quote_id: doc.id,
          quote_number: doc.quote_number
        });
        triggerToast('Quote approved! The freelancer will be notified shortly.', 'success');
      } else {
        const errData = await res.json();
        triggerToast(errData.error || 'Failed to approve quote.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error approving quote.', 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleDeclineQuote = async () => {
    if (!confirm('Are you sure you want to decline this quote?')) return;
    setApproving(true);
    
    // Sandbox mode check
    if (identifier && identifier.startsWith('sandbox-')) {
      setTimeout(() => {
        setDoc(prev => {
          const next = { ...prev, status: 'declined' };
          const parts = identifier.split('-');
          const type = parts[1] || 'quote';
          const id = parts.slice(2).join('-');
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(`sandbox-${type}-${id}`, JSON.stringify(next));
          }
          trackEvent('quote_rejected', {
            user_id: 'mock-owner-id',
            quote_id: identifier,
            quote_number: prev.quote_number
          });
          return next;
        });
        triggerToast('Quote declined (Sandbox Mode).', 'success');
        setApproving(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch(fetchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' })
      });
      if (res.ok) {
        setDoc(prev => ({ ...prev, status: 'declined' }));
        trackEvent('quote_rejected', {
          user_id: ownerId || 'mock-owner-id',
          quote_id: doc.id,
          quote_number: doc.quote_number
        });
        triggerToast('Quote declined.', 'success');
      } else {
        const errData = await res.json();
        triggerToast(errData.error || 'Failed to decline quote.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error declining quote.', 'error');
    } finally {
      setApproving(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!confirm('Are you sure you want to confirm this invoice as paid?')) return;
    setPaying(true);

    // Sandbox mode check
    if (identifier && identifier.startsWith('sandbox-')) {
      setTimeout(() => {
        setDoc(prev => {
          const next = { ...prev, status: 'paid' };
          const parts = identifier.split('-');
          const type = parts[1] || 'invoice';
          const id = parts.slice(2).join('-');
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(`sandbox-${type}-${id}`, JSON.stringify(next));
          }
          return next;
        });
        triggerToast('Payment confirmed! The freelancer has been notified (Sandbox Mode).', 'success');
        setPaying(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch(fetchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay' })
      });
      if (res.ok) {
        setDoc(prev => ({ ...prev, status: 'paid' }));
        triggerToast('Payment confirmed! The freelancer has been notified.', 'success');
      } else {
        const errData = await res.json();
        triggerToast(errData.error || 'Failed to confirm payment.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error confirming payment.', 'error');
    } finally {
      setPaying(false);
    }
  };

  const handleSubmitComment = async (event) => {
    event.preventDefault();
    if (!postCommentUrl || !commentAuthor.trim() || !commentText.trim()) return;

    setCommentSubmitting(true);

    // Sandbox mode check
    if (identifier && identifier.startsWith('sandbox-')) {
      setTimeout(() => {
        const newComment = {
          id: 'mock-comment-' + Date.now(),
          author: commentAuthor.trim(),
          text: commentText.trim(),
          created_at: new Date().toISOString()
        };
        
        setDoc(prev => {
          const updatedComments = [...(prev.comments || []), newComment];
          const next = { ...prev, comments: updatedComments };
          const parts = identifier.split('-');
          const type = parts[1] || 'quote';
          const id = parts.slice(2).join('-');
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(`sandbox-${type}-${id}`, JSON.stringify(next));
            window.localStorage.setItem('portal_comment_author', commentAuthor.trim());
          }
          return next;
        });
        
        setCommentText('');
        triggerToast('Comment posted successfully (Sandbox Mode)!', 'success');
        setCommentSubmitting(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch(postCommentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: commentAuthor,
          text: commentText,
          website: '',
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload.error || 'Failed to post comment');
      }

      // Save author name in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('portal_comment_author', commentAuthor.trim());
      }

      setDoc((prev) => ({ ...prev, comments: payload.comments || [] }));
      setCommentText('');
      trackEvent('client_response_received', {
        user_id: ownerId || 'mock-owner-id',
        doc_id: doc.id,
        author: commentAuthor,
        text_length: commentText.length
      });
      triggerToast('Comment posted successfully!', 'success');
    } catch (err) {
      console.error(err);
      triggerToast(err.message || 'Failed to post comment.', 'error');
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', padding: '40px 20px', fontFamily: 'Outfit, sans-serif' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '32px', flexDirection: 'row' }} className="portal-layout">
          {/* Sidebar skeleton */}
          <aside style={{ width: '340px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="portal-sidebar">
            <div className="card animate-pulse" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="skeleton skeleton-title animate-pulse" style={{ width: '60%' }}></div>
              <div className="skeleton skeleton-text animate-pulse" style={{ width: '90%' }}></div>
              <div className="skeleton skeleton-text animate-pulse" style={{ width: '70%' }}></div>
              <div className="skeleton animate-pulse" style={{ height: '40px', width: '100%', borderRadius: '6px', marginTop: '12px' }}></div>
            </div>
            <div className="card animate-pulse" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="skeleton skeleton-title animate-pulse" style={{ width: '40%' }}></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton animate-pulse" style={{ height: '32px', borderRadius: '4px' }}></div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main pane skeleton */}
          <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '24px' }} className="portal-main">
            <div className="card animate-pulse" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton skeleton-title animate-pulse" style={{ width: '30%' }}></div>
                <div className="skeleton skeleton-title animate-pulse" style={{ width: '20%' }}></div>
              </div>
              <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton animate-pulse" style={{ height: '16px', width: '200px' }}></div>
                    <div className="skeleton animate-pulse" style={{ height: '16px', width: '80px' }}></div>
                  </div>
                ))}
              </div>
              <hr style={{ border: '0', borderTop: '1px solid var(--border)', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div className="skeleton skeleton-title animate-pulse" style={{ width: '25%' }}></div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', padding: '20px' }}>
        <div className="card glass-panel" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '12px' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            {error || "We couldn't retrieve the requested document. Please confirm the portal link is correct or contact your freelancer."}
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

  // Status checks for timeline
  const isInvoice = docType === 'invoice';
  const status = doc.status || 'draft';

  return (
    <div className="portal-root">
      <style>{`
        .portal-root {
          min-height: 100vh;
          background-color: var(--bg-page);
          color: var(--text-main);
          padding: 40px 20px;
          font-family: Outfit, sans-serif;
        }
        @media (max-width: 480px) {
          .portal-root {
            padding: 24px 12px !important;
          }
        }
        .portal-layout {
          display: flex;
          gap: 32px;
          align-items: start;
          max-width: 1200px;
          margin: 0 auto;
        }
        .portal-sidebar {
          width: 340px;
          flex-shrink: 0;
          position: sticky;
          top: 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .portal-main {
          flex-grow: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .portal-layout {
            flex-direction: column;
            align-items: stretch;
          }
          .portal-sidebar {
            width: 100%;
            position: static;
          }
        }
        .printable-sheet {
          background: var(--bg-card);
          color: var(--text-main);
          padding: 40px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
        }
        .printable-sheet-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 32px;
        }
        .printable-sheet-adjustments {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 30px;
        }
        @media (max-width: 768px) {
          .printable-sheet {
            padding: 24px 16px !important;
          }
          .printable-sheet-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .printable-sheet-adjustments {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
        
        /* Timeline styles */
        .timeline {
          position: relative;
          padding-left: 32px;
          margin-top: 16px;
        }
        .timeline-line {
          position: absolute;
          left: 9px;
          top: 8px;
          bottom: 8px;
          width: 2px;
          background-color: var(--border);
        }
        .timeline-item {
          position: relative;
          padding-bottom: 24px;
        }
        .timeline-item:last-child {
          padding-bottom: 0;
        }
        .timeline-node {
          position: absolute;
          left: -32px;
          top: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: var(--bg-card);
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        .timeline-node.completed {
          background-color: var(--success);
          border-color: var(--success);
        }
        .timeline-node.completed::after {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: white;
        }
        .timeline-node.current {
          border-color: var(--primary);
          background-color: var(--bg-card);
        }
        .timeline-node.current::after {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--primary);
        }
        .timeline-title {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .timeline-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 2px;
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Portal Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', fontWeight: 700, padding: '4px 12px', borderRadius: '99px', background: 'var(--primary-glow)', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '8px', border: '1px solid var(--border)' }}>
              Secure Client Workspace
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {docType === 'invoice' ? `Invoice #${doc.invoice_number}` : `Quote #${doc.quote_number}`}
              <span style={{
                fontSize: '0.75rem',
                padding: '4px 8px',
                borderRadius: '8px',
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
              Print / Save PDF
            </button>
            {docType === 'quote' && doc.status !== 'approved' && doc.status !== 'declined' && (
              <>
                <button onClick={handleApproveQuote} disabled={approving} className="btn btn-primary btn-sm">
                  {approving ? 'Approving...' : 'Accept Quote'}
                </button>
                <button onClick={handleDeclineQuote} disabled={approving} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }}>
                  Decline Quote
                </button>
              </>
            )}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="portal-layout">
          
          {/* Left Sidebar */}
          <aside className="portal-sidebar">
            
            {/* Project Summary Card */}
            <div className="card glass-panel" style={{ padding: '24px', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.05em' }}>
                Project Summary
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Freelancer</label>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{doc.business_name || 'Independent Freelancer'}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{doc.business_email || doc.freelancer_email}</span>
                </div>
                
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Client Coordinates</label>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{doc.client_name}</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>{doc.client_email}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Issue Date</label>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.invoice_date || doc.created_at?.substring(0, 10)}</span>
                  </div>
                  {doc.due_date && (
                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Due Date</label>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.due_date}</span>
                    </div>
                  )}
                </div>

                {doc.payment_terms && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Payment Terms</label>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.payment_terms}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Vertical Activity Timeline */}
            <div className="card glass-panel" style={{ padding: '24px', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '0.05em' }}>
                Activity Timeline
              </h3>
              
              <div className="timeline">
                <div className="timeline-line" />
                
                {isInvoice ? (
                  <>
                    {/* Invoice Timeline */}
                    <div className="timeline-item">
                      <div className="timeline-node completed" />
                      <div className="timeline-content">
                        <span className="timeline-title">Invoice Created</span>
                        <span className="timeline-desc">Freelancer drafted invoice on {doc.invoice_date || doc.created_at?.substring(0, 10)}</span>
                      </div>
                    </div>
                    
                    <div className="timeline-item">
                      <div className={`timeline-node ${['sent', 'opened', 'overdue', 'paid'].includes(status) ? 'completed' : 'current'}`} />
                      <div className="timeline-content">
                        <span className="timeline-title">Sent to Client</span>
                        <span className="timeline-desc">Document sent for review</span>
                      </div>
                    </div>

                    <div className="timeline-item">
                      <div className={`timeline-node ${['opened', 'overdue', 'paid'].includes(status) ? 'completed' : (status === 'sent' ? 'current' : '')}`} />
                      <div className="timeline-content">
                        <span className="timeline-title">Opened / Reviewed</span>
                        <span className="timeline-desc">{['opened', 'overdue', 'paid'].includes(status) ? 'Opened and reviewed by client' : 'Waiting for client review'}</span>
                      </div>
                    </div>

                    <div className="timeline-item">
                      <div className={`timeline-node ${status === 'paid' ? 'completed' : (['opened', 'overdue'].includes(status) ? 'current' : '')}`} />
                      <div className="timeline-content">
                        <span className="timeline-title">Settled / Paid</span>
                        <span className="timeline-desc">{status === 'paid' ? 'Paid in full' : 'Awaiting final payment'}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Quote Timeline */}
                    <div className="timeline-item">
                      <div className="timeline-node completed" />
                      <div className="timeline-content">
                        <span className="timeline-title">Quote Prepared</span>
                        <span className="timeline-desc">Estimate drafted on {doc.created_at?.substring(0, 10)}</span>
                      </div>
                    </div>

                    <div className="timeline-item">
                      <div className={`timeline-node ${['sent', 'approved', 'declined'].includes(status) ? 'completed' : 'current'}`} />
                      <div className="timeline-content">
                        <span className="timeline-title">Submitted for Approval</span>
                        <span className="timeline-desc">Sent to client for signature</span>
                      </div>
                    </div>

                    <div className="timeline-item">
                      <div className={`timeline-node ${status === 'approved' || status === 'declined' ? 'completed' : (status === 'sent' ? 'current' : '')}`} style={status === 'declined' ? { borderColor: 'var(--danger)', backgroundColor: 'var(--danger-glow)' } : undefined} />
                      <div className="timeline-content">
                        <span className="timeline-title">{status === 'declined' ? 'Declined' : 'Approved'}</span>
                        <span className="timeline-desc">{status === 'approved' ? 'Accepted & ready for invoicing' : (status === 'declined' ? 'Declined by client' : 'Waiting for client signature')}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

          </aside>

          {/* Right Main Panel */}
          <main className="portal-main">
            
            {/* Quick Checkout / Approval Banners */}
            {isInvoice && status !== 'paid' && (
              <div className="card" style={{
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                border: '1px solid var(--success)',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--success-glow) 0%, var(--bg-surface) 100%)',
                boxShadow: 'var(--shadow-md)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Clear Outstanding Balance</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {doc.payment_link 
                      ? 'Pay this invoice instantly via the secure payment link.' 
                      : 'Please contact the freelancer for wire transfer / offline payment details, then click "Confirm Paid" to notify them.'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {doc.payment_link && (
                    <a href={doc.payment_link} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontWeight: 700 }}>
                      💳 Pay {currencySymbol}{totalAmount.toFixed(2)} Now
                    </a>
                  )}
                  <button onClick={handleMarkPaid} disabled={paying} className="btn btn-secondary" style={{ padding: '12px 24px', fontWeight: 700, borderRadius: 'var(--radius-md)' }}>
                    {paying ? 'Processing...' : 'Confirm Paid'}
                  </button>
                </div>
              </div>
            )}

            {!isInvoice && status !== 'approved' && status !== 'declined' && (
              <div className="card" style={{
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--accent-glow) 0%, var(--bg-surface) 100%)',
                boxShadow: 'var(--shadow-md)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Review & Approve Quote</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Review the milestone services below. If acceptable, click to approve.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleApproveQuote} disabled={approving} className="btn btn-primary" style={{ padding: '12px 24px', fontWeight: 700 }}>
                    {approving ? 'Approving...' : 'Approve Quote'}
                  </button>
                  <button onClick={handleDeclineQuote} disabled={approving} className="btn btn-secondary" style={{ padding: '12px 24px', fontWeight: 700, color: 'var(--danger)' }}>
                    {approving ? 'Processing...' : 'Decline'}
                  </button>
                </div>
              </div>
            )}

            {!isInvoice && status === 'declined' && (
              <div className="card" style={{
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--danger-glow) 0%, var(--bg-surface) 100%)',
                boxShadow: 'var(--shadow-md)'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--danger)' }}>Quote Declined</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    You have declined this quote. Please contact the freelancer if you&apos;d like to negotiate revisions.
                  </p>
                </div>
              </div>
            )}

            {/* Flat Printable details sheet */}
            <div id="printable-invoice" className="card printable-sheet">
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border)', paddingBottom: '24px', marginBottom: '24px', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {isInvoice ? 'INVOICE' : 'QUOTE'}
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {isInvoice ? `Invoice Number: ${doc.invoice_number}` : `Quote Number: ${doc.quote_number}`}
                  </p>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <h4 style={{ margin: 0, color: 'var(--text-main)', fontWeight: 700 }}>{doc.business_name || 'Independent Freelancer'}</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.business_email || doc.freelancer_email || ''}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.business_address || ''}</p>
                </div>
              </div>

              <div className="printable-sheet-grid">
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
              <div style={{ overflowX: 'auto', marginBottom: '32px' }}>
                <table style={{ width: '100%', minWidth: '500px', borderCollapse: 'collapse' }}>
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
              </div>

              {/* Pricing Adjustments */}
              <div className="printable-sheet-adjustments">
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Freelancer Policy Terms</h4>
                  <p style={{ margin: 0, lineHeight: 1.5 }}>
                    {doc.notes || 'Terms of delivery Net 30.'}
                  </p>
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

            {/* Collaboration & Comments Feed */}
            <section className="card glass-panel" style={{ padding: '28px', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 16px 0' }}>Client Comments</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {(doc.comments || []).length > 0 ? (
                  doc.comments.map((comment) => (
                    <div key={comment.id} style={{ padding: '14px 16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{comment.author}</strong>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{comment.created_at?.substring(0, 10)}</span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '24px', borderRadius: '12px', border: '1px dashed var(--border)', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                    <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.6 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}>Collaborate directly on this document to clarify scope revisions, request edits, or ask questions inline.</p>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.45 }}>
                      Post comments or approval notes below. The freelancer will be notified instantly to keep your project moving forward without email delays.
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmitComment} style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label className="input-label">Your name</label>
                  <input
                    className="form-input"
                    value={commentAuthor}
                    onChange={(event) => setCommentAuthor(event.target.value)}
                    placeholder="e.g. Alex from client team"
                    required
                  />
                </div>
                <div>
                  <label className="input-label">Comment</label>
                  <textarea
                    className="form-input"
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Add a comment or approval note..."
                    rows={4}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={commentSubmitting || !commentAuthor.trim() || !commentText.trim()}
                  className="btn btn-primary"
                  style={{ justifySelf: 'flex-start' }}
                >
                  {commentSubmitting ? 'Saving...' : 'Save Comment'}
                </button>
              </form>
            </section>

          </main>

        </div>

        {/* Portal Footer Branding Signature */}
        {ownerPlan === 'free' && (
          <footer style={{ 
            marginTop: '48px', 
            paddingTop: '24px', 
            borderTop: '1px solid var(--border)', 
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <p style={{ margin: 0 }}>
              Securely powered by <Link href="/" target="_blank" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Corvioz</Link>. Share invoices, proposals, and client updates in one workspace.
            </p>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.72rem' }}>
              Are you a freelancer? <Link href="/" target="_blank" style={{ color: 'var(--accent)', fontWeight: 650, textDecoration: 'underline' }}>Get your free account</Link>
            </p>
          </footer>
        )}

      </div>

      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: '12px 20px',
          borderRadius: '8px',
          background: toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          fontSize: '0.85rem',
          fontWeight: 600,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fade-in 0.2s ease-out'
        }}>
          <span>{toast.type === 'error' ? 'Error' : 'Done'}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
