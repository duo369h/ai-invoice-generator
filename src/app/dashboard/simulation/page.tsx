'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import './simulation.css';

// User Persona Scenarios
interface Persona {
  id: string;
  label: string;
  emoji: string;
  desc: string;
  color: string;
  params: {
    intent_score: number;
    pricing_view_count: number;
    invoices_count: number;
    quotes_count: number;
    session_time: number;
    export_count?: number;
  };
}

const PERSONAS: Persona[] = [
  {
    id: 'low_intent',
    label: 'Low Intent Explorer',
    emoji: '👀',
    desc: 'Browses but rarely acts. Few sessions, no pricing views.',
    color: '#6b7280',
    params: { intent_score: 18, pricing_view_count: 0, invoices_count: 0, quotes_count: 0, session_time: 12 },
  },
  {
    id: 'medium_intent',
    label: 'Medium Intent Freelancer',
    emoji: '💼',
    desc: "Active user, creates invoices, hasn't upgraded yet.",
    color: '#60a5fa',
    params: { intent_score: 55, pricing_view_count: 1, invoices_count: 1, quotes_count: 0, session_time: 90 },
  },
  {
    id: 'high_intent',
    label: 'High Intent Buyer',
    emoji: '🚀',
    desc: 'Viewed pricing 3+ times, high session time, ready to convert.',
    color: '#34d399',
    params: { intent_score: 88, pricing_view_count: 4, invoices_count: 2, quotes_count: 1, session_time: 240 },
  },
  {
    id: 'pricing_abuser',
    label: 'Pricing Abuser',
    emoji: '⚠️',
    desc: 'Repeatedly refreshes pricing page without converting.',
    color: '#fbbf24',
    params: { intent_score: 45, pricing_view_count: 8, invoices_count: 0, quotes_count: 0, session_time: 60 },
  },
  {
    id: 'export_spammer',
    label: 'Export Spammer',
    emoji: '🖨️',
    desc: 'Aggressively exports PDFs on free tier to avoid watermarks.',
    color: '#f87171',
    params: { intent_score: 72, pricing_view_count: 0, invoices_count: 2, quotes_count: 0, session_time: 180, export_count: 9 },
  },
];

// Funnel steps for decision timeline
const FUNNEL_STEPS = ['landing', 'signup', 'dashboard', 'quote', 'invoice', 'export', 'pricing'];
const FUNNEL_EVENTS: Record<string, string> = {
  landing: 'page_view',
  signup: 'signup_complete',
  dashboard: 'dashboard_view',
  quote: 'create_quote',
  invoice: 'create_invoice',
  export: 'export_pdf',
  pricing: 'pricing_cta',
};

// Helper: format number
const fmt = (val: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

const pct = (val: number | string) => {
  const num = Number(val);
  return num % 1 === 0 ? `${num.toFixed(0)}%` : `${num.toFixed(1)}%`;
};

// Decision badge helper
const DECISION_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  allow: { bg: 'rgba(16,185,129,0.08)', color: '#34d399', label: 'Allow' },
  block: { bg: 'rgba(239,68,68,0.08)', color: '#f87171', label: 'Block' },
  soft_paywall: { bg: 'rgba(245,158,11,0.08)', color: '#fbbf24', label: 'Soft Paywall' },
  upsell: { bg: 'rgba(99,102,241,0.08)', color: '#818cf8', label: 'Upsell' },
  redirect: { bg: 'rgba(96,165,250,0.08)', color: '#60a5fa', label: 'Redirect' },
};

function DecisionBadge({ decision }: { decision: string }) {
  const style = DECISION_COLORS[decision] ?? DECISION_COLORS.allow;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: style.bg, color: style.color,
      padding: '2px 8px', borderRadius: 4,
      fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {style.label}
    </span>
  );
}

function outcomeLabel(decision: string) {
  if (decision === 'allow') return 'Proceeds normally';
  if (decision === 'block') return 'Upgrade modal shown';
  if (decision === 'soft_paywall') return 'Watermark + upgrade nudge';
  if (decision === 'upsell') return 'Upgrade banner displayed';
  if (decision === 'redirect') return 'Redirected → /pricing';
  return 'Action allowed';
}

