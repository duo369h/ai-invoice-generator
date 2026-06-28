'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './validation.css';

function ValidationDashboard() {
  const [loading, setLoading] = useState(true);
  const [safetyMode, setSafetyMode] = useState('safe');
  const [metrics, setMetrics] = useState({
    total_evaluated: 0,
    approved_count: 0,
    blocked_count: 0,
    softened_count: 0,
    misclassification_rate: 0,
    revenue_drift_status: 'Minimal'
  });
  const [decisions, setDecisions] = useState([]);
  const [driftData, setDriftData] = useState({
    dates: [],
    simulated_revenue: [],
    real_behavior_revenue: [],
    alerts: []
  });

  // Fetch all dashboard data from API helper
  const loadValidationData = async () => {
    const response = await fetch('/api/monetization/validation', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return data;
      }
    }
    throw new Error('Failed to fetch validation data');
  };

  // Run on mount
  useEffect(() => {
    const init = async () => {
      try {
        const data = await loadValidationData();
        setMetrics(data.metrics);
        setDecisions(data.decisions);
        setDriftData(data.drift_data);
        setSafetyMode(data.metrics.safety_mode);
      } catch (err) {
        console.error('Failed to load safety validation data:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Handle Safety Mode Selector Toggles
  const handleSafetyModeChange = async (mode) => {
    setLoading(true);
    try {
      const response = await fetch('/api/monetization/validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ set_safety_mode: mode })
      });
      if (response.ok) {
        const data = await loadValidationData();
        setMetrics(data.metrics);
        setDecisions(data.decisions);
        setDriftData(data.drift_data);
        setSafetyMode(data.metrics.safety_mode);
      }
    } catch (err) {
      console.error('Failed to update safety mode:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Manual Override Actions
  const handleOverride = async (decisionId, nextStatus) => {
    setLoading(true);
    try {
      const response = await fetch('/api/monetization/validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          override_id: decisionId,
          override_status: nextStatus
        })
      });
      if (response.ok) {
        const data = await loadValidationData();
        setMetrics(data.metrics);
        setDecisions(data.decisions);
        setDriftData(data.drift_data);
        setSafetyMode(data.metrics.safety_mode);
      }
    } catch (err) {
      console.error('Failed to apply override:', err);
    } finally {
      setLoading(false);
    }
  };

  // Rollback all safety overrides
  const handleRollbackOverrides = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/monetization/validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rollback_overrides: true })
      });
      if (response.ok) {
        const data = await loadValidationData();
        setMetrics(data.metrics);
        setDecisions(data.decisions);
        setDriftData(data.drift_data);
        setSafetyMode(data.metrics.safety_mode);
      }
    } catch (err) {
      console.error('Failed to rollback safety overrides:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine score color category
  const getScoreClass = (score) => {
    if (score > 75) return 'high';
    if (score > 45) return 'medium';
    return 'low';
  };

  // Helper for formatting USD values
  const formatUSD = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const pct = (val) => {
    const num = Number(val);
    return num % 1 === 0 ? `${num.toFixed(0)}%` : `${num.toFixed(1)}%`;
  };

  return (
    <div className="val-container">
      {/* Top Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, background: 'linear-gradient(135deg, #f87171 0%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Corvioz Safety Panel
          </span>
        </div>
        <Link href="/dashboard" id="back-to-dashboard-btn" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 650, color: '#e5e7eb' }}>
          ← Back to Dashboard
        </Link>
      </nav>

      {/* Header */}
      <header className="val-header">
        <p className="val-kicker">Revenue Safety Control Tower</p>
        <h1 className="val-title">Validation Layer Guardrails</h1>
        <p className="val-description">
          Monitor risk scoring, audit validation decisions, override automated optimization actions, and view real-user conversion drift.
        </p>
      </header>

      {/* Overview Metrics Grid */}
      <section className="metrics-row" style={{ marginBottom: '32px' }}>
        <div className="metric-card glow-blue">
          <div className="metric-label">Total Evaluated</div>
          <div className="metric-value" id="total-evaluated-val">
            {metrics.total_evaluated}
          </div>
          <div className="metric-sub">Monetization events verified</div>
        </div>

        <div className="metric-card glow-green">
          <div className="metric-label">Approved decisions</div>
          <div className="metric-value" id="approved-count-val">
            {metrics.approved_count}
          </div>
          <div className="metric-sub">Safe optimization events executed</div>
        </div>

        <div className="metric-card glow-yellow">
          <div className="metric-label">Softened Actions</div>
          <div className="metric-value" id="softened-count-val">
            {metrics.softened_count}
          </div>
          <div className="metric-sub">Friction thresholds adjusted down</div>
        </div>

        <div className="metric-card glow-red">
          <div className="metric-label">Safety Status</div>
          <div className="metric-value" id="safety-status-val" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {metrics.revenue_drift_status}
            <span className="led-indicator" style={{ display: 'inline-flex' }}>
              <span 
                className={`val-led ${metrics.revenue_drift_status === 'Minimal' ? 'green' : metrics.revenue_drift_status === 'Normal' ? 'yellow' : 'red'}`} 
                id="safety-led"
              ></span>
            </span>
          </div>
          <div className="metric-sub">Drift rate: {pct(metrics.misclassification_rate)}</div>
        </div>
      </section>

      {/* Safety Mode Selector Card */}
      <section className="mode-selector-card" id="safety-mode-selector">
        <h2 className="val-card-title" style={{ fontSize: '1rem', marginBottom: '14px' }}>
          🛡️ Global Safety Guardrail Mode
        </h2>
        <div className="mode-grid">
          {/* Safe Mode Button */}
          <button
            id="mode-btn-safe"
            onClick={() => handleSafetyModeChange('safe')}
            className={`mode-option-btn ${safetyMode === 'safe' ? 'active safe' : ''}`}
            disabled={loading}
          >
            <div className="mode-option-title">
              <span className="val-led green"></span>
              SAFE MODE (Default)
            </div>
            <div className="mode-option-desc">
              Strict thresholds. Blocks actions above 70 risk score. Softens pressure at 45. Prioritizes conversion safety.
            </div>
          </button>

          {/* Balanced Mode Button */}
          <button
            id="mode-btn-balanced"
            onClick={() => handleSafetyModeChange('balanced')}
            className={`mode-option-btn ${safetyMode === 'balanced' ? 'active balanced' : ''}`}
            disabled={loading}
          >
            <div className="mode-option-title">
              <span className="val-led yellow"></span>
              BALANCED MODE
            </div>
            <div className="mode-option-desc">
              Moderate parameters. Blocks actions above 80 risk score. Softens at 60. Balanced trade-off.
            </div>
          </button>

          {/* Experiment Mode Button */}
          <button
            id="mode-btn-experiment"
            onClick={() => handleSafetyModeChange('experiment')}
            className={`mode-option-btn ${safetyMode === 'experiment' ? 'active experiment' : ''}`}
            disabled={loading}
          >
            <div className="mode-option-title">
              <span className="val-led red"></span>
              EXPERIMENT MODE
            </div>
            <div className="mode-option-desc">
              Aggressive parameters. Blocks only above 90 risk score. Relaxed checks for rapid optimization learning.
            </div>
          </button>
        </div>
      </section>

      {/* Split Grid layout */}
      <div className="val-grid">
        {/* Left Column: Decision Override Log */}
        <section className="val-card" id="decision-override-log-section">
          <h2 className="val-card-title">
            <span>⚖️</span> Active Validation Override Panel
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="decisions-table">
              <thead>
                <tr>
                  <th>Decision / Context</th>
                  <th>Risk Score</th>
                  <th>Classification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((dec) => {
                  const isLow = dec.risk_score <= 45;
                  const isMedium = dec.risk_score > 45 && dec.risk_score <= 75;
                  const isHigh = dec.risk_score > 75;

                  return (
                    <tr key={dec.id} id={`decision-row-${dec.id}`}>
                      <td>
                        <div className="decision-action-name">{dec.action}</div>
                        <div className="decision-reason">
                          <span style={{ color: '#6b7280', marginRight: '6px' }}>[{dec.timestamp}]</span>
                          {dec.reason}
                        </div>
                      </td>
                      <td>
                        <div className="risk-score-wrapper">
                          <div className="risk-score-bar-outer">
                            <div 
                              className={`risk-score-bar-inner ${getScoreClass(dec.risk_score)}`} 
                              style={{ width: `${dec.risk_score}%` }}
                            ></div>
                          </div>
                          <span className="risk-score-text">{dec.risk_score}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${dec.status.toLowerCase()}`} id={`status-badge-${dec.id}`}>
                          <span className={`val-led ${dec.status === 'Approved' ? 'green' : dec.status === 'Softened' ? 'yellow' : 'red'}`}></span>
                          {dec.status}
                        </span>
                      </td>
                      <td>
                        <div className="override-btn-group">
                          {dec.status !== 'Approved' && (
                            <button
                              id={`override-approve-btn-${dec.id}`}
                              className="btn-override btn-override-approve"
                              onClick={() => handleOverride(dec.id, 'Approved')}
                              disabled={loading}
                              title="Force Approve Action"
                            >
                              Approve
                            </button>
                          )}
                          {dec.status !== 'Softened' && (
                            <button
                              id={`override-soften-btn-${dec.id}`}
                              className="btn-override btn-override-soften"
                              onClick={() => handleOverride(dec.id, 'Softened')}
                              disabled={loading}
                              title="Force Soften Thresholds"
                            >
                              Soften
                            </button>
                          )}
                          {dec.status !== 'Blocked' && (
                            <button
                              id={`override-reject-btn-${dec.id}`}
                              className="btn-override btn-override-reject"
                              onClick={() => handleOverride(dec.id, 'Blocked')}
                              disabled={loading}
                              title="Force Block Action"
                            >
                              Block
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Column: Drift Monitor & Alerts */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Revenue Drift Panel */}
          <section className="val-card" id="revenue-drift-monitor">
            <h2 className="val-card-title">
              <span>📉</span> Revenue Drift Monitor
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: '20px', lineHeight: 1.5 }}>
              Compare simulated models against live user behavior. Red offset lines indicate churn or conversion divergence.
            </p>

            <div className="drift-chart-container">
              {driftData.dates.map((date, idx) => {
                const simVal = driftData.simulated_revenue[idx] || 0;
                const realVal = driftData.real_behavior_revenue[idx] || 0;
                const percentSim = 100;
                const percentReal = Math.round((realVal / simVal) * 100);
                const driftDelta = realVal - simVal;
                const isUnder = driftDelta < 0;

                return (
                  <div key={idx} className="drift-bar-row" id={`drift-row-${date.toLowerCase()}`}>
                    <div className="drift-bar-label">
                      <span>{date}</span>
                      <span>
                        Sim: <strong className="drift-value">{formatUSD(simVal)}</strong> | 
                        Live: <strong className={`drift-value ${isUnder ? 'text-red' : 'text-green'}`} style={{ color: isUnder ? '#f87171' : '#34d399' }}>
                          {formatUSD(realVal)}
                        </strong>
                        {driftDelta !== 0 && (
                          <span style={{ fontSize: '0.68rem', marginLeft: '6px', color: isUnder ? '#f87171' : '#34d399' }}>
                            ({isUnder ? '' : '+'}{formatUSD(driftDelta)})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="drift-bars">
                      {/* Simulated Bar */}
                      <div className="drift-bar-outer">
                        <div className="drift-bar-inner simulated" style={{ width: `${percentSim}%` }}></div>
                      </div>
                      {/* Live Bar */}
                      <div className="drift-bar-outer">
                        <div className={`drift-bar-inner real ${isUnder ? '' : 'good'}`} style={{ width: `${percentReal}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* General Rollback button */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '20px', textAlign: 'center' }}>
              <button
                id="rollback-safety-btn"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.20)', color: '#f87171' }}
                onClick={handleRollbackOverrides}
                disabled={loading}
              >
                ⏪ Rollback Manual Overrides
              </button>
            </div>
          </section>

          {/* Funnel Warnings Feed */}
          <section className="val-card" id="safety-warnings-panel">
            <h2 className="val-card-title">
              <span>⚠️</span> Safety Alerts & Warnings
            </h2>
            <div className="drift-alerts">
              {driftData.alerts.length > 0 ? (
                driftData.alerts.map((alert, idx) => {
                  const isAlert = alert.startsWith('Alert:');
                  const isWarning = alert.startsWith('Warning:');
                  const badgeType = isAlert ? 'danger' : isWarning ? 'warning' : 'notice';

                  return (
                    <div 
                      key={idx} 
                      className={`drift-alert-item ${badgeType === 'warning' ? 'warning' : badgeType === 'notice' ? 'notice' : ''}`}
                      id={`safety-alert-${idx}`}
                    >
                      <span className="drift-alert-icon">
                        {badgeType === 'danger' ? '🚨' : badgeType === 'warning' ? '⚠️' : 'ℹ️'}
                      </span>
                      <span>{alert}</span>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '0.8rem' }}>
                  No warnings active. All funnel progressions conform to predictions.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function Page() {
  if (process.env.NODE_ENV === 'development') {
    return <ValidationDashboard />;
  }
  return null;
}
