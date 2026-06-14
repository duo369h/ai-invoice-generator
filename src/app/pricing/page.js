'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import { Button, PricingCard } from '../components/UIComponents';

export default function PricingPage() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [isAnnual, setIsAnnual] = useState(false);

  const pricingFaq = [
    {
      q: 'How does manual Pro activation work during the beta?',
      a: 'We are currently accepting secure PayPal transfers to verify beta members. After you send your transfer, our team matches the transaction email and updates your account plan level, typically within 2 hours.'
    },
    {
      q: 'Can I cancel or change my plan level later?',
      a: 'Yes. You can cancel your subscription or change tiers at any time inside your dashboard Billing settings panel. Changes will apply immediately.'
    },
    {
      q: 'Are there any hidden transaction or payment fees?',
      a: 'No. You can add your Stripe, PayPal, or LemonSqueezy payment link directly to your invoices. We charge 0% overhead so you keep 100% of your earnings.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* Nav bar */}
      <nav className="navbar" style={{ borderBottom: '1px solid var(--border)', padding: '0 2rem' }}>
        <div className="logo-container">
          <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="9" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <Link href="/">Freelancer Business OS</Link>
        </div>
        <div className="nav-links">
          <Link href="/freelancers" className="nav-link">Directory</Link>
          <Link href="/blog" className="nav-link">Blog</Link>
          <Link href="/pricing" className="nav-link" style={{ fontWeight: 700 }}>Pricing</Link>
          <Button href="/dashboard" variant="secondary" size="sm">Dashboard</Button>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '80px 24px' }}>
        
        {/* Hero Header */}
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="badge" style={{ marginBottom: '16px', fontSize: '0.75rem' }}>
            TRANSPARENT TIER PACKAGES
          </span>
          <h1 className="glow-gradient-text" style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '16px', background: 'linear-gradient(135deg, var(--text-main) 30%, var(--text-muted) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Simple, predictable pricing.
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto' }}>
            Get started for free or unlock the full power of a dedicated independent business system.
          </p>
        </header>

        {/* Annual Billing Toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginBottom: '48px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: !isAnnual ? 'var(--text-main)' : 'var(--text-muted)' }}>Billed Monthly</span>
          <button 
            type="button" 
            onClick={() => setIsAnnual(!isAnnual)}
            style={{ 
              width: '50px', 
              height: '26px', 
              borderRadius: '99px', 
              background: 'var(--primary)', 
              position: 'relative', 
              padding: 0, 
              cursor: 'pointer',
              border: 'none',
              outline: 'none',
              transition: 'var(--transition)'
            }}
          >
            <div style={{ 
              width: '20px', 
              height: '20px', 
              borderRadius: '50%', 
              background: '#ffffff', 
              position: 'absolute', 
              top: '3px', 
              left: isAnnual ? '27px' : '3px',
              transition: 'var(--transition)'
            }} />
          </button>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: isAnnual ? 'var(--text-main)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            Billed Annually
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)', borderRadius: '12px', border: '1px solid var(--border)' }}>Save 20%</span>
          </span>
        </div>

        {/* 3 Tier Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px', marginBottom: '80px' }}>
          
          {/* FREE */}
          <PricingCard
            title="Free Starter"
            price="$0"
            period="/ forever"
            ctaLabel="Get Started Free"
            ctaHref="/dashboard?action=create-profile"
            ctaVariant="secondary"
            features={[
              '1 Public Card Profile',
              'Up to 5 Leads CRM',
              'Up to 5 Quotes & Proposals',
              'Up to 5 Invoices',
              'Watermarked PDF exports'
            ]}
          />

          {/* PRO (Highlighted) */}
          <PricingCard
            title="Pro Operations"
            price={isAnnual ? '$10' : '$12'}
            period={`/ month ${isAnnual ? '(billed annually)' : ''}`}
            ctaLabel="Upgrade to Pro"
            ctaHref="/payment-instructions"
            ctaVariant="primary"
            popular={true}
            features={[
              'Unlimited Clients & Invoices',
              'Custom Profile Domain Routing',
              'Watermark-free PDF exports',
              'Advanced Leads Pipeline CRM',
              'Real-time timeline logs tracking',
              'SEO Profile index boost'
            ]}
          />

          {/* AGENCY */}
          <PricingCard
            title="Agency OS"
            price={isAnnual ? '$23' : '$29'}
            period={`/ month ${isAnnual ? '(billed annually)' : ''}`}
            ctaLabel="Get Agency OS"
            ctaHref="/payment-instructions?plan=agency"
            ctaVariant="secondary"
            features={[
              'Multi-user & Team accounts',
              'Collaborative Kanban leads board',
              'White-labeled client portals',
              'Client Portal route integrations',
              'Custom SMTP email alerts',
              'Premium Priority SLA support'
            ]}
          />

        </div>

        {/* ROI Box */}
        <section className="card" style={{ 
          padding: '28px 36px', 
          border: '1px solid var(--border)', 
          background: 'linear-gradient(135deg, var(--primary-glow) 0%, var(--accent-glow) 100%)', 
          borderRadius: '12px', 
          textAlign: 'left',
          marginBottom: '80px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h4 style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px', fontSize: '1.05rem' }}>Stop paying transaction cut overheads. Keep 100% of your cash.</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
              Traditional freelancer platforms deduct 5% to 20% on every invoice you clear. With **Freelancer Business OS**, you add your Stripe, PayPal, or LemonSqueezy payment link directly. We charge **0% markup** on your payments. Add your own billing link to keep 100% of your earnings.
            </p>
          </div>
        </section>

        {/* Feature Comparison Matrix */}
        <section style={{ marginBottom: '80px', textAlign: 'left' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '32px', letterSpacing: '-0.5px', textAlign: 'center' }}>
            Plan Feature Comparison
          </h2>
          
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-card)' }}>
            <table className="comparison-table">
              <thead>
                <tr style={{ color: 'var(--text-main)', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ width: '40%' }}>Core Capabilities</th>
                  <th style={{ width: '20%' }}>Free Starter</th>
                  <th style={{ width: '20%' }}>Pro Operations</th>
                  <th style={{ width: '20%' }}>Agency OS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="comparison-feature-name">Monthly Invoice Volume</td>
                  <td>Up to 5</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>Unlimited</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>Unlimited</td>
                </tr>
                <tr>
                  <td className="comparison-feature-name">Proposal Milestone Scopes</td>
                  <td>Up to 5</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>Unlimited</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>Unlimited</td>
                </tr>
                <tr>
                  <td className="comparison-feature-name">Watermark-free PDF Exports</td>
                  <td>❌ No</td>
                  <td style={{ color: 'var(--success)' }}>✓ Yes</td>
                  <td style={{ color: 'var(--success)' }}>✓ Yes</td>
                </tr>
                <tr>
                  <td className="comparison-feature-name">Custom Card Profile Domain</td>
                  <td>❌ No</td>
                  <td style={{ color: 'var(--success)' }}>✓ Yes</td>
                  <td style={{ color: 'var(--success)' }}>✓ Yes</td>
                </tr>
                <tr>
                  <td className="comparison-feature-name">CRM leads tracker board</td>
                  <td>Basic</td>
                  <td>Advanced</td>
                  <td>Collaborative</td>
                </tr>
                <tr>
                  <td className="comparison-feature-name">AI Milestone Proposal Scoper</td>
                  <td>❌ No</td>
                  <td style={{ color: 'var(--success)' }}>✓ Yes</td>
                  <td style={{ color: 'var(--success)' }}>✓ Yes</td>
                </tr>
                <tr>
                  <td className="comparison-feature-name">Team Accounts Seats</td>
                  <td>1 Seat</td>
                  <td>1 Seat</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>Unlimited</td>
                </tr>
                <tr>
                  <td className="comparison-feature-name">Support Tier</td>
                  <td>Standard Email</td>
                  <td>Priority Email</td>
                  <td style={{ color: 'var(--primary)', fontWeight: 600 }}>24/7 SLA Partner</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing FAQs */}
        <section style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 900, marginBottom: '32px', letterSpacing: '-0.5px' }}>
            Pricing Questions
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pricingFaq.map((item, idx) => (
              <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-card)', overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    color: activeFaq === idx ? 'var(--primary)' : 'var(--text-main)'
                  }}
                >
                  <span>{item.q}</span>
                  <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', transform: activeFaq === idx ? 'rotate(45deg)' : 'none', transition: 'var(--transition)' }}>+</span>
                </button>
                
                {activeFaq === idx && (
                  <div style={{ padding: '0 24px 20px 24px', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', backgroundColor: 'var(--bg-surface)' }}>
        <p>© {new Date().getFullYear()} Freelancer Business OS. Transparent transactions, no extra checkout overhead fees.</p>
      </footer>

    </div>
  );
}
