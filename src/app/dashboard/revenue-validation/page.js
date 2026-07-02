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

function currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function Metric({ label, value, detail }) {
  return (
    <div style={styles.card}>
      <span style={styles.label}>{label}</span>
      <strong style={styles.value}>{value}</strong>
      {detail && <span style={styles.meta}>{detail}</span>}
    </div>
  );
}

function BucketTable({ title, rows }) {
  return (
    <section style={styles.panel}>
      <h2 style={styles.panelTitle}>{title}</h2>
      <table style={styles.table}>
        <tbody>
          {Object.entries(rows || {}).map(([key, value]) => (
            <tr key={key}>
              <td style={styles.td}>{key}</td>
              <td style={{ ...styles.td, textAlign: 'right', fontWeight: 900 }}>{currency(value)}</td>
            </tr>
          ))}
          {!Object.keys(rows || {}).length && (
            <tr><td style={styles.empty}>No data yet.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

export default function RevenueValidationPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/product/revenue-validation?days=${days}`, {
        cache: 'no-store',
        headers: await authHeaders(),
      });
      const next = await response.json();
      if (!response.ok) throw new Error(next.error || 'Failed to load workflow validation');
      setData(next);
    } catch (err) {
      setError(err.message || 'Failed to load workflow validation');
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
        <p style={styles.kicker}>Internal Validation</p>
        <h1 style={styles.title}>Workflow Validation</h1>
        <p style={styles.copy}>Product validation metrics for proposal acceptance, invoice document completion, and workflow mix.</p>
      </header>

      {error && <div style={styles.error}>{error}</div>}
      {!data?.configured && !loading && <div style={styles.warning}>Workflow validation data is not configured in this environment.</div>}

      <section style={styles.grid}>
        <Metric label="Proposal Acceptance Rate" value={loading ? '...' : pct(data?.metrics?.proposal_acceptance_rate)} detail={`${data?.counts?.accepted_quotes || 0} accepted`} />
        <Metric label="Invoice Document Completion Rate" value={loading ? '...' : pct(data?.metrics?.invoice_payment_rate)} detail={`${data?.counts?.paid_invoices || 0} completed`} />
        <Metric label="Average Document Total" value={loading ? '...' : currency(data?.metrics?.average_revenue)} detail="completed invoice documents" />
      </section>

      <section style={styles.bucketGrid}>
        <BucketTable title="Document Total by Country" rows={data?.revenue_by_country} />
        <BucketTable title="Document Total by Plan" rows={data?.revenue_by_plan} />
        <BucketTable title="Document Total by Client Type" rows={data?.revenue_by_client_type} />
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
  grid: { maxWidth: '1180px', margin: '0 auto 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' },
  card: { border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', padding: '18px' },
  label: { color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 800 },
  value: { display: 'block', fontSize: '2rem', marginTop: '6px' },
  meta: { color: 'var(--text-soft)', fontSize: '0.76rem' },
  bucketGrid: { maxWidth: '1180px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' },
  panel: { border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', padding: '18px' },
  panelTitle: { margin: '0 0 14px', fontSize: '1.05rem' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' },
  td: { padding: '10px 0', borderBottom: '1px solid var(--border)' },
  empty: { padding: '18px 0', color: 'var(--text-muted)' },
};
