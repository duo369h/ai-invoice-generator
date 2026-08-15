'use client';

import { useEffect, useRef } from 'react';

const markup = String.raw`

  <!-- 1. FLAT INTEGRATED HEADER (EXACT R2A BASELINE) -->
  <nav class="navbar">
    <a href="/" class="logo-container">
      <span class="logo-wordmark">Corvioz</span>
    </a>

    <button class="mobile-menu-toggle" type="button" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobile-navigation">
      <span></span><span></span><span></span>
    </button>

    <ul class="nav-links">
      <!-- How It Works Dropdown -->
      <li class="nav-link-item" id="nav-item-how">
        <button class="nav-link" id="trigger-how" aria-expanded="false" aria-controls="menu-how">
          How It Works
          <svg class="dropdown-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="dropdown-menu" id="menu-how" aria-labelledby="trigger-how">
          <a href="#how-corvioz-works" class="dropdown-item">Workflow</a>
          <a href="#features" class="dropdown-item">Features</a>
          <a href="#client-journey" class="dropdown-item">Client Journey</a>
        </div>
      </li>

      <!-- Top-Level Items -->
      <li class="nav-link-item">
        <a href="/for-photographers" class="nav-link">For Photographers</a>
      </li>
      <li class="nav-link-item">
        <a href="/pricing" class="nav-link">Pricing</a>
      </li>

      <!-- Resources Dropdown -->
      <li class="nav-link-item" id="nav-item-resources">
        <button class="nav-link" id="trigger-resources" aria-expanded="false" aria-controls="menu-resources">
          Resources
          <svg class="dropdown-icon" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="dropdown-menu" id="menu-resources" aria-labelledby="trigger-resources">
          <a href="#guides" class="dropdown-item">Guides</a>
          <a href="/quote-template" class="dropdown-item">Templates</a>
          <a href="/blog" class="dropdown-item">Blog</a>
          <a href="/help" class="dropdown-item">Help Center</a>
        </div>
      </li>

      <li class="nav-link-item">
        <a href="/security" class="nav-link">Security</a>
      </li>
    </ul>

    <!-- Header Actions -->
    <div class="nav-actions">
      <a href="/dashboard" class="btn-signin-link">Sign in</a>
      <a href="/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote" class="btn-primary-cta">Create Quote</a>
    </div>

    <div class="mobile-navigation" id="mobile-navigation" hidden>
      <div class="mobile-menu-links" aria-label="Mobile navigation">
        <a href="/#how-corvioz-works">How It Works</a>
        <a href="/for-photographers">For Photographers</a>
        <a href="/pricing">Pricing</a>
        <a href="/blog">Resources</a>
        <a href="/security">Security</a>
        <a href="/dashboard">Sign in</a>
        <a href="/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote" class="mobile-menu-cta">Create Quote</a>
      </div>
    </div>
  </nav>

  <!-- 2. FROZEN HERO SECTION (EXACT R2A BASELINE) -->
  <header class="landing-hero">
    <div class="hero-content-center">
      <div class="hero-badge">
        Photography Business Dashboard
      </div>

      <h1 class="hero-title">
        Run every client workflow<br />
        with structure.
      </h1>

      <p class="hero-lede">
        Corvioz helps independent professionals organize quotes, invoices, client documents, and project records in one focused dashboard.
      </p>

      <div class="hero-actions">
        <a href="/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote" class="btn-hero-cta">Create Quote</a>
      </div>

      <div class="hero-trust-line">
        <span>Free to start</span>
        <span class="hero-trust-divider">|</span>
        <span>Built for independent professionals</span>
        <span class="hero-trust-divider">|</span>
        <span>Subscriptions are securely handled through Paddle.</span>
      </div>
    </div>
  </header>

  <!-- 3. HOW CORVIOZ WORKS & UNIFIED WORKFLOW SURFACE (EXACT R2A BASELINE) -->
  <section class="section-how-wrapper" id="how-corvioz-works">
    <div class="section-container">
      
      <div class="section-header">
        <div class="section-kicker">How Corvioz Works</div>
        <h2 class="section-title">Keep the path from quote to payment clear.</h2>
        <p class="section-intro">
          Corvioz helps independent professionals keep quotes, invoices, client records, and payment status connected as work moves forward.
        </p>
      </div>

      <div class="workflow-unified-surface">
        
          <div class="workflow-track-container" id="client-journey">
          <div class="workflow-rail-line">
            <div class="workflow-rail-fill" id="track-rail-fill"></div>
          </div>

          <div class="workflow-nodes-grid" role="group" aria-label="Corvioz 4 Workflow Stages">
            
            <button class="workflow-stage-node-item active" data-stage="1" id="stage-node-1" aria-pressed="true">
              <div class="node-circle">01</div>
              <h3 class="stage-label-name">Quote Sent</h3>
              <p class="stage-label-desc">The quote is with your client for review.</p>
            </button>

            <button class="workflow-stage-node-item" data-stage="2" id="stage-node-2" aria-pressed="false">
              <div class="node-circle">02</div>
              <h3 class="stage-label-name">Client Approved</h3>
              <p class="stage-label-desc">Once the client approves it, keep that decision connected to the next step.</p>
            </button>

            <button class="workflow-stage-node-item" data-stage="3" id="stage-node-3" aria-pressed="false">
              <div class="node-circle">03</div>
              <h3 class="stage-label-name">Ready to Invoice</h3>
              <p class="stage-label-desc">When it is time to invoice, convert the approved quote into an invoice.</p>
            </button>

            <button class="workflow-stage-node-item" data-stage="4" id="stage-node-4" aria-pressed="false">
              <div class="node-circle">04</div>
              <h3 class="stage-label-name">Payment Recorded</h3>
              <p class="stage-label-desc">Record payment status and keep the history with the client.</p>
            </button>

          </div>
        </div>

        <div class="product-evidence-card" id="features">
          <div class="preview-topbar">
            <div class="window-dots">
              <span class="dot-red"></span>
              <span class="dot-yellow"></span>
              <span class="dot-green"></span>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span>PROJECT: Northline Studio Commercial Shoot</span>
              <span class="preview-meta-stage badge-stage-1" id="preview-meta-pill">STAGE 1: QUOTE SENT</span>
            </div>
          </div>

          <div class="preview-body-layout">
            <div class="preview-sidebar">
              <div class="sidebar-label">Workflow Context</div>
              <div class="sidebar-item active" id="sb-item-1">Quote #Q-2026-084</div>
              <div class="sidebar-item" id="sb-item-2">Approved Baseline</div>
              <div class="sidebar-item" id="sb-item-3">Ready to Invoice</div>
              <div class="sidebar-item" id="sb-item-4">Payment History</div>
            </div>

            <div class="preview-main-document">
              <div class="doc-header-flex">
                <div>
                  <div class="doc-title" id="doc-title-text">Commercial Photography Quote #Q-2026-084</div>
                  <div class="doc-subtitle" id="doc-sub-text">Prepared for Maya Chen / Northline Studio • Sent Aug 10, 2026</div>
                </div>
                <div class="doc-status-pill badge-stage-1" id="doc-status-badge">
                  Quote Sent
                </div>
              </div>

              <div class="mobile-document-summary" aria-label="Current document summary">
                <span class="mobile-document-type" id="mobile-doc-type">Quote</span>
                <strong class="mobile-document-id" id="mobile-doc-id">Q-2026-084</strong>
                <strong class="mobile-document-total" id="mobile-doc-total">$4,800.00</strong>
                <span class="mobile-document-context" id="mobile-doc-context">Northline Studio</span>
                <span class="mobile-document-status" id="mobile-doc-status">Quote Sent</span>
              </div>

              <table class="doc-table">
                <thead>
                  <tr>
                    <th>Deliverable / Scope Description</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Rate</th>
                    <th style="text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody id="doc-items-tbody">
                  <tr>
                    <td>Commercial Photo Shoot (Full Day Directing &amp; Crew)</td>
                    <td style="text-align: center;">1</td>
                    <td style="text-align: right;">$2,400.00</td>
                    <td style="text-align: right; font-weight: 600;">$2,400.00</td>
                  </tr>
                  <tr>
                    <td>High-Res Digital Licensing (2-Year Rights)</td>
                    <td style="text-align: center;">1</td>
                    <td style="text-align: right;">$1,600.00</td>
                    <td style="text-align: right; font-weight: 600;">$1,600.00</td>
                  </tr>
                  <tr>
                    <td>Color Grading &amp; Retouching (20 Selected Master Assets)</td>
                    <td style="text-align: center;">1</td>
                    <td style="text-align: right;">$800.00</td>
                    <td style="text-align: right; font-weight: 600;">$800.00</td>
                  </tr>
                </tbody>
              </table>

              <div class="doc-footer-flex">
                <div class="doc-footer-note" id="doc-footer-note">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  Quote delivered to client for review
                </div>
                <div style="display: flex; align-items: center;">
                  <div class="doc-total-val" id="doc-total-val">$4,800.00</div>
                  <div id="convert-affordance-slot"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  </section>

  <!-- 4. WHY CORVIOZ MODULE (EXACT R2A BASELINE) -->
  <section class="section-why-wrapper" id="why-corvioz">
    <div class="section-container">
      
      <div class="why-header">
        <div class="section-kicker" style="background: rgba(0,0,0,0.05); color: var(--text-muted);">WHY CORVIOZ</div>
      </div>

      <div class="why-pillars-grid">
        <div class="why-pillar-card">
          <h3 class="pillar-title">Keep the work connected</h3>
          <p class="pillar-text">
            Keep quotes, invoices, client details, and payment status in one connected workflow.
          </p>
        </div>

        <div class="why-pillar-card">
          <h3 class="pillar-title">Know what happens next</h3>
          <p class="pillar-text">
            See the next practical step as work moves from quote to invoice and payment tracking.
          </p>
        </div>

        <div class="why-pillar-card">
          <h3 class="pillar-title">Keep a usable record</h3>
          <p class="pillar-text">
            Maintain a clear client history of quotes, invoices, and recorded payment status.
          </p>
        </div>
      </div>

    </div>
  </section>

  <!-- 5. FOR PHOTOGRAPHERS MODULE (EXACT V1B BASELINE) -->
  <section class="section-photographers-wrapper" id="for-photographers">
    <div class="section-container">
      
      <div class="photographers-grid fp-reveal-item" id="fp-section-reveal">
        
        <div class="photographers-content-left">
          <div class="section-kicker">FOR PHOTOGRAPHERS</div>
          <h2 class="photographers-headline">Know what’s included before you price the job.</h2>
          <p class="photographers-body">
            Keep the job details, quote, and invoice together, so you can see what was agreed and what comes next.
          </p>
          <a href="/for-photographers" class="photographers-link">
            Explore Corvioz for photographers →
          </a>
        </div>

        <div class="photography-job-surface">
          <div class="job-surface-header">
            <div>
              <div class="job-title">Spring Brand Shoot</div>
              <div class="job-client">Northline Goods</div>
            </div>
            <div class="job-category-badge">Commercial Photography</div>
          </div>

          <div class="job-surface-body">
            <div class="job-section-block">
              <div class="job-section-label">SCOPE</div>
              <div class="job-scope-list">
                <div class="job-scope-row">
                  <span>Photography</span>
                  <span class="job-scope-detail">1 day</span>
                </div>
                <div class="job-scope-row">
                  <span>Post-production</span>
                  <span class="job-scope-detail">20 final images</span>
                </div>
                <div class="job-scope-row">
                  <span>Additional retouching</span>
                  <span class="job-scope-detail">Optional</span>
                </div>
                <div class="job-scope-total">
                  <span>Total</span>
                  <span>$4,800</span>
                </div>
              </div>
            </div>

            <div class="job-section-block">
              <div class="job-section-label">QUOTE</div>
              <div class="job-row-flex">
                <div>
                  <strong style="color: var(--text-main);">Quote Q-1048</strong>
                  <span style="color: var(--text-muted); margin-left: 8px;">$4,800</span>
                </div>
                <span class="status-badge-approved">Approved</span>
              </div>
            </div>

            <div class="job-section-block">
              <div class="job-section-label">CLIENT PORTAL</div>
              <div class="portal-access-list">
                <div class="portal-access-item">
                  <span class="portal-dot"></span>
                  <span>Quote / Proposal: <strong>Available</strong></span>
                </div>
                <div class="portal-access-item">
                  <span class="portal-dot"></span>
                  <span>Invoice: <strong>Available</strong></span>
                </div>
              </div>
            </div>

            <div class="job-section-block">
              <div class="job-section-label">INVOICE</div>
              <div class="job-row-flex">
                <div>
                  <strong style="color: var(--text-main);">Invoice INV-2094</strong>
                  <span style="color: var(--text-muted); margin-left: 8px;">$4,800</span>
                </div>
                <span class="status-badge-paid">Paid</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  </section>

  <!-- 6. PRICING DECISION MODULE V1B (FINAL PLAN COMPARISON & SOURCE ISOLATION) -->
  <section class="section-pricing-wrapper" id="pricing">
    <div class="section-container">
      
      <!-- Locked Section Copy -->
      <div class="pricing-header">
        <div class="section-kicker">PRICING</div>
        <h2 class="section-title">Start free. Upgrade when you need more.</h2>
        <p class="section-intro">
          Start with the core workflow, then choose a plan as your client work grows.
        </p>
      </div>

      <!-- ONE Unified Pricing Plan Surface -->
      <div class="pricing-unified-surface">
        <div class="pricing-grid-four">
          
          <!-- Column 1: FREE -->
          <div class="pricing-plan-col col-interactive">
            <div class="pricing-plan-header">
              <h3 class="pricing-plan-title">FREE</h3>
              
              <!-- Structural Price Slot -->
              <div class="pricing-price-slot">
                <div class="price-numeral-row">
                  <span class="price-currency-val">$0</span>
                </div>
              </div>

              <p class="pricing-plan-positioning">Try the core workflow.</p>
            </div>
            
            <ul class="pricing-feature-list">
              <li class="pricing-feature-item">
                <svg class="pricing-check-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Draft quotes &amp; client documents</span>
              </li>
              <li class="pricing-feature-item">
                <svg class="pricing-check-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Watermarked PDF preview</span>
              </li>
              <li class="pricing-feature-item">
                <svg class="pricing-check-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Basic profile setup</span>
              </li>
            </ul>

            <div class="pricing-plan-footer">
              <a href="/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote" class="btn-action-start-free">Start free</a>
            </div>
          </div>

          <!-- Column 2: STARTER -->
          <div class="pricing-plan-col col-interactive">
            <div class="pricing-plan-header">
              <h3 class="pricing-plan-title">STARTER</h3>
              
              <!-- Structural Price Slot -->
              <div class="pricing-price-slot">
                <div class="price-numeral-row">
                  <span class="price-currency-val">$9</span>
                  <span class="price-period-label">/ month</span>
                </div>
                <div class="price-yearly-subline">Yearly option available</div>
              </div>

              <p class="pricing-plan-positioning">For regular client work.</p>
            </div>
            
            <ul class="pricing-feature-list">
              <li class="pricing-feature-item">
                <svg class="pricing-check-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Client-ready quotes</span>
              </li>
              <li class="pricing-feature-item">
                <svg class="pricing-check-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Watermarked PDF preview</span>
              </li>
              <li class="pricing-feature-item">
                <svg class="pricing-check-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Invoice &amp; quote workflow</span>
              </li>
            </ul>

            <div class="pricing-plan-footer">
              <a href="/pricing" class="btn-action-view-plan">View Starter</a>
            </div>
          </div>

          <!-- Column 3: PRO -->
          <div class="pricing-plan-col col-interactive col-pro">
            <div class="pricing-plan-header">
              <h3 class="pricing-plan-title">PRO</h3>
              
              <!-- Structural Price Slot -->
              <div class="pricing-price-slot">
                <div class="price-numeral-row">
                  <span class="price-currency-val">$19</span>
                  <span class="price-period-label">/ month</span>
                </div>
                <div class="price-yearly-subline">Yearly option available</div>
              </div>

              <p class="pricing-plan-positioning">For more active client work.</p>
            </div>
            
            <ul class="pricing-feature-list">
              <li class="pricing-feature-item">
                <svg class="pricing-check-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Unlimited quotes &amp; Public Profiles</span>
              </li>
              <li class="pricing-feature-item">
                <svg class="pricing-check-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Clean PDF export without watermark</span>
              </li>
              <li class="pricing-feature-item">
                <svg class="pricing-check-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <span>Client links &amp; project delivery</span>
              </li>
            </ul>

            <div class="pricing-plan-footer">
              <a href="/pricing" class="btn-action-view-plan">View Pro</a>
            </div>
          </div>

          <!-- Column 4: STUDIO (DISABLED / COMING SOON - NO FEATURES) -->
          <div class="pricing-plan-col col-studio">
            <div class="pricing-plan-header">
              <div class="pricing-plan-title">
                <span>STUDIO</span>
                <span class="badge-coming-soon">COMING SOON</span>
              </div>
              
              <!-- Structural Price Slot -->
              <div class="pricing-price-slot">
                <div class="price-numeral-row">
                  <span class="price-period-label" style="font-weight: 600; color: var(--text-soft); font-size: 0.95rem;">Coming soon</span>
                </div>
              </div>

              <p class="pricing-plan-positioning" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;">For studio workflows.</p>
            </div>
            
            <div class="studio-empty-body">
              <p class="studio-status-note">
                Pricing and features are still being shaped.
              </p>
            </div>

            <!-- Empty Aligned Footer Slot -->
            <div class="pricing-plan-footer"></div>
          </div>

        </div>
      </div>

      <!-- Navigation Link to Full Pricing -->
      <div class="pricing-full-link-container">
        <a href="/pricing" class="pricing-full-link">
          See full pricing →
        </a>
      </div>

      <!-- Neutral Paddle Subscription Note -->
      <div class="paddle-note-line">
        Corvioz subscriptions are handled through Paddle.
      </div>

    </div>
  </section>

  <!-- 7. PRACTICAL RESOURCES MODULE V1B (STRICT SOURCE ISOLATION PATCH) -->
  <section class="section-resources-wrapper" id="resources">
    <div class="section-container">
      
      <!-- Locked Section Copy with Coherent V1A Intro Body -->
      <div class="resources-header">
        <div class="section-kicker">RESOURCES</div>
        <h2 class="section-title">Practical help for clearer client work.</h2>
        <p class="section-intro">
          Use practical guides to think through project pricing, client documents, and the workflows that move work forward.
        </p>
      </div>

      <!-- ONE Editorial Resource Surface -->
      <div class="resources-editorial-surface resources-reveal-item" id="resources-surface-reveal">
        <div class="resources-list-rows" id="guides">
          
          <!-- Row 1: Freelance Pricing Guide -->
          <a href="/blog/how-to-price-web-design-projects" class="resource-row-item">
            <div>
              <span class="resource-category-tag">GUIDE</span>
            </div>
            <div class="resource-row-content">
              <h3 class="resource-row-title">Project Pricing: Structuring Work Beyond Hourly Rates</h3>
              <p class="resource-row-desc">Learn how to structure freelance web design and development projects around scope, milestones, and client expectations.</p>
            </div>
            <div class="resource-arrow-cell">
              <svg class="resource-arrow-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4.166 10h11.668M10.833 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </a>

          <!-- Row 2: Invoice vs Quote vs Receipt -->
          <a href="/blog/invoice-vs-quote-vs-receipt" class="resource-row-item">
            <div>
              <span class="resource-category-tag">GUIDE</span>
            </div>
            <div class="resource-row-content">
              <h3 class="resource-row-title">Invoice vs Quote vs Receipt: What Freelancers Should Send and When</h3>
              <p class="resource-row-desc">A simple guide to the difference between quotes, invoices, and receipts in a freelance client workflow.</p>
            </div>
            <div class="resource-arrow-cell">
              <svg class="resource-arrow-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4.166 10h11.668M10.833 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </a>

          <!-- Row 3: Modern Document Workflow -->
          <a href="/blog/best-invoice-software-for-freelancers" class="resource-row-item">
            <div>
              <span class="resource-category-tag">GUIDE</span>
            </div>
            <div class="resource-row-content">
              <h3 class="resource-row-title">The Modern Document Workflow: Milestone Invoicing vs Hourly Logs</h3>
              <p class="resource-row-desc">Compare milestone document workflows with traditional hourly logging and learn how freelancers can keep client work organized.</p>
            </div>
            <div class="resource-arrow-cell">
              <svg class="resource-arrow-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4.166 10h11.668M10.833 5l5 5-5 5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </a>

        </div>
      </div>

      <!-- Secondary Utility Links (Semantically Truthful V1A Solution) -->
      <div class="resources-secondary-nav">
        <a href="/blog" class="secondary-nav-link">Browse all articles →</a>
        <span class="secondary-nav-divider"></span>
        <a href="/help" class="secondary-nav-link">Help Center →</a>
      </div>

    </div>
  </section>

  <!-- 8. FAQ / USER-OBJECTION SECTION V1E (FINAL EVIDENCE CLOSURE PROTOTYPE) -->
  <section class="section-faq-wrapper" id="faq">
    <div class="section-container">
      
      <div class="faq-layout-grid">
        
        <!-- Left Column: Header Context -->
        <div class="faq-content-left">
          <div class="section-kicker">FAQ</div>
          <h2 class="faq-header-title">Questions before you get started.</h2>
          <p class="faq-header-intro">
            Clear answers about how Corvioz fits into your client workflow.
          </p>
        </div>

        <!-- Right Column: 12 Semantic Details/Summary FAQs -->
        <div class="faq-list-container">
          
          <!-- Q1 (Default Open) -->
          <details class="faq-row-item" open>
            <summary class="faq-summary">
              <span>Who is Corvioz built for?</span>
              <span class="faq-icon-indicator" aria-hidden="true">+</span>
            </summary>
            <div class="faq-answer-content">
              Corvioz is built for independent professionals—including photographers, consultants, designers, developers, and small studios—who want quotes, invoices, client records, and recorded payment status kept in one clear workflow.
            </div>
          </details>

          <!-- Q2 (Default Open) -->
          <details class="faq-row-item" open>
            <summary class="faq-summary">
              <span>Is Corvioz accounting software, or a client workflow tool?</span>
              <span class="faq-icon-indicator" aria-hidden="true">+</span>
            </summary>
            <div class="faq-answer-content">
              Corvioz is a focused client-workflow tool rather than a full accounting suite. It keeps quotes, invoices, client records, and recorded payment status connected as work moves forward.
            </div>
          </details>

          <!-- Q3 (Default Open) -->
          <details class="faq-row-item" open>
            <summary class="faq-summary">
              <span>What happens after a client approves a quote?</span>
              <span class="faq-icon-indicator" aria-hidden="true">+</span>
            </summary>
            <div class="faq-answer-content">
              Once a client approves a quote, you can keep that decision connected to the next step and convert the approved quote into an invoice when it is time to bill.
            </div>
          </details>

          <!-- Q4 (Default Closed) -->
          <details class="faq-row-item">
            <summary class="faq-summary">
              <span>Do clients need a Corvioz account?</span>
              <span class="faq-icon-indicator" aria-hidden="true">+</span>
            </summary>
            <div class="faq-answer-content">
              No. Clients can review shared quotes and invoices through a Corvioz client portal without creating a Corvioz account.
            </div>
          </details>

          <!-- Q5 (Default Closed) -->
          <details class="faq-row-item">
            <summary class="faq-summary">
              <span>Can I keep a history of client work in Corvioz?</span>
              <span class="faq-icon-indicator" aria-hidden="true">+</span>
            </summary>
            <div class="faq-answer-content">
              Corvioz keeps client records, quotes, invoices, and recorded payment status in one workflow, giving you a clearer history of client work.
            </div>
          </details>

          <!-- Q6 (Default Closed) -->
          <details class="faq-row-item">
            <summary class="faq-summary">
              <span>What quote and invoice options depend on my plan?</span>
              <span class="faq-icon-indicator" aria-hidden="true">+</span>
            </summary>
            <div class="faq-answer-content">
              Plan differences include PDF preview and export behavior as well as delivery options. Pro includes clean PDF export without a watermark.
            </div>
          </details>

          <!-- Q7 (Default Closed) -->
          <details class="faq-row-item">
            <summary class="faq-summary">
              <span>Can I export quotes and invoices?</span>
              <span class="faq-icon-indicator" aria-hidden="true">+</span>
            </summary>
            <div class="faq-answer-content">
              Export availability depends on your plan. Pro includes clean PDF export without a watermark.
            </div>
          </details>

          <!-- Q8 (Default Closed) -->
          <details class="faq-row-item">
            <summary class="faq-summary">
              <span>How does Corvioz handle payment status?</span>
              <span class="faq-icon-indicator" aria-hidden="true">+</span>
            </summary>
            <div class="faq-answer-content">
              Corvioz lets you record payment status in the client workflow. Paddle is used for Corvioz subscriptions.
            </div>
          </details>

          <!-- Q9 (Default Closed) -->
          <details class="faq-row-item">
            <summary class="faq-summary">
              <span>Can Corvioz tell me what I should charge?</span>
              <span class="faq-icon-indicator" aria-hidden="true">+</span>
            </summary>
            <div class="faq-answer-content">
              No. Corvioz does not decide what you should charge. It helps keep scope, quote details, and client documents organized so you can make your own pricing decisions with clearer context.
            </div>
          </details>

          <!-- Q10 (Default Closed) -->
          <details class="faq-row-item">
            <summary class="faq-summary">
              <span>Who owns the documents and content I add to Corvioz?</span>
              <span class="faq-icon-indicator" aria-hidden="true">+</span>
            </summary>
            <div class="faq-answer-content">
              The documents, profile assets, and portfolio content you host on Corvioz remain your property.
            </div>
          </details>

          <!-- Q11 (Default Closed) -->
          <details class="faq-row-item">
            <summary class="faq-summary">
              <span>How are Corvioz subscriptions handled?</span>
              <span class="faq-icon-indicator" aria-hidden="true">+</span>
            </summary>
            <div class="faq-answer-content">
              Corvioz subscriptions are handled through Paddle. Current plans and billing options are shown on the Pricing page.
            </div>
          </details>

          <!-- Q12 (Default Closed) -->
          <details class="faq-row-item">
            <summary class="faq-summary">
              <span>Is there a free Corvioz plan?</span>
              <span class="faq-icon-indicator" aria-hidden="true">+</span>
            </summary>
            <div class="faq-answer-content">
              Yes. Corvioz has a Free plan at $0. Starter and Pro are paid plans.
            </div>
          </details>

        </div>

      </div>

    </div>
  </section>

  <!-- 9. FOUNDER / TRUST CREDIBILITY MODULE V1A (VISIBLE REVIEW CANDIDATE) -->
  <section class="section-founder-trust" id="founder-trust">
    <div class="section-container">
      
      <div class="founder-trust-grid founder-trust-reveal-item" id="founder-trust-reveal">
        
        <!-- Left Column: Position, Intro & Founder Note (~45%) -->
        <div class="founder-trust-left">
          <div class="founder-trust-eyebrow">BUILT WITH CLEAR BOUNDARIES</div>
          <h2 class="founder-trust-headline">Focused on the client workflow that needs to stay connected.</h2>
          <p class="founder-trust-intro">
            Corvioz is built around quotes, invoices, client records, and recorded payment status, with a deliberately focused workflow.
          </p>

          <div class="founder-note-block">
            <p class="founder-note-text">
              Corvioz is being built as a focused workspace for independent professionals to keep quotes, invoices, client documents, and client records easier to follow in one place.
            </p>
            <div class="founder-attribution">
              <span class="attribution-label">From the founder</span>
              <span class="attribution-name">Duo, Founder of Corvioz</span>
            </div>
          </div>
        </div>

        <!-- Right Column: 3 Stacked Verified Trust Facts (~55%) -->
        <div class="founder-trust-right">
          
          <!-- Trust Fact 1: Content Ownership -->
          <div class="trust-fact-row">
            <h3 class="trust-fact-title">Your content remains yours.</h3>
            <p class="trust-fact-desc">
              Documents, profile assets, and portfolio content you host on Corvioz remain your property.
            </p>
            <a href="/terms" class="trust-fact-link">Read the Terms →</a>
          </div>

          <!-- Trust Fact 2: Security Information (Non-Duplicative Security Transparency) -->
          <div class="trust-fact-row" id="trust-fact-security">
            <h3 class="trust-fact-title">Security information is public.</h3>
            <p class="trust-fact-desc">
              Review how Corvioz approaches account and product security.
            </p>
            <a href="/security" class="trust-fact-link" id="link-security">View security →</a>
          </div>

          <!-- Trust Fact 3: Subscription Billing -->
          <div class="trust-fact-row">
            <h3 class="trust-fact-title">Subscriptions are handled through Paddle.</h3>
            <p class="trust-fact-desc">
              Corvioz uses Paddle for its subscription plans and billing options.
            </p>
            <a href="/pricing" class="trust-fact-link">View pricing →</a>
          </div>

        </div>

      </div>

    </div>
  </section>

  <!-- 10. FINAL CTA DECISION -> ACTION MODULE V1A (STRICT REPAIR PROTOTYPE) -->
  <section class="section-final-cta" id="final-cta">
    <div class="section-container">
      <div class="final-cta-container final-cta-reveal-item" id="final-cta-reveal">
        <h2 class="final-cta-headline">Ready to create your next client quote?</h2>
        <p class="final-cta-body">
          Start with a clear quote, then keep the client workflow connected as the work moves forward.
        </p>
        <div class="final-cta-actions">
          <a href="/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote" class="btn-final-cta-primary" id="btn-final-cta-main">Create Quote</a>
          <span class="final-cta-microcopy">Free plan available.</span>
        </div>
      </div>
    </div>
  </section>


  <!-- ============================================================
       SITE FOOTER — HOME-01 FOOTER V1A
       Sign in href: /dashboard (page.js line 255, SharedFooter.js line 48)
       Paddle copy:  terms/page.js line 80, pricing/page.js line 828
       Ownership:    terms/page.js line 60
       ============================================================ -->
  <footer class="site-footer" id="site-footer" role="contentinfo">
    <div class="footer-inner">

      <!-- Main grid: brand column + 3 nav columns -->
      <div class="footer-grid">

        <!-- Brand column -->
        <div class="footer-brand-col">
          <a href="/" class="footer-wordmark" aria-label="Corvioz home">Corvioz</a>
          <p class="footer-brand-desc">
            A focused workspace for quotes, invoices, client records, and recorded payment status.
          </p>
          <a href="/dashboard" class="footer-signin-link">Sign in →</a>
        </div>

        <!-- Product column -->
        <div class="footer-nav-col">
          <h3 class="footer-col-label">Product</h3>
          <ul class="footer-link-list">
            <li><a href="/#how-corvioz-works" class="footer-link">How It Works</a></li>
            <li><a href="/for-photographers" class="footer-link">For Photographers</a></li>
            <li><a href="/pricing" class="footer-link">Pricing</a></li>
            <li><a href="/security" class="footer-link">Security</a></li>
          </ul>
        </div>

        <!-- Resources column -->
        <div class="footer-nav-col">
          <h3 class="footer-col-label">Resources</h3>
          <ul class="footer-link-list">
            <li><a href="/blog" class="footer-link">Blog</a></li>
            <li><a href="/blog/invoice-vs-quote-vs-receipt" class="footer-link">Client Document Guide</a></li>
            <li><a href="/invoice-template/photographer" class="footer-link">Photographer Template</a></li>
            <li><a href="/help" class="footer-link">Help Center</a></li>
          </ul>
        </div>

        <!-- Legal column -->
        <div class="footer-nav-col">
          <h3 class="footer-col-label">Legal</h3>
          <ul class="footer-link-list">
            <li><a href="/privacy" class="footer-link">Privacy Policy</a></li>
            <li><a href="/terms" class="footer-link">Terms of Service</a></li>
            <li><a href="/refund-policy" class="footer-link">Refund Policy</a></li>
            <li><a href="mailto:support@corvioz.com" class="footer-link">support@corvioz.com</a></li>
          </ul>
        </div>

      </div><!-- /footer-grid -->

      <!-- Compliance / Trust strip -->
      <div class="footer-trust-strip" role="complementary" aria-label="Compliance information">
        <span class="footer-trust-item">
          Subscriptions are handled through Paddle. Corvioz does not store card details.
        </span>
        <span class="footer-trust-sep" aria-hidden="true"></span>
        <span class="footer-trust-item">
          Documents, profile assets, and portfolio content you host on Corvioz are your exclusive property.
        </span>
        <span class="footer-trust-sep" aria-hidden="true"></span>
        <span class="footer-trust-item">
          <a href="/security" class="footer-trust-link">Security information →</a>
        </span>
      </div><!-- /footer-trust-strip -->

      <!-- Bottom legal row -->
      <div class="footer-bottom-row">
        <span class="footer-copyright">© 2026 Corvioz</span>
        <div class="footer-bottom-links">
          <a href="/privacy" class="footer-bottom-link">Privacy</a>
          <a href="/terms" class="footer-bottom-link">Terms</a>
          <a href="/security" class="footer-bottom-link">Security</a>
        </div>
      </div><!-- /footer-bottom-row -->

    </div><!-- /footer-inner -->
  </footer>


  `;
