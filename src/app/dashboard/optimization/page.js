'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './optimization.css';

function OptimizationPageDev() {
  // 1. Controls and Mode States
  const [paywallMode, setPaywallMode] = useState('auto'); // 'auto' | 'manual'
  const [paywallWeight, setPaywallWeight] = useState('medium'); // 'soft' | 'medium' | 'hard'
  const [userCount] = useState(1000);

  // 2. Recommendations State
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [acceptedIds, setAcceptedIds] = useState(new Set());
  const [rejectedIds, setRejectedIds] = useState(new Set());

  // 3. Comparative Simulation State
  const [simulatingId, setSimulatingId] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);

  // Fetch simulation diff for a specific recommendation
  const handleSimulateImpact = React.useCallback(async (recId) => {
    setSimulatingId(recId);
    setSimulating(true);
    try {
      const response = await fetch('/api/monetization/optimization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          simulate_id: recId,
          user_count: userCount,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setComparisonData(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch simulated comparison:', err);
    } finally {
      setSimulating(false);
    }
  }, [userCount]);

  // 4. Fetch recommendations on mount
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoadingRecs(true);
      try {
        const response = await fetch('/api/monetization/optimization', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.recommendations) {
            setRecommendations(data.recommendations);
            // Default: simulate the first recommendation impact
            if (data.recommendations.length > 0) {
              handleSimulateImpact(data.recommendations[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchRecommendations();
  }, [handleSimulateImpact]);

  // Toggle Accept
  const handleAccept = (recId) => {
    setAcceptedIds((prev) => {
      const next = new Set(prev);
      if (next.has(recId)) {
        next.delete(recId);
      } else {
        next.add(recId);
        // Remove from rejected if accepted
        setRejectedIds((prevRej) => {
          const nextRej = new Set(prevRej);
          nextRej.delete(recId);
          return nextRej;
        });
        // If paywall suggestion is accepted, update paywall states to match
        if (recId === 'paywall') {
          setPaywallMode('auto');
          setPaywallWeight('soft');
        }
      }
      return next;
    });
  };

  // Toggle Reject
  const handleReject = (recId) => {
    setRejectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(recId)) {
        next.delete(recId);
      } else {
        next.add(recId);
        // Remove from accepted if rejected
        setAcceptedIds((prevAcc) => {
          const nextAcc = new Set(prevAcc);
          nextAcc.delete(recId);
          return nextAcc;
        });
        if (simulatingId === recId) {
          setSimulatingId(null);
          setComparisonData(null);
        }
      }
      return next;
    });
  };

  // Calculate dynamic projected stats
  const calculateTotalUplift = () => {
    let uplift = 0;
    acceptedIds.forEach((id) => {
      const rec = recommendations.find((r) => r.id === id);
      if (rec) uplift += rec.expected_revenue_change;
    });
    return uplift;
  };

  const calculateTotalConvImpact = () => {
    let impact = 0;
    acceptedIds.forEach((id) => {
      const rec = recommendations.find((r) => r.id === id);
      if (rec) impact += rec.conversion_rate_change;
    });
    return impact;
  };

  // Format currency helpers
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const pct = (val) => {
    const num = Number(val);
    return num % 1 === 0 ? `${num.toFixed(0)}%` : `${num.toFixed(1)}%`;
  };

  return (
    <div className="opt-container">
      {/* Top Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Corvioz Optimization
          </span>
        </div>
        <Link href="/dashboard" id="back-to-dashboard-btn" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 650, color: '#e5e7eb' }}>
          ← Back to Dashboard
        </Link>
      </nav>

      {/* Header */}
      <header className="opt-header">
        <p className="opt-kicker">Workflow Optimization OS</p>
        <h1 className="opt-title">Workflow & Funnel Optimization</h1>
        <p className="opt-description">
          Review, simulate, and manage workflow experiments, plan presentation, and onboarding friction.
        </p>
      </header>

      {/* Dynamic Summary Cards */}
      <section className="metrics-row" style={{ marginBottom: '32px' }}>
        <div className="metric-card glow-green">
          <div className="metric-label">Expected Workflow Lift</div>
          <div className="metric-value" id="expected-mrr-uplift-val">
            +{pct(calculateTotalUplift())}
          </div>
          <div className="metric-sub">Based on accepted recommendations</div>
        </div>

        <div className="metric-card glow-cyan">
          <div className="metric-label">Conversion Rate Change</div>
          <div className="metric-value" id="conversion-impact-val" style={{ color: calculateTotalConvImpact() >= 0 ? '#34d399' : '#fb7185' }}>
            {calculateTotalConvImpact() >= 0 ? '+' : ''}{pct(calculateTotalConvImpact())}
          </div>
          <div className="metric-sub">Net impact on paid subscription rates</div>
        </div>

        <div className="metric-card glow-purple">
          <div className="metric-label">Accepted Recommendations</div>
          <div className="metric-value" id="accepted-count-val">
            {acceptedIds.size} / {recommendations.length}
          </div>
          <div className="metric-sub">Applied to live production configuration</div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="opt-grid">
        {/* Left Column: Recommendations */}
        <section className="recs-card-list">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span>💡</span> Optimization Suggestions
          </h2>

          {loadingRecs ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className="spinner"></div>
            </div>
          ) : (
            recommendations.map((rec) => {
              const isAccepted = acceptedIds.has(rec.id);
              const isRejected = rejectedIds.has(rec.id);
              const isSimulating = simulatingId === rec.id;

              return (
                <div
                  key={rec.id}
                  id={`rec-card-${rec.id}`}
                  className={`rec-item-card ${isAccepted ? 'accepted' : ''} ${isRejected ? 'rejected' : ''}`}
                >
                  {isAccepted && (
                    <span className="accepted-marker" id={`accepted-badge-${rec.id}`}>
                      ✓ Applied
                    </span>
                  )}
                  
                  <span className="rec-badge">{rec.type}</span>
                  <h3 className="rec-title">{rec.title}</h3>
                  <p className="rec-desc">{rec.description}</p>

                  <div className="rec-impact-row">
                    <div className="impact-metric">
                      <span className="impact-label">Expected MRR</span>
                      <span className="impact-val positive">+{pct(rec.expected_revenue_change)}</span>
                    </div>
                    <div className="impact-metric">
                      <span className="impact-label">Conversion impact</span>
                      <span className={`impact-val ${rec.conversion_rate_change >= 0 ? 'positive' : 'negative'}`}>
                        {rec.conversion_rate_change >= 0 ? '+' : ''}{pct(rec.conversion_rate_change)}
                      </span>
                    </div>
                  </div>

                  <div className="rec-actions">
                    <button
                      id={`accept-btn-${rec.id}`}
                      className="btn-opt btn-opt-accept"
                      onClick={() => handleAccept(rec.id)}
                    >
                      {isAccepted ? 'Undo Apply' : 'Accept & Apply'}
                    </button>
                    
                    <button
                      id={`reject-btn-${rec.id}`}
                      className="btn-opt btn-opt-reject"
                      onClick={() => handleReject(rec.id)}
                    >
                      {isRejected ? 'Restored' : 'Reject'}
                    </button>

                    {!isRejected && (
                      <button
                        id={`simulate-btn-${rec.id}`}
                        className={`btn-opt btn-opt-simulate ${isSimulating ? 'active' : ''}`}
                        onClick={() => handleSimulateImpact(rec.id)}
                        disabled={simulating}
                      >
                        {isSimulating ? 'Simulating...' : 'Simulate Impact'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Right Column: Viewer & Strategy Panel */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Funnel Viewer */}
          <section className="section-card" style={{ position: 'relative' }}>
            {simulating && (
              <div className="loading-overlay">
                <div className="spinner"></div>
              </div>
            )}
            
            <h2 className="section-card-title">
              <span>📊</span> Funnel Optimization Viewer
            </h2>

            {comparisonData ? (
              <div className="funnel-compare-container">
                {/* Stats comparison */}
                <div className="compare-header-row">
                  <div className="compare-header-card before">
                    <div className="compare-card-title">Baseline MRR</div>
                    <div className="compare-card-val before" id="baseline-mrr-val">
                      {formatCurrency(comparisonData.before.projected_mrr)}
                    </div>
                  </div>
                  <div className="compare-header-card after">
                    <div className="compare-card-title">Optimized MRR</div>
                    <div className="compare-card-val after" id="optimized-mrr-val">
                      {formatCurrency(comparisonData.after.projected_mrr)}
                    </div>
                  </div>
                </div>

                {/* Comparative steps */}
                {comparisonData.before.funnel.map((step, idx) => {
                  const afterStep = comparisonData.after.funnel[idx];
                  const diff = afterStep.count - step.count;
                  const percentBefore = Math.round((step.count / userCount) * 100);
                  const percentAfter = Math.round((afterStep.count / userCount) * 100);

                  return (
                    <div key={idx} className="funnel-compare-row" id={`funnel-compare-row-${step.step.toLowerCase()}`}>
                      <div className="compare-label">
                        {step.step}
                        <span className="compare-sublabel">{step.label}</span>
                      </div>
                      <div className="compare-bars">
                        {/* Before */}
                        <div className="compare-bar-wrapper">
                          <div className="compare-bar-outer">
                            <div className="compare-bar-inner before" style={{ width: `${percentBefore}%` }}></div>
                          </div>
                          <span className="bar-val before">{step.count}</span>
                        </div>
                        {/* After */}
                        <div className="compare-bar-wrapper">
                          <div className="compare-bar-outer">
                            <div className="compare-bar-inner after" style={{ width: `${percentAfter}%` }}></div>
                          </div>
                          <span className="bar-val after">
                            {afterStep.count}
                            <span className={`diff-tag ${diff >= 0 ? 'positive' : 'neutral'}`}>
                              {diff >= 0 ? '+' : ''}{diff}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', fontSize: '0.9rem' }}>
                Select a recommendation card and click &quot;Simulate Impact&quot; to inspect the comparative funnel progression.
              </div>
            )}
          </section>

          {/* Pricing Panel */}
          <section className="section-card">
            <h2 className="section-card-title">
              <span>💳</span> Pricing Optimization Panel
            </h2>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', overflow: 'hidden' }}>
              <table className="pricing-opt-table">
                <thead>
                  <tr>
                    <th>Pricing Tier</th>
                    <th>Old Price</th>
                    <th>Suggested Price</th>
                    <th>Expected Workflow Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="plan-cell-title">Low (Starter)</td>
                    <td>$0 / month</td>
                    <td>$0 / month</td>
                    <td style={{ color: '#9ca3af', fontWeight: 600 }}>No change</td>
                  </tr>
                  <tr id="pricing-row-standard">
                    <td className="plan-cell-title">Standard (Pro)</td>
                    <td className="plan-price-old">$19</td>
                    <td className="plan-price-new" id="suggested-price-standard">$24</td>
                    <td style={{ color: '#34d399', fontWeight: 700 }} id="suggested-uplift-standard">+18% expected</td>
                  </tr>
                  <tr id="pricing-row-premium">
                    <td className="plan-cell-title">Premium (Agency)</td>
                    <td className="plan-price-old">$29</td>
                    <td className="plan-price-new" id="suggested-price-premium">$39</td>
                    <td style={{ color: '#34d399', fontWeight: 700 }} id="suggested-uplift-premium">+24% expected</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Paywall strategy switcher */}
          <section className="section-card">
            <h2 className="section-card-title">
              <span>🛡️</span> Paywall Strategy Control
            </h2>

            {/* Manual vs Auto toggler */}
            <div className="paywall-mode-toggle">
              <button
                id="paywall-mode-auto-btn"
                className={`paywall-mode-btn ${paywallMode === 'auto' ? 'active' : ''}`}
                onClick={() => setPaywallMode('auto')}
              >
                🤖 Auto Mode (AI Optimized)
              </button>
              <button
                id="paywall-mode-manual-btn"
                className={`paywall-mode-btn ${paywallMode === 'manual' ? 'active' : ''}`}
                onClick={() => setPaywallMode('manual')}
              >
                ⚙️ Manual Override
              </button>
            </div>

            {/* Paywall Strategy select */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#9ca3af', marginBottom: '8px', fontWeight: 600 }}>
                <span>Active Target Strategy</span>
                {paywallMode === 'auto' && (
                  <span style={{ color: '#34d399', fontWeight: 800 }}>Optimized by AI Engine</span>
                )}
              </div>
              <div className="paywall-strategy-selectors">
                <button
                  id="paywall-strategy-soft-btn"
                  className={`paywall-weight-btn ${paywallWeight === 'soft' ? 'active' : ''}`}
                  onClick={() => setPaywallWeight('soft')}
                  disabled={paywallMode === 'auto'}
                >
                  Soft Paywall
                </button>
                <button
                  id="paywall-strategy-medium-btn"
                  className={`paywall-weight-btn ${paywallWeight === 'medium' ? 'active' : ''}`}
                  onClick={() => setPaywallWeight('medium')}
                  disabled={paywallMode === 'auto'}
                >
                  Medium (Balanced)
                </button>
                <button
                  id="paywall-strategy-hard-btn"
                  className={`paywall-weight-btn ${paywallWeight === 'hard' ? 'active' : ''}`}
                  onClick={() => setPaywallWeight('hard')}
                  disabled={paywallMode === 'auto'}
                >
                  Hard Paywall
                </button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function OptimizationPage() {
  if (process.env.NODE_ENV === 'development') {
    return <OptimizationPageDev />;
  }
  return null;
}
