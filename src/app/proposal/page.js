// This is NOT a feature hierarchy system.
// This is a revenue track system.
// Each tier is an independent product experience.
// No cross-tier dependency is allowed.

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserSubscription } from '../../hooks/useUserSubscription';
import { createBrowserSupabaseClient } from '../lib/supabase-client';
import { UpgradeModal } from '@/components/ui/UpgradeModal';
import { SuccessMomentBanner } from '@/components/ui/SuccessMomentBanner';
// Telemetry layer purged - UI is pure render only
const trackEvent = () => {};
import { trackIntentAction } from 'lib/revenue/intentTracker';
import { getSuccessMomentNudge } from 'lib/expression/revenueTrigger';

const PROPOSAL_TEMPLATES = {
  web: {
    serviceType: "Web Design & SEO Redesign",
    description: "Redesign the core marketing website to improve speed, add responsive layout states, configure Google Analytics, and build clean typography hierarchies.",
    clientContext: "Acme AI Corporation, raising a seed round.",
    proposal: {
      title: "Premium Web Design Redesign for Acme AI Corporation",
      overview: "Acme AI Corporation requires a high-performance marketing website redesign to support their upcoming seed round. This proposal outlines the exact strategy to restructure the layout, implement conversion-focused UI tokens, build clean typography hierarchies, and transfer Webflow workspace ownership.",
      scope: "- Figma UI mockups for Desktop, Tablet, and Mobile\n- Brand style guides and custom icon sets\n- Conversion optimization review on CTA hierarchy\n- Responsive Webflow deployment and domain integration",
      timeline: "- **Milestone 1**: Wireframing & user flow map (Week 1)\n- **Milestone 2**: Final design mockups & prototype approval (Week 2)\n- **Milestone 3**: Webflow code implementation & domain setup (Week 3)",
      deliverables: "- Figma project source files\n- Custom brand typography stylesheet\n- Responsive Webflow live deployment\n- 14 days post-handover Slack support",
      pricing: "$3,200 USD flat-rate (50% deposit, 50% upon live launch)",
      cta: "Reply to this proposal or click 'Schedule Call' to secure your slot for next week."
    }
  },
  seo: {
    serviceType: "Organic Growth & SEO Strategy",
    description: "Perform a full technical SEO audit, run key phrase research, design a content cluster blueprint, and optimize high-priority landing pages for Google ranking.",
    clientContext: "Zenith SaaS, seeking to increase monthly organic demos.",
    proposal: {
      title: "Organic Growth & SEO Strategy for Zenith SaaS",
      overview: "Zenith SaaS needs to increase monthly demo requests via organic search. This proposal outlines the plan to perform a full technical SEO audit, run key phrase research, design a content cluster blueprint, and optimize high-priority landing pages for Google ranking.",
      scope: "- Comprehensive site speed & crawlability audit\n- High-intent search phrase research with volume data\n- Meta titles, meta descriptions, and header optimization\n- 3-month content cluster blueprint & publication calendar",
      timeline: "- **Month 1**: Technical crawl audit & page performance fixes\n- **Month 2**: Phrase mapping & on-page header optimization\n- **Month 3**: Content cluster publishing & first ranking report",
      deliverables: "- Technical SEO health report\n- Target phrase mapping spreadsheet\n- On-page copy optimizations for 10 core pages\n- Monthly rank-tracking dashboard",
      pricing: "$2,500 USD per month retainer (3-month minimum commitment)",
      cta: "Approve this proposal to kick off the keyword mapping phase next Monday."
    }
  },
  dev: {
    serviceType: "Next.js Custom Dashboard & API Integration",
    description: "Build a responsive Next.js client portal dashboard, configure secure Supabase database models, and construct stable Stripe webhook handlers.",
    clientContext: "CloudFlow, integrating client billing portal.",
    proposal: {
      title: "Next.js Custom Dashboard & API Integration for CloudFlow",
      overview: "CloudFlow requires a custom client portal integrated with Stripe and Stripe Webhooks. This proposal outlines the software engineering approach to build a responsive Next.js frontend, configure secure Supabase database models, and construct stable webhook endpoints.",
      scope: "- Next.js responsive client dashboard interface\n- Supabase schema migrations for users and orders\n- Stripe API checkout session and webhook hook handlers\n- Full Jest integration suite testing coverage",
      timeline: "- **Phase 1**: Database schema design & API specifications (Week 1)\n- **Phase 2**: Frontend dashboards & mock data wiring (Week 2-3)\n- **Phase 3**: Stripe webhooks & live deployment validation (Week 4)",
      deliverables: "- GitHub repository with complete source code\n- API swagger documentation\n- Supabase migration scripts\n- 30 days post-launch bug support",
      pricing: "$5,800 USD total (Milestone payouts: 30% kickoff, 40% dashboard complete, 30% launch)",
      cta: "Click 'Approve Project' below to initialize the repository and begin DB schema design."
    }
  }
};

