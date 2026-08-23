'use client';

import { useEffect, useRef } from 'react';
import { initHowItWorksMotion } from './how-it-works-motion';

const AUTHORITY_BODY_MARKUP = String.raw`
<header class="hiw-hero">
    <div class="hero-eyebrow">How It Works</div>
    <h1 class="hiw-hero-title">From the first quote to what comes next.</h1>
    <p class="hiw-hero-lead">
      Client work rarely happens in one clean step. A conversation becomes something concrete. The client has their part. The work gets done. Then there is another business step to take.
      <br><br>
      <strong>Corvioz helps keep those moments connected.</strong>
    </p>
    <div class="hero-actions">
      <a href="/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote" class="btn-primary-cta">Create Quote</a>
      <a href="/pricing" class="btn-secondary-cta">View Pricing</a>
    </div>

    <!-- Hero Flow Diagram Summary -->
    <div class="hero-story-preview" id="heroStoryPreview">
      <div class="hero-preview-node">
        <span class="preview-step-num">Creator</span>
        <span class="preview-step-label">Quote Draft</span>
        <span class="preview-step-sub">Spring Campaign · $4,800</span>
      </div>
      <div class="hero-preview-arrow">&rarr;</div>
      <div class="hero-preview-node client-node">
        <span class="preview-step-num">Client Handoff</span>
        <span class="preview-step-label">Client Review</span>
        <span class="preview-step-sub">Pro Portal · North &amp; Co.</span>
      </div>
      <div class="hero-preview-arrow">&rarr;</div>
      <div class="hero-preview-node real-work-node">
        <span class="preview-step-num">Real Work</span>
        <span class="preview-step-label">Execution</span>
        <span class="preview-step-sub">Outside software</span>
      </div>
      <div class="hero-preview-arrow">&rarr;</div>
      <div class="hero-preview-node">
        <span class="preview-step-num">Return</span>
        <span class="preview-step-label">Invoice &amp; Status</span>
        <span class="preview-step-sub">Ready when you return</span>
      </div>
    </div>
  </header>

  <!-- MAIN STORYLINE CONTAINER -->
  <main class="story-container" id="storyContainer">

    <!-- Ownership Legend Sticky Header (Desktop) -->
    <div class="handoff-track-header" id="handoffTrackHeader" aria-hidden="true">
      <div class="track-pill track-you is-highlighted" id="trackPillYou">
        <div class="track-indicator"></div>
        <div>
          <span class="track-name">Your Side · Creator Workspace</span>
          <span class="track-sub">Scope, pricing, document control</span>
        </div>
      </div>
      <div class="track-pill track-client" id="trackPillClient">
        <div class="track-indicator"></div>
        <div>
          <span class="track-name">Client Side · North &amp; Co.</span>
          <span class="track-sub">Review, participation &amp; response</span>
        </div>
      </div>
    </div>

    <!-- STAGE 01: CREATE -->
    <section class="story-stage" id="stage-create" data-stage="1" data-owner="you">
      <div class="stage-thread-node" aria-hidden="true">
        <span class="node-dot"></span>
        <span class="node-num">01</span>
        <div class="stage-connector-segment seg-create" id="seg-01"><div class="segment-progress"></div></div>
      </div>

      <div class="stage-narrative">
        <div class="stage-badge">01 &mdash; Create</div>
        <h2 class="stage-title">Give the work a starting point.</h2>
        <p class="stage-desc">
          A client conversation can stay loose for a while. The quote is where it begins to become something both you and the client can see.
        </p>
        <div class="stage-annotations">
          <span class="annotation-tag">Clean Itemized Scope</span>
          <span class="annotation-tag">Commercial Licensing</span>
          <span class="annotation-tag">Payment Terms</span>
        </div>
      </div>

      <div class="stage-visual">
        <div class="stage-artifact-card" id="card-stage-01">
          <div class="artifact-header">
            <span class="artifact-context-badge"><svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg> Your Workspace</span>
            <span class="artifact-status-pill status-draft-transition" id="statusPillCreate">
              <span class="state-pill-draft">Draft</span>
              <span class="state-pill-ready">Ready for review</span>
            </span>
          </div>
          <div class="artifact-body">
            <div class="doc-meta-row">
              <div>
                <div class="doc-project-title">Spring Campaign 2026</div>
                <div class="doc-client-subtitle">Client: North &amp; Co. · Quote #1042</div>
              </div>
              <div class="text-right">
                <div class="doc-amount">$4,800</div>
                <div class="doc-meta-sub">Payment terms recorded</div>
              </div>
            </div>
            <table class="doc-items-table">
              <thead>
                <tr>
                  <th>Scope Item</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Principal Photography (2 Production Days)</td>
                  <td class="text-right font-medium">$3,200</td>
                </tr>
                <tr>
                  <td>Commercial Usage License (12-Mo Digital)</td>
                  <td class="text-right font-medium">$1,600</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- STAGE 02: SHARE / HANDOFF -->
    <section class="story-stage-reversed" id="stage-share" data-stage="2" data-owner="handoff">
      <div class="stage-thread-node" aria-hidden="true">
        <span class="node-dot"></span>
        <span class="node-num">02</span>
        <div class="stage-connector-segment seg-handoff" id="seg-02"><div class="segment-progress"></div></div>
      </div>

      <div class="stage-narrative">
        <div class="stage-badge stage-badge-client">02 &mdash; Share</div>
        <h2 class="stage-title">Let it leave your side.</h2>
        <p class="stage-desc">
          When the quote is ready, put it in front of your client. What was only on your side is now something they can review.
        </p>
        <div class="stage-annotations">
          <span class="annotation-tag">Shared for review</span>
          <span class="annotation-tag">North &amp; Co.</span>
          <span class="annotation-tag">Client Review</span>
        </div>
      </div>

      <div class="stage-visual">
        <div class="stage-artifact-card handoff-artifact-card" id="card-stage-02">
          <div class="artifact-header">
            <span class="artifact-context-badge context-client"><svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Shared for review</span>
            <div class="handoff-direction-pill" id="handoffDirectionPill">
              <span class="pill-origin">YOU</span>
              <span class="pill-arrow"><svg class="ui-icon-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
              <span class="pill-dest">CLIENT</span>
            </div>
          </div>
          <div class="artifact-body">
            <div class="handoff-bridge-card">
              <div class="handoff-icon-wrap"><svg class="ui-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div>
              <div class="handoff-bridge-title">Ready for Client Consideration</div>
              <div class="handoff-bridge-sub">
                Shared for review &middot; North &amp; Co.
              </div>
              <div class="handoff-meta-tags">
                <span class="meta-tag">Quote #1042</span>
                <span class="meta-tag">$4,800 Total</span>
                <span class="meta-tag">Scope included</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- STAGE 03: RESPOND -->
    <section class="story-stage" id="stage-respond" data-stage="3" data-owner="client">
      <div class="stage-thread-node" aria-hidden="true">
        <span class="node-dot"></span>
        <span class="node-num">03</span>
        <div class="stage-connector-segment seg-client" id="seg-03"><div class="segment-progress"></div></div>
      </div>

      <div class="stage-narrative">
        <div class="stage-badge stage-badge-client">03 &mdash; Respond</div>
        <h2 class="stage-title">Give the client their moment.</h2>
        <p class="stage-desc">
          Not every part of the job needs the client. This one does. They review the quote and respond to the work in front of them.
        </p>
        <div class="stage-annotations">
          <span class="annotation-tag">Client Portal &mdash; Pro</span>
          <span class="annotation-tag">Client Approval &mdash; Pro only</span>
          <span class="annotation-tag">Quotes only</span>
        </div>
      </div>

      <div class="stage-visual">
        <div class="stage-artifact-card client-portal-card" id="card-stage-03">
          <div class="artifact-header">
            <span class="artifact-context-badge context-client"><svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg> Client Portal &mdash; Pro</span>
            <span class="artifact-status-pill status-portal-transition" id="statusPillRespond">
              <span class="state-pill-reviewing"><svg class="ui-icon-sm" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Reviewing</span>
              <span class="state-pill-approved"><svg class="ui-icon-sm" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Approved</span>
            </span>
          </div>
          <div class="artifact-body">
            <div class="doc-meta-row">
              <div>
                <div class="doc-project-title">North &amp; Co. Client Review</div>
                <div class="doc-client-subtitle">Spring Campaign 2026 · Quote #1042</div>
              </div>
              <div class="text-right">
                <div class="doc-amount">$4,800</div>
                <div class="doc-meta-sub" id="clientScopeStatusSub">
                  <span class="sub-pending">Pending Review</span>
                  <span class="sub-approved">Scope Approved</span>
                </div>
              </div>
            </div>

            <div class="client-response-container">
              <div class="client-action-box" id="clientActionBox">
                <div class="client-action-status">
                  <span class="client-action-label">Client Decision Status</span>
                  <span class="client-action-sub" id="clientActionSub">
                    <span class="sub-text-awaiting">Awaiting review from North &amp; Co.</span>
                    <span class="sub-text-confirmed">Confirmed by North &amp; Co.</span>
                  </span>
                </div>
                <div class="badge-client-decision-flow" id="badgeClientDecision">
                  <span class="badge-reviewing-pill"><svg class="ui-icon-sm" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Reviewing</span>
                  <span class="badge-client-approved"><svg class="ui-icon-sm" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Approved</span>
                </div>
              </div>
              <p class="client-response-note" id="clientResponseNote">
                <span class="note-reviewing">Review in progress &bull; Quotes only</span>
                <span class="note-approved">Approved by client</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- NARRATIVE BRIDGE: REAL WORK HAPPENS (QUIET BREAK) -->
    <section class="narrative-bridge" id="bridge-execution" data-stage="bridge">
      <div class="bridge-thread-pause" aria-hidden="true">
        <span class="pause-indicator"></span>
      </div>
      <div class="bridge-inner">
        <span class="bridge-tag">Outside Software</span>
        <h2 class="bridge-title">Then the work happens.</h2>
        <p class="bridge-desc">
          You go and do the work you were hired to do.
        </p>
      </div>
    </section>

    <!-- STAGE 04: FORWARD / INVOICE RE-ENTRY -->
    <section class="story-stage-reversed" id="stage-forward" data-stage="4" data-owner="you">
      <div class="stage-thread-node" aria-hidden="true">
        <span class="node-dot"></span>
        <span class="node-num">04</span>
        <div class="stage-connector-segment seg-invoice" id="seg-04"><div class="segment-progress"></div></div>
      </div>

      <div class="stage-narrative">
        <div class="stage-badge">04 &mdash; Forward</div>
        <h2 class="stage-title">Pick up the business thread again.</h2>
        <p class="stage-desc">
          When the next business step arrives, continue with the invoice you need.
        </p>
      </div>

      <div class="stage-visual">
        <div class="stage-artifact-card" id="card-stage-04">
          <div class="artifact-header">
            <span class="artifact-context-badge"><svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg> Your Workspace</span>
            <span class="artifact-status-pill status-sent">Invoice</span>
          </div>
          <div class="artifact-body">
            <div class="doc-lineage-badge">
              Spring Campaign &mdash; North &amp; Co.
            </div>
            <div class="doc-meta-row">
              <div>
                <div class="doc-project-title">Invoice #INV-2042</div>
                <div class="doc-client-subtitle">Client: North &amp; Co. · Deliverables Complete</div>
              </div>
              <div class="text-right">
                <div class="doc-amount">$4,800</div>
                <div class="doc-meta-sub">Due on Receipt</div>
              </div>
            </div>
            <table class="doc-items-table">
              <thead>
                <tr>
                  <th>Completed Deliverable</th>
                  <th class="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Spring Campaign Assets (Full License Scope)</td>
                  <td class="text-right font-medium">$4,800</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- STAGE 05: KEEP TRACK -->
    <section class="story-stage" id="stage-track" data-stage="5" data-owner="you">
      <div class="stage-thread-node" aria-hidden="true">
        <span class="node-dot"></span>
        <span class="node-num">05</span>
      </div>

      <div class="stage-narrative">
        <div class="stage-badge">05 &mdash; Keep Track</div>
        <h2 class="stage-title">Keep the thread visible.</h2>
        <p class="stage-desc">
          Keep an eye on where the documents stand and the payment status you have recorded.
        </p>
        <div class="stage-annotations">
          <span class="annotation-tag">Recorded Payment Status</span>
        </div>
      </div>

      <div class="stage-visual">
        <div class="context-ledger-card" id="card-stage-05">
          <div class="ledger-header-row">
            <div>
              <div class="ledger-project-name">North &amp; Co. · Spring Campaign 2026</div>
              <div class="ledger-project-sub">Quotes & Invoices</div>
            </div>
            <span class="thread-active-pill">Workflow Summary</span>
          </div>
          <div class="ledger-doc-list">
            <div class="ledger-item" id="ledgerItemQuote">
              <div class="doc-icon-sq"><svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg></div>
              <div class="doc-info-block">
                <span class="ledger-doc-title">Quote #1042</span>
                <span class="ledger-doc-meta">$4,800 &middot; Approved by North &amp; Co.</span>
              </div>
              <span class="badge-approved-status">Approved</span>
            </div>
            <div class="ledger-item" id="ledgerItemInvoice">
              <div class="doc-icon-sq icon-inv"><svg class="ui-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><path d="M16 8H8"/><path d="M16 12H8"/><path d="M10 16H8"/></svg></div>
              <div class="doc-info-block">
                <span class="ledger-doc-title">Invoice #INV-2042</span>
                <span class="ledger-doc-meta">$4,800 &middot; Recorded: Paid</span>
              </div>
              <span class="badge-paid-status">Recorded: Paid</span>
            </div>
          </div>
        </div>
      </div>
    </section>

  </main>

  <!-- WORKFLOW TAKEAWAY -->
  <section class="takeaway-section">
    <div class="takeaway-card">
      <div class="takeaway-eyebrow">Workflow Takeaway</div>
      <h2 class="takeaway-title">The work stays yours.</h2>
      <p class="takeaway-desc">
        Your client has their part. You decide what moves forward. Corvioz helps keep the important moments connected.
      </p>

    </div>
  </section>

  <!-- FINAL CTA SECTION -->
  <section class="final-cta-section">
    <h2 class="final-cta-title">Start with the first quote.</h2>
    <p class="final-cta-desc">
      You don’t need to map the whole job before you begin. Start with the first thing that needs to be clear.
    </p>
    <div class="final-cta-buttons">
      <a href="/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote" class="btn-primary-cta">Create Quote</a>
      <a href="/pricing" class="btn-secondary-cta">View Pricing</a>
    </div>
  </section>
`;

export default function HowItWorksBody() {
  const rootRef = useRef(null);

  useEffect(() => {
    if (!rootRef.current) return undefined;
    return initHowItWorksMotion(rootRef.current);
  }, []);

  return (
    <div ref={rootRef} className="how-it-works-body" dangerouslySetInnerHTML={{ __html: AUTHORITY_BODY_MARKUP }} />
  );
}