function SimulationPageDev() {
  const [scenario, setScenario] = useState('balanced');
  const [userCount, setUserCount] = useState(1000);
  const [standardPrice, setStandardPrice] = useState(19);
  const [premiumPrice, setPremiumPrice] = useState(29);
  const [pricingModel, setPricingModel] = useState('freemium');
  const [usageLimit, setUsageLimit] = useState(5);

  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[2]); // High Intent default
  const [results, setResults] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]); // Decision timeline for selected persona
  const [safetyMetrics, setSafetyMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // Safety Metrics computation
  const buildSafetyMetrics = useCallback((data: any, sc: string) => {
    const total = data.total_users || 1;
    const conversionRate = data.conversion_rate / 100;
    const aggressiveness = { aggressive: 0.85, balanced: 0.55, soft: 0.25, freemium: 0.10 }[sc] ?? 0.5;
    const falseBlockRate = Math.min(aggressiveness * 0.18, 0.12);
    const overPaywallRate = Math.min(aggressiveness * 0.22, 0.15);
    const safeFlowRate = Math.max(1 - falseBlockRate - overPaywallRate, 0.65);
    const revenueUplift = conversionRate > 0
      ? (conversionRate * (1 - falseBlockRate) * standardPrice * total * 0.012).toFixed(0)
      : 0;
    return {
      falseBlockRate: falseBlockRate * 100,
      overPaywallRate: overPaywallRate * 100,
      safeFlowRate: safeFlowRate * 100,
      revenueUplift: Number(revenueUplift),
    };
  }, [standardPrice]);

  // Run main simulation
  const runSimulation = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const res = await fetch('/api/monetization/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          user_count: userCount,
          scenario,
          pricing: { low: 9, standard: standardPrice, premium: premiumPrice },
          pricing_model: pricingModel,
          usage_limit: usageLimit,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setResults(data);
          setSafetyMetrics(buildSafetyMetrics(data, scenario));
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') console.error('Simulation failed:', err);
    } finally {
      setLoading(false);
    }
  }, [scenario, userCount, standardPrice, premiumPrice, pricingModel, usageLimit, buildSafetyMetrics]);

  // Build decision timeline for a persona
  const buildPersonaTimeline = useCallback(async (persona: Persona) => {
    setTimelineLoading(true);
    const entries = [];

    for (const step of FUNNEL_STEPS) {
      const event = FUNNEL_EVENTS[step];
      if (['landing', 'signup', 'dashboard'].includes(step)) {
        entries.push({
          step, event, decision: 'allow',
          reason: step === 'signup' ? 'Signup always allowed.' : 'No paywall at this stage.',
          intent_score: persona.params.intent_score,
        });
        continue;
      }

      try {
        const res = await fetch('/api/revenue/control-plane', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            simulate_action: event,
            context: {
              intent_score: persona.params.intent_score,
              invoices_count: persona.params.invoices_count ?? 0,
              quotes_count: persona.params.quotes_count ?? 0,
              pricing_view_count: persona.params.pricing_view_count ?? 0,
              session_time: persona.params.session_time ?? 60,
              is_first_action: (persona.params.invoices_count ?? 0) === 0,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const latest = Array.isArray(data.decisions) ? data.decisions[0] : null;
          entries.push({
            step,
            event,
            decision: latest?.decision ?? 'allow',
            reason: latest?.reason ?? 'Control plane evaluated.',
            intent_score: persona.params.intent_score,
          });
        } else {
          entries.push({ step, event, decision: 'allow', reason: 'API fallback.', intent_score: persona.params.intent_score });
        }
      } catch {
        entries.push({ step, event, decision: 'allow', reason: 'Network error — safe fallback.', intent_score: persona.params.intent_score });
      }
    }

    setTimeline(entries);
    setTimelineLoading(false);
  }, []);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  useEffect(() => {
    buildPersonaTimeline(selectedPersona);
  }, [selectedPersona, buildPersonaTimeline]);

  // SVG curve chart
  const renderCurveChart = () => {
    if (!results?.curve) return null;
    const vals = Object.values(results.curve) as any[];
    const maxRev = Math.max(...vals.map((d) => d.revenue), 1);
    const pts = [
      { x: 60, y: 130 - (vals[0].revenue / maxRev) * 100 },
      { x: 250, y: 130 - (vals[1].revenue / maxRev) * 100 },
      { x: 440, y: 130 - (vals[2].revenue / maxRev) * 100 },
    ];
    const pathD = `M ${pts[0].x} ${pts[0].y} C ${(pts[0].x + pts[1].x) / 2} ${pts[0].y}, ${(pts[0].x + pts[1].x) / 2} ${pts[1].y}, ${pts[1].x} ${pts[1].y} S ${(pts[1].x + pts[2].x) / 2} ${pts[2].y}, ${pts[2].x} ${pts[2].y}`;
    return (
      <svg viewBox="0 0 500 160" width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="50" y1="130" x2="450" y2="130" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <line x1="50" y1="80" x2="450" y2="80" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <path d={`${pathD} L ${pts[2].x} 130 L ${pts[0].x} 130 Z`} fill="url(#ag)" />
        <path d={pathD} fill="none" stroke="url(#cg)" strokeWidth="3" strokeLinecap="round" />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="6" fill="#fff" stroke="#6366f1" strokeWidth="3" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
            <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#fff" fontSize="0.62rem" fontWeight="800">
              {fmt(vals[i].revenue)}
            </text>
            <text x={p.x} y="150" textAnchor="middle" fill="#6b7280" fontSize="0.6rem">
              {vals[i].users.toLocaleString()}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  const v5Sim = results?.v5_simulation;
  const v45Dec = results?.v4_5_decision;

  return (
    <div className="simulation-container">
      {/* Shadow Mode Warning */}
      <div className="shadow-warning-banner" role="alert" aria-live="polite">
        <span className="shadow-icon">🛡️</span>
        <span>
          <strong>Safe Simulation Active</strong> — Pricing Elasticity and Funnel Pressure Models running. No customer-facing modifications will be made.
        </span>
      </div>

      {/* Nav */}
      <nav className="sim-nav">
        <div className="sim-nav-brand">
          <span className="sim-nav-title">Revenue Simulation</span>
          <span className="sim-version-badge">v5.0 Sandbox</span>
        </div>
        <Link href="/dashboard" id="back-to-dashboard-btn" className="sim-back-btn">
          ← Dashboard
        </Link>
      </nav>

      {/* Header */}
      <header className="sim-header">
        <p className="sim-kicker">Multi-Layer Revenue Intelligence Platform</p>
        <h1 className="sim-title">Autonomous Revenue Sandbox</h1>
        <p className="sim-description">
          Evaluate what-if pricing elasticity scenarios and analyze the non-executing Decision Layer suggestions.
        </p>
      </header>

      {/* Main Layout */}
      <div className="sim-layout">
        {/* LEFT SIDEBAR CONTROLS */}
        <aside className="sim-sidebar">
          {/* Scenario Selector */}
          <div className="sidebar-section">
            <h2 className="sidebar-section-title">⚡ Funnel Scenario</h2>
            <div className="scenario-btn-list">
              {['balanced', 'aggressive', 'soft', 'freemium'].map((sc) => {
                const meta = {
                  balanced: { label: 'Balanced Paywall', desc: 'Standard triggers & fair trial gating' },
                  aggressive: { label: 'Aggressive Paywall', desc: 'Strict limits & immediate popups' },
                  soft: { label: 'Soft Paywall', desc: 'Watermarks on exports & banner nudges' },
                  freemium: { label: 'Freemium Mode', desc: 'Generous free limits, delayed prompt' },
                }[sc];
                return (
                  <button
                    key={sc}
                    id={`scenario-${sc}-btn`}
                    className={`scenario-btn ${scenario === sc ? 'active' : ''}`}
                    onClick={() => {
                      setScenario(sc);
                      setPricingModel(sc === 'aggressive' ? 'usage_based_limits' : 'freemium');
                    }}
                  >
                    <span className="scenario-btn-label">{meta?.label}</span>
                    <span className="scenario-btn-desc">{meta?.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Persona Selector */}
          <div className="sidebar-section">
            <h2 className="sidebar-section-title">👤 User Cohorts</h2>
            <div className="scenario-btn-list">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  id={`persona-${p.id}-btn`}
                  className={`scenario-btn ${selectedPersona.id === p.id ? 'active' : ''}`}
                  onClick={() => setSelectedPersona(p)}
                  style={selectedPersona.id === p.id ? { borderColor: p.color + '44', background: p.color + '08' } : {}}
                >
                  <span className="scenario-btn-label">
                    <span style={{ marginRight: 6 }} aria-hidden="true">{p.emoji}</span>{p.label}
                  </span>
                  <span className="scenario-btn-desc">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Strategy */}
          <div className="sidebar-section">
            <h2 className="sidebar-section-title">💳 Price Elasticity Variables</h2>
            <div className="form-group">
              <div className="toggle-group">
                {['freemium', 'trial'].map((m) => (
                  <button
                    key={m}
                    id={`pricing-model-${m}-btn`}
                    className={`toggle-item ${pricingModel === m ? 'active' : ''}`}
                    onClick={() => setPricingModel(m)}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Proposed Pro Price <span className="slider-val">${standardPrice}/mo</span>
              </label>
              <input id="standard-price-slider" type="range" min="9" max="49" step="5"
                value={standardPrice} onChange={(e) => setStandardPrice(Number(e.target.value))}
                className="range-input" />
            </div>

            <div className="form-group">
              <label className="form-label">
                Proposed Growth Price <span className="slider-val">${premiumPrice}/mo</span>
              </label>
              <input id="premium-price-slider" type="range" min="19" max="99" step="5"
                value={premiumPrice} onChange={(e) => setPremiumPrice(Number(e.target.value))}
                className="range-input" />
            </div>

            <div className="form-group">
              <label className="form-label">
                Free Limit Threshold <span className="slider-val">{usageLimit}</span>
              </label>
              <input id="usage-limit-slider" type="range" min="1" max="10" step="1"
                value={usageLimit} onChange={(e) => setUsageLimit(Number(e.target.value))}
                className="range-input" />
            </div>
          </div>

          {/* User Volume */}
          <div className="sidebar-section">
            <h2 className="sidebar-section-title">👥 Audience Scale</h2>
            <div className="toggle-group">
              {[100, 1000, 10000].map((vol) => (
                <button
                  key={vol}
                  id={`volume-toggle-${vol}`}
                  className={`toggle-item ${userCount === vol ? 'active' : ''}`}
                  onClick={() => setUserCount(vol)}
                >
                  {vol.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="sim-main">
          {/* KPI Metrics Row */}
          <div className="metrics-row" style={{ position: 'relative' }}>
            {loading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="metric-card skeleton-card">
                    <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 28, width: '80%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 12, width: '40%' }} />
                  </div>
                ))}
              </>
            ) : (
              [
                { id: 'projected-revenue-val', label: 'Projected MRR', val: results ? fmt(results.projected_mrr) : '—', sub: 'Est. Monthly', glow: 'glow-purple' },
                { id: 'conversion-rate-val', label: 'Conversion Rate', val: results ? pct(results.conversion_rate) : '—', sub: 'User → Pro', glow: 'glow-pink' },
                { id: 'arpu-val', label: 'ARPU', val: results ? fmt(results.arpu) : '—', sub: 'Avg Rev / User', glow: 'glow-cyan' },
                { id: 'conversions-val', label: 'Conversions', val: results ? results.conversions : '—', sub: `of ${userCount.toLocaleString()} sessions`, glow: 'glow-green' },
              ].map(({ id, label, val, sub, glow }) => (
                <div key={id} className={`metric-card ${glow}`}>
                  <div className="metric-label">{label}</div>
                  <div className="metric-value" id={id}>{val}</div>
                  <div className="metric-sub">{sub}</div>
                </div>
              ))
            )}
          </div>

          {/* v4.5 Decision Layer Card */}
          <section className="section-card" style={{ borderLeft: '4px solid #818cf8' }}>
            <h2 className="section-card-title">
              🧠 v4.5 Decision Layer Recommendation
              <span className="live-badge" style={{ backgroundColor: 'rgba(129, 140, 248, 0.1)', color: '#818cf8' }}>RECOMMENDER ONLY</span>
            </h2>
            {loading || !v45Dec ? (
              <div className="skeleton" style={{ height: 60, width: '100%' }} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>Recommended Plan</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase' }}>
                    {v45Dec.recommended_plan}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '12px', marginBottom: '4px' }}>Suggested UI Gating</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e5e7eb' }}>
                    {v45Dec.suggested_ui_strategy.replace('_', ' ')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '4px' }}>Decision Reasoning</div>
                  <p style={{ fontSize: '0.9rem', color: '#d1d5db', lineHeight: '1.5', margin: 0 }}>
                    {v45Dec.reasoning}
                  </p>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '16px', marginBottom: '4px' }}>Recommender Confidence</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${v45Dec.confidence}%`, background: 'linear-gradient(90deg, #818cf8, #34d399)' }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>{v45Dec.confidence}%</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* v5 What-if Simulation Card */}
          <section className="section-card" style={{ borderLeft: '4px solid #f472b6' }}>
            <h2 className="section-card-title">
              🔮 v5 Autonomous What-if Projections
              <span className="live-badge" style={{ backgroundColor: 'rgba(244, 114, 182, 0.1)', color: '#f472b6' }}>SIMULATOR</span>
            </h2>
            {loading || !v5Sim ? (
              <div className="skeleton" style={{ height: 80, width: '100%' }} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '2px' }}>MRR Delta (Scale Projection)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: v5Sim.predicted_revenue_change >= 0 ? '#34d399' : '#f87171' }}>
                    {v5Sim.predicted_revenue_change >= 0 ? '+' : ''}{fmt(v5Sim.predicted_revenue_change)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '4px' }}>Compared to baseline revenue</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '2px' }}>Elasticity Conversion Rate</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
                    {v5Sim.predicted_conversion_rate}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '4px' }}>Base Conversion: {v5Sim.base_conversion_rate}%</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '2px' }}>Simulated ARPU Impact</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: v5Sim.arpu_impact >= 0 ? '#34d399' : '#f87171' }}>
                    {v5Sim.arpu_impact >= 0 ? '+' : ''}{fmt(v5Sim.arpu_impact)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '4px' }}>Base ARPU: {fmt(v5Sim.base_arpu)}</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '2px' }}>Estimated Churn Increase</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: v5Sim.churn_increase_pct > 10 ? '#f87171' : '#fbbf24' }}>
                    +{v5Sim.churn_increase_pct}%
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '4px' }}>Due to UI Pressure selection</div>
                </div>
              </div>
            )}
            {v5Sim && (
              <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                  💡 Suggested Trigger strategy: <strong style={{ color: '#e5e7eb' }}>{v5Sim.best_trigger_strategy.replace(/_/g, ' ')}</strong>
                </span>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                  ⚡ Optimal UI Pressure Level: <strong style={{ color: '#e5e7eb' }}>{v5Sim.best_ui_pressure_level.replace(/_/g, ' ')}</strong>
                </span>
              </div>
            )}
          </section>

          {/* Safety Metrics */}
          <section className="section-card" id="safety-metrics-module">
            <h2 className="section-card-title">
              🛡️ Safety Metrics
              <span className="live-badge">AUTO</span>
            </h2>
            {loading || !safetyMetrics ? (
              <div className="skeleton-row">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="safety-card skeleton-card" style={{ height: 114, border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton" style={{ height: 10, width: '60%' }} />
                    <div className="skeleton" style={{ height: 20, width: '40%', margin: '4px 0' }} />
                    <div className="skeleton" style={{ height: 10, width: '80%' }} />
                    <div className="skeleton" style={{ height: 8, width: '50%', marginTop: 'auto' }} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="safety-metrics-grid">
                {[
                  {
                    id: 'false-block-rate', label: 'False Block Rate',
                    val: pct(safetyMetrics.falseBlockRate),
                    desc: 'Good users incorrectly blocked',
                    status: safetyMetrics.falseBlockRate < 5 ? 'safe' : safetyMetrics.falseBlockRate < 10 ? 'warning' : 'danger',
                    target: '< 5%',
                  },
                  {
                    id: 'over-paywall-rate', label: 'Over-Paywall Rate',
                    val: pct(safetyMetrics.overPaywallRate),
                    desc: 'Excessive paywall interruptions',
                    status: safetyMetrics.overPaywallRate < 8 ? 'safe' : safetyMetrics.overPaywallRate < 12 ? 'warning' : 'danger',
                    target: '< 8%',
                  },
                  {
                    id: 'safe-flow-rate', label: 'Safe Flow Rate',
                    val: pct(safetyMetrics.safeFlowRate),
                    desc: 'Users who proceed without friction',
                    status: safetyMetrics.safeFlowRate > 80 ? 'safe' : safetyMetrics.safeFlowRate > 65 ? 'warning' : 'danger',
                    target: '> 80%',
                  },
                  {
                    id: 'revenue-uplift', label: 'Revenue Uplift',
                    val: fmt(safetyMetrics.revenueUplift),
                    desc: 'Estimated incremental gain',
                    status: safetyMetrics.revenueUplift > 500 ? 'safe' : safetyMetrics.revenueUplift > 100 ? 'warning' : 'danger',
                    target: '> $500',
                  },
                ].map(({ id, label, val, desc, status, target }) => (
                  <div key={id} id={id} className={`safety-card ${status}`}>
                    <div className="safety-card-header">
                      <span className="safety-label">{label}</span>
                      <span className={`safety-status-dot ${status}`} />
                    </div>
                    <div className="safety-val">{val}</div>
                    <div className="safety-desc">{desc}</div>
                    <div className="safety-target">Target: {target}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Funnel Drop-off Visualization */}
          <section className="section-card" id="funnel-visualization-module" style={{ position: 'relative' }}>
            <h2 className="section-card-title">📊 Funnel Drop-off Visualization</h2>
            {loading ? (
              <div className="funnel-pipeline">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="funnel-step skeleton-card" style={{ height: 90, border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 12 }}>
                    <div className="skeleton" style={{ height: 10, width: '80%', margin: '0 auto' }} />
                    <div className="skeleton" style={{ height: 8, width: '50%', margin: '0 auto' }} />
                    <div className="skeleton" style={{ height: 16, width: '60%', margin: '0 auto' }} />
                  </div>
                ))}
              </div>
            ) : results?.funnel ? (
              <div className="funnel-pipeline">
                {results.funnel.map((step: any, idx: number) => (
                  <div
                    key={idx}
                    id={`funnel-step-${step.step.toLowerCase()}`}
                    className={`funnel-step ${step.is_bottleneck ? 'bottleneck' : ''}`}
                  >
                    {idx > 0 && (
                      <span className="dropoff-badge">-{step.drop_off_rate}%</span>
                    )}
                    <div>
                      <div className="funnel-step-name">{step.step}</div>
                      <div className="funnel-step-label">{step.label}</div>
                    </div>
                    <div className="funnel-step-count">{step.count?.toLocaleString()}</div>
                    {step.is_bottleneck && (
                      <span className="bottleneck-badge" id="bottleneck-highlight">🚨 Bottleneck</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="funnel-empty-state" style={{ color: '#4b5563', fontSize: '0.8rem', padding: '24px 0', textAlign: 'center' }}>
                No funnel data available
              </div>
            )}
          </section>

          {/* Revenue Decision Timeline */}
          <section className="section-card" id="decision-timeline-module">
            <h2 className="section-card-title">
              ⏱️ Revenue Decision Timeline
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#9ca3af', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>
                Persona: <span style={{ color: selectedPersona.color, fontWeight: 700 }}>{selectedPersona.emoji} {selectedPersona.label}</span>
              </span>
            </h2>
            <p className="section-subtitle">
              Shows how the v5 decision engine responds to each funnel step for the selected user persona.
            </p>

            {timelineLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="timeline-entry skeleton-card" style={{ border: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="skeleton" style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="skeleton" style={{ height: 12, width: '40%' }} />
                      <div className="skeleton" style={{ height: 10, width: '70%' }} />
                    </div>
                    <div className="skeleton" style={{ height: 12, width: '60px', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            ) : timeline && timeline.length > 0 ? (
              <div className="timeline-list">
                {timeline.map((entry, idx) => (
                  <div key={idx} className="timeline-entry" id={`timeline-step-${entry.step}`}>
                    <div className="timeline-step-num">{idx + 1}</div>
                    <div className="timeline-content">
                      <div className="timeline-row-top">
                        <span className="timeline-step-label">{entry.step}</span>
                        <span className="timeline-arrow">→</span>
                        <span className="timeline-event-tag">{entry.event}</span>
                        <span className="timeline-arrow">→</span>
                        <DecisionBadge decision={entry.decision} />
                        <span className="timeline-arrow">→</span>
                        <span className="timeline-outcome">{outcomeLabel(entry.decision)}</span>
                      </div>
                      {entry.reason && (
                        <div className="timeline-reason">
                          <span className="timeline-reason-dot" />
                          {entry.reason}
                        </div>
                      )}
                    </div>
                    <div className="timeline-intent-badge">
                      intent: {entry.intent_score}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="timeline-empty-state" style={{ color: '#4b5563', fontSize: '0.8rem', padding: '24px 0', textAlign: 'center' }}>
                No timeline data available
              </div>
            )}
          </section>

          {/* What-If Scale Projection */}
          <section className="section-card" style={{ position: 'relative' }}>
            <div className="section-card-title">
              📈 &quot;What If&quot; Scale Projection
            </div>
            {loading ? (
              <div className="scale-projection-grid">
                <div className="curve-svg-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="skeleton" style={{ height: 130, width: '100%' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h3 className="scale-table-title">Scale Comparison</h3>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="table-row skeleton-card" style={{ border: 'none' }}>
                      <div className="skeleton" style={{ height: 12, width: '40%' }} />
                      <div className="skeleton" style={{ height: 12, width: '30%' }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : results?.curve ? (
              <div className="scale-projection-grid">
                <div className="curve-svg-container">{renderCurveChart() || <div style={{ color: '#4b5563', fontSize: '0.8rem', textAlign: 'center' }}>No chart data available</div>}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h3 className="scale-table-title">Scale Comparison</h3>
                  {(Object.values(results.curve) as any[]).map((d) => (
                    <div key={d.users} className="table-row">
                      <span className="table-label">{d.users.toLocaleString()} Users:</span>
                      <span className="table-val" id={`curve-val-${d.users}`}>
                        {fmt(d.revenue)} <span style={{ color: '#6b7280', fontSize: '0.68rem' }}>({pct(d.conversion_rate)} CR)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="scale-projection-grid">
                <div className="curve-svg-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: '0.8rem' }}>
                  No projection data available
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h3 className="scale-table-title">Scale Comparison</h3>
                  <div style={{ color: '#4b5563', fontSize: '0.8rem' }}>No comparison data</div>
                </div>
              </div>
            )}
          </section>

          {/* System Readiness Footer */}
          {loading || !safetyMetrics ? (
            <div className="readiness-banner skeleton-card" style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
              <div className="skeleton" style={{ width: 10, height: 10, borderRadius: '50%' }} />
              <div className="skeleton" style={{ height: 12, width: '60%' }} />
            </div>
          ) : (
            <div className="readiness-banner" id="v6-readiness-banner">
              {(() => {
                const fb = safetyMetrics.falseBlockRate;
                const op = safetyMetrics.overPaywallRate;
                const sf = safetyMetrics.safeFlowRate;
                const isReady = fb < 5 && op < 8 && sf > 80;
                const isWarning = !isReady && (fb < 10 && op < 12 && sf > 65);
                return (
                  <>
                    <span className={`readiness-dot ${isReady ? 'green' : isWarning ? 'yellow' : 'red'}`} />
                    <span className="readiness-label">
                      {isReady
                        ? 'SYSTEM SAFE — Ready for v6 Autonomous Revenue OS evaluation'
                        : isWarning
                        ? 'WARNING — Review metrics before enabling v6 autonomy'
                        : 'NOT READY — Risk thresholds exceeded, do not enable v6'}
                    </span>
                  </>
                );
              })()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SimulationPage() {
  if (process.env.NODE_ENV === 'development') {
    return <SimulationPageDev />;
  }
  return null;
}