const styles = String.raw`/* ============================================================
   CORVIOZ HOME-01 PRICING V1B STYLESHEET
   Preserves Locked Header + Hero + How + Why + For Photographers (Exact V1B)
   Appends Final Plan Comparison & Source-Isolated Pricing Module V1B
   ============================================================ */

[data-home-v1] {
  --font-sans: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Geist Mono', monospace;

  /* Brand Palette — Exact V1B Baseline Token */
  --brand-primary: #4F46E5;
  --brand-hover: #4338CA;
  --brand-light: #EEF2FF;
  --brand-border: rgba(79, 70, 229, 0.15);

  /* Neutrals */
  --bg-page: #f8fafc;
  --bg-surface: #ffffff;
  --bg-subtle: #f1f5f9;
  
  --text-main: #0B0F19;
  --text-muted: #4B5563;
  --text-soft: #6B7280;
  --text-subtle: #9CA3AF;

  --border-light: rgba(0, 0, 0, 0.06);
  --border-medium: rgba(0, 0, 0, 0.10);

  /* Radius & Shadows */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-pill: 999px;

  --shadow-subtle: 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.04);
  --shadow-elevated: 0 16px 36px -8px rgba(15, 23, 42, 0.07);

  --hero-bg: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 100%), 
             radial-gradient(circle at 72% 24%, rgba(79, 70, 229, 0.05), transparent 40%), 
             radial-gradient(circle at 18% 8%, rgba(6, 182, 212, 0.03), transparent 30%), 
             #f8fafc;
  --grid-color: rgba(203, 213, 225, 0.14);
}

[data-home-v1], [data-home-v1] * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

[data-home-v1] {
  scroll-behavior: smooth;
}

[data-home-v1] {
  background-color: var(--bg-page);
  color: var(--text-main);
  font-family: var(--font-sans);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  /* min-height: prototype-only removed in Cohesion V1 — PROTOTYPE_ONLY_EMPTY_TAIL_REMOVED=YES */
}

[data-home-v1] a:not(.btn-primary-cta):not(.btn-hero-cta):not(.btn-final-cta-primary) {
  color: inherit;
  text-decoration: none;
}

/* ============================================================
   1. FLAT INTEGRATED HEADER (EXACT R2A BASELINE)
   ============================================================ */
.navbar {
  height: 64px;
  background-color: #f8fafc;
  border-bottom: 1px solid var(--border-medium);
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-wordmark {
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: -0.035em;
  color: var(--text-main);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
  list-style: none;
}

.nav-link-item {
  position: relative;
}

.nav-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  padding: 8px 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.15s ease;
  position: relative;
  cursor: pointer;
  background: none;
  border: none;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 4px;
  right: 4px;
  height: 2px;
  background-color: var(--brand-primary);
  border-radius: 99px;
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.nav-link:hover,
.nav-link:focus-visible,
.nav-link-item.open .nav-link {
  color: var(--brand-primary);
  outline: none;
}

.nav-link:hover::after,
.nav-link:focus-visible::after,
.nav-link-item.open .nav-link::after {
  opacity: 1;
  transform: translateY(0);
}

.dropdown-icon {
  width: 12px;
  height: 12px;
  opacity: 0.6;
  transition: transform 0.18s ease;
}

.nav-link-item.open .dropdown-icon,
.nav-link-item:hover .dropdown-icon {
  transform: translateY(1px);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 200px;
  background: #ffffff;
  border: 1px solid var(--border-medium);
  border-top: 2px solid var(--brand-primary);
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 4px 0;
  opacity: 0;
  visibility: hidden;
  transform: translateY(0);
  transition: opacity 120ms ease, visibility 120ms ease;
  z-index: 120;
}

.nav-link-item:hover .dropdown-menu,
.nav-link-item.open .dropdown-menu {
  opacity: 1;
  visibility: visible;
}

.dropdown-item {
  display: block;
  padding: 8px 16px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-muted);
  transition: background 120ms ease, color 120ms ease;
  outline: none;
}

.dropdown-item:hover,
.dropdown-item:focus-visible {
  background: var(--brand-light);
  color: var(--brand-primary);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-signin-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  position: relative;
  padding: 4px 2px;
  transition: color 0.15s ease;
}

.btn-signin-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1.5px;
  background-color: var(--brand-primary);
  opacity: 0;
  transform: translateY(2px);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.btn-signin-link:hover,
.btn-signin-link:focus-visible {
  color: var(--brand-primary);
  outline: none;
}

.btn-signin-link:hover::after,
.btn-signin-link:focus-visible::after {
  opacity: 1;
  transform: translateY(0);
}

.btn-primary-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 18px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  background-color: var(--brand-primary);
  border: 1px solid var(--brand-primary);
  border-radius: var(--radius-md);
  transition: background-color 0.15s ease;
  white-space: nowrap;
}

.btn-primary-cta:hover,
.btn-primary-cta:focus-visible {
  background-color: var(--brand-hover);
  outline: none;
}

/* ============================================================
   2. FROZEN HERO SECTION (EXACT R2A BASELINE)
   ============================================================ */
.landing-hero {
  height: calc(100vh - 64px);
  min-height: 600px;
  max-height: 840px;
  padding: 64px 24px;
  background: var(--hero-bg);
  color: var(--text-main);
  border-bottom: 1px solid var(--border-light);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.landing-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--grid-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
  z-index: 1;
}

.hero-content-center {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 860px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-surface);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-pill);
  padding: 5px 16px;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 28px;
  box-shadow: var(--shadow-subtle);
}

.hero-title {
  color: var(--text-main);
  font-size: 3.35rem;
  font-weight: 800;
  line-height: 1.06;
  letter-spacing: -0.025em;
  margin: 0 0 24px 0;
  text-wrap: balance;
}

.hero-lede {
  font-size: 1.2rem;
  color: var(--text-muted);
  margin: 0 auto 32px auto;
  max-width: 620px;
  line-height: 1.65;
  text-wrap: pretty;
}

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-bottom: 28px;
}

.btn-hero-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 13px 32px;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background-color: var(--brand-primary);
  border-radius: var(--radius-md);
  border: 1px solid var(--brand-primary);
  transition: background-color 0.15s ease;
}

.btn-hero-cta:hover {
  background-color: var(--brand-hover);
}

.hero-trust-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.85rem;
  color: var(--text-soft);
  font-weight: 500;
  margin-top: 16px;
}

.hero-trust-divider {
  opacity: 0.3;
}

/* ============================================================
   3. HOW CORVIOZ WORKS & UNIFIED WORKFLOW SURFACE (EXACT R2A BASELINE)
   ============================================================ */
.section-how-wrapper {
  /* COHESION-001: How padding tightened 80/96 → 72/80 — How+Why are a narrative pair on adjacent backgrounds */
  padding: 72px 24px 80px 24px;
  background: #ffffff;
  border-bottom: 1px solid var(--border-light);
}

.section-container {
  max-width: 1140px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 54px auto;
}

.section-kicker {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brand-primary);
  background: var(--brand-light);
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  display: inline-block;
  margin-bottom: 16px;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-main);
  line-height: 1.15;
  margin-bottom: 14px;
}

.section-intro {
  font-size: 1.1rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.workflow-unified-surface {
  background: var(--bg-page);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xl);
  padding: 36px 32px 32px 32px;
  box-shadow: var(--shadow-elevated);
}

.workflow-track-container {
  position: relative;
  margin-bottom: 32px;
}

.workflow-rail-line {
  position: absolute;
  top: 22px;
  left: 60px;
  right: 60px;
  height: 3px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 99px;
  z-index: 1;
}

.workflow-rail-fill {
  height: 100%;
  width: 0%;
  background: var(--brand-primary);
  border-radius: 99px;
  transition: width 0.4s ease-out;
}

.workflow-nodes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  position: relative;
  z-index: 2;
}

.workflow-stage-node-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  outline: none;
  padding: 4px;
  border-radius: var(--radius-md);
  background: transparent;
  border: none;
  transition: opacity 0.2s ease;
}

.node-circle {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #ffffff;
  border: 2px solid var(--border-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-soft);
  margin-bottom: 14px;
  transition: border-color 0.25s ease, background 0.25s ease, color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
}

.workflow-stage-node-item:hover .node-circle {
  border-color: var(--brand-primary);
  color: var(--brand-primary);
}

.workflow-stage-node-item:hover .stage-label-name {
  color: var(--brand-primary);
}

.workflow-stage-node-item.completed .node-circle {
  background: var(--brand-light);
  border-color: var(--brand-primary);
  color: var(--brand-primary);
}

.workflow-stage-node-item.active .node-circle {
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  color: #ffffff;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.18);
  transform: scale(1.06);
}

.stage-label-name {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text-main);
  margin-bottom: 6px;
  transition: color 0.2s ease;
}

.workflow-stage-node-item.active .stage-label-name {
  color: var(--brand-primary);
}

.stage-label-desc {
  font-size: 0.825rem;
  color: var(--text-muted);
  line-height: 1.45;
  max-width: 220px;
  opacity: 0.85;
}

.workflow-stage-node-item.active .stage-label-desc {
  opacity: 1;
}

.product-evidence-card {
  background: #ffffff;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  margin-top: 12px;
}

.preview-topbar {
  height: 40px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  font-size: 0.775rem;
  font-family: var(--font-mono);
  color: var(--text-soft);
}

.window-dots {
  display: flex;
  gap: 6px;
}

.window-dots span {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.dot-red { background: #ff5f56; }
.dot-yellow { background: #ffbd2e; }
.dot-green { background: #27c93f; }

.preview-meta-stage {
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  font-size: 0.725rem;
  font-weight: 700;
  transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;
}

.preview-body-layout {
  padding: 24px;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  background: #ffffff;
}

.preview-sidebar {
  background: #f8fafc;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 16px;
}

.sidebar-label {
  font-size: 0.675rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-subtle);
  margin-bottom: 10px;
}

.sidebar-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  font-size: 0.825rem;
  font-weight: 500;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  margin-bottom: 4px;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.sidebar-item.active {
  background: #ffffff;
  color: var(--brand-primary);
  font-weight: 600;
  border: 1px solid var(--border-light);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.preview-main-document {
  background: #ffffff;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 20px 24px;
  position: relative;
  min-height: 260px;
}

.doc-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 18px;
}

.doc-title {
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--text-main);
}

.doc-subtitle {
  font-size: 0.825rem;
  color: var(--text-soft);
  margin-top: 2px;
}

.doc-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 700;
  transition: background 0.25s ease, color 0.25s ease, border-color 0.25s ease;
}

.badge-stage-1 { background: #EEF2FF; color: #4F46E5; border: 1px solid rgba(79, 70, 229, 0.2); }
.badge-stage-2 { background: #ECFDF5; color: #059669; border: 1px solid rgba(16, 185, 129, 0.2); }
.badge-stage-3 { background: #FFFBEB; color: #D97706; border: 1px solid rgba(245, 158, 11, 0.2); }
.badge-stage-4 { background: #F0FDFA; color: #0D9488; border: 1px solid rgba(20, 184, 166, 0.2); }

.doc-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.doc-table th {
  text-align: left;
  font-size: 0.725rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-subtle);
  padding: 6px 8px;
  border-bottom: 1px solid var(--border-light);
  font-weight: 700;
}

.doc-table td {
  padding: 10px 8px;
  font-size: 0.85rem;
  color: var(--text-main);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.doc-footer-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.doc-footer-note {
  font-size: 0.8rem;
  color: var(--text-soft);
  display: flex;
  align-items: center;
  gap: 6px;
}

.doc-total-val {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-main);
}

.btn-convert-affordance {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #D97706;
  background: #FFFBEB;
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  margin-left: 12px;
}

/* ============================================================
   4. WHY CORVIOZ MODULE (EXACT R2A BASELINE - NO BORDER BOTTOM)
   ============================================================ */
.section-why-wrapper {
  /* COHESION-002: Why padding tightened 80/108 → 64/88 — flows from How, no border-bottom already correct */
  padding: 64px 24px 88px 24px;
  background: var(--bg-page);
  position: relative;
}

.why-header {
  text-align: left;
  max-width: 620px;
  margin-bottom: 44px;
}

.why-pillars-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 36px;
}

.why-pillar-card {
  padding-left: 20px;
  border-left: 2px solid var(--border-medium);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  transition: border-left-color 0.3s ease;
}

.why-pillar-card:hover {
  border-left-color: var(--brand-primary);
}

.pillar-title {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-main);
  margin-bottom: 10px;
  line-height: 1.25;
}

.pillar-text {
  font-size: 0.925rem;
  color: var(--text-muted);
  line-height: 1.6;
}

/* ============================================================
   5. FOR PHOTOGRAPHERS MODULE (EXACT V1B BASELINE)
   ============================================================ */
.section-photographers-wrapper {
  /* COHESION-003: FP padding reduced 108/120 → 88/96; border-top kept for clean relevance shift from Why */
  padding: 88px 24px 96px 24px;
  background: #ffffff;
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  position: relative;
}

.photographers-grid {
  display: grid;
  grid-template-columns: 0.40fr 0.60fr;
  gap: 48px;
  align-items: start;
}

.photographers-content-left {
  padding-right: 12px;
}

.photographers-headline {
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-main);
  line-height: 1.18;
  margin-bottom: 18px;
}

.photographers-body {
  font-size: 1.05rem;
  color: var(--text-muted);
  line-height: 1.65;
  margin-bottom: 28px;
}

.photographers-link {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--brand-primary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s ease, transform 0.15s ease;
}

.photographers-link:hover {
  color: var(--brand-hover);
  transform: translateX(2px);
}

.photography-job-surface {
  background: #ffffff;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xl);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: transform 180ms ease-out, box-shadow 180ms ease-out, border-color 180ms ease-out;
}

.photography-job-surface:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px -4px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.16);
}

.fp-reveal-item {
  opacity: 1;
  transform: translateY(6px);
  transition: opacity 0.45s ease-out, transform 0.45s ease-out;
}

.home-reveal-ready .fp-reveal-item:not(.revealed) {
  opacity: 0;
}

.fp-reveal-item.revealed {
  opacity: 1;
  transform: translateY(0);
}

.job-surface-header {
  padding: 20px 24px;
  background: #f8fafc;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.job-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.015em;
}

.job-client {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.job-category-badge {
  font-size: 0.725rem;
  font-weight: 700;
  color: var(--brand-primary);
  background: var(--brand-light);
  border: 1px solid var(--brand-border);
  padding: 4px 12px;
  border-radius: var(--radius-pill);
}

.job-surface-body {
  padding: 24px;
}

.job-section-block {
  padding-bottom: 20px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-light);
}

.job-section-block:last-child {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: none;
}

.job-section-label {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-subtle);
  margin-bottom: 12px;
}

.job-scope-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.875rem;
}

.job-scope-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-main);
}

.job-scope-detail {
  color: var(--text-muted);
  font-weight: 500;
}

.job-scope-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-medium);
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--text-main);
}

.job-row-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.status-badge-approved {
  background: #ECFDF5;
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 10px;
}

.status-badge-paid {
  background: #F0FDFA;
  color: #0D9488;
  border: 1px solid rgba(20, 184, 166, 0.2);
  border-radius: var(--radius-pill);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px 10px;
}

.portal-access-list {
  display: flex;
  gap: 20px;
  font-size: 0.85rem;
}

.portal-access-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
}

.portal-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--brand-primary);
}

/* ============================================================
   6. PRICING DECISION MODULE V1B (SOURCE-ISOLATED & COMPARABLE DIMENSIONS)
   ============================================================ */
.section-pricing-wrapper {
  /* COHESION-004: Pricing padding kept at decision weight — only minor tighten 84/100 → 80/96 */
  padding: 80px 24px 96px 24px;
  background: var(--bg-page);
  border-bottom: 1px solid var(--border-light);
  position: relative;
  /* Local Pricing-only Action Border token (does NOT leak to global --brand-border) */
  --pricing-action-border: rgba(79, 70, 229, 0.18);
}

.pricing-header {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 36px auto;
}

/* ONE Unified Pricing Plan Surface */
.pricing-unified-surface {
  background: #ffffff;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-elevated);
  overflow: hidden;
}

.pricing-grid-four {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  position: relative;
}

.pricing-plan-col {
  padding: 36px 30px 32px 30px;
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  position: relative;
  transition: background 180ms ease-out, transform 180ms ease-out;
}

.pricing-plan-col:last-child {
  border-right: none;
}

/* Interactive columns: Free, Starter, Pro */
@media (hover: hover) and (pointer: fine) {
  .pricing-plan-col.col-interactive:hover {
    background: var(--bg-page);
    transform: translateY(-1px);
  }
}

/* Pro subtle visual hierarchy */
.pricing-plan-col.col-pro {
  background: linear-gradient(to bottom, rgba(79, 70, 229, 0.025) 0%, rgba(255, 255, 255, 0) 100%);
}

.pricing-plan-col.col-pro::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--brand-primary);
}

/* Studio coming soon disabled state */
.pricing-plan-col.col-studio {
  background: #f8fafc;
  opacity: 0.88;
  cursor: default;
}

.pricing-plan-header {
  margin-bottom: 18px;
}

.pricing-plan-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Structural Price Slot (40-48px numerals anchor) */
.pricing-price-slot {
  margin: 14px 0 12px 0;
  height: 58px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.price-numeral-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price-currency-val {
  font-size: 2.75rem; /* 44px */
  font-weight: 800;
  letter-spacing: -0.035em;
  color: var(--text-main);
  line-height: 1;
}

.price-period-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
}

.price-yearly-subline {
  font-size: 0.75rem;
  color: var(--text-soft);
  font-weight: 500;
  margin-top: 4px;
}

.pricing-plan-positioning {
  font-size: 0.9rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

.badge-coming-soon {
  font-size: 0.675rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-soft);
  background: var(--bg-subtle);
  border: 1px solid var(--border-medium);
  padding: 3px 8px;
  border-radius: var(--radius-pill);
}

/* Feature List Readability & Spacing */
.pricing-feature-list {
  list-style: none;
  margin-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex-grow: 1;
}

.pricing-feature-item {
  font-size: 0.9rem;
  color: var(--text-main);
  display: flex;
  align-items: flex-start;
  gap: 10px;
  line-height: 1.5;
}

.pricing-check-icon {
  width: 15px;
  height: 15px;
  color: var(--brand-primary);
  flex-shrink: 0;
  margin-top: 3px;
}

/* Studio Special Non-Feature Body State */
.studio-empty-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 12px;
  margin-bottom: 32px;
}

.studio-status-note {
  font-size: 0.85rem;
  color: var(--text-soft);
  line-height: 1.55;
  font-style: normal;
}

/* Bottom Baseline Action Slot Alignment */
.pricing-plan-footer {
  margin-top: auto;
  padding-top: 12px;
  height: 48px;
  display: flex;
  align-items: flex-end;
}

/* Refined Action Buttons (Using Local --pricing-action-border) */
.btn-action-start-free {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--brand-primary);
  background: var(--brand-light);
  border: 1px solid var(--pricing-action-border);
  border-radius: var(--radius-md);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.btn-action-start-free:hover {
  background: #e0e7ff;
  border-color: rgba(79, 70, 229, 0.3);
}

.btn-action-view-plan {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-main);
  background: #ffffff;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-md);
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.btn-action-view-plan:hover {
  background: #f8fafc;
  border-color: rgba(0, 0, 0, 0.2);
  color: var(--brand-primary);
}

.pricing-full-link-container {
  text-align: center;
  margin-top: 36px;
}

.pricing-full-link {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--brand-primary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s ease, transform 0.15s ease;
}

.pricing-full-link:hover {
  color: var(--brand-hover);
  transform: translateX(2px);
}

.paddle-note-line {
  text-align: center;
  font-size: 0.8rem;
  color: var(--text-soft);
  margin-top: 20px;
}

/* ============================================================
   7. REAL REDUCED MOTION MEDIA QUERY GUARD
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  [data-home-v1], [data-home-v1] *, [data-home-v1]::before, [data-home-v1]::after, [data-home-v1] *::before, [data-home-v1] *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }

  .workflow-rail-fill,
  .fp-reveal-item,
  .home-reveal-ready .fp-reveal-item:not(.revealed),
  .home-reveal-ready .resources-reveal-item:not(.revealed),
  .home-reveal-ready .founder-trust-reveal-item:not(.revealed),
  .home-reveal-ready .final-cta-reveal-item:not(.revealed) {
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .photography-job-surface,
  .pricing-plan-col.col-interactive:hover {
    transition: none !important;
    transform: none !important;
  }

  .workflow-stage-node-item .node-circle {
    transition: none !important;
    transform: none !important;
  }

  .preview-meta-stage,
  .doc-status-pill,
  .sidebar-item {
    transition: none !important;
  }
}

/* ============================================================
   8. PRACTICAL RESOURCES MODULE V1B (STRICT SOURCE ISOLATION)
   ============================================================ */
.section-resources-wrapper {
  /* COHESION-005: Resources 96/108 → 72/72; remove border-bottom — Resources+FAQ share editorial sequence */
  /* border-bottom removed so Resources flows into FAQ with tonal shift only (bg-page), not double border */
  padding: 72px 24px 72px 24px;
  background: #ffffff;
  border-top: 1px solid var(--border-light);
  position: relative;
}

.resources-header {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 48px auto;
}

/* ONE Editorial Resource Surface */
.resources-editorial-surface {
  background: #ffffff;
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  max-width: 1040px;
  margin: 0 auto;
}

.resources-list-rows {
  display: flex;
  flex-direction: column;
}

.resource-row-item {
  display: grid;
  grid-template-columns: 140px 1fr 40px;
  align-items: center;
  gap: 24px;
  padding: 28px 36px;
  border-bottom: 1px solid var(--border-light);
  text-decoration: none;
  background: #ffffff;
  transition: background 180ms ease-out;
}

.resource-row-item:last-child {
  border-bottom: none;
}

@media (hover: hover) and (pointer: fine) {
  .resource-row-item:hover {
    background: #f8fafc;
  }

  .resource-row-item:hover .resource-row-title {
    color: var(--brand-primary);
  }

  .resource-row-item:hover .resource-arrow-icon {
    color: var(--brand-primary);
    transform: translateX(2px);
  }
}

.resource-category-tag {
  font-size: 0.725rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-soft);
  background: var(--bg-subtle);
  border: 1px solid var(--border-light);
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  display: inline-block;
  text-align: center;
  white-space: nowrap;
}

.resource-row-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.resource-row-title {
  font-size: 1.075rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.015em;
  line-height: 1.35;
  transition: color 180ms ease-out;
}

.resource-row-desc {
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.resource-arrow-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.resource-arrow-icon {
  width: 18px;
  height: 18px;
  color: var(--text-soft);
  transition: color 180ms ease-out, transform 180ms ease-out;
}

/* Secondary Utility Links Row */
.resources-secondary-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  margin-top: 40px;
  padding-top: 24px;
}

.secondary-nav-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-muted);
  transition: color 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.secondary-nav-link:hover {
  color: var(--brand-primary);
}

.secondary-nav-divider {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--text-subtle);
  opacity: 0.5;
}

/* Restrained Section Entry Reveal */
.resources-reveal-item {
  opacity: 1;
  transform: translateY(6px);
  transition: opacity 0.45s ease-out, transform 0.45s ease-out;
}

.home-reveal-ready .resources-reveal-item:not(.revealed) {
  opacity: 0;
}

.resources-reveal-item.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* Resources-Owned Separate Reduced Motion Block */
@media (prefers-reduced-motion: reduce) {
  .resources-reveal-item {
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .home-reveal-ready .resources-reveal-item:not(.revealed) {
    opacity: 1 !important;
    transform: none !important;
  }

  .resource-row-item:hover,
  .resource-arrow-icon {
    transition: none !important;
    transform: none !important;
  }

  .resource-row-title {
    transition: none !important;
  }
}

/* ============================================================
   9. FAQ / USER-OBJECTION SECTION V1E (FINAL EVIDENCE CLOSURE PROTOTYPE)
   ============================================================ */
.section-faq-wrapper {
  /* COHESION-006: FAQ 108/120 → 72/88; top padding reduced — editorial pair with Resources */
  padding: 72px 24px 88px 24px;
  background: var(--bg-page);
  border-bottom: 1px solid var(--border-light);
  position: relative;
}

.faq-layout-grid {
  display: grid;
  grid-template-columns: 0.35fr 0.65fr;
  gap: 60px;
  align-items: start;
}

.faq-content-left {
  position: sticky;
  top: 96px;
  padding-right: 12px;
}

.faq-header-title {
  font-size: 2.35rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-main);
  line-height: 1.15;
  margin-bottom: 16px;
}

.faq-header-intro {
  font-size: 1.05rem;
  color: var(--text-muted);
  line-height: 1.6;
}

/* Open Editorial FAQ List (12 Items, Audited Truth Copy) */
.faq-list-container {
  display: flex;
  flex-direction: column;
}

.faq-row-item {
  border-bottom: 1px solid var(--border-light);
}

.faq-row-item:first-child {
  border-top: 1px solid var(--border-light);
}

.faq-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 4px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
  cursor: pointer;
  list-style: none;
  letter-spacing: -0.015em;
  transition: color 150ms ease;
  user-select: none;
}

.faq-summary::-webkit-details-marker {
  display: none;
}

.faq-summary:hover,
.faq-summary:focus-visible {
  color: var(--brand-primary);
  outline: none;
}

.faq-icon-indicator {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-soft);
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1;
  transition: transform 180ms ease, color 150ms ease;
}

.faq-summary:hover .faq-icon-indicator,
.faq-summary:focus-visible .faq-icon-indicator {
  color: var(--brand-primary);
}

.faq-row-item[open] .faq-summary {
  color: var(--brand-primary);
}

.faq-row-item[open] .faq-icon-indicator {
  transform: rotate(45deg);
  color: var(--brand-primary);
}

.faq-answer-content {
  padding: 0 4px 22px 4px;
  font-size: 0.935rem;
  color: var(--text-muted);
  line-height: 1.65;
  max-width: 680px;
}

/* FAQ-Owned Separate Reduced Motion Block */
@media (prefers-reduced-motion: reduce) {
  .faq-summary,
  .faq-icon-indicator {
    transition: none !important;
  }
  
  .faq-row-item[open] .faq-icon-indicator {
    transform: none !important;
  }
}

/* ============================================================
   10. FOUNDER / TRUST MODULE V1A (VISIBLE REVIEW CANDIDATE)
   ============================================================ */
.section-founder-trust {
  /* COHESION-007: Founder/Trust 112/124 → 80/96 — reflective/quiet, less monumental */
  padding: 80px 24px 96px 24px;
  background: #ffffff;
  border-bottom: 1px solid var(--border-light);
  position: relative;
}

.founder-trust-grid {
  display: grid;
  grid-template-columns: 0.45fr 0.55fr;
  gap: 72px;
  align-items: start;
}

.founder-trust-left {
  padding-right: 16px;
}

.founder-trust-eyebrow {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brand-primary);
  background: var(--brand-light);
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  display: inline-block;
  margin-bottom: 18px;
}

.founder-trust-headline {
  font-size: 2.35rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-main);
  line-height: 1.15;
  margin-bottom: 20px;
}

.founder-trust-intro {
  font-size: 1.05rem;
  color: var(--text-muted);
  line-height: 1.65;
  margin-bottom: 28px;
}

.founder-note-block {
  padding-top: 24px;
  border-top: 1px dashed var(--border-medium);
  margin-top: 24px;
}

.founder-note-text {
  font-size: 0.95rem;
  color: var(--text-muted);
  line-height: 1.65;
  margin-bottom: 16px;
  font-style: normal;
}

.founder-attribution {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.attribution-label {
  font-size: 0.775rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-soft);
}

.attribution-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main);
}

/* Right Column: 3 Stacked Trust Facts */
.founder-trust-right {
  display: flex;
  flex-direction: column;
}

.trust-fact-row {
  padding: 28px 0;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trust-fact-row:first-child {
  padding-top: 0;
}

.trust-fact-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.trust-fact-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.015em;
  line-height: 1.3;
}

.trust-fact-desc {
  font-size: 0.925rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.trust-fact-link {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--brand-primary);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  transition: color 0.15s ease, transform 0.15s ease;
  width: fit-content;
}

.trust-fact-link:hover {
  color: var(--brand-hover);
  transform: translateX(2px);
}

/* Restrained Entry Motion Reveal */
.founder-trust-reveal-item {
  opacity: 1;
  transform: translateY(6px);
  transition: opacity 0.45s ease-out, transform 0.45s ease-out;
}

.home-reveal-ready .founder-trust-reveal-item:not(.revealed) {
  opacity: 0;
}

.founder-trust-reveal-item.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* Founder / Trust-Owned Separate Reduced Motion Block */
@media (prefers-reduced-motion: reduce) {
  .founder-trust-reveal-item {
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .home-reveal-ready .founder-trust-reveal-item:not(.revealed) {
    opacity: 1 !important;
    transform: none !important;
  }

  .trust-fact-link:hover {
    transition: none !important;
    transform: none !important;
  }
}


/* ============================================================
   11. FINAL CTA DECISION -> ACTION MODULE V1A (STRICT REPAIR PROTOTYPE)
   ============================================================ */
.section-final-cta {
  /* COHESION-008: Final CTA 112/124 → 80/96 — action follows trust without a huge separating gulf */
  padding: 80px 24px 96px 24px;
  background: var(--bg-page);
  border-bottom: 1px solid var(--border-light);
  position: relative;
}

.final-cta-container {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.final-cta-headline {
  font-size: 2.75rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: var(--text-main);
  line-height: 1.15;
  margin-bottom: 16px;
  text-wrap: balance;
}

.final-cta-body {
  font-size: 1.1rem;
  color: var(--text-muted);
  line-height: 1.6;
  max-width: 620px;
  margin: 0 auto 32px auto;
  text-wrap: pretty;
}

.final-cta-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.btn-final-cta-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 13px 32px;
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
  background-color: var(--brand-primary);
  border-radius: var(--radius-md);
  border: 1px solid var(--brand-primary);
  transition: background-color 0.15s ease;
  min-height: 44px;
}

.btn-final-cta-primary:hover,
.btn-final-cta-primary:focus-visible {
  background-color: var(--brand-hover);
  outline: none;
}

.final-cta-microcopy {
  font-size: 0.85rem;
  color: var(--text-soft);
  font-weight: 500;
  margin-top: 4px;
}

/* Restrained Entry Motion Reveal */
.final-cta-reveal-item {
  opacity: 1;
  transform: translateY(6px);
  transition: opacity 0.45s ease-out, transform 0.45s ease-out;
}

.home-reveal-ready .final-cta-reveal-item:not(.revealed) {
  opacity: 0;
}

.final-cta-reveal-item.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* Final CTA-Owned Separate Reduced Motion Block */
@media (prefers-reduced-motion: reduce) {
  .final-cta-reveal-item {
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }

  .home-reveal-ready .final-cta-reveal-item:not(.revealed) {
    opacity: 1 !important;
    transform: none !important;
  }

  .btn-final-cta-primary:hover {
    transition: none !important;
  }
}

/* Footer Positional Context Anchor */
.footer-positional-anchor {
  padding: 80px 24px 1800px 24px;
  background: #ffffff;
  text-align: center;
  border-top: 1px solid var(--border-light);
  color: var(--text-soft);
  font-size: 0.85rem;
  font-family: var(--font-mono);
}

/* =============================================================
   SITE FOOTER — HOME-01 FOOTER V1A
   Namespace: .site-footer / .footer-*
   Source isolation: Appended only — no baseline modification
   Wordmark: weight 900, tracking -0.035em per Brand Identity V1
   ============================================================= */

.site-footer {
  background: #ffffff;
  border-top: 1px solid var(--border-light, rgba(15,23,42,0.10));
  padding: 52px 24px 0 24px;
  position: relative;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
}

/* Main grid: 1 brand column + 3 nav columns */
.footer-grid {
  display: grid;
  grid-template-columns: 30% repeat(3, 1fr);
  gap: 40px 48px;
  margin-bottom: 40px;
  align-items: start;
}

/* Brand column */
.footer-brand-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Wordmark: Brand Identity V1 — weight 900, tracking -0.035em */
.footer-wordmark {
  font-family: var(--font-sans, 'Geist', 'Inter', sans-serif);
  font-size: 1.05rem;
  font-weight: 900;
  letter-spacing: -0.035em;
  color: var(--text-main, #0b0f19);
  text-decoration: none;
  line-height: 1;
  display: inline-block;
  transition: color 0.18s ease;
}

.footer-wordmark:hover {
  color: var(--accent, #4f46e5);
}

.footer-brand-desc {
  font-size: 0.84rem;
  line-height: 1.55;
  color: var(--text-soft, #64748b);
  margin: 0;
  max-width: 256px;
}

.footer-signin-link {
  font-size: 0.84rem;
  font-weight: 500;
  color: var(--text-soft, #64748b);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  transition: color 0.18s ease;
}

.footer-signin-link:hover {
  color: var(--text-main, #0b0f19);
}

/* Nav columns */
.footer-nav-col {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.footer-col-label {
  font-family: var(--font-sans, 'Geist', 'Inter', sans-serif);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.085em;
  text-transform: uppercase;
  color: var(--text-main, #0b0f19);
  margin: 0 0 15px 0;
}

.footer-link-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.footer-link {
  font-size: 0.875rem;
  color: var(--text-soft, #64748b);
  text-decoration: none;
  transition: color 0.18s ease, transform 0.14s ease;
  display: inline-block;
}

.footer-link:hover {
  color: var(--text-main, #0b0f19);
  transform: translateX(2px);
}

/* ── Compliance / Trust strip ────────────────────────────────── */
.footer-trust-strip {
  border-top: 1px solid var(--border-light, rgba(15,23,42,0.08));
  padding: 20px 0 22px 0;
  display: flex;
  align-items: flex-start;
  gap: 0;
  flex-wrap: wrap;
}

.footer-trust-item {
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-soft, #94a3b8);
  flex: 1 1 220px;
  padding: 0 28px 0 0;
}

.footer-trust-sep {
  display: block;
  width: 1px;
  height: 2.4em;
  background: var(--border-light, rgba(15,23,42,0.10));
  margin: 0 28px 0 0;
  flex-shrink: 0;
  align-self: center;
}

.footer-trust-strip .footer-trust-sep {
  flex: 0 0 1px;
}

.footer-trust-link {
  color: var(--text-soft, #94a3b8);
  text-decoration: none;
  font-size: 0.8rem;
  transition: color 0.18s ease;
}

.footer-trust-link:hover {
  color: var(--text-main, #0b0f19);
}

/* ── Bottom legal row ────────────────────────────────────────── */
.footer-bottom-row {
  border-top: 1px solid var(--border-light, rgba(15,23,42,0.08));
  padding: 16px 0 24px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.footer-copyright {
  font-size: 0.78rem;
  color: var(--text-soft, #94a3b8);
  font-weight: 400;
}

.footer-bottom-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.footer-bottom-link {
  font-size: 0.78rem;
  color: var(--text-soft, #94a3b8);
  text-decoration: none;
  transition: color 0.18s ease;
}

.footer-bottom-link:hover {
  color: var(--text-main, #0b0f19);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .footer-link,
  .footer-wordmark,
  .footer-signin-link,
  .footer-bottom-link,
  .footer-trust-link {
    transition: none !important;
    transform: none !important;
  }
}

/* Safe desktop-first wrapping */
@media (max-width: 900px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
  .footer-brand-col {
    grid-column: 1 / -1;
  }
  .footer-trust-sep {
    display: none;
  }
  .footer-trust-strip {
    flex-direction: column;
    gap: 10px;
  }
  .footer-trust-item {
    padding: 0;
    flex: unset;
  }
}

/* ============================================================
   HOME-01 DESKTOP COHESION V1A — PAGE-LEVEL CONTINUITY ONLY
   The rules below deliberately touch section shells, not modules.
   ============================================================ */

/* Explanatory family: process and rationale read as one sequence. */
.section-how-wrapper {
  padding-bottom: 64px;
  border-bottom: 0;
}

.section-why-wrapper {
  padding-top: 56px;
  background: #ffffff;
}

/* Relevance / decision family: the pricing surface remains the visual anchor. */
.section-photographers-wrapper {
  background: var(--bg-page);
  border-bottom: 0;
}

.section-pricing-wrapper {
  padding-top: 84px;
  border-bottom: 0;
}

/* Support / confidence family: resource help continues into objections. */
.section-resources-wrapper {
  padding: 56px 24px 64px;
  border-top: 0;
}

.section-faq-wrapper {
  padding: 56px 24px 80px;
  background: #ffffff;
  border-bottom: 0;
}

/* Closing family: trust settles into action before the preserved footer. */
.section-founder-trust {
  padding: 72px 24px 88px;
  background: var(--bg-page);
  border-bottom: 0;
}

.section-final-cta {
  padding: 72px 24px 80px;
  border-bottom: 0;
}

/* ============================================================
   HOME-01 RESPONSIVE V1 — additive responsive adaptation only.
   Desktop properties above remain the locked V1A baseline.
   ============================================================ */
.mobile-menu-toggle,
.mobile-navigation,
.mobile-document-summary { display: none; }

:focus-visible {
  outline: 3px solid rgba(79, 70, 229, 0.52);
  outline-offset: 3px;
}

@media (max-width: 1100px) {
  .navbar { padding: 0 24px; }
  .nav-links { gap: 14px; }
  .nav-actions { gap: 12px; }
  .photographers-grid { grid-template-columns: 0.43fr 0.57fr; gap: 36px; }
  .faq-layout-grid { gap: 42px; }
  .founder-trust-grid { gap: 48px; }
  .pricing-plan-col { padding: 32px 20px 28px; }
}

@media (max-width: 820px) {
  .navbar { height: 64px; padding: 0 20px; position: sticky; }
  .nav-links, .nav-actions { display: none; }
  .mobile-menu-toggle {
    width: 44px; height: 44px; display: inline-flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 5px; background: transparent;
    border: 1px solid transparent; border-radius: var(--radius-md); color: var(--text-main); cursor: pointer;
  }
  .mobile-menu-toggle span { width: 18px; height: 2px; border-radius: 2px; background: currentColor; }
  .mobile-navigation {
    display: block; position: absolute; top: 64px; left: 0; right: 0; background: #f8fafc;
    border-bottom: 1px solid var(--border-medium); box-shadow: 0 12px 20px rgba(15,23,42,.08); padding: 12px 20px 20px;
  }
  .mobile-navigation[hidden] { display: none; }
  .mobile-menu-links { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
  .mobile-menu-links a { min-height: 44px; display: flex; align-items: center; padding: 10px 12px; border-radius: var(--radius-sm); font-size: .95rem; font-weight: 650; color: var(--text-muted); }
  .mobile-menu-links a:hover, .mobile-menu-links a:focus-visible { background: var(--brand-light); color: var(--brand-primary); }
  .mobile-menu-links .mobile-menu-cta { grid-column: 1 / -1; justify-content: center; background: var(--brand-primary); color: #fff; margin-top: 6px; }
  .mobile-menu-links .mobile-menu-cta:hover, .mobile-menu-links .mobile-menu-cta:focus-visible { background: var(--brand-hover); color: #fff; }
  .landing-hero { padding-left: 24px; padding-right: 24px; }
  .section-how-wrapper, .section-why-wrapper, .section-photographers-wrapper, .section-pricing-wrapper, .section-resources-wrapper, .section-faq-wrapper, .section-founder-trust, .section-final-cta { padding-left: 24px; padding-right: 24px; }
  .section-header { margin-bottom: 38px; }
  .section-title { font-size: clamp(2rem, 5vw, 2.4rem); }
  .workflow-unified-surface { padding: 28px 22px 24px; }
  .workflow-rail-line { left: 38px; right: 38px; }
  .workflow-nodes-grid { gap: 8px; }
  .workflow-stage-node-item { min-height: 76px; padding: 8px 3px; }
  .stage-label-name { font-size: .84rem; }
  .stage-label-desc { font-size: .74rem; }
  .preview-body-layout { grid-template-columns: 168px minmax(0, 1fr); gap: 16px; padding: 16px; }
  .preview-sidebar { padding: 10px; }
  .preview-main-document { padding: 16px; }
  .doc-table td { font-size: .76rem; padding: 8px 5px; }
  .why-pillars-grid { grid-template-columns: repeat(2, 1fr); gap: 30px; }
  .why-pillar-card:last-child { grid-column: 1 / -1; max-width: calc(50% - 15px); }
  .photographers-grid, .faq-layout-grid, .founder-trust-grid { grid-template-columns: 1fr; gap: 36px; }
  .faq-content-left { position: static; padding: 0; }
  .pricing-grid-four { grid-template-columns: repeat(2, 1fr); }
  .pricing-plan-col:nth-child(2) { border-right: none; }
  .pricing-plan-col:nth-child(-n+2) { border-bottom: 1px solid var(--border-light); }
  .footer-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 540px) {
  .navbar { padding: 0 16px; }
  .mobile-navigation { padding-left: 16px; padding-right: 16px; }
  .landing-hero { padding: 62px 20px 64px; min-height: auto; }
  .hero-headline { font-size: clamp(2.35rem, 11vw, 3rem); line-height: 1.06; }
  .hero-subtitle { font-size: 1rem; }
  .btn-hero-cta { min-height: 44px; padding: 12px 22px; }
  .section-how-wrapper { padding: 56px 16px 60px; }
  .section-why-wrapper { padding: 48px 16px 60px; }
  .section-photographers-wrapper { padding: 60px 16px 64px; }
  .section-pricing-wrapper { padding: 60px 16px 68px; }
  .section-resources-wrapper { padding: 48px 16px 56px; }
  .section-faq-wrapper { padding: 52px 16px 60px; }
  .section-founder-trust { padding: 60px 16px 64px; }
  .section-final-cta { padding: 60px 16px 64px; }
  .section-title, .faq-header-title, .photographers-headline, .founder-trust-headline, .final-cta-headline { font-size: clamp(1.85rem, 8vw, 2.25rem); }
  .section-intro, .faq-header-intro, .final-cta-body { font-size: 1rem; }
  .workflow-unified-surface { padding: 18px 12px 14px; border-radius: 12px; }
  .workflow-track-container { margin-bottom: 14px; }
  .workflow-nodes-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .workflow-rail-line { display: none; }
  .workflow-stage-node-item { min-height: 58px; border: 1px solid var(--border-light); background: #fff; padding: 7px 6px; flex-direction: row; justify-content: flex-start; gap: 8px; text-align: left; }
  .workflow-stage-node-item.active { border-color: rgba(79,70,229,.35); }
  .node-circle { margin: 0; width: 30px; height: 30px; font-size: .72rem; flex: 0 0 auto; }
  .stage-label-name { margin: 0; font-size: .79rem; }
  .stage-label-desc { display: none; }
  .preview-topbar { height: 34px; padding: 0 10px; font-size: .62rem; }
  .preview-topbar .window-dots { display: none; }
  .preview-body-layout { grid-template-columns: 1fr; padding: 10px; }
  .preview-sidebar { display: none; }
  .preview-main-document { padding: 12px; min-width: 0; }
  .doc-header-flex { display: none; }
  .mobile-document-summary { display: grid; grid-template-columns: 1fr auto; gap: 3px 12px; padding-bottom: 12px; border-bottom: 1px solid var(--border-light); }
  .mobile-document-type { font-size: .67rem; color: var(--text-soft); font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
  .mobile-document-id { font-size: .95rem; color: var(--text-main); }
  .mobile-document-total { grid-column: 2; grid-row: 1 / span 2; align-self: center; font-size: 1.25rem; letter-spacing: -.03em; }
  .mobile-document-context { font-size: .75rem; color: var(--text-muted); }
  .mobile-document-status { grid-column: 1 / -1; margin-top: 5px; display: inline-flex; width: max-content; padding: 3px 8px; border-radius: 999px; color: var(--brand-primary); background: var(--brand-light); font-size: .7rem; font-weight: 700; }
  .doc-title { font-size: .89rem; }
  .doc-subtitle { font-size: .67rem; }
  .doc-status-pill { padding: 3px 7px; font-size: .62rem; white-space: nowrap; }
  .doc-table th:nth-child(2), .doc-table td:nth-child(2), .doc-table th:nth-child(3), .doc-table td:nth-child(3) { display: none; }
  .doc-table { margin: 8px 0 10px; }
  .doc-table th { display: none; }
  .doc-table td { font-size: .7rem; line-height: 1.35; padding: 8px 3px; }
  .doc-footer-flex { align-items: flex-end; gap: 8px; }
  .doc-footer-note { font-size: .65rem; }
  .doc-total-val { font-size: .88rem; white-space: nowrap; }
  .why-pillars-grid { grid-template-columns: 1fr; gap: 26px; }
  .why-pillar-card:last-child { grid-column: auto; max-width: none; }
  .photographers-grid, .faq-layout-grid, .founder-trust-grid { gap: 28px; }
  .photographers-content-left { padding: 0; }
  .pricing-grid-four { grid-template-columns: 1fr; }
  .pricing-plan-col { border-right: none; border-bottom: 1px solid var(--border-light); padding: 22px 20px 20px; }
  .pricing-plan-header { margin-bottom: 12px; }
  .pricing-price-slot { height: 48px; margin: 8px 0; }
  .price-currency-val { font-size: 2.35rem; }
  .pricing-plan-positioning { margin-bottom: 14px; padding-bottom: 12px; }
  .pricing-feature-list { gap: 9px; margin-bottom: 16px; }
  .pricing-plan-col:nth-child(2) { border-right: none; }
  .pricing-plan-col:nth-child(-n+2) { border-bottom: 1px solid var(--border-light); }
  .pricing-plan-col:last-child { border-bottom: none; }
  .pricing-plan-footer { height: auto; padding-top: 14px; }
  .btn-action-start-free, .btn-action-view-plan { min-height: 44px; }
  .resource-row-item { min-height: 56px; padding-top: 15px; padding-bottom: 15px; }
  .faq-summary { min-height: 56px; padding: 16px 4px; font-size: 1rem; }
  .final-cta-actions { width: 100%; }
  .btn-final-cta-primary { width: 100%; max-width: 360px; }
  .site-footer { padding: 44px 16px 0; }
  .footer-grid { grid-template-columns: 1fr; gap: 28px; }
  .footer-brand-col { grid-column: auto; }
  .footer-link { display: inline-flex; min-height: 40px; align-items: center; }
  .footer-trust-strip { align-items: flex-start; }
  .footer-bottom-row { flex-direction: column; align-items: flex-start; gap: 14px; }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-menu-toggle span, .mobile-navigation { transition: none !important; transform: none !important; }
}

/* ============================================================
   HOME-01 MOBILE VISUAL SYSTEM V1 — mobile-only composition.
   Desktop and tablet stay on the responsive-v1a baseline.
   ============================================================ */
@media (max-width: 540px) {
  :root { --mobile-gutter: 20px; --mobile-inset: 18px; --mobile-rule: rgba(15, 23, 42, .10); }
  .navbar { padding: 0 var(--mobile-gutter); }
  .mobile-navigation { padding: 12px var(--mobile-gutter) 20px; }
  .landing-hero { padding: 52px var(--mobile-gutter) 56px; }
  .hero-headline { font-size: clamp(2.1rem, 9.2vw, 2.45rem); line-height: 1.08; letter-spacing: -.045em; }
  .hero-subtitle { max-width: 34ch; }
  .btn-hero-cta, .btn-final-cta-primary, .btn-action-start-free, .btn-action-view-plan { min-height: 48px; }

  .section-how-wrapper { padding: 56px var(--mobile-gutter) 32px; }
  .section-why-wrapper { padding: 32px var(--mobile-gutter) 56px; }
  .section-photographers-wrapper, .section-pricing-wrapper { padding: 72px var(--mobile-gutter); }
  .section-resources-wrapper, .section-faq-wrapper { padding: 56px var(--mobile-gutter); }
  .section-founder-trust, .section-final-cta { padding: 72px var(--mobile-gutter); }
  .section-header, .pricing-header { margin-bottom: 28px; }
  .section-title, .faq-header-title, .photographers-headline, .founder-trust-headline, .final-cta-headline { font-size: clamp(1.7rem, 7.2vw, 2rem); line-height: 1.12; letter-spacing: -.038em; }
  .section-intro, .faq-header-intro, .final-cta-body, .photographers-body { font-size: 1rem; line-height: 1.58; }

  /* How: one compact controller, then one active product state. */
  .workflow-unified-surface { padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
  .workflow-track-container { margin: 0 0 18px; }
  .workflow-rail-line { display: none; }
  .workflow-nodes-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 0; border-bottom: 1px solid var(--mobile-rule); }
  .workflow-stage-node-item { min-height: 52px; padding: 6px 2px 9px; border: 0; border-radius: 0; background: transparent; display: block; text-align: center; }
  .workflow-stage-node-item.active { background: transparent; border-bottom: 2px solid var(--brand-primary); }
  .workflow-stage-node-item.completed { background: transparent; }
  .node-circle { width: auto; height: auto; margin: 0 0 4px; border: 0; background: transparent; color: var(--text-soft); font: 700 .62rem var(--font-mono); }
  .workflow-stage-node-item.active .node-circle { color: var(--brand-primary); box-shadow: none; transform: none; }
  .stage-label-name { font-size: .66rem; line-height: 1.12; font-weight: 700; }
  .stage-label-desc { display: none; }
  .product-evidence-card { border: 1px solid var(--mobile-rule); border-radius: 12px; box-shadow: none; overflow: hidden; }
  .preview-topbar { height: 34px; padding: 0 var(--mobile-inset); background: #fbfcfe; border-bottom: 1px solid var(--mobile-rule); }
  .preview-topbar .window-dots, .preview-meta-stage { display: none; }
  .preview-body-layout { padding: 0; }
  .preview-main-document { padding: var(--mobile-inset); }
  .mobile-document-summary { gap: 4px 12px; padding-bottom: 14px; }
  .mobile-document-type { font-size: .68rem; }
  .mobile-document-id { font-size: 1rem; }
  .mobile-document-total { font-size: 1.5rem; }
  .mobile-document-context { font-size: .8rem; }
  .mobile-document-status { margin-top: 7px; padding: 4px 9px; font-size: .72rem; }
  .doc-table { margin: 10px 0 12px; }
  .doc-table tbody tr + tr { border-top: 1px solid var(--border-light); }
  .doc-table td { padding: 10px 0; font-size: .75rem; }
  .doc-footer-flex { padding-top: 2px; }

  /* Photographer evidence: quiet single surface and grouped rows. */
  .photographers-grid { gap: 32px; }
  .photography-job-surface { border-radius: 12px; box-shadow: none; }
  .job-surface-header { padding: var(--mobile-inset); border-bottom: 1px solid var(--mobile-rule); }
  .job-title { font-size: 1.18rem; }
  .job-category-badge { padding: 3px 7px; font-size: .62rem; }
  .job-surface-body { padding: 2px var(--mobile-inset); }
  .job-section-block { padding: 15px 0; border-bottom: 1px solid var(--mobile-rule); }
  .job-section-block:last-child { border-bottom: 0; }
  .job-section-label { margin-bottom: 8px; font-size: .65rem; }
  .job-scope-row { padding: 7px 0; }
  .job-scope-total { margin-top: 8px; padding-top: 10px; }

  /* Pricing: one continuous comparison system, not four landing cards. */
  .pricing-unified-surface { border: 1px solid var(--mobile-rule); border-radius: 12px; box-shadow: none; overflow: hidden; }
  .pricing-plan-col { padding: 22px var(--mobile-inset) 20px; border-right: 0; border-bottom: 1px solid var(--mobile-rule); }
  .pricing-plan-col.col-pro { background: rgba(79, 70, 229, .035); }
  .pricing-plan-header { margin-bottom: 14px; }
  .pricing-price-slot { height: auto; min-height: 42px; margin: 6px 0 10px; }
  .price-currency-val { font-size: 2.1rem; }
  .pricing-plan-positioning { margin-bottom: 12px; padding-bottom: 12px; }
  .pricing-feature-list { gap: 8px; margin-bottom: 16px; }
  .pricing-feature-item { font-size: .86rem; }
  .pricing-plan-footer { padding-top: 0; }
  .studio-empty-body { min-height: 0; padding: 0 0 4px; }

  .resource-row-item { padding: 16px 0; }
  .faq-summary { padding: 16px 0; }
  .founder-trust-grid { gap: 28px; }
  .final-cta-actions { margin-top: 24px; }
  .site-footer { padding: 48px var(--mobile-gutter) 0; }
  .footer-grid { gap: 24px; }
  .footer-nav-col { padding-top: 18px; border-top: 1px solid var(--mobile-rule); }
  .footer-link { min-height: 38px; }
  .footer-trust-strip { margin-top: 32px; padding: 20px 0; border-top: 1px solid var(--mobile-rule); border-bottom: 1px solid var(--mobile-rule); }
  .footer-bottom-row { padding: 20px 0; }
}

/* ============================================================
   HOME-01 MOBILE VISUAL SYSTEM V1A — surgical review refinements.
   Scope: <=540px only; approved mobile composition remains intact.
   ============================================================ */
@media (max-width: 540px) {
  /* Hero: use the actual markup selectors and restore a balanced 3-line read. */
  .hero-title { font-size: clamp(2.1rem, 9.1vw, 2.32rem); line-height: 1.08; letter-spacing: -.045em; max-width: 10.7ch; }
  .hero-lede { font-size: 1rem; line-height: 1.58; max-width: 35ch; }

  /* How: one active signal only — no inherited desktop circle/blob. */
  .workflow-stage-node-item { min-height: 58px; padding: 5px 2px 10px; }
  .workflow-stage-node-item.active .node-circle { background: transparent; border: 0; box-shadow: none; transform: none; }
  .workflow-stage-node-item.completed .node-circle { background: transparent; border: 0; box-shadow: none; transform: none; color: var(--text-soft); }
  .stage-label-name { font-size: clamp(.72rem, 3.1vw, .78rem); line-height: 1.16; }
  .node-circle { margin-bottom: 5px; }

  /* Stage 3: retain the truthful affordance as a readable, quiet second row. */
  .doc-footer-flex { align-items: flex-start; flex-wrap: wrap; gap: 8px; }
  .doc-footer-flex > div:last-child { margin-left: auto; flex-wrap: wrap; justify-content: flex-end; }
  #convert-affordance-slot { flex: 0 0 100%; display: flex; justify-content: flex-end; margin-top: 4px; }
  .btn-convert-affordance { margin-left: 0; white-space: nowrap; min-height: 28px; }

  /* Resources: editorial full-width rows instead of a compressed desktop grid. */
  .resources-editorial-surface { border: 0; border-radius: 0; box-shadow: none; background: transparent; overflow: visible; }
  .resource-row-item { grid-template-columns: 1fr auto; gap: 8px 12px; padding: 20px 0; align-items: start; }
  .resource-row-item > :first-child { grid-column: 1 / -1; }
  .resource-row-content { grid-column: 1; gap: 6px; min-width: 0; }
  .resource-row-title { font-size: 1rem; line-height: 1.32; }
  .resource-row-desc { font-size: .9rem; line-height: 1.5; }
  .resource-arrow-cell { grid-column: 2; grid-row: 2; align-self: start; padding-top: 2px; }
  .resource-category-tag { font-size: .66rem; padding: 3px 8px; }
  .resources-secondary-nav { margin-top: 24px; padding-top: 18px; gap: 18px; }

  /* Founder / trust: same content, a calmer hand-off into the closing CTA. */
  .section-founder-trust { padding-top: 60px; padding-bottom: 56px; }
  .founder-trust-grid { gap: 22px; }
  .founder-trust-intro { margin-bottom: 20px; }
  .founder-note-block { margin-top: 18px; padding-top: 18px; }
  .trust-fact-row { padding: 20px 0; gap: 6px; }

  /* Footer: compact professional closure, with Product + Resources side by side. */
  .site-footer { padding-top: 36px; }
  .footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px 20px; margin-bottom: 28px; }
  .footer-brand-col, .footer-nav-col:last-child { grid-column: 1 / -1; }
  .footer-nav-col { padding-top: 0; border-top: 0; }
  .footer-brand-col { gap: 9px; }
  .footer-brand-desc { max-width: 31ch; }
  .footer-col-label { margin-bottom: 9px; }
  .footer-link-list { gap: 3px; }
  .footer-link { min-height: 32px; line-height: 1.3; padding: 4px 0; align-items: flex-start; }
  .footer-trust-strip { margin-top: 22px; padding: 16px 0; gap: 8px; }
  .footer-trust-item { font-size: .76rem; line-height: 1.45; }
  .footer-bottom-row { padding: 16px 0 20px; gap: 10px; }
}

/* ============================================================
   HOME-01 MOBILE CLARITY V1B — typography, reading width, density.
   Scope: <=540px only. No product or compositional restructuring.
   ============================================================ */
@media (max-width: 540px) {
  /* Three spacing roles: compact 32px, standard 52px, major 64px. */
  .landing-hero { min-height: 0; height: auto; padding: 42px var(--mobile-gutter) 40px; }
  .landing-hero::before { background-size: 64px 64px; opacity: .44; }
  .hero-content-center { max-width: 350px; }
  .hero-badge { margin-bottom: 20px; padding: 4px 12px; font-size: .7rem; }
  .hero-title { font-size: clamp(2.05rem, 8.8vw, 2.22rem); line-height: 1.07; max-width: 11.4ch; margin: 0 auto 18px; text-wrap: balance; }
  .hero-lede { font-size: .98rem; line-height: 1.55; max-width: 32ch; margin-bottom: 22px; }
  .hero-actions { margin-bottom: 13px; }
  .hero-trust-line { display: grid; gap: 4px; margin-top: 0; font-size: .73rem; line-height: 1.42; font-weight: 500; }
  .hero-trust-divider { display: none; }

  /* Reusable mobile eyebrow and headline hierarchy. */
  .section-kicker, .founder-trust-eyebrow { font-size: .65rem; letter-spacing: .075em; padding: 3px 8px; margin-bottom: 12px; }
  .section-title, .photographers-headline, .founder-trust-headline, .final-cta-headline { font-size: clamp(1.72rem, 7vw, 1.94rem); line-height: 1.13; }
  .faq-header-title { font-size: clamp(1.55rem, 6.5vw, 1.78rem); line-height: 1.16; }
  .section-intro, .faq-header-intro, .photographers-body, .founder-trust-intro, .final-cta-body { font-size: .95rem; line-height: 1.58; max-width: 33ch; }
  .section-intro, .faq-header-intro { margin-left: auto; margin-right: auto; }
  .photographers-body, .founder-trust-intro { margin-bottom: 18px; }
  .final-cta-body { margin-bottom: 24px; }

  /* Established modules retain their structure; only hierarchy and density shift. */
  .section-how-wrapper { padding-top: 52px; padding-bottom: 32px; }
  .section-header { margin-bottom: 24px; }
  .workflow-track-container { margin-bottom: 14px; }
  .mobile-document-type, .job-section-label, .resource-category-tag { font-size: .64rem; }
  .mobile-document-context, .doc-footer-note { color: var(--text-soft); }
  .doc-table td { font-size: .73rem; }
  .section-why-wrapper { padding-top: 32px; padding-bottom: 52px; }
  .why-pillars-grid { gap: 20px; }
  .pillar-title { font-size: 1rem; }
  .pillar-text { font-size: .92rem; line-height: 1.52; }
  .section-photographers-wrapper { padding-top: 64px; padding-bottom: 64px; }
  .photographers-grid { gap: 26px; }
  .section-pricing-wrapper { padding-top: 64px; padding-bottom: 64px; }
  .pricing-header { margin-bottom: 24px; }
  .pricing-plan-positioning { font-size: .88rem; }

  .section-resources-wrapper { padding-top: 52px; padding-bottom: 48px; }
  .resources-header { margin-bottom: 28px; }
  .resource-row-item { padding: 17px 0; }
  .resource-row-title { font-size: .98rem; line-height: 1.3; }
  .resource-row-desc { font-size: .86rem; line-height: 1.48; color: var(--text-soft); }
  .resources-secondary-nav { margin-top: 18px; padding-top: 14px; }
  .section-faq-wrapper { padding-top: 48px; padding-bottom: 52px; }
  .faq-summary { min-height: 50px; padding: 13px 0; font-size: .95rem; line-height: 1.38; }

  .section-founder-trust { padding-top: 56px; padding-bottom: 48px; }
  .founder-trust-headline { max-width: 17ch; }
  .founder-note-text, .trust-fact-desc { font-size: .9rem; line-height: 1.55; }
  .trust-fact-row { padding: 17px 0; }
  .trust-fact-title { font-size: 1rem; }
  .section-final-cta { padding-top: 56px; padding-bottom: 52px; }
  .final-cta-container { max-width: 34ch; }

  /* Footer remains complete but recedes into navigation/legal closure. */
  .site-footer { padding-top: 32px; }
  .footer-grid { gap: 20px 18px; margin-bottom: 22px; }
  .footer-col-label { font-size: .66rem; margin-bottom: 7px; color: var(--text-muted); }
  .footer-link-list { gap: 1px; }
  .footer-link { min-height: 30px; padding: 3px 0; font-size: .82rem; color: var(--text-soft); }
  .footer-brand-desc { font-size: .8rem; line-height: 1.5; }
  .footer-trust-strip { margin-top: 18px; padding: 14px 0; }
  .footer-trust-item, .footer-trust-link { font-size: .73rem; line-height: 1.42; }
  .footer-bottom-row { padding: 14px 0 18px; }
  .footer-copyright, .footer-bottom-link { font-size: .74rem; }
}
`;