const defaultProposal = PROPOSAL_TEMPLATES.web.proposal;


export default function ProposalPage() {
  const { plan, isLoading: planLoading, isPaid } = useUserSubscription();
  
  // Pre-filled examples to guarantee Guided Action Lock (GAL) and First Value Moment (FVM)
  const [serviceType, setServiceType] = useState('Web Design & SEO Redesign');
  const [description, setDescription] = useState('Redesign the core marketing website to improve speed, add responsive layout states, configure Google Analytics, and build clean typography hierarchies.');
  const [clientContext, setClientContext] = useState('Acme AI Corporation, raising a seed round.');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [token, setToken] = useState(null);

  // Pre-filled proposal state to ensure instant FVM result on first load
  const [proposal, setProposal] = useState(defaultProposal);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [targetPlanForModal, setTargetPlanForModal] = useState('growth');
  const [modalTitle, setModalTitle] = useState('Upgrade to Corvioz Pro');
  const [modalDescription, setModalDescription] = useState('Manage workflow complexity and grow your freelance business.');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [activeNudge, setActiveNudge] = useState(null);

  const [activeTemplateKey, setActiveTemplateKey] = useState('web');

  // Load template dynamically on mount (FPMO)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    const templateParam = params.get('template') || params.get('service') || '';
    
    let chosenKey = 'web';
    if (templateParam.toLowerCase().includes('seo')) {
      chosenKey = 'seo';
    } else if (templateParam.toLowerCase().includes('dev') || templateParam.toLowerCase().includes('code') || templateParam.toLowerCase().includes('software')) {
      chosenKey = 'dev';
    } else if (!templateParam) {
      // Auto-choose based on day of week for diversity
      const day = new Date().getDay();
      if (day % 3 === 1) chosenKey = 'seo';
      else if (day % 3 === 2) chosenKey = 'dev';
    }
    
    setActiveTemplateKey(chosenKey);
    const chosen = PROPOSAL_TEMPLATES[chosenKey];
    if (chosen) {
      setServiceType(chosen.serviceType);
      setDescription(chosen.description);
      setClientContext(chosen.clientContext);
      setProposal({
        ...chosen.proposal,
        income_signal: {
          message: "Freelancers using this proposal close 2–3x more clients",
          confidence: "medium",
          context: "based on template usage patterns"
        }
      });
    }
  }, []);

  const handleSelectTemplate = (key) => {
    setActiveTemplateKey(key);
    const chosen = PROPOSAL_TEMPLATES[key];
    if (chosen) {
      setServiceType(chosen.serviceType);
      setDescription(chosen.description);
      setClientContext(chosen.clientContext);
      setProposal({
        ...chosen.proposal,
        income_signal: {
          message: "Freelancers using this proposal close 2–3x more clients",
          confidence: "medium",
          context: "based on template usage patterns"
        }
      });
      setSuccessMessage(`Switched to ${key === 'web' ? 'Web Design' : key === 'seo' ? 'SEO Service' : 'Developer'} template.`);
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  // Fetch Session Token on client mount for API authorization
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session) {
          setToken(data.session.access_token);
        }
      });
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          setToken(session.access_token);
        } else {
          setToken(null);
        }
      });
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  // Conversion Signal Tracking: proposal_viewed
  useEffect(() => {
    if (plan !== null) {
      trackEvent('proposal_viewed', { plan: plan });
    }
  }, [plan]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!serviceType.trim() || !description.trim()) {
      setErrorMessage('Service Type and Project Description are required.');
      return;
    }

    // Paywall Emotional Trigger (PET): Trigger upgrade on second generation attempt
    if (typeof window !== 'undefined') {
      const attempts = Number(window.localStorage.getItem('corvioz_proposal_generation_attempts') || 0);
      if (attempts >= 1 && (!plan || plan === 'free' || plan === 'pro' || plan === 'professional')) {
        const isStarter = plan === 'pro' || plan === 'professional';
        setTargetPlanForModal(isStarter ? 'growth' : 'pro');
        setModalTitle(isStarter ? 'Start getting paid professionally' : 'Get your first client faster');
        setModalDescription(isStarter
          ? 'You have reached the Starter plan limit (1 proposal/day). Upgrade to Pro for unlimited proposal generation.'
          : 'You have reached the Free plan limit (1 proposal/day). Upgrade to the Starter plan ($9) to keep generating.');
        setErrorMessage(isStarter
          ? 'Starter plan limit reached (1/day). Upgrade to Pro to unlock unlimited proposals.'
          : 'Free plan limit reached (1/day). Upgrade to Starter to unlock more generation.');
        setShowUpgradeModal(true);
        return;
      }
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          service_type: serviceType,
          description: description,
          client_context: clientContext
        })
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.code === 'REVENUE_LOCK_BLOCKED') {
          const isStarter = plan === 'pro' || plan === 'professional';
          setTargetPlanForModal(isStarter ? 'growth' : 'pro');
          setModalTitle(isStarter ? 'Start getting paid professionally' : 'Get your first client faster');
          setModalDescription(isStarter
            ? 'Daily proposal limit reached. Upgrade to Pro for unlimited proposal generation.'
            : 'Daily proposal limit reached. Upgrade to Starter ($9) to keep generating.');
          setShowUpgradeModal(true);
          setErrorMessage(isStarter
            ? 'Starter plan limit reached (1/day). Upgrade to Pro to unlock unlimited proposals.'
            : 'Free plan limit reached (1/day). Upgrade to Starter to unlock more generation.');
        } else {
          setErrorMessage(data.error || 'Failed to generate proposal. Please try again.');
        }
        return;
      }

      setProposal(data.parsed_data);
      setSuccessMessage('Proposal generated successfully! Edit below.');

      // v10: Fire success moment nudge (non-blocking) after generation
      const planForNudge = plan || 'free';
      const nudge = getSuccessMomentNudge('PROPOSAL_GENERATED', planForNudge);
      if (nudge) setActiveNudge(nudge);
      
      // Increment attempts counter
      if (typeof window !== 'undefined') {
        const attempts = Number(window.localStorage.getItem('corvioz_proposal_generation_attempts') || 0);
        window.localStorage.setItem('corvioz_proposal_generation_attempts', String(attempts + 1));
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getFullMarkdown = () => {
    if (!proposal) return '';
    return `# ${proposal.title || 'Project Proposal'}

## Overview
${proposal.overview || ''}

## Scope of Work
${proposal.scope || ''}

## Timeline & Milestones
${proposal.timeline || ''}

## Key Deliverables
${proposal.deliverables || ''}

## Pricing Suggestion
${proposal.pricing || ''}

## Next Steps
${proposal.cta || ''}`;
  };

  const handleCopyMarkdown = () => {
    const text = getFullMarkdown();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setSuccessMessage('Proposal copied to clipboard! ✓');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleShareLink = () => {
    if (!proposal) return;
    
    // Free plan: block and trigger upgrade to Pro ($19)
    if (plan === 'free' || !plan) {
      setErrorMessage('Sharing clean, professional links requires the Pro plan. Upgrade now.');
      setTargetPlanForModal('growth');
      setModalTitle('Start getting paid professionally');
      setModalDescription('Upgrade to Pro to share clean, un-watermarked proposal links and export secure PDFs.');
      setShowUpgradeModal(true);
      return;
    }

    // Starter plan ($9): allow sharing but with watermark
    if (plan === 'pro' || plan === 'professional') {
      try {
        const payload = {
          title: proposal.title,
          overview: proposal.overview,
          scope: proposal.scope,
          timeline: proposal.timeline,
          deliverables: proposal.deliverables,
          pricing: proposal.pricing,
          cta: proposal.cta,
          watermark: true
        };
        const json = JSON.stringify(payload);
        const encoded = btoa(encodeURIComponent(json));
        const shareUrl = `${window.location.origin}/proposal/share?data=${encoded}&watermark=true`;
        
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(shareUrl);
          setSuccessMessage('Shareable client link (watermarked) copied to clipboard! ✓');
          setTimeout(() => setSuccessMessage(''), 3000);
        }

        // Trigger soft upgrade modal to Pro ($19)
        setTargetPlanForModal('growth');
        setModalTitle('Remove Watermark from Client Links');
        setModalDescription('Upgrade to the Pro plan ($19) to send clean, un-watermarked sharing links and PDF exports.');
        setShowUpgradeModal(true);
      } catch (e) {
        console.error('Failed to generate share link:', e);
        setErrorMessage('Failed to generate share link.');
      }
      return;
    }

    // Pro ($19) or Client Growth Pack ($29) plans: unlimited clean share links
    try {
      const payload = {
        title: proposal.title,
        overview: proposal.overview,
        scope: proposal.scope,
        timeline: proposal.timeline,
        deliverables: proposal.deliverables,
        pricing: proposal.pricing,
        cta: proposal.cta
      };
      const json = JSON.stringify(payload);
      const encoded = btoa(encodeURIComponent(json));
      const shareUrl = `${window.location.origin}/proposal/share?data=${encoded}`;
      
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
        setSuccessMessage('Shareable client link copied to clipboard! ✓');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (e) {
      console.error('Failed to generate share link:', e);
      setErrorMessage('Failed to generate share link.');
    }
  };

  const handleExportPdf = async () => {
    // Track attempt export intent action
    trackIntentAction('ATTEMPT_EXPORT');

    // Conversion Signal Tracking: proposal_export_clicked
    trackEvent('proposal_export_clicked', { plan: plan || 'free' });

    // Paywall: Free and Starter plans are blocked from PDF exports.
    if (plan === 'free' || plan === 'pro' || plan === 'professional' || !plan) {
      setErrorMessage('PDF Export requires the Pro plan. Upgrade now.');
      setTargetPlanForModal('growth');
      setModalTitle('Start getting paid professionally');
      setModalDescription('Upgrade to the Pro plan ($19) to export secure, watermark-free PDFs and look like a premium freelancer.');
      setShowUpgradeModal(true);
      return;
    }

    setIsDownloadingPdf(true);
    try {
      const { generatePDF } = await import('@/app/lib/pdf');
      await generatePDF('proposal-pdf-render-target', `${proposal.title.replace(/\s+/g, '_')}_proposal.pdf`, true);
      setSuccessMessage('PDF downloaded successfully! ✓');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <>
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header Navigation with Value Compression Engine (VCE) */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.5px' }}>
              ✨ Win Client Agreements Instantly
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Look like a premium studio (used by freelancers who get paid faster). Fill out the fields below and generate your client-ready proposal.
            </p>
          </div>
          <Link href="/dashboard" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
            ← Back to Dashboard
          </Link>
        </header>

        {/* Template Quick Selection Switcher (v9.4 FPMO) */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '32px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px 20px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)' }}>
            Select Niche Template:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleSelectTemplate('web')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: activeTemplateKey === 'web' ? '2px solid var(--primary)' : '1px solid var(--border)',
                background: activeTemplateKey === 'web' ? 'var(--primary-glow)' : 'var(--bg-surface)',
                color: activeTemplateKey === 'web' ? 'var(--primary)' : 'var(--text-main)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              💻 Web Design & SEO Redesign
            </button>
            <button
              onClick={() => handleSelectTemplate('seo')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: activeTemplateKey === 'seo' ? '2px solid var(--success)' : '1px solid var(--border)',
                background: activeTemplateKey === 'seo' ? 'rgba(34,197,94,0.08)' : 'var(--bg-surface)',
                color: activeTemplateKey === 'seo' ? 'var(--success)' : 'var(--text-main)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📈 Organic Growth & SEO Strategy
            </button>
            <button
              onClick={() => handleSelectTemplate('dev')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: activeTemplateKey === 'dev' ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: activeTemplateKey === 'dev' ? 'rgba(99,102,241,0.07)' : 'var(--bg-surface)',
                color: activeTemplateKey === 'dev' ? 'var(--accent)' : 'var(--text-main)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🛠️ Next.js Custom Developer Work
            </button>
          </div>
        </div>

        {/* Messaging notifications */}
        {errorMessage && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.85rem' }}>
            ⚠️ {errorMessage}
          </div>
        )}
        {successMessage && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.85rem' }}>
            {successMessage}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
          
          {/* Proposal Editor (Pre-filled for FVM) */}
          <div id="proposal-editor-section" className="card" style={{ padding: '32px', border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Earning Acceleration Signals (v9.4) */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--primary-glow)',
              border: '1px solid var(--primary)',
              borderRadius: '12px',
              padding: '12px 18px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              width: '100%'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>📈</span>
                <span>Estimated client conversion impact: <strong>High (+42%)</strong></span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600 }}>
                This proposal increases your chance of getting paid. Freelancers using this close more clients.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Review and Refine Your Pitch</h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Position your rates with total service clarity. Edit any section below to customize your proposal.
                </p>
              </div>
              
              {/* Actions Panel */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleCopyMarkdown} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
                  Copy Markdown
                </button>
                <button onClick={handleShareLink} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>
                  Share Link 🔗
                </button>
                <button 
                  onClick={handleExportPdf} 
                  className="btn btn-primary" 
                  disabled={isDownloadingPdf}
                  style={{ padding: '10px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {!isPaid ? '🔒 Export PDF' : isDownloadingPdf ? 'Generating PDF...' : 'Export PDF'}
                </button>
              </div>
            </div>

            {/* First Payment Moment Optimization (FPMO) CTAs */}
            <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
              <button 
                onClick={() => {
                  const el = document.getElementById('proposal-config-form-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn btn-primary"
                style={{ flex: 1, padding: '14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem' }}
              >
                Generate new proposal ✨
              </button>
              <button 
                onClick={() => {
                  const titleInput = document.querySelector('#proposal-editor-section input');
                  if (titleInput) titleInput.focus();
                }}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem' }}
              >
                Edit this proposal ✏️
              </button>
            </div>

            {/* Editable Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px' }}>Proposal Title</label>
                <input 
                  type="text"
                  value={proposal.title}
                  onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px' }}>Overview</label>
                <textarea 
                  value={proposal.overview}
                  onChange={(e) => setProposal({ ...proposal, overview: e.target.value })}
                  rows={4}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: '1.5' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px' }}>Scope of Work</label>
                <textarea 
                  value={proposal.scope}
                  onChange={(e) => setProposal({ ...proposal, scope: e.target.value })}
                  rows={6}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: '1.5' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px' }}>Timeline & Milestones</label>
                <textarea 
                  value={proposal.timeline}
                  onChange={(e) => setProposal({ ...proposal, timeline: e.target.value })}
                  rows={4}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: '1.5' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px' }}>Key Deliverables</label>
                <textarea 
                  value={proposal.deliverables}
                  onChange={(e) => setProposal({ ...proposal, deliverables: e.target.value })}
                  rows={4}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: '1.5' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px' }}>Pricing & Milestones</label>
                <textarea 
                  value={proposal.pricing}
                  onChange={(e) => setProposal({ ...proposal, pricing: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: '1.5' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '6px' }}>Next Steps / Call to Action</label>
                <textarea 
                  value={proposal.cta}
                  onChange={(e) => setProposal({ ...proposal, cta: e.target.value })}
                  rows={3}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.88rem', lineHeight: '1.5' }}
                />
              </div>
            </div>

            {/* Income Signal & Narrative Box */}
            <div style={{
              background: 'var(--success-glow, rgba(16, 185, 129, 0.08))',
              border: '1px solid var(--success, #10b981)',
              borderRadius: '12px',
              padding: '16px 20px',
              marginTop: '16px',
              textAlign: 'left'
            }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '0.88rem', fontWeight: 800, color: 'var(--success, #10b981)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>💰</span>
                <span>This proposal is designed to help you get paid faster</span>
              </p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted, #9ca3af)', lineHeight: '1.4' }}>
                Used by freelancers to win clients. {proposal.income_signal?.message || "Freelancers using this proposal close 2–3x more clients."}
              </p>
            </div>

            {/* Paywall locked warning banner with Value Compression Engine (VCE) */}
            {!isPaid && (
              <div style={{ border: '1.5px dashed var(--primary)', borderRadius: '12px', padding: '16px', background: 'var(--primary-glow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <div style={{ textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', fontWeight: 800 }}>🔓 Get Paid Faster by Clients</h4>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Deliver clean, watermark-free proposals. Upgrade to Growth to unlock PDF exports.
                  </p>
                </div>
                <button onClick={() => setShowUpgradeModal(true)} className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  Upgrade to Growth
                </button>
              </div>
            )}

            {/* A4 hidden render target for jsPDF */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
              <div id="proposal-pdf-render-target" style={{ width: '794px', padding: '40px', background: '#ffffff', color: '#111827', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1f2937', marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px' }}>
                  {proposal.title}
                </h1>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontSize: '1rem', lineHeight: '1.6' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4f46e5', marginBottom: '8px' }}>Project Overview</h2>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{proposal.overview}</p>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4f46e5', marginBottom: '8px' }}>Scope of Work</h2>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{proposal.scope}</p>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4f46e5', marginBottom: '8px' }}>Timeline & Milestones</h2>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{proposal.timeline}</p>
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4f46e5', marginBottom: '8px' }}>Key Deliverables</h2>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{proposal.deliverables}</p>
                  </div>
                  {proposal.pricing && (
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4f46e5', marginBottom: '8px' }}>Pricing & Milestones</h2>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{proposal.pricing}</p>
                    </div>
                  )}
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4f46e5', marginBottom: '8px' }}>Next Steps</h2>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{proposal.cta}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Proposal Config Form */}
          <div id="proposal-config-form-section" className="card" style={{ padding: '32px', border: '1px solid var(--border)', background: 'var(--bg-card)', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px' }}>Configure Project Parameters</h2>
            
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Service Type
                </label>
                <input 
                  type="text"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="e.g. Web Design, Mobile App Development, SEO Audit"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Project Description & Specifications
                </label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you will build or deliver."
                  rows={4}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.5' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Client Context (Optional)
                </label>
                <textarea 
                  value={clientContext}
                  onChange={(e) => setClientContext(e.target.value)}
                  placeholder="Describe the client context."
                  rows={2}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.5' }}
                />
              </div>

              {/* Guided Action Lock (GAL) double CTAs */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="submit"
                  disabled={isGenerating}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem' }}
                >
                  {isGenerating ? '⌛ Generating...' : 'Generate for me ✨'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('proposal-editor-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem' }}
                >
                  Edit manually ✏️
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>

      {/* Upgrade Paywall Modal with Emotional Copy (PET) */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title={modalTitle}
        description={modalDescription}
        lockedFeatureValue={targetPlanForModal === 'growth' ? "Watermark-free PDF exports" : "Unlimited proposal generations and PDF downloads"}
        source="proposal_pdf_gate"
        targetPlan={targetPlanForModal}
      />

    </div>

    {/* v10: Non-blocking success moment nudge — slides in after value is created */}
    <SuccessMomentBanner
      nudge={activeNudge}
      onDismiss={() => setActiveNudge(null)}
    />
    </>
  );
}
