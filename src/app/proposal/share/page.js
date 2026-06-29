'use client';

// This is NOT a feature hierarchy system.
// This is a revenue track system.
// Each tier is an independent product experience.
// No cross-tier dependency is allowed.

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ShareProposalContent() {
  const searchParams = useSearchParams();
  const [proposal, setProposal] = useState(null);
  const [error, setError] = useState(false);
  const isWatermarked = searchParams.get('watermark') === 'true' || (proposal && proposal.watermark);

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const decodedJson = decodeURIComponent(atob(data));
        const parsed = JSON.parse(decodedJson);
        if (parsed && parsed.title) {
          setProposal(parsed);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error('Failed to decode proposal data:', e);
        setError(true);
      }
    } else {
      setError(true);
    }
  }, [searchParams]);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '440px', padding: '32px', textAlign: 'center', border: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '1.25rem', fontWeight: 800 }}>Proposal Link Invalid</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
            This shareable proposal link appears to be invalid or broken. Please ask the sender to generate and share a new link.
          </p>
          <Link href="/" className="btn btn-primary" style={{ display: 'block', width: '100%', textDecoration: 'none', textAlign: 'center' }}>
            Go to Corvioz Home
          </Link>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading shared document...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: 'system-ui, -apple-system, sans-serif', padding: isWatermarked ? '0 0 60px 0' : '60px 20px', position: 'relative' }}>
      
      {isWatermarked && (
        <div style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(90deg, #d97706 0%, #b45309 100%)',
          color: '#ffffff',
          padding: '12px 20px',
          textAlign: 'center',
          fontSize: '0.85rem',
          fontWeight: 700,
          zIndex: 1000,
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}>
          <span>⚠️ DRAFT PROPOSAL — Generated via Corvioz Starter Plan</span>
          <Link href="/pricing?checkout=growth" style={{ color: '#ffffff', textDecoration: 'underline', fontWeight: 800, marginLeft: '6px' }}>
            Remove watermark with Pro
          </Link>
        </div>
      )}

      <div style={{ 
        maxWidth: '800px', 
        margin: isWatermarked ? '40px auto' : '0 auto', 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '16px', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', 
        overflow: 'hidden',
        position: 'relative'
      }}>
        
        {isWatermarked && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 0,
            opacity: 0.04,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '120px',
            userSelect: 'none',
            paddingTop: '200px'
          }}>
            <div style={{ fontSize: '72px', fontWeight: 900, transform: 'rotate(-25deg)', whiteSpace: 'nowrap' }}>CORVIOZ STARTER</div>
            <div style={{ fontSize: '72px', fontWeight: 900, transform: 'rotate(-25deg)', whiteSpace: 'nowrap' }}>CORVIOZ STARTER</div>
            <div style={{ fontSize: '72px', fontWeight: 900, transform: 'rotate(-25deg)', whiteSpace: 'nowrap' }}>CORVIOZ STARTER</div>
            <div style={{ fontSize: '72px', fontWeight: 900, transform: 'rotate(-25deg)', whiteSpace: 'nowrap' }}>CORVIOZ STARTER</div>
          </div>
        )}
        
        {/* Color stripe top */}
        <div style={{ height: '8px', background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)', position: 'relative', zIndex: 1 }}></div>
        
        {/* Document Header */}
        <div style={{ padding: '48px 48px 32px 48px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Project Scope Proposal
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
            {proposal.title}
          </h1>
        </div>

        {/* Document Body */}
        <div style={{ padding: '48px', display: 'flex', flexDirection: 'column', gap: '36px', fontSize: '1rem', lineHeight: '1.7', color: '#334155' }}>
          
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
              Project Overview
            </h2>
            <div style={{ whiteSpace: 'pre-wrap' }}>{proposal.overview}</div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
              Scope of Work
            </h2>
            <div style={{ whiteSpace: 'pre-wrap' }}>{proposal.scope}</div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
              Timeline & Milestones
            </h2>
            <div style={{ whiteSpace: 'pre-wrap' }}>{proposal.timeline}</div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
              Key Deliverables
            </h2>
            <div style={{ whiteSpace: 'pre-wrap' }}>{proposal.deliverables}</div>
          </div>

          {proposal.pricing && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
                Pricing & Budget
              </h2>
              <div style={{ whiteSpace: 'pre-wrap' }}>{proposal.pricing}</div>
            </div>
          )}

          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
              Next Steps
            </h2>
            <div style={{ whiteSpace: 'pre-wrap' }}>{proposal.cta}</div>
          </div>

        </div>

        {/* Footer info & branding */}
        <div style={{ backgroundColor: '#f8fafc', padding: '32px 48px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
            ✨ Used by freelancers to win clients and get paid faster.
          </div>
          <Link 
            href="/dashboard?tool=proposal" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '0.9rem', 
              fontWeight: 700, 
              color: '#ffffff', 
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              padding: '12px 24px',
              borderRadius: '24px',
              boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
            }}
          >
            👉 Create your own proposal in 30 seconds
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function ShareProposalPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading shared document...</p>
      </div>
    }>
      <ShareProposalContent />
    </Suspense>
  );
}
