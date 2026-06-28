'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import { Button, Logo } from '../components/UIComponents';

export default function ClientPortalEntry() {
  const [portalInput, setPortalInput] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = portalInput.trim();
    if (!value) return;

    try {
      const url = new URL(value);
      window.location.href = url.pathname + url.search;
    } catch {
      window.location.href = value.startsWith('doc/')
        ? `/portal/${value}`
        : `/portal/${value}`;
    }
  };

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>
      <nav className="navbar">
        <Logo />
        <div className="nav-links">
          <Link href="/#features" className="nav-link">Features</Link>
          <Link href="/pricing" className="nav-link">Pricing</Link>
          <Button href="/dashboard" variant="secondary" size="sm">Freelancer Sign In</Button>
          <ThemeToggle />
        </div>
      </nav>

      <section style={{ maxWidth: '960px', margin: '0 auto', padding: '96px 24px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(300px, 0.9fr)', gap: '40px', alignItems: 'center' }}>
          <div>
            <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '18px' }}>Client Portal</h1>
            <p className="section-lede" style={{ margin: 0, maxWidth: '620px' }}>
              View quotes, view invoices, download PDFs, and check payment status from a secure Corvioz link shared by your freelancer.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="input-label">Portal link or token</label>
              <input
                className="form-input"
                type="text"
                value={portalInput}
                onChange={(event) => setPortalInput(event.target.value)}
                placeholder="Paste your Corvioz portal link"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Open Portal</button>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>
              Need access? Ask your freelancer to send a quote or invoice portal link.
            </p>
          </form>
        </div>

        <div className="proof-grid" style={{ marginTop: '56px' }}>
          {['View quotes', 'View invoices', 'Download PDF', 'Check payment status'].map((item) => (
            <div key={item} className="card proof-card">
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
