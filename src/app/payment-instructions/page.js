import Link from 'next/link';
import { getSupportEmail } from '../lib/config';
import PublicHeader from '../components/PublicHeader';
import SharedFooter from '../components/SharedFooter';

export const metadata = {
  title: 'Payment Activation — Corvioz Pro',
  description:
    'How Corvioz Pro billing and Paddle checkout activation work.',
};

export default function PaymentInstructionsPage() {
  const supportEmail = getSupportEmail();

  const steps = [
    {
      num: '01',
      title: 'Select Pro',
      body: 'You\'ve selected the Corvioz Pro plan. This unlocks unlimited invoices, AI-assisted quotes, client portals, PDF exports, payment status tracking, and custom branding. See the current price on the Pricing page.',
    },
    {
      num: '02',
      title: 'Continue through Paddle checkout',
      body: (
        <>
          Continue from the Pricing page or contact support if the Paddle checkout link is not available for your account.
          Paddle handles subscription checkout, receipts, taxes, and payment records where enabled.
          Please use the same email address you use for your Corvioz account so access can be matched correctly.
        </>
      ),
    },
    {
      num: '03',
      title: 'Keep your Paddle receipt',
      body: (
        <>
          After completing checkout, keep your Paddle receipt. If access does not update automatically, forward the receipt to{' '}
          <a href={`mailto:${supportEmail}`} style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
            {supportEmail}
          </a>
          {' '}with the subject line{' '}
          <strong style={{ color: 'var(--text-main)' }}>&ldquo;Corvioz Pro Upgrade&rdquo;</strong>.
          Include your name and the email address you use on Corvioz.
        </>
      ),
    },
    {
      num: '04',
      title: 'Billing support fallback',
      body: 'If Paddle checkout or entitlement sync is delayed, our team reviews the Paddle receipt and account email, then updates access or resolves billing questions. We aim to respond within 2 business days.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <PublicHeader route="/payment-instructions" surfaceId="payment-public-header" logoSize={22} />

      {/* MAIN */}
      <main style={{ flex: 1, padding: '80px 24px 60px' }}>
        <div className="animate-fade-in" style={{ maxWidth: '760px', margin: '0 auto' }}>

          {/* Back link */}
          <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '36px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7"/></svg>
            Back to Pricing
          </Link>

          {/* Header */}
          <span className="badge" style={{ marginBottom: '20px' }}>Paddle Billing</span>
          <h1 style={{
            fontSize: '2.6rem',
            fontWeight: 800,
            letterSpacing: '-1.5px',
            lineHeight: 1.15,
            marginBottom: '16px',
          }}>
            How Corvioz Pro Billing Works
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '52px', maxWidth: '620px' }}>
            Corvioz paid subscriptions use Paddle checkout where enabled.
            <strong style={{ color: 'var(--text-main)' }}> Paddle handles payment processing, receipts, tax handling, and billing records</strong>.
            You can also keep using the Free plan and start building your profile immediately.
          </p>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            {steps.map((step, i) => (
              <div
                key={step.num}
                style={{
                  display: 'flex',
                  gap: '28px',
                  paddingBottom: i < steps.length - 1 ? '36px' : '0',
                  position: 'relative',
                }}
              >
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: '22px',
                    top: '52px',
                    bottom: '0',
                    width: '2px',
                    background: 'linear-gradient(to bottom, var(--primary), transparent)',
                    opacity: 0.3,
                  }} />
                )}

                {/* Step number */}
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  color: '#fff',
                  flexShrink: 0,
                  letterSpacing: '0.5px',
                  zIndex: 1,
                }}>
                  {step.num}
                </div>

                {/* Content */}
                <div style={{ paddingTop: '10px' }}>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '10px' }}>{step.title}</h2>
                  <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '0.97rem' }}>
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* SUMMARY CARD */}
          <div className="card" style={{ marginTop: '56px', padding: '32px', borderColor: 'rgba(99, 102, 241, 0.25)', background: 'rgba(99, 102, 241, 0.02)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/></svg>
              Payment Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 40px', fontSize: '0.93rem' }}>
              {[
                ['Plan', 'Corvioz Pro'],
                ['Amount', 'See current pricing at corvioz.com/pricing'],
                ['Payment method', 'Paddle checkout where enabled'],
                ['Activation', 'Automatic where entitlement sync is active; support fallback available'],
                ['Subscription renewal', 'Managed through Paddle where enabled'],
                ['Refund policy', '14-day refund window for eligible paid upgrades'],
                ['Contact', supportEmail],
              ].map(([label, value]) => (
                <div key={label}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</p>
                  <p style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                    {label === 'Contact'
                      ? <a href={`mailto:${value}`} style={{ color: 'var(--primary)' }}>{value}</a>
                      : label === 'Refund policy'
                        ? <Link href="/refund-policy" style={{ color: 'var(--primary)' }}>{value}</Link>
                      : value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* DISCLAIMER */}
          <div style={{ marginTop: '36px', padding: '20px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
            <strong style={{ color: 'var(--text-main)' }}>Note:</strong>{' '}
            Corvioz subscriptions are processed through Paddle where checkout is enabled. Paddle may handle payment details,
            receipts, taxes, refunds, and renewal records as merchant of record. If checkout or entitlement sync is unavailable,
            contact support and include your Corvioz account email plus Paddle receipt details.
          </div>

          {/* CTA */}
          <div style={{ marginTop: '48px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <a
              href="/pricing"
              id="payment-instructions-paddle-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '0.9rem 2rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1rem',
                background: 'var(--primary)',
                color: '#fff',
                boxShadow: 'var(--shadow-md)',
                transition: 'all 0.25s ease',
                textDecoration: 'none',
              }}
            >
              Continue to Pricing
            </a>
            <a
              href={`mailto:${supportEmail}?subject=Corvioz Pro Billing Support&body=Hi, I need help with Corvioz Pro billing or Paddle checkout. My account email is: `}
              className="btn btn-secondary"
              id="payment-instructions-email-btn"
            >
              Contact Billing Support
            </a>
          </div>
        </div>
      </main>

      <SharedFooter />
    </div>
  );
}
