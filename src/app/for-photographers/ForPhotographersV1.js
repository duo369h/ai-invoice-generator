'use client';

import { useEffect, useRef } from 'react';
import PublicHeader from '../components/PublicHeader';

const markup = String.raw`
  <main id="mainContent">
  <!-- HERO MODULE (HERO V2.1 — FINAL FIRST-GLANCE CRAFT PASS) -->
  <section class="sec-hero" id="sec-hero">
    <!-- ARCHITECTURAL STRUCTURAL COMPOSITION FIELD -->
    <div class="hero-drafting-field" id="heroDraftingField" aria-hidden="true">
      <div class="drafting-artifact-grid"></div>
      <div class="drafting-anchor-line anchor-top-datum"></div>
      <div class="drafting-anchor-line anchor-scope-datum"></div>
      <div class="drafting-anchor-line anchor-artifact-axis"></div>
      <div class="drafting-anchor-line anchor-bottom-datum"></div>
    </div>

    <div class="container hero-layout">
      <!-- LEFT: HERO STATEMENT & CTA -->
      <div class="hero-copy-col" id="heroCopyCol">
        <!-- EDITORIAL NOTATION -->
        <div class="hero-eyebrow-wrapper hero-copy-item" id="heroEyebrow">
          <span class="hero-eyebrow-rule" aria-hidden="true"></span>
          <span class="hero-eyebrow-label">For independent photographers</span>
        </div>

        <h1 class="hero-title hero-copy-item" id="heroTitle">Keep the scope clear before the shoot starts.</h1>

        <div class="hero-body hero-copy-item" id="heroBody">
          <p>A few product shots can become twelve products, three setups, retouching, usage, and a deadline.</p>
          <p>Corvioz helps you turn that conversation into a quote your client can understand — and a project you can keep moving forward.</p>
        </div>

        <div class="hero-cta-group hero-copy-item" id="heroCtaGroup">
          <a href="/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote" class="btn-primary">Create Quote</a>
          <a href="#sec-workflow" class="link-secondary-scroll" id="linkSecondary">
            <span>See how it works</span>
            <svg class="link-arrow-svg" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3V13M8 13L13 8M8 13L3 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- RIGHT: WORKING QUOTE ARTIFACT -->
      <div class="hero-ui-col" id="heroUiCol">
        <div class="working-quote-artifact" id="quoteArtifact">
          <!-- DOCUMENT HEADER BAR -->
          <div class="artifact-doc-header" id="artifactHeader">
            <div class="artifact-title-group">
              <span class="artifact-project-name">SPRING PRODUCT CAMPAIGN</span>
              <span class="artifact-client-name">Acme Studio</span>
            </div>
            <span class="artifact-status-tag" id="artifactStatusTag">Draft</span>
          </div>

          <!-- PRIMARY SCOPE SPECIFICATION ROW (CENTRAL HERO PRODUCT MESSAGE) -->
          <div class="artifact-scope-summary" id="artifactScopeSummary">
            <div class="scope-spec-grid">
              <div class="scope-spec-item">
                <span class="spec-num">12</span>
                <span class="spec-label">Products</span>
              </div>
              <div class="scope-spec-divider" aria-hidden="true"></div>
              <div class="scope-spec-item">
                <span class="spec-num">3</span>
                <span class="spec-label">Setups</span>
              </div>
              <div class="scope-spec-divider" aria-hidden="true"></div>
              <div class="scope-spec-item">
                <span class="spec-num">1</span>
                <span class="spec-label">Shoot Day</span>
              </div>
            </div>
            <!-- STRUCTURAL RESOLUTION RULE -->
            <div class="artifact-structural-rule" aria-hidden="true">
              <div class="artifact-rule-fill"></div>
            </div>
          </div>

          <!-- LOWER STRUCTURED INFORMATION SECTIONS -->
          <div class="artifact-body-sections">
            <!-- 1. DELIVERABLES -->
            <div class="artifact-info-section" id="artifactDeliverables">
              <span class="artifact-section-label">DELIVERABLES</span>
              <div class="artifact-section-value">
                <span class="artifact-bullet" aria-hidden="true">&bull;</span>
                <span class="artifact-value-text">24 Final Retouched Images</span>
              </div>
            </div>

            <!-- 2. PRODUCTION -->
            <div class="artifact-info-section" id="artifactProduction">
              <span class="artifact-section-label">PRODUCTION</span>
              <div class="artifact-section-value inline-specs">
                <span class="spec-tag">Studio</span>
                <span class="spec-dot" aria-hidden="true">&middot;</span>
                <span class="spec-tag">Photo Assistant</span>
                <span class="spec-dot" aria-hidden="true">&middot;</span>
                <span class="spec-tag">Product Styling</span>
              </div>
            </div>

            <!-- 3. USAGE RIGHTS & TERMS -->
            <div class="artifact-info-section" id="artifactUsage">
              <span class="artifact-section-label">USAGE RIGHTS &amp; TERMS</span>
              <div class="artifact-section-value quiet-spec">
                <span>12-Month Digital Usage</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- MODULE 02: EDITORIAL PHOTOGRAPHY WORKFLOW (FROZEN V2.11) -->
  <section class="sec-workflow" id="sec-workflow">
    <div class="container workflow-container">
      
      <!-- 1. CENTERED EDITORIAL SECTION HEADER (MAX-WIDTH 800PX) -->
      <div class="workflow-header-centered" id="workflowHeader">
        <div class="workflow-eyebrow">
          <span class="wf-eyebrow-text">From inquiry to invoice</span>
        </div>
        <h2 class="workflow-title">A project starts as a conversation.<br>The quote is where it takes shape.</h2>
        <p class="workflow-body">
          A vague request becomes a defined scope.<br>
          Once the client agrees, the same project moves forward —<br>
          to the shoot, the invoice, and the record of what was agreed.
        </p>
      </div>

      <!-- 2. UPPER TRANSFORMATION LAYOUT (SHARED GRID ROWS ARCHITECTURE) -->
      <div class="transformation-layout" id="transformationLayout">
        
        <!-- ROW 1 COL 1: CLIENT INQUIRY LABEL -->
        <div class="trans-label-row inquiry-label-row">
          <span class="trans-label">CLIENT INQUIRY</span>
        </div>

        <!-- ROW 1 COL 3: DEFINED SCOPE LABEL -->
        <div class="trans-label-row scope-label-row">
          <span class="trans-label brand-label">DEFINED SCOPE</span>
        </div>

        <!-- ROW 2 COL 1: CLIENT INQUIRY QUOTE -->
        <div class="inquiry-col" id="inquiryCol">
          <div class="inquiry-content">
            <span class="inquiry-quote-text" id="inquiryQuoteText">&ldquo;A few product shots&rdquo;</span>
          </div>
        </div>

        <!-- ROW 2 COL 2: CONNECTOR (SINGLE INTEGRATED SVG CONNECTOR SYSTEM) -->
        <div class="connector-col" id="connectorCol" aria-hidden="true">
          <div class="connector-line-wrapper" id="connectorLineWrapper">
            <svg class="transformation-connector-svg" id="connectorSvg" viewBox="0 0 120 18" preserveAspectRatio="none">
              <!-- NEUTRAL BACKGROUND TRACK -->
              <line class="connector-svg-track" x1="0" y1="9" x2="120" y2="9" stroke="#E4E4E7" stroke-width="1.25" stroke-linecap="round" />
              <!-- ACTIVE BRIDGE LINE FILL -->
              <line class="connector-svg-fill" id="connectorSvgFill" x1="0" y1="9" x2="120" y2="9" stroke="#4F46E5" stroke-width="1.25" stroke-linecap="round" />
              <!-- CUSTOM SLENDER ARROWHEAD (NO INTERNAL SHAFT!) -->
              <path class="connector-svg-arrowhead" id="connectorSvgArrowhead" fill="none" stroke="#4F46E5" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" transform="translate(120 9)" d="M -6 -3.5 L 0 0 L -6 3.5" />
            </svg>
          </div>
        </div>

        <!-- ROW 2 COL 3: DEFINED SCOPE FACTS WITH RESTRAINED VERTICAL SPINE -->
        <div class="scope-col" id="scopeCol">
          <div class="scope-facts-wrapper">
            <!-- RESTRAINED VERTICAL STRUCTURE SPINE -->
            <div class="scope-structure-spine" id="scopeSpine">
              <div class="spine-line-fill" id="spineFill"></div>
            </div>
            <div class="scope-facts-list">
              <div class="fact-item wf-fact-item" id="fact-1">
                <div class="fact-branch-line" id="factBranch1"></div>
                <span class="fact-text" id="factText1"><strong>12</strong> products</span>
              </div>
              <div class="fact-item wf-fact-item" id="fact-2">
                <div class="fact-branch-line" id="factBranch2"></div>
                <span class="fact-text" id="factText2"><strong>3</strong> setups</span>
              </div>
              <div class="fact-item wf-fact-item" id="fact-3">
                <div class="fact-branch-line" id="factBranch3"></div>
                <span class="fact-text" id="factText3"><strong>24</strong> final images</span>
              </div>
              <div class="fact-item wf-fact-item" id="fact-4">
                <div class="fact-branch-line" id="factBranch4"></div>
                <span class="fact-text" id="factText4"><strong>12-month</strong> digital usage</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- SINGLE STRUCTURAL DIVIDER BETWEEN TRANSFORMATION AND PHASE BAND -->
      <div class="section-structural-divider" aria-hidden="true"></div>

      <!-- 3. LOWER SECTION: ONE CENTERED PHASE BAND (THREE EQUAL VISUAL CENTERS repeat(3, 1fr)) -->
      <div class="lower-phase-band" id="lowerPhaseBand">
        <div class="phase-band-grid">
          
          <!-- PHASE 1: DISCOVER -->
          <div class="phase-group-col" id="phaseGroup1" data-phase="discover">
            <h3 class="phase-group-title">DISCOVER</h3>
            <div class="phase-flow-row">
              <span class="flow-text">Inquiry <span class="flow-arrow">&rarr;</span> Define scope</span>
              <div class="flow-underline-track"><div class="flow-underline-fill" id="flowFill1"></div></div>
            </div>
          </div>

          <!-- PHASE 2: AGREE -->
          <div class="phase-group-col" id="phaseGroup2" data-phase="agree">
            <h3 class="phase-group-title">AGREE</h3>
            <div class="phase-flow-row">
              <span class="flow-text">Quote <span class="flow-arrow">&rarr;</span> Client approval</span>
              <div class="flow-underline-track"><div class="flow-underline-fill" id="flowFill2"></div></div>
            </div>
          </div>

          <!-- PHASE 3: DELIVER & CLOSE -->
          <div class="phase-group-col" id="phaseGroup3" data-phase="deliver">
            <h3 class="phase-group-title">DELIVER &amp; CLOSE</h3>
            <div class="phase-flow-row">
              <span class="flow-text">Shoot <span class="flow-arrow">&rarr;</span> Invoice <span class="flow-arrow">&rarr;</span> Project record</span>
              <div class="flow-underline-track"><div class="flow-underline-fill" id="flowFill3"></div></div>
            </div>
          </div>

        </div>
      </div>

    </div>
  </section>

  <!-- MODULE 03: SCOPE CLARITY (V1.2 SCOPE EXPANSION INTERACTION) -->
  <section class="sec-scope-clarity" id="sec-scope-clarity">
    <div class="container scope-clarity-container">
      
      <div class="scope-clarity-layout">
        
        <!-- LEFT NARRATIVE ANCHOR (~36%) -->
        <div class="scope-narrative-col" id="scopeNarrativeCol">
          <div class="scope-eyebrow">
            <span class="scope-eyebrow-text">Scope clarity</span>
          </div>
          <h2 class="scope-title">A photography quote is more than a day rate.</h2>
          <div class="scope-body">
            <p>A price means very little if no one is quite sure what it includes.</p>
            <p>Products, setups, assistants, retouching, revisions, delivery, usage &mdash; these are the details that give the number its shape.</p>
          </div>

          <!-- RESTRAINED CORE STATEMENT WITH BRAND LEFT RULE -->
          <div class="scope-core-statement">
            <p>Corvioz doesn&rsquo;t tell you what to charge. It helps you make the work behind the price easier to see.</p>
          </div>

          <!-- RESTRAINED SINGLE PHOTOGRAPHY QUOTE LINE (INTERACTION SOURCE BLOCK) -->
          <div class="simple-quote-line-block" id="simpleQuoteLine">
            <div class="simple-line-header">
              <span class="simple-line-label">PHOTOGRAPHY</span>
            </div>
            <div class="simple-line-row">
              <span class="simple-line-text">1 shoot day</span>
            </div>
          </div>
        </div>

        <!-- RIGHT SCOPE ANATOMY DOCUMENT LEDGER (~64%) -->
        <div class="scope-anatomy-col" id="scopeAnatomyCol">
          <div class="scope-document-ledger" id="scopeDocumentLedger">
            
            <!-- RESTRAINED REAL PROJECT STORY HEADER -->
            <div class="ledger-header-bar">
              <span class="ledger-project-name">SPRING PRODUCT CAMPAIGN</span>
              <span class="ledger-scope-subtitle">Photography scope</span>
            </div>

            <!-- LEDGER GROUPS CONTAINER -->
            <div class="ledger-groups-grid">
              
              <!-- 1. PROJECT (4 ITEMS - NO BULLETS) -->
              <div class="ledger-group-block" id="groupProject" data-group="project">
                <div class="group-label-row">
                  <span class="ledger-group-label">PROJECT</span>
                  <div class="group-accent-line"></div>
                </div>
                <ul class="ledger-item-list">
                  <li class="ledger-item"><span class="item-text"><strong>12</strong> Products / SKUs</span></li>
                  <li class="ledger-item"><span class="item-text"><strong>3</strong> Setups</span></li>
                  <li class="ledger-item" id="scopeItemShootDay"><span class="item-text"><strong>1</strong> Shoot Day</span></li>
                  <li class="ledger-item"><span class="item-text">Studio</span></li>
                </ul>
              </div>

              <!-- 2. PRODUCTION (3 ITEMS - NO BULLETS) -->
              <div class="ledger-group-block" id="groupProduction" data-group="production">
                <div class="group-label-row">
                  <span class="ledger-group-label">PRODUCTION</span>
                  <div class="group-accent-line"></div>
                </div>
                <ul class="ledger-item-list">
                  <li class="ledger-item"><span class="item-text">Photo Assistant</span></li>
                  <li class="ledger-item"><span class="item-text">Basic Equipment</span></li>
                  <li class="ledger-item"><span class="item-text">Product Styling</span></li>
                </ul>
              </div>

              <!-- 3. DELIVERABLES (4 ITEMS - NO BULLETS) -->
              <div class="ledger-group-block" id="groupDeliverables" data-group="deliverables">
                <div class="group-label-row">
                  <span class="ledger-group-label">DELIVERABLES</span>
                  <div class="group-accent-line"></div>
                </div>
                <ul class="ledger-item-list">
                  <li class="ledger-item"><span class="item-text"><strong>24</strong> Final Images</span></li>
                  <li class="ledger-item"><span class="item-text">Retouching</span></li>
                  <li class="ledger-item"><span class="item-text"><strong>2</strong> Revision Rounds</span></li>
                  <li class="ledger-item"><span class="item-text"><strong>7</strong> Business Days</span></li>
                </ul>
              </div>

              <!-- 4. RIGHTS & TERMS (4 ITEMS - NO BULLETS) -->
              <div class="ledger-group-block" id="groupRightsTerms" data-group="rights">
                <div class="group-label-row">
                  <span class="ledger-group-label">RIGHTS &amp; TERMS</span>
                  <div class="group-accent-line"></div>
                </div>
                <ul class="ledger-item-list">
                  <li class="ledger-item"><span class="item-text"><strong>12-Month</strong> Digital Usage</span></li>
                  <li class="ledger-item"><span class="item-text">Website</span></li>
                  <li class="ledger-item"><span class="item-text">Organic Social</span></li>
                  <li class="ledger-item"><span class="item-text">Paid Social</span></li>
                </ul>
              </div>

              <!-- 5. NOT INCLUDED (6 ITEMS - FIRST CLASS SCOPE INFO, QUIET NEUTRAL TYPOGRAPHY) -->
              <div class="ledger-group-block ledger-group-full-width" id="groupNotIncluded" data-group="notincluded">
                <div class="group-label-row">
                  <span class="ledger-group-label quiet-label">NOT INCLUDED</span>
                  <div class="group-accent-line"></div>
                </div>
                <ul class="ledger-item-list inline-quiet-list">
                  <li class="ledger-item quiet-item"><span class="item-text">Talent / Models</span></li>
                  <li class="ledger-item quiet-item"><span class="item-text">Advanced Compositing</span></li>
                  <li class="ledger-item quiet-item"><span class="item-text">Additional Setups</span></li>
                  <li class="ledger-item quiet-item"><span class="item-text">Rush Delivery</span></li>
                  <li class="ledger-item quiet-item"><span class="item-text">Extra Retouching</span></li>
                  <li class="ledger-item quiet-item"><span class="item-text">Extended Usage</span></li>
                </ul>
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  </section>


  <!-- MODULE 04: CLIENT APPROVAL (V1 STATIC DESIGN PASS) -->
  <section class="sec-client-approval" id="sec-client-approval">
    <div class="container approval-container">

      <!-- CENTERED EDITORIAL SECTION HEADER (~720–780px) -->
      <div class="approval-header-centered" id="approvalHeader">
        <div class="approval-eyebrow">
          <span class="approval-eyebrow-text">Client approval</span>
        </div>
        <h2 class="approval-title">Give the client something clear to approve.</h2>
        <p class="approval-body">
          Approval means more when the client can see what the quote actually covers.
          Scope, deliverables, usage, and price stay together in one client-facing view —
          so the decision is about the same project you discussed.
        </p>
      </div>

      <!-- ONE WIDE CLIENT REVIEW SURFACE (~1080–1160px) -->
      <div class="client-review-surface" id="clientReviewSurface">

        <!-- DOCUMENT HEADER BAR -->
        <div class="review-doc-header">
          <div class="review-doc-identity">
            <span class="review-project-name">SPRING PRODUCT CAMPAIGN</span>
            <span class="review-client-label">Acme Studio</span>
          </div>
          <span class="review-context-badge">CLIENT VIEW</span>
        </div>

        <!-- MAIN LAYOUT: CONTENT AREA + STATUS COLUMN -->
        <div class="review-main-layout">

          <!-- LEFT: MAIN REVIEW CONTENT (~75–78%) -->
          <div class="review-content-area">

            <!-- SCOPE -->
            <div class="review-section" id="reviewScope">
              <div class="review-section-header">
                <span class="review-section-label">SCOPE</span>
                <div class="review-section-rule"><div class="review-rule-fill"></div></div>
              </div>
              <ul class="review-item-list">
                <li class="review-item"><span class="item-qty"><strong>12</strong></span><span class="item-label">Products / SKUs</span></li>
                <li class="review-item"><span class="item-qty"><strong>3</strong></span><span class="item-label">Setups</span></li>
                <li class="review-item"><span class="item-qty"><strong>1</strong></span><span class="item-label">Shoot Day</span></li>
                <li class="review-item"><span class="item-qty"></span><span class="item-label">Studio</span></li>
              </ul>
            </div>

            <!-- DELIVERABLES -->
            <div class="review-section" id="reviewDeliverables">
              <div class="review-section-header">
                <span class="review-section-label">DELIVERABLES</span>
                <div class="review-section-rule"><div class="review-rule-fill"></div></div>
              </div>
              <ul class="review-item-list">
                <li class="review-item"><span class="item-qty"><strong>24</strong></span><span class="item-label">Final Images</span></li>
                <li class="review-item"><span class="item-qty"></span><span class="item-label">Retouching</span></li>
                <li class="review-item"><span class="item-qty"><strong>2</strong></span><span class="item-label">Revision Rounds</span></li>
                <li class="review-item"><span class="item-qty"><strong>7</strong></span><span class="item-label">Business Days</span></li>
              </ul>
            </div>

            <!-- USAGE -->
            <div class="review-section" id="reviewUsage">
              <div class="review-section-header">
                <span class="review-section-label">USAGE</span>
                <div class="review-section-rule"><div class="review-rule-fill"></div></div>
              </div>
              <ul class="review-item-list">
                <li class="review-item"><span class="item-qty"><strong>12-Month</strong></span><span class="item-label">Digital Usage</span></li>
                <li class="review-item"><span class="item-qty"></span><span class="item-label">Website</span></li>
                <li class="review-item"><span class="item-qty"></span><span class="item-label">Organic Social</span></li>
                <li class="review-item"><span class="item-qty"></span><span class="item-label">Paid Social</span></li>
              </ul>
            </div>

            <!-- PROJECT TOTAL -->
            <div class="review-section review-total-section" id="reviewTotal">
              <div class="review-total-row">
                <div class="review-total-label-group">
                  <span class="review-section-label">PROJECT TOTAL</span>
                  <span class="review-total-descriptor">Quoted project total</span>
                </div>
                
              </div>
            </div>

          </div>

                                        <!-- RIGHT: APPROVAL STATUS COLUMN (~22–25%) -->
          <div class="review-status-panel" id="approvalStatusPanel">

            <div class="status-panel-header">
              <span class="status-panel-label">STATUS</span>
            </div>

            <!-- TWO-COLUMN STRUCTURAL STATUS ARCHITECTURE -->
            <div class="status-timeline-layout" id="statusTimelineLayout">

              <!-- COLUMN 1: DEDICATED GUTTER FOR DOTS AND CONNECTING RAIL -->
              <div class="status-gutter" id="statusGutter" aria-hidden="true">
                <div class="status-dot status-dot-neutral" id="statusDotAwaiting"></div>

                <!-- NEUTRAL STRUCTURAL TRACK WITH BRAND RAIL OVERLAY -->
                <div class="status-state-rail" id="statusStateRail">
                  <div class="status-rail-fill" id="statusRailFill"></div>
                </div>

                <div class="status-dot status-dot-brand" id="statusDotAccepted"></div>
              </div>

              <!-- COLUMN 2: STATUS TEXT CONTENT -->
              <div class="status-text-column" id="statusTextColumn">

                <!-- PRIMARY CURRENT STATE: AWAITING APPROVAL -->
                <div class="status-state-block status-awaiting" id="statusAwaiting">
                  <span class="status-state-name">Awaiting Approval</span>
                  <p class="status-state-desc">The client has received the quote for review.</p>
                </div>

                <!-- SECONDARY / FUTURE STATE: ACCEPTED PREVIEW REGION -->
                <div class="status-accepted-wrapper" id="statusAcceptedWrapper">
                  <div class="status-divider" aria-hidden="true"></div>
                  <span class="status-after-label">After client approval</span>

                  <!-- ACCEPTED STATE CONTENT & INTERACTION HIT TARGET -->
                  <div class="status-state-block status-accepted" id="statusAccepted">
                    <span class="status-state-name status-accepted-name">Accepted</span>
                    <p class="status-state-desc">The quote is agreed. The project moves forward.</p>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  </section>

  <!-- MODULE 05: QUOTE → INVOICE CONTINUITY (V1.3 CONTEXT PERSISTENCE INTERACTION) -->
  <section class="sec-continuity" id="sec-continuity">
    <div class="container continuity-layout">
      
      <!-- LEFT: NARRATIVE COLUMN (~34%) -->
      <div class="continuity-narrative-col" id="continuityNarrativeCol">
        <!-- EDITORIAL EYEBROW -->
        <div class="continuity-eyebrow-wrapper">
          <span class="continuity-eyebrow-rule" aria-hidden="true"></span>
          <span class="continuity-eyebrow-label">Quote → Invoice</span>
        </div>

        <h2 class="continuity-title">
          The project shouldn’t start over<br>
          when it’s time to invoice.
        </h2>

        <div class="continuity-body">
          <p>The scope has already been defined. The client already knows what was agreed.</p>
          <p>When you move from quote to invoice, Corvioz keeps the same project, client, and context in view — without turning the next step into a fresh start.</p>
        </div>
      </div>

      <!-- RIGHT: PROJECT CONTINUITY SURFACE (~66%) -->
      <div class="continuity-visual-col" id="continuityVisualCol">
        <div class="project-continuity-surface" id="projectContinuitySurface">
          
          <!-- 1. PERSISTENT CONTEXT BACKBONE (~26–28%) -->
          <div class="context-backbone-col" id="contextBackbone">
            <div class="backbone-header">
              <span class="backbone-overline" id="backboneOverline">PROJECT CONTEXT</span>
            </div>
            
            <div class="backbone-identity" id="backboneIdentity">
              <span class="backbone-project-name">SPRING PRODUCT CAMPAIGN</span>
              <span class="backbone-client-name">Acme Studio</span>
            </div>

            <div class="backbone-meta-block" id="backboneMetaBlock">
              <span class="backbone-meta-label">RECORD</span>
              <span class="backbone-meta-value" id="backboneMetaValue">Agreed Quote</span>
            </div>
          </div>

          <!-- PRIMARY STRUCTURAL BACKBONE RAIL -->
          <div class="context-backbone-rail" id="contextBackboneRail" aria-hidden="true"></div>

          <!-- 2. DOCUMENT REGISTERS ZONE (~72–74%) -->
          <div class="document-registers-zone" id="documentRegistersZone">
            
            <!-- REGISTER 1: QUOTE REGISTER (~46%) -->
            <div class="document-register register-quote" id="continuityQuoteRegister">
              <div class="register-header">
                <span class="register-type-label">QUOTE</span>
                <span class="register-status status-accepted-tag" id="continuityQuoteStatus">Accepted</span>
              </div>
              <div class="register-structural-rule" aria-hidden="true">
                <div class="register-rule-fill"></div>
              </div>
              <div class="register-body">
                <div class="register-field">
                  <span class="register-field-label">SCOPE</span>
                  <span class="register-field-value"><strong>12</strong> Products &middot; <strong>3</strong> Setups &middot; <strong>1</strong> Shoot Day</span>
                </div>
                <div class="register-field">
                  <span class="register-field-label">DELIVERABLES</span>
                  <span class="register-field-value">24 Final Images</span>
                </div>
                <div class="register-field">
                  <span class="register-field-label">USAGE</span>
                  <span class="register-field-value">12-Month Digital Usage</span>
                </div>
              </div>
            </div>

            <!-- QUIET EDITORIAL SEPARATION -->
            <div class="register-flow-divider" id="registerFlowDivider" aria-hidden="true"></div>

            <!-- REGISTER 2: INVOICE REGISTER (~54%) -->
            <div class="document-register register-invoice" id="continuityInvoiceRegister">
              <div class="register-header">
                <span class="register-type-label">INVOICE</span>
                <span class="register-status status-draft-tag" id="continuityInvoiceStatus">Draft</span>
              </div>
              <div class="register-structural-rule" aria-hidden="true">
                <div class="register-rule-fill"></div>
              </div>
              <div class="register-body">
                <div class="register-field">
                  <span class="register-field-label">ITEM</span>
                  <span class="register-field-value">Photography services</span>
                </div>
                <div class="register-field">
                  <span class="register-field-label">PROJECT REFERENCE</span>
                  <span class="register-field-value">Spring Product Campaign</span>
                </div>
                <div class="register-field context-field" id="continuityContextRow">
                  <span class="register-field-label">CONTEXT</span>
                  <span class="register-field-value context-origin-text" id="continuityContextText">Based on agreed quote</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  </section>

  <!-- MODULE 06: PHOTOGRAPHY USE CASES (V1.1 EDITORIAL FINGERPRINT REGISTER) -->
  <section class="sec-usecases" id="sec-usecases">
    <div class="container usecases-container">
      
      <!-- EDITORIAL MODULE HEADER -->
      <header class="usecases-header" id="usecasesHeader">
        <div class="usecases-eyebrow-wrapper">
          <span class="usecases-eyebrow-rule" aria-hidden="true"></span>
          <span class="usecases-eyebrow-label">Photography use cases</span>
        </div>
        
        <h2 class="usecases-title">
          Different shoots ask<br>different questions.
        </h2>

        <div class="usecases-body">
          <p>A product job might be shaped by SKUs and setups. An event might be shaped by coverage and turnaround.</p>
          <p>Commercial work can bring production, talent, deliverables, and usage into the same conversation.</p>
          <p>A clear quote starts with the details that actually define that kind of shoot.</p>
        </div>
      </header>

      <!-- EDITORIAL SCOPE FINGERPRINT REGISTER (OPEN REGISTER SYSTEM) -->
      <div class="editorial-scope-register" id="editorialScopeRegister">
        
        <!-- TOP STRUCTURAL REGISTER RULE -->
        <div class="register-boundary-rule top-rule" aria-hidden="true">
          <div class="boundary-datum-mark"></div>
        </div>

        <div class="scope-register-entries" role="list" id="scopeRegisterEntries">
          
          <!-- ENTRY 01: COMMERCIAL / BRAND -->
          <div class="scope-register-row" id="usecaseRowCommercial" role="listitem">
            <div class="row-index-lane">
              <span class="index-num">01</span>
              <span class="index-registration-tick" aria-hidden="true"></span>
            </div>
            <div class="row-title-zone">
              <h3 class="row-usecase-title">COMMERCIAL / BRAND</h3>
            </div>
            <div class="row-fingerprint-rail">
              <div class="fingerprint-anchor anchor-1">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Production</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-2">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Talent</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-3">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Usage</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-4">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Campaign deliverables</span>
              </div>
            </div>
          </div>

          <!-- INTERNAL ROW SEPARATOR -->
          <div class="register-row-divider" aria-hidden="true"></div>

          <!-- ENTRY 02: PRODUCT -->
          <div class="scope-register-row" id="usecaseRowProduct" role="listitem">
            <div class="row-index-lane">
              <span class="index-num">02</span>
              <span class="index-registration-tick" aria-hidden="true"></span>
            </div>
            <div class="row-title-zone">
              <h3 class="row-usecase-title">PRODUCT</h3>
            </div>
            <div class="row-fingerprint-rail">
              <div class="fingerprint-anchor anchor-1">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">SKUs</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-2">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Setups</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-3">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Retouching</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-4">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Delivery</span>
              </div>
            </div>
          </div>

          <!-- INTERNAL ROW SEPARATOR -->
          <div class="register-row-divider" aria-hidden="true"></div>

          <!-- ENTRY 03: PORTRAIT / CORPORATE -->
          <div class="scope-register-row" id="usecaseRowPortrait" role="listitem">
            <div class="row-index-lane">
              <span class="index-num">03</span>
              <span class="index-registration-tick" aria-hidden="true"></span>
            </div>
            <div class="row-title-zone">
              <h3 class="row-usecase-title">PORTRAIT / CORPORATE</h3>
            </div>
            <div class="row-fingerprint-rail">
              <div class="fingerprint-anchor anchor-1">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">People</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-2">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Looks</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-3">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Location</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-4">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Final images</span>
              </div>
            </div>
          </div>

          <!-- INTERNAL ROW SEPARATOR -->
          <div class="register-row-divider" aria-hidden="true"></div>

          <!-- ENTRY 04: EVENT -->
          <div class="scope-register-row" id="usecaseRowEvent" role="listitem">
            <div class="row-index-lane">
              <span class="index-num">04</span>
              <span class="index-registration-tick" aria-hidden="true"></span>
            </div>
            <div class="row-title-zone">
              <h3 class="row-usecase-title">EVENT</h3>
            </div>
            <div class="row-fingerprint-rail">
              <div class="fingerprint-anchor anchor-1">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Coverage</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-2">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Locations</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-3">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Turnaround</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-4">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Image delivery</span>
              </div>
            </div>
          </div>

          <!-- INTERNAL ROW SEPARATOR -->
          <div class="register-row-divider" aria-hidden="true"></div>

          <!-- ENTRY 05: WEDDING / PRIVATE -->
          <div class="scope-register-row" id="usecaseRowWedding" role="listitem">
            <div class="row-index-lane">
              <span class="index-num">05</span>
              <span class="index-registration-tick" aria-hidden="true"></span>
            </div>
            <div class="row-title-zone">
              <h3 class="row-usecase-title">WEDDING / PRIVATE</h3>
            </div>
            <div class="row-fingerprint-rail">
              <div class="fingerprint-anchor anchor-1">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Coverage</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-2">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Key moments</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-3">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Second shooter</span>
              </div>
              <div class="fingerprint-rail-segment" aria-hidden="true"></div>
              <div class="fingerprint-anchor anchor-4">
                <span class="anchor-tick" aria-hidden="true"></span>
                <span class="anchor-term">Delivery</span>
              </div>
            </div>
          </div>

        </div>

        <!-- BOTTOM STRUCTURAL REGISTER CLOSING RULE -->
        <div class="register-boundary-rule bottom-rule" aria-hidden="true"></div>

    </div>
  </section>

  <!-- MODULE 07: CLARITY STATEMENT (QUIET EDITORIAL PAUSE — STATIC DESIGN) -->
  <section class="sec-clarity" id="sec-clarity">
    <div class="container clarity-container">
      
      <div class="clarity-statement-composition" id="clarityComposition">
        
        <!-- EDITORIAL EYEBROW -->
        <div class="clarity-eyebrow-wrapper">
          <span class="clarity-eyebrow-rule" aria-hidden="true"></span>
          <span class="clarity-eyebrow-label">Clarity, not pricing advice</span>
        </div>

        <!-- PRIMARY STATEMENT H2 -->
        <h2 class="clarity-statement-title" id="clarityStatementTitle">
          A price is easier to stand behind<br>when the scope is clear.
        </h2>

        <!-- STRUCTURAL EDITORIAL DATUM LINE -->
        <div class="clarity-datum-seam" aria-hidden="true">
          <span class="clarity-datum-accent"></span>
        </div>

        <!-- OFFSET EDITORIAL BODY COPY -->
        <div class="clarity-body-wrapper" id="clarityBodyWrapper">
          <div class="clarity-body-content">
            <p>The client can see what’s included, what gets delivered, how the work can be used, and what sits outside the quote.</p>
            <p>Corvioz helps you put that context around your price — without telling you what your photography should cost.</p>
          </div>
        </div>

      </div>

    </div>
  </section>

  <!-- MODULE 08: FINAL CTA (CLOSING ACTION FRAME) -->
  <section class="sec-final-cta" id="secFinalCta">
    <div class="container final-cta-container">
      
      <!-- CLOSING ACTION FRAME LAYOUT -->
      <div class="final-cta-frame" id="finalCtaFrame">
        
        <!-- LEFT EDITORIAL CONTENT ZONE (~68%) -->
        <div class="final-cta-content-zone" id="finalCtaContentZone">
          
          <!-- EDITORIAL EYEBROW -->
          <div class="final-cta-eyebrow-wrapper">
            <span class="final-cta-eyebrow-rule" aria-hidden="true"></span>
            <span class="final-cta-eyebrow-label">For your next project</span>
          </div>

          <!-- PRIMARY H2 -->
          <h2 class="final-cta-title" id="finalCtaTitle">
            Start with the work.<br>Make the quote clear.
          </h2>

          <!-- EDITORIAL BODY -->
          <div class="final-cta-body" id="finalCtaBody">
            <p>Bring the scope, deliverables, usage, and project details into one quote before the shoot moves forward.</p>
          </div>

        </div>

        <!-- RIGHT ACTION ZONE (~32%) -->
        <div class="final-cta-action-zone" id="finalCtaActionZone">
          <div class="final-cta-btn-wrapper">
            <a href="/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote" 
               class="btn-primary final-cta-btn" 
               id="finalCtaCreateQuoteBtn">
              <span>Create Quote</span>
              <svg class="cta-arrow-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>
        </div>

      </div>

      <!-- STRUCTURAL CLOSING DATUM RULE -->
      <div class="final-cta-bottom-seam" aria-hidden="true">
        <span class="final-cta-datum-tick"></span>
      </div>

    </div>
  </section>

  </main>
  <!-- HOME-01 final QA V1C Footer: the resolved visual authority. -->
  <footer class="site-footer-home01" id="siteFooter" role="contentinfo">
    <div class="footer-inner-home01">
      <div class="footer-grid-home01">
        <div class="footer-brand-home01">
          <a href="/" class="footer-wordmark-home01" aria-label="Corvioz home">Corvioz</a>
          <p>A focused workspace for quotes, invoices, client records, and recorded payment status.</p>
          <a href="/dashboard" class="footer-signin-home01">Sign in →</a>
        </div>
        <div class="footer-nav-home01"><h3>Product</h3><ul><li><a href="/#how-corvioz-works">How It Works</a></li><li><a href="/for-photographers">For Photographers</a></li><li><a href="/pricing">Pricing</a></li><li><a href="/security">Security</a></li></ul></div>
        <div class="footer-nav-home01"><h3>Resources</h3><ul><li><a href="/blog">Blog</a></li><li><a href="/blog/invoice-vs-quote-vs-receipt">Client Document Guide</a></li><li><a href="/invoice-template/photographer">Photographer Template</a></li><li><a href="/help">Help Center</a></li></ul></div>
        <div class="footer-nav-home01"><h3>Legal</h3><ul><li><a href="/privacy">Privacy Policy</a></li><li><a href="/terms">Terms of Service</a></li><li><a href="/refund-policy">Refund Policy</a></li><li><a href="mailto:support@corvioz.com">support@corvioz.com</a></li></ul></div>
      </div>
      <div class="footer-trust-home01" role="complementary" aria-label="Compliance information">
        <span>Subscriptions are handled through Paddle. Corvioz does not store card details.</span><i aria-hidden="true"></i>
        <span>Documents, profile assets, and portfolio content you host on Corvioz are your exclusive property.</span><i aria-hidden="true"></i>
        <span><a href="/security">Security information →</a></span>
      </div>
      <div class="footer-bottom-home01"><span>© 2026 Corvioz</span><div><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/security">Security</a></div></div>
    </div>
  </footer>

  <!-- SCRIPT -->
  `;
