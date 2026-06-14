'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from './components/ThemeToggle';
import { Button, Card, Section } from './components/UIComponents';

export default function Home() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      alert(`Thank you for subscribing to Freelancer Business OS! We have registered your email: ${email}`);
      setEmail('');
      setSubscribed(false);
    }, 500);
  };

  const faqItems = [
    {
      q: 'How does the freelancer directory help me get discovered?',
      a: 'When you create your public profile, our platform automatically indexes your profile card. Search engines crawl these categories programmatically (e.g. /freelancers/designers), sending high-intent client traffic directly to your profile page.'
    },
    {
      q: 'How do Client Portals secure project communication?',
      a: 'Every proposal or invoice you generate hosts a private, secure workspace accessed via a tokenized link (e.g. /portal/token). Clients can view the agreed project milestones, download files, chat with you, and settle invoices directly.'
    },
    {
      q: 'Can I route my public profile to a custom domain?',
      a: 'Yes! Pro and Agency tier subscribers can easily map their profiles (e.g. /card/username) to their personal domain names with automatic SSL configuration.'
    },
    {
      q: 'Does Freelancer Business OS take a cut of my client payments?',
      a: 'No, never. We charge a flat subscription for our platform features. You connect your own Stripe, PayPal, or LemonSqueezy checkout links directly, meaning you keep 100% of your earnings.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>
      
      {/* Navigation Header */}
      <nav className="navbar" style={{ borderBottom: '1px solid var(--border)', padding: '0 2rem' }}>
        <div className="logo-container">
          <svg style={{ width: '20px', height: '20px', color: 'var(--primary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.5px' }}>Freelancer Business OS</span>
        </div>
        <div className="nav-links">
          <Link href="/freelancers" className="nav-link">Directory</Link>
          <Link href="/blog" className="nav-link">Blog</Link>
          <Link href="/pricing" className="nav-link">Pricing</Link>
          <Button href="/dashboard" variant="secondary" size="sm" style={{ fontWeight: 600 }}>
            Sign In
          </Button>
          <Button href="/dashboard?action=create-profile" variant="primary" size="sm" style={{ fontWeight: 600 }}>
            Create Free Profile
          </Button>
          <ThemeToggle />
        </div>
      </nav>

      {/* 1. Linear/Arc Style Dark Hero Section */}
      <header style={{ 
        padding: '120px 24px 100px 24px', 
        backgroundColor: '#030303', 
        color: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        {/* Soft breathing ambient background gradients */}
        <div style={{ position: 'absolute', top: '-10%', left: '-15%', width: '60%', height: '80%', background: 'radial-gradient(circle at 20% 30%, rgba(249, 115, 22, 0.035) 0%, transparent 60%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 1 }} />
        <div style={{ position: 'absolute', top: '-10%', right: '-15%', width: '60%', height: '80%', background: 'radial-gradient(circle at 80% 30%, rgba(59, 130, 246, 0.035) 0%, transparent 60%)', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 1 }} />
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          {/* Hero Left Info */}
          <div style={{ textAlign: 'left' }} className="animate-fade-in">
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              padding: '4px 12px', 
              borderRadius: '99px', 
              background: 'rgba(99, 102, 241, 0.15)', 
              color: '#a5b4fc', 
              border: '1px solid rgba(99, 102, 241, 0.25)',
              textTransform: 'uppercase', 
              marginBottom: '24px' 
            }}>
              🇺🇸 & 🇨🇦 Freelancer OS standard
            </span>

            <h1 style={{ 
              fontSize: '4.2rem', 
              fontWeight: 900, 
              lineHeight: 1.05, 
              letterSpacing: '-0.04em', 
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #ffffff 30%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: '#ffffff'
            }}>
              The Operating System for Modern Freelancers
            </h1>

            <p style={{ 
              fontSize: '1.15rem', 
              color: '#94a3b8', 
              lineHeight: '1.6', 
              marginBottom: '40px',
              fontWeight: 400
            }}>
              Showcase your premium profile, qualify inbound client briefs, send milestone-based proposals, and collect payments. Freelancer Business OS manages your entire transaction pipeline with 0% commission cuts.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' }}>
              <Button href="/dashboard?action=create-profile" variant="primary" size="lg" style={{ background: '#f8fafc', color: '#030303', border: '1px solid #ffffff' }}>
                Create Free Profile
              </Button>
              <Button href="/card/demo" variant="secondary" size="lg" style={{ color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)' }}>
                View Demo Profile
              </Button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
              Built for independent developers, designers, writers, and consultants.
            </p>
          </div>

          {/* Hero Right Mockup: Freelancer Workspace Mockup */}
          <div className="animate-fade-in" style={{ width: '100%' }}>
            {/* Unified Workspace Mockup Card */}
            <div className="chloe-card hover-glow" style={{ 
              padding: '24px', 
              background: 'rgba(9, 9, 11, 0.4)', 
              border: '1px solid rgba(255,255,255,0.06)', 
              borderRadius: '24px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              position: 'relative'
            }}>
              {/* App UI Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }}></span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>pipeline.workspace</div>
                <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>● Active OS Pipeline</span>
              </div>

              {/* Flow Timeline container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '24px' }}>
                {/* Timeline vertical connector */}
                <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '6px', width: '2px', background: 'linear-gradient(180deg, var(--accent) 0%, var(--primary) 50%, var(--success) 100%)', opacity: 0.4 }} />

                {/* Step 1: Lead Received */}
                <div style={{ 
                  position: 'relative',
                  padding: '14px 16px', 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  border: '1px solid rgba(255, 255, 255, 0.04)', 
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ position: 'absolute', left: '-22px', top: '18px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }}></span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>📩 Lead Received</span>
                    <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Qualified Inbound</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#f8fafc' }}>Bruce Wayne (Wayne Enterprises)</div>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>&ldquo;Need Figma UI layouts for our security portal.&rdquo;</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px' }}>
                    <span>Budget Target: <strong>$5,000</strong></span>
                    <span style={{ color: 'var(--success)' }}>Score: 94/100</span>
                  </div>
                </div>

                {/* Step 2: Quote Sent */}
                <div style={{ 
                  position: 'relative',
                  padding: '14px 16px', 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  border: '1px solid rgba(255, 255, 255, 0.04)', 
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ position: 'absolute', left: '-22px', top: '18px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }}></span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>⚡ Quote Sent</span>
                    <span style={{ color: 'var(--success)', fontSize: '0.7rem', fontWeight: 600 }}>Accepted Proposal</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Milestone 1: UX Wireframing</span>
                      <strong style={{ color: '#f8fafc' }}>$1,500</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• Milestone 2: Next.js Handoff</span>
                      <strong style={{ color: '#f8fafc' }}>$3,500</strong>
                    </div>
                  </div>
                </div>

                {/* Step 3: Invoice Delivered */}
                <div style={{ 
                  position: 'relative',
                  padding: '14px 16px', 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  border: '1px solid rgba(255, 255, 255, 0.04)', 
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ position: 'absolute', left: '-22px', top: '18px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)', boxShadow: '0 0 8px var(--warning)' }}></span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>📄 Invoice Delivered</span>
                    <span style={{ color: '#fbbf24', fontSize: '0.7rem', fontWeight: 600 }}>Opened Portal</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Milestone #1 Balance Due:</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>$1,500.00 USD</div>
                    </div>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.15)' }}>Pending Clearance</span>
                  </div>
                </div>

                {/* Step 4: Payment Received */}
                <div style={{ 
                  position: 'relative',
                  padding: '14px 16px', 
                  background: 'rgba(16, 185, 129, 0.02)', 
                  border: '1px solid rgba(16, 185, 129, 0.15)', 
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ position: 'absolute', left: '-22px', top: '18px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }}></span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>💰 Payment Received</span>
                    <span style={{ color: 'var(--success)', fontSize: '0.7rem', fontWeight: 600 }}>✓ Settled (0% Fees)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                      Stripe transaction of <strong>$1,500.00</strong> cleared successfully to business ledger.
                    </div>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>✓</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. How It Works Section */}
      <Section id="how-it-works" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '60px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HOW IT WORKS</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.5px' }}>Simple, Structured Client Workflows</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '1.05rem', maxWidth: '560px', margin: '12px auto 0' }}>
            Freelancer Business OS streamlines your pipeline so you can focus on delivering high-quality results.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', textAlign: 'left' }}>
          <Card style={{ padding: '32px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '12px' }}>STEP 01</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>Create Profile</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Setup your public profile page in seconds. Showcase your skills, standard rates, availability tags, and direct booking links.
            </p>
          </Card>

          <Card style={{ padding: '32px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '12px' }}>STEP 02</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>Receive Leads</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Prospects submit detailed inquiry briefs, budget caps, and timeline ranges directly to your secure inbox.
            </p>
          </Card>

          <Card style={{ padding: '32px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--success)', marginBottom: '12px' }}>STEP 03</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>Get Paid</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Send milestone-based proposals and convert them to secure client invoices. Get paid directly with 0% platform transaction fees.
            </p>
          </Card>
        </div>
      </Section>

      {/* 3. Features Bento Grid Section */}
      <Section style={{ backgroundColor: 'var(--bg-surface)' }} containerStyle={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '60px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FEATURES</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.5px' }}>Run a High-Trust Professional Business</h2>
        </div>

        {/* Bento Grid Layout */}
        <div className="bento-grid" style={{ textAlign: 'left' }}>
          {/* Card 1: Lead Capture (Large) */}
          <div className="bento-item bento-item-large" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.25rem' }}>📩</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'var(--accent-glow)', color: 'var(--accent)' }}>CRM INTAKE</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.3px' }}>Qualified Lead Capture</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                Qualify client requirements dynamically. Automatically qualifies budgets and project outlines before booking scoping calls.
              </p>
            </div>
            {/* Visual list mock */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.65rem' }}>B</div>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Bruce Wayne (Wayne Corp)</span>
                </div>
                <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.08)', color: 'var(--success)', fontWeight: 700 }}>$5,000 • Qualified</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                &ldquo;Need Figma UI layouts for our security portal. Project timeline: 3 weeks.&rdquo;
              </p>
            </div>
          </div>

          {/* Card 2: Quote Builder (Single) */}
          <div className="bento-item" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.25rem' }}>⚡</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'var(--primary-glow)', color: 'var(--primary)' }}>ESTIMATOR</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.3px' }}>Milestone Quote Builder</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                Break down project scopes into sequential sprints with clear deliverables and pricing goals.
              </p>
            </div>
            {/* Visual mock */}
            <div style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Milestone #1: Wireframes</span>
                <strong style={{ color: 'var(--text-main)' }}>$1,500</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Milestone #2: Next.js Frontend</span>
                <strong style={{ color: 'var(--text-main)' }}>$3,500</strong>
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                <span>Total Scope</span>
                <span>$5,000</span>
              </div>
            </div>
          </div>

          {/* Card 3: Invoice Generator (Single) */}
          <div className="bento-item" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.25rem' }}>📄</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'var(--success-glow)', color: 'var(--success)' }}>BILLING</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.3px' }}>Invoice Generator</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                Trigger milestone-based client invoices, set automated late payment terms, and link directly to processors.
              </p>
            </div>
            {/* Visual mock */}
            <div style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <span style={{ fontWeight: 600 }}>WAYNE-901</span>
                <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', background: 'var(--success-glow)', color: 'var(--success)', fontWeight: 700 }}>✓ Settled</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                $1,500.00
              </div>
            </div>
          </div>

          {/* Card 4: Client Portal (Large) */}
          <div className="bento-item bento-item-large" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.25rem' }}>🔒</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'var(--primary-glow)', color: 'var(--primary)' }}>CLIENT HUB</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.3px' }}>Secure Client Workspaces</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                Centralized client spaces. A private, tokenized portal where clients sign off proposals, download project files, and write feedback.
              </p>
            </div>
            {/* Visual list mock */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                <span style={{ fontWeight: 700 }}>Project Deliverables Handoff</span>
                <span style={{ color: 'var(--text-muted)' }}>2 files shared</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  📄 design_tokens.figma
                </span>
                <span style={{ fontSize: '0.7rem', padding: '6px 12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  📦 nextjs_source.zip
                </span>
              </div>
            </div>
          </div>

          {/* Card 5: Public Profile (Single) */}
          <div className="bento-item" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.25rem' }}>🌐</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'var(--accent-glow)', color: 'var(--accent)' }}>STOREFRONT</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.3px' }}>Digital Card Profile</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                Publish a premium personal storefront with custom domains, optimized for indexing on Google and SEO discovery.
              </p>
            </div>
            {/* Visual mini card */}
            <div style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>AM</div>
              <div>
                <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'block' }}>Alex Morgan</strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--success)' }}>● Available for contract</span>
              </div>
            </div>
          </div>

          {/* Card 6: Analytics (Single) */}
          <div className="bento-item" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.25rem' }}>📈</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'var(--success-glow)', color: 'var(--success)' }}>METRICS</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.3px' }}>Pipeline CRM Metrics</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                Track performance metrics representing your total business volume, profile view volumes, and quote close rates.
              </p>
            </div>
            {/* Visual metrics data */}
            <div style={{ background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>REVENUE</span>
                <strong style={{ fontSize: '1.15rem', color: 'var(--text-main)' }}>$12,840</strong>
              </div>
              <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--success-glow)', color: 'var(--success)', fontWeight: 700 }}>+24.8%</span>
            </div>
          </div>
        </div>
      </Section>

      {/* 4. Real Product Dashboard Preview Section */}
      <Section style={{ borderTop: '1px solid var(--border)' }} containerStyle={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '40px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>PRODUCT PREVIEW</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.5px' }}>Visual Pipeline CRM Overview</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '12px', fontSize: '1.05rem', maxWidth: '560px', margin: '12px auto 0' }}>
            A flat, Stripe-style dashboard tracking real freelancer business statistics.
          </p>
        </div>

        {/* Dashboard preview card mockup */}
        <div style={{ 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--border)', 
          borderRadius: '24px', 
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'left',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Browser Window Header Chrome */}
          <div style={{ 
            background: 'var(--bg-card)', 
            borderBottom: '1px solid var(--border)', 
            padding: '12px 20px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fbbf24' }}></span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
            </div>
            <div style={{ 
              background: 'var(--btn-secondary-bg)', 
              border: '1px solid var(--border)', 
              borderRadius: '6px', 
              padding: '4px 24px', 
              fontSize: '0.65rem', 
              color: 'var(--text-muted)', 
              fontFamily: 'monospace',
              width: '320px',
              textAlign: 'center'
            }}>
              app.freelancerbusinessos.com/dashboard
            </div>
            <div style={{ width: '40px' }}></div>
          </div>

          <div style={{ display: 'flex', flex: 1 }}>
            {/* Sidebar Navigation */}
            <div style={{ 
              width: '180px', 
              borderRight: '1px solid var(--border)', 
              background: 'var(--bg-card)', 
              padding: '20px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              {[
                { icon: '📊', label: 'Overview', active: true },
                { icon: '👥', label: 'Leads CRM' },
                { icon: '📄', label: 'Quotes' },
                { icon: '💳', label: 'Invoices' },
                { icon: '📈', label: 'Analytics' },
                { icon: '⚙️', label: 'Settings' }
              ].map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px 12px', 
                  borderRadius: '8px', 
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: item.active ? 'var(--btn-secondary-bg)' : 'transparent',
                  color: item.active ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Main Area */}
            <div style={{ flex: 1, padding: '24px', background: 'var(--bg-page)' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>Business Overview</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Metrics updated real-time</p>
                </div>
                <div style={{ fontSize: '0.75rem', padding: '6px 12px', borderRadius: '6px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  📅 Last 30 Days
                </div>
              </div>

              {/* Top Row: KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {[
                  { label: 'Revenue', val: '$12,840' },
                  { label: 'Leads', val: '42' },
                  { label: 'Quotes', val: '18' },
                  { label: 'Invoices', val: '14' },
                  { label: 'Profile Views', val: '1,240' }
                ].map((kpi, idx) => (
                  <div key={idx} style={{ padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{kpi.val}</div>
                  </div>
                ))}
              </div>

              {/* Bottom Row: Recent checklist items */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px' }}>
                {/* Recent Leads list */}
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--bg-card)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.8rem', marginBottom: '12px', color: 'var(--text-main)' }}>Recent Qualified Leads</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { name: 'Bruce Wayne', budget: '$5,000', msg: 'Need Figma source UI audits' },
                      { name: 'Tony Stark', budget: '$2,500', msg: 'React developer integration consultation' }
                    ].map((lead, idx) => (
                      <div key={idx} style={{ padding: '10px 12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>{lead.name}</strong>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '1px' }}>{lead.msg}</div>
                        </div>
                        <strong style={{ color: 'var(--success-text)' }}>{lead.budget}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming task checklist */}
                <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--bg-card)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.8rem', marginBottom: '12px', color: 'var(--text-main)' }}>Upcoming Tasks</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" checked={true} readOnly style={{ accentColor: 'var(--primary)' }} />
                      <span style={{ textDecoration: 'line-through' }}>Draft security portal wireframes</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" checked={false} readOnly style={{ accentColor: 'var(--primary)' }} />
                      <span>Send milestone invoice to Stark Corp</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" checked={false} readOnly style={{ accentColor: 'var(--primary)' }} />
                      <span>Submit final handover zip on Client Portal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 5. Customer Testimonials Section */}
      <Section style={{ borderTop: '1px solid var(--border)' }} containerStyle={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '60px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TESTIMONIALS</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.5px' }}>Trusted by Independent Leaders</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', textAlign: 'left' }}>
          <Card style={{ padding: '32px' }}>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '24px', lineHeight: '1.6', fontStyle: 'italic' }}>
              &ldquo;Freelancer Business OS has completely transformed how I handle clients in Toronto. The structured intake form weeds out low-budget leads immediately.&rdquo;
            </p>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'block' }}>Sarah Jenkins</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lead UI Designer • Toronto, ON</span>
            </div>
          </Card>

          <Card style={{ padding: '32px' }}>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: '24px', lineHeight: '1.6', fontStyle: 'italic' }}>
              &ldquo;Using the milestone quote builder makes negotiations seamless. I landed a $15k project because my proposal outline looked completely transparent and professional.&rdquo;
            </p>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'block' }}>Michael Chen</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Full-stack Developer • Austin, TX</span>
            </div>
          </Card>
        </div>
      </Section>

      {/* 6. Waitlist / Newsletter Subscription */}
      <Section style={{ backgroundColor: 'var(--bg-surface)' }} containerStyle={{ textAlign: 'center', maxWidth: '600px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NEWSLETTER & ACCESS</span>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 900, marginTop: '8px', marginBottom: '16px', letterSpacing: '-0.5px' }}>Get Freelance Growth Playbooks</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '32px' }}>
          Subscribe to our weekly newsletter for premium milestone contract templates, pricing strategies, and local inbound referral opportunities.
        </p>

        <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <input 
            type="email" 
            placeholder="Enter your work email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            style={{ padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--text-main)', minWidth: '260px', outline: 'none' }}
          />
          <Button type="submit" variant="primary" style={{ padding: '10px 24px', fontWeight: 700, borderRadius: '8px' }}>
            Subscribe
          </Button>
        </form>
      </Section>

      {/* 7. FAQ Section */}
      <Section style={{ maxWidth: '800px', margin: '0 auto' }} containerStyle={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '48px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>QUESTIONS</span>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.5px' }}>Frequently Asked Questions</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          {faqItems.map((item, idx) => (
            <div 
              key={idx} 
              style={{ 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                background: 'var(--bg-card)', 
                overflow: 'hidden',
                transition: 'var(--transition)'
              }}
            >
              <button
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
                  textAlign: 'left',
                  color: activeFaq === idx ? 'var(--primary)' : 'var(--text-main)',
                  background: 'none'
                }}
              >
                <span>{item.q}</span>
                <span style={{ transform: activeFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                  ▼
                </span>
              </button>
              {activeFaq === idx && (
                <div style={{ padding: '0 24px 20px 24px', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Footer Section */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', backgroundColor: 'var(--bg-surface)' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/refund-policy">Refund Policy</Link>
            <Link href="/contactSupport">Contact Support</Link>
            <Link href="/freelancers">Freelancers Directory</Link>
          </div>
          <p>© {new Date().getFullYear()} Freelancer Business OS. All rights reserved.</p>
          <p style={{ fontSize: '0.75rem', marginTop: '8px', color: 'var(--text-soft)' }}>
            All payment checkouts are processed directly via Stripe, PayPal, or LemonSqueezy. We do not charge transaction commissions.
          </p>
        </div>
      </footer>

    </div>
  );
}
