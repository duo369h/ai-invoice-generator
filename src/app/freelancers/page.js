'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';

const roles = ['All', 'Developer', 'Designer', 'Writer', 'Consultant', 'Marketer'];

export default function FreelancersDirectory({ defaultRole = 'All' }) {
  const [profiles, setProfiles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (roleParam) {
        // Handle plural/singular matching
        let cleanRole = roleParam.toLowerCase().trim();
        if (cleanRole === 'designers') cleanRole = 'designer';
        if (cleanRole === 'developers') cleanRole = 'developer';
        if (cleanRole === 'writers') cleanRole = 'writer';
        if (cleanRole === 'consultants') cleanRole = 'consultant';
        if (cleanRole === 'marketers') cleanRole = 'marketer';
        
        const matched = roles.find(r => r.toLowerCase() === cleanRole);
        if (matched) return matched;
      }
    }
    return defaultRole;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // default to newest
  const [filterAvailability, setFilterAvailability] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const url = selectedRole === 'All' 
          ? '/api/freelancers' 
          : `/api/freelancers?role=${selectedRole.toLowerCase()}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setProfiles(data || []);
        }
      } catch (error) {
        console.error('Failed to load freelancers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, [selectedRole]);

  // Helper to extract numeric views or leads count safely
  const getProfileViews = (p) => p.views || (p.username === 'demo' ? 412 : (p.username === 'sarahdesign' ? 289 : (p.username === 'alexdev' ? 188 : 94)));
  const getProfileLeads = (p) => p.leads || (p.username === 'demo' ? 28 : (p.username === 'sarahdesign' ? 19 : (p.username === 'alexdev' ? 12 : 5)));

  // Process sorting & filtering on client side
  const processedProfiles = [...profiles]
    .filter(p => {
      // 1. Text Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (p.name || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        const bio = (p.bio || '').toLowerCase();
        const tags = Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? JSON.parse(p.tags || '[]') : []);
        const matchesTags = tags.some(tag => String(tag).toLowerCase().includes(q));
        if (!name.includes(q) && !title.includes(q) && !bio.includes(q) && !matchesTags) {
          return false;
        }
      }

      // 2. Availability Filter
      if (filterAvailability !== 'All') {
        const avail = (p.availability_status || p.availability || 'Available for contract').toLowerCase();
        if (filterAvailability === 'Available' && !avail.includes('available')) return false;
        if (filterAvailability === 'Busy' && avail.includes('available')) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // 3. Sort Logic
      if (sortBy === 'newest') {
        const dateA = new Date(a.created_at || '2026-06-01T00:00:00Z');
        const dateB = new Date(b.created_at || '2026-06-01T00:00:00Z');
        return dateB - dateA;
      }
      if (sortBy === 'views') {
        return getProfileViews(b) - getProfileViews(a);
      }
      if (sortBy === 'leads') {
        return getProfileLeads(b) - getProfileLeads(a);
      }
      if (sortBy === 'rate-asc') {
        const rateA = parseFloat(String(a.starting_price || a.startingPrice || '1000').replace(/[^0-9.]/g, '')) || 0;
        const rateB = parseFloat(String(b.starting_price || b.startingPrice || '1000').replace(/[^0-9.]/g, '')) || 0;
        return rateA - rateB;
      }
      if (sortBy === 'rate-desc') {
        const rateA = parseFloat(String(a.starting_price || a.startingPrice || '1000').replace(/[^0-9.]/g, '')) || 0;
        const rateB = parseFloat(String(b.starting_price || b.startingPrice || '1000').replace(/[^0-9.]/g, '')) || 0;
        return rateB - rateA;
      }
      return 0;
    });

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
          <Link href="/freelancers" className="nav-link" style={{ fontWeight: 700 }}>Directory</Link>
          <Link href="/blog" className="nav-link">Blog</Link>
          <Link href="/pricing" className="nav-link">Pricing</Link>
          <Link href="/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Top Banner Hero */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, var(--primary-glow) 0%, transparent 100%)', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, padding: '6px 14px', borderRadius: '99px', background: 'var(--primary-glow)', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '20px', border: '1px solid var(--border)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Verified Independent Ecosystem
          </div>
          <h1 className="glow-gradient-text" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.04em', lineHeight: 1.1, background: 'linear-gradient(135deg, var(--text-main) 30%, var(--text-muted) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Find & Hire Verified Freelance Talent
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 32px auto' }}>
            Book premium designers, engineers, growth consultants, and writers managing their client pipelines on Freelancer Business OS.
          </p>

          {/* Search, Sort & Filter Row */}
          <div style={{ display: 'flex', maxWidth: '800px', margin: '0 auto', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by name, tags, or skills..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ flex: '2', minWidth: '260px', height: '46px', background: 'var(--bg-card)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
            />
            
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="form-select"
              style={{ flex: '1', minWidth: '160px', height: '46px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 12px', color: 'var(--text-main)' }}
            >
              <option value="newest">Sort: Newest</option>
              <option value="views">Sort: Most Viewed</option>
              <option value="leads">Sort: Most Leads</option>
              <option value="rate-asc">Rate: Low to High</option>
              <option value="rate-desc">Rate: High to Low</option>
            </select>

            <select
              value={filterAvailability}
              onChange={e => setFilterAvailability(e.target.value)}
              className="form-select"
              style={{ flex: '1', minWidth: '160px', height: '46px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 12px', color: 'var(--text-main)' }}
            >
              <option value="All">Availability: All</option>
              <option value="Available">Available</option>
              <option value="Busy">Busy / Active project</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Directory Grid Area */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '60px 20px' }}>
        
        {/* Role Filters Tabs */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
          {roles.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={selectedRole === role ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '8px 24px', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700 }}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Profiles Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
            <div className="animate-pulse">Loading directory entries...</div>
          </div>
        ) : processedProfiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>No profiles matches criteria</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
              Try adjusting your active keywords, category tags, or availability filters.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '32px' }}>
            {processedProfiles.map((p) => {
              const location = p.location || 'US / Remote';
              const responseTime = p.response_time || '< 2 hours';
              const startingPrice = p.starting_price || p.startingPrice || '$1,000+';
              const availability = p.availability_status || p.availability || 'Available for contract';
              const isAvailable = availability.toLowerCase().includes('available');

              let tags = [];
              if (Array.isArray(p.tags)) {
                tags = p.tags;
              } else if (typeof p.tags === 'string' && p.tags.trim()) {
                try {
                  tags = JSON.parse(p.tags);
                } catch(e) {
                  tags = p.tags.split(',').map(s => s.trim());
                }
              }

              let portfolioItems = [];
              if (Array.isArray(p.portfolio)) {
                portfolioItems = p.portfolio;
              } else if (typeof p.portfolio === 'string' && p.portfolio.trim()) {
                try {
                  portfolioItems = JSON.parse(p.portfolio);
                } catch(e) {
                  // fallback
                }
              }

              return (
                <div 
                  key={p.id} 
                  className="card glass-card animate-fade-in" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between', 
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    borderRadius: '16px',
                    padding: 0
                  }}
                >
                  {/* Top Cover Banner */}
                  <div style={{ 
                    height: '90px', 
                    background: p.cover_banner || 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)', 
                    position: 'relative' 
                  }} />

                  {/* Body Content */}
                  <div style={{ padding: '24px', flex: 1, position: 'relative', marginTop: '-44px', textAlign: 'left' }}>
                    {/* Avatar */}
                    <div style={{ 
                      width: '76px', 
                      height: '76px', 
                      borderRadius: '50%', 
                      border: '4px solid var(--bg-page)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-card)',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.6rem',
                      background: 'linear-gradient(135deg, var(--primary-glow) 0%, var(--accent-glow) 100%)',
                      color: 'var(--primary)'
                    }}>
                      {p.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatar_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (p.name || p.username || 'F').charAt(0).toUpperCase()
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {p.name || p.username}
                      <span style={{ display: 'inline-flex', color: 'var(--success)' }} title="Verified Provider">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </span>
                    </h3>
                    
                    <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700, margin: '0 0 12px 0' }}>
                      {p.title || 'Independent Specialist'}
                    </p>

                    {/* Trust Badges */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      {(p.username === 'sarahdesign' || p.username === 'demo') && (
                        <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                          Featured
                        </span>
                      )}
                      {(p.top_rated_badge === true || p.username === 'alexdev' || p.username === 'demo') && (
                        <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245,158,11,0.08)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.15)', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.209l8.2-1.191L12 .587z"/></svg>
                          Top Rated
                        </span>
                      )}
                      {(p.fast_response_badge === true || p.username === 'alexdev' || p.username === 'sarahdesign' || p.username === 'demo') && (
                        <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid rgba(6,182,212,0.15)', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                          Fast Reply
                        </span>
                      )}
                      {isAvailable && (
                        <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--success-glow)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.15)', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                          Available
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 20px 0', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.bio || 'Expert contractor delivering premium solutions, scope strategies, and project clearance operations.'}
                    </p>

                    {/* Skill Tags */}
                    {tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
                        {tags.slice(0, 4).map((tag, i) => (
                          <span 
                            key={i} 
                            style={{ 
                              fontSize: '0.7rem', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              background: 'var(--btn-secondary-bg)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-muted)' 
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Portfolio Preview Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
                      {[0, 1, 2].map((idx) => {
                        const item = portfolioItems[idx];
                        return (
                          <div 
                            key={idx} 
                            style={{ 
                              aspectRatio: '16/10', 
                              backgroundColor: 'var(--btn-secondary-bg)', 
                              border: '1px solid var(--border)', 
                              borderRadius: '6px', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              justifyContent: 'flex-end', 
                              padding: '6px',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            {item ? (
                              <>
                                <div style={{ 
                                  position: 'absolute', 
                                  top: '4px', 
                                  left: '4px', 
                                  right: '4px', 
                                  bottom: '22px', 
                                  background: idx % 3 === 0 
                                    ? 'linear-gradient(135deg, var(--primary-glow) 0%, transparent 100%)'
                                    : idx % 3 === 1 
                                    ? 'linear-gradient(135deg, var(--accent-glow) 0%, transparent 100%)'
                                    : 'linear-gradient(135deg, var(--success-glow) 0%, transparent 100%)',
                                  borderRadius: '3px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid var(--border)'
                                }}>
                                  <div style={{ width: '80%', height: '80%', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    <div style={{ width: '40%', height: '3px', backgroundColor: 'var(--border-hover)', borderRadius: '1px' }}></div>
                                    <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--border)', borderRadius: '1px' }}></div>
                                    <div style={{ display: 'flex', gap: '2px', width: '100%', flex: 1 }}>
                                      <div style={{ flex: 1, backgroundColor: 'var(--border)', borderRadius: '1px' }}></div>
                                      <div style={{ flex: 1, backgroundColor: 'var(--border)', borderRadius: '1px' }}></div>
                                    </div>
                                  </div>
                                </div>
                                <span style={{ 
                                  fontSize: '0.55rem', 
                                  fontWeight: 600, 
                                  color: 'var(--text-muted)', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  lineHeight: 1
                                }}>
                                  {item.title}
                                </span>
                              </>
                            ) : (
                              <div style={{ 
                                height: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: 'var(--text-soft)', 
                                fontSize: '0.55rem'
                              }}>
                                Screen {idx + 1}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Status & Response indicators */}
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <span style={{ color: isAvailable ? 'var(--success)' : 'var(--text-muted)' }}>
                        ● {availability}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        Reply: {responseTime}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Panel bar */}
                  <div style={{ padding: '18px 24px', borderTop: '1px solid var(--border)', background: 'var(--btn-secondary-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Starting From</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--success)' }}>{startingPrice}</span>
                    </div>

                    <Link href={`/card/${p.username}`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                      View Profile ➔
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
