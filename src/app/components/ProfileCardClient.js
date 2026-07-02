'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { buildProfileFaqItems, inferIndustryFromProfile, seoGrowthRoutes } from '../lib/seo-data';
// Telemetry layer purged - UI is pure render only
const trackEvent = () => {};
import { getProfileRenderConfig } from 'lib/expression/renderProfile';
import { getPortfolioRenderConfig } from 'lib/expression/renderPortfolio';
import { getContactFlowConfig } from 'lib/expression/renderContactFlow';

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
      'Responsive implementation notes and handoff checklist',
      'Simple deployment notes for the final deliverable',
      'Rigorous performance auditing & page speed optimization',
      'Complete repository ownership handoff & Vercel deploy'
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
      'Direct handoff walkthrough and delivery notes',
      'Standardized support SLA period post-completion'
    ];
  }
};

const getVideoEmbedUrl = (url) => {
  if (!url) return null;
  let match;
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }
  if (url.includes('vimeo.com')) {
    match = url.match(/(?:vimeo\.com\/)(?:channels\/[^\/]+\/|groups\/[^\/]+\/album\/[^\/]+\/video\/|showcase\/[^\/]+\/video\/|video\/|)(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : url;
  }
  return url;
};

const getTeamMembers = (industrySlug, founderName) => {
  const name = founderName || 'Founder';
  if (['developer', 'web-designer'].includes(industrySlug)) {
    return [
      { name: name, role: 'Founder & Principal Architect', initials: 'F', bio: 'Directs overall technical architecture and client alignment sessions.' },
      { name: 'Liam Sterling', role: 'Technical Lead', initials: 'LS', bio: 'Specializes in high-performance Next.js architectures, API orchestrations, and database schemas.' },
      { name: 'Chloe Vance', role: 'Lead UI/UX Designer', initials: 'CV', bio: 'Maintains Figma design systems, responsive layout frameworks, and digital interfaces.' }
    ];
  } else if (['marketer', 'copywriter', 'consultant'].includes(industrySlug)) {
    return [
      { name: name, role: 'Founder & Strategy Lead', initials: 'F', bio: 'Drives strategic roadmaps, commercial audits, and business positioning models.' },
      { name: 'Ethan Thorne', role: 'Growth Lead / Media Buyer', initials: 'ET', bio: 'Orchestrates paid media acquisition, search engine funnels, and performance marketing pipelines.' },
      { name: 'Sophia Lin', role: 'Lead Content Strategist', initials: 'SL', bio: 'Drafts high-converting copy, newsletter series, and conversion psychological loops.' }
    ];
  } else {
    return [
      { name: name, role: 'Founder & Managing Director', initials: 'F', bio: 'Directs client partnerships, milestone workflows, and overall delivery standards.' },
      { name: 'Leo Vance', role: 'Operations Manager', initials: 'LV', bio: 'Coordinates delivery timelines, review loops, and client portal updates.' },
      { name: 'Chloe Sterling', role: 'Technical Partner', initials: 'CS', bio: 'Implements production deliverables and oversees technical handoff checks.' }
    ];
  }
};

const getAgencyMetrics = (industrySlug) => {
  if (['developer', 'web-designer'].includes(industrySlug)) {
    return [
      { value: '99.8%', label: 'Deployment Uptime', desc: 'Continuous integration and staging server performance.' },
      { value: '45+', label: 'Deploys Managed', desc: 'Production-ready code bases fully owned by client partners.' },
      { value: '14 Days', label: 'Velocity to MVP', desc: 'Rapid development sprints matching strict milestone schedules.' }
    ];
  } else if (['marketer', 'copywriter', 'consultant'].includes(industrySlug)) {
    return [
      { value: '3.4x', label: 'Average Funnel ROI', desc: 'Direct-response conversions and paid media optimizations.' },
      { value: '$12M+', label: 'Revenue Scoped', desc: 'Attributed commercial value across all active CRM leads.' },
      { value: '98.7%', label: 'Retention Rate', desc: 'Long-term client partnerships and recurring operations.' }
    ];
  } else {
    return [
      { value: '99.2%', label: 'SLA Delivery', desc: 'On-time delivery across all verified milestones.' },
      { value: '85+', label: 'Portals Managed', desc: 'Private client portal hubs operating continuously.' },
      { value: '24 hrs', label: 'SLA Response Guarantee', desc: 'Direct operations communication guarantee.' }
    ];
  }
};


export default function ProfileCardClient({ profile: initialProfile = null, faqItems: initialFaqItems = [], username = '' }) {
  const [profile, setProfile] = useState(initialProfile);
  const [faqItems, setFaqItems] = useState(initialFaqItems);
  const [isLoadingProfile, setIsLoadingProfile] = useState(!initialProfile && !!username);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [leadFormError, setLeadFormError] = useState('');
  const [utmData, setUtmData] = useState({});
  const [activeProfileFaq, setActiveProfileFaq] = useState(null);
  const [shareText, setShareText] = useState('Share Profile');
  const [copyText, setCopyText] = useState('Copy Link');
  const [showFloatingBadge, setShowFloatingBadge] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inquiryStep, setInquiryStep] = useState(1);
  const [clientCompany, setClientCompany] = useState('');
  const [projectBudget, setProjectBudget] = useState('');
  const [projectTimeline, setProjectTimeline] = useState('');
  const [projectServiceType, setProjectServiceType] = useState('');
  const [selectedServiceGroup, setSelectedServiceGroup] = useState('All');

  useEffect(() => {
    if (typeof document !== 'undefined' && profile?.social_links) {
      try {
        const social = typeof profile.social_links === 'object' ? profile.social_links : (typeof profile.social_links === 'string' ? JSON.parse(profile.social_links || '{}') : {});
        const font = social?.font_family;
        if (font && font !== 'Inter') {
          const linkId = `font-${font.replace(/\s+/g, '-').toLowerCase()}`;
          if (!document.getElementById(linkId)) {
            const link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;500;600;700;800;900&display=swap`;
            document.head.appendChild(link);
          }
        }
      } catch (e) {
        console.error('Error loading custom font:', e);
      }
    }
  }, [profile?.social_links]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('sandbox-profile');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && (username === 'demo' || username === 'sandbox' || username === parsed.username)) {
            const timer = setTimeout(() => {
              setProfile(parsed);
              setFaqItems(buildProfileFaqItems(parsed));
            }, 0);
            return () => clearTimeout(timer);
          }
        } catch (e) {
          console.error('Failed to parse stored sandbox profile:', e);
        }
      }
    }
  }, [username]);

  useEffect(() => {
    if (profile?.username) {
      trackEvent('public_profile_view', { freelancer_username: profile.username });
    }
  }, [profile?.username]);

  useEffect(() => {
    if (initialProfile || !username) return;

    let ignore = false;

    async function fetchProfile() {
      setIsLoadingProfile(true);
      try {
        const response = await fetch(`/api/card-profile?username=${encodeURIComponent(username)}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          if (!ignore) {
            setProfile(null);
            setFaqItems([]);
          }
          return;
        }

        const data = await response.json();
        if (!ignore) {
          setProfile(data);
          setFaqItems(data ? buildProfileFaqItems(data) : []);
        }
      } catch (error) {
        console.error('Failed to fetch public profile:', error);
        if (!ignore) {
          setProfile(null);
          setFaqItems([]);
        }
      } finally {
        if (!ignore) {
          setIsLoadingProfile(false);
        }
      }
    }

    fetchProfile();

    return () => {
      ignore = true;
    };
  }, [initialProfile, username]);

  const handleShareProfile = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `${profile?.name || profile?.username || 'Freelancer'}'s Public Profile | Corvioz`,
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

  if (isLoadingProfile) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', padding: '40px 20px', fontFamily: 'var(--font-sans)' }}>
        <div className="container" style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Header Cover Banner Skeleton */}
          <div className="card animate-pulse" style={{ height: '240px', borderRadius: '12px', background: 'var(--skeleton-bg)', position: 'relative' }}>
            <div style={{ position: 'absolute', bottom: '-40px', left: '40px', width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="skeleton skeleton-circle animate-pulse" style={{ width: '92px', height: '92px', background: 'var(--skeleton-bg)' }}></div>
            </div>
          </div>
          
          {/* Bento Grid layout skeleton */}
          <div className="bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '24px' }}>
            
            {/* Bio Card Skeleton */}
            <div className="card bento-item animate-pulse" style={{ gridColumn: 'span 2', padding: '36px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="skeleton skeleton-title animate-pulse" style={{ width: '40%' }}></div>
              <div className="skeleton skeleton-text animate-pulse" style={{ width: '90%' }}></div>
              <div className="skeleton skeleton-text animate-pulse" style={{ width: '95%' }}></div>
              <div className="skeleton skeleton-text animate-pulse" style={{ width: '70%' }}></div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <div className="skeleton animate-pulse" style={{ height: '28px', width: '60px', borderRadius: '14px' }}></div>
                <div className="skeleton animate-pulse" style={{ height: '28px', width: '80px', borderRadius: '14px' }}></div>
                <div className="skeleton animate-pulse" style={{ height: '28px', width: '70px', borderRadius: '14px' }}></div>
              </div>
            </div>
            
            {/* Meta details card skeleton */}
            <div className="card bento-item animate-pulse" style={{ gridColumn: 'span 1', padding: '36px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="skeleton skeleton-title animate-pulse" style={{ width: '60%' }}></div>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="skeleton animate-pulse" style={{ height: '14px', width: '80px' }}></div>
                  <div className="skeleton animate-pulse" style={{ height: '14px', width: '100px' }}></div>
                </div>
              ))}
            </div>

            {/* Services skeleton card */}
            <div className="card bento-item animate-pulse" style={{ gridColumn: 'span 3', padding: '36px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="skeleton skeleton-title animate-pulse" style={{ width: '25%' }}></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {[1, 2].map(i => (
                  <div key={i} className="card animate-pulse" style={{ padding: '28px', minHeight: '160px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="skeleton skeleton-title animate-pulse" style={{ width: '50%' }}></div>
                    <div className="skeleton skeleton-text animate-pulse" style={{ width: '100%' }}></div>
                    <div className="skeleton skeleton-text animate-pulse" style={{ width: '80%' }}></div>
                    <div className="skeleton animate-pulse" style={{ height: '24px', width: '60px', marginTop: '12px' }}></div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </div>
    );
  }

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

  const planTier = profile.plan || 'free';
  const profileConfig = getProfileRenderConfig(planTier);
  const portfolioConfig = getPortfolioRenderConfig(planTier);
  const contactConfig = getContactFlowConfig(planTier);

  // Parse fields safely
  const tags = Array.isArray(profile.tags) ? profile.tags : (typeof profile.tags === 'string' ? JSON.parse(profile.tags || '[]') : []);
  let services = Array.isArray(profile.services) ? profile.services : (typeof profile.services === 'string' ? JSON.parse(profile.services || '[]') : []);
  if (profileConfig.serviceLimit > 0) {
    services = services.slice(0, profileConfig.serviceLimit);
  }
  let portfolio = Array.isArray(profile.portfolio) ? profile.portfolio : (typeof profile.portfolio === 'string' ? JSON.parse(profile.portfolio || '[]') : []);
  const portLimit = profileConfig.portfolioLimit || portfolioConfig.itemLimit;
  if (portLimit > 0) {
    portfolio = portfolio.slice(0, portLimit);
  }
  const uniqueCategories = ['All', ...new Set(portfolio.map(p => p.category).filter(c => typeof c === 'string' && c.trim() !== ''))];
  const filteredPortfolio = selectedCategory === 'All'
    ? portfolio
    : portfolio.filter(p => p.category === selectedCategory);
  const socialLinks = typeof profile.social_links === 'object' ? profile.social_links : (typeof profile.social_links === 'string' ? JSON.parse(profile.social_links || '{}') : {});
  let testimonials = Array.isArray(profile.testimonials) ? profile.testimonials : (typeof profile.testimonials === 'string' ? JSON.parse(profile.testimonials || '[]') : []);
  if (profileConfig.testimonialLimit > 0) {
    testimonials = testimonials.slice(0, profileConfig.testimonialLimit);
  }

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
  const industry = inferIndustryFromProfile(profile);
  const industryName = industry.label;
  const invoiceTemplateHref = seoGrowthRoutes.templates.invoice(industry.slug);
  const quoteTemplateHref = seoGrowthRoutes.templates.quote(industry.slug);
  const pricingGuideHref = seoGrowthRoutes.blog('how-to-price-web-design-projects');
  const serviceKeywords = [
    industry.singular,
    `${industry.singular} services`,
    `${industry.singular} quote`,
    `${industry.singular} invoice`,
    ...services.map((service) => service.name).filter(Boolean),
    ...tags,
  ].slice(0, 12);

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
    setLeadFormError('');
    if (!clientName || !clientName.trim()) {
      setLeadFormError('Please enter your name.');
      return;
    }
    if (!clientEmail || !clientEmail.trim()) {
      setLeadFormError('Please enter your email.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(clientEmail.trim())) {
      setLeadFormError('Please enter a valid email address.');
      return;
    }

    const isAgency = profileConfig.layout === 'agency';
    const finalMessage = isAgency
      ? `Company: ${clientCompany || 'N/A'}\nService: ${projectServiceType || 'N/A'}\nBudget: ${projectBudget || 'N/A'}\nTimeline: ${projectTimeline || 'N/A'}\n\nDetails: ${message || 'No additional details provided.'}`
      : message;

    if (!finalMessage || !finalMessage.trim()) {
      setLeadFormError('Please enter project details or message.');
      return;
    }

    setIsSubmitting(true);
    try {
      let leadValue = 0;
      if (projectBudget) {
        if (projectBudget === '5k-10k') leadValue = 7500;
        else if (projectBudget === '10k-25k') leadValue = 17500;
        else if (projectBudget === '25k-50k') leadValue = 37500;
        else if (projectBudget === '50k+') leadValue = 75000;
      }

      const postUtm = {
        ...utmData,
        company_name: clientCompany?.trim() || '',
        budget_range: projectBudget || '',
        timeline: projectTimeline || '',
        service_type: projectServiceType || '',
        lead_value: leadValue
      };

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profile.username,
          name: clientName.trim(),
          email: clientEmail.trim(),
          message: finalMessage.trim(),
          source_utm: postUtm
        })
      });

      if (res.ok) {
        trackEvent('lead_submitted', {
          freelancer_username: profile.username,
          service_selected: selectedService ? selectedService.name : (projectServiceType || 'general')
        });
        
        setSubmitSuccess(true);
        if (isAgency) {
          setInquiryStep(3);
        } else {
          setClientName('');
          setClientEmail('');
          setMessage('');
          setSelectedService(null);
          setTimeout(() => {
            setShowQuoteModal(false);
            setSubmitSuccess(false);
          }, 2200);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setLeadFormError(data.error || 'Failed to submit quote request. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setLeadFormError('Network error connecting to servers.');
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

  if (profileConfig.layout === 'business_card') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--bg-page)', 
        color: 'var(--text-main)', 
        fontFamily: 'var(--font-sans)', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '60px 20px'
      }}>
        {/* Simple business card centered container */}
        <div style={{
          maxWidth: '680px',
          width: '100%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Card Accent Top Line */}
          <div style={{
            height: '8px',
            background: 'linear-gradient(95deg, var(--primary) 0%, var(--accent) 100%)',
            width: '100%'
          }} />

          {/* Profile Card Header (Centered Minimal Layout) */}
          <div style={{
            padding: '40px 40px 24px 40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)'
          }}>
            {/* Avatar centered */}
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '16px' }}>
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={profile.avatar_url} 
                  alt={profile.name} 
                  style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }} 
                />
              ) : (
                <div style={{ 
                  width: '100px', 
                  height: '100px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  color: '#fff', 
                  fontSize: '2.2rem', 
                  fontWeight: 800,
                  border: '3px solid var(--bg-surface)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {nameInitials}
                </div>
              )}
              {profileConfig.showAvailabilityIndicator && (
                <span style={{ position: 'absolute', bottom: '4px', right: '4px', width: '14px', height: '14px', borderRadius: '50%', background: 'var(--success)', border: '2.5px solid var(--bg-surface)', boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }}></span>
              )}
            </div>

            {/* Name & Title */}
            <h1 style={{ fontSize: '1.8rem', fontWeight: 850, letterSpacing: '-0.5px', marginBottom: '6px', color: 'var(--text-main)' }}>
              {profile.name || profile.username}
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '20px' }}>
              {profile.title || 'Independent Professional'}
            </p>

          </div>

          {/* Card Body */}
          <div style={{ padding: '32px 40px' }}>

            {/* Core Services (Fixed structure, max 2) */}
            {services.length > 0 && (
              <div style={{ marginBottom: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', letterSpacing: '-0.2px' }}>Core Services & Pricing</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {services.map((srv, idx) => (
                    <div key={idx} style={{
                      padding: '16px 20px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-main)' }}>{srv.name}</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {srv.description || 'Custom technical implementation crafted to standard operations and performance.'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>${srv.rate_amount}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                          {srv.rate_type === 'hourly' ? '/ hr' : 'flat fee'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Visual Portfolio: Single-column showcase (max 3 highlighted projects) */}
            {portfolio.length > 0 && (
              <div style={{ marginBottom: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px', letterSpacing: '-0.2px' }}>Featured Projects</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {portfolio.map((proj, idx) => (
                    <div key={idx} style={{
                      padding: '20px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>Highlighted Case</span>
                        {proj.link && (
                          <a href={proj.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            View Project ↗
                          </a>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>{proj.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', lineHeight: '1.5', margin: 0 }}>
                        {proj.description || 'Selected project, deliverable, or client-facing work sample.'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Renderer: Simple contact form + Email CTA */}
            {contactConfig.showContactForm ? (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px', letterSpacing: '-0.2px' }}>Get In Touch</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.4 }}>
                  Submit project details below to receive an estimate quote, or reach out directly via email.
                </p>

                {submitSuccess ? (
                  <div style={{ textAlign: 'center', padding: '24px 0', border: '1px dashed var(--success)', borderRadius: '12px', background: 'var(--bg-surface)' }}>
                    <div style={{ 
                      width: '36px', 
                      height: '36px', 
                      borderRadius: '50%', 
                      background: 'rgba(16, 185, 129, 0.08)', 
                      color: 'var(--success)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      margin: '0 auto 12px auto',
                      border: '1px solid rgba(16, 185, 129, 0.15)'
                    }}>
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>Inquiry Submitted</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>
                      Your message has been sent. I will reply with an estimate quote.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitLead} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {leadFormError && (
                      <div style={{ padding: '8px 12px', background: 'var(--danger-glow)', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger-text)', fontSize: '0.78rem', fontWeight: 600 }}>
                        ⚠️ {leadFormError}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="input-group">
                        <input 
                          type="text" 
                          className="form-input" 
                          value={clientName} 
                          onChange={e => setClientName(e.target.value)} 
                          placeholder="Your Name" 
                          required 
                          style={{ background: 'var(--form-input-bg)', borderColor: 'var(--border)', fontSize: '0.8rem', padding: '8px 12px' }}
                        />
                      </div>
                      <div className="input-group">
                        <input 
                          type="email" 
                          className="form-input" 
                          value={clientEmail} 
                          onChange={e => setClientEmail(e.target.value)} 
                          placeholder="Your Email" 
                          required 
                          style={{ background: 'var(--form-input-bg)', borderColor: 'var(--border)', fontSize: '0.8rem', padding: '8px 12px' }}
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <textarea 
                        className="form-textarea" 
                        value={message} 
                        onChange={e => setMessage(e.target.value)} 
                        placeholder="Project requirements, budget details, timeline..."
                        required
                        style={{ minHeight: '80px', background: 'var(--form-input-bg)', borderColor: 'var(--border)', fontSize: '0.8rem', padding: '8px 12px', lineHeight: '1.4' }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isSubmitting}
                        style={{ flex: 1, padding: '9px', fontWeight: 600, fontSize: '0.8rem' }}
                      >
                        {isSubmitting ? 'Sending...' : 'Submit Inquiry'}
                      </button>
                      {profile.contact_email && (
                        <a
                          href={`mailto:${profile.contact_email}?subject=Project inquiry from Corvioz profile`}
                          className="btn btn-secondary"
                          style={{ flex: 1, padding: '9px', fontWeight: 600, fontSize: '0.8rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                        >
                          ✉️ Email Directly
                        </a>
                      )}
                    </div>
                  </form>
                )}
              </div>
            ) : (
              profile.contact_email && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '-0.2px' }}>Get In Touch</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.4 }}>
                    Feel free to reach out directly via email for project inquiries or collaboration.
                  </p>
                  <a
                    href={`mailto:${profile.contact_email}?subject=Project inquiry from Corvioz profile`}
                    className="btn btn-primary"
                    style={{ 
                      display: 'inline-flex', 
                      padding: '10px 24px', 
                      fontWeight: 600, 
                      fontSize: '0.82rem', 
                      textDecoration: 'none', 
                      borderRadius: '8px', 
                      alignItems: 'center', 
                      gap: '8px',
                      background: 'var(--primary)',
                      color: '#ffffff',
                      border: 'none',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer'
                    }}
                  >
                    ✉️ Email {profile.name || profile.username}
                  </a>
                </div>
              )
            )}

          </div>
        </div>

        {/* Brand footer */}
        <footer style={{ 
          marginTop: '36px',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <p style={{ margin: '0 0 12px 0' }}>
            © {new Date().getFullYear()} {profile.name || profile.username}. All quotes and billing powered by Corvioz.
          </p>
          {profileConfig.showPoweredByBadge && (
            <Link 
              href="/" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                fontSize: '0.72rem', 
                fontWeight: 500, 
                color: 'var(--text-muted)', 
                background: 'var(--btn-secondary-bg)', 
                border: '1px solid var(--border)', 
                padding: '4px 10px', 
                borderRadius: '16px',
                textDecoration: 'none'
              }}
            >
              <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)' }}></span>
              Powered by Corvioz
            </Link>
          )}
        </footer>
      </div>
    );
  }

  if (profileConfig.layout === 'agency') {
    const brandColor = socialLinks.brand_color || '#4f46e5';
    const brandSecondary = socialLinks.brand_secondary || '#06b6d4';
    const themePref = socialLinks.theme_preference || 'dark';
    const fontStyle = socialLinks.font_family === 'Outfit'
      ? '"Outfit", sans-serif'
      : socialLinks.font_family === 'Playfair Display'
        ? '"Playfair Display", serif'
        : 'var(--font-sans)';

    const getThemeStyles = () => {
      const isDark = themePref === 'dark';
      const isGlass = themePref === 'glass';
      
      if (isDark) {
        return {
          bgPage: '#090d16',
          bgCard: '#131926',
          bgSurface: '#1c2436',
          border: 'rgba(255, 255, 255, 0.08)',
          textMain: '#f9fafb',
          textMuted: '#9ca3af',
          textSoft: '#6b7280',
          formInputBg: '#1c2436',
          shadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        };
      } else if (isGlass) {
        return {
          bgPage: '#070b13',
          bgCard: 'rgba(30, 41, 59, 0.45)',
          bgSurface: 'rgba(51, 65, 85, 0.3)',
          border: 'rgba(255, 255, 255, 0.15)',
          textMain: '#f8fafc',
          textMuted: '#cbd5e1',
          textSoft: '#94a3b8',
          formInputBg: 'rgba(15, 23, 42, 0.3)',
          backdropFilter: 'blur(16px)',
          shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        };
      } else { // light theme
        return {
          bgPage: '#f8fafc',
          bgCard: '#ffffff',
          bgSurface: '#f1f5f9',
          border: 'rgba(0, 0, 0, 0.08)',
          textMain: '#0f172a',
          textMuted: '#475569',
          textSoft: '#94a3b8',
          formInputBg: '#f8fafc',
          shadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
        };
      }
    };
    const themeStyles = getThemeStyles();

    const serviceGroups = ['All', ...new Set(services.map(s => s.group).filter(g => typeof g === 'string' && g.trim() !== ''))];
    const filteredServices = selectedServiceGroup === 'All'
      ? services
      : services.filter(s => s.group === selectedServiceGroup);

    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: themeStyles.bgPage,
        color: themeStyles.textMain,
        fontFamily: fontStyle,
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <style>{`
          .agency-link:hover {
            color: ${brandColor} !important;
            opacity: 1 !important;
          }
          .agency-btn-primary {
            background: ${brandColor} !important;
            color: #ffffff !important;
            box-shadow: 0 4px 14px rgba(${brandColor === '#4f46e5' ? '79, 70, 229' : '99, 102, 241'}, 0.4) !important;
          }
          .agency-btn-primary:hover {
            opacity: 0.9;
            transform: translateY(-1px);
          }
          .agency-btn-secondary {
            background: ${themeStyles.bgSurface} !important;
            border: 1px solid ${themeStyles.border} !important;
            color: ${themeStyles.textMain} !important;
          }
          .agency-btn-secondary:hover {
            background: ${themeStyles.bgCard} !important;
            transform: translateY(-1px);
          }
          .agency-input:focus {
            border-color: ${brandColor} !important;
            box-shadow: 0 0 0 2px rgba(${brandColor === '#4f46e5' ? '79, 70, 229' : '99, 102, 241'}, 0.2) !important;
          }
          .agency-tab-active {
            border-bottom: 2px solid ${brandColor} !important;
            color: ${brandColor} !important;
          }
          .agency-theme-container input, .agency-theme-container select, .agency-theme-container textarea {
            color: ${themeStyles.textMain} !important;
          }
        `}</style>

        {/* Agency Navigation Header */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: themeStyles.bgPage === '#ffffff' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(9, 13, 22, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${themeStyles.border}`,
          padding: '16px 24px'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {socialLinks.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={socialLinks.logo_url} alt="Agency Logo" style={{ height: '36px', objectFit: 'contain' }} />
              ) : (
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${brandColor}, ${brandSecondary})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '1.25rem'
                }}>
                  {nameInitials}
                </div>
              )}
              <div>
                <span style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '-0.5px' }}>{profile.name || profile.username}</span>
                <span style={{ fontSize: '0.7rem', color: themeStyles.textMuted, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Studio Workspace</span>
              </div>
            </div>

            <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <a href="#services" className="agency-link" style={{ fontSize: '0.85rem', color: themeStyles.textMuted, textDecoration: 'none', transition: 'var(--transition)' }}>Services</a>
              <a href="#portfolio" className="agency-link" style={{ fontSize: '0.85rem', color: themeStyles.textMuted, textDecoration: 'none', transition: 'var(--transition)' }}>Case Studies</a>
              <a href="#contact" className="agency-btn-primary btn" style={{ fontSize: '0.8rem', fontWeight: 700, padding: '8px 16px', borderRadius: '6px', textDecoration: 'none' }}>
                Hire Agency
              </a>
            </nav>
          </div>
        </header>

        {/* Agency Hero Cover Banner */}
        <div style={{
          height: '240px',
          background: coverBanner,
          width: '100%',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)' }}></div>
        </div>

        {/* Agency Hero Section */}
        <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '-80px auto 60px auto', padding: '0 24px', zIndex: 10, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Left Column - Main Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Value Proposition Header Card */}
            <div style={{
              background: themeStyles.bgCard,
              backdropFilter: themeStyles.backdropFilter,
              border: `1px solid ${themeStyles.border}`,
              boxShadow: themeStyles.shadow,
              borderRadius: '16px',
              padding: '40px'
            }}>
              {/* Badges row */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ✓ Verified Agency
                </span>
                {showTopRated && (
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, background: 'rgba(251, 191, 36, 0.08)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.15)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ★ Top Rated
                  </span>
                )}
                {showFastResponse && (
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, background: 'rgba(6, 182, 212, 0.08)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.15)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ⚡ SLA Guaranteed
                  </span>
                )}
              </div>

              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: '1.2', letterSpacing: '-1.5px', marginBottom: '16px', color: themeStyles.textMain }}>
                {profile.title || 'Custom Engineering & Strategic Execution'}
              </h1>
              
              <p style={{ fontSize: '1.05rem', color: themeStyles.textMuted, lineHeight: '1.6', margin: '0 0 24px 0' }}>
                {profile.bio || 'We orchestrate high-performing commercial solutions combining clean technology stacks, dedicated brand identity guidelines, and verified milestones.'}
              </p>

              {tags.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: `1px solid ${themeStyles.border}`, paddingTop: '24px' }}>
                  {tags.map((tag, idx) => (
                    <span key={idx} className="badge" style={{ backgroundColor: themeStyles.bgSurface, color: themeStyles.textMuted, borderColor: themeStyles.border, fontSize: '0.72rem', padding: '4px 10px', borderRadius: '6px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Agency Results / Outcome Metrics Section */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {getAgencyMetrics(industry.slug).map((metric, idx) => (
                <div key={idx} style={{
                  background: themeStyles.bgCard,
                  backdropFilter: themeStyles.backdropFilter,
                  border: `1px solid ${themeStyles.border}`,
                  boxShadow: themeStyles.shadow,
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: brandSecondary,
                    background: `linear-gradient(135deg, ${brandColor}, ${brandSecondary})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'block'
                  }}>
                    {metric.value}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: themeStyles.textMain }}>
                    {metric.label}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: themeStyles.textMuted, lineHeight: '1.3' }}>
                    {metric.desc}
                  </span>
                </div>
              ))}
            </div>

            {/* Services offerings block */}
            <div id="services" style={{
              background: themeStyles.bgCard,
              backdropFilter: themeStyles.backdropFilter,
              border: `1px solid ${themeStyles.border}`,
              boxShadow: themeStyles.shadow,
              borderRadius: '16px',
              padding: '40px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Service Groups</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: themeStyles.textMuted }}>Explore our agency specializations and fixed flat-rate workspaces.</p>
                </div>

                {/* Service Group filters */}
                {serviceGroups.length > 1 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {serviceGroups.map(grp => (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => setSelectedServiceGroup(grp)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '4px 12px',
                          borderRadius: '16px',
                          border: `1px solid ${themeStyles.border}`,
                          background: selectedServiceGroup === grp ? brandColor : themeStyles.bgSurface,
                          color: selectedServiceGroup === grp ? '#ffffff' : themeStyles.textMuted,
                          cursor: 'pointer',
                          fontWeight: selectedServiceGroup === grp ? 700 : 500,
                          transition: 'var(--transition)'
                        }}
                      >
                        {grp}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {filteredServices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', border: `1px dashed ${themeStyles.border}`, borderRadius: '12px' }}>
                  <p style={{ color: themeStyles.textMuted, fontSize: '0.88rem' }}>No services available under this group.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredServices.map((srv, idx) => (
                    <div key={idx} style={{
                      padding: '24px',
                      background: themeStyles.bgSurface,
                      border: `1px solid ${themeStyles.border}`,
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '24px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ flex: 1, minWidth: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.62rem', background: `${brandColor}15`, color: brandColor, border: `1px solid ${brandColor}30`, padding: '1px 6px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                            {srv.group || 'General'}
                          </span>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{srv.name}</h3>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: themeStyles.textMuted, margin: '6px 0 0 0', lineHeight: '1.4' }}>
                          {srv.description || 'Standard high-performing deliverables matching professional guidelines.'}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>${srv.rate_amount}</span>
                          <span style={{ fontSize: '0.72rem', color: themeStyles.textMuted, display: 'block' }}>
                            {srv.rate_type === 'hourly' ? '/ hr' : 'project fee'}
                          </span>
                        </div>
                        <a href="#contact" onClick={() => {
                          setProjectServiceType(srv.name);
                          if (inquiryStep === 3) setInquiryStep(2);
                        }} className="agency-btn-secondary btn btn-sm" style={{ padding: '8px 16px', borderRadius: '6px' }}>
                          Inquire
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Visual Portfolio: Case studies, metrics results, and media embeds */}
            {portfolio.length > 0 && (
              <div id="portfolio" style={{
                background: themeStyles.bgCard,
                backdropFilter: themeStyles.backdropFilter,
                border: `1px solid ${themeStyles.border}`,
                boxShadow: themeStyles.shadow,
                borderRadius: '16px',
                padding: '40px'
              }}>
                <div style={{ marginBottom: '28px' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Case Studies &amp; Outcomes</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: themeStyles.textMuted }}>Explore live technical productions, custom frameworks, and verified business results.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {portfolio.map((proj, idx) => {
                    const embedUrl = getVideoEmbedUrl(proj.media_embed);
                    return (
                      <div key={idx} style={{
                        border: proj.featured ? `2px solid ${brandSecondary}` : `1px solid ${themeStyles.border}`,
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: themeStyles.bgSurface,
                        boxShadow: proj.featured ? `0 0 20px ${brandSecondary}15` : 'none'
                      }}>
                        {/* Video Embed or Cover */}
                        {embedUrl && (
                          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', width: '100%' }}>
                            <iframe
                              src={embedUrl}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={proj.title}
                            ></iframe>
                          </div>
                        )}

                        <div style={{ padding: '24px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.62rem', background: `${brandSecondary}15`, color: brandSecondary, border: `1px solid ${brandSecondary}30`, padding: '2px 8px', borderRadius: '4px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Case Study
                              </span>
                              {proj.category && <span style={{ fontSize: '0.75rem', color: themeStyles.textSoft, fontWeight: 700 }}>{proj.category}</span>}
                            </div>
                            {proj.link && (
                              <a href={proj.link} target="_blank" rel="noopener noreferrer" style={{ color: brandColor, fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                                View Project Live ↗
                              </a>
                            )}
                          </div>

                          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>{proj.title}</h3>
                          <p style={{ fontSize: '0.88rem', color: themeStyles.textMuted, lineHeight: '1.5', margin: '0 0 16px 0' }}>
                            {proj.description || 'Verified production deliverable executed under strict customer guidelines.'}
                          </p>

                          {/* Results and details grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: proj.results ? '1.2fr 1fr' : '1fr',
                            gap: '16px',
                            background: themeStyles.bgCard,
                            border: `1px solid ${themeStyles.border}`,
                            borderRadius: '8px',
                            padding: '16px',
                            fontSize: '0.8rem'
                          }}>
                            <div>
                              <strong style={{ color: brandSecondary, display: 'block', marginBottom: '4px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>The Challenge &amp; Solution</strong>
                              <span style={{ color: themeStyles.textMuted }}>Implemented high-fidelity interfaces and custom backend controllers backed by strict milestones and reviews.</span>
                            </div>
                            {proj.results && (
                              <div style={{ borderLeft: proj.results ? `1px solid ${themeStyles.border}` : 'none', paddingLeft: proj.results ? '16px' : 0 }}>
                                <strong style={{ color: 'var(--success)', display: 'block', marginBottom: '4px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Business Impact</strong>
                                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--success)', display: 'block', margin: '2px 0' }}>{proj.results}</span>
                                <span style={{ color: themeStyles.textSoft, fontSize: '0.75rem' }}>Verified milestone metric.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Agency Team Presentation Section */}
            <div style={{
              background: themeStyles.bgCard,
              backdropFilter: themeStyles.backdropFilter,
              border: `1px solid ${themeStyles.border}`,
              boxShadow: themeStyles.shadow,
              borderRadius: '16px',
              padding: '40px'
            }}>
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Our Specialists</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: themeStyles.textMuted }}>
                  The dedicated professionals driving execution and milestone reviews in your portal workspace.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px'
              }}>
                {getTeamMembers(industry.slug, profile.name).map((member, idx) => (
                  <div key={idx} style={{
                    padding: '24px',
                    background: themeStyles.bgSurface,
                    border: `1px solid ${themeStyles.border}`,
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: idx === 0 
                          ? `linear-gradient(135deg, ${brandColor}, ${brandSecondary})` 
                          : `linear-gradient(135deg, ${brandSecondary}80, ${brandColor}80)`,
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem'
                      }}>
                        {member.initials}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: themeStyles.textMain }}>{member.name}</strong>
                        <span style={{ fontSize: '0.72rem', color: brandSecondary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{member.role}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: themeStyles.textMuted, lineHeight: '1.4', margin: 0 }}>
                      {member.bio}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            {testimonials.length > 0 && (
              <div style={{
                background: themeStyles.bgCard,
                backdropFilter: themeStyles.backdropFilter,
                border: `1px solid ${themeStyles.border}`,
                boxShadow: themeStyles.shadow,
                borderRadius: '16px',
                padding: '40px'
              }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>Client Endorsements</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {testimonials.map((test, idx) => (
                    <div key={idx} style={{ padding: '24px', background: themeStyles.bgSurface, border: `1px solid ${themeStyles.border}`, borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
                      <p style={{ fontStyle: 'italic', fontSize: '0.88rem', color: themeStyles.textMuted, lineHeight: '1.5', margin: '0 0 16px 0' }}>
                        &ldquo;{test.feedback || test.quote || 'Excellent service and delivery quality.'}&rdquo;
                      </p>
                      <div style={{ borderTop: `1px solid ${themeStyles.border}`, paddingTop: '12px' }}>
                        <strong style={{ display: 'block', fontSize: '0.85rem', color: themeStyles.textMain }}>{test.client_name}</strong>
                        <span style={{ fontSize: '0.75rem', color: themeStyles.textSoft }}>{test.client_project}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {faqItems.length > 0 && (
              <div style={{
                background: themeStyles.bgCard,
                backdropFilter: themeStyles.backdropFilter,
                border: `1px solid ${themeStyles.border}`,
                boxShadow: themeStyles.shadow,
                borderRadius: '16px',
                padding: '40px'
              }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>Frequently Asked Questions</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {faqItems.map((item, idx) => (
                    <div key={idx} style={{ border: `1px solid ${themeStyles.border}`, borderRadius: '8px', background: themeStyles.bgSurface, overflow: 'hidden' }}>
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
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          color: activeProfileFaq === idx ? brandColor : themeStyles.textMain
                        }}
                      >
                        <span>{item.question}</span>
                        <span style={{ fontSize: '1.1rem', color: themeStyles.textSoft }}>{activeProfileFaq === idx ? '−' : '+'}</span>
                      </button>
                      {activeProfileFaq === idx && (
                        <div style={{ padding: '0 20px 16px 20px', color: themeStyles.textMuted, fontSize: '0.8rem', lineHeight: '1.5', borderTop: `1px solid ${themeStyles.border}`, paddingTop: '12px' }}>
                          {item.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Availability & Sticky Contact Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'sticky', top: '100px' }}>
            
            {/* Parameters Block */}
            <div style={{
              background: themeStyles.bgCard,
              backdropFilter: themeStyles.backdropFilter,
              border: `1px solid ${themeStyles.border}`,
              boxShadow: themeStyles.shadow,
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: themeStyles.textMuted, fontSize: '0.8rem' }}>Availability</span>
                <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
                  {availabilityStatus}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: themeStyles.textMuted, fontSize: '0.8rem' }}>Response SLA</span>
                <span style={{ fontWeight: 700, color: themeStyles.textMain, fontSize: '0.8rem' }}>⚡ {responseTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: themeStyles.textMuted, fontSize: '0.8rem' }}>Starting Project</span>
                <span style={{ fontWeight: 800, color: brandColor, fontSize: '0.9rem' }}>{startingPrice}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: themeStyles.textMuted, fontSize: '0.8rem' }}>Location</span>
                <span style={{ fontWeight: 700, color: themeStyles.textMain, fontSize: '0.8rem' }}>{location}</span>
              </div>
            </div>

            {/* Sticky Multi-step Inquiry Form */}
            <div id="contact" style={{
              background: themeStyles.bgCard,
              backdropFilter: themeStyles.backdropFilter,
              border: `1px solid ${themeStyles.border}`,
              boxShadow: themeStyles.shadow,
              borderRadius: '16px',
              padding: '32px'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0 }}>Start Project Scoping</h3>
                  <span style={{ fontSize: '0.7rem', color: themeStyles.textSoft, fontWeight: 700 }}>Step {inquiryStep} of 3</span>
                </div>
                
                {/* Progress bar */}
                <div style={{ width: '100%', height: '4px', background: themeStyles.bgSurface, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${(inquiryStep / 3) * 100}%`, height: '100%', background: brandColor, transition: 'width 0.3s ease' }}></div>
                </div>
              </div>

              {/* Step 1: Info (Name, Email, Company) */}
              {inquiryStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.72rem', color: themeStyles.textMuted }}>Your Name</label>
                    <input
                      type="text"
                      className="form-input agency-input"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      style={{ background: themeStyles.formInputBg, borderColor: themeStyles.border }}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.72rem', color: themeStyles.textMuted }}>Business Email</label>
                    <input
                      type="email"
                      className="form-input agency-input"
                      value={clientEmail}
                      onChange={e => setClientEmail(e.target.value)}
                      placeholder="jane@company.com"
                      required
                      style={{ background: themeStyles.formInputBg, borderColor: themeStyles.border }}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.72rem', color: themeStyles.textMuted }}>Company / Organization</label>
                    <input
                      type="text"
                      className="form-input agency-input"
                      value={clientCompany}
                      onChange={e => setClientCompany(e.target.value)}
                      placeholder="Acme Corp"
                      style={{ background: themeStyles.formInputBg, borderColor: themeStyles.border }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!clientName || !clientEmail) {
                        setLeadFormError('Please enter your name and email.');
                        return;
                      }
                      if (!/^\S+@\S+\.\S+$/.test(clientEmail.trim())) {
                        setLeadFormError('Please enter a valid email.');
                        return;
                      }
                      setLeadFormError('');
                      setInquiryStep(2);
                    }}
                    className="agency-btn-primary btn"
                    style={{ width: '100%', padding: '12px', fontWeight: 700, marginTop: '8px' }}
                  >
                    Continue to Details →
                  </button>
                  
                  {leadFormError && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--danger)', display: 'block', textAlign: 'center' }}>{leadFormError}</span>
                  )}
                </div>
              )}

              {/* Step 2: Project (Budget, Timeline, Service, Description) */}
              {inquiryStep === 2 && (
                <form onSubmit={handleSubmitLead} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {leadFormError && (
                    <div style={{ padding: '8px 12px', background: 'var(--danger-glow)', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger-text)', fontSize: '0.75rem', fontWeight: 600 }}>
                      ⚠️ {leadFormError}
                    </div>
                  )}

                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.72rem', color: themeStyles.textMuted }}>Target Budget Range</label>
                    <select
                      className="form-select agency-input"
                      value={projectBudget}
                      onChange={e => setProjectBudget(e.target.value)}
                      required
                      style={{ background: themeStyles.formInputBg, borderColor: themeStyles.border }}
                    >
                      <option value="">Select budget...</option>
                      <option value="5k-10k">$5,000 - $10,000</option>
                      <option value="10k-25k">$10,000 - $25,000</option>
                      <option value="25k-50k">$25,000 - $50,000</option>
                      <option value="50k+">$50,000+</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.72rem', color: themeStyles.textMuted }}>Timeline Goal</label>
                    <select
                      className="form-select agency-input"
                      value={projectTimeline}
                      onChange={e => setProjectTimeline(e.target.value)}
                      required
                      style={{ background: themeStyles.formInputBg, borderColor: themeStyles.border }}
                    >
                      <option value="">Select timeline...</option>
                      <option value="urgent">Urgent (&lt; 1 month)</option>
                      <option value="medium">Standard (1 - 3 months)</option>
                      <option value="flexible">Flexible (3+ months)</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.72rem', color: themeStyles.textMuted }}>Primary Service Scoped</label>
                    <select
                      className="form-select agency-input"
                      value={projectServiceType}
                      onChange={e => setProjectServiceType(e.target.value)}
                      style={{ background: themeStyles.formInputBg, borderColor: themeStyles.border }}
                    >
                      <option value="">General Project Consultation</option>
                      {services.map((s, idx) => (
                        <option key={idx} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.72rem', color: themeStyles.textMuted }}>Brief Scope details</label>
                    <textarea
                      className="form-textarea agency-input"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Specify your core objectives or technical scope..."
                      required
                      style={{ minHeight: '80px', background: themeStyles.formInputBg, borderColor: themeStyles.border, lineHeight: '1.4' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setInquiryStep(1)}
                      className="agency-btn-secondary btn"
                      style={{ flex: 1, padding: '10px' }}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="agency-btn-primary btn"
                      style={{ flex: 2, padding: '10px', fontWeight: 700 }}
                    >
                      {isSubmitting ? 'Routing...' : 'Submit Inquiry ✓'}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Discovery Session Calendly Booking */}
              {inquiryStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.08)',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    border: '1px solid rgba(16, 185, 129, 0.15)'
                  }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Inquiry Submitted Successfully</h4>
                  
                  {calendlyLink ? (
                    <div>
                      <p style={{ fontSize: '0.8rem', color: themeStyles.textMuted, lineHeight: '1.5', marginBottom: '16px' }}>
                        Your project scoping parameters have been saved. Lock in a discovery session on our calendar below.
                      </p>
                      <iframe
                        src={`${calendlyLink}?hide_landing_page_details=1&primary_color=${brandColor.replace('#', '')}`}
                        style={{ width: '100%', height: '420px', border: 0, borderRadius: '8px', background: themeStyles.bgSurface }}
                      ></iframe>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.8rem', color: themeStyles.textMuted, lineHeight: '1.5' }}>
                        Your details have been successfully saved in our CRM system. Our engineering team will review the requirements and follow up within {responseTime || '24 hours'}.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setInquiryStep(1);
                      setClientName('');
                      setClientEmail('');
                      setClientCompany('');
                      setProjectBudget('');
                      setProjectTimeline('');
                      setProjectServiceType('');
                      setMessage('');
                      setSubmitSuccess(false);
                    }}
                    className="agency-btn-secondary btn btn-sm"
                    style={{ width: '100%', padding: '8px', fontSize: '0.75rem', marginTop: '12px' }}
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              )}
            </div>

            {/* Social channels card */}
            {profileConfig.showSocialLinks && (
              <div style={{
                background: themeStyles.bgCard,
                backdropFilter: themeStyles.backdropFilter,
                border: `1px solid ${themeStyles.border}`,
                boxShadow: themeStyles.shadow,
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: themeStyles.textMuted }}>Direct Channels</h4>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {socialLinks.website && (
                    <a href={socialLinks.website} target="_blank" rel="noopener noreferrer" className="agency-btn-secondary btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', textDecoration: 'none' }}>
                      🌐 Official Website
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a href={`https://linkedin.com/in/${socialLinks.linkedin}`} target="_blank" rel="noopener noreferrer" className="agency-btn-secondary btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', textDecoration: 'none' }}>
                      💼 LinkedIn
                    </a>
                  )}
                  {socialLinks.github && (
                    <a href={`https://github.com/${socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="agency-btn-secondary btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', textDecoration: 'none' }}>
                      💻 GitHub
                    </a>
                  )}
                  {socialLinks.twitter && (
                    <a href={`https://twitter.com/${socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="agency-btn-secondary btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', textDecoration: 'none' }}>
                      🐦 Twitter / X
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Agency Footer */}
        <footer style={{
          padding: '60px 24px',
          textAlign: 'center',
          borderTop: `1px solid ${themeStyles.border}`,
          backgroundColor: themeStyles.bgCard === '#ffffff' ? '#f8fafc' : '#080c14',
          marginTop: 'auto'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.8rem', color: themeStyles.textSoft, margin: 0 }}>
              © {new Date().getFullYear()} {profile.name || profile.username}. All rights reserved. Managed with secure Corvioz Workspaces.
            </p>
            {profileConfig.showPoweredByBadge && (
              <div style={{ marginTop: '8px' }}>
                <Link
                  href="/"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: themeStyles.textSoft,
                    background: themeStyles.bgSurface,
                    border: `1px solid ${themeStyles.border}`,
                    padding: '6px 14px',
                    borderRadius: '20px',
                    textDecoration: 'none'
                  }}
                >
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: brandColor }}></span>
                  Powered by Corvioz
                </Link>
              </div>
            )}
          </div>
        </footer>
      </div>
    );
  }

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

      {/* Bento Grid Layout */}
      <main style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '-80px auto 60px auto', padding: '0 24px', zIndex: 10 }}>
        <div className="bento-grid">
          
          {/* Card 1: Identity & Parameters (Sidebar Info) */}
          <div className="bento-item hover-glow" style={{ gridColumn: 'span 1', padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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

            {/* Name & Title */}
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '6px', color: 'var(--text-main)' }}>
              {profile.name || profile.username}
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '16px' }}>
              {profile.title || 'Independent Professional'}
            </p>

            {/* Rating row */}
            {testimonials.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginBottom: '20px', background: 'var(--btn-secondary-bg)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)', width: 'fit-content' }}>
                <span style={{ color: '#fbbf24', fontSize: '0.95rem', lineHeight: '1' }}>★</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>5.0</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({testimonials.length} review{testimonials.length > 1 ? 's' : ''})</span>
              </div>
            )}

            {/* Quick parameters */}
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
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <button 
                onClick={() => { setSelectedService(null); setShowQuoteModal(true); }}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Request Quote
              </button>
              {calendlyLink && (
                <a 
                  href={calendlyLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Schedule Call
                </a>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', width: '100%' }}>
                <button 
                  onClick={handleShareProfile}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, gap: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  Share
                </button>
                <button 
                  onClick={handleCopyLink}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, gap: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
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

          {/* Card 2: Bio & Value Proposition (spans 2 cols, bento-item-large) */}
          <div className="bento-item bento-item-large" style={{ gridColumn: 'span 2', padding: '36px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
            <div>
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
            
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Service Keywords
              </h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
                {serviceKeywords.map((keyword) => (
                  <span key={keyword} className="badge" style={{ backgroundColor: 'var(--btn-secondary-bg)', color: 'var(--text-muted)', borderColor: 'var(--border)', fontSize: '0.68rem' }}>
                    {keyword}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link href={quoteTemplateHref} className="btn btn-secondary btn-sm">View {industryName} Quote Template</Link>
                <Link href={invoiceTemplateHref} className="btn btn-secondary btn-sm">View {industryName} Invoice Template</Link>
              </div>
            </div>
          </div>

          {/* Card 3: Pricing & Core Services (spans 3 cols) */}
          {services.length === 0 ? (
            <div className="bento-item" style={{ gridColumn: 'span 3', padding: '36px', textAlign: 'center', border: '1px dashed var(--border)', background: 'var(--bg-card)', borderRadius: '12px' }}>
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="var(--text-soft)" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.6 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
              </svg>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-main)' }}>No Core Services Configured</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '18px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.45 }}>
                No active services have been published on this profile card yet. If you are the profile owner, you can manage your services list in your dashboard.
              </p>
              <Link href="/dashboard" className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
                ⚙️ Configure Services in Dashboard
              </Link>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '14px', marginBottom: 0 }}>
                ✨ Pro templates are loaded in your dashboard to help you publish services in seconds.
              </p>
            </div>
          ) : (
            <div className="bento-item" style={{ gridColumn: 'span 3', padding: '36px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px' }}>Pricing & Core Services</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {services.map((srv, idx) => (
                  <div key={idx} className="card hover-lift" style={{ padding: '28px', background: 'var(--bg-surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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

                      {/* Deliverables checklists */}
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

          {/* Card 4: Visual Portfolio & Case Studies (spans 2 cols, bento-item-large) */}
          {portfolio.length > 0 && (
            <div className="bento-item bento-item-large" style={{ gridColumn: 'span 2', padding: '36px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Visual Portfolio &amp; Case Studies</h2>
                {portfolioConfig.showTags && uniqueCategories.length > 1 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {uniqueCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          fontSize: '0.72rem',
                          padding: '4px 10px',
                          borderRadius: '16px',
                          border: '1px solid var(--border)',
                          background: selectedCategory === cat ? 'var(--primary)' : 'var(--btn-secondary-bg)',
                          color: selectedCategory === cat ? '#ffffff' : 'var(--text-soft)',
                          cursor: 'pointer',
                          fontWeight: selectedCategory === cat ? 700 : 500,
                          transition: 'var(--transition)'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {filteredPortfolio.map((proj, idx) => (
                  <div key={idx} className="card" style={{ 
                    padding: '24px', 
                    background: 'var(--bg-surface)', 
                    border: proj.featured ? '2px solid var(--accent)' : '1px solid var(--border)', 
                    borderRadius: '8px',
                    position: 'relative',
                    boxShadow: proj.featured ? 'var(--shadow-glow)' : 'none'
                  }}>
                    {proj.featured && (
                      <span style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '20px',
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '99px',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase'
                      }}>
                        ★ FEATURED WORK
                      </span>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="badge" style={{ fontSize: '0.65rem' }}>CASE STUDY</span>
                        {proj.category && <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)', fontWeight: 600 }}>{proj.category}</span>}
                        {!proj.category && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Selected Work</span>}
                      </div>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Launch Project ↗
                        </a>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px' }}>{proj.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
                      {proj.description || 'Selected project, deliverable, or client-facing work sample.'}
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

          {/* Card 5: Client Reviews & Star Ratings (spans 1 col) */}
          <div className="bento-item" style={{ gridColumn: 'span 1', padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.3px' }}>Client Reviews</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {testimonials.length > 0 ? (
                  testimonials.slice(0, 2).map((test, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '3px', color: '#fbbf24' }}>
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                        &ldquo;{test.quote || test.feedback || 'Outstanding support and design quality.'}&rdquo;
                      </p>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '4px' }}>
                        {test.name || test.client_name} &bull; <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{test.role || test.client_project}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <strong style={{ color: 'var(--text-soft)' }}>Verified Workspace</strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                      Client testimonials and verified case study references are available upon request.
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-soft)', lineHeight: '1.45', margin: '4px 0 0 0' }}>
                      Submit a project inquiry using the form below to connect directly with the freelancer.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 6: Profile FAQs (spans 2 cols, bento-item-large) */}
          <div className="bento-item bento-item-large" style={{ gridColumn: 'span 2', padding: '36px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.5px' }}>Common Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(faqItems.length > 0 ? faqItems.map((item) => ({ q: item.question, a: item.answer })) : [
                { q: 'What is your standard revision policy?', a: 'Most flat-fee projects include defined revision rounds. Additional alterations can be quoted separately.' },
                { q: 'How are project payments structured?', a: 'Payments are usually split into milestones such as deposit, prototype approval, and final delivery clearance.' },
                { q: 'How can clients request a quote?', a: 'Use the Request Quote CTA on this profile and include project details, timeline, and budget.' }
              ]).map((item, idx) => (
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

          {/* Card 7: Working & Payment Terms (spans 1 col) */}
          <div className="bento-item" style={{ 
            gridColumn: 'span 1', 
            padding: '32px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            border: '1px solid rgba(99, 102, 241, 0.12)', 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(6, 182, 212, 0.02) 100%)' 
          }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '14px', letterSpacing: '-0.3px' }}>Business Terms</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '18px' }}>
                All contracts are executed through secure milestones. Inbound inquiries will receive a formal project estimate within 24 hours.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Milestone Payouts</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>50 / 50 Standard</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Default Net Term</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Net 14 Days</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Revision Standard</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>2 Rounds Included</span>
                </div>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px', fontSize: '0.7rem', color: 'var(--text-soft)' }}>
              🔒 Managed & processed via Corvioz Secure Freelancer Workspaces.
            </div>
          </div>

          {/* Card 8: Lead Capture Form Bento Card (spans 3 cols) */}
          {['growth', 'studio'].includes(planTier) && (
            <div className="bento-item hover-glow" style={{ gridColumn: 'span 3', padding: '36px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Partner with Me</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Ready to build stable freelance outcomes? Submit your project details below to trigger our milestone discovery.
                </p>
              </div>

              {submitSuccess ? (
                <div style={{ textAlign: 'center', padding: '40px 0', border: '1px dashed var(--success)', borderRadius: '12px', background: 'var(--bg-surface)' }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '50%', 
                    background: 'rgba(16, 185, 129, 0.08)', 
                    color: 'var(--success)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    margin: '0 auto 16px auto',
                    border: '1px solid rgba(16, 185, 129, 0.15)'
                  }}>
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-main)' }}>Inquiry Successfully Sent</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    Thank you! Your details have been routed directly to my CRM pipeline. I'll get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitLead} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {leadFormError && (
                    <div style={{ padding: '10px 14px', background: 'var(--danger-glow)', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger-text)', fontSize: '0.8rem', fontWeight: 600 }}>
                      ⚠️ {leadFormError}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-soft)' }}>Your Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={clientName} 
                        onChange={e => setClientName(e.target.value)} 
                        placeholder="e.g. Pepper Potts" 
                        required 
                        style={{ background: 'var(--form-input-bg)', borderColor: 'var(--border)' }}
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-soft)' }}>Your Email</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        value={clientEmail} 
                        onChange={e => setClientEmail(e.target.value)} 
                        placeholder="e.g. pepper@stark.com" 
                        required 
                        style={{ background: 'var(--form-input-bg)', borderColor: 'var(--border)' }}
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-soft)' }}>Project Description & Scope</label>
                    <textarea 
                      className="form-textarea" 
                      value={message} 
                      onChange={e => setMessage(e.target.value)} 
                      placeholder="Describe your goals, requirements, estimated budget range, and timeline..."
                      required
                      style={{ minHeight: '120px', background: 'var(--form-input-bg)', borderColor: 'var(--border)', lineHeight: '1.5' }}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{ width: '100%', padding: '12px', fontWeight: 700, fontSize: '0.9rem' }}
                  >
                    {isSubmitting ? 'Sending inquiry...' : 'Send Inquiry to CRM'}
                  </button>
                </form>
              )}
            </div>
          )}

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
          backgroundColor: 'rgba(0,0,0,0.6)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000, 
          padding: '20px',
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card animate-fade-in" style={{ 
            maxWidth: '480px', 
            width: '100%', 
            padding: '32px', 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)', 
            borderRadius: '12px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                {selectedService ? `Request quote for ${selectedService.name}` : `Request a Quote`}
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
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Quote Request Submitted</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', margin: 0 }}>
                  Your quote request has been submitted. The freelancer will review the details and reply with a quote.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {leadFormError && (
                  <div style={{ padding: '10px 14px', background: 'var(--danger-glow)', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger-text)', fontSize: '0.8rem', fontWeight: 600 }}>
                    ⚠️ {leadFormError}
                  </div>
                )}
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
                  <label className="input-label" style={{ fontSize: '0.7rem' }}>Project Details & Timeline</label>
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
                  {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
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
          © {new Date().getFullYear()} {profile.name || profile.username}. Quotes and invoices managed with Corvioz.
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
            Powered by Corvioz
          </Link>
        </div>
      </footer>
      
      {/* Floating Growth Loop Badge */}
      {showFloatingBadge && (!profile.plan || profile.plan === 'free') && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 9999,
          maxWidth: '340px',
          animation: 'fade-in 0.3s ease-out'
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowFloatingBadge(false)} 
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '1rem',
                cursor: 'pointer',
                lineHeight: 1,
                padding: '2px'
              }}
              title="Dismiss"
            >
              &times;
            </button>
            
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                Want a page like this?
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>
                Build your own freelancer profile card & client portal in 5 minutes.
              </p>
              <Link 
                href="/" 
                style={{ 
                  display: 'inline-block', 
                  marginTop: '8px', 
                  fontSize: '0.72rem', 
                  fontWeight: 700, 
                  color: 'var(--primary-light)', 
                  textDecoration: 'none' 
                }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
