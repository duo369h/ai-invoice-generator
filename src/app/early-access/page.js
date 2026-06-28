'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Logo } from '../components/UIComponents';
import { trackHeroCtaClick, trackSignupStarted } from '../lib/product-analytics';

function readUtm() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search || '');
  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_term: params.get('utm_term') || '',
    utm_content: params.get('utm_content') || '',
  };
}

export default function EarlyAccessPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    country: '',
    role: '',
    reason: '',
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setStatus('');
    trackSignupStarted({ source: 'early_access_form' });

    try {
      const response = await fetch('/api/early-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: 'early_access_page',
          utm: readUtm(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not join early access.');
      setStatus(data.duplicate ? 'You are already on the Early Access list.' : 'You are on the Early Access list.');
      setForm({ name: '', email: '', country: '', role: '', reason: '' });
      trackHeroCtaClick({ source: 'early_access_form_submit', cta_name: 'Join Early Access' });
    } catch (err) {
      setError(err.message || 'Could not join early access.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)' }}>
      <nav className="navbar">
        <Logo />
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          <Button href="/demo" variant="secondary" size="sm">Explore the Demo</Button>
        </div>
      </nav>

      <section className="container" style={{ maxWidth: '760px', padding: '72px 24px 96px' }}>
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <p className="section-kicker">Early Access</p>
          <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(2.4rem, 6vw, 4.8rem)', lineHeight: 1.08, letterSpacing: '-0.035em', fontWeight: 900 }}>
            Join Corvioz Early Access
          </h1>
          <p style={{ margin: '0 auto', maxWidth: '620px', color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Tell us a little about your freelance workflow. We are opening access in small batches.
          </p>
        </div>

        <form onSubmit={submit} className="card" style={{ padding: '28px', display: 'grid', gap: '16px' }}>
          <label style={styles.label}>
            Name
            <input className="feedback-input" value={form.name} onChange={update('name')} required />
          </label>
          <label style={styles.label}>
            Email
            <input className="feedback-input" type="email" value={form.email} onChange={update('email')} required />
          </label>
          <label style={styles.label}>
            Country
            <input className="feedback-input" value={form.country} onChange={update('country')} required />
          </label>
          <label style={styles.label}>
            Role
            <input className="feedback-input" value={form.role} onChange={update('role')} placeholder="Designer, developer, consultant..." required />
          </label>
          <label style={styles.label}>
            Why do you want to use Corvioz?
            <textarea className="feedback-textarea" rows={5} value={form.reason} onChange={update('reason')} required />
          </label>

          {error && <p style={{ margin: 0, color: 'var(--error, #ef4444)', fontWeight: 700 }}>{error}</p>}
          {status && <p style={{ margin: 0, color: 'var(--success, #10b981)', fontWeight: 700 }}>{status}</p>}

          <Button type="submit" variant="primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
            {submitting ? 'Joining...' : 'Join Early Access — Free'}
          </Button>
        </form>
      </section>
    </main>
  );
}

const styles = {
  label: {
    display: 'grid',
    gap: '8px',
    color: 'var(--text-main)',
    fontSize: '0.86rem',
    fontWeight: 800,
  },
};
