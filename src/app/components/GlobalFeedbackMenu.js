'use client';

import React, { useState } from 'react';

export default function GlobalFeedbackMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeForm, setActiveForm] = useState(null); // 'feature', 'issue', 'founder'
  const [inputText, setInputText] = useState('');
  const [emailText, setEmailText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission lag for high-fidelity SaaS experience
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setInputText('');
      setEmailText('');
      
      // Save locally to simulate ingestion
      const feedbackLogs = JSON.parse(localStorage.getItem('feedback_logs') || '[]');
      feedbackLogs.push({
        type: activeForm,
        input: inputText,
        email: emailText,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('feedback_logs', JSON.stringify(feedbackLogs));

      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveForm(null);
      }, 2000);
    }, 1200);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setActiveForm(null);
  };

  return (
    <>
      {/* Self-contained styling variables and animation frames */}
      <style>{`
        .feedback-trigger {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(13, 15, 23, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #8e939e;
          padding: 10px 14px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .feedback-trigger:hover {
          color: #f3f4f6;
          border-color: rgba(255, 255, 255, 0.16);
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.7);
        }
        .feedback-popover {
          position: fixed;
          bottom: 76px;
          right: 24px;
          z-index: 9999;
          width: 320px;
          background: #0d0f17;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.8);
          padding: 20px;
          color: #f3f4f6;
        }
        .feedback-option-btn {
          width: 100%;
          text-align: left;
          padding: 10px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #8e939e;
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid rgba(255, 255, 255, 0.03);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .feedback-option-btn:hover {
          color: #f3f4f6;
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
        }
      `}</style>

      {/* Floating launcher trigger button */}
      <button onClick={() => setIsOpen(!isOpen)} className="feedback-trigger no-print" aria-label="Feedback system launcher">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Feedback & Support</span>
      </button>

      {/* Popover container */}
      {isOpen && (
        <div className="feedback-popover animate-fade-in no-print">
          
          {/* Header panel */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }}></span>
              OS Assistance Desk
            </span>
            <button 
              onClick={closeMenu} 
              style={{ color: '#8e939e', cursor: 'pointer', fontSize: '1rem', background: 'none', border: 'none' }}
            >
              &times;
            </button>
          </div>

          {/* Form rendering selection */}
          {!activeForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => setActiveForm('feature')} className="feedback-option-btn">
                <span>💡 Request Feature</span>
                <span>➔</span>
              </button>
              <button onClick={() => setActiveForm('issue')} className="feedback-option-btn">
                <span>⚠️ Report Issue</span>
                <span>➔</span>
              </button>
              <button onClick={() => setActiveForm('founder')} className="feedback-option-btn">
                <span>✉️ Contact Founder</span>
                <span>➔</span>
              </button>
            </div>
          ) : (
            <div>
              {/* Back button */}
              <button 
                onClick={() => { setActiveForm(null); setSubmitSuccess(false); }}
                style={{ fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '12px', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                ← Back to options
              </button>

              {submitSuccess ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3" style={{ margin: '0 auto 10px auto' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Submitted Successfully</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Thank you for building with us.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {activeForm === 'founder' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Your Work Email</label>
                      <input 
                        type="email" 
                        value={emailText} 
                        onChange={e => setEmailText(e.target.value)}
                        placeholder="you@company.com" 
                        required 
                        style={{ width: '100%', padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', fontSize: '0.75rem', color: '#f3f4f6' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {activeForm === 'feature' ? 'Feature Specification' : activeForm === 'issue' ? 'Issue description & repro' : 'Brief message'}
                    </label>
                    <textarea 
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      placeholder={activeForm === 'feature' ? 'Describe the features and why you need them...' : activeForm === 'issue' ? 'What happened? Detail the steps to reproduce...' : 'Write your question or proposal details...'}
                      required
                      style={{ width: '100%', minHeight: '80px', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', fontSize: '0.75rem', color: '#f3f4f6', resize: 'none', lineHeight: '1.4' }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="btn btn-primary btn-sm" 
                    style={{ width: '100%', padding: '8px', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    {isSubmitting ? 'Sending details...' : 'Submit Request'}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      )}
    </>
  );
}