const styles = String.raw`/* ==========================================================================
   FOR PHOTOGRAPHERS — MODULE 03 (V1.2 SCOPE EXPANSION INTERACTION)
   ASYMMETRIC EDITORIAL LAYOUT & INFORMATIONAL HOVER EXPANSION INTERACTION
   ========================================================================== */

[data-photographers-v1] {
  /* HOME-01 Tokens */
  --brand-primary: #4F46E5;
  --brand-hover: #4338CA;
  --text-primary: #0B0F19;
  --text-secondary: #4B5563;
  --text-muted: #52525B;
  --text-weak: #71717A;
  --surface-primary: #FFFFFF;
  --surface-header: #f8fafc;
  --surface-subtle: #F8F8FA;
  --border-subtle: #E4E4E7;
  --border-header: rgba(0, 0, 0, 0.10);

  /* Typography */
  --font-sans: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --container-max-width: 1240px;
}

/* Base Reset */
[data-photographers-v1], [data-photographers-v1] * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

[data-photographers-v1] {
  background-color: #FBFBFC;
  color: var(--text-primary);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

[data-photographers-v1] {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Global Keyboard Focus ring */
[data-photographers-v1] *:focus-visible {
  outline: 2px solid #6366F1;
  outline-offset: 2px;
}

/* SCOPED HEADER FOCUS LANGUAGE */
.site-header .nav-link:focus-visible,
.site-header .nav-disclosure-btn:focus-visible,
.site-header .text-link:focus-visible {
  outline: none;
  color: var(--brand-primary);
}

.site-header .nav-link:focus-visible .underline-indicator,
.site-header .nav-disclosure-btn:focus-visible .underline-indicator,
.site-header .text-link:focus-visible .text-link-underline {
  opacity: 1;
  transform: translateY(0);
}

.container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 28px;
  width: 100%;
}

/* GLOBAL HEADER MODULE (EXACT FROZEN V1.2.2 GEOMETRY) */
.site-header {
  height: 64px;
  width: 100%;
  background: var(--surface-header);
  border-bottom: 1px solid var(--border-header);
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-logo {
  text-decoration: none;
  display: flex;
  align-items: center;
}

.wordmark {
  font-family: 'Geist', var(--font-sans);
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: -0.035em;
  color: var(--text-primary);
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 24px;
}

@media (max-width: 1100px) {
  .main-nav {
    gap: 14px;
  }
}

.nav-link, .nav-disclosure-btn {
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 8px 4px;
  position: relative;
  text-decoration: none;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 150ms ease;
}

.nav-link:hover, .nav-disclosure-btn:hover,
.nav-disclosure-btn[aria-expanded="true"] {
  color: var(--brand-primary);
}

.underline-indicator {
  position: absolute;
  bottom: 2px;
  left: 4px;
  right: 4px;
  height: 2px;
  background: var(--brand-primary);
  border-radius: 99px;
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 150ms ease, transform 150ms ease;
}

.nav-link:hover .underline-indicator,
.nav-disclosure-btn:hover .underline-indicator,
.nav-disclosure-btn[aria-expanded="true"] .underline-indicator {
  opacity: 1;
  transform: translateY(0);
}

.chevron-icon {
  width: 12px;
  height: 12px;
  opacity: 0.6;
  transition: transform 150ms ease;
}

.nav-disclosure-btn:hover .chevron-icon,
.nav-disclosure-btn[aria-expanded="true"] .chevron-icon {
  transform: translateY(1px);
}

.nav-disclosure {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
}

.header-dropdown.connected {
  position: absolute;
  top: 100%;
  left: 0;
  width: 200px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.10);
  border-top: 2px solid var(--brand-primary);
  border-radius: 0 0 6px 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 4px 0;
  z-index: 200;
  opacity: 0;
  visibility: hidden;
  transition: opacity 120ms ease, visibility 120ms ease;
}

.header-dropdown.connected:not([hidden]) {
  opacity: 1;
  visibility: visible;
}

@media (hover: hover) and (pointer: fine) {
  .nav-disclosure:hover .nav-disclosure-btn {
    color: var(--brand-primary);
  }

  .nav-disclosure:hover .underline-indicator {
    opacity: 1;
    transform: translateY(0);
  }

  .nav-disclosure:hover .chevron-icon {
    transform: translateY(1px);
  }

  .nav-disclosure:hover .header-dropdown.connected {
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
  }
}

.dropdown-item {
  display: block;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: background 120ms ease, color 120ms ease;
}

.dropdown-item:hover, .dropdown-item:focus-visible {
  background: #EEF2FF;
  color: var(--brand-primary);
  outline: none;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.text-link {
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 4px 2px;
  position: relative;
  text-decoration: none;
  transition: color 150ms ease;
}

.text-link:hover {
  color: var(--brand-primary);
}

.text-link-underline {
  bottom: 0px;
  left: 2px;
  right: 2px;
  height: 1.5px;
}

.text-link:hover .text-link-underline {
  opacity: 1;
  transform: translateY(0);
}

.btn-primary-header {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 18px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background: var(--brand-primary);
  border: 1px solid var(--brand-primary);
  border-radius: 8px;
  text-decoration: none;
  transition: background 150ms ease;
}

.btn-primary-header:hover {
  background: var(--brand-hover);
}

.btn-primary-header:focus-visible {
  background: #4338CA;
  outline: none;
}

/* ==========================================================================
   MODULE 01: HERO
   HERO V2.1 — FINAL FIRST-GLANCE CRAFT PASS
   STRUCTURAL COMPOSITION FIELD + SINGLE WORKING QUOTE DOCUMENT
   ========================================================================== */

.sec-hero {
  position: relative;
  padding: 80px 0 66px 0;
  overflow: hidden;
  background: #FAFBFD;
  border-bottom: 1px solid #EAEAEF;
}

/* ──────────────────────────────────────────────────────
   ARCHITECTURAL STRUCTURAL COMPOSITION FIELD
   Not a repeating SaaS wallpaper grid — precision structural lines
   guiding the working artifact into the drafting workspace.
   Left typography sits in pure, serene editorial whitespace.
   ────────────────────────────────────────────────────── */
.hero-drafting-field {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

/* Localized structural coordinate field (confined to artifact area) */
.drafting-artifact-grid {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 46%;
  right: 0;
  background-image: 
    linear-gradient(rgba(79, 70, 229, 0.026) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 70, 229, 0.026) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 65% 55% at 65% 45%, #000 20%, transparent 82%);
  -webkit-mask-image: radial-gradient(ellipse 65% 55% at 65% 45%, #000 20%, transparent 82%);
}

/* 3-5 Meaningful Structural Composition Anchor Lines */
.drafting-anchor-line {
  position: absolute;
  transition: opacity 280ms ease, background-color 280ms ease;
}

/* Top registration datum: quietly aligns with H1 top and artifact top */
.anchor-top-datum {
  top: 142px;
  left: 40%;
  right: 5%;
  height: 1px;
  background: rgba(79, 70, 229, 0.065);
  mask-image: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent);
}

/* Scope specification datum */
.anchor-scope-datum {
  top: 256px;
  left: 48%;
  right: 8%;
  height: 1px;
  background: rgba(79, 70, 229, 0.045);
  mask-image: linear-gradient(90deg, transparent, #000 20%, #000 80%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 20%, #000 80%, transparent);
}

/* Vertical composition axis separating statement and product */
.anchor-artifact-axis {
  top: 80px;
  bottom: 120px;
  left: calc(52% - 1px);
  width: 1px;
  background: rgba(79, 70, 229, 0.06);
  mask-image: linear-gradient(to bottom, transparent, #000 15%, #000 85%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, #000 15%, #000 85%, transparent);
}

/* Baseline datum aligning artifact bottom and CTA area */
.anchor-bottom-datum {
  bottom: 118px;
  left: 44%;
  right: 8%;
  height: 1px;
  background: rgba(79, 70, 229, 0.045);
  mask-image: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent);
}

.hero-layout {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 56px;
  align-items: center;
}

/* ──────────────────────────────────────────────────────
   LEFT: HERO STATEMENT & CTA
   Stable editorial anchor in clean, serene visual air
   ────────────────────────────────────────────────────── */
.hero-copy-col {
  max-width: 520px;
}

/* EDITORIAL NOTATION (REPLACES GENERIC MARKETING PILL) */
.hero-eyebrow-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 22px;
}

.hero-eyebrow-rule {
  width: 18px;
  height: 1.5px;
  background: var(--brand-primary);
  opacity: 0.85;
  border-radius: 1px;
}

.hero-eyebrow-label {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--brand-primary);
  line-height: 1.3;
}

.hero-title {
  font-family: 'Geist', var(--font-sans);
  font-size: 3.4rem;
  line-height: 1.08;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  text-wrap: balance;
  margin-bottom: 22px;
}

.hero-body {
  font-size: 1.15rem;
  line-height: 1.62;
  color: #52525B;
  margin-bottom: 34px;
}

.hero-body p + p {
  margin-top: 12px;
}

.hero-cta-group {
  display: flex;
  align-items: center;
  gap: 22px;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-primary);
  color: #FFFFFF;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 13px 30px;
  border-radius: 8px;
  border: 1px solid var(--brand-primary);
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
  transition: background 150ms ease, border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease;
}

.btn-primary:hover, .btn-primary:focus-visible {
  background: var(--brand-hover);
  border-color: var(--brand-hover);
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.1), 0 4px 12px rgba(79, 70, 229, 0.15);
}

.btn-primary:active {
  transform: translateY(1px);
}

.link-secondary-scroll {
  color: #71717A;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  position: relative;
  padding: 4px 2px;
  transition: color 150ms ease;
}

.link-arrow-svg {
  width: 14px;
  height: 14px;
  transition: transform 150ms ease;
}

.link-secondary-scroll:hover, .link-secondary-scroll:focus-visible {
  color: var(--brand-primary);
}

.link-secondary-scroll:hover .link-arrow-svg,
.link-secondary-scroll:focus-visible .link-arrow-svg {
  transform: translateY(2px);
}

/* ──────────────────────────────────────────────────────
   RIGHT: WORKING QUOTE ARTIFACT (ONE WORKING DOCUMENT)
   Single continuous paper surface throughout.
   Clean structural rule hierarchy, quiet Draft metadata.
   ────────────────────────────────────────────────────── */
.hero-ui-col {
  position: relative;
}

.working-quote-artifact {
  background: #FFFFFF;
  border: 1px solid #DCDCE2;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03), 0 6px 20px rgba(0, 0, 0, 0.035);
  cursor: default;
  transition: border-color 240ms ease, box-shadow 240ms ease;
}

/* DOCUMENT HEADER (PART OF CONTINUOUS DOCUMENT SURFACE) */
.artifact-doc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 26px 16px 26px;
  background: #FFFFFF;
  border-bottom: 1px solid #EAEAEF;
  transition: background-color 220ms ease;
}

.artifact-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.artifact-project-name {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--text-primary);
}

.artifact-client-name {
  font-size: 12px;
  font-weight: 500;
  color: #71717A;
}

/* DRAFT METADATA (QUIET DOCUMENT STATE, NOT A SAAS STATUS BADGE) */
.artifact-status-tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #71717A;
  background: #F8F8FA;
  border: 1px solid #E5E5EB;
  padding: 2px 6px;
  border-radius: 3px;
  transition: color 220ms ease, border-color 220ms ease, background-color 220ms ease;
}

/* PRIMARY SCOPE SPECIFICATION ROW (CENTRAL HERO PRODUCT ANCHOR) */
.artifact-scope-summary {
  padding: 20px 26px 18px 26px;
  border-bottom: 1px solid #EAEAEF;
  background: #FFFFFF;
  transition: background-color 220ms ease;
}

.scope-spec-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
  gap: 14px;
}

.scope-spec-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spec-num {
  font-family: 'Geist', var(--font-sans);
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
  line-height: 1.1;
  transition: color 220ms ease;
}

.spec-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #71717A;
  letter-spacing: 0.01em;
  transition: color 220ms ease;
}

.scope-spec-divider {
  width: 1px;
  height: 28px;
  background: #EAEAEF;
}

/* STRUCTURAL RULE RESOLUTION (PRIMARY HERO MOTION) */
.artifact-structural-rule {
  height: 1px;
  background: #EAEAEF;
  position: relative;
  overflow: hidden;
  margin-top: 16px;
}

.artifact-rule-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--brand-primary);
  transform-origin: left center;
  transform: scaleX(0);
  opacity: 0.85;
  transition: transform 280ms cubic-bezier(.22, 1, .36, 1);
}

/* LOWER STRUCTURED INFORMATION (SHARES UNIFIED DOCUMENT SURFACE) */
.artifact-body-sections {
  padding: 20px 26px 24px 26px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #FFFFFF;
  transition: background-color 220ms ease;
}

.artifact-info-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.artifact-section-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #71717A;
  transition: color 220ms ease;
}

.artifact-section-value {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  transition: transform 220ms ease, color 220ms ease;
}

.artifact-bullet {
  color: #A1A1AA;
  font-size: 14px;
  transition: color 220ms ease;
}

.artifact-value-text {
  color: var(--text-primary);
  font-weight: 500;
}

.inline-specs {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.spec-tag {
  color: var(--text-primary);
  font-weight: 500;
}

.spec-dot {
  color: #A1A1AA;
}

.quiet-spec {
  color: #52525B;
  font-weight: 500;
}

/* ──────────────────────────────────────────────────────
   SCENE ATTENTION INTERACTION
   When pointer enters the working artifact:
   - Primary: Structural rule resolves scaleX(0) -> scaleX(1)
   - Secondary 1: Scope numbers gain brand focus clarity
   - Secondary 2: Content items gently translate 1.5px
   - Secondary 3: Outer border warms & drafting lines anchor
   - PHYSICAL STABILITY: Zero card lift, zero scale, zero 3D tilt
   ────────────────────────────────────────────────────── */
.working-quote-artifact:hover,
.hero-ui-col.is-scene-active .working-quote-artifact {
  border-color: #CDCDD6;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.04);
}

.working-quote-artifact:hover .artifact-rule-fill,
.hero-ui-col.is-scene-active .artifact-rule-fill {
  transform: scaleX(1);
}

.working-quote-artifact:hover .artifact-doc-header,
.hero-ui-col.is-scene-active .artifact-doc-header {
  background: #FCFCFE;
}

.working-quote-artifact:hover .artifact-status-tag,
.hero-ui-col.is-scene-active .artifact-status-tag {
  color: var(--brand-primary);
  border-color: rgba(79, 70, 229, 0.22);
}

.working-quote-artifact:hover .spec-num,
.hero-ui-col.is-scene-active .spec-num {
  color: var(--brand-primary);
}

.working-quote-artifact:hover .artifact-section-label,
.hero-ui-col.is-scene-active .artifact-section-label {
  color: #71717A;
}

.working-quote-artifact:hover .artifact-section-value,
.hero-ui-col.is-scene-active .artifact-section-value {
  transform: translateX(1.5px);
}

.working-quote-artifact:hover .artifact-bullet,
.hero-ui-col.is-scene-active .artifact-bullet {
  color: var(--brand-primary);
}

/* Nearby drafting anchor lines respond subtly to anchor the scene */
.sec-hero.is-hero-scene-active .drafting-anchor-line {
  opacity: 0.85;
  background: rgba(79, 70, 229, 0.12);
}

/* ==========================================================================
   MODULE 02: EDITORIAL PHOTOGRAPHY WORKFLOW (FROZEN V2.11)
   ========================================================================== */

.sec-workflow {
  position: relative;
  background: #FFFFFF;
  border-top: none;
  padding: 66px 0 58px 0;
}

.workflow-container {
  display: flex;
  flex-direction: column;
}

.workflow-header-centered {
  text-align: center;
  max-width: 800px;
  margin: 0 auto 40px auto;
}

.workflow-eyebrow {
  margin-bottom: 12px;
}

.wf-eyebrow-text {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brand-primary);
}

.workflow-title {
  font-family: 'Geist', var(--font-sans);
  font-size: 2.5rem;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-primary);
  margin-bottom: 16px;
  text-wrap: balance;
}

.workflow-body {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-muted);
}

.transformation-layout {
  display: grid;
  grid-template-columns: 1fr 120px 1fr;
  grid-template-rows: auto auto;
  gap: 24px;
  align-items: start;
  max-width: 960px;
  margin: 0 auto 36px auto;
  width: 100%;
}

.trans-label-row {
  display: flex;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 16px;
  width: 100%;
}

.inquiry-label-row {
  grid-row: 1;
  grid-column: 1;
  justify-content: flex-end;
  margin-bottom: 0;
}

.scope-label-row {
  grid-row: 1;
  grid-column: 3;
  justify-content: flex-start;
  margin-bottom: 0;
}

.trans-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-weak);
  transition: color 180ms ease;
}

.trans-label.brand-label {
  color: var(--brand-primary);
}

.inquiry-col {
  grid-row: 2;
  grid-column: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  cursor: default;
  opacity: 0.85;
  padding-top: 2px;
}

.inquiry-content {
  padding: 12px 0;
}

.inquiry-quote-text {
  font-size: 25px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.015em;
  color: var(--text-primary);
  display: block;
}

.connector-col {
  grid-row: 2;
  grid-column: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  margin-top: 21.5px;
}

.connector-line-wrapper {
  position: relative;
  width: 100%;
  height: 18px;
  display: flex;
  align-items: center;
}

.transformation-connector-svg {
  width: 100%;
  height: 18px;
  overflow: visible;
  display: block;
}

.connector-svg-track {
  stroke: var(--border-subtle);
  stroke-width: 1.25;
  stroke-linecap: round;
}

.connector-svg-fill {
  stroke: var(--brand-primary);
  stroke-width: 1.25;
  stroke-linecap: round;
}

.connector-svg-arrowhead {
  stroke: var(--brand-primary);
  stroke-width: 1.25;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.scope-col {
  grid-row: 2;
  grid-column: 3;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  cursor: default;
  opacity: 1;
  margin-top: 6px;
}

.scope-facts-wrapper {
  position: relative;
  padding-left: 18px;
  width: 100%;
}

.scope-structure-spine {
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 0;
  width: 1px;
  background: var(--border-subtle);
  overflow: hidden;
}

.spine-line-fill {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: var(--brand-primary);
  transform-origin: top center;
  transform: scaleY(1);
}

.scope-facts-list {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.fact-item {
  position: relative;
  padding: 10px 0;
  opacity: 1;
  transform: translateX(0);
  display: flex;
  align-items: center;
}

.fact-branch-line {
  position: absolute;
  left: -18px;
  top: 50%;
  width: 12px;
  height: 1px;
  background: var(--border-subtle);
  transform-origin: left center;
  transform: scaleX(1);
  margin-top: -0.5px;
  transition: background-color 120ms ease;
}

.fact-text {
  font-size: 18.5px;
  line-height: 1.4;
  color: var(--text-secondary);
}

.fact-text strong {
  font-weight: 700;
  color: var(--text-primary);
}

.section-structural-divider {
  max-width: 960px;
  height: 1px;
  background: var(--border-subtle);
  margin: 0 auto 36px auto;
  width: 100%;
}

.lower-phase-band {
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
}

.phase-band-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 48px;
  align-items: flex-start;
  width: 100%;
}

.phase-group-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  cursor: default;
  opacity: 1;
  transition: opacity 180ms ease;
}

.phase-group-title {
  font-size: 0.875rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: var(--text-primary);
  transition: color 180ms ease;
}

.phase-flow-row {
  position: relative;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding-bottom: 6px;
  display: inline-block;
}

.flow-arrow {
  color: var(--text-weak);
  display: inline-block;
  transition: transform 180ms ease, color 180ms ease;
}

.flow-underline-track {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: transparent;
  overflow: hidden;
}

.flow-underline-fill {
  height: 100%;
  background: var(--brand-primary);
  transform-origin: left center;
  transform: scaleX(0);
  transition: transform 220ms ease;
}

/* HOVER STATES FOR LOWER PHASE BAND (OPACITY DROP IS 0.88, NOT 0.65) */
@media (hover: hover) and (pointer: fine) {
  .phase-band-grid:hover .phase-group-col {
    opacity: 0.88;
  }

  .phase-band-grid .phase-group-col:hover {
    opacity: 1 !important;
  }

  .phase-band-grid .phase-group-col:hover .phase-group-title {
    color: var(--brand-primary);
  }

  .phase-band-grid .phase-group-col:hover .flow-underline-fill {
    transform: scaleX(1);
  }

  .phase-band-grid .phase-group-col:hover .flow-arrow {
    color: var(--brand-primary);
    transform: translateX(2px);
  }
}

/* ==========================================================================
   MODULE 03: SCOPE CLARITY (V1.2 SCOPE EXPANSION INTERACTION)
   ========================================================================== */

.sec-scope-clarity {
  position: relative;
  background: #FBFBFC;
  border-top: 1px solid var(--border-subtle);
  padding: 56px 0 60px 0;
}

.scope-clarity-container {
  display: flex;
  flex-direction: column;
}

.scope-clarity-layout {
  display: grid;
  grid-template-columns: 36fr 64fr;
  gap: 56px;
  align-items: start;
  width: 100%;
}

/* LEFT NARRATIVE ANCHOR (~36%) */
.scope-narrative-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 440px;
}

.scope-eyebrow {
  margin-bottom: 12px;
}

.scope-eyebrow-text {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brand-primary);
}

.scope-title {
  font-family: 'Geist', var(--font-sans);
  font-size: 2.35rem;
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-primary);
  margin-bottom: 20px;
  text-wrap: balance;
}

.scope-body {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-muted);
  margin-bottom: 28px;
}

.scope-body p + p {
  margin-top: 12px;
}

/* RESTRAINED CORE STATEMENT WITH BRAND LEFT RULE */
.scope-core-statement {
  border-left: 2.5px solid var(--brand-primary);
  padding-left: 16px;
  margin-bottom: 40px;
}

.scope-core-statement p {
  font-size: 1.05rem;
  line-height: 1.55;
  font-weight: 600;
  color: var(--text-primary);
}

/* RESTRAINED SINGLE PHOTOGRAPHY QUOTE LINE (INTERACTION SOURCE) */
.simple-quote-line-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding-top: 20px;
  border-top: 1px solid var(--border-subtle);
  cursor: default;
  transition: border-color 200ms ease;
}

.simple-line-header {
  display: flex;
  align-items: center;
}

.simple-line-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-weak);
  transition: color 200ms ease;
}

.simple-line-row {
  display: flex;
  align-items: center;
}

.simple-line-text {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--text-primary);
  transition: color 200ms ease, font-weight 200ms ease;
}

/* RIGHT SCOPE ANATOMY DOCUMENT LEDGER (~64%) */
.scope-anatomy-col {
  width: 100%;
}

.scope-document-ledger {
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 32px 36px;
  box-shadow: none;
}

.ledger-header-bar {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 28px;
}

.ledger-project-name {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--text-primary);
  display: block;
}

.ledger-scope-subtitle {
  font-size: 0.88rem;
  font-weight: 500;
  color: var(--text-weak);
  display: block;
}

.ledger-groups-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px 40px;
}

.ledger-group-block {
  display: flex;
  flex-direction: column;
  cursor: default;
  opacity: 1;
  /* Focus rail: positioned left of content */
  position: relative;
  padding-left: 0;
  transition: opacity 200ms ease, padding-left 200ms ease;
}

/* LOCAL VERTICAL FOCUS RAIL (hidden at rest, resolves on active) */
.ledger-group-block::before {
  content: '';
  position: absolute;
  top: 0;
  left: -14px;
  width: 1.5px;
  bottom: 0;
  background: var(--brand-primary);
  opacity: 0;
  transform-origin: top center;
  transform: scaleY(0.4);
  transition: opacity 210ms ease, transform 210ms ease;
  border-radius: 1px;
}

.ledger-group-full-width {
  grid-column: 1 / -1;
  padding-top: 20px;
  border-top: 1px solid var(--border-subtle);
}

.group-label-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.ledger-group-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-primary);
  display: block;
  transition: color 200ms ease;
}

.ledger-group-label.quiet-label {
  color: var(--text-weak);
  transition: color 200ms ease;
}

.group-accent-line {
  width: 18px;
  height: 1.5px;
  background: var(--brand-primary);
  transform-origin: left center;
  transform: scaleX(0);
  transition: transform 200ms ease;
  opacity: 0.85;
}

.ledger-item-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inline-quiet-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 24px;
}

.ledger-item {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  color: var(--text-secondary);
  font-weight: 500;
  line-height: 1.5;
  transition: color 200ms ease, opacity 200ms ease;
}

.ledger-item strong {
  font-weight: 700;
  color: var(--text-primary);
  margin-right: 4px;
  transition: color 200ms ease;
}

.quiet-item {
  color: var(--text-weak);
  transition: color 200ms ease;
}

/* ==========================================================================
   V1.3 INTERACTION STATE HIGHLIGHT CLASSES (MANAGED BY SCRIPT.JS)
   V1.3 CHANGES:
   - Local vertical focus rail per group (::before pseudo)
   - Non-active group opacity 0.76 (stronger separation)
   - Left simple quote line dims to 0.85 for non-PROJECT groups
   - Active items: stronger contrast + subtle translateX(1px)
   - Document-level pointer tracking in script.js (no gap flicker)
   ========================================================================== */

/* 1. SIMPLE LINE STATE TRANSITIONS */
.simple-quote-line-block {
  transition: opacity 200ms ease;
}

/* Active: left is clearly responding to 1 shoot day / PROJECT relationship */
.simple-quote-line-block.is-active-line .simple-line-label {
  color: var(--brand-primary);
}

.simple-quote-line-block.is-active-line .simple-line-text {
  color: var(--text-primary);
  font-weight: 800;
}

/* Dim: when non-PROJECT group is active, left line steps back */
.simple-quote-line-block.is-dimmed-line {
  opacity: 0.84;
}

/* 2. MATCHED SCOPE ITEM (1 Shoot Day inside PROJECT) */
.ledger-item.is-matched-target {
  color: var(--brand-primary) !important;
  font-weight: 700 !important;
}

.ledger-item.is-matched-target strong {
  color: var(--brand-primary) !important;
}

/* 3. ACTIVE GROUP MODEL — LABEL + ACCENT LINE + FOCUS RAIL + ITEMS */

/* 3a. Active group: show local focus rail */
.ledger-group-block.is-active-group::before {
  opacity: 0.55;
  transform: scaleY(1);
}

/* 3b. Active group: brand label */
.ledger-group-block.is-active-group .ledger-group-label {
  color: var(--brand-primary) !important;
}

/* 3c. Active group: horizontal accent marker resolves */
.ledger-group-block.is-active-group .group-accent-line {
  transform: scaleX(1);
}

/* 3d. Active group items: strengthened contrast + subtle right drift */
.ledger-group-block.is-active-group .ledger-item {
  color: var(--text-primary);
  transform: translateX(1px);
  transition: color 200ms ease, transform 200ms ease, opacity 200ms ease;
}

.ledger-group-block.is-active-group .ledger-item strong {
  color: var(--text-primary);
}

/* 3e. NOT INCLUDED active — items step up from weak but stay neutral */
.ledger-group-block.is-active-group .quiet-item {
  color: var(--text-secondary);
  transform: translateX(1px);
}

/* 4. NON-ACTIVE GROUP DIMMING (stronger than V1.2: 0.76 not 0.86) */
.ledger-groups-grid.has-active-group .ledger-group-block:not(.is-active-group) {
  opacity: 0.76;
}

/* Ensure non-active items do not inherit active item translateX */
.ledger-groups-grid.has-active-group .ledger-group-block:not(.is-active-group) .ledger-item {
  transform: translateX(0);
  transition: color 200ms ease, transform 200ms ease, opacity 200ms ease;
}

/* Ensure matched target does not get dimmed by non-active rule */
.ledger-groups-grid.has-active-group .ledger-group-block:not(.is-active-group) .ledger-item.is-matched-target {
  color: var(--brand-primary) !important;
}

/* ==========================================================================
   REDUCED MOTION OVERRIDES
   ========================================================================== */

/* Module 03 and Module 04 reduced-motion overrides. */
@media (prefers-reduced-motion: reduce) {
  [data-photographers-v1], [data-photographers-v1] *, [data-photographers-v1]::before, [data-photographers-v1]::after, [data-photographers-v1] *::before, [data-photographers-v1] *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Preserve Module 02's frozen reduced-motion semantic state. */
  .flow-underline-fill {
    transform: none !important;
  }

  /* Preserve Module 03's frozen reduced-motion semantics. */
  .group-accent-line,
  .ledger-group-block::before,
  .ledger-group-block .ledger-item,
  .simple-quote-line-block {
    transition: color 0.01ms, opacity 0.01ms !important;
    animation: none !important;
  }

  .ledger-group-block.is-active-group .ledger-item,
  .ledger-group-block.is-active-group::before {
    transform: none;
  }

  /* Preserve Hero V2's semantic transforms with effectively instant timing. */
  .working-quote-artifact,
  .artifact-doc-header,
  .artifact-status-tag,
  .artifact-scope-summary,
  .spec-num,
  .spec-label,
  .artifact-rule-fill,
  .artifact-body-sections,
  .artifact-section-label,
  .artifact-section-value,
  .artifact-bullet,
  .drafting-anchor-line,
  /* Preserve Module 04's semantic transforms with effectively instant timing. */
  .review-section,
  .review-section-label,
  .review-section-rule,
  .review-rule-fill,
  .review-item,
  .review-total-descriptor,
  .status-awaiting,
  .status-accepted-wrapper,
  .status-dot,
  .status-state-name,
  .status-state-desc,
  .status-after-label,
  .status-rail-fill,
  .review-status-panel {
    transition-duration: 0.01ms !important;
    animation: none !important;
  }
}

/* ==========================================================================
   MODULE 04: CLIENT APPROVAL
   V1.10 — DOCUMENT ATTENTION MODEL
   ONE DOCUMENT / ATTENTION-DRIVEN READING FOCUS
   ========================================================================== */

/* ──────────────────────────────────────────────────────
   PAGE SURFACE — very quiet cool-tinted off-white
   Difference is felt before it's consciously noticed.
   ────────────────────────────────────────────────────── */
.sec-client-approval {
  position: relative;
  /* Level-1 page surface: cool off-white — distinct from document white */
  background: #F7F7F9;
  border-top: 1px solid var(--border-subtle);
  padding: 56px 0 62px 0;
}

.approval-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* CENTERED EDITORIAL SECTION HEADER */
.approval-header-centered {
  text-align: center;
  max-width: 760px;
  width: 100%;
  margin-bottom: 44px;
}

.approval-eyebrow {
  margin-bottom: 12px;
}

.approval-eyebrow-text {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brand-primary);
}

.approval-title {
  font-family: 'Geist', var(--font-sans);
  font-size: 2.5rem;
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-primary);
  margin-bottom: 16px;
  text-wrap: balance;
}

.approval-body {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-muted);
}

/* ──────────────────────────────────────────────────────
   DOCUMENT SURFACE — clean white with restrained depth
   LEVEL-1 BOUNDARY: outer document edge
   Diff from page: #F7F7F9 page → #FFFFFF document
   Shadow is ambient-only, consistent with HOME-01 card.
   ────────────────────────────────────────────────────── */
.client-review-surface {
  width: 100%;
  max-width: 1120px;
  /* Document body: clean white */
  background: #FFFFFF;
  /* LEVEL-1 divider: outer document boundary — slightly darker than internal rules */
  border: 1px solid #D8D8DC;
  border-radius: 10px;
  overflow: hidden;
  /* Restrained ambient document elevation — felt, not seen */
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.055),
    0 4px 14px rgba(0, 0, 0, 0.04);
}

/* ──────────────────────────────────────────────────────
   DOCUMENT HEADER — subtle paper-tinted surface
   Gives the header slight tonal distance from body.
   Not a coloured bar — just a breath of warmth.
   ────────────────────────────────────────────────────── */
.review-doc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 32px;
  /* Slightly cooler tone than body white — readable before conscious */
  background: #F8F8FA;
  /* LEVEL-2 boundary: document header → document body */
  border-bottom: 1px solid #D8D8DC;
}

.review-doc-identity {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.review-project-name {
  font-size: 0.9rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--text-primary);
}

.review-client-label {
  font-size: 0.825rem;
  font-weight: 500;
  color: var(--text-weak);
}

/* CLIENT VIEW badge — quiet functional label, not a badge */
.review-context-badge {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-weak);
  opacity: 0.75;
  /* No border-box treatment — let it read as a plain document label */
  background: transparent;
  border: none;
  padding: 0;
}

/* ──────────────────────────────────────────────────────
   MAIN LAYOUT: CONTENT AREA + STATUS COLUMN
   ONE structural vertical boundary — content / status
   ────────────────────────────────────────────────────── */
.review-main-layout {
  display: grid;
  grid-template-columns: 75fr 25fr;
  min-height: 360px;
}

/* ──────────────────────────────────────────────────────
   LEFT: REVIEW CONTENT AREA
   Grid of sections — Scope+Deliverables / Usage / Total
   Internal surfaces use tone-shifts, not independent boxes.
   ────────────────────────────────────────────────────── */
.review-content-area {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  /* LEVEL-1 boundary: content/status split — same weight as outer, single owner */
  border-right: 1px solid #D8D8DC;
  transition: opacity 220ms ease;
}

/* ── REVIEW SECTIONS ── */
.review-section {
  padding: 28px 32px;
  /* Internal base: clean white — same as document body */
  background: #FFFFFF;
  /* LEVEL-2 boundary: major document region divider
     Lighter than outer edge — creates depth gradient */
  border-bottom: 1px solid #E4E4E8;
  transition: opacity 220ms ease, background-color 220ms ease;
  cursor: default;
  position: relative;
}

/* Scope / Deliverables row — primary project-definition zone
   No separate background needed — white reads as primary.
   The seam between them is LEVEL-3 (light, editorial). */
.review-section:nth-child(even) {
  /* LEVEL-3 seam: internal section separator — lighter than LEVEL-2 */
  border-left: 1px solid #EBEBEE;
}

/* ── USAGE — secondary rights surface ──
   Spans full width. Subtle tonal shift signals different category.
   Not a separate card — just a breath of distinction. */
.review-section#reviewUsage {
  grid-column: 1 / -1;
  border-left: none;
  /* LEVEL-2 boundary: major region separator above Usage */
  border-top: 1px solid #E4E4E8;
  border-bottom: none;
  /* Slightly cooler background — reads as secondary zone */
  background: #FAFAFA;
}

/* Deliverables border-bottom cleanup — Usage provides its own top */
.review-section#reviewDeliverables {
  border-bottom: none;
}

/* ── SECTION HEADERS ── */
.review-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

/* LEVEL-3 editorial label — quietest text in document */
.review-section-label {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  /* Lighter than LEVEL-2 lines — label is decorative hierarchy */
  color: #71717A;
  white-space: nowrap;
  transition: color 220ms ease;
}

/* LEVEL-3 editorial rule beside section label
   lightest line in the hierarchy — runs alongside label only */
.review-section-rule {
  flex: 1;
  height: 1px;
  /* LEVEL-3: very quiet — barely present at rest */
  background: #EBEBEE;
  position: relative;
  overflow: hidden;
}

.review-rule-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--brand-primary);
  transform-origin: left center;
  transform: scaleX(0);
  opacity: 0.85;
  transition: transform 260ms cubic-bezier(.22, 1, .36, 1);
}

/* ── REVIEW ITEM LISTS ── */
.review-item-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

#reviewUsage .review-item-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px 40px;
  max-width: 560px;
}

.review-item {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 0.925rem;
  line-height: 1.4;
  transition: color 220ms ease, transform 220ms ease;
}

.item-qty {
  min-width: 0;
  color: var(--text-primary);
  font-weight: 500;
}

.item-qty strong {
  font-weight: 700;
  color: var(--text-primary);
  transition: color 220ms ease;
}

.item-label {
  color: var(--text-secondary);
  font-weight: 500;
  transition: color 220ms ease;
}

/* ──────────────────────────────────────────────────────
   PROJECT TOTAL — summary / footer surface
   Reads as the closing statement of the document.
   Not a table row — a document footer.
   Tonal distinction + extra breathing room = editorial weight.
   ────────────────────────────────────────────────────── */
.review-total-section {
  grid-column: 1 / -1;
  /* LEVEL-2 boundary above Total — single visual owner, no double seam.
     Usage has no border-bottom. Total provides only a border-top. */
  border-top: 1px solid #D8D8DC;
  border-bottom: none;
  border-left: none;
  /* More generous padding signals summary character */
  padding: 26px 32px 30px 32px;
  /* Footer surface: the quietest tint — a hair cooler than Usage */
  background: #F5F5F7;
  /* Subtle inset to optically ground the footer zone */
  box-shadow: inset 0 1px 0 rgba(0,0,0,0.02);
}

.review-total-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.review-total-label-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* PROJECT TOTAL label — uses LEVEL-2 weight (not as quiet as other labels) */
.review-total-section .review-section-label {
  /* Upgrade label contrast in footer — it's the lead text here */
  color: #6B6B73;
  font-size: 11px;
  letter-spacing: 0.1em;
  transition: color 220ms ease;
}

.review-total-descriptor {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  transition: color 220ms ease, transform 220ms ease;
}

/* ──────────────────────────────────────────────────────
   SECTION INTERACTION — V1.10 DOCUMENT ATTENTION MODEL
   Active section: tone-shift clarity, not colour flood.
   Inactive: attentional guidance (0.92), not heavy dimming.
   Section handoff: continuous reading focus.
   ────────────────────────────────────────────────────── */

/* ACTIVE — subtle surface tone lift + label/rule resolve */
.review-section.is-active-review {
  opacity: 1.0;
  /* Attention tone: 2.8% brand tone lift — smooth, perceptible clarity */
  background: rgba(79, 70, 229, 0.028);
}

.review-section.is-active-review .review-section-label {
  color: var(--brand-primary);
}

.review-section.is-active-review .review-rule-fill {
  transform: scaleX(1);
}

/* Content movement: 2px — clear, quiet reading focus cue */
.review-section.is-active-review .review-item {
  transform: translateX(2px);
}

.review-section.is-active-review .item-qty strong,
.review-section.is-active-review .item-label {
  color: var(--text-primary);
}

.review-section.is-active-review .review-total-descriptor {
  color: var(--brand-primary);
  transform: translateX(2px);
}

/* NON-ACTIVE — attentional guidance, smooth handoff (0.92 weight) */
.review-content-area.has-active-review .review-section:not(.is-active-review) {
  opacity: 0.92;
}

/* ──────────────────────────────────────────────────────
   STATUS PANEL — V1.9 SURFACE RELATIONSHIP
   Functionally distinct but structurally integral.
   ONE vertical boundary (content / status). No floating card.
   ────────────────────────────────────────────────────── */
.review-status-panel {
  display: flex;
  flex-direction: column;
  /* Status panel surface: slightly distinct from content white
     Cool functional tint — same family as document header */
  background: #FAFAFA;
  padding: 28px 24px;
  gap: 0;
  position: relative;
  transition: background-color 220ms ease;
}

.status-panel-header {
  margin-bottom: 20px;
}

.status-panel-label {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-weak);
}

/* 2-COLUMN LAYOUT: GUTTER (12px) + 8px GAP + TEXT COLUMN */
.status-timeline-layout {
  display: grid;
  grid-template-columns: 12px 1fr;
  column-gap: 8px;
  position: relative;
  align-items: start;
}

/* COLUMN 1: DEDICATED GUTTER FOR DOTS AND RAIL */
.status-gutter {
  position: relative;
  width: 12px;
  height: 100%;
  min-height: 180px;
  pointer-events: none;
}

/* DOTS IN GUTTER (6px diameter, centered at X = 6.0px) */
.status-dot {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  left: 3.0px;
  z-index: 4;
  transition: background-color 220ms ease, opacity 220ms ease;
}

#statusDotAwaiting {
  top: 6px;
  background: #A1A1AA;
}

#statusDotAccepted {
  top: 130px; /* set by script.js dynamically */
  background: #A1A1AA;
  opacity: 0.40;
}

/* STATIC NEUTRAL STRUCTURAL TRACK */
.status-state-rail {
  position: absolute;
  left: 5.5px;
  width: 1px;
  top: 9.0px;  /* set by script.js */
  height: 124px; /* set by script.js */
  background: var(--border-subtle);
  opacity: 0.6;
  z-index: 1;
  overflow: hidden;
}

/* ONE BRAND RAIL OVERLAY */
.status-rail-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--brand-primary);
  transform-origin: top center;
  transform: scaleY(0);
  opacity: 0;
  transition: transform 260ms cubic-bezier(.22, 1, .36, 1), opacity 220ms ease;
}

/* COLUMN 2: STATUS TEXT COLUMN */
.status-text-column {
  display: flex;
  flex-direction: column;
}

.status-state-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: default;
  position: relative;
  z-index: 3;
}

.status-state-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  transition: color 240ms ease, opacity 240ms ease;
}

.status-accepted-name {
  color: var(--text-secondary);
  opacity: 0.85;
}

.status-state-desc {
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--text-weak);
  font-weight: 400;
  opacity: 0.70;
  transition: color 240ms ease, opacity 240ms ease;
}

.status-awaiting {
  opacity: 1.0;
  transition: opacity 240ms ease;
}

.status-accepted-wrapper {
  opacity: 1.0;
  cursor: default;
}

.status-accepted {
  padding: 6px 0; /* usability hit area vertical padding */
}

/* Status divider — LEVEL-3 within status panel */
.status-divider {
  height: 1px;
  background: #EBEBEE;
  margin: 20px 0 10px 0;
}

.status-after-label {
  font-size: 10px;
  font-weight: 650;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-weak);
  opacity: 0.76;
  margin-bottom: 16px;
  display: block;
  transition: opacity 240ms ease;
}

/* ==========================================================================
   V1.9 THREE SEMANTIC VISUAL STATES — STATE MACHINE FROZEN
   Identical state semantics; refined surface responses only.
   ========================================================================== */

/* STATE 1: REVIEW AREA REINFORCEMENT — client is reading the quote */
.status-awaiting.is-reviewing-awaiting #statusDotAwaiting,
.review-status-panel.is-reviewing-awaiting #statusDotAwaiting {
  background: var(--brand-primary);
  opacity: 0.70;
}

/* STATE 2: DIRECT AWAITING FOCUS */
.review-status-panel.is-awaiting-focus .status-rail-fill {
  transform: scaleY(var(--seed-scale-y, 0.113));
  opacity: 0.85;
  transition: transform 180ms cubic-bezier(.22, 1, .36, 1), opacity 180ms ease;
}

.review-status-panel.is-awaiting-focus #statusDotAwaiting {
  background: var(--brand-primary);
  opacity: 1.0;
}

/* Subtle panel surface response on Awaiting focus — quiet local emphasis */
.review-status-panel.is-awaiting-focus {
  background: #F7F7FA;
}

.review-status-panel.is-awaiting-focus #statusAwaiting .status-state-name {
  font-weight: 750;
}

.review-status-panel.is-awaiting-focus #statusAwaiting .status-state-desc {
  opacity: 0.85;
}

/* STATE 3: ACCEPTED PREVIEW */
.review-status-panel.is-previewing-accepted .status-rail-fill {
  transform: scaleY(1);
  opacity: 0.85;
  transition: transform 260ms cubic-bezier(.22, 1, .36, 1), opacity 220ms ease;
}

.review-status-panel.is-previewing-accepted #statusDotAwaiting {
  background: var(--brand-primary);
  opacity: 1.0;
}

.review-status-panel.is-previewing-accepted .status-awaiting {
  opacity: 0.62;
}

.review-status-panel.is-previewing-accepted #statusDotAccepted {
  background: var(--brand-primary);
  opacity: 1.0;
}

.review-status-panel.is-previewing-accepted .status-accepted-name {
  color: var(--text-primary);
  opacity: 1.0;
}

.review-status-panel.is-previewing-accepted .status-accepted .status-state-desc {
  color: var(--text-secondary);
  opacity: 1.0;
}

.review-status-panel.is-previewing-accepted .status-after-label {
  opacity: 0.90;
}

/* ==========================================================================
   MODULE 05: QUOTE → INVOICE CONTINUITY
   V1.3 CONTEXT PERSISTENCE INTERACTION
   DESIGN MODEL: CONTEXT_PERSISTENCE_MODEL
   ========================================================================== */

.sec-continuity {
  position: relative;
  padding: 58px 0 62px 0;
  background: #FFFFFF;
  border-top: 1px solid #EBEBF0;
}

.continuity-layout {
  display: grid;
  grid-template-columns: 1.02fr 1.98fr;
  gap: 56px;
  align-items: center;
}

/* ──────────────────────────────────────────────────────
   LEFT: NARRATIVE COLUMN (~34%)
   Calm editorial statement — no CTA, generous whitespace
   ────────────────────────────────────────────────────── */
.continuity-narrative-col {
  max-width: 440px;
}

/* EDITORIAL EYEBROW */
.continuity-eyebrow-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.continuity-eyebrow-rule {
  width: 18px;
  height: 1.5px;
  background: var(--brand-primary);
  opacity: 0.85;
  border-radius: 1px;
}

.continuity-eyebrow-label {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--brand-primary);
  line-height: 1.3;
}

.continuity-title {
  font-family: 'Geist', var(--font-sans);
  font-size: 2.5rem;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-primary);
  margin-bottom: 24px;
  text-wrap: balance;
}

.continuity-body {
  font-size: 1.05rem;
  line-height: 1.65;
  color: #52525B;
}

.continuity-body p + p {
  margin-top: 14px;
}

/* ──────────────────────────────────────────────────────
   RIGHT: PERSISTENT PROJECT CONTEXT SURFACE (~66%)
   One coherent project workspace.
   Left zone: Persistent Context Backbone (~26-28%)
   Right zone: Document Registers Zone (~72-74%)
   ────────────────────────────────────────────────────── */
.continuity-visual-col {
  position: relative;
}

.project-continuity-surface {
  display: grid;
  grid-template-columns: 248px 1px 1fr;
  background: #FFFFFF;
  border: 1px solid #DCDCE2;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03), 0 8px 26px rgba(0, 0, 0, 0.035);
  cursor: default;
  transition: border-color 240ms ease, box-shadow 240ms ease;
}

/* 1. PERSISTENT CONTEXT BACKBONE (~26-28%) */
.context-backbone-col {
  background: #F8F8FA;
  padding: 30px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;
  transition: background-color 240ms ease;
}

.backbone-header {
  display: flex;
  align-items: center;
}

.backbone-overline {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #71717A;
  transition: color 240ms ease;
}

.backbone-identity {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.backbone-project-name {
  font-size: 13.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--text-primary);
  line-height: 1.25;
  transition: color 240ms ease;
}

.backbone-client-name {
  font-size: 12px;
  font-weight: 500;
  color: #71717A;
  transition: color 240ms ease;
}

.backbone-meta-block {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-top: 18px;
  border-top: 1px solid #EAEAEF;
  transition: border-color 240ms ease, background-color 240ms ease;
}

.backbone-meta-label {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #71717A;
  transition: color 240ms ease;
}

.backbone-meta-value {
  font-size: 12px;
  font-weight: 600;
  color: #52525B;
  transition: color 240ms ease, background-color 240ms ease, transform 240ms ease;
}

/* PRIMARY STRUCTURAL BACKBONE RAIL (THE ONLY STRONG VERTICAL SEAM) */
.context-backbone-rail {
  background: #EAEAEF;
  transition: background-color 240ms ease;
}

/* 2. DOCUMENT REGISTERS ZONE (~72-74%) */
.document-registers-zone {
  display: grid;
  grid-template-columns: 1fr 1px 1.08fr;
  background: #FFFFFF;
  align-items: stretch;
}

/* REGISTER FLOW DIVIDER (QUIET, DEMOTED EDITORIAL SEPARATION) */
.register-flow-divider {
  background: #F2F2F6;
  margin: 20px 0;
  transition: background-color 240ms ease;
}

/* DOCUMENT REGISTERS */
.document-register {
  padding: 30px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #FFFFFF;
  transition: opacity 240ms ease, background-color 240ms ease;
}

.register-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
}

.register-type-label {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: #52525B;
  transition: color 240ms ease;
}

.register-status {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition: color 240ms ease, border-color 240ms ease, background-color 240ms ease;
}

.status-accepted-tag {
  color: var(--brand-primary);
  display: inline-flex;
  align-items: center;
  gap: 4.5px;
}

.status-accepted-tag::before {
  content: '';
  display: inline-block;
  width: 4.5px;
  height: 4.5px;
  border-radius: 50%;
  background: var(--brand-primary);
  transition: transform 240ms ease, box-shadow 240ms ease;
}

.status-draft-tag {
  color: #71717A;
}

/* REGISTER STRUCTURAL RESOLUTION RULE (PRIMARY MOTION) */
.register-structural-rule {
  height: 1px;
  background: #EAEAEF;
  position: relative;
  overflow: hidden;
  margin-bottom: 6px;
}

.register-rule-fill {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--brand-primary);
  transform-origin: left center;
  transform: scaleX(0);
  opacity: 0.85;
  transition: transform 260ms cubic-bezier(.22, 1, .36, 1);
}

.register-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.register-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  transition: transform 240ms ease;
}

.register-field-label {
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #71717A;
  transition: color 240ms ease;
}

.register-field-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.4;
  transition: transform 240ms ease, color 240ms ease;
}

.register-field-value strong {
  font-weight: 700;
  color: var(--text-primary);
}

.context-origin-text {
  color: var(--brand-primary);
  font-weight: 600;
  font-size: 12.5px;
  transition: color 240ms ease, transform 240ms ease, text-shadow 240ms ease;
}

/* ──────────────────────────────────────────────────────
   INTERACTION STATES IMPLEMENTATION
   ────────────────────────────────────────────────────── */

/* STATE 1: DIRECT CONTEXT FOCUS (.is-context-focus) */
.project-continuity-surface.is-context-focus {
  border-color: #CDCDD6;
}

.project-continuity-surface.is-context-focus .context-backbone-col {
  background: #F4F4FA;
}

.project-continuity-surface.is-context-focus .backbone-overline {
  color: var(--brand-primary);
}

.project-continuity-surface.is-context-focus .backbone-meta-value {
  color: var(--brand-primary);
}

.project-continuity-surface.is-context-focus .context-backbone-rail {
  background: rgba(79, 70, 229, 0.28);
}

.project-continuity-surface.is-context-focus .document-register {
  opacity: 0.96;
}

/* STATE 2: QUOTE FOCUS (.is-quote-focus) */
.project-continuity-surface.is-quote-focus {
  border-color: #CDCDD6;
}

.project-continuity-surface.is-quote-focus .register-quote {
  background: #FCFCFE;
}

.project-continuity-surface.is-quote-focus .register-quote .register-type-label {
  color: var(--brand-primary);
}

.project-continuity-surface.is-quote-focus .register-quote .register-rule-fill {
  transform: scaleX(1);
}

.project-continuity-surface.is-quote-focus .register-quote .register-field-value {
  transform: translateX(2px);
}

.project-continuity-surface.is-quote-focus .register-invoice {
  opacity: 0.92;
}

/* Persistent Context Reinforcement during Quote Focus */
.project-continuity-surface.is-quote-focus .context-backbone-col {
  background: #F7F7FA;
}

.project-continuity-surface.is-quote-focus .backbone-overline {
  color: #71717A;
}

.project-continuity-surface.is-quote-focus .backbone-meta-value {
  color: var(--text-primary);
}

.project-continuity-surface.is-quote-focus .context-backbone-rail {
  background: rgba(79, 70, 229, 0.16);
}

/* STATE 3: INVOICE FOCUS (.is-invoice-focus) */
.project-continuity-surface.is-invoice-focus {
  border-color: #CDCDD6;
}

.project-continuity-surface.is-invoice-focus .register-invoice {
  background: #FCFCFE;
}

.project-continuity-surface.is-invoice-focus .register-invoice .register-type-label {
  color: var(--brand-primary);
}

.project-continuity-surface.is-invoice-focus .register-invoice .register-rule-fill {
  transform: scaleX(1);
}

.project-continuity-surface.is-invoice-focus .register-invoice .register-field-value {
  transform: translateX(2px);
}

.project-continuity-surface.is-invoice-focus .register-quote {
  opacity: 0.92;
}

/* Persistent Context Reinforcement during Invoice Focus */
.project-continuity-surface.is-invoice-focus .context-backbone-col {
  background: #F7F7FA;
}

.project-continuity-surface.is-invoice-focus .backbone-overline {
  color: #71717A;
}

.project-continuity-surface.is-invoice-focus .backbone-meta-value {
  color: var(--text-primary);
}

.project-continuity-surface.is-invoice-focus .context-backbone-rail {
  background: rgba(79, 70, 229, 0.16);
}

/* STATE 4: SPECIAL CROSS-REFERENCE INTERACTION (.is-cross-reference) */
.project-continuity-surface.is-cross-reference {
  border-color: #CDCDD6;
}

.project-continuity-surface.is-cross-reference .register-invoice {
  background: #FCFCFE;
}

.project-continuity-surface.is-cross-reference .register-invoice .register-rule-fill {
  transform: scaleX(1);
}

/* Primary: Invoice's Based on agreed quote */
.project-continuity-surface.is-cross-reference .context-origin-text {
  transform: translateX(3px);
  color: var(--brand-primary);
  font-weight: 700;
  text-shadow: 0 0 12px rgba(79, 70, 229, 0.18);
}

/* Secondary: Project Context's RECORD / Agreed Quote */
.project-continuity-surface.is-cross-reference .context-backbone-col {
  background: #F4F4FA;
}

.project-continuity-surface.is-cross-reference .backbone-meta-value {
  color: var(--brand-primary);
  font-weight: 700;
}

.project-continuity-surface.is-cross-reference .context-backbone-rail {
  background: rgba(79, 70, 229, 0.32);
}

/* Tertiary: Quote's Accepted */
.project-continuity-surface.is-cross-reference .status-accepted-tag {
  color: var(--brand-primary);
  font-weight: 800;
}

.project-continuity-surface.is-cross-reference .status-accepted-tag::before {
  transform: scale(1.3);
  box-shadow: 0 0 6px rgba(79, 70, 229, 0.4);
}

/* ==========================================================================
   MODULE 06: PHOTOGRAPHY USE CASES
   V1.2 SCOPE FINGERPRINT ATTENTION MODEL
   DESIGN MODEL: SCOPE_FINGERPRINT_ATTENTION_MODEL
   ========================================================================== */

.sec-usecases {
  position: relative;
  padding: 68px 0 78px 0;
  background: #FAFBFD;
  border-top: 1px solid #EBEBF0;
}

.usecases-container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 32px;
}

/* EDITORIAL MODULE HEADER */
.usecases-header {
  max-width: 720px;
  margin-bottom: 48px;
}

.usecases-eyebrow-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 22px;
}

.usecases-eyebrow-rule {
  width: 18px;
  height: 1.5px;
  background: var(--brand-primary);
  opacity: 0.85;
  border-radius: 1px;
}

.usecases-eyebrow-label {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--brand-primary);
  line-height: 1.3;
}

.usecases-title {
  font-family: 'Geist', var(--font-sans);
  font-size: 2.75rem;
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  margin-bottom: 24px;
  text-wrap: balance;
}

.usecases-body {
  font-size: 1.0625rem;
  line-height: 1.68;
  color: #52525B;
  max-width: 680px;
}

.usecases-body p + p {
  margin-top: 14px;
}

/* EDITORIAL SCOPE FINGERPRINT REGISTER (OPEN REGISTER SURFACE) */
.editorial-scope-register {
  position: relative;
  width: 100%;
}

/* TOP / BOTTOM STRUCTURAL REGISTER RULES */
.register-boundary-rule {
  position: relative;
  width: 100%;
}

.register-boundary-rule.top-rule {
  height: 1px;
  background: #18181B;
  margin-bottom: 0;
}

.boundary-datum-mark {
  position: absolute;
  top: -1px;
  left: 0;
  width: 8px;
  height: 3px;
  background: var(--brand-primary);
  border-radius: 0.5px;
}

.register-boundary-rule.bottom-rule {
  height: 1px;
  background: #DCDCE2;
  margin-top: 0;
}

.scope-register-entries {
  display: flex;
  flex-direction: column;
}

/* REGISTER ROW */
.scope-register-row {
  display: grid;
  grid-template-columns: 48px 300px 1fr;
  align-items: center;
  padding: 30px 8px;
  cursor: default;
  transition: opacity 220ms ease;
}

/* Inactive Row Softening when Register has Attention */
.scope-register-entries.has-attention .scope-register-row:not(.is-active) {
  opacity: 0.92;
}

/* INDEX LANE */
.row-index-lane {
  display: flex;
  align-items: center;
  gap: 8px;
}

.index-num {
  font-family: 'Geist Mono', var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #71717A;
  transition: color 200ms ease;
}

.index-registration-tick {
  width: 3.5px;
  height: 3.5px;
  border-radius: 0.5px;
  background: #E4E4EB;
  display: inline-block;
  transition: background-color 200ms ease, transform 200ms cubic-bezier(.22,1,.36,1), box-shadow 200ms ease;
}

/* USE CASE TITLE ZONE */
.row-title-zone {
  padding-right: 24px;
}

.row-usecase-title {
  font-family: 'Geist', var(--font-sans);
  font-size: 14.5px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.25;
  transition: color 200ms ease;
}

/* SCOPE FINGERPRINT RAIL */
.row-fingerprint-rail {
  display: flex;
  align-items: center;
  width: 100%;
  transition: transform 240ms cubic-bezier(.22,1,.36,1);
}

.fingerprint-anchor {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}

.anchor-tick {
  width: 3px;
  height: 3px;
  background: #C4C4CD;
  border-radius: 0.5px;
  display: inline-block;
  transition: background-color 220ms ease, transform 220ms cubic-bezier(.22,1,.36,1);
}

.anchor-term {
  font-size: 13.5px;
  font-weight: 500;
  color: #374151;
  letter-spacing: -0.005em;
  white-space: nowrap;
  transition: color 220ms ease, font-weight 220ms ease;
}

.fingerprint-rail-segment {
  position: relative;
  flex: 1 1 auto;
  height: 1px;
  background: #E8E8EE;
  margin: 0 14px;
  min-width: 16px;
  overflow: hidden;
}

.fingerprint-rail-segment::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(79, 70, 229, 0.45);
  transform-origin: left center;
  transform: scaleX(0);
  transition: transform 260ms cubic-bezier(.22, 1, .36, 1), background-color 260ms ease;
}

/* INTERNAL ROW SEPARATOR */
.register-row-divider {
  height: 1px;
  background: #EBEBF0;
  margin-left: 48px;
}

/* ==========================================================================
   ACTIVE ROW ATTENTION STATE
   ========================================================================== */

.scope-register-row.is-active {
  opacity: 1 !important;
}

.scope-register-row.is-active .index-num {
  color: #18181B;
}

.scope-register-row.is-active .index-registration-tick {
  background: var(--brand-primary);
  transform: scale(1.2);
}

.scope-register-row.is-active .row-usecase-title {
  color: #09090B;
}

.scope-register-row.is-active .row-fingerprint-rail {
  transform: translateX(2px);
}

.scope-register-row.is-active .anchor-tick {
  background: var(--brand-primary);
  transform: scale(1.25);
}

.scope-register-row.is-active .anchor-term {
  color: #09090B;
  font-weight: 600;
}

.scope-register-row.is-active .fingerprint-rail-segment::after {
  transform: scaleX(1);
}

/* ACCESSIBILITY & COARSE POINTERS */
@media (prefers-reduced-motion: reduce) {
  .scope-register-row,
  .index-num,
  .index-registration-tick,
  .row-usecase-title,
  .row-fingerprint-rail,
  .anchor-tick,
  .anchor-term,
  .fingerprint-rail-segment::after {
    transition: none !important;
  }
}

@media (pointer: coarse) {
  .scope-register-entries.has-attention .scope-register-row:not(.is-active) {
    opacity: 1 !important;
  }
}

/* ==========================================================================
   MODULE 07: CLARITY STATEMENT
   QUIET EDITORIAL PAUSE — STATIC DESIGN
   DESIGN MODEL: QUIET_EDITORIAL_PAUSE
   ========================================================================== */

.sec-clarity {
  position: relative;
  padding: 96px 0 88px 0;
  background: #FFFFFF;
  border-top: 1px solid #EBEBF0;
}

.clarity-container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 32px;
}

.clarity-statement-composition {
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* EDITORIAL EYEBROW */
.clarity-eyebrow-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.clarity-eyebrow-rule {
  width: 18px;
  height: 1.5px;
  background: var(--brand-primary);
  opacity: 0.85;
  border-radius: 1px;
}

.clarity-eyebrow-label {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--brand-primary);
  line-height: 1.3;
}

/* PRIMARY STATEMENT H2 */
.clarity-statement-title {
  font-family: 'Geist', var(--font-sans);
  font-size: 3.125rem;
  line-height: 1.14;
  font-weight: 800;
  letter-spacing: -0.035em;
  color: var(--text-primary);
  max-width: 820px;
  margin: 0 0 40px 0;
  text-wrap: balance;
}

/* STRUCTURAL EDITORIAL DATUM LINE */
.clarity-datum-seam {
  position: relative;
  width: 100%;
  height: 1px;
  background: #F1F1F4;
  margin-bottom: 38px;
}

.clarity-datum-accent {
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 1px;
  background: var(--brand-primary);
  opacity: 0.70;
}

/* OFFSET EDITORIAL BODY COPY */
.clarity-body-wrapper {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.clarity-body-content {
  max-width: 520px;
  font-size: 1.125rem;
  line-height: 1.72;
  color: #4B5563;
  font-weight: 400;
}

.clarity-body-content p + p {
  margin-top: 16px;
}

/* ==========================================================================
   MODULE 08: FINAL CTA
   CLOSING ACTION FRAME
   DESIGN MODEL: CLOSING_ACTION_FRAME
   ========================================================================== */

.sec-final-cta {
  position: relative;
  padding: 78px 0 60px 0;
  background: #0B0F19;
  color: #FFFFFF;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.final-cta-container {
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 32px;
}

.final-cta-frame {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 64px;
  align-items: flex-end;
  margin-bottom: 40px;
}

/* LEFT EDITORIAL CONTENT ZONE */
.final-cta-content-zone {
  max-width: 720px;
}

.final-cta-eyebrow-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.final-cta-eyebrow-rule {
  width: 18px;
  height: 1.5px;
  background: #818CF8;
  opacity: 0.9;
  border-radius: 1px;
}

.final-cta-eyebrow-label {
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #A5B4FC;
  line-height: 1.3;
}

.final-cta-title {
  font-family: 'Geist', var(--font-sans);
  font-size: 3.25rem;
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -0.035em;
  color: #FFFFFF;
  margin: 0 0 24px 0;
  text-wrap: balance;
}

.final-cta-body {
  font-size: 1.125rem;
  line-height: 1.68;
  color: #9CA3AF;
  max-width: 520px;
}

/* RIGHT ACTION ZONE */
.final-cta-action-zone {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding-bottom: 4px;
}

.final-cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 52px;
  padding: 0 32px;
  background: var(--brand-primary);
  color: #FFFFFF;
  font-family: 'Geist', var(--font-sans);
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.18);
  transition: background-color 180ms ease, box-shadow 180ms ease;
  cursor: pointer;
  white-space: nowrap;
}

.final-cta-btn:hover {
  background: #4338CA;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.32), 0 4px 12px rgba(0, 0, 0, 0.22);
}

.final-cta-btn:focus-visible {
  outline: 2px solid #818CF8;
  outline-offset: 3px;
}

.cta-arrow-icon {
  width: 15px;
  height: 15px;
  transition: transform 180ms ease;
}

.final-cta-btn:hover .cta-arrow-icon {
  transform: translateX(2px);
}

/* STRUCTURAL CLOSING DATUM RULE */
.final-cta-bottom-seam {
  position: relative;
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}

.final-cta-datum-tick {
  position: absolute;
  top: 0;
  left: 0;
  width: 24px;
  height: 1px;
  background: #818CF8;
  opacity: 0.8;
}

/* ==========================================================================
   GLOBAL SITE FOOTER (ACTIVE HOME-01 SharedFooter authority)
   ========================================================================== */

.site-footer-global {
  position: relative;
  background: #FAFBFD;
  border-top: 1px solid var(--border-subtle);
  padding: 54px 0 44px 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.footer-container {
  display: flex;
  flex-direction: column;
}

/* TOP 4-COLUMN MAIN GRID */
.footer-main-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 48px;
}

.footer-brand-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: 340px;
}

.footer-brand-logo {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  margin-bottom: 14px;
}

.footer-brand-logo .wordmark {
  font-family: 'Geist', var(--font-sans);
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.035em;
  color: var(--text-primary);
}

.footer-brand-desc {
  font-size: 0.84375rem;
  line-height: 1.6;
  color: #6B7280;
  margin: 0 0 16px 0;
}

.footer-sign-in-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.84375rem;
  font-weight: 600;
  color: var(--brand-primary);
  text-decoration: none;
  transition: color 150ms ease;
}

.footer-sign-in-link:hover {
  color: var(--brand-hover);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.footer-link-arrow {
  transition: transform 150ms ease;
}

.footer-sign-in-link:hover .footer-link-arrow {
  transform: translateX(2px);
}

.footer-nav-col {
  display: flex;
  flex-direction: column;
}

.footer-col-title {
  font-family: 'Geist', var(--font-sans);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  margin: 0 0 16px 0;
}

.footer-link-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.footer-link-list a {
  color: #6B7280;
  text-decoration: none;
  font-size: 0.84375rem;
  transition: color 150ms ease;
}

.footer-link-list a:hover {
  color: var(--text-primary);
}

/* MIDDLE: TRUST STRIP */
.footer-trust-strip {
  border-top: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
  padding: 28px 0;
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.trust-strip-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.trust-strip-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 0.8125rem;
  color: #4B5563;
  font-weight: 500;
}

.trust-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.badge-icon {
  font-size: 0.875rem;
}

.trust-strip-fineprint {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trust-strip-fineprint p {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.55;
  color: #9CA3AF;
  max-width: 880px;
}

/* BOTTOM COPYRIGHT ROW */
.footer-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
  color: #9CA3AF;
}

.footer-copyright {
  font-size: 0.8125rem;
}

.footer-legal-links {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-legal-links a {
  color: #9CA3AF;
  text-decoration: none;
  transition: color 150ms ease;
}

.footer-legal-links a:hover {
  color: var(--text-primary);
}

.footer-legal-divider {
  color: #D1D5DB;
}

/* Active HOME SharedFooter alignment. The legacy declarations above are kept
   temporarily for audit traceability; these rules own the integrated DOM. */
.site-footer-global {
  background-color: var(--bg-surface, #FAFBFD);
  border-top: 1px solid var(--border, #E4E4E7);
  padding: 50px 0 40px;
  color: var(--text-muted, #71717A);
  font-size: 0.85rem;
}
.footer-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.footer-main-grid {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px; margin-bottom: 40px; text-align: left;
}
.footer-brand-col { gap: 12px; max-width: none; }
.footer-brand-logo { margin-bottom: 0; }
.footer-brand-logo .wordmark { font-size: 1.2rem; letter-spacing: -0.03em; }
.footer-brand-desc { font-size: 0.8rem; line-height: 1.5; color: var(--text-muted, #71717A); margin: 0; }
.footer-col-title { font-family: inherit; font-size: 0.9rem; color: var(--text-main, #18181B); }
.footer-link-list { gap: 10px; }
.footer-link-list a { color: var(--text-muted, #71717A); font-size: 0.85rem; }
.footer-link-list a:hover { color: var(--text-main, #18181B); }
.footer-newsletter-row {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 24px 0; margin: 20px 0; display: flex; justify-content: space-between;
  align-items: center; flex-wrap: wrap; gap: 16px;
}
.newsletter-text-col { max-width: 480px; }
.newsletter-title { color: var(--text-main, #18181B); font-size: 0.85rem; font-weight: 700; margin: 0 0 4px; }
.newsletter-desc { font-size: 0.75rem; color: var(--text-muted, #71717A); margin: 0; }
.footer-newsletter-form { display: flex; gap: 8px; }
.newsletter-input {
  padding: 6px 12px; background: rgba(0, 0, 0, 0.025); border: 1px solid var(--border, #E4E4E7);
  border-radius: 8px; font-size: 0.85rem; color: var(--text-main, #18181B); min-width: 200px;
}
.newsletter-input:focus { border-color: var(--brand-primary); outline: 2px solid transparent; }
.newsletter-submit-btn {
  padding: 6px 14px; background: var(--brand-primary); color: #FFF; font-weight: 600;
  font-size: 0.85rem; border-radius: 8px; border: 0; cursor: pointer;
}
.newsletter-submit-btn:hover { background: var(--brand-hover, #4338CA); }
.footer-trust-strip {
  border-top: 1px solid var(--border, #E4E4E7); border-bottom: 0; padding: 20px 0 0;
  margin: 20px 0 0; align-items: center; gap: 12px; width: 100%; text-align: center;
}
.trust-strip-title { font-size: 0.85rem; color: var(--text-main, #18181B); }
.trust-strip-badges {
  justify-content: center; gap: 24px; font-size: 0.75rem; color: var(--text-muted, #71717A);
  font-weight: 550; margin-bottom: 10px;
}
.trust-strip-fineprint p { max-width: 720px; font-size: 0.74rem; color: var(--text-muted, #71717A); }
.footer-copyright-row {
  border-top: 1px solid var(--border, #E4E4E7); padding-top: 20px; text-align: center;
  font-size: 0.8rem; color: var(--text-muted, #71717A);
}
.footer-copyright-row p { margin: 0; }
.footer-tagline-divider {
  margin-left: 12px; color: var(--text-muted, #71717A);
  border-left: 1px solid var(--border, #E4E4E7); padding-left: 12px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ======================================================================
   CODEX-02 — RENDERED HOME FOOTER PARITY + PAGE-LEVEL SECTION FUSION
   Scope: surface handoffs, boundary ownership, and the global shell only.
   Module internals and interaction models remain frozen.
   ====================================================================== */

/* Soft / medium / pause / strong hierarchy: each handoff is led by a
   surface shift or space, never a redundant section rule. */
.sec-hero {
  padding-bottom: 60px;
  border-bottom: 0;
}

.sec-workflow {
  padding-top: 62px;
  padding-bottom: 48px;
}

/* 02 → 03: a shared foundation surface, with one continuous reading field. */
.sec-scope-clarity {
  background: #FFFFFF;
  border-top: 0;
  padding-top: 48px;
  padding-bottom: 50px;
}

/* 03 → 04: surface shift only; 04 → 05: one shared project-workflow field. */
.sec-client-approval {
  border-top: 0;
  padding-top: 50px;
  padding-bottom: 52px;
}

.sec-continuity {
  background: #F7F7F9;
  border-top: 0;
  padding-top: 52px;
  padding-bottom: 22px;
}

/* 05 → 06 widens the camera by surface and measured breathing space. */
.sec-usecases {
  border-top: 0;
  padding-top: 58px;
  padding-bottom: 74px;
}

/* 06 → 07 retains the intentional editorial pause without a hard rule. */
.sec-clarity {
  border-top: 0;
  padding-top: 78px;
  padding-bottom: 76px;
}

/* 07 → 08 remains the decisive white-to-dark close. */
.sec-final-cta {
  padding-top: 66px;
}

/* CODEX-02.1: exact HOME-01 final QA V1C global Footer authority. */
.site-footer-home01 { background:#fff; border-top:1px solid rgba(0,0,0,.06); padding:52px 24px 0; position:relative; color:#64748b; font-family:Geist,Inter,sans-serif; }
.footer-inner-home01 { max-width:1200px; margin:0 auto; }
.footer-grid-home01 { display:grid; grid-template-columns:30% repeat(3,1fr); gap:40px 48px; margin-bottom:40px; align-items:start; }
.footer-brand-home01 { display:flex; flex-direction:column; gap:14px; }
.footer-wordmark-home01 { color:#0b0f19; display:inline-block; font-size:1.05rem; font-weight:900; letter-spacing:-.035em; line-height:1; text-decoration:none; transition:color .18s ease; }
.footer-wordmark-home01:hover { color:#4f46e5; }
.footer-brand-home01 p { color:#64748b; font-size:.84rem; line-height:1.55; margin:0; max-width:256px; }
.footer-signin-home01 { color:#64748b; display:inline-flex; font-size:.84rem; font-weight:500; gap:4px; margin-top:2px; text-decoration:none; transition:color .18s ease; }
.footer-signin-home01:hover,.footer-nav-home01 a:hover,.footer-trust-home01 a:hover,.footer-bottom-home01 a:hover { color:#0b0f19; }
.footer-nav-home01 { display:flex; flex-direction:column; }
.footer-nav-home01 h3 { color:#0b0f19; font-size:.72rem; font-weight:700; letter-spacing:.085em; margin:0 0 15px; text-transform:uppercase; }
.footer-nav-home01 ul { display:flex; flex-direction:column; gap:11px; list-style:none; margin:0; padding:0; }
.footer-nav-home01 a { color:#64748b; display:inline-block; font-size:.875rem; text-decoration:none; transition:color .18s ease,transform .14s ease; }
.footer-nav-home01 a:hover { transform:translateX(2px); }
.footer-trust-home01 { align-items:flex-start; border-top:1px solid rgba(15,23,42,.08); display:flex; flex-wrap:wrap; gap:0; padding:20px 0 22px; }
.footer-trust-home01 > span { color:#64748b; flex:1 1 220px; font-size:.8rem; line-height:1.5; padding-right:28px; }
.footer-trust-home01 i { align-self:center; background:rgba(15,23,42,.10); flex-shrink:0; height:2.4em; margin-right:28px; width:1px; }
.footer-trust-home01 a { color:#64748b; font-size:.8rem; text-decoration:none; transition:color .18s ease; }
.footer-bottom-home01 { align-items:center; border-top:1px solid rgba(15,23,42,.08); display:flex; font-size:.78rem; justify-content:space-between; padding:16px 0 24px; }
.footer-bottom-home01 span,.footer-bottom-home01 a { color:#64748b; text-decoration:none; }
.footer-bottom-home01 div { display:flex; gap:20px; }
@media (prefers-reduced-motion: reduce) { .site-footer-home01 a { transition:none; } }

/* ==========================================================================
   CODEX-04 RESPONSIVE FOUNDATION — HEADER / M01 / M02 ONLY
   Breakpoints are structural: they are introduced where the frozen two-column
   composition or the single-row header no longer has enough readable width.
   Desktop authority (1280px and 1440px) is intentionally untouched.
   ========================================================================== */

/* 1100px: header spacing begins to compete with labels; the hero keeps two
   readable columns with a tighter local gap. */
@media (max-width: 1100px) {
  .site-header { padding-left: 24px; padding-right: 24px; }
  .header-actions { gap: 10px; }
  .hero-layout { gap: 36px; }
  .hero-title { font-size: 3rem; }
  .artifact-doc-header, .artifact-scope-summary, .artifact-body-sections { padding-left: 22px; padding-right: 22px; }
  .transformation-layout, .section-structural-divider, .lower-phase-band { max-width: 900px; }
  .phase-band-grid { gap: 28px; }
}

/* 820px: two hero columns no longer preserve an intelligible artifact and
   the workflow's left/right transformation becomes a narrow reading trap. */
@media (max-width: 820px) {
  .site-header { min-height: 64px; height: auto; flex-wrap: wrap; row-gap: 4px; padding-top: 10px; padding-bottom: 10px; }
  .main-nav { order: 3; flex: 1 0 100%; justify-content: center; flex-wrap: wrap; column-gap: 14px; row-gap: 2px; }
  .hero-layout { grid-template-columns: 1fr; gap: 44px; align-items: start; }
  .hero-copy-col { max-width: 680px; }
  .hero-ui-col { width: min(100%, 680px); }
  .sec-hero { padding-top: 64px; }
  .hero-drafting-field { opacity: 0.55; }
  .transformation-layout { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto; grid-template-areas: "inquiry-label" "inquiry" "connector" "scope-label" "scope"; gap: 12px; max-width: 680px; }
  .inquiry-label-row { grid-area: inquiry-label; justify-content: flex-start; }
  .inquiry-col { grid-area: inquiry; align-items: flex-start; text-align: left; }
  .connector-col { grid-area: connector; margin: 2px 0 4px; }
  .connector-line-wrapper { width: 72px; height: 24px; transform: rotate(90deg); margin: 0 auto; }
  .scope-label-row { grid-area: scope-label; justify-content: flex-start; }
  .scope-col { grid-area: scope; margin-top: 0; }
  .section-structural-divider, .lower-phase-band { max-width: 680px; }
  .phase-band-grid { grid-template-columns: 1fr; gap: 26px; }
  .phase-group-col { align-items: flex-start; text-align: left; }
}

/* 560px: compact header baseline and readable document values. */
@media (max-width: 560px) {
  .site-header { padding-left: 16px; padding-right: 16px; }
  .main-nav { column-gap: 8px; }
  .nav-link, .nav-disclosure-btn { font-size: 0.8rem; padding-left: 3px; padding-right: 3px; }
  .header-actions { gap: 8px; }
  .text-link { font-size: 0.8rem; }
  .btn-primary-header { padding-left: 13px; padding-right: 13px; font-size: 0.8rem; }
  .container { padding-left: 18px; padding-right: 18px; }
  .sec-hero { padding-top: 50px; padding-bottom: 52px; }
  .hero-title { font-size: clamp(2.35rem, 10vw, 2.8rem); }
  .hero-body { font-size: 1rem; }
  .hero-cta-group { align-items: flex-start; flex-direction: column; gap: 14px; }
  .working-quote-artifact { border-radius: 8px; }
  .artifact-doc-header, .artifact-scope-summary, .artifact-body-sections { padding-left: 16px; padding-right: 16px; }
  .artifact-project-name { font-size: 11px; }
  .scope-spec-grid { gap: 8px; }
  .spec-num { font-size: 1.25rem; }
  .spec-label { font-size: 10px; }
  .artifact-section-value { font-size: 12px; }
  .sec-workflow { padding-top: 52px; }
  .workflow-title { font-size: 2rem; }
  .workflow-body { font-size: 1rem; }
  .inquiry-quote-text { font-size: 22px; }
  .fact-text { font-size: 17px; }
}

/* ==========================================================================
   CODEX-06 RESPONSIVE M05 / M06 — SCOPED EXTENSIONS ONLY
   900px: the frozen multi-column compositions no longer preserve readable
   hierarchy. 560px: row internals need a second line without shrinking terms.
   Desktop 1280/1440 remains untouched. No page overflow clipping.
   ========================================================================== */

/* M05: one persistent project surface, with subordinate document registers
   read in Context -> Quote -> Invoice order. */
@media (max-width: 900px) {
  .sec-continuity .continuity-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 36px;
    align-items: start;
  }

  .sec-continuity .continuity-narrative-col {
    max-width: 680px;
  }

  .sec-continuity .project-continuity-surface {
    display: block;
  }

  .sec-continuity .context-backbone-col {
    min-height: 0;
    padding: 26px 24px;
  }

  .sec-continuity .context-backbone-rail {
    width: 100%;
    height: 1px;
  }

  .sec-continuity .document-registers-zone {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .sec-continuity .register-flow-divider {
    height: 1px;
    margin: 0 24px;
  }

  .sec-continuity .document-register {
    padding: 26px 24px;
  }
}

@media (max-width: 560px) {
  .sec-continuity {
    padding-top: 44px;
    padding-bottom: 46px;
  }

  .sec-continuity .continuity-title {
    font-size: clamp(2rem, 9vw, 2.5rem);
  }

  .sec-continuity .continuity-body {
    font-size: 1rem;
  }

  .sec-continuity .context-backbone-col,
  .sec-continuity .document-register {
    padding-left: 16px;
    padding-right: 16px;
  }

  .sec-continuity .context-backbone-col {
    gap: 24px;
    padding-top: 22px;
    padding-bottom: 22px;
  }

  .sec-continuity .backbone-project-name {
    font-size: 12.5px;
  }

  .sec-continuity .document-register {
    padding-top: 22px;
    padding-bottom: 22px;
  }

  .sec-continuity .register-flow-divider {
    margin-left: 16px;
    margin-right: 16px;
  }

  .sec-continuity .register-field-value {
    font-size: 13px;
  }
}

/* M06: each row remains one editorial unit; terms move below the title
   rather than becoming a squeezed fixed-width fingerprint rail. */
@media (max-width: 900px) {
  .sec-usecases .usecases-container {
    max-width: 680px;
  }

  .sec-usecases .scope-register-row {
    grid-template-columns: 48px minmax(0, 1fr);
    align-items: start;
    row-gap: 12px;
    padding: 24px 8px;
  }

  .sec-usecases .row-title-zone,
  .sec-usecases .row-fingerprint-rail {
    grid-column: 2;
  }

  .sec-usecases .row-title-zone {
    padding-right: 0;
  }

  .sec-usecases .row-fingerprint-rail {
    min-width: 0;
    width: 100%;
    flex-wrap: wrap;
    row-gap: 8px;
  }

  .sec-usecases .fingerprint-rail-segment {
    flex: 1 1 24px;
  }
}

@media (max-width: 560px) {
  .sec-usecases {
    padding-top: 44px;
    padding-bottom: 50px;
  }

  .sec-usecases .usecases-container {
    padding-left: 18px;
    padding-right: 18px;
  }

  .sec-usecases .usecases-title {
    font-size: clamp(2.1rem, 9vw, 2.75rem);
  }

  .sec-usecases .usecases-body {
    font-size: 1rem;
  }

  .sec-usecases .usecases-header {
    margin-bottom: 34px;
  }

  .sec-usecases .scope-register-row {
    grid-template-columns: 36px minmax(0, 1fr);
    padding: 20px 4px;
    row-gap: 10px;
  }

  .sec-usecases .row-fingerprint-rail {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 9px 12px;
    align-items: start;
  }

  .sec-usecases .fingerprint-anchor {
    min-width: 0;
  }

  .sec-usecases .anchor-term {
    white-space: normal;
    font-size: 13px;
    line-height: 1.35;
  }

  .sec-usecases .fingerprint-rail-segment {
    display: none;
  }

  .sec-usecases .register-row-divider {
    margin-left: 36px;
  }
}

/* 360px: explicit wrapping for the narrowest tested document header. */
@media (max-width: 360px) {
  .header-actions { gap: 5px; }
  .text-link { font-size: 0.75rem; }
  .btn-primary-header { padding-left: 10px; padding-right: 10px; }
  .main-nav { justify-content: flex-start; }
  .artifact-doc-header { align-items: flex-start; gap: 10px; }
  .artifact-status-tag { flex: 0 0 auto; }
  .scope-spec-grid { gap: 5px; }
  .spec-num { font-size: 1.15rem; }
  .spec-label { font-size: 9.5px; }
}

/* ==========================================================================
   CODEX-05 RESPONSIVE M03 / M04 — SCOPED EXTENSIONS ONLY
   900px is structural: the frozen split layouts no longer leave the ledger
   or client status column enough readable measure. Desktop 1280/1440 remain
   untouched. No page-level overflow clipping is used.
   ========================================================================== */

/* M03: preserve the document ledger while changing reading order. */
@media (max-width: 900px) {
  .sec-scope-clarity .scope-clarity-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 36px;
  }

  .sec-scope-clarity .scope-narrative-col {
    max-width: 680px;
  }

  .sec-scope-clarity .scope-anatomy-col {
    width: 100%;
  }

  .sec-scope-clarity .scope-document-ledger {
    padding: 28px 24px;
  }
}

@media (max-width: 560px) {
  .sec-scope-clarity {
    padding-top: 44px;
    padding-bottom: 46px;
  }

  .sec-scope-clarity .scope-title {
    font-size: clamp(2rem, 9vw, 2.35rem);
  }

  .sec-scope-clarity .scope-body {
    font-size: 1rem;
  }

  .sec-scope-clarity .scope-core-statement {
    margin-bottom: 30px;
  }

  .sec-scope-clarity .scope-document-ledger {
    padding: 22px 16px;
    border-radius: 8px;
  }

  .sec-scope-clarity .ledger-header-bar {
    margin-bottom: 24px;
  }

  .sec-scope-clarity .ledger-project-name {
    font-size: 1rem;
  }

  .sec-scope-clarity .ledger-groups-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 26px;
  }

  .sec-scope-clarity .ledger-group-full-width {
    grid-column: auto;
  }

  .sec-scope-clarity .inline-quiet-list {
    grid-template-columns: minmax(0, 1fr);
    gap: 9px;
  }

  .sec-scope-clarity .ledger-item {
    font-size: 0.95rem;
  }
}

/* M04: the client-review surface remains one document; the status panel
   follows the review content inside that same outer surface. */
@media (max-width: 900px) {
  .sec-client-approval .client-review-surface {
    max-width: 680px;
  }

  .sec-client-approval .review-main-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .sec-client-approval .review-content-area {
    border-right: 0;
  }

  .sec-client-approval .review-status-panel {
    border-top: 1px solid #D8D8DC;
  }
}

@media (max-width: 560px) {
  .sec-client-approval {
    padding-top: 44px;
    padding-bottom: 46px;
  }

  .sec-client-approval .approval-title {
    font-size: 2rem;
  }

  .sec-client-approval .approval-body {
    font-size: 1rem;
  }

  .sec-client-approval .review-doc-header {
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
  }

  .sec-client-approval .review-project-name {
    font-size: 0.78rem;
  }

  .sec-client-approval .review-client-label {
    font-size: 0.75rem;
  }

  .sec-client-approval .review-content-area {
    grid-template-columns: minmax(0, 1fr);
  }

  .sec-client-approval .review-section,
  .sec-client-approval .review-total-section {
    padding-left: 16px;
    padding-right: 16px;
  }

  .sec-client-approval #reviewUsage .review-item-list {
    grid-template-columns: minmax(0, 1fr);
    max-width: none;
  }

  .sec-client-approval .review-status-panel {
    padding: 24px 16px 28px;
  }
}

/* The live HOME / computed styles below are the Footer authority. */
.site-footer-global {
  background-color: #FFFFFF;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  color: #4B5563;
  font-family: Geist, Inter, sans-serif;
  line-height: 1.5;
}

.footer-container { display: block; }
.footer-brand-col { align-items: normal; }
.footer-brand-logo .wordmark,
.footer-col-title,
.newsletter-title { color: #0B0F19; letter-spacing: normal; }
.footer-brand-desc,
.footer-link-list a { color: #4B5563; }
.footer-newsletter-row {
  border-color: rgba(255, 255, 255, 0.04);
}
.newsletter-input {
  font-family: Geist, Inter, sans-serif;
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(0, 0, 0, 0.05);
  color: #0B0F19;
  height: 32px;
}
.newsletter-submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 32px;
  padding: 5.6px 12px;
  border: 1px solid #4338CA;
  border-radius: 8px;
  background: #4338CA;
  font-family: Geist, Inter, sans-serif;
  font-size: 12.8px;
  gap: 8px;
}
.footer-trust-strip {
  border-top-color: rgba(0, 0, 0, 0.05);
}
.trust-strip-title { color: #6B7280; }
.trust-strip-badges {
  color: #4B5563;
}
.trust-badge {
  display: flex;
  flex: 0 0 auto;
  line-height: 18px;
  letter-spacing: -0.22px;
}
.trust-strip-fineprint p { color: #4B5563; }
.footer-copyright-row {
  border-top-color: rgba(0, 0, 0, 0.05);
  color: #4B5563;
}
.footer-tagline-divider {
  color: #4B5563;
  border-left-color: rgba(0, 0, 0, 0.05);
}

/* ACCESSIBILITY & COARSE POINTERS */
@media (prefers-reduced-motion: reduce) {
  .footer-sign-in-link,
  .footer-link-arrow,
  .footer-link-list a,
  .footer-legal-links a {
    transition: none !important;
  }
}

/* ==========================================================================
   CODEX-07 RESPONSIVE CLOSE — mobile shell / M07 / M08 / V1C Footer
   Desktop authority remains above. These rules only activate when the
   single-row desktop shell no longer fits its labels with a readable measure.
   ========================================================================== */
.mobile-menu-btn,
.mobile-nav-panel {
  display: none;
}

.mobile-menu-btn:focus-visible,
.mobile-nav-panel a:focus-visible,
.mobile-nav-group-btn:focus-visible {
  outline: 2px solid var(--brand-primary);
  outline-offset: 2px;
}

@media (max-width: 820px) {
  /* With JavaScript, the compact three-part row replaces wrapping nav rows.
     Without JavaScript, .main-nav remains visible as the semantic fallback. */
  .js .site-header {
    align-items: center;
    column-gap: 0;
    flex-wrap: wrap;
    height: 64px;
    min-height: 64px;
    padding-top: 0;
    padding-bottom: 0;
  }

  .js .site-header.mobile-menu-open { height: auto; }

  .js .main-nav,
  .js .header-actions {
    display: none;
  }

  .js .brand-logo { order: 1; }
  .js .mobile-menu-btn { margin-left: auto; order: 2; }
  .js .mobile-nav-panel { order: 3; }

  .js .mobile-menu-btn {
    align-items: center;
    background: transparent;
    border: 0;
    border-radius: 0;
    color: var(--text-primary);
    cursor: pointer;
    display: inline-flex;
    font: inherit;
    justify-content: center;
    min-height: 44px;
    padding: 0;
    width: 44px;
  }

  .js .mobile-menu-icon { display: grid; gap: 5px; width: 16px; }
  .js .mobile-menu-icon span { background: currentColor; display: block; height: 2px; width: 16px; }

  .js .mobile-nav-panel:not([hidden]) {
    background: var(--surface-header);
    border-top: 1px solid var(--border-header);
    display: grid;
    flex: 1 0 100%;
    gap: 0;
    margin: 8px -24px -10px;
    padding: 8px 24px 14px;
  }

  .mobile-nav-panel > a,
  .mobile-nav-group-btn {
    align-items: center;
    background: transparent;
    border: 0;
    color: var(--text-secondary);
    display: flex;
    font: inherit;
    font-size: 0.95rem;
    font-weight: 600;
    justify-content: flex-start;
    min-height: 44px;
    padding: 0 2px;
    text-decoration: none;
  }

  .mobile-nav-group-btn {
    cursor: pointer;
    width: 100%;
  }

  .mobile-nav-group-btn::after {
    color: var(--text-weak);
    content: '+';
    font-size: 1.1rem;
    font-weight: 400;
    margin-left: auto;
  }

  .mobile-nav-group-btn[aria-expanded="true"]::after { content: '−'; }

  .mobile-nav-group-panel:not([hidden]) {
    border-left: 1px solid rgba(79, 70, 229, 0.28);
    display: grid;
    gap: 2px;
    margin: 0 0 6px 2px;
    padding: 2px 0 4px 14px;
  }

  .mobile-nav-group-panel a {
    color: var(--text-secondary);
    font-size: 0.89rem;
    line-height: 1.35;
    padding: 7px 0;
    text-decoration: none;
  }

  .mobile-nav-panel > a.mobile-nav-cta {
    align-items: center;
    background: var(--brand-primary);
    border-radius: 6px;
    color: #fff;
    display: inline-flex;
    font-size: 0.95rem;
    font-weight: 700;
    justify-content: center;
    margin-top: 8px;
    min-height: 44px;
    padding: 0 16px;
    text-decoration: none;
  }

  .sec-clarity {
    padding-top: 64px;
    padding-bottom: 62px;
  }

  .clarity-container,
  .final-cta-container { padding-left: 24px; padding-right: 24px; }

  .clarity-statement-title {
    font-size: clamp(2.35rem, 6.8vw, 3rem);
    max-width: 680px;
  }

  .clarity-body-wrapper { justify-content: flex-start; }
  .clarity-body-content { max-width: 580px; }

  .sec-final-cta { padding-top: 56px; padding-bottom: 48px; }
  .final-cta-frame { align-items: start; gap: 32px; grid-template-columns: minmax(0, 1fr); margin-bottom: 32px; }
  .final-cta-action-zone { justify-content: flex-start; padding-bottom: 0; }

  .footer-grid-home01 {
    grid-template-columns: minmax(0, 1fr) repeat(3, minmax(0, 1fr));
    gap: 34px 24px;
  }

  .footer-brand-home01 { grid-column: 1 / -1; }
}

@media (max-width: 560px) {
  .js .site-header { padding-left: 16px; padding-right: 16px; }
  .js .mobile-nav-panel:not([hidden]) { margin-left: -16px; margin-right: -16px; padding-left: 16px; padding-right: 16px; }

  .sec-clarity { padding-top: 52px; padding-bottom: 52px; }
  .clarity-container,
  .final-cta-container { padding-left: 18px; padding-right: 18px; }
  .clarity-eyebrow-wrapper { margin-bottom: 18px; }
  .clarity-statement-title { font-size: clamp(2rem, 9.2vw, 2.5rem); line-height: 1.15; margin-bottom: 28px; }
  .clarity-datum-seam { margin-bottom: 28px; }
  .clarity-body-content { font-size: 1rem; line-height: 1.65; }

  .sec-final-cta { padding-top: 48px; padding-bottom: 40px; }
  .final-cta-eyebrow-wrapper { margin-bottom: 18px; }
  .final-cta-title { font-size: clamp(2.25rem, 10vw, 2.7rem); margin-bottom: 18px; }
  .final-cta-body { font-size: 1rem; }
  .final-cta-btn { height: 48px; padding: 0 24px; }

  .site-footer-home01 { padding: 42px 18px 0; }
  .footer-grid-home01 { gap: 30px; grid-template-columns: minmax(0, 1fr); margin-bottom: 34px; }
  .footer-brand-home01 { grid-column: auto; }
  .footer-trust-home01 { display: grid; gap: 14px; padding: 18px 0; }
  .footer-trust-home01 > span { padding-right: 0; }
  .footer-trust-home01 i { display: none; }
  .footer-bottom-home01 { align-items: flex-start; flex-direction: column; gap: 12px; }
  .footer-bottom-home01 div { flex-wrap: wrap; gap: 12px 18px; }
}

/* M08 intentionally stays a calm single action: no purple glow or lift. */
.final-cta-btn,
.final-cta-btn:hover { box-shadow: none; }

@media (prefers-reduced-motion: reduce) {
  .mobile-menu-btn,
  .mobile-nav-panel,
  .mobile-nav-group-btn,
  .mobile-nav-group-panel,
  .final-cta-btn,
  .cta-arrow-icon { transition: none !important; }
}
`;

