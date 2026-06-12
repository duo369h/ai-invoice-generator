import Link from 'next/link';
import { getSupportEmail } from '../lib/config';

export const metadata = {
  title: 'Pricing — InvoiceAI',
  description:
    'Simple, transparent pricing for InvoiceAI. Start free, or upgrade to Pro for unlimited AI-powered invoicing. Pay via PayPal.',
};

const CHECK_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    style={{ color: '#10b981', flexShrink: 0 }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CROSS_ICON = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    style={{ color: '#475569', flexShrink: 0 }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export default function PricingPage() {
  const supportEmail = getSupportEmail();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <header className="navbar">
        <div className="logo-container">
          <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <Link href="/">InvoiceAI</Link>
        </div>
        <div className="nav-links">
          <Link href="/#features" className="nav-link">Features</Link>
          <Link href="/pricing" className="nav-link" style={{ color: 'var(--text-main)', fontWeight: 700 }}>Pricing</Link>
          <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '80px 24px 60px' }}>
        <div className="animate-fade-in" style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
          <span className="badge" style={{ marginBottom: '20px' }}>Simple Pricing</span>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 800,
            letterSpacing: '-1.5px',
            lineHeight: 1.1,
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Start free. Upgrade when you&apos;re ready.
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '560px', margin: '0 auto 60px' }}>
            InvoiceAI&apos;s free plan covers the basics with no credit card needed. Pro unlocks
            higher usage for regular invoicing work — currently paid securely via PayPal and
            activated manually during beta.
          </p>

          {/* ── PLAN CARDS ─────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '28px',
            textAlign: 'left',
          }}>

            {/* FREE */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '32px' }}>
              <div>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Free Starter
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-2px' }}>$0</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ forever</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>
                  Great for trying out the tool.
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
                  {[
                    ['Up to 5 invoices per month', true],
                    ['3 AI auto-fills per month', true],
                    ['PDF download', true],
                    ['Multi-currency support', true],
                    ['Unlimited invoices', false],
                    ['Unlimited AI auto-fills', false],
                    ['Priority support', false],
                  ].map(([label, active]) => (
                    <li key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: active ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      {active ? CHECK_ICON : CROSS_ICON}
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/dashboard" className="btn btn-secondary" style={{ textAlign: 'center', width: '100%' }}>
                Get Started Free
              </Link>
            </div>

            {/* PRO */}
            <div className="card" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '32px',
              borderColor: 'var(--primary)',
              boxShadow: '0 0 0 1px var(--primary), 0 0 40px rgba(99,102,241,0.2)',
            }}>
              <div>
                {/* POPULAR badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>
                    Professional
                  </p>
                  <span className="badge" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: '#fff', fontSize: '0.7rem' }}>
                    Most Popular
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-2px' }}>$9</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ month</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '32px' }}>
                  For freelancers who invoice regularly.
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '36px' }}>
                  {[
                    'Unlimited invoices & receipts',
                    '100 AI auto-fills per month',
                    'PDF download',
                    'Multi-currency support',
                    'Custom branding & logo uploads',
                    'Priority email support',
                  ].map((label) => (
                    <li key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {CHECK_ICON}
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* PayPal CTA */}
              <Link
                href="/payment-instructions"
                id="pricing-paypal-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '0.9rem 1.5rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  background: '#FFC439',
                  color: '#003087',
                  boxShadow: '0 4px 14px rgba(255,196,57,0.35)',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* PayPal wordmark SVG */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.554 6.227C19.738 5.118 19.554 4.356 18.972 3.683C18.33 2.947 17.118 2.625 15.572 2.625H10.557C10.194 2.625 9.886 2.898 9.833 3.258L7.727 16.618C7.689 16.879 7.894 17.112 8.158 17.112H11.26L11.076 18.25C11.044 18.479 11.22 18.686 11.452 18.686H14.007C14.325 18.686 14.594 18.447 14.64 18.133L14.66 18.02L15.16 14.856L15.186 14.714C15.232 14.4 15.5 14.161 15.819 14.161H16.209C18.67 14.161 20.597 13.148 21.148 10.255C21.376 9.028 21.259 8.005 20.648 7.289C20.466 7.08 20.025 6.641 19.554 6.227Z" fill="#003087"/>
                  <path d="M9.194 6.58C9.247 6.22 9.556 5.947 9.919 5.947H14.79C15.364 5.947 15.9 5.985 16.388 6.066C16.53 6.09 16.668 6.117 16.803 6.149C16.938 6.181 17.069 6.218 17.196 6.26C17.258 6.281 17.319 6.303 17.379 6.326C17.614 6.42 17.83 6.531 18.025 6.661C18.252 5.117 18.023 4.07 17.173 3.104C16.241 2.039 14.616 1.625 12.535 1.625H6.519C6.156 1.625 5.847 1.898 5.793 2.259L3.402 17.264C3.357 17.556 3.585 17.82 3.879 17.82H7.412L8.294 12.218L9.194 6.58Z" fill="#003087"/>
                </svg>
                Pay with PayPal
              </Link>
            </div>

          </div>

          {/* ── FAQ / NOTE ─────────────────────────────────────────── */}
          <div style={{ marginTop: '60px', padding: '32px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', textAlign: 'left', maxWidth: '600px', margin: '60px auto 0' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '1rem' }}>How does Pro billing work?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.7' }}>
              Pro is currently activated manually while automatic card billing is being prepared.
              After you send your PayPal payment, our team will verify the transaction and upgrade
              your access — usually within a few hours on business days.
              <br /><br />
              Have a question before paying?{' '}
              <a href={`mailto:${supportEmail}`} style={{ color: 'var(--primary)' }}>
                {supportEmail}
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/refund-policy">Refund Policy</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/pricing" style={{ color: 'var(--primary)' }}>Pricing</Link>
        </div>
        <p>© 2026 InvoiceAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
