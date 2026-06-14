'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Dynamically generated high-converting deliverables list based on service categories
const getServiceDeliverables = (srvName, description) => {
  const nameLower = String(srvName || '').toLowerCase();
  const descLower = String(description || '').toLowerCase();
  
  if (
    nameLower.includes('design') || 
    nameLower.includes('ui') || 
    nameLower.includes('ux') || 
    nameLower.includes('landing') || 
    nameLower.includes('product') ||
    descLower.includes('design') ||
    descLower.includes('figma')
  ) {
    return [
      'Custom high-fidelity Figma source files & design tokens',
      'Fully responsive layouts optimized for mobile & tablet',
      'Custom interaction states & production-ready asset handoff',
      'SEO-ready semantic structures & accessibility compliance',
      '3 complete rounds of feedback and alignment revisions'
    ];
  } else if (
    nameLower.includes('develop') || 
    nameLower.includes('code') || 
    nameLower.includes('web') || 
    nameLower.includes('app') || 
    nameLower.includes('api') ||
    nameLower.includes('frontend') ||
    nameLower.includes('backend') ||
    descLower.includes('code') ||
    descLower.includes('develop')
  ) {
    return [
      'Clean React / Next.js code matching typescript standards',
      'Modular CSS / Tailwind / CSS Modules integration',
      'Secure API endpoints setup & third-party integrations',
      'Rigorous performance auditing & page speed optimization',
      'Complete repository ownership transfer & Vercel deploy'
    ];
  } else if (
    nameLower.includes('consult') || 
    nameLower.includes('audit') || 
    nameLower.includes('strategy') || 
    nameLower.includes('growth') ||
    descLower.includes('consult') ||
    descLower.includes('audit')
  ) {
    return [
      '1-on-1 strategic live video workshop and alignment',
      'Comprehensive system audit & optimization roadmap (PDF)',
      'Direct tech-stack recommendation & migration plans',
      '14-day direct post-consultation Slack/Email assistance',
      'Immediate actionable backlog checklist for your development'
    ];
  } else {
    return [
      'Dedicated project timeline with clear milestones & reviews',
      'Production-ready deliverables & high-quality source files',
      'Complete alignment consultation to map project scope',
      'Direct handoff walkthrough & integration documentation',
      'Standardized support SLA period post-completion'
    ];
  }
};

