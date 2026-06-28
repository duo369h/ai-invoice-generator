'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { createBrowserSupabaseClient } from '../../lib/supabase-client';

async function authHeaders() {
  const supabase = createBrowserSupabaseClient();
  const { data } = supabase ? await supabase.auth.getSession() : { data: null };
  return data?.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {};
}

export default function EarlyAccessAdminPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/early-access', {
        cache: 'no-store',
        headers: await authHeaders(),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load waitlist');
      setRows(data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  }, []);

  const exportCsv = async () => {
    setError('');
    try {
      const response = await fetch('/api/early-access?format=csv', {
        cache: 'no-store',
        headers: await authHeaders(),
      });
      if (!response.ok) throw new Error('CSV export failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'corvioz-early-access.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'CSV export failed');
    }
  };

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  return (
    <main style={styles.page}>
      <nav style={styles.nav}>
        <Link href="/dashboard" style={styles.back}><ArrowLeft size={16} /> Dashboard</Link>
        <div style={styles.actions}>
          <button type="button" onClick={exportCsv} style={styles.button}><Download size={15} /> Export CSV</button>
          <button type="button" onClick={loadRows} disabled={loading} style={styles.button}><RefreshCw size={15} /> Refresh</button>
        </div>
      </nav>
      <header style={styles.header}>
        <p style={styles.kicker}>Internal</p>
        <h1 style={styles.title}>Early Access Waitlist</h1>
        <p style={styles.copy}>Admin-only table for first-100-user qualification and CSV export.</p>
      </header>
      {error && <div style={styles.error}>{error}</div>}
      <section style={styles.panel}>
        <div style={styles.panelHeader}>
          <strong>{loading ? 'Loading...' : `${rows.length} members`}</strong>
        </div>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Country</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Why</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td style={styles.td}>{row.name}</td>
                  <td style={styles.td}>{row.email}</td>
                  <td style={styles.td}>{row.country}</td>
                  <td style={styles.td}>{row.role}</td>
                  <td style={{ ...styles.td, maxWidth: '360px' }}>{row.reason}</td>
                  <td style={styles.td}>{row.status}</td>
                  <td style={styles.td}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : ''}</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td style={styles.empty} colSpan={7}>No early-access signups yet.</td></tr>
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
  actions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  button: { display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '36px', padding: '0 12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--btn-secondary-bg)', color: 'var(--text-main)', fontWeight: 800, cursor: 'pointer' },
  header: { maxWidth: '1180px', margin: '0 auto 24px' },
  kicker: { margin: '0 0 8px', color: 'var(--accent-text)', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.08em' },
  title: { margin: 0, fontSize: 'clamp(2rem, 5vw, 3.4rem)', letterSpacing: '-0.04em' },
  copy: { color: 'var(--text-muted)' },
  error: { maxWidth: '1180px', margin: '0 auto 16px', padding: '14px', border: '1px solid var(--error, #ef4444)', borderRadius: '8px' },
  panel: { maxWidth: '1180px', margin: '0 auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg-card)', overflow: 'hidden' },
  panelHeader: { padding: '16px 18px', borderBottom: '1px solid var(--border)' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' },
  th: { textAlign: 'left', padding: '12px 14px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' },
  td: { padding: '12px 14px', borderBottom: '1px solid var(--border)', verticalAlign: 'top' },
  empty: { padding: '28px', textAlign: 'center', color: 'var(--text-muted)' },
};
