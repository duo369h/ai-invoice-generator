'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicHeader from "../components/PublicHeader";
import SharedFooter from "../components/SharedFooter";
import { createBrowserSupabaseClient } from "../lib/supabase-client";
import { loadPaddleScript } from "../lib/paddle-client";
import { saveSelectedPlan } from "../lib/intent-store";
import "./pricing.css";

const CREATE_QUOTE_URL = "/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote";

const FAQ_DATA = [
  {
    id: "faq-ans-1",
    question: "What counts as a document?",
    answer: "Each new quote or invoice you create in your workspace counts as one document toward your plan's allowance (5 per cycle on Free, 30 per billing cycle on Starter, and Unlimited on Pro)."
  },
  {
    id: "faq-ans-2",
    question: "Do edits count toward my limit?",
    answer: "No. Editing, updating, revising, or sending an existing quote or invoice does not count as a new document. Only creating a new document counts toward your cycle allowance."
  },
  {
    id: "faq-ans-3",
    question: "What happens when I reach my limit?",
    answer: "Final account behavior and creation resumption rules for reached limits are being verified for launch. The production details will be confirmed before release."
  },
  {
    id: "faq-ans-4",
    question: "Does Free include PDF export?",
    answer: "Yes. Free includes PDF export for quotes and invoices with Corvioz branding. Starter and Pro use clean PDFs."
  },
  {
    id: "faq-ans-5",
    question: "What changes when I move to Pro?",
    answer: "Pro adds unlimited new documents, Client Portal, and client approval."
  },
  {
    id: "faq-ans-6",
    question: "What is included in Client Portal?",
    answer: "The Client Portal gives Pro users a client-facing link for shared quotes and invoices. Client approval applies to quotes."
  },
  {
    id: "faq-ans-7",
    question: "Can I upgrade later?",
    answer: "Plan upgrade workflows and mid-cycle adjustments are currently in final verification for launch. Full upgrade details will be available upon release."
  },
  {
    id: "faq-ans-8",
    question: "Can I switch between monthly and yearly billing?",
    answer: "Billing cadence switching and subscription adjustment rules are being finalized for launch. The production policy will be published prior to release."
  }
];

