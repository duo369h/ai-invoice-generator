'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, BarChart3, RefreshCw, TrendingUp } from 'lucide-react';

const EVENT_LABELS = {
  landing_view: 'Landing view',
  invoice_create: 'Invoice create',
  quote_create: 'Quote create',
  export_attempt: 'Export attempt',
  pricing_view: 'Pricing view',
  signup_start: 'Signup start',
  signup_complete: 'Signup complete',
  payment_success: 'Paid conversion',
};

const RATE_LABELS = {
  activation_rate: 'Activation rate',
  export_rate: 'Export rate',
  signup_rate: 'Signup rate',
  paid_conversion_rate: 'Paid conversion rate',
};

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function MetricCard({ label, value, detail }) {
  return (
    <div style={styles.metricCard}>
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
      {detail && <span style={styles.metricDetail}>{detail}</span>}
    </div>
  );
}

function EventRow({ eventName, count, sessions }) {
  return (
    <div style={styles.eventRow}>
      <div>
        <strong style={styles.eventName}>{EVENT_LABELS[eventName] || eventName}</strong>
        <span style={styles.eventKey}>{eventName}</span>
      </div>
      <div style={styles.eventNumbers}>
        <strong>{count || 0}</strong>
        <span>{sessions || 0} sessions</span>
      </div>
    </div>
  );
}

