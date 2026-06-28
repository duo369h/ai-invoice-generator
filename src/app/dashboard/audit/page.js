'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './audit.css';

function AuditDashboard() {
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState('NOT READY FOR v6');
  const [systemMessage, setSystemMessage] = useState('');
  const [systemLed, setSystemLed] = useState('red');
  const [components, setComponents] = useState({
    funnel: 'warning',
    pricing: 'unsafe',
    paywall: 'unsafe',
    conversion_flow: 'unsafe'
  });
  const [funnelSteps, setFunnelSteps] = useState([]);
  const [paywallAggression, setPaywallAggression] = useState({
    trigger_frequency: '',
    blocks_users_at: [],
    conversion_impact: ''
  });
  const [controlState, setControlState] = useState({
    paywallEngineEnabled: true,
    pricingChangesRolledBack: false,
    funnelRulesReset: false
  });

  // API loading helper
  const loadAuditData = async () => {
    const response = await fetch('/api/monetization/audit', {
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
    throw new Error('Failed to load audit specifications');
  };

  // Run on mount
  useEffect(() => {
    const init = async () => {
      try {
        const data = await loadAuditData();
        setSystemStatus(data.system_status);
        setSystemMessage(data.system_status_message);
        setSystemLed(data.system_status_led);
        setComponents(data.components);
        setFunnelSteps(data.funnel_integrity);
        setPaywallAggression(data.paywall_aggression);
        setControlState(data.state);
      } catch (err) {
        console.error('Audit initialization failed:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Post control actions to API
  const handleControlAction = async (actionType) => {
    setLoading(true);
    try {
      const response = await fetch('/api/monetization/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: actionType })
      });
      if (response.ok) {
        const data = await loadAuditData();
        setSystemStatus(data.system_status);
        setSystemMessage(data.system_status_message);
        setSystemLed(data.system_status_led);
        setComponents(data.components);
        setFunnelSteps(data.funnel_integrity);
        setPaywallAggression(data.paywall_aggression);
        setControlState(data.state);
      }
    } catch (err) {
      console.error('Failed to register control command:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="audit-container">
      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, background: 'linear-gradient(135deg, #a7f3d0 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Corvioz Safety Auditor
          </span>
        </div>
        <Link href="/dashboard" id="back-to-dashboard-btn" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 650, color: '#e5e7eb' }}>
          ← Back to Dashboard
        </Link>
      </nav>

      {/* Header */}
      <header className="audit-header">
        <p className="audit-kicker">Revenue Safety Audit Tower</p>
        <h1 className="audit-title">v5.9 Core Safety Auditor</h1>
        <p className="audit-description">
          Evaluate risk indices, verify funnel transition integrity, and configure safety overrides to determine if the codebase is ready for v6 Autonomous Revenue OS rollout.
        </p>
      </header>

      {/* Big System Status Indicator Card */}
      <section className="status-indicator-box" id="system-status-box">
        <div className="status-left">
          <div className="status-title-label">v6 Deployment Validation Status</div>
          <div className={`status-main-badge ${systemLed}`} id="system-status-badge">
            SYSTEM STATUS: {systemStatus}
          </div>
          <p className="status-message" id="system-status-message">{systemMessage}</p>
        </div>
        <div className="status-right" style={{ display: 'flex', alignItems: 'center' }}>
          <span className={`status-blinker ${systemLed}`} id="system-blinker-light"></span>
        </div>
      </section>

      {/* Component Risk Classification Grid */}
      <section className="risk-grid" id="component-risk-grid">
        {/* Funnel Risk Card */}
        <div className="risk-card" id="risk-card-funnel">
          <div className="risk-info">
            <span className="risk-label">Funnel Health</span>
            <span className="risk-value">Conversion Pipeline</span>
          </div>
          <span className={`risk-status-badge ${components.funnel}`} id="risk-badge-funnel">
            {components.funnel === 'safe' ? 'Safe' : 'Warning'}
          </span>
        </div>

        {/* Pricing Risk Card */}
        <div className="risk-card" id="risk-card-pricing">
          <div className="risk-info">
            <span className="risk-label">Pricing Safety</span>
            <span className="risk-value">Margin Overrides</span>
          </div>
          <span className={`risk-status-badge ${components.pricing}`} id="risk-badge-pricing">
            {components.pricing === 'safe' ? 'Safe' : 'Unsafe'}
          </span>
        </div>

        {/* Paywall Risk Card */}
        <div className="risk-card" id="risk-card-paywall">
          <div className="risk-info">
            <span className="risk-label">Paywall Aggression</span>
            <span className="risk-value">Blocking Limits</span>
          </div>
          <span className={`risk-status-badge ${components.paywall}`} id="risk-badge-paywall">
            {components.paywall === 'safe' ? 'Safe' : 'Unsafe'}
          </span>
        </div>

        {/* Conversion Flow Risk Card */}
        <div className="risk-card" id="risk-card-conversion">
          <div className="risk-info">
            <span className="risk-label">Conversion Flow</span>
            <span className="risk-value">UX Friction</span>
          </div>
          <span className={`risk-status-badge ${components.conversion_flow}`} id="risk-badge-conversion">
            {components.conversion_flow === 'safe' ? 'Safe' : components.conversion_flow === 'warning' ? 'Warning' : 'Unsafe'}
          </span>
        </div>
      </section>

      {/* Main split grid */}
      <div className="audit-grid">
        {/* Left Column: Funnel Integrity and Paywall aggression */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Funnel Integrity Viewer */}
          <section className="audit-card" id="funnel-integrity-viewer-section">
            <h2 className="card-title">
              <span>📊</span> Funnel Integrity Viewer
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '24px', lineHeight: 1.5 }}>
              Audits conversion volumes and drop-off steps across the client lifecycle. Highlighted nodes indicate friction drop-offs.
            </p>
            <div className="funnel-integrity-viewer">
              {funnelSteps.map((step, idx) => {
                return (
                  <React.Fragment key={idx}>
                    {/* Node Row */}
                    <div className={`funnel-node-row ${step.status}`} id={`funnel-node-${step.step.toLowerCase()}`}>
                      <div className="node-left">
                        <span className="node-number">{idx + 1}</span>
                        <div>
                          <div className="node-name">{step.step}</div>
                          <div className="node-label">{step.label}</div>
                        </div>
                      </div>
                      <div className="node-right">
                        <div className="node-count">{step.count} users</div>
                        {idx > 0 && (
                          <div className={`node-drop ${step.status}`}>
                            -{step.drop}% drop-off
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Transition arrow connector */}
                    {idx < funnelSteps.length - 1 && (
                      <div className={`funnel-transition-line ${step.status === 'unsafe' ? 'broken' : 'safe'}`}>
                        {step.transition ? (
                          <span>⚡ {step.transition} </span>
                        ) : (
                          <span>↓ transition ↓</span>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </section>

          {/* Paywall Aggression Monitor */}
          <section className="audit-card" id="paywall-aggression-monitor-section">
            <h2 className="card-title">
              <span>🛑</span> Paywall Aggression Monitor
            </h2>
            <div className="aggression-list">
              <div className="aggression-metric-row">
                <div className="agg-label">Trigger Frequency</div>
                <div className="agg-value" id="paywall-frequency-val">{paywallAggression.trigger_frequency}</div>
              </div>
              <div className="aggression-metric-row">
                <div className="agg-label">Active blocking zones</div>
                <div className="block-locations-grid">
                  {paywallAggression.blocks_users_at.map((loc, idx) => (
                    <div 
                      key={idx} 
                      className={`block-location-item ${!controlState.paywallEngineEnabled ? 'safe' : ''}`}
                      id={`blocking-zone-${idx}`}
                    >
                      <span>🚫</span> {loc}
                    </div>
                  ))}
                </div>
              </div>
              <div className="aggression-metric-row">
                <div className="agg-label">Conversion Drag</div>
                <div 
                  className="agg-value" 
                  id="paywall-drag-val" 
                  style={{ color: controlState.paywallEngineEnabled ? '#f87171' : '#34d399' }}
                >
                  {paywallAggression.conversion_impact}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Rollback Controls Card */}
        <aside>
          <section className="audit-card rollback-controls-card" id="rollback-controls-section">
            <h2 className="card-title">
              <span>⚙️</span> Safety Controls & Overrides
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '24px', lineHeight: 1.5 }}>
              Use the override controls below to rollback aggressive optimizations, disable paywall blocks, and restore conversion stability.
            </p>
            <div className="control-btn-grid">
              {/* Paywall Controller Row */}
              <div className="control-action-row" id="control-row-paywall">
                <div className="control-info">
                  <span className="control-title">Paywall Engine</span>
                  <span className="control-desc">
                    {controlState.paywallEngineEnabled ? 'Aggressive gates enabled' : 'Soft upsell banners active'}
                  </span>
                </div>
                <button
                  id="toggle-paywall-btn"
                  onClick={() => handleControlAction('toggle_paywall')}
                  disabled={loading}
                  className={`btn-audit-cyber ${controlState.paywallEngineEnabled ? 'disable' : 'enable'}`}
                >
                  {controlState.paywallEngineEnabled ? 'Disable Paywall' : 'Enable Paywall'}
                </button>
              </div>

              {/* Pricing Controller Row */}
              <div className="control-action-row" id="control-row-pricing">
                <div className="control-info">
                  <span className="control-title">Pricing Optimization</span>
                  <span className="control-desc">
                    {controlState.pricingChangesRolledBack ? 'Reverted to baseline rates' : 'Custom high-intent pricing active'}
                  </span>
                </div>
                <button
                  id="rollback-pricing-btn"
                  onClick={() => handleControlAction('rollback_pricing')}
                  disabled={loading}
                  className={`btn-audit-cyber ${controlState.pricingChangesRolledBack ? 'enable' : 'rollback'}`}
                >
                  {controlState.pricingChangesRolledBack ? 'Apply Optimization' : 'Rollback Pricing'}
                </button>
              </div>

              {/* Funnel Controller Row */}
              <div className="control-action-row" id="control-row-funnel">
                <div className="control-info">
                  <span className="control-title">Funnel Progression Rules</span>
                  <span className="control-desc">
                    {controlState.funnelRulesReset ? 'Clean templates active' : 'Friction limit rules active'}
                  </span>
                </div>
                <button
                  id="reset-funnel-btn"
                  onClick={() => handleControlAction('reset_funnel')}
                  disabled={loading}
                  className={`btn-audit-cyber ${controlState.funnelRulesReset ? 'enable' : 'reset'}`}
                >
                  {controlState.funnelRulesReset ? 'Apply Friction Rules' : 'Reset Funnel Rules'}
                </button>
              </div>
            </div>

            {/* General Reset Button */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', marginTop: '24px', paddingTop: '20px', textAlign: 'center' }}>
              <button
                id="reset-all-audit-btn"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 700, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.20)', color: '#f87171' }}
                onClick={() => handleControlAction('reset_all')}
                disabled={loading}
              >
                🚨 Re-activate Aggressive Optimization (Reset All)
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function Page() {
  if (process.env.NODE_ENV === 'development') {
    return <AuditDashboard />;
  }
  return null;
}
