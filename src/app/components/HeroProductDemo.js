'use client';

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Check } from 'lucide-react';
import { HERO_DEMO_PHASES, resolveHeroDemoPhase } from '../../core/ui/v4/HERO_DEMO_STATE_MACHINE';

const PHASE_ORDER = {
  idle: 0,
  sent: 1,
  reviewing: 2,
  approved: 3,
  handoff: 4,
  invoice: 5,
  complete: 6,
};

export function resolveHeroDemoFrame(elapsedMs) {
  return { phase: resolveHeroDemoPhase(elapsedMs), elapsedMs };
}


function useMediaQuery(queryString) {
  const subscribe = (onChange) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const query = window.matchMedia(queryString);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  };
  const getSnapshot = () => (
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(queryString).matches
      : false
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

function QuoteDocument({ phase }) {
  const phaseIndex = PHASE_ORDER[phase];
  let status = 'Ready to send';
  let meta = 'Prepared for Northline Studio';
  let statusClass = 'neutral';

  if (phaseIndex >= PHASE_ORDER.approved) {
    status = 'Accepted by client';
    meta = 'Aug 1 · 11:08';
    statusClass = 'success';
  } else if (phaseIndex >= PHASE_ORDER.reviewing) {
    status = 'Client reviewing';
    meta = 'Opened Aug 1 · 10:51';
    statusClass = 'active';
  } else if (phaseIndex >= PHASE_ORDER.sent) {
    status = 'Sent to Northline Studio';
    meta = 'Aug 1 · 10:42';
    statusClass = 'active';
  }

  return (
    <article className="hero-handoff-document hero-handoff-quote" aria-label="Quote Q-2048">
      <div className="hero-handoff-doc-head">
        <div>
          <span className="hero-handoff-doc-type">Quote</span>
          <strong>Q-2048</strong>
        </div>
        <span className="hero-handoff-doc-total">$4,800</span>
      </div>

      <div className="hero-handoff-doc-title">
        <h3>Northline Brand Campaign</h3>
        <p>Commercial photo shoot and licensing</p>
      </div>

      <dl className="hero-handoff-doc-grid">
        <div><dt>Shoot day</dt><dd>1</dd></div>
        <div><dt>Final images</dt><dd>12</dd></div>
        <div><dt>Usage term</dt><dd>12 months</dd></div>
      </dl>

      <div key={status} className={`hero-handoff-status hero-handoff-status--${statusClass}`} aria-live="polite">
        {statusClass === 'success' && <Check size={15} strokeWidth={2.5} aria-hidden="true" />}
        <div>
          <strong>{status}</strong>
          <span>{meta}</span>
        </div>
      </div>
    </article>
  );
}

function InvoiceDocument() {
  return (
    <article className="hero-handoff-document hero-handoff-invoice" aria-label="Invoice I-2048">
      <div className="hero-handoff-doc-head hero-handoff-reveal hero-handoff-reveal--1">
        <div>
          <span className="hero-handoff-doc-type">Invoice</span>
          <strong>I-2048</strong>
        </div>
        <span className="hero-handoff-doc-total">$4,800</span>
      </div>

      <div className="hero-handoff-origin hero-handoff-reveal hero-handoff-reveal--2">
        <Check size={14} strokeWidth={2.5} aria-hidden="true" />
        Based on approved quote Q-2048
      </div>

      <div className="hero-handoff-doc-title hero-handoff-reveal hero-handoff-reveal--3">
        <h3>Northline Brand Campaign</h3>
        <p>Prepared for Northline Studio</p>
      </div>

      <div className="hero-handoff-invoice-lines hero-handoff-reveal hero-handoff-reveal--3">
        <span>Commercial photo shoot</span><strong>$3,600</strong>
        <span>Licensing and retouching</span><strong>$1,200</strong>
      </div>

      <div className="hero-handoff-status hero-handoff-status--ready hero-handoff-reveal hero-handoff-reveal--4">
        <div>
          <strong>Invoice ready</strong>
          <span>Review before issuing</span>
        </div>
      </div>
    </article>
  );
}

export default function HeroProductDemo({ className = '' }) {
  const rootRef = useRef(null);
  const timersRef = useRef([]);
  const hasPlayedRef = useRef(false);
  const [phase, setPhase] = useState('idle');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const renderedPhase = prefersReducedMotion ? 'complete' : phase;

  useEffect(() => {
    if (prefersReducedMotion) {
      hasPlayedRef.current = true;
      return undefined;
    }

    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;

    const start = () => {
      if (hasPlayedRef.current) return;
      hasPlayedRef.current = true;

      HERO_DEMO_PHASES.slice(1).forEach(({ at, state: nextPhase }) => {
        timersRef.current.push(window.setTimeout(() => setPhase(nextPhase), at));
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.45)) {
          start();
          observer.disconnect();
        }
      },
      { threshold: [0.45], rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(root);

    return () => {
      observer.disconnect();
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current = [];
    };
  }, [prefersReducedMotion]);

  return (
    <div
      ref={rootRef}
      className={['hero-handoff', className].filter(Boolean).join(' ')}
      data-phase={renderedPhase}
    >
      <div className="hero-handoff-context">
        <span>Project record</span>
        <strong>Northline Brand Campaign</strong>
      </div>

      <div className="hero-handoff-stage">
        <InvoiceDocument />
        <QuoteDocument phase={renderedPhase} />
      </div>

      <p className="hero-handoff-caption">
        Quote sent <span>→</span> Client approved <span>→</span> Invoice ready
      </p>
    </div>
  );
}