export default function BetaGrowthDashboardPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/beta-growth/metrics?days=${days}`, { cache: 'no-store' });
      const nextData = await response.json();
      if (!response.ok) throw new Error(nextData.error || 'Failed to load metrics');
      setData(nextData);
    } catch (err) {
      setError(err.message || 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMetrics();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadMetrics]);

  const rows = useMemo(() => Object.keys(EVENT_LABELS).map((eventName) => ({
    eventName,
    count: data?.totals?.[eventName] || 0,
    sessions: data?.event_sessions?.[eventName] || 0,
  })), [data]);

  return (
    <main style={styles.page}>
      <nav style={styles.nav}>
        <Link href="/dashboard" style={styles.backLink}>
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <div style={styles.navRight}>
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            style={styles.select}
            aria-label="Metrics window"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <button type="button" style={styles.refreshButton} onClick={loadMetrics} disabled={loading}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </nav>

      <header style={styles.header}>
        <p style={styles.kicker}>Corvioz Beta</p>
        <h1 style={styles.title}>Beta Growth Dashboard</h1>
        <p style={styles.description}>
          User acquisition and activation metrics from Supabase growth events.
        </p>
      </header>

      {!data?.configured && !loading && (
        <div style={styles.warning}>
          Supabase service-role metrics storage is not configured in this environment. The dashboard will populate after production env vars are available.
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      <section style={styles.metricGrid} aria-label="Beta metrics">
        <MetricCard
          label={RATE_LABELS.activation_rate}
          value={loading ? '...' : formatPercent(data?.rates?.activation_rate)}
          detail="invoice_create or quote_create / landing sessions"
        />
        <MetricCard
          label={RATE_LABELS.export_rate}
          value={loading ? '...' : formatPercent(data?.rates?.export_rate)}
          detail="export_attempt / activated sessions"
        />
        <MetricCard
          label={RATE_LABELS.signup_rate}
          value={loading ? '...' : formatPercent(data?.rates?.signup_rate)}
          detail="signup_complete / signup_start"
        />
        <MetricCard
          label={RATE_LABELS.paid_conversion_rate}
          value={loading ? '...' : formatPercent(data?.rates?.paid_conversion_rate)}
          detail="payment_success / signup_complete"
        />
      </section>

      <section style={styles.twoColumn}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.panelKicker}>Acquisition events</p>
              <h2 style={styles.panelTitle}>Tracked funnel</h2>
            </div>
            <BarChart3 size={20} color="var(--accent-text)" />
          </div>
          <div style={styles.eventList}>
            {rows.map((row) => (
              <EventRow key={row.eventName} {...row} />
            ))}
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.panelKicker}>Session summary</p>
              <h2 style={styles.panelTitle}>Beta health</h2>
            </div>
            <Activity size={20} color="var(--success-text)" />
          </div>
          <div style={styles.summaryGrid}>
            <MetricCard label="Total sessions" value={loading ? '...' : data?.sessions?.total || 0} />
            <MetricCard label="Activated sessions" value={loading ? '...' : data?.sessions?.activated || 0} />
            <MetricCard label="Pricing sessions" value={loading ? '...' : data?.sessions?.pricing_view || 0} />
            <MetricCard label="Paid sessions" value={loading ? '...' : data?.sessions?.paid || 0} />
          </div>
          <div style={styles.recentHeader}>
            <TrendingUp size={16} />
            Recent events
          </div>
          <div style={styles.recentList}>
            {(data?.recent_events || []).slice(0, 8).map((event, index) => (
              <div key={`${event.created_at}-${index}`} style={styles.recentRow}>
                <span>{event.event_name}</span>
                <time>{event.created_at ? new Date(event.created_at).toLocaleString() : ''}</time>
              </div>
            ))}
            {!loading && !data?.recent_events?.length && (
              <p style={styles.empty}>No events stored for this window yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-page)',
    color: 'var(--text-main)',
    padding: '34px 24px 80px',
    fontFamily: 'var(--font-sans)',
  },
  nav: {
    maxWidth: '1180px',
    margin: '0 auto 36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-muted)',
    fontSize: '0.86rem',
    fontWeight: 700,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  select: {
    minHeight: '36px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    color: 'var(--text-main)',
    padding: '0 10px',
    fontWeight: 700,
  },
  refreshButton: {
    minHeight: '36px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--btn-secondary-bg)',
    color: 'var(--text-main)',
    padding: '0 12px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  header: {
    maxWidth: '1180px',
    margin: '0 auto 28px',
  },
  kicker: {
    margin: '0 0 8px',
    color: 'var(--accent-text)',
    fontSize: '0.72rem',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  title: {
    margin: 0,
    fontSize: '2.6rem',
    lineHeight: 1.05,
    letterSpacing: 0,
  },
  description: {
    margin: '14px 0 0',
    color: 'var(--text-muted)',
    fontSize: '1rem',
    maxWidth: '680px',
  },
  warning: {
    maxWidth: '1180px',
    margin: '0 auto 18px',
    border: '1px solid var(--warning-border)',
    background: 'var(--warning-glow)',
    color: 'var(--warning-text)',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '0.88rem',
    fontWeight: 700,
  },
  error: {
    maxWidth: '1180px',
    margin: '0 auto 18px',
    border: '1px solid var(--danger-border)',
    background: 'var(--danger-glow)',
    color: 'var(--danger-text)',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '0.88rem',
    fontWeight: 700,
  },
  metricGrid: {
    maxWidth: '1180px',
    margin: '0 auto 22px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  metricCard: {
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    borderRadius: '8px',
    padding: '18px',
    minHeight: '116px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '10px',
    boxShadow: 'var(--shadow-sm)',
  },
  metricLabel: {
    color: 'var(--text-muted)',
    fontSize: '0.76rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  metricValue: {
    color: 'var(--text-main)',
    fontSize: '1.8rem',
    lineHeight: 1,
  },
  metricDetail: {
    color: 'var(--text-soft)',
    fontSize: '0.78rem',
    lineHeight: 1.35,
  },
  twoColumn: {
    maxWidth: '1180px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
    gap: '18px',
  },
  panel: {
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: 'var(--shadow-sm)',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '16px',
  },
  panelKicker: {
    margin: '0 0 4px',
    color: 'var(--text-soft)',
    fontSize: '0.72rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  panelTitle: {
    margin: 0,
    fontSize: '1.1rem',
  },
  eventList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  eventRow: {
    minHeight: '58px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '10px 12px',
    background: 'var(--btn-secondary-bg)',
  },
  eventName: {
    display: 'block',
    fontSize: '0.9rem',
    color: 'var(--text-main)',
  },
  eventKey: {
    display: 'block',
    marginTop: '2px',
    color: 'var(--text-soft)',
    fontSize: '0.76rem',
    fontFamily: 'var(--font-mono)',
  },
  eventNumbers: {
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    color: 'var(--text-muted)',
    fontSize: '0.78rem',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
  },
  recentHeader: {
    margin: '20px 0 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  recentRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    color: 'var(--text-muted)',
    borderBottom: '1px solid var(--border)',
    paddingBottom: '8px',
    fontSize: '0.8rem',
  },
  empty: {
    color: 'var(--text-soft)',
    fontSize: '0.84rem',
    margin: 0,
  },
};
