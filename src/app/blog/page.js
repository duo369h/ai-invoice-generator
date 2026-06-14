'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';

export default function BlogIndex() {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Freelancing', 'Pricing', 'Client Management', 'Invoices', 'Proposals'];

  const blogPosts = [
    {
      slug: 'how-to-price-web-design-projects',
      category: 'Pricing',
      title: 'Value-Based Pricing: Shifting Away From Hourly Rates',
      summary: 'Hourly rates penalize your efficiency and experience. Discover the step-by-step formula to price your web design or development project based on client business impact and outcome values.',
      date: 'June 10, 2026',
      readTime: '6 min read',
      author: 'Sarah Chen'
    },
    {
      slug: 'how-to-get-freelance-clients',
      category: 'Freelancing',
      title: 'Dynamic Client Acquisition: Building Inbound Discovery Loops',
      summary: 'Ditch cold emailing. Learn how indexing your availability inside niche public directories and leveraging programmatic SEO templates creates a steady flow of high-intent search leads.',
      date: 'May 28, 2026',
      readTime: '8 min read',
      author: 'Alex Rivera'
    },
    {
      slug: 'best-freelancer-crm',
      category: 'Client Management',
      title: 'Why Standard Enterprise CRMs Fail Independent Professionals',
      summary: 'Heavy sales pipelines are built for enterprise teams, not solo builders. Inspect why simple kanban pipelines focusing on brief intakes and instant proposal triggers yield higher cash flow velocities.',
      date: 'May 14, 2026',
      readTime: '5 min read',
      author: 'Marcus Todd'
    },
    {
      slug: 'best-invoice-software-for-freelancers',
      category: 'Invoices',
      title: 'The Modern Billing Stack: Milestone Settle vs Hourly Logs',
      summary: 'Hourly billing creates misaligned client incentives. Read why breaking contracts into upfront deposits and tangible milestone targets gets invoices paid faster and eliminates scope creep.',
      date: 'April 22, 2026',
      readTime: '7 min read',
      author: 'Sarah Chen'
    },
    {
      slug: 'freelance-contract-essentials',
      category: 'Proposals',
      title: 'Contract Deliverables: Connecting Asset Handover to Payment Clearance',
      summary: 'Protect your intellectual property. Learn how to draft simple contractor service agreements that secure ownership releases only when outstanding invoices are cleared.',
      date: 'April 05, 2026',
      readTime: '6 min read',
      author: 'Marcus Todd'
    }
  ];

  const filteredPosts = activeCategory === 'All' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === activeCategory);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* Navbar Header */}
      <nav className="navbar" style={{ borderBottom: '1px solid var(--border)', padding: '0 2rem' }}>
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
          <Link href="/blog" className="nav-link" style={{ fontWeight: 700 }}>Blog</Link>
          <Link href="/pricing" className="nav-link">Pricing</Link>
          <Link href="/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Container */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '80px 24px' }}>
        
        {/* Hero Section */}
        <header style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span className="badge" style={{ marginBottom: '16px', fontSize: '0.75rem' }}>
            INSIGHTS & STRATEGIES
          </span>
          <h1 className="glow-gradient-text" style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '16px', background: 'linear-gradient(135deg, var(--text-main) 30%, var(--text-muted) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Freelancer Business OS Blog
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto' }}>
            Guides, blueprints, and workflow templates designed to help independent designers, engineers, and marketers get paid on time.
          </p>
        </header>

        {/* Category Filters Bar */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
              style={{ borderRadius: '20px', padding: '6px 16px', fontWeight: 600 }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Blog Post List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {filteredPosts.map((post, index) => (
            <article 
              key={post.slug} 
              className="card glass-card animate-fade-in" 
              style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{post.category}</span>
                <span>•</span>
                <span>{post.date}</span>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.4px' }}>
                <Link href={`/blog/${post.slug}`} style={{ hoverColor: 'var(--primary)' }}>{post.title}</Link>
              </h2>

              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                {post.summary}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                    {post.author.charAt(0)}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>By {post.author}</span>
                </div>
                
                <Link href={`/blog/${post.slug}`} className="text-gradient-indigo" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Read Article ➔
                </Link>
              </div>
            </article>
          ))}
        </div>

      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', backgroundColor: 'var(--bg-surface)' }}>
        <p>© {new Date().getFullYear()} Freelancer Business OS. Handcrafted for independent service providers.</p>
      </footer>

    </div>
  );
}
