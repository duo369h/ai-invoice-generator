'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './evolution.css';

function EvolutionDashboardDev() {
  // 1. Safety Control States
  const [safeMode, setSafeMode] = useState(true);
  const [systemFrozen, setSystemFrozen] = useState(false);
  const [rollbackCount, setRollbackCount] = useState(0);

  // 2. Metrics & Logs State
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    decisions_count: 0,
    expected_uplift: 0,
    active_experiments: 0,
    system_status: 'SECURE',
  });
  const [logs, setLogs] = useState([]);
  const [experiments, setExperiments] = useState([]);

  // 3. Simulation Comparative State
  const [simulatingId, setSimulatingId] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationData, setSimulationData] = useState(null);

  // Fetch baseline stats and logs on mount
  useEffect(() => {
    const fetchBaseline = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/monetization/evolution', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setMetrics(data.metrics);
            setLogs(data.feed);
            setExperiments(data.experiments);
            // Default simulate the first experiment
            if (data.experiments.length > 0) {
              const firstExpId = data.experiments[0].id;
              setSimulatingId(firstExpId);
              setSimulating(true);
              try {
                const simRes = await fetch('/api/monetization/evolution', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    simulate_id: firstExpId,
                    user_count: 1000,
                  }),
                });
                if (simRes.ok) {
                  const simData = await simRes.json();
                  if (simData.success) {
                    setSimulationData(simData);
                  }
                }
              } catch (simErr) {
                console.error('Failed to run initial simulation:', simErr);
              } finally {
                setSimulating(false);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load evolution data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBaseline();
  }, []);

  // Fetch variant simulation for a specific experiment
  const handleSimulate = async (expId) => {
    setSimulatingId(expId);
    setSimulating(true);
    try {
      const response = await fetch('/api/monetization/evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          simulate_id: expId,
          user_count: 1000,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSimulationData(data);
        }
      }
    } catch (err) {
      console.error('Failed to simulate variant impact:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Safe mode toggle handler
  const handleSafeModeToggle = () => {
    const nextVal = !safeMode;
    setSafeMode(nextVal);
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logLine = nextVal
      ? `[${timeStr}] SAFE MODE ENABLED: Enforcing strict anomaly thresholds.`
      : `[${timeStr}] SAFE MODE WARNING: Relaxed safety thresholds. Operating at higher variance.`;
    
    setLogs((prev) => [
      { time: timeStr, type: nextVal ? 'system' : 'warning', message: logLine },
      ...prev,
    ]);
  };

  // Freeze system action handler
  const handleFreezeToggle = async () => {
    const nextVal = !systemFrozen;
    try {
      const response = await fetch('/api/monetization/evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          safety_action: nextVal ? 'freeze' : 'unfreeze',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSystemFrozen(nextVal);
          setLogs((prev) => [
            { time: data.log.time, type: nextVal ? 'warning' : 'system', message: data.log.message },
            ...prev,
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to toggle freeze state:', err);
    }
  };

  // Rollback action handler
  const handleRollback = async () => {
    try {
      const response = await fetch('/api/monetization/evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          safety_action: 'rollback',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRollbackCount((prev) => prev + 1);
          setLogs((prev) => [
            { time: data.log.time, type: 'rollback', message: data.log.message },
            ...prev,
          ]);
          // Reset A/B experiments to baseline running status
          setExperiments((prev) =>
            prev.map((exp) => ({ ...exp, status: 'Running' }))
          );
        }
      }
    } catch (err) {
      console.error('Failed to trigger rollback:', err);
    }
  };

  // Approve Experiment Handler
  const handleApproveExperiment = (expId) => {
    setExperiments((prev) =>
      prev.map((exp) => (exp.id === expId ? { ...exp, status: 'Approved' } : exp))
    );
    const exp = experiments.find((e) => e.id === expId);
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logLine = `[${timeStr}] Approved A/B experiment: "${exp?.title}" variant accepted globally.`;
    setLogs((prev) => [
      { time: timeStr, type: 'system', message: logLine },
      ...prev,
    ]);
  };

  // Reject Experiment Handler
  const handleRejectExperiment = (expId) => {
    setExperiments((prev) =>
      prev.map((exp) => (exp.id === expId ? { ...exp, status: 'Rejected' } : exp))
    );
    const exp = experiments.find((e) => e.id === expId);
    const timeStr = new Date().toTimeString().split(' ')[0];
    const logLine = `[${timeStr}] Rejected A/B experiment: "${exp?.title}" reverted to control group.`;
    setLogs((prev) => [
      { time: timeStr, type: 'rollback', message: logLine },
      ...prev,
    ]);
  };

  // Currency Formatter
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
    <div className="evo-container">
      {/* Top Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, background: 'linear-gradient(135deg, #06b6d4 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Corvioz Autopilot
          </span>
        </div>
        <Link href="/dashboard" id="back-to-dashboard-btn" className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 650, color: '#e5e7eb' }}>
          ← Back to Dashboard
        </Link>
      </nav>

      {/* Header */}
      <header className="evo-header">
        <p className="evo-kicker">Revenue Autopilot Control Tower</p>
        <h1 className="evo-title">Self-Evolving Optimization Engine</h1>
        <p className="evo-description">
          Monitor real-time decision feeds, manage active A/B experiments, and toggle safety protocols on the self-evolving monetization autopilot.
        </p>
      </header>

      {/* Overview Cards */}
      <section className="metrics-row" style={{ marginBottom: '32px' }}>
        <div className="metric-card glow-cyan">
          <div className="metric-label">Decisions Applied</div>
          <div className="metric-value" id="decisions-applied-val">
            {metrics.decisions_count.toLocaleString()}
          </div>
          <div className="metric-sub">Autopilot micro-actions logged</div>
        </div>

        <div className="metric-card glow-green">
          <div className="metric-label">Expected MRR Uplift</div>
          <div className="metric-value" id="mrr-uplift-val">
            +{pct(metrics.expected_uplift)}
          </div>
          <div className="metric-sub">Net revenue evolution index</div>
        </div>

        <div className="metric-card glow-purple">
          <div className="metric-label">A/B Experiments</div>
          <div className="metric-value" id="active-experiments-val">
            {metrics.active_experiments} Active
          </div>
          <div className="metric-sub">Currently running variations</div>
        </div>

        <div className="metric-card glow-pink">
          <div className="metric-label">System Health</div>
          <div className="metric-value" id="system-health-val" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {systemFrozen ? 'FROZEN' : (safeMode ? 'SECURE' : 'ADAPTIVE')}
            <span className="led-indicator" style={{ display: 'inline-flex' }}>
              <span className={`led-light ${systemFrozen ? 'frozen' : (safeMode ? 'secure' : 'safemode')}`} id="health-led"></span>
            </span>
          </div>
          <div className="metric-sub">Rollback count: {rollbackCount}</div>
        </div>
      </section>

      {/* Cyberdeck Safety Control Panel */}
      <section className="section-card" style={{ marginBottom: '32px' }} id="safety-control-panel">
        <h2 className="section-card-title">
          <span>🛡️</span> Autopilot Safety & Kill Switch Panel
        </h2>
        <div className="safety-controls-grid">
          {/* Safe Mode Switch */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 750, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em' }}>
              Autopilot Shielding
            </span>
            <button
              id="safe-mode-toggle"
              onClick={handleSafeModeToggle}
              className={`btn btn-sm ${safeMode ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700 }}
            >
              {safeMode ? '🔒 SAFE MODE: ON' : '🔓 ADAPTIVE SHIELDING'}
            </button>
          </div>

          {/* Rollbacks count */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600 }}>ROLLBACK TRIGGER LOGS</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
              {rollbackCount} revert(s)
            </div>
          </div>

          {/* Autopilot override triggers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 750, textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.05em' }}>
              Autopilot Overrides
            </span>
            <div className="safety-btn-group">
              <button
                id="freeze-system-btn"
                className={`btn-cyber btn-cyber-freeze ${systemFrozen ? 'active' : ''}`}
                onClick={handleFreezeToggle}
              >
                {systemFrozen ? '⚡ Unfreeze Engine' : '❄️ Freeze Engine'}
              </button>
              <button
                id="rollback-btn"
                className="btn-cyber btn-cyber-rollback"
                onClick={handleRollback}
              >
                ⏪ Rollback System
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="evo-grid">
        {/* Left Column: Terminal feed and A/B tests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Autopilot Terminal Log Feed */}
          <section className="terminal-console">
            <div className="terminal-header">
              <span>🖥️ Autopilot Decision Stream</span>
              <span>Uptime: 100.0%</span>
            </div>
            <div className="terminal-feed-box" id="terminal-feed-box">
              {logs.map((log, idx) => (
                <div key={idx} className={`log-line ${log.type}`} id={`log-line-${idx}`}>
                  <span className="log-time">[{log.time}]</span>
                  <span className="log-text">{log.message}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Experiment Manager UI */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} id="experiment-manager-section">
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔬</span> A/B Experiment Manager
            </h2>

            {experiments.map((exp) => {
              const isRunning = exp.status === 'Running';
              const isApproved = exp.status === 'Approved';
              const isRejected = exp.status === 'Rejected';
              const isSimulating = simulatingId === exp.id;

              return (
                <div key={exp.id} id={`exp-card-${exp.id}`} className="experiment-card">
                  <div className="experiment-header">
                    <h3 className="exp-title">{exp.title}</h3>
                    <span className={`exp-status-tag ${exp.status.toLowerCase()}`}>
                      {exp.status}
                    </span>
                  </div>

                  <p className="exp-desc">{exp.description}</p>

                  <div className="variant-grid">
                    <div className="variant-card" style={{ borderLeft: '3px solid #6366f1' }}>
                      <div className="variant-title">{exp.variant_a.name}</div>
                      <div className="variant-metric-row">
                        <span className="variant-metric-val">{exp.variant_a.conversion_rate} CR</span>
                        <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{exp.variant_a.revenue} Rev</span>
                      </div>
                    </div>

                    <div className="variant-card" style={{ borderLeft: '3px solid #06b6d4' }}>
                      <div className="variant-title">{exp.variant_b.name}</div>
                      <div className="variant-metric-row">
                        <span className="variant-metric-val">{exp.variant_b.conversion_rate} CR</span>
                        <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{exp.variant_b.revenue} Rev</span>
                      </div>
                    </div>
                  </div>

                  {isRunning && (
                    <div className="rec-actions">
                      <button
                        id={`approve-btn-${exp.id}`}
                        className="btn-opt btn-opt-accept"
                        style={{ padding: '10px 20px' }}
                        onClick={() => handleApproveExperiment(exp.id)}
                      >
                        Approve Experiment
                      </button>
                      <button
                        id={`reject-btn-${exp.id}`}
                        className="btn-opt btn-opt-reject"
                        style={{ padding: '10px 20px' }}
                        onClick={() => handleRejectExperiment(exp.id)}
                      >
                        Reject Experiment
                      </button>
                      <button
                        id={`simulate-btn-${exp.id}`}
                        className="btn-opt btn-opt-simulate"
                        style={{ padding: '10px 20px' }}
                        onClick={() => handleSimulate(exp.id)}
                        disabled={simulating}
                      >
                        {isSimulating ? 'Simulating...' : 'Simulate Result'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        </div>

        {/* Right Column: Comparative Funnel Viewer */}
        <aside>
          <section className="section-card" style={{ position: 'relative' }}>
            {simulating && (
              <div className="loading-overlay">
                <div className="spinner"></div>
              </div>
            )}
            
            <h2 className="section-card-title">
              <span>📊</span> Revenue Impact Visualization
            </h2>

            {simulationData ? (
              <div className="variant-funnel-panel">
                {/* Metrics header */}
                <div className="compare-header-row">
                  <div className="compare-header-card before">
                    <div className="compare-card-title" id="variant-a-title">
                      {simulatingId === 'watermark' ? 'Soft Watermark' : '$19 Pro (Control)'}
                    </div>
                    <div className="compare-card-val before" id="variant-a-mrr-val">
                      {formatCurrency(simulationData.variant_a.projected_mrr)}
                    </div>
                  </div>
                  <div className="compare-header-card after">
                    <div className="compare-card-title" id="variant-b-title">
                      {simulatingId === 'watermark' ? 'Hard Block' : '$29 Pro (Test)'}
                    </div>
                    <div className="compare-card-val after" id="variant-b-mrr-val">
                      {formatCurrency(simulationData.variant_b.projected_mrr)}
                    </div>
                  </div>
                </div>

                {/* Comparative steps */}
                {simulationData.variant_a.funnel.map((step, idx) => {
                  const afterStep = simulationData.variant_b.funnel[idx];
                  const percentA = Math.round((step.count / 1000) * 100);
                  const percentB = Math.round((afterStep.count / 1000) * 100);

                  return (
                    <div key={idx} className="variant-funnel-row" id={`variant-funnel-row-${step.step.toLowerCase()}`}>
                      <div className="variant-funnel-label">{step.step}</div>
                      <div className="variant-funnel-bars">
                        {/* Variant A */}
                        <div className="v-bar-wrapper">
                          <div className="v-bar-outer">
                            <div className="v-bar-inner var-a" style={{ width: `${percentA}%` }}></div>
                          </div>
                          <span className="v-bar-val var-a">{step.count}</span>
                        </div>
                        {/* Variant B */}
                        <div className="v-bar-wrapper">
                          <div className="v-bar-outer">
                            <div className="v-bar-inner var-b" style={{ width: `${percentB}%` }}></div>
                          </div>
                          <span className="v-bar-val var-b">{afterStep.count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', fontSize: '0.9rem' }}>
                Select an experiment card and click &quot;Simulate Result&quot; to inspect the comparative funnel impact.
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function EvolutionDashboard() {
  if (process.env.NODE_ENV === 'development') {
    return <EvolutionDashboardDev />;
  }
  return null;
}
