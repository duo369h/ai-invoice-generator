import React from 'react';

export default function ScopeClaritySection() {
  return (
    <section id="how-corvioz-works" className="scope-clarity-section" data-home-block="scope-clarity-ledger" data-variant="ledger-r8">
      <div className="scope-clarity-container">
        <div className="scope-clarity-grid">
          <div className="scope-clarity-copy">
            <span className="scope-clarity-eyebrow">SCOPE BEFORE APPROVAL</span>
            <h2 className="scope-clarity-headline">Make what's included clear before work begins.</h2>
            <p className="scope-clarity-body">
              Structure scope, deliverables, usage rights, and payment terms in one quote clients can review before approving.
            </p>
          </div>
          <div className="scope-clarity-visual">
            <article className="quote-document-paper" aria-label="Example structured quote">
              <div className="document-meta-header">
                <div className="meta-row-1">
                  <span className="doc-label">QUOTE</span>
                  <span className="doc-divider">•</span>
                  <span className="doc-id">Q-2048</span>
                </div>
                <div className="meta-row-2">
                  <span className="status-lbl">STATUS</span>
                  <span className="doc-status-val">Ready for client review</span>
                </div>
              </div>
              <div className="document-project-header">
                <div className="project-titles">
                  <h3 className="project-name">Northline Brand Campaign</h3>
                  <span className="client-name">Prepared for: Northline Studio</span>
                </div>
                <div className="project-total-box">
                  <span className="total-label">Project total</span>
                  <span className="total-amount">$4,800</span>
                </div>
              </div>
              <div className="document-sections-grid">
                <div className="doc-section">
                  <span className="section-title">Scope</span>
                  <div className="scope-grid">
                    <div><span className="s-lbl">Shoot day</span><span className="s-val">1</span></div>
                    <div><span className="s-lbl">Setups</span><span className="s-val">3</span></div>
                    <div><span className="s-lbl">Final images</span><span className="s-val">12</span></div>
                  </div>
                </div>
                <div className="doc-section">
                  <span className="section-title">Deliverables</span>
                  <div className="deliverables-rows">
                    <div className="del-row"><span>12 retouched high-resolution images</span></div>
                    <div className="del-row"><span>Web-ready exports</span></div>
                  </div>
                </div>
                <div className="doc-section">
                  <span className="section-title">Usage rights</span>
                  <div className="usage-grid">
                    <div className="u-item"><span className="u-lbl">Channels</span><span className="u-val">Brand website and organic social</span></div>
                    <div className="u-item"><span className="u-lbl">Term</span><span className="u-val">12 months</span></div>
                    <div className="u-item"><span className="u-lbl">Territory</span><span className="u-val">North America</span></div>
                  </div>
                </div>
                <div className="doc-section">
                  <span className="section-title">Payment terms</span>
                  <div className="terms-grid">
                    <div className="t-row"><span>50% to reserve the shoot</span><strong>$2,400</strong></div>
                    <div className="t-row"><span>50% before final delivery</span><strong>$2,400</strong></div>
                  </div>
                </div>
                <div className="doc-section section-not-included">
                  <span className="section-title">Not included</span>
                  <div className="not-inc-rows">
                    <span>RAW files</span>
                    <span>Paid media usage</span>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
