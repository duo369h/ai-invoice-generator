'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import './control-plane.css';

const POLL_INTERVAL = 5000; // 每5秒自动刷新一次

const RISK_LABEL = { safe: 'Safe', warning: 'Warning', danger: 'Danger' };
const RISK_DOT = { safe: 'green', warning: 'yellow', danger: 'red' };

const DECISION_COLOR = {
  allow: '#34d399',
  block: '#f87171',
  soft_paywall: '#fbbf24',
  upsell: '#818cf8',
  redirect: '#60a5fa',
};

function formatTime(ts) {
  if (!ts) return '';
  // already formatted as HH:MM:SS
  return ts;
}

function ControlPlaneDashboardDev() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState('ACTIVE');
  const [shadowMode, setShadowMode] = useState(true);
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [risks, setRisks] = useState({
    paywall: 'warning',
    pricing: 'warning',
    funnel: 'warning',
    misclassification: 'safe',
  });
  const [decisions, setDecisions] = useState([]);
  const [state, setState] = useState({
    shadowMode: true,
    paywallEngineEnabled: true,
    pricingChangesRolledBack: false,
    funnelRulesReset: false,
  });
  const [lastAction, setLastAction] = useState(null);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  // ── 拉取控制面板状态 ──────────────────────────────────────────
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/revenue/control-plane', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error('API returned failure');
      setSystemStatus(data.system_status ?? 'ACTIVE');
      setShadowMode(data.shadow_mode ?? true);
      setRiskLevel(data.risk_level ?? 'LOW');
      setRisks(data.risks ?? risks);
      setDecisions(data.decisions ?? []);
      setState(data.state ?? state);
      setError(null);
    } catch (err) {
      console.error('[ControlPlane] fetch error:', err);
      setError('Failed to reach control plane API. Retrying…');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 初始化 + 预热日志（发几条 simulate_action 让日志不空）──────
  useEffect(() => {
    const init = async () => {
      // 先发几条预热日志
      const seedActions = ['Create Invoice', 'Export PDF', 'Upgrade CTA'];
      for (const act of seedActions) {
        await fetch('/api/revenue/control-plane', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ simulate_action: act }),
        }).catch(() => {});
      }
      await fetchState();
      setInitialLoading(false);
    };
    init();
  }, [fetchState]);

  // ── 自动轮询刷新 ──────────────────────────────────────────────
  useEffect(() => {
    pollRef.current = setInterval(fetchState, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchState]);

  // ── 发送控制指令 ──────────────────────────────────────────────
  const handleControlAction = async (actionName, isSimulation = false) => {
    setActionLoading(true);
    setLastAction(actionName);
    try {
      const body = isSimulation
        ? { simulate_action: actionName }
        : { action: actionName };

      const res = await fetch('/api/revenue/control-plane', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await fetchState();
    } catch (err) {
      console.error('[ControlPlane] action error:', err);
      setError('Action failed. Retrying state sync…');
      await fetchState();
    } finally {
      setActionLoading(false);
      setTimeout(() => setLastAction(null), 2000);
    }
  };

  const loading = initialLoading;

  // ── 决策颜色 ─────────────────────────────────────────────────
  const decisionColor = (dec) => DECISION_COLOR[dec] ?? '#9ca3af';

  // ── 风险等级颜色 ─────────────────────────────────────────────
  const riskColor = riskLevel === 'LOW' ? '#34d399' : riskLevel === 'MEDIUM' ? '#fbbf24' : '#f87171';

  return (
    <div className="cp-container">
      {/* ── Top Navbar ─────────────────────────────────────────── */}
      <nav className="cp-nav">
        <div className="cp-nav-brand">
          <span className="cp-nav-dot" />
          <span className="cp-nav-title">Corvioz Control Plane</span>
          <span className="cp-version-badge">v5.95</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {actionLoading && (
            <span className="cp-loading-spinner-inline" aria-label="Processing…" />
          )}
          <Link
            href="/dashboard"
            id="back-to-dashboard-btn"
            className="cp-back-btn"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="cp-header">
        <p className="cp-kicker">Workflow Control Tower · v5.95 CONTROL PLANE</p>
        <h1 className="cp-title">Workflow Control Plane</h1>
        <p className="cp-description">
          Monitor decision streams, configure safety layers, audit risk indices, and trigger
          manual rollback directives.
        </p>
      </header>

      {/* ── Global Error Banner ─────────────────────────────────── */}
      {error && (
        <div className="cp-error-banner" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* ── MODULE 1: System Status ─────────────────────────────── */}
      <section className="status-bar-card" id="system-status-module" aria-label="System Status">
        {loading ? (
          <div className="cp-skeleton-row">
            <div className="cp-skeleton" style={{ width: 140 }} />
            <div className="cp-skeleton" style={{ width: 100 }} />
            <div className="cp-skeleton" style={{ width: 120 }} />
          </div>
        ) : (
          <>
            <div className="status-item">
              <span className="status-dot green" />
              <span className="status-label">v5.95 CONTROL PLANE:</span>
              <span className="status-value" id="system-status-val">{systemStatus}</span>
            </div>

            <div className="status-item">
              <span className="status-label">Shadow Mode:</span>
              <span
                className="status-value"
                id="shadow-mode-val"
                style={{ color: shadowMode ? '#34d399' : '#6b7280' }}
              >
                {shadowMode ? '🛡️ ON' : '⚡ OFF'}
              </span>
            </div>

            <div className="status-item">
              <span className="status-label">Risk Level:</span>
              <span
                className="status-value"
                id="risk-level-val"
                style={{ color: riskColor }}
              >
                {riskLevel}
              </span>
            </div>

            <div className="status-item">
              <span className="status-label">Paywall Engine:</span>
              <span
                className="status-value"
                style={{ color: state.paywallEngineEnabled ? '#34d399' : '#9ca3af' }}
              >
                {state.paywallEngineEnabled ? 'ENABLED' : 'DISABLED'}
              </span>
            </div>
          </>
        )}
      </section>

      {/* ── Simulator Action Tray ───────────────────────────────── */}
      <section className="cp-card action-simulator-card" id="simulator-tray-module" aria-label="Simulate User Actions">
        <h2 className="cp-card-title">🔌 Simulate Live User Actions</h2>
        <p className="cp-card-subtitle">
          每次点击会发送真实 API 调用，结果会立即出现在下方决策日志中
        </p>
        <div className="simulator-btn-row">
          {[
            { id: 'sim-btn-invoice', label: 'Create Invoice', action: 'Create Invoice' },
            { id: 'sim-btn-pdf', label: 'Export PDF', action: 'Export PDF' },
            { id: 'sim-btn-cta', label: 'Upgrade CTA', action: 'Upgrade CTA' },
            { id: 'sim-btn-pricing', label: 'Pricing Click', action: 'Pricing click' },
            { id: 'sim-btn-quote', label: 'Create Quote', action: 'Create Quote' },
          ].map(({ id, label, action }) => (
            <button
              key={id}
              id={id}
              className={`btn-sim-action ${lastAction === action ? 'triggered' : ''}`}
              onClick={() => handleControlAction(action, true)}
              disabled={actionLoading}
              aria-label={`Simulate ${label}`}
            >
              {lastAction === action ? '✓ Sent' : label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Main Grid ──────────────────────────────────────────── */}
      <div className="cp-grid">
        {/* ── MODULE 2: Workflow Decisions Stream ───────────────── */}
        <section className="cp-card" id="decisions-stream-module" aria-label="Workflow Decisions Stream">
          <h2 className="cp-card-title">
            Workflow Decisions Stream
            <span className="cp-live-badge">LIVE</span>
          </h2>

          {loading ? (
            <div className="decisions-stream-box">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="decision-log-item">
                  <div className="cp-skeleton" style={{ width: '70%', marginBottom: 6 }} />
                  <div className="cp-skeleton" style={{ width: '55%' }} />
                </div>
              ))}
            </div>
          ) : decisions.length === 0 ? (
            <div className="cp-empty-state">
              <span style={{ fontSize: '1.5rem' }}>📡</span>
              <p>No decisions yet.<br />Use the simulator above to trigger events.</p>
            </div>
          ) : (
            <div className="decisions-stream-box" id="decisions-stream-box">
              {decisions.map((dec) => {
                const isSys = dec.id?.startsWith('sys_');
                return (
                  <div
                    key={dec.id}
                    className={`decision-log-item ${isSys ? 'system' : ''}`}
                    id={`log-item-${dec.id}`}
                  >
                    <div className="log-meta-row">
                      <span className="log-action-text">
                        {isSys ? '⚙️ SYSTEM' : `User: "${dec.action}"`}
                      </span>
                      <span className="log-time-text">{formatTime(dec.timestamp)}</span>
                    </div>
                    <div className="log-detail-row">
                      {!isSys && (
                        <span className="log-score-tag">
                          intent: {dec.intent_score ?? '—'}
                        </span>
                      )}{' '}
                      <span
                        className="log-decision-tag"
                        style={{ color: decisionColor(dec.decision) }}
                      >
                        → {dec.decision ?? 'allow'}
                      </span>{' '}
                      <span className="log-reason">
                        {dec.reason ? `· ${dec.reason}` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Right Column ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* ── MODULE 3: Risk Panel ────────────────────────────── */}
          <section className="cp-card" id="risk-panel-module" aria-label="Risk Monitoring Panel">
            <h2 className="cp-card-title">⚠️ Safety Risk Panel</h2>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="cp-skeleton" style={{ height: 44 }} />
                ))}
              </div>
            ) : (
              <div className="risk-panel-list">
                {[
                  { key: 'paywall', label: 'Paywall Risk' },
                  { key: 'pricing', label: 'Pricing Risk' },
                  { key: 'funnel', label: 'Funnel Break Risk' },
                  { key: 'misclassification', label: 'Misclassification Risk' },
                ].map(({ key, label }) => (
                  <div className="risk-item-row" key={key} id={`risk-row-${key}`}>
                    <span className="risk-name">{label}</span>
                    <span
                      className={`risk-status-dot-badge ${risks[key] ?? 'warning'}`}
                      id={`risk-badge-${key}`}
                    >
                      <span className={`status-dot ${RISK_DOT[risks[key]] ?? 'yellow'}`} />
                      {RISK_LABEL[risks[key]] ?? 'Warning'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── MODULE 4: Rollback Controls ─────────────────────── */}
          <section className="cp-card" id="rollback-control-module" aria-label="Rollback Controls">
            <h2 className="cp-card-title">🔁 Safety Override &amp; Rollbacks</h2>
            <div className="rollback-btn-list">
              {/* Toggle Shadow Mode */}
              <button
                id="btn-toggle-shadow"
                onClick={() => handleControlAction('toggle_shadow_mode')}
                disabled={actionLoading}
                className={`btn-linear ${state.shadowMode ? 'active' : ''}`}
                aria-pressed={state.shadowMode}
              >
                <div>
                  <div>Switch Shadow Mode {state.shadowMode ? 'OFF' : 'ON'}</div>
                  <div className="btn-linear-desc">
                    {state.shadowMode
                      ? 'Shadow ON — decisions simulated, no real blocking'
                      : 'Production ON — live paywalls active'}
                  </div>
                </div>
                <span>{state.shadowMode ? '🛡️' : '⚡'}</span>
              </button>

              {/* Disable/Enable Paywall Engine */}
              <button
                id="btn-disable-paywall"
                onClick={() => handleControlAction('toggle_paywall')}
                disabled={actionLoading}
                className={`btn-linear ${!state.paywallEngineEnabled ? 'active' : ''}`}
                aria-pressed={!state.paywallEngineEnabled}
              >
                <div>
                  <div>
                    {state.paywallEngineEnabled ? 'Disable Paywall Engine' : 'Re-enable Paywall Engine'}
                  </div>
                  <div className="btn-linear-desc">
                    {state.paywallEngineEnabled
                      ? 'Active — blocking paywall rules enabled'
                      : 'Suspended — soft banners only'}
                  </div>
                </div>
                <span>🚫</span>
              </button>

              {/* Rollback Pricing */}
              <button
                id="btn-rollback-pricing"
                onClick={() => handleControlAction('rollback_pricing')}
                disabled={actionLoading}
                className={`btn-linear ${state.pricingChangesRolledBack ? 'active' : ''}`}
                aria-pressed={state.pricingChangesRolledBack}
              >
                <div>
                  <div>
                    {state.pricingChangesRolledBack
                      ? 'Restore Custom Pricing Rules'
                      : 'Rollback Last Pricing Change'}
                  </div>
                  <div className="btn-linear-desc">
                    {state.pricingChangesRolledBack
                      ? 'Pricing at baseline standard plan rates'
                      : 'Custom high-intent pricing rules active'}
                  </div>
                </div>
                <span>⏪</span>
              </button>

              {/* Reset Funnel Rules */}
              <button
                id="btn-reset-funnel"
                onClick={() => handleControlAction('reset_funnel')}
                disabled={actionLoading}
                className={`btn-linear ${state.funnelRulesReset ? 'active' : ''}`}
                aria-pressed={state.funnelRulesReset}
              >
                <div>
                  <div>
                    {state.funnelRulesReset ? 'Restore Funnel Optimization' : 'Reset Funnel Rules'}
                  </div>
                  <div className="btn-linear-desc">
                    {state.funnelRulesReset
                      ? 'Baseline funnel — no friction optimization'
                      : 'Friction optimization limits active'}
                  </div>
                </div>
                <span>⚙️</span>
              </button>
            </div>

            {/* Full Reset */}
            <div className="cp-reset-row">
              <button
                id="reset-all-cp-btn"
                className="btn-reset-all"
                onClick={() => handleControlAction('reset_all')}
                disabled={actionLoading}
              >
                {actionLoading && lastAction === 'reset_all'
                  ? 'Resetting…'
                  : '↺ Re-activate Production Rules (Reset All Overrides)'}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* ── Footer status ───────────────────────────────────────── */}
      <footer className="cp-footer">
        <span>Auto-refreshes every {POLL_INTERVAL / 1000}s</span>
        <span>·</span>
        <span>
          Connected to{' '}
          <code className="cp-code">/api/revenue/control-plane</code>
        </span>
      </footer>
    </div>
  );
}

export default function ControlPlaneDashboard() {
  if (process.env.NODE_ENV === 'development') {
    return <ControlPlaneDashboardDev />;
  }
  return null;
}
