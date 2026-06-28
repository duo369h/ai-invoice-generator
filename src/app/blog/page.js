'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import { blogPosts } from '../lib/blog-data';
import { Logo } from '../components/UIComponents';

export default function BlogIndex() {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Freelancing', 'Pricing', 'Invoices'];

  const filteredPosts = activeCategory === 'All' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === activeCategory);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
      
      {/* Navbar Header */}
      <nav className="navbar">
        <Logo size={22} />
        <div className="nav-links">
          <Link href="/invoice-generator" className="nav-link">Invoice Generator</Link>
          <Link href="/quote-generator" className="nav-link">Quote Generator</Link>
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
            Corvioz Blog
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
        <div className="blog-list-container">
          {filteredPosts.map((post) => (
            <article key={post.slug} className="blog-card-group animate-fade-in">
              {/* Category + Meta (date · read time) */}
              <div className="blog-card-meta">
                <span className="blog-card-category">{post.category}</span>
                <span>·</span>
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>

              {/* Title */}
              <h2 className="blog-card-title">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>

              {/* Description */}
              <p className="blog-card-desc">
                {post.description}
              </p>

              {/* Divider (soft) */}
              <hr className="blog-card-divider" />

              {/* Footer row: Author and Read article link */}
              <div className="blog-card-footer group">
                <div className="blog-card-author">
                  <div className="blog-card-avatar">
                    {post.author.charAt(0)}
                  </div>
                  <span className="blog-card-author-name">By {post.author}</span>
                </div>
                
                <Link href={`/blog/${post.slug}`} className="blog-card-cta">
                  Read article <span className="blog-card-cta-arrow">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

      </div>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', backgroundColor: 'var(--bg-surface)' }}>
        <p>© {new Date().getFullYear()} Corvioz. Handcrafted for independent service providers.</p>
      </footer>

    </div>
  );
}
