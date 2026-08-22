'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const AUTOPLAY_INTERVAL_MS = 1250;

const WORKFLOW_STAGES = [
  {
    id: 1,
    label: 'Quote Sent',
    description: 'The quote is with your client for review.',
    sidebarLabel: 'Quote #Q-2026-084',
    stageName: 'STAGE 1: QUOTE SENT',
    badgeClass: 'badge-stage-1',
    statusText: 'Quote Sent',
    docTitle: 'Commercial Photography Quote #Q-2026-084',
    docSub: 'Prepared for Maya Chen / Northline Studio • Sent Aug 10, 2026',
    note: 'Quote delivered to client for review',
    total: '$4,800.00',
    showConvertBtn: false,
    mobileSummary: {
      type: 'Quote',
      id: 'Q-2026-084',
      context: 'Northline Studio',
      status: 'Quote Sent',
    },
    items: [
      {
        desc: 'Commercial Photo Shoot (Full Day Directing & Crew)',
        qty: '1',
        rate: '$2,400.00',
        amount: '$2,400.00',
      },
      {
        desc: 'High-Res Digital Licensing (2-Year Rights)',
        qty: '1',
        rate: '$1,600.00',
        amount: '$1,600.00',
      },
      {
        desc: 'Color Grading & Retouching (20 Selected Master Assets)',
        qty: '1',
        rate: '$800.00',
        amount: '$800.00',
      },
    ],
  },
  {
    id: 2,
    label: 'Client Approved',
    description: 'Once the client approves it, keep that decision connected to the next step.',
    sidebarLabel: 'Approved Baseline',
    stageName: 'STAGE 2: CLIENT APPROVED',
    badgeClass: 'badge-stage-2',
    statusText: 'Client Approved',
    docTitle: 'Quote #Q-2026-084',
    docSub: 'Approved by Northline Studio • Active Working Reference',
    note: 'Client approval recorded • Scope locked as working baseline',
    total: '$4,800.00',
    showConvertBtn: false,
    mobileSummary: {
      type: 'Quote',
      id: 'Q-2026-084',
      context: 'Northline Studio',
      status: 'Client Approved',
    },
    items: [
      {
        desc: 'Commercial Photo Shoot (Full Day Directing & Crew)',
        qty: '1',
        rate: '$2,400.00',
        amount: '$2,400.00',
      },
      {
        desc: 'High-Res Digital Licensing (2-Year Rights)',
        qty: '1',
        rate: '$1,600.00',
        amount: '$1,600.00',
      },
      {
        desc: 'Color Grading & Retouching (20 Selected Master Assets)',
        qty: '1',
        rate: '$800.00',
        amount: '$800.00',
      },
    ],
  },
  {
    id: 3,
    label: 'Ready to Invoice',
    description: 'When it is time to invoice, convert the approved quote into an invoice.',
    sidebarLabel: 'Ready to Invoice',
    stageName: 'STAGE 3: READY TO INVOICE',
    badgeClass: 'badge-stage-3',
    statusText: 'Ready to Invoice',
    docTitle: 'Approved Scope #Q-2026-084',
    docSub: 'Northline Studio • Ready for Invoicing Milestone',
    note: 'Agreed scope reached invoicing milestone',
    total: '$4,800.00',
    showConvertBtn: true,
    mobileSummary: {
      type: 'Approved Scope',
      id: 'Q-2026-084',
      context: 'Northline Studio',
      status: 'Ready to Invoice',
    },
    items: [
      {
        desc: 'Commercial Photo Shoot (Full Day Directing & Crew)',
        qty: '1',
        rate: '$2,400.00',
        amount: '$2,400.00',
      },
      {
        desc: 'High-Res Digital Licensing & Post-Processing',
        qty: '1',
        rate: '$2,400.00',
        amount: '$2,400.00',
      },
    ],
  },
  {
    id: 4,
    label: 'Payment Recorded',
    description: 'Record payment status and keep the history with the client.',
    sidebarLabel: 'Payment History',
    stageName: 'STAGE 4: PAYMENT RECORDED',
    badgeClass: 'badge-stage-4',
    statusText: 'Payment Recorded',
    docTitle: 'Project Record #INV-2026-084',
    docSub: 'Northline Studio • Client History Record',
    note: 'Payment status recorded in client history',
    total: '$4,800.00',
    showConvertBtn: false,
    mobileSummary: {
      type: 'Project Record',
      id: 'INV-2026-084',
      context: 'Northline Studio',
      status: 'Payment Recorded',
    },
    items: [
      {
        desc: 'Commercial Photo Shoot & Production Service',
        qty: '1',
        rate: '$2,400.00',
        amount: '$2,400.00',
      },
      {
        desc: 'Image Licensing & Post-Processing Deliverables',
        qty: '1',
        rate: '$2,400.00',
        amount: '$2,400.00',
      },
    ],
  },
];

function InformationIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export default function HomeWorkflow() {
  const [activeStage, setActiveStage] = useState(1);
  const sectionRef = useRef(null);
  const stageButtonRefs = useRef([]);
  const autoplayTimerRef = useRef(null);
  const autoplayConsumedRef = useRef(false);
  const autoplayDisabledRef = useRef(false);
  const hasUserInteractedRef = useRef(false);
  const reducedMotionRef = useRef(false);

  const clearAutoplayTimer = useCallback(() => {
    if (autoplayTimerRef.current !== null) {
      window.clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  const inspectStage = useCallback((stageId) => {
    hasUserInteractedRef.current = true;
    autoplayDisabledRef.current = true;
    clearAutoplayTimer();
    setActiveStage(stageId);
  }, [clearAutoplayTimer]);

  useEffect(() => {
    let isEffectActive = true;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = mediaQuery.matches;
    autoplayDisabledRef.current = mediaQuery.matches;

    const observer = new IntersectionObserver((entries) => {
      if (!isEffectActive) return;

      const enteredViewport = entries.some(
        (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.30,
      );

      if (!enteredViewport || autoplayConsumedRef.current || autoplayDisabledRef.current) {
        return;
      }

      autoplayConsumedRef.current = true;
      observer.disconnect();

      let nextStage = 1;
      autoplayTimerRef.current = window.setInterval(() => {
        if (!isEffectActive) {
          clearAutoplayTimer();
          return;
        }

        if (
          hasUserInteractedRef.current
          || autoplayDisabledRef.current
          || reducedMotionRef.current
        ) {
          clearAutoplayTimer();
          return;
        }

        nextStage += 1;
        setActiveStage(nextStage);

        if (nextStage === WORKFLOW_STAGES.length) {
          clearAutoplayTimer();
        }
      }, AUTOPLAY_INTERVAL_MS);
    }, { threshold: 0.30 });

    const handleMotionPreferenceChange = (event) => {
      if (!isEffectActive) return;

      reducedMotionRef.current = event.matches;

      if (event.matches) {
        autoplayDisabledRef.current = true;
        clearAutoplayTimer();
        observer.disconnect();
      }
    };

    mediaQuery.addEventListener('change', handleMotionPreferenceChange);

    if (!mediaQuery.matches && sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      isEffectActive = false;
      clearAutoplayTimer();
      observer.disconnect();
      mediaQuery.removeEventListener('change', handleMotionPreferenceChange);
    };
  }, [clearAutoplayTimer]);

  const handleStageKeyDown = (event, stageId) => {
    let adjacentStage = null;

    if (event.key === 'ArrowLeft' && stageId > 1) {
      adjacentStage = stageId - 1;
    } else if (event.key === 'ArrowRight' && stageId < WORKFLOW_STAGES.length) {
      adjacentStage = stageId + 1;
    }

    if (adjacentStage === null) return;

    event.preventDefault();
    stageButtonRefs.current[adjacentStage - 1]?.focus();
    inspectStage(adjacentStage);
  };

  const currentStage = WORKFLOW_STAGES[activeStage - 1];
  const railFill = ((activeStage - 1) / (WORKFLOW_STAGES.length - 1)) * 100;

  return (
    <section ref={sectionRef} className="section-how-wrapper" id="how-corvioz-works">
      <div className="section-container">
        <div className="section-header">
          <div className="section-kicker">How Corvioz Works</div>
          <h2 className="section-title">Keep the path from quote to payment clear.</h2>
          <p className="section-intro">
            Corvioz helps independent professionals keep quotes, invoices, client records, and payment status connected as work moves forward.
          </p>
        </div>

        <div className="workflow-unified-surface">
          <div className="workflow-track-container" id="client-journey">
            <div className="workflow-rail-line">
              <div
                className="workflow-rail-fill"
                id="track-rail-fill"
                style={{ width: `${railFill}%` }}
              />
            </div>

            <div className="workflow-nodes-grid" role="group" aria-label="Corvioz 4 Workflow Stages">
              {WORKFLOW_STAGES.map((stage, index) => {
                const isActive = stage.id === activeStage;
                const isCompleted = stage.id < activeStage;
                const stateClass = isActive ? ' active' : (isCompleted ? ' completed' : '');

                return (
                  <button
                    key={stage.id}
                    ref={(element) => {
                      stageButtonRefs.current[index] = element;
                    }}
                    className={`workflow-stage-node-item${stateClass}`}
                    data-stage={stage.id}
                    id={`stage-node-${stage.id}`}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => inspectStage(stage.id)}
                    onKeyDown={(event) => handleStageKeyDown(event, stage.id)}
                  >
                    <span className="node-circle">{String(stage.id).padStart(2, '0')}</span>
                    <strong className="stage-label-name">{stage.label}</strong>
                    <span className="stage-label-desc">{stage.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="product-evidence-card" id="features">
            <div className="preview-topbar">
              <div className="window-dots" aria-hidden="true">
                <span className="dot-red" />
                <span className="dot-yellow" />
                <span className="dot-green" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>PROJECT: Northline Studio Commercial Shoot</span>
                <span className={`preview-meta-stage ${currentStage.badgeClass}`} id="preview-meta-pill">
                  {currentStage.stageName}
                </span>
              </div>
            </div>

            <div className="preview-body-layout">
              <div className="preview-sidebar">
                <div className="sidebar-label">Workflow Context</div>
                {WORKFLOW_STAGES.map((stage) => (
                  <div
                    key={stage.id}
                    className={`sidebar-item${stage.id === activeStage ? ' active' : ''}`}
                    id={`sb-item-${stage.id}`}
                  >
                    {stage.sidebarLabel}
                  </div>
                ))}
              </div>

              <div className="preview-main-document">
                <div className="doc-header-flex">
                  <div>
                    <div className="doc-title" id="doc-title-text">{currentStage.docTitle}</div>
                    <div className="doc-subtitle" id="doc-sub-text">{currentStage.docSub}</div>
                  </div>
                  <div
                    className={`doc-status-pill ${currentStage.badgeClass}`}
                    id="doc-status-badge"
                  >
                    {currentStage.statusText}
                  </div>
                </div>

                <div className="mobile-document-summary" aria-label="Current document summary">
                  <span className="mobile-document-type" id="mobile-doc-type">
                    {currentStage.mobileSummary.type}
                  </span>
                  <strong className="mobile-document-id" id="mobile-doc-id">
                    {currentStage.mobileSummary.id}
                  </strong>
                  <strong className="mobile-document-total" id="mobile-doc-total">
                    {currentStage.total}
                  </strong>
                  <span className="mobile-document-context" id="mobile-doc-context">
                    {currentStage.mobileSummary.context}
                  </span>
                  <span className="mobile-document-status" id="mobile-doc-status">
                    {currentStage.mobileSummary.status}
                  </span>
                </div>

                <table className="doc-table">
                  <thead>
                    <tr>
                      <th>Deliverable / Scope Description</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Rate</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody id="doc-items-tbody">
                    {currentStage.items.map((item) => (
                      <tr key={item.desc}>
                        <td>{item.desc}</td>
                        <td style={{ textAlign: 'center' }}>{item.qty}</td>
                        <td style={{ textAlign: 'right' }}>{item.rate}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="doc-footer-flex">
                  <div className="doc-footer-note" id="doc-footer-note">
                    <InformationIcon />
                    {currentStage.note}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="doc-total-val" id="doc-total-val">{currentStage.total}</div>
                    <div id="convert-affordance-slot">
                      {currentStage.showConvertBtn && (
                        <span className="btn-convert-affordance">Convert to Invoice →</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