export default function PricingPage() {
  const router = useRouter();
  const [cadence, setCadence] = useState("monthly");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [cardsEntered, setCardsEntered] = useState(false);
  const [entryAnimating, setEntryAnimating] = useState(true);
  const [priceAnimClass, setPriceAnimClass] = useState("");
  const [session, setSession] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const cardsClusterRef = useRef(null);
  const billingFieldsetRef = useRef(null);
  const toggleIndicatorRef = useRef(null);
  const labelMonthlyRef = useRef(null);
  const labelYearlyRef = useRef(null);
  const faqContainersRef = useRef([]);

  // Auth session check
  useEffect(() => {
    try {
      const supabase = createBrowserSupabaseClient();
      if (supabase) {
        supabase.auth.getSession().then(({ data }) => {
          setSession(data?.session || null);
        });
      }
    } catch (err) {
      console.warn("Auth check failed:", err);
    }
  }, []);

  // Update sliding toggle indicator
  const updateToggleIndicator = useCallback((activeCadence) => {
    if (!billingFieldsetRef.current || !toggleIndicatorRef.current) return;
    const activeLabel = activeCadence === "yearly" ? labelYearlyRef.current : labelMonthlyRef.current;
    if (!activeLabel) return;

    const toggleRect = billingFieldsetRef.current.getBoundingClientRect();
    const labelRect = activeLabel.getBoundingClientRect();
    const leftOffset = labelRect.left - toggleRect.left;
    const width = labelRect.width;

    toggleIndicatorRef.current.style.transform = `translateX(${leftOffset - 4}px)`;
    toggleIndicatorRef.current.style.width = `${width}px`;
  }, []);

  useEffect(() => {
    updateToggleIndicator(cadence);
    const handleResize = () => updateToggleIndicator(cadence);
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [cadence, updateToggleIndicator]);

  // Card entry IntersectionObserver with canonical 1200ms safety fallback
  useEffect(() => {
    const isReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReducedMotion) {
      setCardsEntered(true);
      setEntryAnimating(false);
      return;
    }

    setEntryAnimating(true);
    let entryBufferTimer = null;
    let fallbackTimer = null;

    if ("IntersectionObserver" in window && cardsClusterRef.current) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCardsEntered(true);
            observer.disconnect();
            entryBufferTimer = setTimeout(() => {
              setEntryAnimating(false);
            }, 600);
          }
        });
      }, {
        rootMargin: "0px 0px -40px 0px",
        threshold: 0.15
      });

      observer.observe(cardsClusterRef.current);

      // Canonical 1200ms safety fallback ensures cards never remain hidden
      fallbackTimer = setTimeout(() => {
        setCardsEntered(true);
        setEntryAnimating(false);
      }, 1200);

      return () => {
        observer.disconnect();
        if (entryBufferTimer) clearTimeout(entryBufferTimer);
        if (fallbackTimer) clearTimeout(fallbackTimer);
      };
    } else {
      setCardsEntered(true);
      setEntryAnimating(false);
    }
  }, []);

  // Handle Cadence Switch with verified exit -> value swap -> enter behavior
  const handleCadenceChange = (newCadence) => {
    if (newCadence === cadence) return;
    const isReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (isReducedMotion) {
      setCadence(newCadence);
      return;
    }

    setPriceAnimClass("price-exit");
    setTimeout(() => {
      setCadence(newCadence);
      setPriceAnimClass("price-enter");
      setTimeout(() => {
        setPriceAnimClass("");
      }, 140);
    }, 140);
  };

  // Tactile Single-Open FAQ Accordion with dynamic height measurement
  const toggleFaq = (index) => {
    const isReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCurrentlyOpen = openFaqIndex === index;

    if (isReducedMotion) {
      setOpenFaqIndex(isCurrentlyOpen ? null : index);
      return;
    }

    // If closing
    if (isCurrentlyOpen) {
      const container = faqContainersRef.current[index];
      if (container) {
        const startHeight = container.scrollHeight;
        container.style.height = `${startHeight}px`;
        container.offsetHeight; // reflow
        container.style.height = "0px";
        container.classList.remove("is-open");

        const handleTransitionEnd = (e) => {
          if (e.propertyName === "height") {
            setOpenFaqIndex(null);
            container.removeEventListener("transitionend", handleTransitionEnd);
          }
        };
        container.addEventListener("transitionend", handleTransitionEnd);
      } else {
        setOpenFaqIndex(null);
      }
      return;
    }

    // If opening (close previous first)
    if (openFaqIndex !== null && openFaqIndex !== index) {
      const prevContainer = faqContainersRef.current[openFaqIndex];
      if (prevContainer) {
        prevContainer.style.height = `${prevContainer.scrollHeight}px`;
        prevContainer.offsetHeight; // reflow
        prevContainer.style.height = "0px";
        prevContainer.classList.remove("is-open");
      }
    }

    setOpenFaqIndex(index);
    // Request animation frame to measure and animate
    requestAnimationFrame(() => {
      const container = faqContainersRef.current[index];
      if (container) {
        const content = container.querySelector(".faq-ans-content");
        const targetHeight = content ? content.scrollHeight : container.scrollHeight;
        container.style.height = "0px";
        container.offsetHeight; // reflow
        container.style.height = `${targetHeight}px`;
        container.classList.add("is-open");

        const handleTransitionEnd = (e) => {
          if (e.propertyName === "height") {
            container.style.height = "auto";
            container.removeEventListener("transitionend", handleTransitionEnd);
          }
        };
        container.addEventListener("transitionend", handleTransitionEnd);
      }
    });
  };

  // Handle Checkout / Upgrade Trigger
  const handlePlanAction = async (planId) => {
    if (planId === "free") {
      router.push(CREATE_QUOTE_URL);
      return;
    }

    if (!session) {
      saveSelectedPlan(planId, "/pricing");
      router.push(`/signup?redirect=/pricing&plan=${planId}`);
      return;
    }

    setCheckoutLoading(true);
    try {
      const isYearly = cadence === "yearly";
      const starterPriceId = isYearly
        ? process.env.NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID
        : process.env.NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID;
      const proPriceId = isYearly
        ? process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID
        : (process.env.NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID || process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID);

      const targetPriceId = planId === "starter" ? starterPriceId : proPriceId;

      const env = process.env.NEXT_PUBLIC_PADDLE_ENV;
      const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

      if (!token || !env || !targetPriceId || targetPriceId.includes("placeholder")) {
        alert("Checkout is temporarily unavailable while payment configurations are being finalized. Please check back shortly.");
        setCheckoutLoading(false);
        return;
      }

      const paddle = await loadPaddleScript();
      if (!paddle) {
        alert("Failed to load payment engine. Please check your connection.");
        setCheckoutLoading(false);
        return;
      }

      paddle.Environment.set(env);
      paddle.Initialize({
        token,
        eventCallback: (event) => {
          if (event.name === "checkout.completed") {
            window.location.href = "/dashboard?checkout=success";
          }
        }
      });

      paddle.Checkout.open({
        items: [{ priceId: targetPriceId, quantity: 1 }],
        customer: { email: session.user?.email },
        customData: { user_id: session.user?.id }
      });
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Checkout could not be initialized.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isYearly = cadence === "yearly";
  const starterPrice = isYearly ? "$90" : "$9";
  const starterPeriod = isYearly ? "/ yr" : "/ mo";
  const starterCompPeriod = isYearly ? "/ year" : "/ month";

  const proPrice = isYearly ? "$190" : "$19";
  const proPeriod = isYearly ? "/ yr" : "/ mo";
  const proCompPeriod = isYearly ? "/ year" : "/ month";

  return (
    <div className="pricing-assembly-page public-reconciliation-v2">
      {/* 1. GLOBAL SHARED PUBLIC HEADER */}
      <PublicHeader route="/pricing" />

      {/* MAIN CONTENT CONTAINER */}
      <main id="pricing-main">
        {/* 2. PRICING HERO */}
        <header className="pricing-hero" id="pricing-hero">
          <div className="hero-inner">
            <h1 className="pricing-hero-title">Start with what you need today.</h1>
            <p className="pricing-hero-copy">
              Start free with the work already in front of you. Move up when Corvioz becomes part of the way you work — and choose Pro when your clients need a place in the workflow too.
            </p>
            <div className="pricing-hero-actions">
              <Link href={CREATE_QUOTE_URL} className="btn-hero-start-free" data-intent="start-free">
                Start free
              </Link>
            </div>
          </div>
        </header>

        {/* 3. BILLING TOGGLE & A3 PRICING CARDS */}
        <section className="pricing-cards-section" id="pricing-cards-section" aria-label="Pricing Plans">
          <div className="pricing-container">
            {/* Native Radio Billing Toggle */}
            <div className="toggle-row">
              <fieldset className="billing-toggle" id="billingFieldset" ref={billingFieldsetRef}>
                <legend className="sr-only">Billing Cadence Preference</legend>
                <label className="toggle-label" id="label-monthly" ref={labelMonthlyRef}>
                  <input
                    type="radio"
                    name="billing-cadence"
                    id="radioMonthly"
                    value="monthly"
                    checked={cadence === "monthly"}
                    onChange={() => handleCadenceChange("monthly")}
                  />
                  <span className="toggle-btn-text">Monthly</span>
                </label>
                <label className="toggle-label" id="label-yearly" ref={labelYearlyRef}>
                  <input
                    type="radio"
                    name="billing-cadence"
                    id="radioYearly"
                    value="yearly"
                    checked={cadence === "yearly"}
                    onChange={() => handleCadenceChange("yearly")}
                    aria-label="Yearly, 2 months free"
                  />
                  <span className="toggle-btn-text">
                    Yearly <span className="billing-value-badge" aria-hidden="true">2 months free</span>
                  </span>
                </label>
                <div className="toggle-indicator" id="toggleIndicator" ref={toggleIndicatorRef} aria-hidden="true" />
              </fieldset>
            </div>

            {/* A3 Metric Cards Cluster */}
            <div
              className={`a3-cards-cluster ${cardsEntered ? "is-entered" : ""} ${entryAnimating ? "entry-animating" : ""}`}
              id="a3CardsCluster"
              ref={cardsClusterRef}
            >
              {/* Card 1: FREE */}
              <div className="a3-card card-free" id="card-free">
                <div className="a3-card-header">
                  <span className="a3-plan-name">Free</span>
                  <div className="a3-price-wrap">
                    <span className="a3-price-figure">$0</span>
                  </div>
                </div>
                <div className="a3-statement">A real place to begin.</div>
                <p className="a3-supporting">For trying Corvioz with the client work you already have.</p>
                <div className="a3-datum-divider" aria-hidden="true" />
                <div className="a3-metric-block">
                  <div className="metric-figure-row">
                    <span className="metric-num">5</span>
                  </div>
                  <div className="metric-caption-row">
                    <span className="metric-label-primary">new documents</span>
                    <span className="metric-label-secondary">each cycle</span>
                  </div>
                </div>
                <div className="a3-sub-divider" aria-hidden="true" />
                <div className="a3-capabilities-stack">
                  <div className="cap-line">Quotes and invoices</div>
                  <div className="cap-line cap-secondary">PDF exports with Corvioz branding</div>
                </div>
                <div className="a3-card-action">
                  <Link href={CREATE_QUOTE_URL} className="a3-btn a3-btn-neutral" data-intent="start-free">
                    Start free
                  </Link>
                </div>
              </div>

              {/* Card 2: STARTER */}
              <div className="a3-card card-starter" id="card-starter">
                <div className="a3-card-header">
                  <span className="a3-plan-name">Starter</span>
                  <div className="a3-price-wrap">
                    <div className="price-motion-frame">
                      <span
                        className={`a3-price-figure price-anim-target ${priceAnimClass}`}
                        id="price-starter"
                        data-monthly="$9"
                        data-yearly="$90"
                      >
                        {starterPrice}
                      </span>
                      <span
                        className={`a3-price-period period-anim-target ${priceAnimClass}`}
                        id="period-starter"
                        data-monthly="/ mo"
                        data-yearly="/ yr"
                      >
                        {starterPeriod}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="a3-statement">Make it part of the way you work.</div>
                <p className="a3-supporting">For regular client work, with more room and clean documents.</p>
                <div className="a3-datum-divider" aria-hidden="true" />
                <div className="a3-metric-block">
                  <div className="metric-figure-row">
                    <span className="metric-num">30</span>
                  </div>
                  <div className="metric-caption-row">
                    <span className="metric-label-primary">new documents</span>
                    <span className="metric-label-secondary">each billing cycle</span>
                  </div>
                </div>
                <div className="a3-sub-divider" aria-hidden="true" />
                <div className="a3-capabilities-stack">
                  <div className="cap-line">Quotes and invoices</div>
                  <div className="cap-line cap-strong">Clean PDF exports</div>
                </div>
                <div className="a3-card-action">
                  <button
                    type="button"
                    className="a3-btn a3-btn-secondary"
                    onClick={() => handlePlanAction("starter")}
                    data-intent="choose-starter"
                    disabled={checkoutLoading}
                  >
                    Choose Starter
                  </button>
                </div>
              </div>

              {/* Card 3: PRO */}
              <div className="a3-card card-pro" id="card-pro">
                <div className="a3-card-header">
                  <span className="a3-plan-name pro-name">Pro</span>
                  <div className="a3-price-wrap">
                    <div className="price-motion-frame">
                      <span
                        className={`a3-price-figure price-anim-target ${priceAnimClass}`}
                        id="price-pro"
                        data-monthly="$19"
                        data-yearly="$190"
                      >
                        {proPrice}
                      </span>
                      <span
                        className={`a3-price-period period-anim-target ${priceAnimClass}`}
                        id="period-pro"
                        data-monthly="/ mo"
                        data-yearly="/ yr"
                      >
                        {proPeriod}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="a3-statement">Give the whole experience a little more care.</div>
                <p className="a3-supporting">For unlimited work and a client experience that lives in Corvioz too.</p>
                <div className="a3-datum-divider pro-datum" aria-hidden="true" />
                <div className="a3-metric-block pro-metric-block">
                  <div className="metric-figure-row">
                    <span className="metric-num metric-unlimited">Unlimited</span>
                  </div>
                  <div className="metric-caption-row">
                    <span className="metric-label-primary">new documents</span>
                    <span className="metric-label-secondary">&nbsp;</span>
                  </div>
                </div>
                <div className="a3-sub-divider pro-sub-divider" aria-hidden="true" />
                <div className="a3-capabilities-stack">
                  <div className="cap-line">Everything in Starter</div>
                  <div className="cap-line cap-strong pro-cap-strong">Client Portal with client approval</div>
                </div>
                <div className="a3-card-action">
                  <button
                    type="button"
                    className="a3-btn a3-btn-primary"
                    onClick={() => handlePlanAction("pro")}
                    data-intent="choose-pro"
                    disabled={checkoutLoading}
                  >
                    Choose Pro
                  </button>
                </div>
              </div>
            </div>

            {/* Studio Future State Notice (Coming Soon / Deferred) */}
            <div className="studio-coming-soon-banner" id="studio-coming-soon" aria-label="Studio Tier Status">
              <span className="studio-badge">Studio</span>
              <span className="studio-status-pill">Coming Soon</span>
            </div>
          </div>
        </section>

        {/* 4. COMPARISON SECTION */}
        <section className="comparison-fusion-surface" id="comparison-section" aria-label="Plan Comparison Matrix">
          <div className="comparison-container">
            <header className="comp-section-header">
              <h2 className="comp-section-title">What changes as you move up</h2>
              <p className="comp-section-lead">
                The basics stay familiar. What changes is how much work you can take on — and when your clients become part of the workflow.
              </p>
            </header>

            {/* Common Baseline Strip */}
            <div className="common-baseline-strip" id="common-baseline" aria-label="Shared Plan Capabilities">
              <span className="baseline-label">Every plan includes</span>
              <div className="baseline-items">
                <span className="baseline-item">Quotes</span>
                <span className="baseline-sep" aria-hidden="true">&middot;</span>
                <span className="baseline-item">Invoices</span>
                <span className="baseline-sep" aria-hidden="true">&middot;</span>
                <span className="baseline-item">PDF export</span>
              </div>
            </div>

            {/* Desktop Editorial Ledger */}
            <div className="desktop-editorial-ledger-wrap" id="true-differences-ledger">
              <table className="desktop-editorial-table" aria-label="Plan Differences Ledger">
                <thead>
                  <tr className="ledger-head">
                    <th scope="col" className="ledger-th col-feature col-feature-open" />
                    <th scope="col" className="ledger-th col-plan">
                      <span className="plan-th-name">Free</span>
                      <span className="plan-th-price">$0</span>
                    </th>
                    <th scope="col" className="ledger-th col-plan">
                      <span className="plan-th-name">Starter</span>
                      <span className="plan-th-price">
                        <span className={`comp-price-val ${priceAnimClass}`}>{starterPrice}</span>
                        <span className={`comp-price-period ${priceAnimClass}`}>{starterCompPeriod}</span>
                      </span>
                    </th>
                    <th scope="col" className="ledger-th col-plan col-plan-pro">
                      <span className="plan-th-name pro-th-name">Pro</span>
                      <span className="plan-th-price">
                        <span className={`comp-price-val ${priceAnimClass}`}>{proPrice}</span>
                        <span className={`comp-price-period ${priceAnimClass}`}>{proCompPeriod}</span>
                      </span>
                    </th>
                  </tr>
                </thead>

                {/* Group 1: Documents */}
                <tbody className="ledger-group">
                  <tr className="ledger-group-header-row">
                    <th scope="rowgroup" colSpan={4} className="group-title">Documents</th>
                  </tr>
                  <tr
                    className={`ledger-row ledger-row-metric ${hoveredRow === "documents" ? "is-hovered" : ""}`}
                    onMouseEnter={() => setHoveredRow("documents")}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <th scope="row" className="ledger-cell col-feature"><span className="feature-title">New documents</span></th>
                    <td className="ledger-cell col-plan">
                      <span className="metric-cell-figure">5</span>
                      <span className="metric-cell-unit">per cycle</span>
                    </td>
                    <td className="ledger-cell col-plan">
                      <span className="metric-cell-figure">30</span>
                      <span className="metric-cell-unit">per billing cycle</span>
                    </td>
                    <td className="ledger-cell col-plan col-plan-pro">
                      <span className="metric-cell-figure metric-pro-figure">Unlimited</span>
                    </td>
                  </tr>
                </tbody>

                {/* Group 2: PDF */}
                <tbody className="ledger-group">
                  <tr className="ledger-group-header-row">
                    <th scope="rowgroup" colSpan={4} className="group-title">PDF</th>
                  </tr>
                  <tr
                    className={`ledger-row ${hoveredRow === "pdf" ? "is-hovered" : ""}`}
                    onMouseEnter={() => setHoveredRow("pdf")}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <th scope="row" className="ledger-cell col-feature">PDF appearance</th>
                    <td className="ledger-cell col-plan"><span className="val-text val-dim">Corvioz branding</span></td>
                    <td className="ledger-cell col-plan"><span className="val-text val-bold">Clean PDF</span></td>
                    <td className="ledger-cell col-plan col-plan-pro"><span className="val-text val-bold val-pro">Clean PDF</span></td>
                  </tr>
                </tbody>

                {/* Group 3: Client Workflow */}
                <tbody className="ledger-group">
                  <tr className="ledger-group-header-row">
                    <th scope="rowgroup" colSpan={4} className="group-title">Client Workflow</th>
                  </tr>
                  <tr
                    className={`ledger-row ${hoveredRow === "portal" ? "is-hovered" : ""}`}
                    onMouseEnter={() => setHoveredRow("portal")}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <th scope="row" className="ledger-cell col-feature">Client Portal</th>
                    <td className="ledger-cell col-plan">
                      <span className="val-dash" aria-hidden="true">&mdash;</span>
                      <span className="sr-only">Not included</span>
                    </td>
                    <td className="ledger-cell col-plan">
                      <span className="val-dash" aria-hidden="true">&mdash;</span>
                      <span className="sr-only">Not included</span>
                    </td>
                    <td className="ledger-cell col-plan col-plan-pro">
                      <span className="val-check-wrap">
                        <svg className="val-check-svg" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                          <polyline points="3 8.5 6.5 12 13 4.5" />
                        </svg>
                        <span className="sr-only">Included</span>
                      </span>
                    </td>
                  </tr>
                  <tr
                    className={`ledger-row ${hoveredRow === "approval" ? "is-hovered" : ""}`}
                    onMouseEnter={() => setHoveredRow("approval")}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <th scope="row" className="ledger-cell col-feature">Client approval</th>
                    <td className="ledger-cell col-plan">
                      <span className="val-dash" aria-hidden="true">&mdash;</span>
                      <span className="sr-only">Not included</span>
                    </td>
                    <td className="ledger-cell col-plan">
                      <span className="val-dash" aria-hidden="true">&mdash;</span>
                      <span className="sr-only">Not included</span>
                    </td>
                    <td className="ledger-cell col-plan col-plan-pro">
                      <span className="val-check-wrap">
                        <svg className="val-check-svg" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                          <polyline points="3 8.5 6.5 12 13 4.5" />
                        </svg>
                        <span className="sr-only">Included</span>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Grouped Structure View */}
            <div className="mobile-structured-groups" id="mobile-differences-view" role="region" aria-label="Mobile Plan Comparison">
              <div className="mobile-group-card">
                <div className="mobile-group-header"><span className="m-group-title">Documents</span></div>
                <div className="mobile-group-body">
                  <div className="mobile-dim-row m-metric-row">
                    <div className="m-dim-name">New documents</div>
                    <div className="m-plan-values">
                      <div className="m-val-col"><span className="m-plan-tag">Free</span><span className="m-val m-metric-val">5 <span className="m-sub">per cycle</span></span></div>
                      <div className="m-val-col"><span className="m-plan-tag">Starter</span><span className="m-val m-metric-val">30 <span className="m-sub">per billing cycle</span></span></div>
                      <div className="m-val-col m-val-pro"><span className="m-plan-tag pro-tag">Pro</span><span className="m-val m-metric-val m-metric-pro">Unlimited</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mobile-group-card">
                <div className="mobile-group-header"><span className="m-group-title">PDF</span></div>
                <div className="mobile-group-body">
                  <div className="mobile-dim-row">
                    <div className="m-dim-name">PDF appearance</div>
                    <div className="m-plan-values">
                      <div className="m-val-col"><span className="m-plan-tag">Free</span><span className="m-val m-dim">Corvioz branding</span></div>
                      <div className="m-val-col"><span className="m-plan-tag">Starter</span><span className="m-val m-bold">Clean PDF</span></div>
                      <div className="m-val-col m-val-pro"><span className="m-plan-tag pro-tag">Pro</span><span className="m-val m-bold">Clean PDF</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mobile-group-card">
                <div className="mobile-group-header"><span className="m-group-title">Client Workflow</span></div>
                <div className="mobile-group-body">
                  <div className="mobile-dim-row">
                    <div className="m-dim-name">Client Portal</div>
                    <div className="m-plan-values">
                      <div className="m-val-col">
                        <span className="m-plan-tag">Free</span>
                        <span className="m-val m-dash" aria-hidden="true">&mdash;</span>
                        <span className="sr-only">Not included</span>
                      </div>
                      <div className="m-val-col">
                        <span className="m-plan-tag">Starter</span>
                        <span className="m-val m-dash" aria-hidden="true">&mdash;</span>
                        <span className="sr-only">Not included</span>
                      </div>
                      <div className="m-val-col m-val-pro">
                        <span className="m-plan-tag pro-tag">Pro</span>
                        <span className="m-val m-check-val">
                          <svg className="m-check-svg" viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                            <polyline points="3 8.5 6.5 12 13 4.5" />
                          </svg>
                          <span className="sr-only">Included</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mobile-dim-row">
                    <div className="m-dim-name">Client approval</div>
                    <div className="m-plan-values">
                      <div className="m-val-col">
                        <span className="m-plan-tag">Free</span>
                        <span className="m-val m-dash" aria-hidden="true">&mdash;</span>
                        <span className="sr-only">Not included</span>
                      </div>
                      <div className="m-val-col">
                        <span className="m-plan-tag">Starter</span>
                        <span className="m-val m-dash" aria-hidden="true">&mdash;</span>
                        <span className="sr-only">Not included</span>
                      </div>
                      <div className="m-val-col m-val-pro">
                        <span className="m-plan-tag pro-tag">Pro</span>
                        <span className="m-val m-check-val">
                          <svg className="m-check-svg" viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                            <polyline points="3 8.5 6.5 12 13 4.5" />
                          </svg>
                          <span className="sr-only">Included</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FAQ SECTION */}
        <section className="faq-fusion-section" id="faq-section" aria-label="Frequently Asked Questions">
          <div className="faq-fusion-container">
            <div className="faq-split-grid">
              <div className="faq-split-left">
                <div className="split-left-sticky" id="faqStickyHead">
                  <h2 className="faq-section-title">A few things worth knowing</h2>
                  <p className="faq-split-lead">Common questions about document limits, PDF appearance, Client Portal, and billing options.</p>
                </div>
              </div>

              <div className="faq-accordion-fusion" id="faqAccordion" aria-label="FAQ Accordion List">
                {FAQ_DATA.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div className="faq-item" id={`faq-item-${idx + 1}`} key={item.id}>
                      <button
                        className="faq-trigger"
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={item.id}
                        id={`faq-trig-${idx + 1}`}
                        onClick={() => toggleFaq(idx)}
                      >
                        <span className="faq-q-text">{item.question}</span>
                        <span className="faq-chevron" aria-hidden="true">
                          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                            <path d="M4 6l4 4 4-4" />
                          </svg>
                        </span>
                      </button>
                      <div
                        className={`faq-answer-container ${isOpen ? "is-open" : ""}`}
                        id={item.id}
                        hidden={!isOpen}
                        ref={(el) => (faqContainersRef.current[idx] = el)}
                      >
                        <div className="faq-ans-content">
                          <p>{item.answer}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 6. FINAL CTA */}
        <section className="final-cta-fusion-section" id="final-cta-section" aria-label="Get Started">
          <div className="final-cta-fusion-container">
            <div className="final-cta-surface-card" id="finalCtaCard">
              <h2 className="final-cta-title">Start with the work you have today.</h2>
              <p className="final-cta-copy">
                You don't need to choose for the business you might have someday. Start where things are now, and move up when the way you work asks for more.
              </p>
              <div className="final-cta-actions">
                <Link href={CREATE_QUOTE_URL} className="btn-final-cta-primary" id="btnFinalCta" data-intent="start-free">
                  Start free
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. GLOBAL SHARED PUBLIC FOOTER */}
      <SharedFooter />
    </div>
  );
}
