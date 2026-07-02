'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { blogPosts } from '../lib/blog-data';
import PublicHeader from '../components/PublicHeader';
import SharedFooter from '../components/SharedFooter';

export default function BlogIndex() {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Freelancing', 'Pricing', 'Invoices'];

  const filteredPosts = activeCategory === 'All' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === activeCategory);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
      
      <PublicHeader
        route="/blog"
        surfaceId="blog-public-header"
        logoSize={22}
        navLinks={[
          { label: 'Documents', href: '/invoice-generator' },
          { label: 'Quotes', href: '/quote-generator' },
          { label: 'Resources', href: '/blog', active: true },
          { label: 'Pricing', href: '/pricing' },
          { label: 'Security', href: '/security' },
        ]}
        primaryAction={null}
      />

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
            Guides, blueprints, and workflow templates designed to help independent designers, engineers, and marketers organize client work.
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

      <SharedFooter />

    </div>
  );
}