export default function ForPhotographersV1() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cleanups = [];
    const listen = (target, type, handler) => { target?.addEventListener(type, handler); return () => target?.removeEventListener(type, handler); };

    const disclosurePairs = [['howItWorksBtn', 'howItWorksDropdown'], ['resourcesBtn', 'resourcesDropdown']].map(([buttonId, panelId]) => ({ button: root.querySelector(`#${buttonId}`), panel: root.querySelector(`#${panelId}`) }));
    const closeDisclosures = (focus = false) => disclosurePairs.forEach(({ button, panel }) => { const open = button?.getAttribute('aria-expanded') === 'true'; button?.setAttribute('aria-expanded', 'false'); if (panel) panel.hidden = true; if (focus && open) button?.focus(); });
    disclosurePairs.forEach((pair) => cleanups.push(listen(pair.button, 'click', (event) => { event.stopPropagation(); const open = pair.button.getAttribute('aria-expanded') === 'true'; closeDisclosures(); if (!open) { pair.button.setAttribute('aria-expanded', 'true'); pair.panel.hidden = false; } })));
    cleanups.push(listen(document, 'pointerdown', (event) => { if (!root.contains(event.target) || !event.target.closest('.nav-disclosure')) closeDisclosures(); }));
    cleanups.push(listen(document, 'keydown', (event) => { if (event.key === 'Escape') closeDisclosures(true); }));

    const menuButton = root.querySelector('#mobileMenuButton'); const mobilePanel = root.querySelector('#mobileNavPanel');
    const mobileGroups = [['mobileHowItWorksBtn', 'mobileHowItWorksPanel'], ['mobileResourcesBtn', 'mobileResourcesPanel']].map(([buttonId, panelId]) => ({ button: root.querySelector(`#${buttonId}`), panel: root.querySelector(`#${panelId}`) }));
    const closeMobileGroups = (except) => mobileGroups.forEach(({ button, panel }) => { if (button !== except) { button?.setAttribute('aria-expanded', 'false'); if (panel) panel.hidden = true; } });
    const closeMobile = ({ restoreFocus = false } = {}) => { menuButton?.setAttribute('aria-expanded', 'false'); menuButton?.setAttribute('aria-label', 'Open navigation menu'); if (mobilePanel) mobilePanel.hidden = true; root.querySelector('#siteHeader')?.classList.remove('mobile-menu-open'); closeMobileGroups(); if (restoreFocus) menuButton?.focus(); };
    const openMobile = () => { closeDisclosures(); menuButton?.setAttribute('aria-expanded', 'true'); menuButton?.setAttribute('aria-label', 'Close navigation menu'); if (mobilePanel) mobilePanel.hidden = false; root.querySelector('#siteHeader')?.classList.add('mobile-menu-open'); };
    cleanups.push(listen(menuButton, 'click', (event) => { event.stopPropagation(); mobilePanel?.hidden ? openMobile() : closeMobile(); }));
    mobileGroups.forEach(({ button, panel }) => cleanups.push(listen(button, 'click', (event) => { event.stopPropagation(); const show = panel?.hidden; closeMobileGroups(button); button?.setAttribute('aria-expanded', String(show)); if (panel) panel.hidden = !show; })));
    mobilePanel?.querySelectorAll('a').forEach((link) => cleanups.push(listen(link, 'click', () => closeMobile())));
    cleanups.push(listen(document, 'keydown', (event) => { if (event.key !== 'Escape') return; const openGroup = mobileGroups.find(({ panel }) => panel && !panel.hidden); if (openGroup) { closeMobileGroups(); openGroup.button?.focus(); } else if (mobilePanel && !mobilePanel.hidden) closeMobile({ restoreFocus: true }); }));
    cleanups.push(listen(document, 'pointerdown', (event) => { if (mobilePanel && !mobilePanel.hidden && !root.querySelector('#siteHeader')?.contains(event.target)) closeMobile(); }));

    if (!finePointer.matches || reducedMotion.matches) return () => { closeMobile(); cleanups.forEach((cleanup) => cleanup?.()); };

    const groupsGrid = root.querySelector('.ledger-groups-grid'); const simpleLine = root.querySelector('#simpleQuoteLine'); const matchedDay = root.querySelector('#scopeItemShootDay'); const project = root.querySelector('#groupProject'); const groupBlocks = Array.from(groupsGrid?.querySelectorAll('.ledger-group-block') || []);
    let activeGroup = null; let simpleSource = false;
    const applyM03 = () => { const active = activeGroup || simpleSource; groupsGrid?.classList.toggle('has-active-group', Boolean(active)); groupBlocks.forEach((group) => group.classList.toggle('is-active-group', group === activeGroup)); const cross = simpleSource || activeGroup === project; matchedDay?.classList.toggle('is-matched-target', cross); simpleLine?.classList.toggle('is-active-line', cross); simpleLine?.classList.toggle('is-dimmed-line', Boolean(activeGroup && activeGroup !== project)); };
    cleanups.push(listen(groupsGrid, 'pointermove', (event) => { const group = groupBlocks.find((block) => { const rect = block.getBoundingClientRect(); return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom; }); if (group) { activeGroup = group; simpleSource = false; applyM03(); } }));
    cleanups.push(listen(groupsGrid, 'pointerleave', () => { activeGroup = null; simpleSource = false; applyM03(); }));
    cleanups.push(listen(simpleLine, 'pointerenter', () => { activeGroup = null; simpleSource = true; applyM03(); }));
    cleanups.push(listen(simpleLine, 'pointerleave', () => { simpleSource = false; applyM03(); }));

    const reviewSurface = root.querySelector('#clientReviewSurface'); const reviewContent = root.querySelector('.review-content-area'); const statusPanel = root.querySelector('#approvalStatusPanel'); const awaiting = root.querySelector('#statusAwaiting'); const accepted = root.querySelector('#statusAccepted'); const acceptedWrap = root.querySelector('#statusAcceptedWrapper'); const reviewSections = { REVIEW_SCOPE: root.querySelector('#reviewScope'), REVIEW_DELIVERABLES: root.querySelector('#reviewDeliverables'), REVIEW_USAGE: root.querySelector('#reviewUsage'), REVIEW_TOTAL: root.querySelector('#reviewTotal') };
    const applyM04 = (state) => { const reviewing = state.startsWith('REVIEW_'); reviewContent?.classList.toggle('has-active-review', reviewing); Object.entries(reviewSections).forEach(([key, section]) => section?.classList.toggle('is-active-review', key === state)); statusPanel?.classList.toggle('is-reviewing-awaiting', reviewing); statusPanel?.classList.toggle('is-awaiting-focus', state === 'STATUS_AWAITING_FOCUS'); statusPanel?.classList.toggle('is-previewing-accepted', state === 'STATUS_ACCEPTED_PREVIEW'); acceptedWrap?.classList.toggle('is-accepted-preview', state === 'STATUS_ACCEPTED_PREVIEW'); };
    const statusStateAt = (event) => { const a = awaiting?.getBoundingClientRect(); const acceptedRect = accepted?.getBoundingClientRect(); if (a && acceptedRect && event.clientY >= a.top - 6 && event.clientY <= acceptedRect.bottom + 6) { if (event.clientX >= Math.min(a.left, acceptedRect.left) - 12 && event.clientX <= Math.max(a.right, acceptedRect.right) + 12) return event.clientX >= acceptedRect.left - 8 && event.clientX <= acceptedRect.right + 8 && event.clientY >= acceptedRect.top - 5 && event.clientY <= acceptedRect.bottom + 5 ? 'STATUS_ACCEPTED_PREVIEW' : 'STATUS_AWAITING_FOCUS'; } for (const [key, section] of Object.entries(reviewSections)) { const rect = section?.getBoundingClientRect(); if (rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) return key; } return 'REST'; };
    cleanups.push(listen(reviewSurface, 'pointermove', (event) => applyM04(statusStateAt(event)))); cleanups.push(listen(reviewSurface, 'pointerleave', () => applyM04('REST')));

    const continuity = root.querySelector('#projectContinuitySurface'); const backbone = root.querySelector('#contextBackbone'); const quote = root.querySelector('#continuityQuoteRegister'); const invoice = root.querySelector('#continuityInvoiceRegister'); const contextRow = root.querySelector('#continuityContextRow');
    const applyM05 = (state) => { continuity?.classList.toggle('is-context-focus', state === 'CONTEXT_FOCUS'); continuity?.classList.toggle('is-quote-focus', state === 'QUOTE_FOCUS'); continuity?.classList.toggle('is-invoice-focus', state === 'INVOICE_FOCUS'); continuity?.classList.toggle('is-cross-reference', state === 'INVOICE_CROSS_REFERENCE'); };
    cleanups.push(listen(continuity, 'pointermove', (event) => { const target = event.target; if (contextRow?.contains(target)) applyM05('INVOICE_CROSS_REFERENCE'); else if (backbone?.contains(target)) applyM05('CONTEXT_FOCUS'); else if (quote?.contains(target)) applyM05('QUOTE_FOCUS'); else if (invoice?.contains(target)) applyM05('INVOICE_FOCUS'); })); cleanups.push(listen(continuity, 'pointerleave', () => applyM05('REST')));

    const scopeRegister = root.querySelector('#editorialScopeRegister'); const scopeEntries = root.querySelector('#scopeRegisterEntries'); const usecaseRows = Array.from(root.querySelectorAll('#scopeRegisterEntries .scope-register-row'));
    const applyM06 = (row) => { scopeEntries?.classList.toggle('has-attention', Boolean(row)); usecaseRows.forEach((candidate) => candidate.classList.toggle('is-active', candidate === row)); };
    cleanups.push(listen(scopeRegister, 'pointermove', (event) => { let row = usecaseRows.find((candidate) => candidate.contains(event.target)); if (!row) row = usecaseRows.find((candidate) => { const rect = candidate.getBoundingClientRect(); return event.clientY >= rect.top && event.clientY <= rect.bottom; }); if (!row && usecaseRows.length) row = usecaseRows.reduce((closest, candidate) => Math.abs(candidate.getBoundingClientRect().top + candidate.getBoundingClientRect().height / 2 - event.clientY) < Math.abs(closest.getBoundingClientRect().top + closest.getBoundingClientRect().height / 2 - event.clientY) ? candidate : closest); applyM06(row); })); cleanups.push(listen(scopeRegister, 'pointerleave', () => applyM06(null)));

    // MODULE 02 UPPER TRANSFORMATION — frozen V2.11 pointer synchronization.
    const transformation = root.querySelector('#transformationLayout');
    const inquiry = root.querySelector('#inquiryCol');
    const scope = root.querySelector('#scopeCol');
    const inquiryText = root.querySelector('#inquiryQuoteText');
    const connectorFill = root.querySelector('#connectorSvgFill');
    const arrowhead = root.querySelector('#connectorSvgArrowhead');
    const spine = root.querySelector('#scopeSpine');
    const spineFill = root.querySelector('#spineFill');
    const factItems = ['fact-1', 'fact-2', 'fact-3', 'fact-4'].map((id) => root.querySelector(`#${id}`));
    const factTexts = ['factText1', 'factText2', 'factText3', 'factText4'].map((id) => root.querySelector(`#${id}`));
    const factBranches = ['factBranch1', 'factBranch2', 'factBranch3', 'factBranch4'].map((id) => root.querySelector(`#${id}`));
    let upperMotionDisposed = false;

    if (transformation && connectorFill && arrowhead && spine && spineFill && inquiryText && finePointer.matches && !reducedMotion.matches) {
      let quoteStartX = 0;
      let factEntryX = 0;
      let spineTopY = 0;
      let spineHeight = 1;
      let factBounds = [];
      let factSpineScale = [];
      let targetHProgress = 1;
      let currentHProgress = 1;
      let rawPointerY = 0;
      let isHovering = false;
      let rafId = 0;

      const updateGeometry = () => {
        const quoteRect = inquiryText.getBoundingClientRect();
        const firstFactRect = factTexts[0]?.getBoundingClientRect();
        const fallbackFactRect = firstFactRect || quoteRect;
        const rects = factTexts.map((fact) => fact?.getBoundingClientRect() || fallbackFactRect);
        const spineRect = spine.getBoundingClientRect();

        quoteStartX = quoteRect.left;
        factEntryX = fallbackFactRect.left;
        spineTopY = spineRect.top;
        spineHeight = Math.max(1, spineRect.height);
        factBounds = rects.map((rect) => ({
          top: rect.top,
          center: rect.top + (rect.height / 2),
          bottom: rect.bottom,
        }));
        factSpineScale = factBounds.map((bounds) => Math.max(0, Math.min(1, (bounds.center - spineTopY) / spineHeight)));
      };

      const calculateHorizontalProgress = (pointerX) => {
        if (pointerX <= quoteStartX) return 0;
        if (pointerX >= factEntryX) return 1;
        return (pointerX - quoteStartX) / (factEntryX - quoteStartX);
      };

      const renderVisualState = (horizontalProgress) => {
        const h = Math.max(0, Math.min(1, horizontalProgress));
        inquiry.style.opacity = (isHovering ? 1 - (h * 0.4) : 0.85).toFixed(3);
        scope.style.opacity = '1';

        const bridgeProgress = isHovering ? h : 1;
        const endpointX = bridgeProgress * 120;
        connectorFill.setAttribute('x2', endpointX.toFixed(2));
        arrowhead.setAttribute('transform', `translate(${endpointX.toFixed(2)}, 9)`);
        arrowhead.style.opacity = isHovering && bridgeProgress < 0.03 ? '0' : '1';

        let spineScaleY = 1;
        if (isHovering) {
          if (h < 0.95) {
            spineScaleY = 0;
          } else if (rawPointerY <= (factBounds[0]?.center || 500)) {
            spineScaleY = factSpineScale[0] || 0;
          } else if (rawPointerY >= (factBounds[3]?.center || 650)) {
            spineScaleY = factSpineScale[3] || 0;
          } else {
            spineScaleY = Math.max(0, Math.min(1, (rawPointerY - spineTopY) / spineHeight));
          }
        }
        spineFill.style.transform = `scaleY(${spineScaleY.toFixed(3)})`;

        factBounds.forEach((bounds, index) => {
          let localProgress = 1;
          if (isHovering) {
            if (h < 0.95 || rawPointerY <= bounds.top) {
              localProgress = 0;
            } else if (rawPointerY < bounds.center) {
              const rawLocal = (rawPointerY - bounds.top) / (bounds.center - bounds.top);
              localProgress = rawLocal * rawLocal * (3 - (2 * rawLocal));
            }
          }
          const clampedProgress = Math.max(0, Math.min(1, localProgress));
          const item = factItems[index];
          const branch = factBranches[index];
          if (item) {
            item.style.opacity = (0.35 + (clampedProgress * 0.65)).toFixed(3);
            item.style.transform = `translateX(${(-2 * (1 - clampedProgress)).toFixed(2)}px)`;
          }
          if (branch) {
            branch.style.transform = `scaleX(${clampedProgress.toFixed(3)})`;
            branch.style.backgroundColor = clampedProgress <= 0.05 ? 'var(--border-subtle)' : 'var(--brand-primary)';
          }
        });
      };

      const startRafLoop = () => {
        if (rafId) return;
        const loop = () => {
          const diff = targetHProgress - currentHProgress;
          currentHProgress += diff * 0.25;
          renderVisualState(currentHProgress);
          if (Math.abs(diff) > 0.0005 || isHovering) {
            rafId = window.requestAnimationFrame(loop);
          } else {
            currentHProgress = targetHProgress;
            renderVisualState(currentHProgress);
            rafId = 0;
          }
        };
        rafId = window.requestAnimationFrame(loop);
      };

      updateGeometry();
      renderVisualState(1);
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          if (!upperMotionDisposed) updateGeometry();
        }).catch(() => {});
      }
      cleanups.push(listen(window, 'resize', updateGeometry));
      cleanups.push(listen(transformation, 'mouseenter', (event) => {
        isHovering = true;
        rawPointerY = event.clientY;
        updateGeometry();
        targetHProgress = calculateHorizontalProgress(event.clientX);
        startRafLoop();
      }));
      cleanups.push(listen(transformation, 'mousemove', (event) => {
        rawPointerY = event.clientY;
        targetHProgress = calculateHorizontalProgress(event.clientX);
        startRafLoop();
      }));
      cleanups.push(listen(transformation, 'mouseleave', () => {
        isHovering = false;
        targetHProgress = 1;
        startRafLoop();
      }));
      cleanups.push(() => {
        upperMotionDisposed = true;
        if (rafId) window.cancelAnimationFrame(rafId);
        rafId = 0;
      });
    }

    return () => { upperMotionDisposed = true; closeMobile(); cleanups.forEach((cleanup) => cleanup?.()); };
  }, []);
  return <div data-photographers-v1 ref={rootRef}><PublicHeader route="/for-photographers" /><style>{styles}</style><div dangerouslySetInnerHTML={{ __html: markup }} /></div>;
}
