import Link from 'next/link';
import { getSupportEmail } from '../lib/config';

export const metadata = {
  title: 'Payment Activation — Freelancer Business OS Pro',
  description:
    'How to upgrade to Freelancer Business OS Pro via PayPal. Step-by-step payment instructions for manual beta activation.',
};

export default function PaymentInstructionsPage() {
  const supportEmail = getSupportEmail();

  const steps = [
    {
      num: '01',
      title: 'Select Pro Operations',
      body: 'You\'ve selected the Freelancer Business OS Pro Operations plan at $12 / month. This unlocks unlimited clients & invoices, custom profile domains, watermark-free PDF exports, and advanced CRM pipelines.',
    },
    {
      num: '02',
      title: 'Request a PayPal Payment Link',
      body: (
        <>
          Click the PayPal request button below and email us your registered account address.
          Our team will send you a <strong style={{ color: 'var(--text-main)' }}>$12.00 USD</strong> PayPal
          payment request or PayPal invoice. Please include your Freelancer Business OS username or email in the payment
          note so we can match your account.
        </>
      ),
    },
    {
      num: '03',
      title: 'Confirm Payment via Email',
      body: (
        <>
          After completing the checkout transfer, send the confirmation receipt to{' '}
          <a href={`mailto:${supportEmail}`} style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
            {supportEmail}
          </a>
          {' '}with the subject line{' '}
          <strong style={{ color: 'var(--text-main)' }}>&ldquo;Freelancer Business OS Pro Upgrade&rdquo;</strong>.
          Include your name and the email address you use on Freelancer Business OS.
        </>
      ),
    },
    {
      num: '04',
      title: 'Manual Activation',
      body: 'Our team reviews your transaction receipt manually and updates your account level to Pro. This typically happens within 2 hours on business days. We will reply to confirm activation. Automated credit-card payments will be enabled shortly.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* NAV */}
      <header className="navbar">
        <div className="logo-container">
          <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <Link href="/">Freelancer Business OS</Link>
        </div>
        <div className="nav-links">
          <Link href="/freelancers" className="nav-link">Directory</Link>
          <Link href="/pricing" className="nav-link">Pricing</Link>
          <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
        </div>
      </header>

      {/* MAIN */}
      <main style={{ flex: 1, padding: '80px 24px 60px' }}>
        <div className="animate-fade-in" style={{ maxWidth: '760px', margin: '0 auto' }}>

          {/* Back link */}
          <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '36px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7"/></svg>
            Back to Pricing
          </Link>

          {/* Header */}
          <span className="badge" style={{ marginBottom: '20px' }}>Manual Activation — Beta</span>
          <h1 style={{
            fontSize: '2.6rem',
            fontWeight: 800,
            letterSpacing: '-1.5px',
            lineHeight: 1.15,
            marginBottom: '16px',
          }}>
            How to Pay with PayPal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '1.7', marginBottom: '52px', maxWidth: '620px' }}>
            Freelancer Business OS accepts PayPal for cross-border Pro plan payments. Customers request a PayPal payment,
            complete the invoice request, and email the receipt to our support team. Because automated credit card processing is currently in setup,
            Pro access is activated <strong style={{ color: 'var(--text-main)' }}>manually by our team</strong> after verification. The process is fast and usually takes less than 2 hours.
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
                ['Plan', 'Freelancer Business OS Pro'],
                ['Amount', '$12.00 USD / month'],
                ['Payment method', 'PayPal'],
                ['Activation', 'Manual — within 2 hours'],
                ['Subscription renewal', 'Manual renewal required each month'],
                ['Refund policy', 'Refund requests reviewed within 7 days'],
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
          <div style={{ marginTop: '36px', padding: '20px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.7' }}>
            <strong style={{ color: 'var(--text-main)' }}>Note:</strong>{' '}
            Freelancer Business OS Pro is currently in manual-activation beta mode. We do not yet offer automatic
            recurring billing through PayPal. You will need to renew manually each month.
            Automatic subscriptions and instant account upgrades will be available after our
            payment processor approval completes. Your payment is protected by PayPal Buyer Protection where applicable.
          </div>

          {/* CTA */}
          <div style={{ marginTop: '48px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <a
              href={`mailto:${supportEmail}?subject=Freelancer Business OS Pro PayPal Payment Request&body=Hi, I want to upgrade to Freelancer Business OS Pro. Please send me a PayPal payment request for $12 USD. My account email or username is: `}
              id="payment-instructions-paypal-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '0.9rem 2rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '1rem',
                background: '#FFC439',
                color: '#003087',
                boxShadow: '0 4px 14px rgba(255,196,57,0.35)',
                transition: 'all 0.25s ease',
                textDecoration: 'none',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.554 6.227C19.738 5.118 19.554 4.356 18.972 3.683C18.33 2.947 17.118 2.625 15.572 2.625H10.557C10.194 2.625 9.886 2.898 9.833 3.258L7.727 16.618C7.689 16.879 7.894 17.112 8.158 17.112H11.26L11.076 18.25C11.044 18.479 11.22 18.686 11.452 18.686H14.007C14.325 18.686 14.594 18.447 14.64 18.133L14.66 18.02L15.16 14.856L15.186 14.714C15.232 14.4 15.5 14.161 15.819 14.161H16.209C18.67 14.161 20.597 13.148 21.148 10.255C21.376 9.028 21.259 8.005 20.648 7.289C20.466 7.08 20.025 6.641 19.554 6.227Z" fill="#003087"/>
                <path d="M9.194 6.58C9.247 6.22 9.556 5.947 9.919 5.947H14.79C15.364 5.947 15.9 5.985 16.388 6.066C16.53 6.09 16.668 6.117 16.803 6.149C16.938 6.181 17.069 6.218 17.196 6.26C17.258 6.281 17.319 6.303 17.379 6.326C17.614 6.42 17.83 6.531 18.025 6.661C18.252 5.117 18.023 4.07 17.173 3.104C16.241 2.039 14.616 1.625 12.535 1.625H6.519C6.156 1.625 5.847 1.898 5.793 2.259L3.402 17.264C3.357 17.556 3.585 17.82 3.879 17.82H7.412L8.294 12.218L9.194 6.58Z" fill="#003087"/>
              </svg>
              Request PayPal Payment
            </a>
            <a
              href={`mailto:${supportEmail}?subject=Freelancer Business OS Pro Upgrade&body=Hi, I've sent a PayPal payment for Freelancer Business OS Pro. My email is: `}
              className="btn btn-secondary"
              id="payment-instructions-email-btn"
            >
              Email Us After Payment
            </a>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '60px' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/refund-policy">Refund Policy</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/pricing" style={{ color: 'var(--primary)' }}>Pricing</Link>
        </div>
        <p>© 2026 Freelancer Business OS. All rights reserved.</p>
      </footer>
    </div>
  );
}