export default function HomeV1() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const listen = (target, type, handler) => {
      target?.addEventListener(type, handler);
      return () => target?.removeEventListener(type, handler);
    };
    const cleanups = [];

    const disclosures = [
      ['trigger-how', 'menu-how', 'nav-item-how'],
      ['trigger-resources', 'menu-resources', 'nav-item-resources'],
    ].map(([triggerId, menuId, containerId]) => ({
      trigger: root.querySelector(`#${triggerId}`),
      menu: root.querySelector(`#${menuId}`),
      container: root.querySelector(`#${containerId}`),
    }));
    const closeDisclosure = ({ trigger, menu, container }, returnFocus = false) => {
      container?.classList.remove('open');
      trigger?.setAttribute('aria-expanded', 'false');
      if (menu) menu.hidden = true;
      if (returnFocus) trigger?.focus();
    };
    const closeAllDisclosures = (returnFocus = false) => disclosures.forEach((item) => closeDisclosure(item, returnFocus));
    const openDisclosure = (current) => {
      disclosures.filter((item) => item !== current).forEach((item) => closeDisclosure(item));
      current.container?.classList.add('open');
      current.trigger?.setAttribute('aria-expanded', 'true');
      if (current.menu) current.menu.hidden = false;
    };
    disclosures.forEach((item) => {
      const { trigger, menu, container } = item;
      if (!trigger || !menu || !container) return;
      const items = Array.from(menu.querySelectorAll('.dropdown-item'));
      cleanups.push(listen(trigger, 'click', () => (trigger.getAttribute('aria-expanded') === 'true' ? closeDisclosure(item) : openDisclosure(item))));
      cleanups.push(listen(trigger, 'keydown', (event) => {
        if (event.key === 'ArrowDown') { event.preventDefault(); openDisclosure(item); items[0]?.focus(); }
        if (event.key === 'Escape') { event.preventDefault(); closeDisclosure(item, true); }
      }));
      items.forEach((link, index) => cleanups.push(listen(link, 'keydown', (event) => {
        if (event.key === 'ArrowDown') { event.preventDefault(); (items[index + 1] || items[0])?.focus(); }
        if (event.key === 'ArrowUp') { event.preventDefault(); (items[index - 1] || trigger)?.focus(); }
        if (event.key === 'Escape') { event.preventDefault(); closeDisclosure(item, true); }
      })));
      cleanups.push(listen(container, 'focusout', (event) => { if (!container.contains(event.relatedTarget)) closeDisclosure(item); }));
    });
    cleanups.push(listen(document, 'pointerdown', (event) => { if (!root.contains(event.target)) closeAllDisclosures(); }));

    const menuToggle = root.querySelector('.mobile-menu-toggle');
    const mobileMenu = root.querySelector('#mobile-navigation');
    const closeMobileMenu = ({ restoreFocus = false } = {}) => {
      if (!menuToggle || !mobileMenu) return;
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation menu');
      mobileMenu.hidden = true;
      document.body.classList.remove('mobile-menu-open');
      if (restoreFocus) menuToggle.focus();
    };
    const openMobileMenu = () => {
      if (!menuToggle || !mobileMenu) return;
      closeAllDisclosures();
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Close navigation menu');
      mobileMenu.hidden = false;
      document.body.classList.add('mobile-menu-open');
    };
    cleanups.push(listen(menuToggle, 'click', () => (mobileMenu?.hidden ? openMobileMenu() : closeMobileMenu())));
    mobileMenu?.querySelectorAll('a').forEach((link) => cleanups.push(listen(link, 'click', () => closeMobileMenu())));
    cleanups.push(listen(document, 'keydown', (event) => { if (event.key === 'Escape' && mobileMenu && !mobileMenu.hidden) closeMobileMenu({ restoreFocus: true }); }));
    cleanups.push(listen(document, 'pointerdown', (event) => { if (mobileMenu && !mobileMenu.hidden && !mobileMenu.contains(event.target) && !menuToggle?.contains(event.target)) closeMobileMenu(); }));
    cleanups.push(listen(window, 'resize', () => { if (window.innerWidth > 820) closeMobileMenu(); }));

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const revealItems = ['fp-section-reveal', 'resources-surface-reveal', 'founder-trust-reveal', 'final-cta-reveal']
      .map((id) => root.querySelector(`#${id}`))
      .filter(Boolean);
    const revealAll = () => revealItems.forEach((item) => item.classList.add('revealed'));
    if (motionQuery.matches || typeof IntersectionObserver === 'undefined') {
      revealAll();
    } else if (revealItems.length) {
      root.classList.add('home-reveal-ready');
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.01, rootMargin: '0px 0px -5% 0px' });
      revealItems.forEach((item) => revealObserver.observe(item));
      cleanups.push(() => revealObserver.disconnect());
    }
    cleanups.push(listen(motionQuery, 'change', () => { if (motionQuery.matches) revealAll(); }));
    cleanups.push(() => root.classList.remove('home-reveal-ready'));

    const stages = {
      1: ['STAGE 1: QUOTE SENT', 'badge-stage-1', 'Quote Sent', 'Commercial Photography Quote #Q-2026-084', 'Prepared for Maya Chen / Northline Studio • Sent Aug 10, 2026', 'Quote delivered to client for review', '$4,800.00', false, [['Commercial Photo Shoot (Full Day Directing & Crew)', '1', '$2,400.00', '$2,400.00'], ['High-Res Digital Licensing (2-Year Rights)', '1', '$1,600.00', '$1,600.00'], ['Color Grading & Retouching (20 Selected Master Assets)', '1', '$800.00', '$800.00']]],
      2: ['STAGE 2: CLIENT APPROVED', 'badge-stage-2', 'Client Approved', 'Quote #Q-2026-084', 'Approved by Northline Studio • Active Working Reference', 'Client approval recorded • Scope locked as working baseline', '$4,800.00', false, [['Commercial Photo Shoot (Full Day Directing & Crew)', '1', '$2,400.00', '$2,400.00'], ['High-Res Digital Licensing (2-Year Rights)', '1', '$1,600.00', '$1,600.00'], ['Color Grading & Retouching (20 Selected Master Assets)', '1', '$800.00', '$800.00']]],
      3: ['STAGE 3: READY TO INVOICE', 'badge-stage-3', 'Ready to Invoice', 'Approved Scope #Q-2026-084', 'Northline Studio • Ready for Invoicing Milestone', 'Agreed scope reached invoicing milestone', '$4,800.00', true, [['Commercial Photo Shoot (Full Day Directing & Crew)', '1', '$2,400.00', '$2,400.00'], ['High-Res Digital Licensing & Post-Processing', '1', '$2,400.00', '$2,400.00']]],
      4: ['STAGE 4: PAYMENT RECORDED', 'badge-stage-4', 'Payment Recorded', 'Project Record #INV-2026-084', 'Northline Studio • Client History Record', 'Payment status recorded in client history', '$4,800.00', false, [['Commercial Photo Shoot & Production Service', '1', '$2,400.00', '$2,400.00'], ['Image Licensing & Post-Processing Deliverables', '1', '$2,400.00', '$2,400.00']]],
    };
    let autoplay = null;
    let userInteracted = false;
    const setText = (selector, value) => { const element = root.querySelector(selector); if (element) element.textContent = value; };
    const applyStage = (number) => {
      const [name, badge, status, title, subtitle, note, total, showConvert, rows] = stages[number];
      const fill = root.querySelector('#track-rail-fill'); if (fill) fill.style.width = `${((number - 1) / 3) * 100}%`;
      [1, 2, 3, 4].forEach((index) => { const node = root.querySelector(`#stage-node-${index}`); const sidebar = root.querySelector(`#sb-item-${index}`); if (node) { node.className = `workflow-stage-node-item${index === number ? ' active' : index < number ? ' completed' : ''}`; node.setAttribute('aria-pressed', String(index === number)); } if (sidebar) sidebar.className = `sidebar-item${index === number ? ' active' : ''}`; });
      const pill = root.querySelector('#preview-meta-pill'); if (pill) { pill.className = `preview-meta-stage ${badge}`; pill.textContent = name; }
      setText('#doc-title-text', title); setText('#doc-sub-text', subtitle); setText('#doc-total-val', total); setText('#mobile-doc-total', total); setText('#mobile-doc-context', 'Northline Studio'); setText('#mobile-doc-status', status); setText('#mobile-doc-type', status === 'Payment Recorded' ? 'Project Record' : status === 'Ready to Invoice' ? 'Approved Scope' : 'Quote'); setText('#mobile-doc-id', title.match(/#(?:Q|INV)-[\d-]+/)?.[0]?.slice(1) || 'Q-2026-084');
      const badgeEl = root.querySelector('#doc-status-badge'); if (badgeEl) { badgeEl.className = `doc-status-pill ${badge}`; badgeEl.textContent = status; }
      const noteEl = root.querySelector('#doc-footer-note'); if (noteEl) noteEl.lastChild.nodeValue = ` ${note}`;
      const slot = root.querySelector('#convert-affordance-slot'); if (slot) slot.innerHTML = showConvert ? '<span class="btn-convert-affordance">Convert to Invoice →</span>' : '';
      const tbody = root.querySelector('#doc-items-tbody'); if (tbody) tbody.innerHTML = rows.map(([description, quantity, rate, amount]) => `<tr><td>${description}</td><td style="text-align: center;">${quantity}</td><td style="text-align: right;">${rate}</td><td style="text-align: right; font-weight: 600;">${amount}</td></tr>`).join('');
    };
    const cancelAutoplay = () => { userInteracted = true; if (autoplay) window.clearInterval(autoplay); autoplay = null; };
    const startAutoplay = () => { if (userInteracted || motionQuery.matches) return; let stage = 1; applyStage(stage); autoplay = window.setInterval(() => { if (userInteracted || motionQuery.matches || stage >= 4) { if (autoplay) window.clearInterval(autoplay); autoplay = null; return; } stage += 1; applyStage(stage); }, 1250); };
    const workflow = root.querySelector('#how-corvioz-works');
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); startAutoplay(); } }, { threshold: 0.3 });
    if (workflow) observer.observe(workflow);
    cleanups.push(() => observer.disconnect());
    cleanups.push(listen(motionQuery, 'change', () => { if (motionQuery.matches) cancelAutoplay(); }));
    [1, 2, 3, 4].forEach((number) => { const node = root.querySelector(`#stage-node-${number}`); cleanups.push(listen(node, 'click', () => { cancelAutoplay(); applyStage(number); })); cleanups.push(listen(node, 'keydown', (event) => { const next = event.key === 'ArrowRight' ? number + 1 : event.key === 'ArrowLeft' ? number - 1 : number; if (next >= 1 && next <= 4 && next !== number) { event.preventDefault(); cancelAutoplay(); root.querySelector(`#stage-node-${next}`)?.focus(); applyStage(next); } })); });

    return () => { if (autoplay) window.clearInterval(autoplay); document.body.classList.remove('mobile-menu-open'); cleanups.forEach((cleanup) => cleanup?.()); };
  }, []);
  return <div data-home-v1 ref={rootRef}><style>{styles}</style><div dangerouslySetInnerHTML={{ __html: markup }} /></div>;
}
