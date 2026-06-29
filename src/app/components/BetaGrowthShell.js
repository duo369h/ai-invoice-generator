'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, MessageSquare, Send, X } from 'lucide-react';
import { trackFeedbackSubmitted } from '../lib/product-analytics';

const FEEDBACK_EVENT = 'corvioz:open-feedback';

export function openBetaFeedbackWidget(source = 'unknown') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT, { detail: { source } }));
}

export default function BetaGrowthShell({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Dashboard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const handleOpen = (event) => {
      setIsOpen(true);
      setStatus('');
      setIsSuccess(false);
    };
    window.addEventListener(FEEDBACK_EVENT, handleOpen);
    return () => window.removeEventListener(FEEDBACK_EVENT, handleOpen);
  }, []);

  const submitFeedback = async (event) => {
    event.preventDefault();
    if (!message.trim() || !category) return;

    setIsSubmitting(true);
    setStatus('');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          email,
          category,
          priority: 'medium',
          status: 'new',
          source: 'beta_feedback_widget',
          page_url: `${window.location.pathname}${window.location.search || ''}`,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Feedback failed');

      trackFeedbackSubmitted({
        category,
        stored: Boolean(data.stored),
      });

      setMessage('');
      setIsSuccess(true);
    } catch (error) {
      console.error('Feedback submit failed:', error);
      setStatus('Feedback could not be sent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="beta-banner" data-beta-feedback-ui>
        <div className="beta-banner-inner">
          <div className="beta-banner-copy">
            <strong>Corvioz Beta</strong>
            <span className="beta-banner-desc">Help shape the product before public launch.</span>
          </div>
          <div className="beta-banner-actions">
            <button type="button" className="beta-banner-cta" onClick={() => openBetaFeedbackWidget('beta_banner')}>
              Share Feedback
            </button>
          </div>
        </div>
      </div>

      {children}

      <button
        type="button"
        className="feedback-floating-button"
        data-beta-feedback-ui
        onClick={() => openBetaFeedbackWidget('floating_button')}
        aria-label="Send feedback"
      >
        <MessageSquare size={18} aria-hidden="true" />
        <span>Feedback</span>
      </button>

      {isOpen && (
        <div className="feedback-panel-backdrop" data-beta-feedback-ui>
          <div className="feedback-panel">
            <div className="feedback-panel-header">
              <div>
                <p className="feedback-eyebrow">Corvioz Beta</p>
                <h2>Send feedback</h2>
              </div>
              <button type="button" className="feedback-icon-button" onClick={() => setIsOpen(false)} aria-label="Close feedback">
                <X size={18} />
              </button>
            </div>

            {isSuccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 0', gap: '16px' }}>
                <CheckCircle2 size={48} style={{ color: 'var(--success)' }} />
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Thank you. Your feedback helps improve Corvioz.
                </p>
                <button
                  type="button"
                  className="feedback-submit-button"
                  style={{ marginTop: '8px' }}
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="feedback-label" htmlFor="feedback-category" style={{ display: 'block', marginBottom: '6px' }}>Category</label>
                  <select
                    id="feedback-category"
                    className="feedback-input"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    required
                    style={{ width: '100%', outline: 'none' }}
                  >
                    <option value="Proposal">Proposal</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Pricing">Pricing</option>
                    <option value="Client Portal">Client Portal</option>
                    <option value="Dashboard">Dashboard</option>
                    <option value="AI">AI</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Bug">Bug</option>
                  </select>
                </div>

                <div>
                  <label className="feedback-label" htmlFor="feedback-message" style={{ display: 'block', marginBottom: '6px' }}>Message</label>
                  <textarea
                    id="feedback-message"
                    className="feedback-textarea"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Tell us what felt confusing, broken, or useful."
                    rows={5}
                    required
                    style={{ width: '100%', outline: 'none' }}
                  />
                </div>

                <div>
                  <label className="feedback-label" htmlFor="feedback-email" style={{ display: 'block', marginBottom: '6px' }}>Email (optional)</label>
                  <input
                    id="feedback-email"
                    className="feedback-input"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    style={{ width: '100%', outline: 'none' }}
                  />
                </div>

                {status && (
                  <p className="feedback-status" style={{ color: 'var(--danger)', margin: 0 }}>
                    {status}
                  </p>
                )}

                <button type="submit" className="feedback-submit-button" disabled={isSubmitting || !message.trim()} style={{ width: '100%', marginTop: '4px' }}>
                  <Send size={16} />
                  {isSubmitting ? 'Sending...' : 'Send feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
