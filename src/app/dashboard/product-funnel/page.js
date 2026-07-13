'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { createBrowserSupabaseClient } from '../../lib/supabase-client';

async function authHeaders() {
  const supabase = createBrowserSupabaseClient();
  const { data } = supabase ? await supabase.auth.getSession() : { data: null };
  return data?.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

function pct(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export default function ProductFunnelPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/product/funnel?days=${days}`, {
        cache: 'no-store',
        headers: await authHeaders(),
      });
      const next = await response.json();
      if (!response.ok) throw new Error(next.error || 'Failed to load funnel');
      setData(next);
    } catch (err) {
      setError(err.message || 'Failed to load funnel');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main style={styles.page}>
      <nav style={styles.nav}>
        <Link href="/dashboard" style={styles.back}><ArrowLeft size={16} /> Dashboard</Link>
        <div style={styles.actions}>
          <select value={days} onChange={(event) => setDays(Number(event.target.value))} style={styles.select}>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <button type="button" onClick={load} disabled={loading} style={styles.button}><RefreshCw size={15} /> Refresh</button>
        </div>
      </nav>
      <header style={styles.header}>
        <p style={styles.kicker}>Internal Metrics</p>
        <h1 style={styles.title}>Product Funnel</h1>
        <p style={styles.copy}>Landing to signup to quote to invoice to paid conversion.</p>
      </header>
      {error && <div style={styles.error}>{error}</div>}
      {!data?.configured && !loading && <div style={styles.warning}>Product analytics storage is not configured in this environment.</div>}
      <section style={styles.grid}>
        {(data?.steps || []).map((step) => (
          <div key={step.key} style={styles.card}>
            <span style={styles.label}>{step.label}</span>
            <strong style={styles.value}>{loading ? '...' : step.sessions}</strong>
            <span style={styles.meta}>Conversion {pct(step.conversion_rate)} · Drop-off {pct(step.dropoff_rate)}</span>
          </div>
        ))}
      </section>
      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>Daily trend</h2>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Landing</th>
                <th style={styles.th}>Signup</th>
                <th style={styles.th}>Quote</th>
                <th style={styles.th}>Invoice</th>
                <th style={styles.th}>Paid</th>
              </tr>
            </thead>
            <tbody>
              {(data?.daily_trend || []).map((row) => (
                <tr key={row.date}>
                  <td style={styles.td}>{row.date}</td>
                  <td style={styles.td}>{row.landing || 0}</td>
                  <td style={styles.td}>{row.signup || 0}</td>
                  <td style={styles.td}>{row.proposal || 0}</td>
                  <td style={styles.td}>{row.invoice || 0}</td>
                  <td style={styles.td}>{row.paid || 0}</td>
                </tr>
              ))}
              {!loading && !data?.daily_trend?.length && (
                <tr><td style={styles.empty} colSpan={6}>No product funnel events yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)', padding: '34px 24px 80px' },
  nav: { maxWidth: '1180px', margin: '0 auto 34px', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center' },
  back: { display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 800 },
  actions: { display: 'flex', gap: '10px' },
  select: { minHeight: '36px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-main)', padding: '0 10px', fontWeight: 800 },
  button: { display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '36px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--btn-secondary-bg)', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer' },
  header: { maxWidth: '1180px', margin: '0 auto 24px' },
  kicker: { margin: '0 0 8px', color: 'var(--accent-text)', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.08em' },
  title: { margin: 0, fontSize: 'clamp(2rem, 5vw, 3.4rem)', letterSpacing: '-0.04em' },
  copy: { color: 'var(--text-muted)' },
  error: { maxWidth: '1180px', margin: '0 auto 16px', padding: '14px', border: '1px solid var(--error, #ef4444)', borderRadius: '8px' },
  warning: { maxWidth: '1180px', margin: '0 auto 16px', padding: '14px', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-muted)' },
  grid: { maxWidth: '1180px', margin: '0 auto 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' },
  card: { border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', padding: '18px' },
  label: { color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 800 },
  value: { display: 'block', fontSize: '2rem', marginTop: '6px' },
  meta: { color: 'var(--text-soft)', fontSize: '0.76rem' },
  panel: { maxWidth: '1180px', margin: '0 auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', padding: '18px' },
  panelTitle: { margin: '0 0 14px', fontSize: '1.05rem' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' },
  th: { textAlign: 'left', padding: '10px 12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' },
  td: { padding: '10px 12px', borderBottom: '1px solid var(--border)' },
  empty: { padding: '26px', textAlign: 'center', color: 'var(--text-muted)' },
};