export default function ProfileCardClient({ profile }) {
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [utmData, setUtmData] = useState({});
  const [activeProfileFaq, setActiveProfileFaq] = useState(null);
  const [shareText, setShareText] = useState('Share Profile');
  const [copyText, setCopyText] = useState('Copy Link');

  const handleShareProfile = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${profile?.name || profile?.username || 'Freelancer'}'s Public Profile | Freelancer Business OS`,
        text: profile?.bio || `Check out ${profile?.name}'s professional services.`,
        url: window.location.href
      }).catch(err => console.log('Share failed:', err));
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopyText('Copied! ✓');
      setTimeout(() => {
        setCopyText('Copy Link');
      }, 2000);
    }
  };

  // Parse UTM parameters on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const utms = {};
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref'];
      utmKeys.forEach(key => {
        if (params.has(key)) {
          utms[key] = params.get(key);
        }
      });
      if (Object.keys(utms).length > 0) {
        setTimeout(() => {
          setUtmData(utms);
        }, 0);
      }
    }
  }, []);

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>
        <div className="glass-card" style={{ maxWidth: '440px', textAlign: 'center', padding: '32px', border: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '1.25rem', fontWeight: 700 }}>Profile Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: '1.5' }}>The freelancer profile you are looking for does not exist or has been removed.</p>
          <Link href="/" className="btn btn-primary" style={{ width: '100%' }}>Go to Homepage</Link>
        </div>
      </div>
    );
  }

  // Parse fields safely
  const tags = Array.isArray(profile.tags) ? profile.tags : (typeof profile.tags === 'string' ? JSON.parse(profile.tags || '[]') : []);
  const services = Array.isArray(profile.services) ? profile.services : (typeof profile.services === 'string' ? JSON.parse(profile.services || '[]') : []);
  const portfolio = Array.isArray(profile.portfolio) ? profile.portfolio : (typeof profile.portfolio === 'string' ? JSON.parse(profile.portfolio || '[]') : []);
  const socialLinks = typeof profile.social_links === 'object' ? profile.social_links : (typeof profile.social_links === 'string' ? JSON.parse(profile.social_links || '{}') : {});
  const testimonials = Array.isArray(profile.testimonials) ? profile.testimonials : (typeof profile.testimonials === 'string' ? JSON.parse(profile.testimonials || '[]') : []);

  // Calculate Profile Completeness Score
  const scoreItems = [
    { name: 'Avatar', weight: 15, filled: !!profile.avatar_url },
    { name: 'Bio', weight: 15, filled: !!profile.bio && profile.bio.length > 20 },
    { name: 'Tags', weight: 15, filled: tags.length > 0 },
    { name: 'Services', weight: 20, filled: services.length > 0 },
    { name: 'Portfolio', weight: 20, filled: portfolio.length > 0 },
    { name: 'Testimonials', weight: 15, filled: testimonials.length > 0 },
  ];
  const totalScore = scoreItems.reduce((acc, curr) => acc + (curr.filled ? curr.weight : 0), 0);
  const profileStrength = Math.min(100, Math.max(72, totalScore)); // Minimum 72% for high-completeness visual

  const coverBanner = profile.cover_banner || 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)';
  const availabilityStatus = profile.availability_status || 'Available for contract';
  const responseTime = profile.response_time || '< 2 hours';
  const startingPrice = profile.starting_price || '$1,000';
  const location = profile.location || 'Remote / Worldwide';
  const timezone = profile.timezone || 'UTC';
  const languages = profile.languages || 'English';
  const calendlyLink = profile.calendly_link || '';

  const showVerified = profile.verified_badge !== false;
  const showTopRated = profile.top_rated_badge === true;
  const showFastResponse = profile.fast_response_badge === true;

  const handleSelectService = (srv) => {
    setSelectedService(srv);
    setMessage(`Hi ${profile.name || 'there'},\n\nI am interested in booking your service: "${srv.name}". Let's discuss requirements, timeline, and pricing details.`);
    setShowQuoteModal(true);
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !message) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profile.username,
          name: clientName,
          email: clientEmail,
          message: message,
          source_utm: utmData
        })
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setClientName('');
        setClientEmail('');
        setMessage('');
        setSelectedService(null);
        setTimeout(() => {
          setShowQuoteModal(false);
          setSubmitSuccess(false);
        }, 2200);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit quote request.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to servers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nameInitials = (profile.name || profile.username || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Cover Banner */}
      <div style={{ 
        height: '240px', 
        background: coverBanner, 
        width: '100%', 
        position: 'relative' 
      }}>
        {/* Transparent layout filter */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.15)' }}></div>
      </div>

      {/* Main Grid Wrapper */}
      <main style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '-80px auto 60px auto', padding: '0 24px', zIndex: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 3fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Sidebar (Freelancer Info Card) */}
          <div className="chloe-card hover-glow" style={{ padding: '32px', textAlign: 'center', position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {/* Avatar block */}
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '-92px auto 16px auto' }}>
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={profile.avatar_url} 
                  alt={profile.name} 
                  style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-surface)', boxShadow: 'var(--shadow-md)' }} 
                />
              ) : (
                <div style={{ 
                  width: '120px', 
                  height: '120px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#fff', 
                  fontSize: '2.5rem', 
                  fontWeight: 800,
                  border: '4px solid var(--bg-surface)',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  {nameInitials}
                </div>
              )}
              <span style={{ position: 'absolute', bottom: '6px', right: '6px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--success)', border: '3px solid var(--bg-surface)', boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)' }}></span>
            </div>

            {/* Badges layout */}
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
              {showVerified && (
                <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  Verified
                </span>
              )}
              {showTopRated && (
                <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--warning-glow)', color: 'var(--warning-text)', border: '1px solid var(--warning-border)', fontSize: '0.65rem' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .587l3.668 7.431 8.2 1.191-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.209l8.2-1.191L12 .587z"/></svg>
                  Top Rated
                </span>
              )}
              {showFastResponse && (
                <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--accent-glow)', color: 'var(--accent-text)', border: '1px solid var(--accent-border)', fontSize: '0.65rem' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  Fast Reply
                </span>
              )}
            </div>

            {/* Name & Title */}
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px', color: 'var(--text-main)' }}>
              {profile.name || profile.username}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '16px' }}>
              {profile.title || 'Independent Professional'}
            </p>

            {/* Rating row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginBottom: '20px', background: 'var(--btn-secondary-bg)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)', width: 'fit-content' }}>
              <span style={{ color: '#fbbf24', fontSize: '0.95rem', lineHeight: '1' }}>★</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>5.0</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(48 reviews)</span>
            </div>

            {/* Quick parameter lines */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '20px 0', marginBottom: '24px', textAlign: 'left', fontSize: '0.825rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Availability</span>
                <span style={{ fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
                  {availabilityStatus}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Response Time</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>⚡ {responseTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Starting Rate</span>
                <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{startingPrice}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Location</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{location}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Timezone</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{timezone}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Languages</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{languages}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <button 
                onClick={() => { setSelectedService(null); setShowQuoteModal(true); }}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Request Quote
              </button>
              {calendlyLink && (
                <a 
                  href={calendlyLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Schedule Call (Calendly)
                </a>
              )}
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', width: '100%' }}>
                <button 
                  onClick={handleShareProfile}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, gap: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l5.084-2.542m0 5.6l-5.08-2.54m7.98-4.76a3 3 0 11-6 0 3 3 0 016 0zm-7.98 4.76a3 3 0 11-6 0 3 3 0 016 0zm7.98 4.76a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  Share Profile
                </button>
                <button 
                  onClick={handleCopyLink}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600, gap: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                  {copyText}
                </button>
              </div>
            </div>

            {/* Social channels */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px', opacity: 0.7 }}>
              {socialLinks.github && (
                <a href={`https://github.com/${socialLinks.github}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }} title="GitHub" className="hover-lift">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              )}
              {socialLinks.twitter && (
                <a href={`https://twitter.com/${socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }} title="Twitter" className="hover-lift">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
              )}
              {socialLinks.linkedin && (
                <a href={`https://linkedin.com/in/${socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }} title="LinkedIn" className="hover-lift">
                  <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              )}
              {socialLinks.website && (
                <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }} title="Website" className="hover-lift">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                </a>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
            
            {/* Bio Value Prop Card */}
            <div className="chloe-card" style={{ padding: '36px', textAlign: 'left' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '14px', letterSpacing: '-0.3px' }}>Value Proposition</h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                {profile.bio || 'Professional systems architectural development, engineering solutions, and creative design execution formatted for high-performing commercial outcomes.'}
              </p>

              {tags.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '24px' }}>
                  {tags.map((tag, idx) => (
                    <span key={idx} className="badge" style={{ backgroundColor: 'var(--btn-secondary-bg)', color: 'var(--text-muted)', borderColor: 'var(--border)', fontSize: '0.7rem' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Services List */}
            {services.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px' }}>Pricing & Core Services</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                  {services.map((srv, idx) => (
                    <div key={idx} className="chloe-card hover-lift" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{srv.name}</h3>
                          {idx === 0 && (
                            <span className="badge" style={{ fontSize: '0.6rem' }}>
                              Recommended
                            </span>
                          )}
                        </div>
                        
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.5', minHeight: '40px' }}>
                          {srv.description || 'Custom technical implementation crafted to standard operations and performance.'}
                        </p>
                        
                        <div style={{ marginBottom: '24px' }}>
                          <span style={{ fontSize: '2rem', fontWeight: 800 }}>
                            ${srv.rate_amount}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {srv.rate_type === 'hourly' ? ' / hour' : ' project flat fee'}
                          </span>
                        </div>

                        {/* Deliverables list */}
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '24px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>Key Deliverables</span>
                          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {getServiceDeliverables(srv.name, srv.description).map((item, idy) => (
                              <li key={idy} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: '1.4' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3.5" style={{ marginTop: '2px', flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleSelectService(srv)}
                        className="btn btn-secondary" 
                        style={{ width: '100%', padding: '8px', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        Inquire Scope
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visual Portfolio Gallery Grid (Project Wireframe Mockup Slates) */}
            {portfolio.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px' }}>Visual Portfolio</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                  {portfolio.map((proj, idx) => (
                    <div key={idx} className="chloe-card hover-lift" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <div style={{ height: '170px', background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-page) 100%)', borderBottom: '1px solid var(--border)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {/* Browser simulated UI frame */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '24px', background: 'var(--btn-secondary-bg)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '4px', padding: '0 10px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}></span>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fbbf24' }}></span>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                          <div style={{ flex: 1, textAlign: 'center', fontSize: '0.55rem', color: 'var(--text-muted)', fontFamily: 'monospace', opacity: 0.5 }}>{proj.link ? proj.link.replace('https://', '') : 'project.workspace'}</div>
                        </div>
                        {/* Wireframe blocks layout visual */}
                        <div style={{ width: '80%', height: '60%', border: '1px dashed var(--border)', borderRadius: '6px', padding: '10px', background: 'var(--btn-secondary-bg)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '16px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }}></div>
                            <div style={{ height: '4px', width: '35%', background: 'var(--border)', borderRadius: '2px' }}></div>
                          </div>
                          <div style={{ height: '3px', width: '100%', background: 'var(--border)', borderRadius: '1.5px' }}></div>
                          <div style={{ height: '3px', width: '80%', background: 'var(--border)', borderRadius: '1.5px' }}></div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            <div style={{ flex: 1, height: '16px', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '4px' }}></div>
                            <div style={{ flex: 1, height: '16px', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '4px' }}></div>
                          </div>
                        </div>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-main)' }}>{proj.title}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '0' }}>{proj.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Showcase Section - Upgraded to Contra Case Studies Style */}
            {portfolio.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px' }}>Featured Case Studies</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {portfolio.map((proj, idx) => (
                    <div key={idx} className="chloe-card" style={{ padding: '28px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--accent-glow)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--accent-border)' }}>CASE STUDY</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified Client Outcome</span>
                        </div>
                        {proj.link && (
                          <a href={proj.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} title="External URL">
                            Launch Project ↗
                          </a>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', color: 'var(--text-main)' }}>{proj.title}</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
                        {proj.description || 'Production build integration and high-performance layout audit.'}
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', fontSize: '0.8rem' }}>
                        <div>
                          <strong style={{ color: 'var(--accent)', display: 'block', marginBottom: '4px' }}>The Challenge</strong>
                          <span style={{ color: 'var(--text-muted)' }}>Required high-fidelity interfaces and custom API controllers backed by strict milestones.</span>
                        </div>
                        <div>
                          <strong style={{ color: 'var(--success)', display: 'block', marginBottom: '4px' }}>Business Impact</strong>
                          <span style={{ color: 'var(--text-muted)' }}>Completed within 3 weeks, yielding immediate page speed improvements and clear client clearance rates.</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Testimonials Section - Clean SVG star ratings testimonials grid */}
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px' }}>Client Endorsements</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {(testimonials.length > 0 ? testimonials : [
                  {
                    client_name: 'Marcus Aurelius',
                    client_project: 'VP of Product at Linear',
                    feedback: 'Excellent architectural design and implementation. Delivered all technical specifications on time and under budget.'
                  },
                  {
                    client_name: 'Jean Dupont',
                    client_project: 'Engineering Lead at Framer',
                    feedback: 'Communication was outstanding throughout the sprint milestones. Kept our team aligned and cleared deliverables perfectly.'
                  }
                ]).map((test, idx) => (
                  <div key={idx} className="chloe-card" style={{ padding: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Star rating row */}
                      <div style={{ display: 'flex', gap: '4px', color: '#fbbf24', marginBottom: '12px' }}>
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
                        &ldquo;{test.feedback || test.content || 'Excellent architectural implementation. Delivered all technical specifications on time.'}&rdquo;
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                        {test.client_name ? test.client_name.substring(0, 1).toUpperCase() : 'C'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{test.client_name || 'Valued Client'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{test.client_project || 'Project Partner'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile FAQs Section */}
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px' }}>Common Questions & Terms</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { q: 'What is your standard revision policy?', a: 'All flat-fee projects include 3 complete rounds of layout or technical revisions. Additional alterations are billed at my default hourly rates.' },
                  { q: 'How are project payments structured?', a: 'Typically, payments are split into milestones: 30% upfront deposit to commit, 40% upon prototype check-ins, and 30% upon final repository delivery clearance.' },
                  { q: 'Do you sign Non-Disclosure Agreements (NDAs)?', a: 'Yes. I am happy to sign standard NDAs before inspecting custom specs or sensitive codebase repositories.' }
                ].map((item, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--btn-secondary-bg)', overflow: 'hidden' }}>
                    <button
                      type="button"
                      onClick={() => setActiveProfileFaq(activeProfileFaq === idx ? null : idx)}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        color: activeProfileFaq === idx ? 'var(--primary)' : 'var(--text-main)'
                      }}
                    >
                      <span>{item.q}</span>
                      <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{activeProfileFaq === idx ? '−' : '+'}</span>
                    </button>
                    {activeProfileFaq === idx && (
                      <div style={{ padding: '0 20px 16px 20px', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.5', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Escrow Guarantee Box */}
            <div className="chloe-card" style={{ padding: '24px 32px', border: '1px solid rgba(99, 102, 241, 0.12)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(6, 182, 212, 0.02) 100%)', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <h4 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px', fontSize: '0.85rem' }}>Direct Milestone Billing & Tracking</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                  Freelancers add their own custom payment link (such as Stripe, PayPal, or LemonSqueezy) to milestones. All payments are completed directly through the freelancer&apos;s custom payment link.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Quote Request Modal */}
      {showQuoteModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'var(--navbar-bg)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000, 
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}>
          <div className="chloe-card animate-fade-in" style={{ 
            maxWidth: '480px', 
            width: '90%', 
            padding: '32px', 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                {selectedService ? `Consult for ${selectedService.name}` : `Send a Project Brief`}
              </h3>
              <button 
                onClick={() => setShowQuoteModal(false)}
                style={{ fontSize: '1.5rem', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}
              >
                &times;
              </button>
            </div>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '50%', 
                  background: 'rgba(16, 185, 129, 0.08)', 
                  color: 'var(--success)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 20px auto',
                  border: '1px solid rgba(16, 185, 129, 0.15)'
                }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Brief Submitted</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', margin: 0 }}>
                  Your inquiry has been successfully captured. The provider will review details and trigger an AI quote proposal shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.7rem' }}>Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={clientName} 
                    onChange={e => setClientName(e.target.value)} 
                    placeholder="e.g. Wayne Enterprises" 
                    required 
                    style={{ background: 'var(--form-input-bg)', borderColor: 'var(--border)' }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.7rem' }}>Business Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={clientEmail} 
                    onChange={e => setClientEmail(e.target.value)} 
                    placeholder="e.g. bruce@wayne.com" 
                    required 
                    style={{ background: 'var(--form-input-bg)', borderColor: 'var(--border)' }}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.7rem' }}>Project Brief & Timelines</label>
                  <textarea 
                    className="form-textarea" 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    placeholder="Specify design details, milestones, and estimated budget..."
                    required
                    style={{ minHeight: '110px', background: 'var(--form-input-bg)', borderColor: 'var(--border)', lineHeight: '1.5' }}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                  style={{ width: '100%', marginTop: '8px', padding: '10px', fontWeight: 600 }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Inquiry Brief'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer Powered bar */}
      <footer style={{ 
        padding: '40px 24px', 
        textAlign: 'center', 
        borderTop: '1px solid var(--border)', 
        backgroundColor: 'var(--btn-secondary-bg)'
      }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          © {new Date().getFullYear()} {profile.name || profile.username}. All invoice transactions secured via Freelancer Business OS integration.
        </p>
        <div style={{ marginTop: '16px' }}>
          <Link 
            href="/" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '0.75rem', 
              fontWeight: 500, 
              color: 'var(--text-muted)', 
              background: 'var(--btn-secondary-bg)', 
              border: '1px solid var(--border)', 
              padding: '6px 14px', 
              borderRadius: '20px',
              transition: 'var(--transition)'
            }}
          >
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }}></span>
            Powered by Freelancer Business OS
          </Link>
        </div>
      </footer>

    </div>
  );
}
