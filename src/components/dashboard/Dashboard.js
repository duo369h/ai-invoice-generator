'use client';

/*
CORVIOZ SYSTEM LOCK v1
UI = render only
Event Pipeline = fact only
Analytics = transport only
Backend = storage only
Intelligence = offline only
NO CROSS-LAYER LOGIC ALLOWED
NO BUSINESS INFERENCE IN RUNTIME
// V3_REVENUE_EXECUTION_LAYER_READY
// V3_MONETIZATION_CONTROLLER_READY
// V3_FEATURE_GATE_LAYER_READY
// V3_REVENUE_DECISION_STABILIZATION_LAYER_READY
// V3_CONTEXT_ENGINE_READY
// V3_CONFLICT_RESOLVER_READY
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/app/lib/supabase-client';


import { getSupportEmail } from '@/app/lib/config';
import { Logo, Button, Container } from '@/app/components/UIComponents';
import { CorviozKernel } from 'lib/kernel/corviozKernel';
import { UpgradeModal } from '../ui/UpgradeModal';
import { ExportRestrictionModal } from '../ui/ExportRestrictionModal';
import { PricingUpsellModal } from '../ui/PricingUpsellModal';
import { PricingRedirectOverlay } from '../ui/PricingRedirectOverlay';
import { UpgradeBanner } from '../ui/UpgradeBanner';

import DashboardOverview from '@/app/dashboard/components/DashboardOverview';
import StudioSpace from '@/app/dashboard/components/StudioSpace';
// Telemetry layer purged - UI is pure render only
const trackEvent = () => {};
const setAnalyticsUserId = () => {};
const clearAnalyticsUserId = () => {};
import { clearConversionIntent, saveIntendedRoute, saveSelectedPlan } from '@/app/lib/intent-store';
import { getUserEntitlements } from 'lib/entitlements';
import { sendEvent } from '../../core/analytics/eventRouter';


// Import design system hooks, tokens, and icons
import { useDashboardData } from '@/hooks/useDashboardData';
import { claimAndEmitFirstActivation } from '@/hooks/dashboard-document-save';
import useDashboardMode from '@/hooks/useDashboardMode';
import { useRevenueAction } from '@/hooks/useRevenueAction';

import { Icons } from '@/styles/icons';
import { ENTRY_AUTHORITY, applyEntryRouteTransition } from '../../core/entry/ENTRY_AUTHORITY';
import {
  buildFirstQuoteActivationEvent,
  shouldBypassOnboardingForFirstQuote,
} from '../../core/entry/first-quote-flow';
import { reconcileEntryState } from '../../core/entry/ENTRY_STATE_RECONCILER';
import { resolveRevenueEntry } from '../../core/entry/ENTRY_REVENUE_RESOLVER';
import {
  DASHBOARD_ENTITLEMENT_STATUS,
  EMPTY_DASHBOARD_ENTITLEMENTS,
  buildDashboardEntitlementState,
  getDashboardPdfExportDecision,
  mapEntitlementRecord,
  resolveDashboardEntitlements,
} from '../../core/state/dashboardEntitlementState';
import {
  isEntryIntendedAction,
  isEntrySelectedPlan,
  readEntryRevenueContext,
  updateEntryRevenueContext,
} from '../../core/entry/ENTRY_REVENUE_CONTEXT';
import {
  PHOTOGRAPHY_WORKFLOW_TEMPLATES,
  getPhotographyWorkflowTemplateById,
} from '../../core/quotes/photographyWorkflowTemplates';
import { buildPhotographyPreSendReview } from '../../core/quotes/photographyQuoteReview';
import {
  buildPhotographySemanticReviewInput,
} from '../../core/intelligence/photographySemanticReviewInput';
import { mergePhotographyReviewFindings } from '../../core/intelligence/semanticReviewContract';
import {
  createEmptyPhotographyScope,
  derivePhotographyVertical,
  normalizePhotographyScope,
  setPhotographyUsageRightsStatus,
  updatePhotographyScopeField,
} from '../../core/quotes/photographyQuoteScope';
import {
  buildQuoteProvenanceForSave,
  createLeadQuoteProvenance,
} from '../../core/quotes/quoteProvenance.js';
import { getDashboardTabForTool as getWave1DashboardTabForTool, getDashboardRouteForTab } from './dashboardWave1.mjs';
import { deserializeQuoteNotes as deserializeInvoiceNotes, serializeQuoteNotes as serializeInvoiceNotes } from './quoteNotes.mjs';
import { getClientDocumentContinuity, getEffectiveDocumentTimestamp } from './clientDocumentContinuity.mjs';
import { hasRecordedInvoicePayment, paymentStatusForInvoice } from '../../core/revenue/invoicePaymentState.js';
import QuoteClientDocument from './QuoteClientDocument';
import QuoteClientDocumentPreviewFrame from './QuoteClientDocumentPreviewFrame';
import QuotePresentationBoundary from './QuotePresentationBoundary';
import { createQuoteEditorSharedContract, QuoteEditorSharedProvider, validateQuoteClient } from './QuoteEditorSharedContext';
import { calculateQuoteTotals } from './quoteTotals';

// Helper functions for random generation to maintain purity in render
const generateRandomNumberString = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
const generateMockId = () => 'mock-' + Date.now();
const getMockDateString = () => new Date().toISOString();
const DASHBOARD_SIDEBAR_STORAGE_KEY = 'corvioz_dashboard_sidebar_collapsed';
const TERMINAL_QUOTE_STATUSES = new Set(['approved', 'declined', 'converted']);
const isDevelopment = process.env.NODE_ENV === 'development';
const DASHBOARD_DATE_LOCALE = 'en-CA';
const DASHBOARD_MONEY_LOCALE = 'en-CA';
const DASHBOARD_DATE_ENTRY_PATTERN = '\\d{4}-\\d{2}-\\d{2}';

const formatDashboardDate = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const dateOnlyMatch = raw.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
  const date = dateOnlyMatch
    ? new Date(Date.UTC(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3])))
    : new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(DASHBOARD_DATE_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

const formatDashboardTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(DASHBOARD_DATE_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(date);
};

const formatDashboardNumber = (value) => new Intl.NumberFormat(DASHBOARD_MONEY_LOCALE).format(Number(value) || 0);

const formatDashboardMoney = (amount, currency) => {
  const normalizedCurrency = String(currency || 'USD').trim().toUpperCase() || 'USD';
  const numericAmount = Number(amount);
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  const formattedAmount = safeAmount.toFixed(2);
  try {
    return new Intl.NumberFormat(DASHBOARD_MONEY_LOCALE, {
      style: 'currency',
      currency: normalizedCurrency,
      currencyDisplay: 'code',
    }).format(safeAmount);
  } catch (_) {
    return `${normalizedCurrency} ${formattedAmount}`;
  }
};

function ClientDocumentsPanel({
  client,
  quotes,
  invoices,
  isQuotesLoading,
  isInvoicesLoading,
  quotesError,
  invoicesError,
  controlId,
  panelId,
  onOpenDocument,
}) {
  const clientDocuments = getClientDocumentContinuity({
    client,
    quotes,
    invoices,
    quoteResourceState: isQuotesLoading ? 'loading' : quotesError ? 'error' : 'ready',
    invoiceResourceState: isInvoicesLoading ? 'loading' : invoicesError ? 'error' : 'ready',
    quoteError: quotesError,
    invoiceError: invoicesError,
  });

  const formatDocumentDate = (document) => {
    const timestamp = getEffectiveDocumentTimestamp(document);
    return timestamp === null ? '' : formatDashboardDate(timestamp);
  };

  const renderDocuments = (documents, type) => documents.map((document) => {
    const reference = type === 'quote'
      ? document.quote_number || document.id
      : document.invoice_number || document.id;
    const status = type === 'quote'
      ? document.status || '—'
      : document.payment_status || document.status || '—';
    const date = formatDocumentDate(document);
    return (
      <li
        key={document.id || reference}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}
      >
        <div style={{ minWidth: 0, flex: '1 1 180px' }}>
          <div style={{ overflowWrap: 'anywhere', color: 'var(--text-main)', fontWeight: 650 }}>{reference}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{status}{date ? ` · ${date}` : ''}</div>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          aria-label={`Open ${type === 'quote' ? 'Quote' : 'Invoice'} ${reference}`}
          onClick={() => onOpenDocument?.({ documentType: type, id: document.id })}
        >
          Open
        </button>
      </li>
    );
  });

  const renderResource = ({ label, documents, more, unavailable, stale, emptyEligible, emptyMessage, loading }) => (
    <div style={{ minWidth: 0 }}>
      <h5 style={{ margin: '0 0 6px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{label}</h5>
      {loading && <p role="status" style={{ margin: '0 0 6px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Loading {label.toLowerCase()}…</p>}
      {unavailable && <p role="alert" style={{ margin: '0 0 6px', color: 'var(--danger-text)', fontSize: '0.82rem' }}>{label} unavailable.</p>}
      {stale && <p role="status" style={{ margin: '0 0 6px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{label} data is retained but may be stale.</p>}
      {emptyEligible && <p style={{ margin: '0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{emptyMessage}</p>}
      {documents.length > 0 && (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>{renderDocuments(documents, label === 'Quotes' ? 'quote' : 'invoice')}</ul>
          {more > 0 && <p style={{ margin: '7px 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>+ {more} more {label.toLowerCase()}</p>}
        </>
      )}
    </div>
  );

  return (
    <section
      id={panelId}
      data-testid={panelId}
      aria-labelledby={controlId}
      style={{ width: '100%', padding: '14px 16px', borderRadius: '8px', background: 'var(--background)', border: '1px solid var(--border)', overflow: 'hidden' }}
    >
      <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: 'var(--text-main)' }}>Documents</h4>
      {clientDocuments.combinedEmptyEligible ? (
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{clientDocuments.emptyMessage}</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
          {renderResource({
            label: 'Quotes',
            documents: clientDocuments.quotes,
            more: clientDocuments.moreQuotes,
            unavailable: clientDocuments.quoteUnavailable,
            stale: clientDocuments.quoteStale,
            emptyEligible: clientDocuments.quoteEmptyEligible,
            emptyMessage: clientDocuments.quoteEmptyMessage,
            loading: clientDocuments.quoteState === 'loading',
          })}
          {renderResource({
            label: 'Invoices',
            documents: clientDocuments.invoices,
            more: clientDocuments.moreInvoices,
            unavailable: clientDocuments.invoiceUnavailable,
            stale: clientDocuments.invoiceStale,
            emptyEligible: clientDocuments.invoiceEmptyEligible,
            emptyMessage: clientDocuments.invoiceEmptyMessage,
            loading: clientDocuments.invoiceState === 'loading',
          })}
        </div>
      )}
    </section>
  );
}

export function createRecordPaymentAttemptStore(storage, createUuid) {
  const prefix = 'corvioz:record-payment-attempt:';
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const unavailableMessage = 'Unable to persist a retry-safe Record Payment attempt.';

  if (!storage
    || typeof storage.getItem !== 'function'
    || typeof storage.setItem !== 'function'
    || typeof storage.removeItem !== 'function'
    || typeof createUuid !== 'function') {
    throw new Error(unavailableMessage);
  }

  const scopeFor = ({ invoiceId, currency, amountCents }) => {
    const normalizedCurrency = String(currency || 'USD').trim().toUpperCase();
    if (!invoiceId || !normalizedCurrency || !Number.isSafeInteger(amountCents) || amountCents <= 0) {
      throw new Error(unavailableMessage);
    }
    return `${prefix}${invoiceId}:${normalizedCurrency}:${amountCents}`;
  };

  const getOrCreate = ({ invoiceId, currency, amountCents }) => {
    const storageKey = scopeFor({ invoiceId, currency, amountCents });
    let idempotencyKey;
    try {
      idempotencyKey = storage.getItem(storageKey);
    } catch {
      throw new Error(unavailableMessage);
    }

    if (idempotencyKey !== null) {
      if (!uuidPattern.test(idempotencyKey)) throw new Error(unavailableMessage);
      return { storageKey, idempotencyKey };
    }

    idempotencyKey = createUuid();
    if (!uuidPattern.test(idempotencyKey)) throw new Error(unavailableMessage);
    try {
      storage.setItem(storageKey, idempotencyKey);
      if (storage.getItem(storageKey) !== idempotencyKey) throw new Error(unavailableMessage);
    } catch {
      throw new Error(unavailableMessage);
    }
    return { storageKey, idempotencyKey };
  };

  const clear = (storageKey) => {
    try {
      storage.removeItem(storageKey);
      if (storage.getItem(storageKey) !== null) throw new Error(unavailableMessage);
    } catch {
      throw new Error(unavailableMessage);
    }
  };

  const shouldClearAfterResponse = (response) => {
    if (response?.ok) return true;
    const status = Number(response?.status);
    return Number.isInteger(status) && status >= 400 && status < 500 && status !== 408;
  };

  return { getOrCreate, clear, shouldClearAfterResponse };
}

function getRecordPaymentAttemptStore() {
  if (typeof window === 'undefined') {
    throw new Error('Unable to persist a retry-safe Record Payment attempt.');
  }
  return createRecordPaymentAttemptStore(window.sessionStorage, () => {
    if (typeof globalThis.crypto?.randomUUID !== 'function') {
      throw new Error('Unable to persist a retry-safe Record Payment attempt.');
    }
    return globalThis.crypto.randomUUID();
  });
}

const REVENUE_ENTRY_ROUTE_TARGETS = {
  '/dashboard': '/dashboard?tool=quote',
  '/dashboard/activation': '/dashboard/activation',
  '/invoice': '/dashboard?tool=invoice',
  '/quote': '/dashboard?tool=quote',
  '/profile': '/dashboard?tool=profile',
};

const INVOICE_FLOW_STAGES = [
  { id: 'create', label: 'Create' },
  { id: 'preview', label: 'Preview' },
  { id: 'send', label: 'Send' },
  { id: 'paid', label: 'Completed' },
];

function FirstRevenueLoopAction({ loop, onCreateQuote, onSendQuote, onCreateInvoiceDraft, onPreparePayment }) {
  if (!loop || loop.stage === 'unavailable') return null;

  const stageContent = {
    no_quote: {
      title: 'Create your first quote',
      description: 'Start a client-ready photography quote and save it to begin your first revenue workflow.',
      actionLabel: 'Create Quote',
      onAction: onCreateQuote,
    },
    draft: {
      title: 'Send your quote',
      description: 'Your saved quote is ready to deliver to the client.',
      actionLabel: 'Send Quote',
      onAction: onSendQuote,
    },
    sent: {
      title: 'Awaiting client response',
      description: 'Your quote is marked as sent. Record the outcome when received from your client.',
    },
    approved: {
      title: 'Create a linked invoice draft',
      description: 'Your client approved the quote. Prepare the matching invoice terms next.',
      actionLabel: 'Create Linked Invoice Draft',
      onAction: onCreateInvoiceDraft,
    },
    invoice_created: {
      title: 'Prepare payment collection',
      description: 'Your deposit invoice is ready. Add payment terms and record funds only when received.',
      actionLabel: 'Prepare Payment',
      onAction: onPreparePayment,
    },
    first_payment_received: {
      title: 'First payment received',
      description: 'Record the remaining balance when it is received to complete this first revenue loop.',
      actionLabel: 'Prepare Payment',
      onAction: onPreparePayment,
    },
    complete: {
      title: 'First revenue loop complete',
      description: 'A successful payment was recorded for this first client workflow.',
    },
    rejected: {
      title: 'Client declined the quote',
      description: 'This first revenue loop is complete without an invoice draft.',
    },
  };

  const content = stageContent[loop.stage];
  if (!content) return null;

  return (
    <section
      className="card animate-fade-in"
      data-testid="first-revenue-loop-action"
      style={{ marginBottom: '20px', padding: '20px 22px', border: '1px solid var(--accent)', background: 'var(--background-card)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ maxWidth: '650px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '0.72rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase' }}>First Revenue Loop</p>
          <h2 style={{ margin: 0, fontSize: '1.12rem', fontWeight: 800, color: 'var(--text-main)' }}>{content.title}</h2>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>{content.description}</p>
        </div>
        {content.onAction && (
          <button type="button" onClick={content.onAction} className="btn btn-primary" style={{ fontWeight: 750 }}>
            {content.actionLabel}
          </button>
        )}
      </div>
    </section>
  );
}

function inferRevenueActionFromRoute(route) {
  if (!route || typeof route !== 'string') return null;
  try {
    const url = new URL(route, 'https://corvioz.local');
    const tool = url.searchParams.get('tool');
    if (tool === 'invoice') return 'invoice';
    if (tool === 'quote' || tool === 'proposal') return 'quote';
    if (tool === 'client' || tool === 'profile') return 'profile';
  } catch (_) {
    // Fall back to legacy substring matching below.
  }
  if (route.includes('/invoices') || route.includes('create-invoice')) return 'invoice';
  if (route.includes('/quotes') || route.includes('create-quote')) return 'quote';
  if (route.includes('create-profile') || route.includes('/profile')) return 'profile';
  return null;
}

function readLegacyRevenueIntent() {
  if (typeof window === 'undefined') {
    return { selectedPlan: null, intendedAction: null };
  }

  const storedPlan = window.sessionStorage.getItem('corvioz_selected_plan');
  const selectedPlan = isEntrySelectedPlan(storedPlan) ? storedPlan : null;
  const intendedRoute = window.sessionStorage.getItem('corvioz_redirect_after_auth') || '';
  let intendedAction = inferRevenueActionFromRoute(intendedRoute);

  try {
    const storedIntent = JSON.parse(window.sessionStorage.getItem('corvioz_conversion_intent') || '{}');
    const storedAction = storedIntent.clicked_feature || storedIntent.user_goal;
    if (isEntryIntendedAction(storedAction)) {
      intendedAction = storedAction;
    } else {
      intendedAction = intendedAction || inferRevenueActionFromRoute(storedIntent.intended_route);
    }
  } catch (_) {
    // Ignore malformed legacy intent and keep the route-derived action.
  }

  return { selectedPlan, intendedAction };
}

const getInitialDashboardTool = (routeTool = null) => {
  const normalizeTool = (tool) => {
    if (!tool || typeof tool !== 'string') return null;
    if (['quote', 'quotes', 'proposal', 'proposals'].includes(tool)) return 'quote';
    if (['invoice', 'invoices'].includes(tool)) return 'invoice';
    if (['client', 'clients'].includes(tool)) return 'client';
    if (['profile', 'studio', 'portfolio', 'brand', 'reports', 'automation'].includes(tool)) return tool;
    return null;
  };

  const explicitTool = normalizeTool(routeTool);
  if (explicitTool) return explicitTool;
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const tool = normalizeTool(params.get('tool'));
  const action = params.get('action');
  if (action === 'create-profile') return 'profile';
  if (action === 'create-quote') return 'quote';
  if (action === 'create-proposal') return 'quote';
  if (action === 'create-invoice') return 'invoice';
  return tool;
};

const getDashboardTabForTool = (tool) => {
  return getWave1DashboardTabForTool(tool);
};

const shouldOpenQuoteCreateFromRoute = (tool) => {
  if (tool !== 'quote' || typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') === 'create' || params.get('action') === 'create-quote' || params.get('flow') === 'first-quote';
};

const isFirstQuoteFlowRoute = () => {
  if (typeof window === 'undefined') return false;
  return shouldBypassOnboardingForFirstQuote(window.location.search);
};

const readFirstQuoteStartedAt = () => {
  if (typeof window === 'undefined') return null;
  try {
    const storedIntent = JSON.parse(window.sessionStorage.getItem('corvioz_conversion_intent') || '{}');
    return storedIntent.created_at || window.sessionStorage.getItem('corvioz_signup_started_at') || null;
  } catch (_) {
    return window.sessionStorage.getItem('corvioz_signup_started_at') || null;
  }
};

// Resolve only workflow facts supported by the current invoice state.
// Client-open activity is intentionally absent: no invoice-level open event
// is part of the authoritative model.
export const getInvoiceTimelineState = (invoice = {}) => {
  const resolvedInvoice = (typeof invoice === 'string' ? { status: invoice } : invoice) || {};
  const status = resolvedInvoice.status || 'draft';
  const created = Boolean(resolvedInvoice?.id);
  const paymentStatus = paymentStatusForInvoice(resolvedInvoice);
  const sent = created && status === 'sent';
  const completed = created && paymentStatus === 'paid';
  const overdue = created && paymentStatus === 'overdue';

  return {
    progressWidth: sent && completed ? '80%' : (sent ? '40%' : '0%'),
    overdue,
    stages: [
      { key: 'created', label: 'Created', done: created, active: status === 'draft' },
      { key: 'sent', label: 'Sent', done: sent, active: status === 'pending' },
      { key: 'completed', label: 'Completed', done: completed, active: sent && !completed && !overdue, overdue },
    ],
  };
};

// Render interactive invoice status timeline
const renderInvoiceTimeline = (invoice) => {
  const { stages, progressWidth, overdue } = getInvoiceTimelineState(invoice);

  return (
    <div style={{ marginBottom: '28px', padding: '16px 20px', background: 'var(--btn-secondary-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>

        {/* Connecting line */}
        <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '2px', backgroundColor: 'var(--border)', zIndex: 1 }} />
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '10%',
          width: progressWidth,
          height: '2px',
          backgroundColor: overdue ? 'var(--danger)' : 'var(--success)',
          zIndex: 1,
          transition: 'width 0.4s ease'
        }} />

        {stages.map((stage, idx) => {
          let dotBg = 'var(--background-card)';
          let dotBorder = '2px solid var(--border)';
          let textColor = 'var(--text-muted)';
          let fontWeight = 400;

          if (stage.done) {
            dotBg = stage.overdue ? 'var(--danger)' : 'var(--success)';
            dotBorder = `2px solid ${stage.overdue ? 'var(--danger)' : 'var(--success)'}`;
            textColor = stage.overdue ? 'var(--danger)' : 'var(--text-main)';
            fontWeight = 700;
          } else if (stage.active) {
            dotBg = 'var(--accent)';
            dotBorder = '2px solid var(--accent)';
            textColor = 'var(--accent)';
            fontWeight = 700;
          }

          return (
            <div key={stage.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative', width: '60px' }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: dotBg,
                border: dotBorder,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: stage.done ? '#000' : 'var(--text-main)',
                fontWeight: 800,
                boxShadow: stage.active ? '0 0 12px var(--accent)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {stage.overdue ? '!' : idx + 1}
              </div>
              <span style={{ fontSize: '0.7rem', marginTop: '6px', color: textColor, fontWeight, whiteSpace: 'nowrap' }}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export function getDashboardAuthEventAction(event, nextSession) {
  if (event === 'INITIAL_SESSION') return 'ignore';
  if (event === 'SIGNED_OUT') return 'clear';
  return nextSession ? 'refresh' : 'clear';
}

export function getQuotesContentState(isQuotesLoading, quoteCount) {
  if (isQuotesLoading) return 'loading';
  return quoteCount > 0 ? 'ready' : 'empty';
}

export default function Dashboard({ mode = 'live', initialTool: routeInitialTool = null, tierPlan = null, onSuccessMoment = null }) {


  const router = useRouter();
  const pathname = usePathname();
  const supportEmail = getSupportEmail();
  const redirectToAuth = useCallback((source = 'dashboard_auth_guard') => {
    const redirectTarget = typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : '/dashboard';
    saveIntendedRoute(redirectTarget, source);
    router.replace(`/auth?redirect=${encodeURIComponent(redirectTarget)}`);
  }, [router]);
  
  // Design system hooks
  const { isLive, isDemo, isPreview, isReadOnly, isInteractive, isResettable } = useDashboardMode(mode);
  const previewMode = isPreview;
  const initialTool = previewMode ? 'overview' : getInitialDashboardTool(routeInitialTool);
  const initialQuoteCreateMode = !previewMode && shouldOpenQuoteCreateFromRoute(initialTool);
  const initialFirstQuoteFlow = !previewMode && isFirstQuoteFlowRoute();
  const hasTrackedDashboardViewRef = useRef(false);

  const [kernelUi, setKernelUi] = useState(() => CorviozKernel.compute('dashboard', { activePlan: tierPlan }));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setKernelUi(CorviozKernel.compute('dashboard', { activePlan: tierPlan }));
    
    // Real Behavior Capture Layer — Unified Event Router
    sendEvent('DASHBOARD_ENTERED');

    const handleStorageChange = () => {
      setKernelUi(CorviozKernel.compute('dashboard', { activePlan: tierPlan }));
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('corvioz_debug_update', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('corvioz_debug_update', handleStorageChange);
    };
  }, [tierPlan]);

  const activeTheme = kernelUi.pricing_variant;

  const [activeTab, setActiveTab] = useState(() => {
    return getDashboardTabForTool(initialTool);
  }); // overview, leads, quotes, invoices, clients, profile
  const [expandedClientDocumentsId, setExpandedClientDocumentsId] = useState(null);
  
  const [session, setSession] = useState(null);
  const sessionRef = useRef(null);
  const [supabaseClient, setSupabaseClient] = useState(undefined);
  const [authChecked, setAuthChecked] = useState(previewMode);
  const [dashboardDataError, setDashboardDataError] = useState(null);
  
  const {
    user,
    setUser,
    leads,
    setLeads,
    quotes,
    setQuotes,
    quotesError,
    setQuotesError,
    invoicesError,
    quotaError,
    invoices,
    setInvoices,
    clients,
    setClients,
    cardProfile,
    setCardProfile,
    isLoading,
    isRefreshing,
    isQuotesLoading,
    isInvoicesLoading,
    invalidateDashboardData,
    fetchData,
    resetDemoData,
    saveQuote,
    saveInvoice,
    saveAndSendInvoice,
    saveCardProfile,
    deleteQuote,
    deleteInvoice,
    saveClient,
    deleteClient,
    saveLead
  } = useDashboardData(mode, session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const buildFallbackEntitlements = useCallback((plan) => {
    if (!plan) return null;
    return { invoice: true, ...getUserEntitlements(plan) };
  }, []);

  const [entitlementState, setEntitlementState] = useState(() => {
    return buildDashboardEntitlementState({
      mode,
      session: previewMode ? {} : session,
      authChecked,
      user,
      fallbackEntitlements: buildFallbackEntitlements(user?.plan),
    });
  });

  // ── Unified Decision Engine (v8.5 Decision Unification Layer) ────────────────────────────
  useEffect(() => {
    if (user && user.id) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`corvioz_user_plan_${user.id}`, user.plan || 'free');
        if (user.created_at) {
          window.localStorage.setItem(`corvioz_user_created_at_${user.id}`, user.created_at);
        }
      }
    }
  }, [user]);

  // Real-time decision engine and intelligence scoring removed from UI

  const [pricingPlans, setPricingPlans] = useState([]);

  useEffect(() => {
    if (previewMode || typeof window === 'undefined') return undefined;

    const syncDashboardTabFromLocation = () => {
      const tool = new URLSearchParams(window.location.search).get('tool');
      setActiveTab(getDashboardTabForTool(tool));
    };

    window.addEventListener('popstate', syncDashboardTabFromLocation);
    return () => window.removeEventListener('popstate', syncDashboardTabFromLocation);
  }, [previewMode]);

  useEffect(() => {
    let active = true;
    const fetchPlans = async () => {
      try {
        const res = await fetch('/api/pricing');
        if (res.ok) {
          const data = await res.json();
          if (active && data.success && data.plans) {
            setPricingPlans(data.plans);
          }
        }
      } catch (err) {
        console.error('Failed to fetch pricing plans in Dashboard:', err);
      }
    };
    fetchPlans();
    return () => {
      active = false;
    };
  }, []);

  const getPlanInfo = (planId, key, fallback) => {
    const plan = pricingPlans.find(p => p.id === planId);
    return plan && plan[key] !== undefined ? plan[key] : fallback;
  };

  useEffect(() => {
    let channel = null;
    let cancelled = false;

    if (mode !== 'live' || previewMode) {
      setEntitlementState(buildDashboardEntitlementState({
        mode,
        session: previewMode ? {} : session,
        authChecked: true,
        user,
        fallbackEntitlements: buildFallbackEntitlements(user?.plan) || { invoice: true, ...getUserEntitlements('free') },
      }));
      return undefined;
    }

    if (!authChecked || (session && !user?.id)) {
      setEntitlementState(buildDashboardEntitlementState({
        mode,
        session,
        authChecked,
        user,
        fallbackEntitlements: null,
      }));
      return undefined;
    }

    if (user?.id) {
      const loadEntitlements = async () => {
        setEntitlementState(buildDashboardEntitlementState({
          mode,
          session,
          authChecked,
          user,
          fallbackEntitlements: null,
        }));

        try {
          const resolved = await resolveDashboardEntitlements({
            user,
            session,
            getFallbackEntitlements: buildFallbackEntitlements,
          });
          if (cancelled) return;
          if (resolved.status === DASHBOARD_ENTITLEMENT_STATUS.ERROR) {
            setEntitlementState(buildDashboardEntitlementState({
              mode,
              session,
              authChecked,
              user,
              entitlementError: resolved.error,
            }));
          } else if (resolved.entitlementRecord) {
            setEntitlementState(buildDashboardEntitlementState({
              mode,
              session,
              authChecked,
              user,
              entitlementRecord: resolved.entitlementRecord,
              fallbackEntitlements: null,
            }));
          } else {
            setEntitlementState(buildDashboardEntitlementState({
              mode,
              session,
              authChecked,
              user,
              fallbackEntitlements: resolved.entitlements,
              fallbackResolved: resolved.fallbackResolved,
            }));
          }

          // Realtime is best-effort and never blocks the authenticated API result.
          try {
            const supabase = createBrowserSupabaseClient();
            if (supabase) {
              channel = supabase
                .channel(`entitlements:${user.id}`)
                .on(
                  'postgres_changes',
                  {
                    event: '*',
                    schema: 'public',
                    table: 'entitlements',
                    filter: `user_id=eq.${user.id}`,
                  },
                  (payload) => {
                    console.log('Real-time entitlement update received:', payload);
                    if (payload.new) {
                      setEntitlementState({
                        status: DASHBOARD_ENTITLEMENT_STATUS.READY,
                        entitlements: mapEntitlementRecord(payload.new),
                        error: null,
                      });
                    }
                  }
                )
                .subscribe();
            }
          } catch (realtimeError) {
            console.warn('Realtime entitlement subscription unavailable:', realtimeError);
          }
        } catch (err) {
          console.error('Error fetching entitlements dynamically:', err);
          if (!cancelled) {
            setEntitlementState(buildDashboardEntitlementState({
              mode,
              session,
              authChecked,
              user,
              entitlementError: 'entitlement_fetch_failed',
            }));
          }
        }
      };
      loadEntitlements();
    } else {
      setEntitlementState(buildDashboardEntitlementState({
        mode,
        session,
        authChecked,
        user,
        fallbackEntitlements: buildFallbackEntitlements(user?.plan),
      }));
    }

    return () => {
      cancelled = true;
      if (channel) {
        const supabase = createBrowserSupabaseClient();
        if (supabase) {
          supabase.removeChannel(channel);
        }
      }
    };
  }, [authChecked, buildFallbackEntitlements, mode, previewMode, session, user]);

  const entitlementReady = entitlementState.status === DASHBOARD_ENTITLEMENT_STATUS.READY;
  const entitlements = entitlementReady ? (entitlementState.entitlements || EMPTY_DASHBOARD_ENTITLEMENTS) : EMPTY_DASHBOARD_ENTITLEMENTS;
  const isEntitlementLoading = entitlementState.status === DASHBOARD_ENTITLEMENT_STATUS.LOADING;
  const isEntitlementError = entitlementState.status === DASHBOARD_ENTITLEMENT_STATUS.ERROR;

  const { canExportPdf, hasCleanPdf } = getDashboardPdfExportDecision(entitlements);
  const normalizedPlan = String(user?.plan || (previewMode ? 'free' : '')).toLowerCase();
  const isFreePlan = entitlementReady && normalizedPlan === 'free';
  const firstRevenueLoop = user?.first_revenue_loop || null;
  const firstRevenueLoopActionReady = Boolean(
    firstRevenueLoop
      && (
        firstRevenueLoop.stage === 'no_quote'
        || !firstRevenueLoop.quote_id
        || quotes.some((quote) => quote.id === firstRevenueLoop.quote_id)
      )
  );
  const canAccessFirstRevenueQuotes = Boolean(
    firstRevenueLoop?.can_create_quote
      || firstRevenueLoop?.can_send_quote
      || firstRevenueLoop?.can_create_invoice_draft
      || firstRevenueLoop?.can_prepare_payment
  );
  const canAccessFirstRevenueInvoices = Boolean(
    firstRevenueLoop?.can_create_invoice_draft || firstRevenueLoop?.can_prepare_payment
  );
  const canCreateFirstRevenueInvoiceDraft = Boolean(
    firstRevenueLoop?.can_create_invoice_draft && firstRevenueLoop?.quote_id
  );
  const planStatusLabel = isEntitlementLoading
    ? 'Loading'
    : (isEntitlementError ? 'Unavailable' : (user?.plan || (isFreePlan ? 'free' : 'paid')));

  const [exportCount, setExportCount] = useState(0);
  const [showExportPurposeModal, setShowExportPurposeModal] = useState(false);
  const [exportPurposeParams, setExportPurposeParams] = useState(null);
  const [exportPurpose, setExportPurpose] = useState('draft');
  const [exportSentToClient, setExportSentToClient] = useState(false);
  const [showBusinessModeModal, setShowBusinessModeModal] = useState(false);
  const [showStudioPreviewModal, setShowStudioPreviewModal] = useState(false);
  const [studioPreviewActive, setStudioPreviewActive] = useState(false);

  const {
    evaluateAction,
    activeModal,
    setActiveModal,
    modalProps,
    setModalProps,
    bannerMessage,
    setBannerMessage
  } = useRevenueAction(user, {
    invoicesCount: invoices.length,
    quotesCount: quotes.length,
    exportAttempts: exportCount
  });

  const [debugEventsCount, setDebugEventsCount] = useState(0);
  const [isDebugPanelVisible, setIsDebugPanelVisible] = useState(true);

  useEffect(() => {
    if (isDevelopment && typeof window !== 'undefined') {
      window.__corvioz_on_debug_event = () => {
        setDebugEventsCount(c => c + 1);
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.__corvioz_on_debug_event = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isDevelopment && typeof window !== 'undefined') {
      const count = Number(window.localStorage.getItem('corvioz_export_count') || 0);
      setExportCount(count);
    }
  }, []);

  useEffect(() => {
    if (isDevelopment && showExportPurposeModal) console.log('[INSTRUMENTATION] modal_rendered: ExportPurposeModal');
  }, [showExportPurposeModal]);

  useEffect(() => {
    if (isDevelopment) console.log('[INSTRUMENTATION] exportCount_updated:', exportCount);
  }, [exportCount]);

  useEffect(() => {
    const hasPendingQuote24h = quotes ? quotes.some(q => {
      if (q.status !== 'sent') return false;
      const createdTime = new Date(q.created_at);
      const diffHrs = (Date.now() - createdTime.getTime()) / (1000 * 3600);
      return diffHrs > 24;
    }) : false;

    if ((clients && clients.length >= 2) || hasPendingQuote24h) {
      setStudioPreviewActive(true);
    }
  }, [clients, quotes]);


  const isSandboxMode = isDemo || (typeof window !== 'undefined' && window.sessionStorage.getItem('corvioz_sandbox_mode') === 'true');
  const isStudio = entitlements.crm || entitlements.automation || isSandboxMode;

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [toast, setToast] = useState(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isSigningOutRef = useRef(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackCategory, setFeedbackCategory] = useState('Dashboard');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const feedbackBtnRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setSidebarCollapsed(window.localStorage.getItem(DASHBOARD_SIDEBAR_STORAGE_KEY) === 'true');
    } catch {
      // A restricted storage context should not prevent Dashboard rendering.
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((current) => {
      const next = !current;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(DASHBOARD_SIDEBAR_STORAGE_KEY, String(next));
        } catch {
          // Persistence is an enhancement; the control remains fully usable.
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!feedbackModalOpen) return;

    const feedbackTrigger = feedbackBtnRef.current;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setFeedbackModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      feedbackTrigger?.focus();
    };
  }, [feedbackModalOpen]);

  const triggerToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const openFeedbackModal = useCallback(() => {
    sendEvent('beta_feedback_clicked', {
      source: 'dashboard_sidebar',
      signed_in: Boolean(sessionRef.current?.user?.email)
    });
    setFeedbackError('');
    setFeedbackModalOpen(true);
  }, []);

  const submitBetaFeedback = useCallback(async (e) => {
    e.preventDefault();
    const message = feedbackMessage.trim();
    if (!message) {
      setFeedbackError('Please add a short note before sending.');
      return;
    }

    setFeedbackSubmitting(true);
    setFeedbackError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: feedbackCategory,
          message,
          priority: 'medium',
          email: sessionRef.current?.user?.email || '',
          page_url: typeof window !== 'undefined' ? window.location.href : '/dashboard',
          source: 'dashboard_sidebar_beta_feedback',
          plan: user?.plan || 'free'
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Feedback could not be sent.');
      }

      setFeedbackMessage('');
      setFeedbackModalOpen(false);
      triggerToast('Beta feedback sent. Thank you.', 'success');
    } catch (err) {
      setFeedbackError(err.message || 'Feedback could not be sent.');
    } finally {
      setFeedbackSubmitting(false);
    }
  }, [feedbackCategory, feedbackMessage, triggerToast, user?.plan]);

  const trackDashboardViewOnce = useCallback((props) => {
    if (hasTrackedDashboardViewRef.current) return;
    hasTrackedDashboardViewRef.current = true;
    trackEvent('dashboard_view', props);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const duration = (firstFlowExportDone && toast.type === 'success') ? 6000 : 4000;
    const timer = setTimeout(() => {
      setToast(null);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast]);

  // Visits and local rules removed to maintain pure dumb renderer

  // Interactive View Toggles
  const [quoteView, setQuoteView] = useState(() => initialQuoteCreateMode ? 'create' : 'list'); // list, create, edit
  const [invoiceView, setInvoiceView] = useState(() => initialTool === 'invoice' ? 'create' : 'list'); // list, create, edit
  const [invoiceFlowStage, setInvoiceFlowStage] = useState(() => initialTool === 'invoice' ? 'create' : 'create');
  const [invoiceFlowLocked, setInvoiceFlowLocked] = useState(() => initialTool === 'invoice');
  const [showPaymentWaitingBanner, setShowPaymentWaitingBanner] = useState(false);
  const [isParsingLead, setIsParsingLead] = useState(null); // ID of lead parsing
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Quote Editor State
  const [qId, setQId] = useState('');
  const [qNumber, setQNumber] = useState(() => initialQuoteCreateMode ? generateRandomNumberString('QT') : '');
  const [qClientName, setQClientName] = useState('');
  const [qClientEmail, setQClientEmail] = useState('');
  const [qClientAddress, setQClientAddress] = useState('');
  const [qClientId, setQClientId] = useState(null);
  const [qItems, setQItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [qTaxRate, setQTaxRate] = useState(0);
  const [qDiscountRate, setQDiscountRate] = useState(0);
  const [qCurrency, setQCurrency] = useState('USD');
  const [qNotes, setQNotes] = useState('');
  const [qDate, setQDate] = useState(() => initialQuoteCreateMode ? new Date().toISOString().substring(0, 10) : '');
  const [qStatus, setQStatus] = useState('draft');
  const [selectedQuotePresetId, setSelectedQuotePresetId] = useState('');
  const [quotePresetSelectionTouched, setQuotePresetSelectionTouched] = useState(false);
  const [qPhotographyScope, setQPhotographyScope] = useState(() => createEmptyPhotographyScope());
  const [qQuoteProvenance, setQQuoteProvenance] = useState(null);
  const [usageRightsExpanded, setUsageRightsExpanded] = useState(false);
  const [scopeFieldsExpanded, setScopeFieldsExpanded] = useState(false);
  const [semanticReviewState, setSemanticReviewState] = useState({
    status: 'READY',
    inputFingerprint: null,
    semanticFindings: [],
  });
  const [isFirstQuoteFlow, setIsFirstQuoteFlow] = useState(initialFirstQuoteFlow);

  // Quote validation states
  const [qClientNameTouched, setQClientNameTouched] = useState(false);
  const [qClientEmailTouched, setQClientEmailTouched] = useState(false);
  const [qSubmitAttempted, setQSubmitAttempted] = useState(false);

  // Preserve the historical R1 source contract while the helper owns Quote totals.
  // const qSubtotal = qItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  // const qTotal = qSubtotal * (1 - qDiscountRate / 100) * (1 + qTaxRate / 100);
  const quoteTotals = calculateQuoteTotals(qItems, qDiscountRate, qTaxRate);
  const quoteClientValidation = validateQuoteClient({ name: qClientName, email: qClientEmail });

  // Invoice Editor State
  const [invId, setInvId] = useState('');
  const [invClientId, setInvClientId] = useState(null);
  const [pendingSendRetryInvoiceId, setPendingSendRetryInvoiceId] = useState('');
  const [invNumber, setInvNumber] = useState(() => initialTool === 'invoice' ? generateRandomNumberString('INV') : '');
  const [invClientName, setInvClientName] = useState(() => initialTool === 'invoice' ? 'Acme Corporation' : '');
  const [invClientEmail, setInvClientEmail] = useState(() => initialTool === 'invoice' ? 'client@acme.com' : '');
  const [invClientAddress, setInvClientAddress] = useState(() => initialTool === 'invoice' ? '123 Creative Way\nSan Francisco, CA 94107' : '');
  const [invItems, setInvItems] = useState(() => initialTool === 'invoice' ? [
    { description: 'Software Development & Consulting Services', quantity: 1, unitPrice: 1500 }
  ] : [{ description: '', quantity: 1, unitPrice: 0 }]);
  const [invTaxRate, setInvTaxRate] = useState(0);
  const [invDiscountRate, setInvDiscountRate] = useState(0);
  const [invCurrency, setInvCurrency] = useState('USD');
  const [invNotes, setInvNotes] = useState(() => initialTool === 'invoice' ? 'Thank you. Please review the invoice document details.' : '');
  const [invDate, setInvDate] = useState(() => initialTool === 'invoice' ? new Date().toISOString().substring(0, 10) : '');
  const [invDueDate, setInvDueDate] = useState(() => {
    if (initialTool !== 'invoice') return '';
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().substring(0, 10);
  });
  const [invPaymentTerms, setInvPaymentTerms] = useState('Net 30');
  const [invStatus, setInvStatus] = useState('pending');
  const [invPaymentLink, setInvPaymentLink] = useState('');
  const [invQuoteId, setInvQuoteId] = useState(null);
  const [invBillingType, setInvBillingType] = useState('standard');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [recordPaymentInvoice, setRecordPaymentInvoice] = useState(null);
  const [recordPaymentAmount, setRecordPaymentAmount] = useState('');
  const [recordPaymentError, setRecordPaymentError] = useState('');

  const getSelectedInvoice = () => invId ? invoices.find((invoice) => invoice?.id === invId) : null;
  const isSelectedInvoiceSettled = Boolean(invId && hasRecordedInvoicePayment(getSelectedInvoice()));
  const selectedInvoicePaymentStatus = paymentStatusForInvoice(getSelectedInvoice() || { status: invStatus });

  // Client editor state
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');

  // Card Profile Editor State
  const [isGeneratingProfile, setIsGeneratingProfile] = useState(false);
  const [profilePrompt, setProfilePrompt] = useState('Full-stack developer building Next.js web applications and design systems');
  const [cpUsername, setCpUsername] = useState('');
  const [cpName, setCpName] = useState('');
  const [cpTitle, setCpTitle] = useState('');
  const [cpBio, setCpBio] = useState('');
  const [cpTags, setCpTags] = useState('');
  const [cpEmail, setCpEmail] = useState('');
  const [cpPhone, setCpPhone] = useState('');
  const [cpTwitter, setCpTwitter] = useState('');
  const [cpLinkedin, setCpLinkedin] = useState('');
  const [cpGithub, setCpGithub] = useState('');
  const [cpWebsite, setCpWebsite] = useState('');
  const [cpServices, setCpServices] = useState([]);
  const [cpPortfolio, setCpPortfolio] = useState([]);
  // New card profile attributes
  const [cpCoverBanner, setCpCoverBanner] = useState('');
  const [cpAvatarUrl, setCpAvatarUrl] = useState('');
  const [cpLocation, setCpLocation] = useState('');
  const [cpTimezone, setCpTimezone] = useState('');
  const [cpLanguages, setCpLanguages] = useState('');
  const [cpAvailabilityStatus, setCpAvailabilityStatus] = useState('Available for contract');
  const [cpResponseTime, setCpResponseTime] = useState('< 2 hours');
  const [cpStartingPrice, setCpStartingPrice] = useState('CAD 1,000 or USD 1,000');
  const [cpCalendlyLink, setCpCalendlyLink] = useState('');
  const [cpVerifiedBadge, setCpVerifiedBadge] = useState(true);
  const [cpTopRatedBadge, setCpTopRatedBadge] = useState(false);
  const [cpFastResponseBadge, setCpFastResponseBadge] = useState(false);
  const [cpIsPublic, setCpIsPublic] = useState(true);
  const [cpTestimonials, setCpTestimonials] = useState([]);

  // Temp service/portfolio/testimonials add inputs
  const [tmpSrvName, setTmpSrvName] = useState('');
  const [tmpSrvDesc, setTmpSrvDesc] = useState('');
  const [tmpSrvType, setTmpSrvType] = useState('fixed');
  const [tmpSrvAmount, setTmpSrvAmount] = useState(0);

  const [tmpProjTitle, setTmpProjTitle] = useState('');
  const [tmpProjDesc, setTmpProjDesc] = useState('');
  const [tmpProjLink, setTmpProjLink] = useState('');
  const [tmpProjCategory, setTmpProjCategory] = useState('');
  const [tmpProjFeatured, setTmpProjFeatured] = useState(false);
  const [tmpProjResults, setTmpProjResults] = useState('');
  const [tmpProjMedia, setTmpProjMedia] = useState('');
  const [tmpSrvGroup, setTmpSrvGroup] = useState('');

  const [cpBrandColor, setCpBrandColor] = useState('#4f46e5');
  const [cpBrandSecondary, setCpBrandSecondary] = useState('#06b6d4');
  const [cpThemePreference, setCpThemePreference] = useState('dark');
  const [cpFontFamily, setCpFontFamily] = useState('Inter');
  const [cpLogoUrl, setCpLogoUrl] = useState('');

  const [tmpClientName, setTmpClientName] = useState('');
  const [tmpClientProject, setTmpClientProject] = useState('');
  const [tmpClientFeedback, setTmpClientFeedback] = useState('');

  // Lead CRM Editor panel states
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadPipelineStatus, setLeadPipelineStatus] = useState('New');
  const [leadValue, setLeadValue] = useState(0);
  const [leadSource, setLeadSource] = useState('');
  const [leadTags, setLeadTags] = useState('');
  const [leadLastContactDate, setLeadLastContactDate] = useState('');
  const [leadNotes, setLeadNotes] = useState('');
  const [leadReminderDate, setLeadReminderDate] = useState('');

  // Modals
  const [showActivationGuide, setShowActivationGuide] = useState(false);
  const [activationGuideDismissed, setActivationGuideDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('corvioz_activation_dismissed') === 'true';
  });
  const [pendingInvoiceDraft, setPendingInvoiceDraft] = useState(null);
  const [showDraftRestorePrompt, setShowDraftRestorePrompt] = useState(false);
  const [hasSelectedPlanForFirstValue, setHasSelectedPlanForFirstValue] = useState(false);

  const [suggestedActionDoc, setSuggestedActionDoc] = useState(null);
  const [postExportDoc, setPostExportDoc] = useState(null);

  // 10-second success flow: detect first-time guest invoice mode inside dashboard.
  const isFirstGuestFlow = !previewMode && !session && initialTool === 'invoice';
  const [firstFlowExportDone, setFirstFlowExportDone] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncFirstValuePlanState = () => {
      const context = readEntryRevenueContext();
      const legacyIntent = readLegacyRevenueIntent();
      setHasSelectedPlanForFirstValue(Boolean(context.selected_plan || legacyIntent.selectedPlan));
    };

    syncFirstValuePlanState();
    window.addEventListener('storage', syncFirstValuePlanState);
    window.addEventListener('corvioz_debug_update', syncFirstValuePlanState);
    return () => {
      window.removeEventListener('storage', syncFirstValuePlanState);
      window.removeEventListener('corvioz_debug_update', syncFirstValuePlanState);
    };
  }, []);

  const getCurrencySymbol = (cur) => `${String(cur || 'USD').trim().toUpperCase() || 'USD'} `;

  const restoreUserIntent = useCallback((userId = null, entryState = 'AUTHENTICATED') => {
    if (typeof window === 'undefined') return;
    if (!userId) return;

    const context = readEntryRevenueContext();
    const legacyIntent = readLegacyRevenueIntent();

    const revenueContext = {
      selected_plan: context.selected_plan || legacyIntent.selectedPlan,
      intended_action: context.intended_action || legacyIntent.intendedAction,
      billing_state: context.billing_state,
    };
    const routeContext = `${pathname || ''}${typeof window !== 'undefined' ? window.location.search : ''}`;
    const { normalizedState, normalizedRevenueContext } = reconcileEntryState(entryState, {
      ...revenueContext,
      current_route: routeContext,
      protected_route: true,
    });
    const decision = resolveRevenueEntry({
      entry_state: normalizedState,
      revenue_context: normalizedRevenueContext,
    });
    const target = REVENUE_ENTRY_ROUTE_TARGETS[decision.route];

    updateEntryRevenueContext({
      ...normalizedRevenueContext,
      billing_state: decision.billing_state,
    });
    setHasSelectedPlanForFirstValue(Boolean(normalizedRevenueContext.selected_plan));

    if (target) {
      const [targetPath, targetQuery] = target.split('?');
      const targetSearch = targetQuery ? `?${targetQuery}` : '';
      const currentSearch = window.location.search;
      const isAtTarget = pathname === targetPath && (!targetSearch || currentSearch === targetSearch);
      if (!isAtTarget && decision.route !== '/dashboard') {
        clearConversionIntent();
        router.replace(target);
        return;
      }
    }

    if (decision.route !== '/dashboard' && decision.route !== '/dashboard/activation') {
      updateEntryRevenueContext({ intended_action: null });
      clearConversionIntent();
    }
  }, [pathname, router]);

  // Dates helpers
  const getTodayString = () => new Date().toISOString().substring(0, 10);
  const getFutureDateString = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().substring(0, 10);
  };

  // Adjust due dates based on invoice terms
  const updateDueDateFromTerms = (terms, dateStr) => {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(baseDate.getTime())) return;
    if (terms === 'Due on Receipt') setInvDueDate(dateStr);
    else if (terms === 'Net 15') {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + 15);
      setInvDueDate(d.toISOString().substring(0, 10));
    } else if (terms === 'Net 30') {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + 30);
      setInvDueDate(d.toISOString().substring(0, 10));
    } else if (terms === 'Net 60') {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + 60);
      setInvDueDate(d.toISOString().substring(0, 10));
    }
  };

  const defaultProfileTemplate = {
    username: 'alex-morgan',
    name: 'Alex Morgan',
    title: 'Full-Stack Developer & SaaS Designer',
    bio: 'I help early-stage startups design, build, and deploy premium Next.js applications and custom Tailwind CSS design systems.',
    tags: ['React', 'Next.js', 'Figma', 'UI/UX', 'Tailwind'],
    email: 'alex@example.com',
    phone: '+1 (555) 123-4567',
    cover_banner: 'linear-gradient(135deg, #6366f1, #06b6d4)',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    location: 'Remote / San Francisco',
    timezone: 'PST (UTC-8)',
    languages: 'English, Spanish',
    availability_status: 'Available for contract',
    response_time: '< 2 hours',
    starting_price: 'CAD 1,500 or USD 1,500',
    calendly_link: 'https://calendly.com/alex-morgan',
    social_links: {
      twitter: 'https://twitter.com/alexmorgan',
      linkedin: 'https://linkedin.com/in/alexmorgan',
      github: 'https://github.com/alexmorgan',
      website: 'https://alexmorgan.dev'
    },
    services: [
      { name: 'SaaS MVP Development', description: 'Complete development of a responsive web app from Figma designs.', type: 'fixed', amount: 5000 },
      { name: 'UI/UX Design & Prototyping', description: 'High-fidelity Figma mockups, user flows, and wireframes.', type: 'hourly', amount: 95 }
    ],
    portfolio: [
      { title: 'Corvioz Photography Business Dashboard', description: 'A conversion-first platform for photographers.', link: 'https://corvioz.com' }
    ],
    testimonials: [
      { quote: 'Alex delivered our MVP in record time. The quality of code and communication was outstanding.', client: 'Sarah Chen, CEO at Acme AI' }
    ],
    is_public: true
  };

  const initProfileStates = useCallback((parsed) => {
    if (!parsed) return;
    if (parsed.username) {
      setCpUsername(parsed.username);
    } else {
      setCpUsername(current => {
        if (current) return current;
        const slug = (parsed.name || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        return slug || 'photographer';
      });
    }
    setCpName(parsed.name || '');
    setCpTitle(parsed.title || '');
    setCpBio(parsed.bio || '');
    setCpTags(Array.isArray(parsed.tags) ? parsed.tags.join(', ') : (typeof parsed.tags === 'string' ? JSON.parse(parsed.tags || '[]').join(', ') : ''));
    setCpEmail(parsed.contact_email || parsed.email || '');
    setCpPhone(parsed.contact_phone || '');
    const links = parsed.social_links || {};
    setCpTwitter(links.twitter || '');
    setCpLinkedin(links.linkedin || '');
    setCpGithub(links.github || '');
    setCpWebsite(links.website || '');
    setCpBrandColor(links.brand_color || '#4f46e5');
    setCpBrandSecondary(links.brand_secondary || '#06b6d4');
    setCpThemePreference(links.theme_preference || 'dark');
    setCpFontFamily(links.font_family || 'Inter');
    setCpLogoUrl(links.logo_url || '');
    setCpServices(Array.isArray(parsed.services) ? parsed.services : JSON.parse(parsed.services || '[]'));
    setCpPortfolio(Array.isArray(parsed.portfolio) ? parsed.portfolio : JSON.parse(parsed.portfolio || '[]'));

    // Sleek new details
    setCpCoverBanner(parsed.cover_banner || '');
    setCpAvatarUrl(parsed.avatar_url || '');
    setCpLocation(parsed.location || '');
    setCpTimezone(parsed.timezone || '');
    setCpLanguages(parsed.languages || '');
    setCpAvailabilityStatus(parsed.availability_status || 'Available for contract');
    setCpResponseTime(parsed.response_time || '< 2 hours');
    setCpStartingPrice(parsed.starting_price || 'CAD 1,000 or USD 1,000');
    setCpCalendlyLink(parsed.calendly_link || '');
    setCpVerifiedBadge(parsed.verified_badge !== false);
    setCpTopRatedBadge(parsed.top_rated_badge === true);
    setCpFastResponseBadge(parsed.fast_response_badge === true);
    setCpIsPublic(parsed.is_public !== false);
    setCpTestimonials(Array.isArray(parsed.testimonials) ? parsed.testimonials : JSON.parse(parsed.testimonials || '[]'));
  }, [
    setCpUsername, setCpName, setCpTitle, setCpBio, setCpTags, setCpEmail, setCpPhone,
    setCpTwitter, setCpLinkedin, setCpGithub, setCpWebsite, setCpServices, setCpPortfolio,
    setCpCoverBanner, setCpAvatarUrl, setCpLocation, setCpTimezone, setCpLanguages,
    setCpAvailabilityStatus, setCpResponseTime, setCpStartingPrice, setCpCalendlyLink,
    setCpVerifiedBadge, setCpTopRatedBadge, setCpFastResponseBadge, setCpIsPublic, setCpTestimonials
  ]);

  // Sync profile data to local state variables, ensuring First Value Moment (FVM) with pre-filled examples
  useEffect(() => {
    if (cardProfile && Object.keys(cardProfile).length > 0) {
      initProfileStates(cardProfile);
    } else {
      initProfileStates(defaultProfileTemplate);
    }
  }, [cardProfile, initProfileStates]);

  const clearDashboardData = useCallback(() => {
    invalidateDashboardData();
    setDashboardDataError(null);
    setUser({});
    setLeads([]);
    setQuotes([]);
    setQuotesError(null);
    setInvoices([]);
    setClients([]);
    setCardProfile(null);
  }, [invalidateDashboardData, setDashboardDataError, setUser, setLeads, setQuotes, setQuotesError, setInvoices, setClients, setCardProfile]);

  const resetAccountScopedState = useCallback(() => {
    setQuoteView('list');
    setInvoiceView('list');
    setInvoiceFlowStage('create');
    setInvoiceFlowLocked(false);
    setQId('');
    setQClientId(null);
    setQPhotographyScope(createEmptyPhotographyScope());
    setQQuoteProvenance(null);
    setSelectedQuotePresetId('');
    setQuotePresetSelectionTouched(false);
    setUsageRightsExpanded(false);
    if (typeof setSemanticReviewState === 'function') setSemanticReviewState({ status: 'READY', inputFingerprint: null, semanticFindings: [] });
    setInvId('');
    setInvClientId(null);
    setInvQuoteId(null);
    setExpandedClientDocumentsId(null);
  }, [setQuoteView, setInvoiceView, setInvoiceFlowStage, setInvoiceFlowLocked, setQId, setQClientId, setQPhotographyScope, setQQuoteProvenance, setSelectedQuotePresetId, setQuotePresetSelectionTouched, setUsageRightsExpanded, setSemanticReviewState, setInvId, setInvClientId, setInvQuoteId, setExpandedClientDocumentsId]);

  const getDashboardTabs = useCallback((state) => {
    return [
      { id: 'overview', label: 'Overview' },
      { id: 'quotes', label: 'Quotes' },
      { id: 'invoices', label: 'Invoices' },
      { id: 'clients', label: 'Clients' },
      { id: 'profile', label: 'Public Profile', sectionBefore: true }
    ];
  }, []);

  const handleDashboardTabChange = useCallback((tab, source = 'dashboard') => {
    if (invoiceFlowLocked && activeTab === 'invoices' && invoiceView !== 'list' && source !== 'invoice_flow_exit') {
      setActiveTab('invoices');
      triggerToast('Continue the invoice, save a draft, or use Exit to dashboard.', 'info');
      return;
    }

    let resolvedTab = tab;
    const validTabs = [
      { id: 'overview', label: 'Overview' },
      { id: 'quotes', label: 'Quotes' },
      { id: 'invoices', label: 'Invoices' },
      { id: 'clients', label: 'Clients' },
      { id: 'profile', label: 'Public Profile' }
    ];
    const validTabIds = validTabs.map(t => t.id);

    if (!validTabIds.includes(tab)) {
      resolvedTab = validTabIds[0] || 'overview';
    }
    trackEvent('dashboard_tab_click', { tab: resolvedTab, source });
    setActiveTab(resolvedTab);
    if (!previewMode && pathname === '/dashboard' && typeof window !== 'undefined') {
      const nextRoute = getDashboardRouteForTab(resolvedTab);
      const currentRoute = `${window.location.pathname}${window.location.search}`;
      if (currentRoute !== nextRoute) router.push(nextRoute);
    }
    setFormError('');
    setFormSuccess('');
  }, [activeTab, invoiceFlowLocked, invoiceView, pathname, previewMode, router, triggerToast]);

  const renderPaidLockState = (title, description, targetPlan = 'pro') => {
    if (isEntitlementLoading) {
      return (
        <div className="animate-fade-in" style={{
          minHeight: '48vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '40px 24px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--primary)',
            animation: 'spin 0.9s linear infinite'
          }} />
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 800 }}>Loading dashboard access</h2>
          <p style={{ margin: 0, maxWidth: '460px', lineHeight: 1.5 }}>
            We are validating your session and entitlement state before opening {title.toLowerCase()}.
          </p>
        </div>
      );
    }

    if (isEntitlementError) {
      return (
        <div className="animate-fade-in" style={{
          minHeight: '48vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          padding: '40px 24px',
          textAlign: 'center',
          border: '1px dashed var(--border)',
          borderRadius: '12px',
          background: 'var(--btn-secondary-bg)',
          margin: '24px 0'
        }}>
          <Icons.Warning size={32} style={{ color: 'var(--danger)' }} />
          <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 800 }}>Dashboard access unavailable</h2>
          <p style={{ margin: 0, maxWidth: '500px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            We could not resolve your entitlement state. Refresh the dashboard or sign in again before continuing.
          </p>
          <button type="button" onClick={() => window.location.reload()} className="btn btn-secondary">
            Refresh
          </button>
        </div>
      );
    }

    if (typeof window !== 'undefined' && window.__corvioz_fire_success_nudge) {
      window.__corvioz_fire_success_nudge('INVOICE_CREATED');
    }
    return (
      <div className="animate-fade-in" style={{
        minHeight: '48vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        padding: '40px 24px',
        textAlign: 'center',
        border: '1px dashed var(--border)',
        borderRadius: '12px',
        background: 'var(--btn-secondary-bg)',
        margin: '24px 0'
      }}>
        <Icons.Lock size={32} style={{ color: 'var(--primary)' }} />
        <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 800 }}>{title}</h2>
        <p style={{ margin: 0, maxWidth: '520px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {description}
        </p>
        <Link href={`/pricing?plan=${targetPlan}`} className="btn btn-primary" style={{ textDecoration: 'none' }}>
          Upgrade to {targetPlan === 'pro' ? 'Pro' : targetPlan}
        </Link>
      </div>
    );
  };

  const renderGuestLockState = (title, description) => {
    return (
      <div className="animate-fade-in" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '60vh', 
        padding: '40px 24px', 
        textAlign: 'center', 
        border: '1px dashed var(--border)', 
        borderRadius: '16px', 
        background: 'var(--btn-secondary-bg)', 
        margin: '24px 0' 
      }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          borderRadius: '50%', 
          background: 'var(--primary-glow)', 
          border: '1.5px solid var(--primary)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: '24px' 
        }}>
          <Icons.Lock size={28} style={{ color: 'var(--primary)' }} />
        </div>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '4px 12px', 
          borderRadius: '99px', 
          background: 'rgba(245, 158, 11, 0.1)', 
          border: '1px solid rgba(245, 158, 11, 0.3)', 
          color: 'var(--warning-text, #fbbf24)', 
          fontSize: '0.75rem', 
          fontWeight: 700, 
          marginBottom: '16px', 
          textTransform: 'uppercase', 
          letterSpacing: '0.05em' 
        }}>
          <span>Preview Mode</span>
        </div>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 800, 
          color: 'var(--text-main)', 
          margin: '0 0 12px 0', 
          letterSpacing: '-0.02em' 
        }}>{title}</h2>
        <p style={{ 
          color: 'var(--text-muted)', 
          fontSize: '0.9rem', 
          maxWidth: '480px', 
          lineHeight: '1.55', 
          margin: '0 0 28px 0' 
        }}>
          {description}
          <br />
          <span style={{ fontWeight: 600, color: 'var(--primary)', marginTop: '12px', display: 'block' }}>
            Available after account creation.
          </span>
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/signup" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '0.9rem', fontWeight: 800, textDecoration: 'none' }}>
            Get Started
          </Link>
          <button 
            type="button"
            onClick={() => handleDashboardTabChange('invoices', 'guest_lock_back')} 
            className="btn btn-secondary" 
            style={{ padding: '12px 24px', fontSize: '0.9rem' }}
          >
            Back to Invoice Builder
          </button>
        </div>
      </div>
    );
  };

  const handleSignOut = async () => {
    if (isSigningOutRef.current) return;
    isSigningOutRef.current = true;
    setIsSigningOut(true);
    setAccountMenuOpen(false);

    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('corvioz_sandbox_mode');
      }
      if (supabaseClient) {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
      }
      clearAnalyticsUserId();
      clearDashboardData();
      resetAccountScopedState();
      router.replace('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
      isSigningOutRef.current = false;
      setIsSigningOut(false);
      triggerToast('Sign out failed. Please try again.', 'error');
    }
  };

  // Auth initialization
  useEffect(() => {
    if (previewMode) return;
    const timer = setTimeout(() => {
      const client = createBrowserSupabaseClient();
      setSupabaseClient(client);
      if (!client) {
        fetchData().then((snapshot) => {
          setDashboardDataError(snapshot?.error || null);
        }).finally(() => setAuthChecked(true));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData, previewMode]);

  useEffect(() => {
    if (previewMode) return;
    if (supabaseClient === undefined) return;
    if (!supabaseClient) return;

    let cancelled = false;

    const hydrateSession = async () => {
      if (!sessionRef.current) {
        setAuthChecked(false);
      }
      const { data } = await supabaseClient.auth.getSession();
      if (cancelled) return;

      const nextSession = data.session || null;
      setSession(nextSession);

      if (nextSession) {
        setAnalyticsUserId(nextSession.user?.id);
        trackDashboardViewOnce({ auth_state: 'authenticated', user_id: nextSession.user?.id });
        setAuthChecked(true);
        trackEvent('login_success', { provider: nextSession.user?.app_metadata?.provider || 'unknown', user_id: nextSession.user?.id });
        const dashboardSnapshot = await fetchData(nextSession.access_token);
        if (cancelled) return;
        setDashboardDataError(dashboardSnapshot?.error || null);
        if (dashboardSnapshot?.user && !dashboardSnapshot.user.hasActivated && !isFirstQuoteFlowRoute()) {
          router.replace('/onboarding');
          return;
        }
        const decision = ENTRY_AUTHORITY({
          session: nextSession,
          user: dashboardSnapshot?.user,
          pathname,
        });
        if (decision.shouldRedirect) {
          applyEntryRouteTransition(router, {
            session: nextSession,
            user: dashboardSnapshot?.user,
            pathname,
          }, { onlyIfRedirect: true });
          return;
        }
        restoreUserIntent(nextSession.user?.id, decision.state);
      } else {
        clearAnalyticsUserId();
        clearDashboardData();
        redirectToAuth('dashboard_initial_auth_guard');
        return;
      }

      if (!cancelled) setAuthChecked(true);
    };

    hydrateSession();

    const { data: listener } = supabaseClient.auth.onAuthStateChange(async (_event, nextSession) => {
      const authEventAction = getDashboardAuthEventAction(_event, nextSession);
      if (authEventAction === 'ignore') return;
      const previousUserId = sessionRef.current?.user?.id || null;
      const nextUserId = nextSession?.user?.id || null;
      const isAccountSwitch = Boolean(previousUserId && nextUserId && previousUserId !== nextUserId);
      if (!nextSession && !sessionRef.current) {
        setAuthChecked(false);
      }
      if (isAccountSwitch) {
        clearDashboardData();
        resetAccountScopedState();
        setAuthChecked(false);
      }
      sessionRef.current = authEventAction === 'clear' ? null : nextSession;
      setSession(authEventAction === 'clear' ? null : nextSession);

      if (authEventAction === 'refresh') {
        setAnalyticsUserId(nextSession.user?.id);
        if (!isAccountSwitch) setAuthChecked(true);
        if (_event === 'SIGNED_IN') {
          trackDashboardViewOnce({ auth_state: 'authenticated', auth_event: _event, user_id: nextSession.user?.id });
          triggerToast('Welcome back! Successfully signed in.', 'success');
          trackEvent('login_success', { provider: nextSession.user?.app_metadata?.provider || 'unknown', user_id: nextSession.user?.id });
        }
        const dashboardSnapshot = await fetchData(nextSession.access_token);
        if (cancelled) return;
        setDashboardDataError(dashboardSnapshot?.error || null);
        if (dashboardSnapshot?.user && !dashboardSnapshot.user.hasActivated && !isFirstQuoteFlowRoute()) {
          router.replace('/onboarding');
          return;
        }
        const decision = ENTRY_AUTHORITY({
          session: nextSession,
          user: dashboardSnapshot?.user,
          pathname,
        });
        if (decision.shouldRedirect) {
          applyEntryRouteTransition(router, {
            session: nextSession,
            user: dashboardSnapshot?.user,
            pathname,
          }, { onlyIfRedirect: true });
          return;
        }
        restoreUserIntent(nextSession.user?.id, decision.state);
      } else {
        clearAnalyticsUserId();
        clearDashboardData();
        resetAccountScopedState();
        if (!isSigningOutRef.current) {
          redirectToAuth('dashboard_session_auth_guard');
        }
        return;
      }
      setAuthChecked(true);
    });

    return () => {
      cancelled = true;
      listener?.subscription?.unsubscribe();
      invalidateDashboardData({ updateState: false, resetQuotesInitialLoad: true });
    };
  }, [clearDashboardData, fetchData, invalidateDashboardData, pathname, previewMode, redirectToAuth, resetAccountScopedState, router, supabaseClient, trackDashboardViewOnce, restoreUserIntent, triggerToast]);

  useEffect(() => {
    if (previewMode) return;

    if (initialTool === 'quote') {
      trackEvent('quote_create', { source: 'route_entry' });
    }

    if (initialTool === 'invoice') {
      trackEvent('invoice_create', { source: 'route_entry' });
    }
  }, [initialTool, previewMode]);

  useEffect(() => {
    if (previewMode || !isDevelopment) return;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('corvioz_usage_stats', JSON.stringify({
        invoicesCount: invoices.length,
        quotesCount: quotes.length,
        exportsCount: Number(window.localStorage.getItem('corvioz_export_count') || 0)
      }));
    }
  }, [invoices, quotes, previewMode]);

  // Safe guest draft restore: prompt only, no automatic database writes.
  useEffect(() => {
    if (previewMode || typeof window === 'undefined') return;

    const pendingRaw = window.localStorage.getItem('corvioz_pending_invoice');
    if (!pendingRaw) {
      setPendingInvoiceDraft(null);
      setShowDraftRestorePrompt(false);
      return;
    }

    try {
      setPendingInvoiceDraft(JSON.parse(pendingRaw));
      setShowDraftRestorePrompt(true);
    } catch (err) {
      console.error('Error parsing pending invoice draft:', err);
      setPendingInvoiceDraft(null);
      setShowDraftRestorePrompt(false);
    }
  }, [previewMode]);

  const resetQuoteCreateState = () => {
    setQId('');
    setQClientId(null);
    setQNumber(generateRandomNumberString('QT'));
    setQClientName('');
    setQClientEmail('');
    setQClientAddress('');
    setQItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setQTaxRate(0);
    setQDiscountRate(0);
    setQCurrency('USD');
    setQNotes('');
    setQDate(getTodayString());
    setQStatus('draft');
    setSelectedQuotePresetId('');
    if (typeof setQuotePresetSelectionTouched === 'function') setQuotePresetSelectionTouched(false);
    if (typeof setQPhotographyScope === 'function') setQPhotographyScope(createEmptyPhotographyScope());
    if (typeof setQQuoteProvenance === 'function') setQQuoteProvenance(null);
    if (typeof setUsageRightsExpanded === 'function') setUsageRightsExpanded(false);
    if (typeof setScopeFieldsExpanded === 'function') setScopeFieldsExpanded(false);
    if (typeof setSemanticReviewState === 'function') setSemanticReviewState({ status: 'READY', inputFingerprint: null, semanticFindings: [] });
    setIsFirstQuoteFlow(false);
    setQClientNameTouched(false);
    setQClientEmailTouched(false);
    setQSubmitAttempted(false);
  };

  const resetInvoiceCreateState = () => {
    setInvId('');
    setInvClientId(null);
    setPendingSendRetryInvoiceId('');
    setInvNumber(generateRandomNumberString('INV'));
    setInvClientName('Acme Corporation');
    setInvClientEmail('client@acme.com');
    setInvClientAddress('123 Creative Way\nSan Francisco, CA 94107');
    setInvItems([{ description: 'Software Development & Consulting Services', quantity: 1, unitPrice: 1500 }]);
    setInvTaxRate(0);
    setInvDiscountRate(0);
    setInvCurrency('USD');
    setInvNotes('Thank you. Please review the invoice document details.');
    setInvDate(getTodayString());
    setInvDueDate(getFutureDateString(30));
    setInvPaymentTerms('Net 30');
    setInvStatus('pending');
    setInvPaymentLink('');
    setInvQuoteId(null);
    setInvBillingType('standard');
    setInvoiceFlowStage('create');
    setInvoiceFlowLocked(true);
    setShowPaymentWaitingBanner(false);
  };

  const handleRestorePendingInvoiceDraft = () => {
    if (!pendingInvoiceDraft) return;

    resetInvoiceCreateState();
    setInvNumber(pendingInvoiceDraft.invoice_number || generateRandomNumberString('INV'));
    setInvClientId(pendingInvoiceDraft.client_id || null);
    setInvClientName(pendingInvoiceDraft.client_name || '');
    setInvClientEmail(pendingInvoiceDraft.client_email || '');
    setInvClientAddress(pendingInvoiceDraft.client_address || '');
    setInvCurrency(pendingInvoiceDraft.currency || 'USD');
    setInvItems(Array.isArray(pendingInvoiceDraft.items) ? pendingInvoiceDraft.items : []);
    setInvDiscountRate(pendingInvoiceDraft.discount_rate || 0);
    setInvTaxRate(pendingInvoiceDraft.tax_rate || 0);
    setInvPaymentTerms(pendingInvoiceDraft.payment_terms || 'Net 30');
    setInvDate(pendingInvoiceDraft.invoice_date || getTodayString());
    setInvDueDate(pendingInvoiceDraft.due_date || getFutureDateString(30));
    setInvPaymentLink(pendingInvoiceDraft.payment_link || '');

    const parsedNotes = deserializeInvoiceNotes(pendingInvoiceDraft.notes || '');
    setInvNotes(parsedNotes.notes || pendingInvoiceDraft.notes || '');
    setInvBillingType(parsedNotes.billing_type || 'standard');

    setActiveTab('invoices');
    setInvoiceView('create');
    setShowDraftRestorePrompt(false);
    triggerToast('Draft restored locally. Review it before saving.', 'success');
  };

  // AI Generate Quote From Lead
  const handleAiQuoteGeneration = async (lead) => {
    trackEvent('create_quote_click', { source: 'ai_generator' });
    evaluateAction('create_quote', async () => {
      if (!session) {
        setIsParsingLead(lead.id);
        setTimeout(() => {
          setIsParsingLead(null);
          resetQuoteCreateState();
          setQQuoteProvenance(createLeadQuoteProvenance(lead.id));
          setQClientName(lead.client_name || lead.name || 'Mock Client');
          setQClientEmail(lead.client_email || lead.email || 'client@example.com');
          setQClientAddress(lead.client_address || '123 Enterprise Way');
          setQNumber(generateRandomNumberString('QT'));
          setQNotes(`Based on Sandbox Inquiry: "${lead.message?.substring(0, 50) || 'Consulting request'}..."`);
          setQDate(getTodayString());
          setQStatus('draft');
          setQItems([
            { description: 'Phase 1: Brand Strategy & Mockups', quantity: 1, unitPrice: 0 },
            { description: 'Phase 2: Custom Core Frontend Engineering', quantity: 1, unitPrice: 0 },
            { description: 'Phase 3: Integration & Launch Clearance', quantity: 1, unitPrice: 0 }
          ]);
          setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'quote_generated', pipeline_status: 'Quote Sent' } : l));
          handleDashboardTabChange('quotes', 'lead_ai_quote');
          setQuoteView('create');
          triggerToast('AI generated quote draft from visitor inquiry (Sandbox)!', 'success');
        }, 1000);
        return;
      }
      setIsParsingLead(lead.id);
      try {
        const res = await fetch('/api/quotes/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message_text: lead.message })
        });

        if (res.ok) {
          const { parsed_data } = await res.json();
          if (parsed_data) {
            // Pre-populate Quote Editor states
            resetQuoteCreateState();
            setQQuoteProvenance(createLeadQuoteProvenance(lead.id));
            setQNumber(generateRandomNumberString('QT'));
            setQClientName(parsed_data.client_name || lead.name || '');
            setQClientEmail(parsed_data.client_email || lead.email || '');
            setQClientAddress(parsed_data.client_address || '');
            setQCurrency(parsed_data.currency || 'USD');
            setQNotes(parsed_data.notes || `Based on request: "${lead.message.substring(0, 50)}..."`);
            setQDate(getTodayString());
            setQStatus('draft');

            if (parsed_data.items && parsed_data.items.length > 0) {
              setQItems(parsed_data.items.map(i => ({
                description: i.description,
                quantity: i.quantity || 1,
                unitPrice: 0
              })));
            } else {
              setQItems([{ description: `Consulting: ${lead.message.substring(0, 30)}...`, quantity: 1, unitPrice: 0 }]);
            }

            // Move to quote tab and open editor
            handleDashboardTabChange('quotes', 'lead_ai_quote');
            setQuoteView('create');

            // Update Lead Status to 'quote_generated'
            await saveLead({ id: lead.id, status: 'quote_generated' }, session?.access_token);
            triggerToast('AI successfully parsed visitor inquiry into a Quote draft!', 'success');
          }
        } else {
          triggerToast('Failed to generate Quote using AI. You can write the Quote manually.', 'error');
        }
      } catch (error) {
        console.error(error);
        triggerToast('Error during AI Quote parsing.', 'error');
      } finally {
        setIsParsingLead(null);
      }
    });
  };

  const openInvoiceFromQuote = (quote, { firstRevenueDraft = false } = {}) => {
    setInvId('');
    setInvClientId(quote.client_id || null);
    setInvNumber(generateRandomNumberString('INV'));
    setInvClientName(quote.client_name);
    setInvClientEmail(quote.client_email || '');
    setInvClientAddress(quote.client_address || '');
    setInvCurrency(quote.currency || 'USD');
    setInvNotes(deserializeInvoiceNotes(quote.notes || '').notes);
    setInvDate(getTodayString());
    setInvDueDate(getFutureDateString(30));
    setInvPaymentTerms('Net 30');
    setInvStatus(firstRevenueDraft ? 'draft' : 'pending');
    setInvQuoteId(quote.id);
    setInvPaymentLink('');
    setInvoiceFlowStage('create');
    setInvoiceFlowLocked(true);
    setShowPaymentWaitingBanner(false);

    const parsedItems = Array.isArray(quote.items) ? quote.items : (typeof quote.items === 'string' ? JSON.parse(quote.items) : []);
    setInvItems(parsedItems.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice || (item.unit_price || 0) / 100
    })));
    setInvTaxRate(Number(quote.tax_rate || 0));
    setInvDiscountRate(Number(quote.discount_rate || 0));

    trackEvent('quote_convert_to_invoice', { quote_id: quote.id });
    handleDashboardTabChange('invoices', 'quote_conversion');
    setInvoiceView('create');
    triggerToast('Quote loaded into Invoice builder. Add invoice terms and click save.', 'success');
  };

  const openInvoiceDraft = (invoice, quote, created = true) => {
    const parsedItems = Array.isArray(invoice.items) ? invoice.items : [];
    const deserialized = deserializeInvoiceNotes(invoice.notes || '');
    const quotePublicNotes = deserializeInvoiceNotes(quote.notes || '').notes;
    setInvId(invoice.id);
    setInvClientId(invoice.client_id || quote.client_id || null);
    setInvNumber(invoice.invoice_number || generateRandomNumberString('INV'));
    setInvClientName(invoice.client_name || quote.client_name || '');
    setInvClientEmail(invoice.client_email || quote.client_email || '');
    setInvClientAddress(invoice.client_address || quote.client_address || '');
    setInvCurrency(invoice.currency || quote.currency || 'USD');
    setInvNotes(deserialized.notes || quotePublicNotes || '');
    setInvBillingType(deserialized.billing_type);
    setInvDate(invoice.invoice_date || getTodayString());
    setInvDueDate(invoice.due_date || getFutureDateString(30));
    setInvPaymentTerms(invoice.payment_terms || 'Net 30');
    setInvStatus('draft');
    setInvQuoteId(quote.id);
    setInvPaymentLink(invoice.payment_link || '');
    setInvoiceFlowStage('create');
    setInvoiceFlowLocked(false);
    setShowPaymentWaitingBanner(false);
    setInvItems(parsedItems.map(item => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice || (item.unit_price || 0) / 100 })));
    setInvTaxRate(Number(invoice.tax_rate || quote.tax_rate || 0));
    setInvDiscountRate(Number(invoice.discount_rate || quote.discount_rate || 0));
    handleDashboardTabChange('invoices', 'quote_conversion');
    setInvoiceView('create');
    triggerToast(created ? 'Invoice draft created. Review and save it before sending.' : 'Existing Invoice draft opened. Review it before sending.', 'success');
  };

  const handleConvertQuoteToInvoice = async (quote) => {
    trackEvent('create_invoice_click', { source: 'quote_convert' });
    if (quote.status !== 'approved') return;
    try {
      const response = await fetch(`/api/quotes/${quote.id}/invoice-draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to create Invoice draft');
      openInvoiceDraft(result.invoice, quote, result.created !== false);
      await fetchData(session?.access_token);
    } catch (error) {
      triggerToast(error.message || 'Unable to create Invoice draft.', 'error');
    }
  };

  const handleSendQuote = async (quoteOverride = null) => {
    const quote = quoteOverride || (qId ? quotes.find((item) => item.id === qId) : null);
    if (!quote) {
      triggerToast('Save the Quote before sending it.', 'info');
      return false;
    }
    if (quote.status !== 'draft') {
      triggerToast('Only a saved draft Quote can be sent.', 'info');
      return false;
    }
    if (!quote.client_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quote.client_email.trim())) {
      triggerToast('Add a valid client email before sending the Quote.', 'error');
      return false;
    }

    setIsSendingQuote(true);
    setFormError('');
    try {
      const quoteResponse = await fetch(`/api/quotes/${quote.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const quoteResult = await quoteResponse.json().catch(() => ({}));
      if (!quoteResponse.ok) throw new Error(quoteResult.error || 'Unable to send Quote.');

      const sentQuote = quoteResult.data || quoteResult;
      if (qId === quote.id) setQStatus(sentQuote.status || 'sent');
      await fetchData(session?.access_token);
      const recipient = sentQuote.client_email || quote.client_email;
      setFormSuccess(`Quote sent to ${recipient}.`);
      triggerToast(`Quote sent to ${recipient}.`, 'success');
      return true;
    } catch (error) {
      console.error(error);
      setFormError(error.message || 'Unable to send Quote.');
      triggerToast(error.message || 'Unable to send Quote.', 'error');
      return false;
    } finally {
      setIsSendingQuote(false);
    }
  };

  const handleSendFirstRevenueQuote = async () => {
    if (!firstRevenueLoop?.can_send_quote || !firstRevenueLoop.quote_id) return false;
    const quote = quotes.find((item) => item.id === firstRevenueLoop.quote_id);
    if (!quote) {
      triggerToast('Your first quote is still loading. Refresh and try again.', 'error');
      return false;
    }
    return handleSendQuote(quote);
  };

  const handleOpenFirstRevenueInvoiceDraft = () => {
    if (!canCreateFirstRevenueInvoiceDraft) return;
    const quote = quotes.find((item) => item.id === firstRevenueLoop.quote_id);
    if (!quote) {
      triggerToast('Your approved quote is still loading. Refresh and try again.', 'error');
      return;
    }
    handleConvertQuoteToInvoice(quote);
  };

  const handlePrepareFirstRevenuePayment = () => {
    if (!firstRevenueLoop?.can_prepare_payment || !firstRevenueLoop.invoice_id) return;
    const invoice = invoices.find((item) => item.id === firstRevenueLoop.invoice_id);
    if (!invoice) {
      triggerToast('Your linked invoice is still loading. Refresh and try again.', 'error');
      return;
    }
    setInvId(invoice.id);
    setInvClientId(invoice.client_id || null);
    setInvNumber(invoice.invoice_number);
    setInvClientName(invoice.client_name);
    setInvClientEmail(invoice.client_email || '');
    setInvClientAddress(invoice.client_address || '');
    setInvCurrency(invoice.currency || 'USD');
    const deserialized = deserializeInvoiceNotes(invoice.notes);
    setInvNotes(deserialized.notes);
    setInvBillingType(deserialized.billing_type);
    setInvTaxRate(Number(invoice.tax_rate || 0));
    setInvDiscountRate(Number(invoice.discount_rate || 0));
    setInvDate(invoice.invoice_date || getTodayString());
    setInvDueDate(invoice.due_date || getFutureDateString(30));
    setInvPaymentTerms(invoice.payment_terms || 'Net 30');
    setInvPaymentLink(invoice.payment_link || '');
    setInvQuoteId(invoice.quote_id || null);
    const itemsParsed = Array.isArray(invoice.items) ? invoice.items : JSON.parse(invoice.items || '[]');
    setInvItems(itemsParsed.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice || (item.unit_price || 0) / 100
    })));
    setInvStatus(invoice.status);
    setInvoiceFlowStage('create');
    setInvoiceFlowLocked(true);
    setShowPaymentWaitingBanner(false);
    handleDashboardTabChange('invoices', 'first_revenue_payment');
    setInvoiceView('edit');
  };

  const openRecordPaymentModal = (invoice) => {
    const amountDueCents = Number(invoice?.amount_due_cents ?? invoice?.total ?? 0);
    const safeAmountDueCents = Number.isSafeInteger(amountDueCents) && amountDueCents > 0 ? amountDueCents : 0;
    setRecordPaymentInvoice(invoice);
    setRecordPaymentAmount(safeAmountDueCents > 0 ? (safeAmountDueCents / 100).toFixed(2) : '');
    setRecordPaymentError('');
  };

  const closeRecordPaymentModal = () => {
    if (isRecordingPayment) return;
    setRecordPaymentInvoice(null);
    setRecordPaymentAmount('');
    setRecordPaymentError('');
  };

  const handleRecordPayment = async (invoice, entered = recordPaymentAmount) => {
    const amountCents = Math.round(Number(entered) * 100);
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      setRecordPaymentError('Enter a positive payment amount.');
      return false;
    }

    setRecordPaymentError('');
    setIsRecordingPayment(true);
    try {
      const attemptStore = getRecordPaymentAttemptStore();
      const paymentAttempt = attemptStore.getOrCreate({
        invoiceId: invoice.id,
        currency: invoice.currency || 'USD',
        amountCents,
      });
      const { idempotencyKey } = paymentAttempt;
      const response = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ amount_cents: amountCents, currency: invoice.currency || 'USD', idempotency_key: idempotencyKey })
      });
      const result = await response.json().catch(() => ({}));
      if (attemptStore.shouldClearAfterResponse(response)) {
        attemptStore.clear(paymentAttempt.storageKey);
      }
      if (!response.ok) throw new Error(result.error || 'Unable to record payment.');
      await fetchData(session?.access_token);
      setRecordPaymentInvoice(null);
      setRecordPaymentAmount('');
      triggerToast(`Payment recorded. State: ${result.payment_status || 'updated'}.`, 'success');
      return true;
    } catch (error) {
      setRecordPaymentError(error.message || 'Unable to record payment.');
      return false;
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleViewLead = (lead) => {
    const crm = getLeadCRMFields(lead);
    setSelectedLead(lead);
    setLeadPipelineStatus(getLeadPipelineStatus(lead));
    setLeadValue(crm.value);
    setLeadSource(crm.source);
    setLeadTags(crm.tags);
    setLeadLastContactDate(crm.lastContactDate);
    setLeadNotes(crm.notes);
    setLeadReminderDate(crm.reminderDate);
    setShowLeadModal(true);
  };

  const updateQPhotographyScope = (field, value) => {
    setQPhotographyScope((currentScope) => updatePhotographyScopeField(currentScope, field, value));
  };

  const handleUsageRightsStatusChange = (status) => {
    const result = setPhotographyUsageRightsStatus(qPhotographyScope, status);
    if (result.requiresConfirmation) {
      const confirmed = typeof window !== 'undefined' && window.confirm(
        'Changing Usage Rights to Not applicable will clear the existing usage details. Continue?'
      );
      if (!confirmed) return;
      setQPhotographyScope(setPhotographyUsageRightsStatus(qPhotographyScope, status, { confirmClear: true }).scope);
    } else {
      setQPhotographyScope(result.scope);
    }
    setUsageRightsExpanded(status === 'specified');
  };

  const getCurrentSemanticReviewFingerprint = useCallback(() => {
    if (!selectedQuotePresetId) return null;
    try {
      return buildPhotographySemanticReviewInput({
        templateId: selectedQuotePresetId,
        scope: qPhotographyScope,
        lineItems: qItems,
        publicNotes: qNotes,
        currency: qCurrency,
      }).inputFingerprint;
    } catch (_) {
      return null;
    }
  }, [qPhotographyScope, qItems, qNotes, qCurrency, selectedQuotePresetId]);

  const currentSemanticReviewFingerprint = getCurrentSemanticReviewFingerprint();

  const handleRunSemanticReview = async () => {
    if (!session?.access_token) {
      setSemanticReviewState({ status: 'UNAVAILABLE_OR_ERROR', inputFingerprint: currentSemanticReviewFingerprint, semanticFindings: [] });
      triggerToast('Sign in to run Review with Corvioz.', 'info');
      return;
    }
    if (!selectedQuotePresetId) {
      setSemanticReviewState({ status: 'UNAVAILABLE_OR_ERROR', inputFingerprint: null, semanticFindings: [] });
      triggerToast('Choose a photography workflow before running semantic review.', 'info');
      return;
    }
    let input;
    try {
      input = buildPhotographySemanticReviewInput({
        templateId: selectedQuotePresetId,
        scope: qPhotographyScope,
        lineItems: qItems,
        publicNotes: qNotes,
        currency: qCurrency,
      });
    } catch (error) {
      setSemanticReviewState({ status: 'UNAVAILABLE_OR_ERROR', inputFingerprint: currentSemanticReviewFingerprint, semanticFindings: [] });
      triggerToast(error.message || 'Review input needs attention.', 'error');
      return;
    }

    setSemanticReviewState({ status: 'REVIEWING', inputFingerprint: input.inputFingerprint, semanticFindings: [] });
    try {
      const response = await fetch('/api/intelligence/photography-quote-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          templateId: selectedQuotePresetId,
          scope: input.scope,
          lineItems: input.lineItems,
          publicNotes: input.publicNotes,
          currency: input.currency,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Review with Corvioz is unavailable.');
      setSemanticReviewState({
        status: result.status || 'UNAVAILABLE_OR_ERROR',
        inputFingerprint: result.inputFingerprint || input.inputFingerprint,
        semanticFindings: Array.isArray(result.semanticFindings) ? result.semanticFindings : [],
      });
      if (result.status === 'COMPLETE') {
        triggerToast('Review with Corvioz is complete.', 'success');
      } else {
        triggerToast('Semantic review is unavailable. Structured checks remain active.', 'info');
      }
    } catch (error) {
      setSemanticReviewState({ status: 'UNAVAILABLE_OR_ERROR', inputFingerprint: input.inputFingerprint, semanticFindings: [] });
      triggerToast(error.message || 'Review with Corvioz is unavailable.', 'error');
    }
  };

  // Templates guide Scope capture. They never write line items, rates, or terms.
  const handleApplyQuotePreset = (templateId, { suppressSuccessFeedback = false } = {}) => {
    const workflowTemplate = getPhotographyWorkflowTemplateById(templateId);
    if (workflowTemplate) {
      setSelectedQuotePresetId(workflowTemplate.id);
      setQuotePresetSelectionTouched(true);
      setScopeFieldsExpanded(false);
      if (!suppressSuccessFeedback) triggerToast(`Applied "${workflowTemplate.label}" workflow template.`, 'success');
      sendEvent('TEMPLATE_VIEWED', {
        template_type: 'photography_workflow_template',
        preset_id: workflowTemplate.id,
        preset_name: workflowTemplate.label,
        source: isFirstQuoteFlow ? 'first_quote_onboarding' : 'quote_create',
      });
    }
  };

  const handleSkipQuotePreset = ({ suppressFeedback = false } = {}) => {
    setSelectedQuotePresetId('');
    setQuotePresetSelectionTouched(true);
    setQItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setQNotes('');
    setScopeFieldsExpanded(false);
    if (!suppressFeedback) triggerToast('Blank quote ready. Add your shoot, deposit, delivery, and usage rights details.', 'info');
  };

  // Save Quote
  const handleSaveQuote = async (options = {}) => {
    const guidedSave = options?.surface === 'guided';
    const performSave = async () => {
      setQSubmitAttempted(true);
      setFormError('');
      setFormSuccess('');
      
      // Inline validation check before saving
      const clientValidation = validateQuoteClient({ name: qClientName, email: qClientEmail });
      if (!clientValidation.isValid) {
        setFormError('Please resolve all validation errors before saving.');
        return false;
      }
      if (!qItems || qItems.length === 0 || qItems.every(item => !item.description || !item.description.trim())) {
        setFormError('Please add at least one item with a description.');
        return false;
      }

      let currentEditCount = 0;
      let existingMetadata = {};
      if (qId) {
        const existingQuote = quotes.find(q => q.id === qId);
        if (existingQuote) {
          const existingMeta = deserializeInvoiceNotes(existingQuote.notes);
          existingMetadata = existingMeta.metadata || {};
          currentEditCount = (existingMeta.edit_count || 0) + 1;
        }
      }

      const selectedQuotePreset = getPhotographyWorkflowTemplateById(selectedQuotePresetId);
      const presetSelectionWasTouched = typeof quotePresetSelectionTouched !== 'undefined' && quotePresetSelectionTouched;
      const presetId = presetSelectionWasTouched
        ? (selectedQuotePreset?.id || null)
        : (existingMetadata.quote_preset_id ?? selectedQuotePreset?.id ?? null);
      const presetName = presetSelectionWasTouched
        ? (selectedQuotePreset?.label || null)
        : (existingMetadata.quote_preset_name ?? selectedQuotePreset?.label ?? null);
      const workflowTerms = presetSelectionWasTouched
        ? (selectedQuotePreset ? ['shoot', 'deposit', 'delivery', 'usage_rights', 'final_payment'] : [])
        : (existingMetadata.workflow_terms || (selectedQuotePreset ? ['shoot', 'deposit', 'delivery', 'usage_rights', 'final_payment'] : []));
      const scopeValue = typeof qPhotographyScope !== 'undefined' ? qPhotographyScope : null;
      const normalizedScope = typeof normalizePhotographyScope === 'function' && scopeValue
        ? normalizePhotographyScope(scopeValue)
        : scopeValue;
      const existingScope = existingMetadata.photography_scope_v2 && typeof normalizePhotographyScope === 'function'
        ? normalizePhotographyScope(existingMetadata.photography_scope_v2)
        : existingMetadata.photography_scope_v2 || null;
      const quoteProvenance = buildQuoteProvenanceForSave({
        existingProvenance: existingMetadata.quote_provenance_v1,
        draftProvenance: qQuoteProvenance,
        existingScope,
        currentScope: normalizedScope,
      });
      const nextMetadata = {
        ...existingMetadata,
        edit_count: currentEditCount,
        comments: existingMetadata.comments || [],
        files: existingMetadata.files || [],
        quote_preset_id: presetId,
        quote_preset_name: presetName,
        workflow_terms: workflowTerms,
        photography_scope_v2: normalizedScope,
        quote_provenance_v1: quoteProvenance,
      };
      const notesWithMeta = serializeInvoiceNotes(qNotes, nextMetadata);

      const payload = {
        id: qId || undefined,
        client_id: qClientId || null,
        quote_number: qNumber,
        client_name: qClientName.trim(),
        client_email: qClientEmail.trim(),
        client_address: qClientAddress.trim(),
        items: qItems.filter(item => item.description && item.description.trim()),
        discount_rate: qDiscountRate,
        tax_rate: qTaxRate,
        currency: qCurrency,
        notes: notesWithMeta,
        status: qStatus
      };

      if (!session) {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('corvioz_pending_quote', JSON.stringify(payload));
          }

          saveIntendedRoute('/dashboard', 'guest_quote_save');
          triggerToast('Quote draft saved locally! Please sign up to save it securely to your account.', 'success');
          setTimeout(() => {
            redirectToAuth('guest_quote_save');
          }, 1500);
        } catch (err) {
          console.error(err);
          setFormError('Failed to save quote draft locally.');
          return false;
        }
        return true;
      }

      setIsSaving(true);
      try {
        const res = await saveQuote(payload, session?.access_token);
        if (res.success) {
          const savedQuoteId = res.data?.id || qId;
          if (qId) {
            trackEvent('quote_edited', {
              user_id: user?.id,
              quote_id: qId,
              quote_number: qNumber,
              sandbox: isSandboxMode
            });
            trackEvent('revision_event', {
              user_id: user?.id,
              resource_type: 'quote',
              resource_id: qId,
              sandbox: isSandboxMode
            });
          } else {
            trackEvent('quote_created', {
              quote_number: qNumber,
              currency: qCurrency,
              quote_preset_id: selectedQuotePreset?.id || null,
              quote_preset_name: selectedQuotePreset?.label || null,
              sandbox: isDemo
            });
            if (await claimAndEmitFirstActivation({ documentType: 'quote', documentNumber: qNumber, token: session?.access_token, isDemo, isPreview: previewMode, sendEvent })) {
              sendEvent('QUOTE_CREATED_INTENT', { documentType: 'quote', quote_number: qNumber, source: 'auth_flow' });
              sendEvent('FIRST_ACTION_TAKEN', { action: 'first_quote_created' });
              const startedAt = readFirstQuoteStartedAt();
              const completedAt = new Date().toISOString();
              const deltaMs = startedAt ? Math.max(0, Date.parse(completedAt) - Date.parse(startedAt)) : null;
              if (isFirstQuoteFlow) {
                const activationEvent = buildFirstQuoteActivationEvent({
                  userId: session.user?.id || null,
                  quoteId: res.data?.id || qId || null,
                  quoteNumber: qNumber,
                  presetId: selectedQuotePreset?.id || null,
                  completedAt,
                });
                await fetch('/api/events/track', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(activationEvent),
                }).catch((error) => {
                  console.error('Failed to record first quote activation:', error);
                });
              }
              sendEvent('signup_to_first_quote_completed', {
                quote_number: qNumber,
                quote_id: res.data?.id || qId || null,
                preset_id: selectedQuotePreset?.id || null,
                preset_name: selectedQuotePreset?.label || 'Blank Quote',
                started_at: startedAt,
                completed_at: completedAt,
                delta_ms: Number.isFinite(deltaMs) ? deltaMs : null,
                under_10_minutes: Number.isFinite(deltaMs) ? deltaMs <= 10 * 60 * 1000 : null,
                source: isFirstQuoteFlow ? 'first_quote_onboarding' : 'first_quote_save',
              });
            }
          }
          if (!qId && savedQuoteId) setQId(savedQuoteId);
          setQQuoteProvenance(quoteProvenance);
          setFormSuccess(isDemo ? 'Quote saved successfully (Sandbox Mode)!' : 'Quote saved successfully!');
          triggerToast(isDemo ? 'Quote saved successfully (Sandbox Mode)!' : 'Quote saved successfully!', 'success');
          if (!qId && mode === 'live') {
            await fetchData(session?.access_token);
          }
          if (!guidedSave) {
            setSuggestedActionDoc({
              type: 'quote',
              number: qNumber,
              id: res.data?.id || qId || 'mock-id',
              elementId: 'printable-quote'
            });
          }
          setFormSuccess('');
          return true;
        } else {
          setFormError(res.error || 'Failed to save quote. Please verify all inputs.');
          return false;
        }
      } catch (e) {
        console.error(e);
        setFormError('Network error when saving quote.');
        return false;
      } finally {
        setIsSaving(false);
      }
    };

    if (!qId) {
      let resolveSave;
      const saveResult = new Promise((resolve) => { resolveSave = resolve; });
      const decision = await evaluateAction('create_quote', () => {
        performSave().then(resolveSave).catch(() => resolveSave(false));
      });
      if (!decision) resolveSave(false);
      return saveResult;
    } else {
      return performSave();
    }
  };

  // Save Invoice
  const handleSaveInvoice = async ({ advanceToSend = false, exitAfterSave = false } = {}) => {
    const performSave = async () => {
      if (typeof isSelectedInvoiceSettled !== 'undefined' && isSelectedInvoiceSettled) {
        setFormError('This Invoice has recorded payment and is read-only.');
        return false;
      }
      setFormError('');
      setFormSuccess('');
      if (!invClientName || !invClientName.trim()) {
        setFormError('Please enter a recipient client name.');
        return false;
      }
      if (!invItems || invItems.length === 0 || invItems.every(item => !item.description || !item.description.trim())) {
        setFormError('Please add at least one item with a description.');
        return false;
      }
      if (!invDate) {
        setFormError('Please specify an invoice date.');
        return false;
      }
      if (!invDueDate) {
        setFormError('Please specify an invoice due date.');
        return false;
      }

      if (!session) {
        // Guest mode save intercept
        try {
          const notesWithMeta = serializeInvoiceNotes(invNotes, {
            billing_type: invBillingType === 'recurring' ? 'standard' : invBillingType,
            billing_mode: 'manual'
          });

          const payload = {
            client_id: invClientId,
            client_name: invClientName.trim(),
            client_email: invClientEmail.trim(),
            client_address: invClientAddress.trim(),
            currency: invCurrency,
            items: invItems.filter(item => item.description && item.description.trim()),
            discount_rate: invDiscountRate,
            tax_rate: invTaxRate,
            invoice_number: invNumber,
            payment_terms: invPaymentTerms,
            notes: notesWithMeta,
            invoice_date: invDate || getTodayString(),
            due_date: invDueDate || getFutureDateString(30),
            doc_type: 'invoice',
            payment_link: invPaymentLink
          };

          if (typeof window !== 'undefined') {
            window.localStorage.setItem('corvioz_pending_invoice', JSON.stringify(payload));
            window.sessionStorage.setItem('corvioz_invoice_creation_completed', 'true');
            window.sessionStorage.setItem('corvioz_first_invoice_created', 'true');
            sendEvent('INVOICE_CREATED_INTENT', { documentType: 'invoice', invoice_number: invNumber, source: 'guest_flow' });
            sendEvent('FIRST_ACTION_TAKEN', { action: 'first_invoice_created' });
          }
          trackEvent('invoice_created', { invoice_number: invNumber, currency: invCurrency, sandbox: isDemo });

          saveIntendedRoute('/dashboard', 'guest_invoice_save');
          triggerToast('Invoice draft saved locally! Please sign up to save it securely to your account.', 'success');
          setTimeout(() => {
            redirectToAuth('guest_invoice_save');
          }, 1500);
          return true;
        } catch (err) {
          console.error(err);
          setFormError('Failed to save draft locally.');
          return false;
        }
      }

      setIsSaving(true);
      try {
        const isNewInvoice = !invId;
        let currentEditCount = 0;
        let existingComments = [];
        let existingFiles = [];
        if (invId) {
          const existingInv = invoices.find(i => i.id === invId);
          if (existingInv) {
            const existingMeta = deserializeInvoiceNotes(existingInv.notes);
            currentEditCount = (existingMeta.edit_count || 0) + 1;
            existingComments = existingMeta.comments || [];
            existingFiles = existingMeta.files || [];
          }
        }

        const notesWithMeta = serializeInvoiceNotes(invNotes, {
          billing_type: invBillingType === 'recurring' ? 'standard' : invBillingType,
          billing_mode: 'manual',
          edit_count: currentEditCount,
          comments: existingComments,
          files: existingFiles
        });

        const payload = {
          id: invId || undefined,
          client_id: invClientId,
          client_name: invClientName.trim(),
          client_email: invClientEmail.trim(),
          client_address: invClientAddress.trim(),
          currency: invCurrency,
          items: invItems.filter(item => item.description && item.description.trim()),
          discount_rate: invDiscountRate,
          tax_rate: invTaxRate,
          invoice_number: invNumber,
          payment_terms: invPaymentTerms,
          notes: notesWithMeta,
          invoice_date: invDate || getTodayString(),
          due_date: invDueDate || getFutureDateString(30),
          doc_type: 'invoice',
          payment_link: invPaymentLink
        };

        const retrySendOnly = advanceToSend && pendingSendRetryInvoiceId === invId;
        const res = advanceToSend
          ? await saveAndSendInvoice(payload, session?.access_token, invId, retrySendOnly)
          : await saveInvoice(payload, session?.access_token);
        if (res.success) {
          const savedInvoiceId = res?.data?.id || res?.id || res?.invoiceId || invId || '';
          if (savedInvoiceId && isNewInvoice) {
            setInvId(savedInvoiceId);
          }
          if (advanceToSend) setPendingSendRetryInvoiceId('');
          if (isNewInvoice) {
            trackEvent('invoice_created', { invoice_number: invNumber, currency: invCurrency, sandbox: isDemo });
            if (typeof window !== 'undefined') {
              window.sessionStorage.setItem('corvioz_invoice_creation_completed', 'true');
            }
            if (await claimAndEmitFirstActivation({ documentType: 'invoice', documentNumber: invNumber, token: session?.access_token, isDemo, isPreview: previewMode, sendEvent })) {
              if (typeof window !== 'undefined') {
                window.sessionStorage.setItem('corvioz_first_invoice_created', 'true');
                sendEvent('INVOICE_CREATED_INTENT', { documentType: 'invoice', invoice_number: invNumber, source: 'auth_flow' });
                sendEvent('FIRST_ACTION_TAKEN', { action: 'first_invoice_created' });
              }
            }
          }
          const successMessage = advanceToSend
            ? (isDemo ? 'Invoice sent successfully (Sandbox Mode)!' : 'Invoice sent successfully!')
            : (isDemo ? 'Invoice saved successfully (Sandbox Mode)!' : 'Invoice saved successfully!');
          setFormSuccess(successMessage);
          triggerToast(successMessage, 'success');
          setSuggestedActionDoc({
            type: 'invoice',
            number: invNumber,
            id: savedInvoiceId || 'mock-id',
            elementId: 'printable-invoice'
          });
          setFormSuccess('');
          return true;
        } else {
          if (res.saved) {
            if (res.invoiceId && isNewInvoice) setInvId(res.invoiceId);
            if (res.retrySendOnly && res.invoiceId) setPendingSendRetryInvoiceId(res.invoiceId);
            setFormError('Invoice was saved, but sending failed.');
          } else if (res.error === 'QUOTA_EXCEEDED') {
            evaluateAction('create_invoice');
          } else {
            setFormError(res.error || 'Failed to save invoice. Please verify all inputs.');
          }
          return false;
        }
      } catch (e) {
        console.error(e);
        setFormError('Network error when saving invoice.');
        return false;
      } finally {
        setIsSaving(false);
      }
    };

    const finishSave = () => {
      performSave().then((saved) => {
        if (!saved) return;
        if (advanceToSend) {
          setInvoiceFlowStage('send');
          setShowPaymentWaitingBanner(true);
          setInvStatus('sent');
        }
        if (exitAfterSave) {
          handleExitInvoiceFlow();
        }
      });
    };

    if (!invId) {
      const isFirstRevenueInvoiceDraft = Boolean(
        canCreateFirstRevenueInvoiceDraft && invQuoteId === firstRevenueLoop?.quote_id
      );
      if (isFirstRevenueInvoiceDraft) {
        finishSave();
      } else {
        evaluateAction('create_invoice', finishSave);
      }
    } else {
      const saved = await performSave();
      if (!saved) return false;
      if (advanceToSend) {
        setInvoiceFlowStage('send');
        setShowPaymentWaitingBanner(true);
        setInvStatus('sent');
      }
      if (exitAfterSave) {
        handleExitInvoiceFlow();
      }
      return true;
    }
  };

  // Generate Card Profile using AI
  const handleGenerateProfile = async (e) => {
    if (e) e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!profilePrompt.trim()) {
      setFormError('Please enter a description for AI profile generation.');
      return;
    }

    // Paywall Emotional Trigger (PET): Trigger upgrade on second generation attempt
    if (typeof window !== 'undefined') {
      const attempts = Number(window.localStorage.getItem('corvioz_profile_generation_attempts') || 0);
      if (attempts >= 1 && isFreePlan) {
        setFormError('Daily limit reached. Upgrade when you need repeated client workflow support.');
        setModalProps({
          title: "Upgrade Plan",
          description: "Unlock professional branding, an indexable Public Profile, and more quote drafts for repeated client delivery workflows.",
          lockedFeatureValue: "SEO-boosted Public Profile and more AI creations",
          limit: "profile",
          source: "profile_generation_gate"
        });
        setActiveModal('upgrade');
        return;
      }
    }

    setIsGeneratingProfile(true);
    try {
      const response = await fetch('/api/card-profile/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          raw_text: profilePrompt
        })
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.code === 'REVENUE_LOCK_BLOCKED') {
          setModalProps({
            title: "Upgrade Plan",
            description: "Unlock professional branding, an indexable Public Profile, and more quote drafts for repeated client delivery workflows.",
            lockedFeatureValue: "SEO-boosted Public Profile and more AI creations",
            limit: "profile",
            source: "profile_generation_gate"
          });
          setActiveModal('upgrade');
          setFormError(data.error || 'Daily limit reached. Upgrade when you need repeated client workflow support.');
        } else {
          setFormError(data.error || 'Failed to generate profile. Please try again.');
        }
        return;
      }

      // Populate local states with AI results
      initProfileStates(data.parsed_data);
      setFormSuccess('Profile generated successfully! Edit below and click Save.');
      trackEvent('profile_generated', { source: 'ai_generator' });

      // Increment attempts counter
      if (typeof window !== 'undefined') {
        const attempts = Number(window.localStorage.getItem('corvioz_profile_generation_attempts') || 0);
        window.localStorage.setItem('corvioz_profile_generation_attempts', String(attempts + 1));
      }
    } catch (err) {
      console.error(err);
      setFormError('A network error occurred. Please try again.');
    } finally {
      setIsGeneratingProfile(false);
    }
  };

  // Save Card Profile
  const handleSaveCardProfile = async () => {
    setFormError('');
    setFormSuccess('');
    const usernameClean = String(cpUsername || '').toLowerCase().trim();
    if (!usernameClean) {
      setFormError('Please specify a profile username.');
      return;
    }
    if (!/^[a-z0-9_-]{3,40}$/.test(usernameClean)) {
      setFormError('Username must be 3-40 characters and only contain letters, numbers, hyphens, or underscores.');
      return;
    }
    if (!cpName || !cpName.trim()) {
      setFormError('Please enter your professional name.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        username: usernameClean,
        name: cpName.trim(),
        title: cpTitle.trim(),
        bio: cpBio.trim(),
        tags: cpTags.split(',').map(t => t.trim()).filter(Boolean),
        contact_email: cpEmail.trim(),
        contact_phone: cpPhone.trim(),
        social_links: {
          twitter: cpTwitter.trim(),
          linkedin: cpLinkedin.trim(),
          github: cpGithub.trim(),
          website: cpWebsite.trim(),
          brand_color: cpBrandColor,
          brand_secondary: cpBrandSecondary,
          theme_preference: cpThemePreference,
          font_family: cpFontFamily,
          logo_url: cpLogoUrl
        },
        services: cpServices,
        portfolio: cpPortfolio,
        cover_banner: cpCoverBanner,
        avatar_url: cpAvatarUrl,
        location: cpLocation.trim(),
        timezone: cpTimezone.trim(),
        languages: cpLanguages.trim(),
        availability_status: cpAvailabilityStatus,
        response_time: cpResponseTime,
        starting_price: cpStartingPrice,
        calendly_link: cpCalendlyLink.trim(),
        verified_badge: cpVerifiedBadge,
        top_rated_badge: cpTopRatedBadge,
        fast_response_badge: cpFastResponseBadge,
        is_public: cpIsPublic,
        testimonials: cpTestimonials
      };

      const res = await saveCardProfile(payload, session?.access_token);
      if (res.success) {
        trackEvent('profile_created', { username: usernameClean, is_public: cpIsPublic, sandbox: isDemo });
        setFormSuccess(isDemo ? 'Public profile updated successfully (Sandbox Mode)!' : 'Public profile updated successfully!');
        setTimeout(() => setFormSuccess(''), 3000);
      } else {
        setFormError(res.error || 'Failed to save profile. Please check if the username is already taken.');
      }
    } catch (e) {
      console.error(e);
      setFormError('Error updating profile card.');
    } finally {
      setIsSaving(false);
    }
  };

  // Lead CRM Helper & Handlers
  const getLeadPipelineStatus = (lead) => {
    if (lead.pipeline_status) return lead.pipeline_status;
    try {
      const utm = typeof lead.source_utm === 'object' ? lead.source_utm : JSON.parse(lead.source_utm || '{}');
      if (utm.pipeline_status) return utm.pipeline_status;
    } catch (e) {}

    // Fallbacks
    if (lead.status === 'new') return 'New';
    if (lead.status === 'contacted') return 'Qualified';
    if (lead.status === 'quote_generated') return 'Quote Sent';
    if (lead.status === 'archived') return 'Won';
    return 'New';
  };

  const getLeadCRMFields = (lead) => {
    let utm = {};
    try {
      utm = typeof lead.source_utm === 'object' ? lead.source_utm : JSON.parse(lead.source_utm || '{}');
    } catch (e) {}
    return {
      value: lead.lead_value || utm.lead_value || 0,
      source: lead.source || utm.source || utm.utm_source || utm.ref || 'Direct',
      tags: lead.tags || utm.tags || '',
      lastContactDate: lead.last_contact_date || utm.last_contact_date || '',
      notes: lead.notes || utm.notes || '',
      reminderDate: lead.reminder_date || utm.reminder_date || ''
    };
  };

  const handleSaveLeadCRMDetails = async (leadId, updates) => {
    setIsSaving(true);
    try {
      const res = await saveLead({ id: leadId, ...updates }, session?.access_token);
      if (res.success) {
        triggerToast(isDemo ? 'Lead updated (Sandbox Mode)' : 'Lead updated successfully', 'success');
      } else {
        triggerToast(res.error || 'Failed to update lead details.', 'error');
      }
      setShowLeadModal(false);
      setSelectedLead(null);
    } catch (err) {
      console.error(err);
      triggerToast('Error updating lead details.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Client Details
  const handleSaveClient = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!newClientName || !newClientName.trim()) {
      setFormError('Please enter a client name.');
      return;
    }

    try {
      const currentClientCount = clients ? clients.length : 0;
      const userPlan = String(user?.plan || 'free').toLowerCase();

      if (userPlan === 'studio' && currentClientCount >= 100) {
        setModalProps({
          title: "Client limit reached",
          description: "Your active client list has reached the current plan limit. Contact support if you need room for more clients.",
          lockedFeatureValue: "Additional client capacity",
          limit: "workspace_limit",
          source: "client_creation_gate",
          targetPlan: "support"
        });
        setActiveModal('upgrade');
        setFormError('Client limit reached. Contact support if you need room for more clients.');
        return;
      }

      const payload = {
        name: newClientName.trim(),
        email: newClientEmail.trim(),
        address: newClientAddress.trim()
      };

      const res = await saveClient(payload, session?.access_token);
      if (res.success) {
        setNewClientName('');
        setNewClientEmail('');
        setNewClientAddress('');
        setFormSuccess(isDemo ? 'Client created successfully (Sandbox Mode)!' : 'Client created successfully!');
        setTimeout(() => setFormSuccess(''), 3000);

        if (currentClientCount === 0) {
          setShowBusinessModeModal(true);
          trackEvent('business_mode_activated', { source: 'first_client_creation' });
        } else if (currentClientCount === 1) {
          setShowStudioPreviewModal(true);
          setStudioPreviewActive(true);
          trackEvent('studio_preview_triggered', { source: 'second_client_creation' });
        }
      } else {
        setFormError(res.error || 'Failed to save client.');
      }
    } catch (e) {
      console.error(e);
      setFormError(e?.message || 'Failed to save client.');
    }
  };

  const handleDeleteClient = async (id) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      const res = await deleteClient(id, session?.access_token);
      if (res.success) {
        triggerToast(isDemo ? 'Client deleted (Sandbox Mode).' : 'Client deleted successfully.', 'info');
      } else {
        triggerToast(res.error || 'Failed to delete client.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error deleting client.', 'error');
    }
  };

  const handleDeleteQuote = async (id) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;
    try {
      const res = await deleteQuote(id, session?.access_token);
      if (res.success) {
        triggerToast(isDemo ? 'Quote deleted (Sandbox Mode).' : 'Quote deleted successfully.', 'info');
      } else {
        triggerToast(res.error || 'Failed to delete quote.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error deleting quote.', 'error');
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const res = await deleteInvoice(id, session?.access_token);
      if (res.success) {
        triggerToast(isDemo ? 'Invoice deleted (Sandbox Mode).' : 'Invoice deleted successfully.', 'info');
      } else {
        triggerToast(res.error || 'Failed to delete invoice.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error deleting invoice.', 'error');
    }
  };

  // PDF download trigger
  const handlePdfDownload = async (elementId, name) => {
    await handleExportAttempt(elementId, name);
  };

  const handleExportAttempt = async (elementId, name, resourceId = null) => {
    console.log('[INSTRUMENTATION] export_attempt triggered', { name, resourceId });
    if (previewMode) {
      await triggerActualPdfDownload(elementId, name, false, resourceId);
      return;
    }

    if (!canExportPdf) {
      triggerToast('PDF export is unavailable.', 'error');
      return;
    }
    const watermarkFree = hasCleanPdf;

    // Save parameters and show modal to select export purpose
    setExportPurposeParams({ elementId, name, resourceId, watermarkFree });
    setExportPurpose('draft');
    setExportSentToClient(false);
    setShowExportPurposeModal(true);
  };

  const handleConfirmExport = async () => {
    if (!exportPurposeParams) return;
    const { elementId, name, resourceId, watermarkFree } = exportPurposeParams;
    setShowExportPurposeModal(false);

    const documentType = name.startsWith('quote_') ? 'quote' : 'invoice';
    const currentCount = isDevelopment
      ? Number(window.localStorage.getItem('corvioz_export_count') || 0)
      : exportCount;
    const newCount = currentCount + 1;

    let clientContextId = null;
    let followUpState = 'none';

    if (resourceId) {
      if (documentType === 'invoice') {
        const inv = invoices.find(i => i.id === resourceId);
        if (inv) {
          clientContextId = inv.client_id || inv.client_name || inv.client_email;
          followUpState = inv.status;
        }
      } else if (documentType === 'quote') {
        const q = quotes.find(qi => qi.id === resourceId);
        if (q) {
          clientContextId = q.client_id || q.client_name || q.client_email;
          followUpState = q.status;
        }
      }
    }
    
    if (!clientContextId) {
      clientContextId = documentType === 'invoice' ? (invClientName || invClientEmail || 'guest') : (qClientName || qClientEmail || 'guest');
    }

    const telemetryPayload = {
      document_type: documentType,
      export_count: newCount,
      purpose: exportPurpose,
      sent_to_client: exportSentToClient,
      client_context_id: clientContextId,
      follow_up_state: followUpState,
      watermark_free: watermarkFree,
      source: 'export_purpose_modal'
    };

    await evaluateAction('export_pdf', async () => {
      if (isDevelopment) {
        window.localStorage.setItem('corvioz_export_count', String(newCount));
      }
      setExportCount(newCount);
      sendEvent('FIRST_ACTION_TAKEN', { action: 'export_pdf', documentType, export_count: newCount, source: 'export_purpose_modal' });
      const downloadWatermarkFree = hasCleanPdf;
      await triggerActualPdfDownload(elementId, name, downloadWatermarkFree, resourceId);
    }, telemetryPayload);
  };

  const triggerActualPdfDownload = async (elementId, name, watermarkFree, resourceId = null) => {
    setIsDownloadingPdf(true);
    try {
      const { generatePDF } = await import('@/app/lib/pdf');
      await generatePDF(elementId, `${name}.pdf`, watermarkFree);
      // For first-time guest flow, show success state instead of post-export modal
      if (isFirstGuestFlow) {
        triggerToast('✔ Invoice created! PDF is downloading.', 'success');
      } else {
        triggerToast(`${name.startsWith('quote_') ? 'Quote' : 'Invoice'} PDF exported successfully!`, 'success');
        setPostExportDoc({
          id: resourceId,
          type: name.startsWith('quote_') ? 'quote' : 'invoice',
          number: name.split('_')[1]
        });
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error exporting PDF document.', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Form items handlers
  const handleItemChange = (editorType, index, field, value) => {
    if (editorType === 'quote') {
      const newItems = [...qItems];
      newItems[index][field] = value;
      setQItems(newItems);
    } else {
      const newItems = [...invItems];
      newItems[index][field] = value;
      setInvItems(newItems);
    }
  };

  const addItem = (editorType) => {
    if (editorType === 'quote') {
      setQItems([...qItems, { description: '', quantity: 1, unitPrice: 0 }]);
    } else {
      setInvItems([...invItems, { description: '', quantity: 1, unitPrice: 0 }]);
    }
  };

  const removeItem = (editorType, index) => {
    if (editorType === 'quote') {
      if (qItems.length > 1) setQItems(qItems.filter((_, i) => i !== index));
    } else {
      if (invItems.length > 1) setInvItems(invItems.filter((_, i) => i !== index));
    }
  };

  // Render components based on auth status and tabs
  const getActiveLeads = () => leads;
  const getActiveQuotes = () => quotes;
  const getActiveInvoices = () => invoices;
  const getActiveClients = () => clients;
  const getActiveProfile = () => cardProfile;

  const openDocument = ({ documentType, id } = {}) => {
    if (!id) return false;

    if (documentType === 'quote') {
      const quote = quotes.find((document) => document?.id === id);
      if (!quote) return false;

      const itemsParsed = Array.isArray(quote.items) ? quote.items : JSON.parse(quote.items || '[]');
      setQId(quote.id);
      setQNumber(quote.quote_number || '');
      setQClientName(quote.client_name || '');
      setQClientEmail(quote.client_email || '');
      setQClientAddress(quote.client_address || '');
      setQClientId(quote.client_id || null);
      setQCurrency(quote.currency || 'USD');
      const parsedQuoteNotes = deserializeInvoiceNotes(quote.notes || '');
      const quoteScope = parsedQuoteNotes.metadata?.photography_scope_v2;
      setQQuoteProvenance(parsedQuoteNotes.metadata?.quote_provenance_v1 || null);
      if (typeof setQPhotographyScope === 'function') {
        if (quoteScope && typeof normalizePhotographyScope === 'function') {
          setQPhotographyScope(normalizePhotographyScope(quoteScope));
        } else if (typeof createEmptyPhotographyScope === 'function') {
          setQPhotographyScope(createEmptyPhotographyScope());
        }
      }
      if (typeof setUsageRightsExpanded === 'function') setUsageRightsExpanded(Boolean(quoteScope?.common?.usage_rights?.status === 'specified'));
      if (typeof setScopeFieldsExpanded === 'function') setScopeFieldsExpanded(false);
      setQNotes(parsedQuoteNotes.notes);
      setQTaxRate(Number(quote.tax_rate || 0));
      setQDiscountRate(Number(quote.discount_rate || 0));
      setQDate(quote.created_at?.substring(0, 10) || '');
      setQItems(itemsParsed.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice || (item.unit_price || 0) / 100,
      })));
      setQStatus(quote.status || 'draft');
      setSelectedQuotePresetId(parsedQuoteNotes.metadata?.quote_preset_id || '');
      if (typeof setQuotePresetSelectionTouched === 'function') setQuotePresetSelectionTouched(false);
      setIsFirstQuoteFlow(false);
      setQClientNameTouched(false);
      setQClientEmailTouched(false);
      setQSubmitAttempted(false);
      handleDashboardTabChange('quotes', 'exact_document_open');
      setQuoteView('edit');
      return true;
    }

    if (documentType === 'invoice') {
      const invoice = invoices.find((document) => document?.id === id);
      if (!invoice) return false;

      const deserialized = deserializeInvoiceNotes(invoice.notes);
      const itemsParsed = Array.isArray(invoice.items) ? invoice.items : JSON.parse(invoice.items || '[]');
      setInvId(invoice.id);
      setInvClientId(invoice.client_id || null);
      setInvNumber(invoice.invoice_number || '');
      setInvClientName(invoice.client_name || '');
      setInvClientEmail(invoice.client_email || '');
      setInvClientAddress(invoice.client_address || '');
      setInvCurrency(invoice.currency || 'USD');
      setInvNotes(deserialized.notes);
      setInvBillingType(deserialized.billing_type);
      setInvTaxRate(Number(invoice.tax_rate || 0));
      setInvDiscountRate(Number(invoice.discount_rate || 0));
      setInvDate(invoice.invoice_date || invoice.created_at?.substring(0, 10) || getTodayString());
      setInvDueDate(invoice.due_date || getFutureDateString(30));
      setInvPaymentTerms(invoice.payment_terms || 'Net 30');
      setInvPaymentLink(invoice.payment_link || '');
      setInvQuoteId(invoice.quote_id || null);
      setInvItems(itemsParsed.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice || (item.unit_price || 0) / 100,
      })));
      setInvStatus(invoice.status || 'pending');
      setInvoiceFlowStage('create');
      setInvoiceFlowLocked(true);
      setShowPaymentWaitingBanner(false);
      handleDashboardTabChange('invoices', 'exact_document_open');
      setInvoiceView('edit');
      return true;
    }

    return false;
  };

  // Document total computations
  const currentInvoices = getActiveInvoices();
  const totalPaid = currentInvoices.filter(i => paymentStatusForInvoice(i) === 'paid').reduce((sum, i) => sum + (i.amount_paid_cents ?? i.total ?? 0), 0) / 100;
  const totalPending = currentInvoices.filter(i => ['unpaid', 'partial'].includes(paymentStatusForInvoice(i))).reduce((sum, i) => sum + (i.amount_due_cents ?? i.total ?? 0), 0) / 100;
  const totalOverdue = currentInvoices.filter(i => paymentStatusForInvoice(i) === 'overdue').reduce((sum, i) => sum + (i.amount_due_cents ?? i.total ?? 0), 0) / 100;
  const totalVolume = totalPaid + totalPending + totalOverdue;

  // Init blank Quote
  const initCreateQuote = (options = 'quick_action') => {
    const normalizedOptions = typeof options === 'string' ? { source: options } : (options || {});
    const quoteSource = normalizedOptions.source || 'quick_action';
    const clientContext = normalizedOptions.clientContext || null;
    trackEvent('create_quote_click', { source: quoteSource });
    trackEvent('quick_action_click', { action: 'create_quote', source: quoteSource });
    evaluateAction('create_quote', () => {
      resetQuoteCreateState();
      if (clientContext?.client_id) {
        setQClientId(clientContext.client_id);
        setQClientName(clientContext.client_name || '');
        setQClientEmail(clientContext.client_email || '');
        setQClientAddress(clientContext.client_address || '');
      }
      setIsFirstQuoteFlow(quoteSource === 'first_quote_onboarding');
      handleDashboardTabChange('quotes', quoteSource);
      setQuoteView('create');
    });
  };

  // Init blank Invoice
  const openInvoiceBuilder = (source = 'quick_action', clientContext = null) => {
    resetInvoiceCreateState();
    if (clientContext?.client_id) {
      setInvClientId(clientContext.client_id);
      setInvClientName(clientContext.client_name || '');
      setInvClientEmail(clientContext.client_email || '');
      setInvClientAddress(clientContext.client_address || '');
    }
    handleDashboardTabChange('invoices', source);
    setInvoiceView('create');
  };

  const initCreateInvoice = (options = {}) => {
    const normalizedOptions = typeof options === 'string' ? { source: options } : (options || {});
    const source = normalizedOptions.source || 'quick_action';
    const clientContext = normalizedOptions.clientContext || null;
    trackEvent('create_invoice_click', { source });
    trackEvent('quick_action_click', { action: 'create_invoice', source });
    evaluateAction(
      'create_invoice',
      () => openInvoiceBuilder(source, clientContext),
      clientContext?.client_id ? { client_id: clientContext.client_id } : {}
    );
  };

  const initFirstValueInvoice = () => {
    trackEvent('create_invoice_click', { source: 'first_value_card' });
    openInvoiceBuilder();
  };

  const handleCancelQuote = () => {
    if (typeof setQPhotographyScope === 'function') setQPhotographyScope(createEmptyPhotographyScope());
    if (typeof setUsageRightsExpanded === 'function') setUsageRightsExpanded(false);
    if (typeof setSemanticReviewState === 'function') setSemanticReviewState({ status: 'READY', inputFingerprint: null, semanticFindings: [] });
    setQuoteView('list');
  };

  const handleCancelInvoice = () => {
    setInvoiceFlowLocked(false);
    setInvoiceFlowStage('create');
    setShowPaymentWaitingBanner(false);
    setInvoiceView('list');
  };

  const handleExitInvoiceFlow = () => {
    setInvoiceFlowLocked(false);
    setInvoiceFlowStage('create');
    setShowPaymentWaitingBanner(false);
    setInvoiceView('list');
    handleDashboardTabChange('overview', 'invoice_flow_exit');
  };

  const getInvoiceTotals = () => {
    const subtotal = invItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
    const discounted = subtotal * (1 - Number(invDiscountRate || 0) / 100);
    const tax = discounted * Number(invTaxRate || 0) / 100;
    return {
      subtotal,
      discount: subtotal * Number(invDiscountRate || 0) / 100,
      tax,
      total: discounted + tax,
    };
  };

  const isInvoiceDraftReady = () => {
    return Boolean(
      invClientName &&
      invClientName.trim() &&
      invItems &&
      invItems.length > 0 &&
      invItems.some(item => item.description && item.description.trim()) &&
      invDate &&
      invDueDate
    );
  };

  const goToInvoicePreview = () => {
    setFormError('');
    if (!isInvoiceDraftReady()) {
      setFormError('Complete the client, line items, invoice date, and due date before preview.');
      return;
    }
    setInvoiceFlowStage('preview');
  };

  const renderInvoiceFlowStepper = () => {
    const currentIndex = INVOICE_FLOW_STAGES.findIndex(stage => stage.id === invoiceFlowStage);
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '8px',
        marginBottom: '20px'
      }}>
        {INVOICE_FLOW_STAGES.map((stage, index) => {
          const isDone = index < currentIndex;
          const isActive = stage.id === invoiceFlowStage;
          return (
            <div key={stage.id} style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: isActive ? '1.5px solid var(--primary)' : '1px solid var(--border)',
              background: isActive ? 'var(--primary-glow)' : (isDone ? 'var(--success-glow)' : 'var(--bg-surface)'),
              color: isActive ? 'var(--primary)' : (isDone ? 'var(--success)' : 'var(--text-muted)'),
              fontSize: '0.78rem',
              fontWeight: 800,
              textAlign: 'center'
            }}>
              {index + 1}. {stage.label}
            </div>
          );
        })}
      </div>
    );
  };

  const renderInvoiceReadonlyPreview = ({ compact = false } = {}) => {
    const totals = getInvoiceTotals();
    return (
      <div className="card" style={{
        padding: compact ? '18px' : '24px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Invoice</p>
            <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>{invNumber || 'Draft invoice'}</h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Due</p>
            <strong style={{ color: 'var(--text-main)' }}>{invDueDate || 'Not set'}</strong>
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Client</p>
          <p style={{ margin: 0, color: 'var(--text-main)', fontWeight: 750 }}>{invClientName || 'Client name'}</p>
          {invClientEmail && <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{invClientEmail}</p>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
          {invItems.filter(item => item.description && item.description.trim()).map((item, index) => (
            <div key={`${item.description}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: 'var(--text-soft)', fontSize: '0.85rem' }}>
              <span>{item.description} × {item.quantity || 0}</span>
              <strong style={{ color: 'var(--text-main)' }}>{formatDashboardMoney(Number(item.quantity || 0) * Number(item.unitPrice || 0), invCurrency)}</strong>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span>{formatDashboardMoney(totals.subtotal, invCurrency)}</span>
          </div>
          {Number(invDiscountRate || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
              <span>Discount</span>
              <span>-{formatDashboardMoney(totals.discount, invCurrency)}</span>
            </div>
          )}
          {Number(invTaxRate || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tax</span>
              <span>{formatDashboardMoney(totals.tax, invCurrency)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)', fontWeight: 800, fontSize: '1rem', marginTop: '6px' }}>
            <span>Total</span>
            <span>{formatDashboardMoney(totals.total, invCurrency)}</span>
          </div>
        </div>
      </div>
    );
  };

  const hasNoData = !isLoading && getActiveQuotes().length === 0 && getActiveInvoices().length === 0;
  const shouldShowActivationGuide = !activationGuideDismissed && (showActivationGuide || hasNoData) && activeTab === 'overview' && !previewMode;

  const renderActivationGuide = () => {
    return null;
  };

  const activeClientsCount = clients ? clients.length : 0;
  const activeInvoicesCount = invoices ? invoices.length : 0;
  const hasOverdueInvoices = invoices ? invoices.some(inv => {
    if ((inv.payment_status || inv.status) === 'paid' || !inv.due_date) return false;
    const dueDate = new Date(inv.due_date);
    return dueDate < new Date();
  }) : false;

  const isStudioMode = activeClientsCount >= 3 || activeInvoicesCount >= 5 || hasOverdueInvoices;
  const businessModeBadge = isStudioMode ? 'Business Mode' : 'Photographer Mode';
  const SHOW_DEFERRED_BRAND_KIT = false;

  if (isSigningOut) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2147483647,
          width: '100%',
          minHeight: '100vh',
          background: 'var(--bg-page)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-main)',
          fontSize: '0.9rem',
          fontWeight: 650,
        }}
      >
        Signing out…
      </div>
    );
  }

  if (!authChecked || isLoading) {
    return (
      <div className="dashboard-layout">
        {/* Sidebar skeleton */}
        <aside className="dashboard-sidebar-aside">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 800, marginBottom: '32px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', opacity: 0.8 }} className="animate-pulse"></div>
              <div className="skeleton animate-pulse" style={{ height: '18px', width: '80px' }}></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton animate-pulse" style={{ height: '36px', borderRadius: '8px' }}></div>
              ))}
            </div>
          </div>
        </aside>
        
        {/* Main Panel skeleton */}
        <Container className="dashboard-main-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>

          <div>
            <div style={{ color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Loading dashboard
            </div>
            <div style={{ color: 'var(--text-main)', fontSize: '1.6rem', fontWeight: 900, marginBottom: '8px' }}>
              Preparing your dashboard...
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Checking your session and loading client workflow data.
            </div>
          </div>
          
          {/* Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton animate-pulse" style={{ height: '80px', borderRadius: '8px' }}></div>
            ))}
          </div>
          
          {/* Main content area */}
          <div className="dashboard-grid-2fr-1fr" style={{ gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="skeleton animate-pulse" style={{ height: '200px', borderRadius: '8px' }}></div>
              <div className="skeleton animate-pulse" style={{ height: '160px', borderRadius: '8px' }}></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="skeleton animate-pulse" style={{ height: '140px', borderRadius: '8px' }}></div>
              <div className="skeleton animate-pulse" style={{ height: '100px', borderRadius: '8px' }}></div>
            </div>
          </div>
        </Container>
      </div>

    );
  }

  const qScopeCommon = qPhotographyScope.common;
  const selectedWorkflowTemplate = getPhotographyWorkflowTemplateById(selectedQuotePresetId);
  const selectedQuoteVertical = selectedWorkflowTemplate?.label || derivePhotographyVertical(selectedQuotePresetId);
  const emphasizedScopeFields = new Set(selectedWorkflowTemplate?.scopeEmphasis || [
    'shoot_type',
    'shoot_date',
    'primary_location',
    'coverage_expectation',
    'deliverables',
    'delivery_deadline',
  ]);
  const shouldShowScopeField = (field) => scopeFieldsExpanded || emphasizedScopeFields.has(field);
  const scopeField = (field, element) => shouldShowScopeField(field) ? element : null;
  const qScopeInput = (field, label, type = 'text', placeholder = '', suggestions = []) => (
    <div className="input-group" key={field}>
      <label className="input-label" htmlFor={`quote-scope-${field}`}>{label}</label>
      <input
        id={`quote-scope-${field}`}
        type={type === 'date' ? 'text' : type}
        className="form-input"
        value={qScopeCommon[field] ?? ''}
        onChange={(event) => updateQPhotographyScope(field, event.target.value)}
        placeholder={type === 'date' ? 'YYYY-MM-DD' : placeholder}
        inputMode={type === 'date' ? 'numeric' : undefined}
        pattern={type === 'date' ? DASHBOARD_DATE_ENTRY_PATTERN : undefined}
        maxLength={type === 'date' ? 10 : undefined}
        data-dashboard-date-entry={type === 'date' ? 'english' : undefined}
        list={suggestions.length > 0 ? `quote-scope-${field}-suggestions` : undefined}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? 1 : undefined}
      />
      {suggestions.length > 0 && (
        <datalist id={`quote-scope-${field}-suggestions`}>
          {suggestions.map((suggestion) => <option key={suggestion} value={suggestion} />)}
        </datalist>
      )}
    </div>
  );
  const qScopeListInput = (field, label, placeholder) => (
    <div className="input-group" key={field}>
      <label className="input-label" htmlFor={`quote-scope-${field}`}>{label}</label>
      <textarea
        id={`quote-scope-${field}`}
        className="form-textarea"
        value={(qScopeCommon[field] || []).join('\n')}
        onChange={(event) => updateQPhotographyScope(field, event.target.value.split('\n'))}
        placeholder={placeholder}
        rows={3}
      />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '4px' }}>One item per line</span>
    </div>
  );
  const preSendReviewFindings = buildPhotographyPreSendReview({
    scope: qPhotographyScope,
    templateId: selectedQuotePresetId,
  });
  const semanticReviewIsCurrent = semanticReviewState.status === 'COMPLETE'
    && semanticReviewState.inputFingerprint === currentSemanticReviewFingerprint;
  const semanticReviewDisplayStatus = semanticReviewState.status === 'COMPLETE' && !semanticReviewIsCurrent
    ? 'STALE'
    : semanticReviewState.status;
  const reviewFindings = mergePhotographyReviewFindings({
    deterministicFindings: preSendReviewFindings,
    semanticFindings: semanticReviewIsCurrent ? semanticReviewState.semanticFindings : [],
  });
  const semanticReviewStatusCopy = {
    READY: 'Ready to run a focused semantic review of this draft.',
    REVIEWING: 'Reviewing the current Scope, line items and Public Notes…',
    COMPLETE: semanticReviewIsCurrent ? 'Semantic review complete. You remain the final authority.' : 'This review is stale because the draft changed.',
    STALE: 'The draft changed. Run Review with Corvioz again to refresh semantic findings.',
    UNAVAILABLE_OR_ERROR: 'Semantic review is unavailable. Structured checks remain active.',
  };
  const reviewCategoryLabels = {
    NEEDS_ATTENTION: 'Needs attention',
    CONFIRM: 'Confirm',
    IMPROVE: 'Improve',
  };
  const reviewCategoryOrder = ['NEEDS_ATTENTION', 'CONFIRM', 'IMPROVE'];
  const quoteSharedContract = createQuoteEditorSharedContract({
    quote: {
      qId,
      qNumber,
      qClientId,
      qClientName,
      qClientEmail,
      qClientAddress,
      qItems,
      qTaxRate,
      qDiscountRate,
      qCurrency,
      qNotes,
      qDate,
      qStatus,
      qPhotographyScope,
      photographerName: user?.name || 'Photographer',
      photographerEmail: user?.email || '',
      availableClients: clients,
    },
    setters: {
      setQuoteNumber: setQNumber,
      setQuoteClientId: setQClientId,
      setQuoteClientName: setQClientName,
      setQuoteClientEmail: setQClientEmail,
      setQuoteClientAddress: setQClientAddress,
      setQuoteItems: setQItems,
      setQuoteTaxRate: setQTaxRate,
      setQuoteDiscountRate: setQDiscountRate,
      setQuoteCurrency: setQCurrency,
      setQuoteNotes: setQNotes,
      setQuoteDate: setQDate,
      setQuotePhotographyScope: setQPhotographyScope,
    },
    validation: {
      clientNameTouched: qClientNameTouched,
      clientEmailTouched: qClientEmailTouched,
      submitAttempted: qSubmitAttempted,
      clientNameRequired: true,
      clientEmailOptional: true,
      validateClient: validateQuoteClient,
      setQuoteClientNameTouched: setQClientNameTouched,
      setQuoteClientEmailTouched: setQClientEmailTouched,
      sendRequiresSavedDraft: true,
    },
    workflow: {
      selectedQuotePresetId,
      quotePresetSelectionTouched,
      templates: PHOTOGRAPHY_WORKFLOW_TEMPLATES,
      applyPreset: handleApplyQuotePreset,
      skipPreset: handleSkipQuotePreset,
      usageClearingConfirmation: handleUsageRightsStatusChange,
    },
    derived: {
      totals: quoteTotals,
      calculateTotals: calculateQuoteTotals,
      formatMoney: formatDashboardMoney,
      selectedQuoteVertical,
      currentSemanticReviewFingerprint,
      reviewFindings,
      reviewStatus: semanticReviewDisplayStatus,
      reviewStatusCopy: semanticReviewStatusCopy[semanticReviewDisplayStatus] || semanticReviewStatusCopy.READY,
    },
    actions: {
      save: () => handleSaveQuote({ surface: 'guided' }),
      send: handleSendQuote,
      exportPdf: handleExportAttempt,
      runSemanticReview: handleRunSemanticReview,
      cancel: handleCancelQuote,
      convertToInvoice: handleConvertQuoteToInvoice,
    },
    scope: {
      updateField: updateQPhotographyScope,
      setUsageRightsStatus: handleUsageRightsStatusChange,
    },
    ui: {
      formError,
      formSuccess,
      isSaving,
      isSendingQuote,
      isDownloadingPdf,
      canExportPdf,
      hasCleanPdf,
    },
  });

  return (
    <div 
      onClickCapture={previewMode ? (e) => { e.preventDefault(); e.stopPropagation(); } : undefined}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%', 
        minHeight: previewMode ? 'auto' : '100vh',
        background: 'var(--bg-page)',
        position: 'relative'
      }}
    >
      {isSandboxMode && (
        <div className="dashboard-sandbox-banner" style={{
          background: 'var(--warning-glow)',
          borderBottom: '1px solid var(--warning-border)',
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          fontSize: '0.85rem',
          color: 'var(--warning-text)',
          zIndex: 999
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex',
              padding: '3px 8px',
              borderRadius: '6px',
              background: 'var(--warning-text)',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.03em'
            }}>DEMO SANDBOX MODE</span>
            <span style={{ fontWeight: 500 }}>
              Data is saved in local storage. Connect a cloud account to prevent data loss.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isResettable && (
              <Button variant="secondary" size="sm" onClick={resetDemoData} style={{ fontWeight: 600, border: '1px solid var(--warning-border)', background: 'transparent', color: 'var(--warning-text)' }}>
                Reset Demo Data
              </Button>
            )}
          <Button href="/signup" variant="primary" size="sm" onClick={() => {
              if (typeof window !== 'undefined') {
                window.sessionStorage.removeItem('corvioz_sandbox_mode');
              }
            }} style={{ fontWeight: 600 }}>
              Connect account to save data
            </Button>
          </div>
        </div>

      )}
      <div className={`dashboard-layout${sidebarCollapsed ? ' dashboard-sidebar-layout-collapsed' : ''}`} style={{ flex: 1 }}>

      {/* Sidebar navigation */}
      <aside className={`dashboard-sidebar-aside${sidebarCollapsed ? ' dashboard-sidebar-collapsed' : ''}`}>
        <div>
          {/* Logo */}
          <div className="dashboard-sidebar-logo" style={{ marginBottom: '24px' }}>
            <Logo className="dashboard-sidebar-wordmark" size={20} style={{ fontSize: '1.1rem' }} />
            <span className="dashboard-sidebar-mark" aria-label="Corvioz" role="img">
              <img src="/brand/corvioz-icon-small.svg" alt="" aria-hidden="true" />
            </span>
            <button
              type="button"
              className="dashboard-sidebar-toggle"
              data-testid="dashboard-sidebar-collapse"
              aria-expanded={!sidebarCollapsed}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={toggleSidebar}
            >
              <Icons.ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
              <span className="dashboard-sidebar-toggle-label">{sidebarCollapsed ? 'Expand' : 'Collapse'}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="dashboard-sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {getDashboardTabs(kernelUi).map(tab => {
              const IconComponent = Icons[tab.id];
              const isActive = activeTab === tab.id;
              const iconColor = isActive ? '#4F46E5' : '#59677c';
              // B+ icon set (Quote/Invoice/Clients) uses its own stroke-width
              // convention (1.7 default / 1.8 active) per the approved design
              // handoff. Other tabs (e.g. profile) keep their existing values.
              const isBPlusIcon = tab.id === 'quotes' || tab.id === 'invoices' || tab.id === 'clients';
              const iconStrokeWidth = isBPlusIcon ? (isActive ? 1.8 : 1.7) : (isActive ? 2.5 : 2);

              // Identity theme accent colors
              const themeAccent = activeTheme === 'starter' ? 'var(--primary)' : activeTheme === 'pro' ? 'var(--success)' : 'var(--accent)';
              const themeBg = activeTheme === 'starter' ? 'var(--primary-glow)' : activeTheme === 'pro' ? 'rgba(34, 197, 94, 0.05)' : 'rgba(6, 182, 212, 0.05)';

              return (
                <React.Fragment key={tab.id}>
                  {tab.sectionBefore && <div style={{ margin: '12px 0', borderTop: '1px solid var(--border)' }} />}
                  <button
                    onClick={() => handleDashboardTabChange(tab.id, 'sidebar')}
                    aria-label={tab.label}
                    title={sidebarCollapsed ? tab.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '9px 14px',
                      borderRadius: '10px',
                      width: '100%',
                      textAlign: 'left',
                      cursor: 'pointer',
                      backgroundColor: isActive ? themeBg : 'transparent',
                      color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                      border: isActive ? `1.5px solid ${themeAccent}` : '1.5px solid transparent',
                      boxShadow: isActive ? `0 4px 14px ${themeBg}` : 'none',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 600 : 500,
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {IconComponent && (
                        <span
                          className="dashboard-sidebar-nav-icon"
                          aria-hidden="true"
                          style={{
                            width: 18,
                            height: 18,
                            flex: '0 0 18px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: iconColor,
                            transition: 'color 0.25s'
                          }}
                        >
                          <IconComponent size={18} strokeWidth={iconStrokeWidth} />
                        </span>
                      )}
                      <span className="dashboard-sidebar-label" style={{ transition: 'color 0.25s' }}>{tab.label}</span>
                    </div>
                  </button>
                </React.Fragment>
              );
            })}

          </nav>
        </div>

        {/* Footer info */}
        <div className="dashboard-sidebar-footer">
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {session?.user?.email ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  aria-label="Account"
                  title={sidebarCollapsed ? 'Account' : undefined}
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 18,
                      height: 18,
                      flex: '0 0 18px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#59677c'
                    }}
                  >
                    {Icons.account && <Icons.account size={18} strokeWidth={2} />}
                  </span>
                  <span className="dashboard-sidebar-label">Account</span>
                </button>
              ) : (
                <Link href="/auth" className="btn btn-secondary btn-sm" style={{ width: '100%', textDecoration: 'none', textAlign: 'center' }}>
                  Sign in
                </Link>
              )}
            </div>

            {accountMenuOpen && session?.user?.email && (
              <div
                role="menu"
                aria-label="Account menu"
                className="card animate-fade-in"
                style={{
                  position: 'absolute',
                  right: 0,
                  bottom: '42px',
                  zIndex: 20,
                  minWidth: '190px',
                  padding: '8px',
                  background: 'var(--background-card)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <div style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {session.user.email}
                  </div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  disabled={isSigningOut}
                  onClick={() => {
                    handleSignOut();
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: '6px',
                    color: 'var(--text-main)',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: '0.82rem',
                    fontWeight: 650,
                    cursor: isSigningOut ? 'not-allowed' : 'pointer',
                    opacity: isSigningOut ? 0.7 : 1
                  }}
                >
                  {isSigningOut ? 'Signing out…' : 'Sign out'}
                </button>
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
            <div className="dashboard-sidebar-plan-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="dashboard-sidebar-plan-label">Plan</span>
              <span style={{ 
                background: isEntitlementLoading || isFreePlan ? 'var(--btn-secondary-bg)' : 'var(--success-glow)',
                color: isEntitlementLoading || isFreePlan ? 'var(--text-muted)' : 'var(--success)',
                fontSize: '0.65rem', 
                padding: '2px 8px', 
                borderRadius: '99px', 
                fontWeight: 800,
                textTransform: 'uppercase'
              }}>
                {planStatusLabel}
              </span>
            </div>
            {entitlementReady && isFreePlan && (
              <Link
                href="/pricing?checkout=pro"
                onClick={(e) => {
                  e.preventDefault();
                  trackEvent('pricing_click', { position: 'dashboard_sidebar' });
                  saveSelectedPlan('pro', 'dashboard_sidebar');
                  trackUpgradeClick('dashboard_sidebar', 'pro');
                  evaluateAction('pricing_cta', () => {
                    router.push('/pricing?checkout=pro');
                  });
                }}
                className="btn btn-primary btn-sm"
                style={{ 
                  width: '100%', 
                  marginBottom: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px',
                  textDecoration: 'none',
                  background: 'var(--primary)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 750
                }}
              >
                {kernelUi.cta('pricing_select')}
              </Link>
            )}
            <button
              ref={feedbackBtnRef}
              type="button"
              className="dashboard-sidebar-feedback"
              onClick={openFeedbackModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                width: '100%',
                padding: '6px 12px',
                background: 'var(--btn-secondary-bg)',
                border: '1px dashed var(--border)',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 650,
                color: 'var(--text-muted)',
                marginBottom: '16px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-main)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Share Beta Feedback
            </button>
          </div>
        </div>
      </aside>

      {/* Main dashboard content */}
      <Container className="dashboard-main-content" style={{ overflowY: 'auto' }}>
        {!session && !isSigningOut && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '12px',
            padding: '12px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="product-state-mark">Preview</span>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                You are exploring Corvioz in <strong>Preview Mode</strong>. Your dashboard changes are kept locally in your browser.
              </p>
            </div>
            <Link 
              href="/signup" 
              className="btn btn-primary btn-sm"
              style={{ textDecoration: 'none', padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700 }}
            >
              Sign up to save progress &rarr;
            </Link>
          </div>
        )}
        {showDraftRestorePrompt && pendingInvoiceDraft && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.15rem' }}>↩</span>
              <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 650 }}>
                Restore your previous draft?
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleRestorePendingInvoiceDraft}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 700 }}
              >
                Restore draft
              </button>
              <button
                type="button"
                onClick={() => setShowDraftRestorePrompt(false)}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 650 }}
              >
                Not now
              </button>
            </div>
          </div>
        )}
        {bannerMessage && (
          <UpgradeBanner
            message={bannerMessage}
            ctaText="Upgrade"
            onClose={() => {
              setBannerMessage('');
              if (typeof window !== 'undefined') {
                window.localStorage.setItem('corvioz_revisit_banner_dismissed', 'true');
              }
            }}
          />
        )}
        {renderActivationGuide()}
        <FirstRevenueLoopAction
          loop={firstRevenueLoopActionReady ? firstRevenueLoop : null}
          onCreateQuote={() => initCreateQuote('first_revenue_loop')}
          onSendQuote={handleSendFirstRevenueQuote}
          onCreateInvoiceDraft={handleOpenFirstRevenueInvoiceDraft}
          onPreparePayment={handlePrepareFirstRevenuePayment}
        />

          {/* TAB 1: OVERVIEW CONTROL CENTER */}
        {activeTab === 'overview' && (
          <>
            {/* Smart insights and AI panels removed for pure dumb rendering */}
            <DashboardOverview
              data={{
                quotes: getActiveQuotes(),
                invoices: currentInvoices,
                quota: user?.quota || null,
                plan: user?.plan || tierPlan,
                invoicesError,
                quotaError,
                leads: getActiveLeads(),
                clients: getActiveClients(),
                totalPaid,
                activeProfile: getActiveProfile(),
                isLoading: isRefreshing,
                error: dashboardDataError || quotesError || invoicesError || (isEntitlementError ? 'entitlement_unavailable' : null),
                quoteError: quotesError,
                isFree: isFreePlan,
                exportCount,
                businessModeBadge,
                tierPlan,
                hasSelectedPlan: hasSelectedPlanForFirstValue,
                userId: user?.id || session?.user?.id || 'local-dashboard-user',
                entry_state: 'AUTHENTICATED',
              }}
              actionHandlers={{
                createQuote: initCreateQuote,
                createInvoice: initCreateInvoice,
                createFirstInvoice: initFirstValueInvoice,
                configureProfile: () => handleDashboardTabChange('profile', 'overview_quick_action'),
                openQuotes: ({ id } = {}) => {
                  if (id) {
                    return openDocument({ documentType: 'quote', id });
                  }
                  return handleDashboardTabChange('quotes', 'overview');
                },
                createInvoiceFromQuote: ({ id } = {}) => {
                  const quote = getActiveQuotes().find((item) => item?.id === id);
                  if (quote) return handleConvertQuoteToInvoice(quote);
                  triggerToast('This Quote is no longer available. Refresh and try again.', 'error');
                  return false;
                },
                openInvoices: ({ id } = {}) => {
                  if (id) {
                    return openDocument({ documentType: 'invoice', id });
                  }
                  return handleDashboardTabChange('invoices', 'overview');
                },
                retryDashboard: async () => {
                  setDashboardDataError(null);
                  const snapshot = await fetchData(session?.access_token);
                  setDashboardDataError(snapshot?.error || null);
                },
                viewProfile: () => {
                  const profile = getActiveProfile();
                  if (profile?.username && typeof window !== 'undefined') {
                    window.open(`/profile/${profile.username}`, '_blank');
                  } else {
                    handleDashboardTabChange('profile', 'overview_quick_action');
                  }
                },
                viewLead: ({ id } = {}) => {
                  const lead = getActiveLeads().find((item) => item.id === id);
                  if (lead) handleViewLead(lead);
                },
                generateQuoteFromLead: ({ id } = {}) => {
                  const lead = getActiveLeads().find((item) => item.id === id);
                  if (lead) handleAiQuoteGeneration(lead);
                },
              }}
            />
          </>
        )}

        {activeTab === 'leads' && (
          !session ? (
            renderGuestLockState('Leads CRM', 'Track client inquiry cycles and project valuations. When prospects submit forms on your public profile, inquiries appear here in your sales pipeline.')
          ) : !entitlements.crm ? (
            renderPaidLockState('Leads Pipeline CRM', 'Track client inquiry cycles and project valuations. When prospects submit forms on your public profile, inquiries appear here in your sales pipeline.', 'pro')
          ) : (
            <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Leads Pipeline CRM</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                  Track client inquiry cycles and project records. Active Document Total: <strong style={{ color: 'var(--accent)' }}>
                    {formatDashboardNumber(getActiveLeads().reduce((sum, l) => sum + Number(getLeadCRMFields(l).value || 0), 0))}
                  </strong>
                </p>
              </div>
            </div>

            {getActiveLeads().length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
                <svg style={{ width: '48px', height: '48px', color: 'var(--text-soft)', margin: '0 auto 16px', display: 'block', opacity: 0.6 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p style={{ fontSize: '1.05rem', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 700 }}>Convert casual inquiries into structured client projects with a visual, kanban-style sales CRM.</p>
                <p style={{ fontSize: '0.85rem', marginBottom: '20px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.45 }}>
                  Every project inquiry submitted through your public profile page lands here automatically. Track stages from negotiation to won and prepare quote drafts.
                </p>
                <button onClick={() => handleDashboardTabChange('profile', 'leads_empty_state')} className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
                  Set Up & Share Public Profile
                </button>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '16px', marginBottom: 0 }}>
                  Privacy-focused client data controls. Client inquiry data stays private and protected.
                </p>
              </div>
            ) : (
              <div className="kanban-board">
                {[
                  { id: 'New', title: 'New', color: '#6366f1' },
                  { id: 'Qualified', title: 'Qualified', color: '#06b6d4' },
                  { id: 'Proposal Sent', title: 'Quote Sent', color: '#818cf8' },
                  { id: 'Negotiation', title: 'Negotiation', color: 'var(--warning)' },
                  { id: 'Won', title: 'Won', color: '#10b981' },
                  { id: 'Lost', title: 'Lost', color: '#f43f5e' }
                ].map(col => {
                  const colLeads = getActiveLeads().filter(l => getLeadPipelineStatus(l) === col.id);
                  return (
                    <div key={col.id} className="kanban-column">
                      <div className="kanban-column-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: col.color }}></span>
                          <span className="kanban-column-title">{col.title}</span>
                        </div>
                        <span className="kanban-column-count">{colLeads.length}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, paddingBottom: '10px' }}>
                        {colLeads.map(lead => {
                          const crm = getLeadCRMFields(lead);
                          return (
                            <div key={lead.id} className="kanban-card" style={{ borderLeft: `3px solid ${col.color}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>{lead.name}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>{formatDashboardNumber(crm.value || 0)}</span>
                              </div>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {lead.message}
                              </p>

                              {/* Tags */}
                              {crm.tags && (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                  {crm.tags.split(',').map((t, idx) => (
                                    <span key={idx} style={{ fontSize: '0.6rem', padding: '1px 5px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '3px', color: 'var(--text-muted)' }}>{t.trim()}</span>
                                  ))}
                                </div>
                              )}

                              {/* Reminder Notification */}
                              {crm.reminderDate && (
                                <div style={{ fontSize: '0.65rem', color: 'var(--warning-text, #fbbf24)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '12px' }}>
                              <span>Reminder: {formatDashboardDate(crm.reminderDate)}</span>
                                </div>
                              )}

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    onClick={() => {
                                      setSelectedLead(lead);
                                      setLeadPipelineStatus(col.id);
                                      setLeadValue(crm.value);
                                      setLeadSource(crm.source);
                                      setLeadTags(crm.tags);
                                      setLeadLastContactDate(crm.lastContactDate);
                                      setLeadNotes(crm.notes);
                                      setLeadReminderDate(crm.reminderDate);
                                      setShowLeadModal(true);
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ fontSize: '0.65rem', padding: '2px 6px' }}
                                    title="Edit Lead CRM details"
                                  >
                                    Edit
                                  </button>
                                  {(col.id === 'New' || col.id === 'Qualified') && (
                                    <button
                                      disabled={isParsingLead === lead.id}
                                      onClick={() => handleAiQuoteGeneration(lead)}
                                      className="btn btn-secondary btn-sm"
                                      style={{ fontSize: '0.65rem', padding: '2px 6px', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                      title="AI Generate Quote Draft"
                                    >
                                      <span>{isParsingLead === lead.id ? 'Generating...' : 'AI Quote'}</span>
                                      {isFreePlan && <span style={{ background: 'var(--accent-glow)', color: 'var(--accent)', fontSize: '0.55rem', padding: '0px 3px', borderRadius: '3px', scale: '0.9' }}>Pro</span>}
                                    </button>
                                  )}
                                </div>

                                {/* Quick columns toggle */}
                                <div style={{ display: 'flex', gap: '2px' }}>
                                  {col.id !== 'New' && (
                                    <button
                                      onClick={() => {
                                        const colIds = ['New', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
                                        const prevIdx = colIds.indexOf(col.id) - 1;
                                        handleSaveLeadCRMDetails(lead.id, { pipeline_status: colIds[prevIdx] });
                                      }}
                                      style={{ padding: '2px 4px', fontSize: '0.65rem', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '3px', cursor: 'pointer' }}
                                      title="Move Left"
                                    >
                                      ◀
                                    </button>
                                  )}
                                  {col.id !== 'Lost' && (
                                    <button
                                      onClick={() => {
                                        const colIds = ['New', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];
                                        const nextIdx = colIds.indexOf(col.id) + 1;
                                        handleSaveLeadCRMDetails(lead.id, { pipeline_status: colIds[nextIdx] });
                                      }}
                                      style={{ padding: '2px 4px', fontSize: '0.65rem', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '3px', cursor: 'pointer' }}
                                      title="Move Right"
                                    >
                                      ▶
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Lead CRM Details Modal */}
            {showLeadModal && selectedLead && (
              <div className="dashboard-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 5, 8, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
                <div className="card animate-fade-in dashboard-modal-card" style={{ maxWidth: '520px', width: '90%', padding: '32px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>CRM Lead: {selectedLead.name}</h3>
                    <button onClick={() => { setShowLeadModal(false); setSelectedLead(null); }} style={{ fontSize: '1.5rem', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>&times;</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '8px', lineHeight: '1.5' }}>
                      <strong>Original Inquiry Brief:</strong>
                      <div style={{ marginTop: '4px', fontStyle: 'italic' }}>&quot;{selectedLead.message}&quot;</div>
                      <div style={{ marginTop: '8px', fontSize: '0.75rem', display: 'flex', justifySelf: 'flex-start', gap: '10px' }}>
                        <span>Email: <strong>{selectedLead.email}</strong></span>
                        <span>IP: <strong>{selectedLead.visitor_ip || 'unknown'}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="input-group">
                        <label className="input-label">Pipeline Status</label>
                        <select className="form-select" value={leadPipelineStatus} onChange={e => setLeadPipelineStatus(e.target.value)}>
                          <option value="New">New</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Proposal Sent">Quote Sent</option>
                          <option value="Negotiation">Negotiation</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Lead Value (amount)</label>
                        <input type="number" className="form-input" placeholder="Budget value e.g. 2500" value={leadValue} onChange={e => setLeadValue(Number(e.target.value))} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="input-group">
                        <label className="input-label">Inbound Traffic Source</label>
                        <input type="text" className="form-input" placeholder="e.g. Twitter, SEO, Direct" value={leadSource} onChange={e => setLeadSource(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Category Tags</label>
                        <input type="text" className="form-input" placeholder="e.g. Web Design, React" value={leadTags} onChange={e => setLeadTags(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="input-group">
                        <label className="input-label">Last Contact Date</label>
                        <input type="text" className="form-input" value={leadLastContactDate} onChange={e => setLeadLastContactDate(e.target.value)} placeholder="YYYY-MM-DD" inputMode="numeric" pattern={DASHBOARD_DATE_ENTRY_PATTERN} maxLength={10} data-dashboard-date-entry="english" />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Follow-up Reminder Date</label>
                        <input type="text" className="form-input" value={leadReminderDate} onChange={e => setLeadReminderDate(e.target.value)} placeholder="YYYY-MM-DD" inputMode="numeric" pattern={DASHBOARD_DATE_ENTRY_PATTERN} maxLength={10} data-dashboard-date-entry="english" />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">CRM Follow-up Notes & Backlog</label>
                      <textarea className="form-textarea" placeholder="Record feedback, alignment notes, and next follow-up agenda..." value={leadNotes} onChange={e => setLeadNotes(e.target.value)} style={{ minHeight: '80px', lineHeight: '1.4' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button
                        onClick={() => handleSaveLeadCRMDetails(selectedLead.id, {
                          pipeline_status: leadPipelineStatus,
                          lead_value: leadValue,
                          source: leadSource,
                          tags: leadTags,
                          last_contact_date: leadLastContactDate,
                          notes: leadNotes,
                          reminder_date: leadReminderDate
                        })}
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '10px', fontWeight: 600 }}
                      >
                        Save CRM details
                      </button>
                      <button
                        onClick={() => { setShowLeadModal(false); setSelectedLead(null); }}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '10px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          )
        )}

        {activeTab === 'quotes' && (
          !session && quoteView !== 'create' ? (
            renderGuestLockState('Quotes', 'Prepare shoot scope, deposit terms, delivery timelines, usage rights, and final payment details.')
          ) : session && !entitlements.invoice && !canAccessFirstRevenueQuotes ? (
            renderPaidLockState('Quotes', 'Prepare shoot scope, deposit terms, delivery timelines, usage rights, and final payment details.', 'pro')
          ) : (
            <div className="animate-fade-in">
            {quoteView === 'list' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Quotes</h1>
                  <button onClick={() => initCreateQuote('quotes_header')} className="btn btn-primary">Create Quote</button>
                </div>

                 {getQuotesContentState(isQuotesLoading, getActiveQuotes().length) === 'loading' ? (
                  <div className="card" data-testid="quotes-loading" style={{ padding: '24px', border: '1px solid var(--border)' }}>
                    <div className="skeleton animate-pulse" style={{ height: '18px', width: '34%', marginBottom: '16px' }}></div>
                    <div className="skeleton animate-pulse" style={{ height: '48px', width: '100%', marginBottom: '10px' }}></div>
                    <div className="skeleton animate-pulse" style={{ height: '48px', width: '100%' }}></div>
                  </div>
                ) : getQuotesContentState(isQuotesLoading, getActiveQuotes().length) === 'empty' ? (
                  <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
                    <svg style={{ width: '48px', height: '48px', color: 'var(--text-soft)', margin: '0 auto 16px', display: 'block', opacity: 0.6 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p style={{ fontSize: '1.05rem', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 700 }}>Create your first photography quote from a shoot preset.</p>
                    <p style={{ fontSize: '0.85rem', marginBottom: '20px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.45 }}>
                      Choose a shoot type, adjust deposit, delivery, usage rights, and final payment details, then save the quote to your client workflow.
                    </p>
                    <button onClick={() => initCreateQuote('first_quote_onboarding')} className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
                      Create your first quote
                    </button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '16px', marginBottom: 0 }}>
                      Start with Wedding, Portrait, Event, Commercial / Advertising, Product, Food, or Architecture & Interior.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--background-card)' }}>
                    <table>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--btn-secondary-bg)' }}>
                          <th style={{ padding: '14px 18px' }}>Quote #</th>
                          <th style={{ padding: '14px 18px' }}>Recipient Client</th>
                          <th style={{ padding: '14px 18px' }}>Document Total</th>
                          <th style={{ padding: '14px 18px' }}>Status</th>
                          <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getActiveQuotes().map((q) => (
                          <tr key={q.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                            <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{q.quote_number}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontWeight: 600 }}>{q.client_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{q.client_email}</div>
                            </td>
                            <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                              {formatDashboardMoney(q.total / 100, q.currency)}
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span
                                className="badge"
                                style={{
                                  fontSize: '0.7rem',
                                  backgroundColor: q.status === 'converted' ? 'var(--success-glow)' : 'var(--btn-secondary-bg)',
                                  color: q.status === 'converted' ? 'var(--success-text)' : 'var(--text-muted)'
                                }}
                              >
                                {q.status}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => {
                                    openDocument({ documentType: 'quote', id: q.id });
                                  }}
                                  className="btn btn-secondary btn-sm"
                                >
                                  Edit
                                </button>
                                {q.status === 'draft' && (
                                  <button
                                    onClick={() => handleSendQuote(q)}
                                    disabled={isSendingQuote || !q.client_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.client_email.trim())}
                                    className="btn btn-secondary btn-sm"
                                    style={{ color: 'var(--accent)' }}
                                  >
                                    {isSendingQuote ? 'Sending...' : 'Send Quote'}
                                  </button>
                                )}
                                {(q.status === 'draft' || q.status === 'sent') && q.id !== firstRevenueLoop?.quote_id && (
                                  <button
                                    onClick={() => handleDeleteQuote(q.id)}
                                    className="btn btn-secondary btn-sm"
                                    style={{ color: 'var(--danger)' }}
                                  >
                                    Delete
                                  </button>
                                )}
                                {q.status === 'approved' && (
                                  <button onClick={() => handleConvertQuoteToInvoice(q)} className="btn btn-primary btn-sm">
                                    Create Invoice Draft
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Quote Create / Edit View */}
            {(quoteView === 'create' || quoteView === 'edit') && (
              <div className="card animate-fade-in" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                <QuoteEditorSharedProvider value={quoteSharedContract}>
                  <QuotePresentationBoundary>
                  <div className="quote-document-first-shell">
                  <section id="quote-workspace-context" aria-labelledby="quote-workspace-context-heading" className="quote-document-first-header">
                    <div>
                      <span className="quote-document-first-kicker">Quote workspace</span>
                      <h2 id="quote-workspace-context-heading">
                        {quoteView === 'create' ? 'Create Quote' : `Edit Quote ${qNumber}`}
                      </h2>
                    </div>
                    <button onClick={handleCancelQuote} className="btn btn-secondary btn-sm">Cancel</button>
                  </section>

                  {formError && (
                    <div style={{ padding: '12px 16px', background: 'var(--danger-glow)', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger-text)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                      {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div style={{ padding: '12px 16px', background: 'var(--success-glow)', border: '1px solid var(--success-border)', borderRadius: '6px', color: 'var(--success-text)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                      {formSuccess}
                    </div>
                  )}

                  <nav className="quote-workflow-selector" data-testid="quote-workflow-selector" aria-label="Photography workflow">
                    <span className="quote-workflow-selector-label">Workflow</span>
                    <div className="quote-workflow-selector-primary">
                      {[
                        ['commercial-shoot', 'Commercial'],
                        ['wedding-shoot', 'Wedding'],
                        ['portrait-session', 'Portrait'],
                        ['event-photography', 'Event'],
                      ].map(([templateId, label]) => {
                        const template = getPhotographyWorkflowTemplateById(templateId);
                        return (
                          <button
                            key={templateId}
                            type="button"
                            data-workflow-id={templateId}
                            onClick={() => handleApplyQuotePreset(templateId)}
                            className={selectedQuotePresetId === templateId ? 'quote-workflow-tab is-selected' : 'quote-workflow-tab'}
                            aria-pressed={selectedQuotePresetId === templateId}
                            aria-label={`Select ${label}${template?.shortDescription ? `: ${template.shortDescription}` : ''}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    <details className="quote-workflow-more">
                      <summary>More workflows</summary>
                      <div className="quote-workflow-more-menu">
                        {PHOTOGRAPHY_WORKFLOW_TEMPLATES.filter((template) => !['commercial-shoot', 'wedding-shoot', 'portrait-session', 'event-photography'].includes(template.id)).map((template) => {
                          const label = template.id === 'food-photography' ? 'Food & Beverage' : template.label;
                          return (
                            <button
                              key={template.id}
                              type="button"
                              data-workflow-id={template.id}
                              onClick={() => handleApplyQuotePreset(template.id)}
                              className={selectedQuotePresetId === template.id ? 'quote-workflow-more-item is-selected' : 'quote-workflow-more-item'}
                              aria-pressed={selectedQuotePresetId === template.id}
                              aria-label={`Select ${label}: ${template.shortDescription}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={handleSkipQuotePreset}
                          className={!selectedQuotePresetId ? 'quote-workflow-more-item is-selected' : 'quote-workflow-more-item'}
                          aria-pressed={!selectedQuotePresetId}
                        >
                          Blank Quote
                        </button>
                      </div>
                    </details>
                  </nav>

                  <aside className="quote-client-canvas" data-testid="quote-client-document-canvas" aria-label="Client Document Canvas">
                    <div className="quote-client-canvas-heading">
                      <div>
                        <span className="quote-client-canvas-kicker">Live client document</span>
                        <h3>Quote document</h3>
                      </div>
                      <span className="quote-client-canvas-live">Live</span>
                    </div>
                    <div className="quote-client-document-viewport">
                      <QuoteClientDocumentPreviewFrame>
                        <QuoteClientDocument
                          quoteNumber={qNumber}
                          date={qDate || getTodayString()}
                          status={qStatus}
                          clientName={qClientName}
                          clientEmail={qClientEmail}
                          clientAddress={qClientAddress}
                          photographerName={user.name}
                          photographerEmail={user.email}
                          items={qItems}
                          discountRate={qDiscountRate}
                          taxRate={qTaxRate}
                          currency={qCurrency}
                          notes={qNotes}
                          formatMoney={formatDashboardMoney}
                          totals={quoteTotals}
                        />
                      </QuoteClientDocumentPreviewFrame>
                    </div>
                  </aside>

                  <div className="quote-editor-bridge">
                    <div className="quote-editor-bridge-heading">
                      <div>
                        <span className="quote-editor-bridge-kicker">Temporary editing bridge</span>
                        <h3>Edit quote details</h3>
                      </div>
                      <span>{selectedQuoteVertical || 'Blank Quote'}</span>
                    </div>
                    <div className="quote-business-editor" data-testid="quote-business-editor">

                <nav data-testid="quote-workspace-index" aria-label="Quote workspace sections" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', padding: '12px 14px', marginBottom: '20px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--btn-secondary-bg)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 700, marginRight: '4px' }}>Workspace</span>
                  {[
                    ['quote-workspace-scope', 'Scope'],
                    ['quote-workspace-usage', 'Usage'],
                    ['quote-workspace-pricing', 'Pricing'],
                    ['quote-workspace-terms', 'Terms & Notes'],
                    ['quote-workspace-review', 'Review'],
                  ].map(([sectionId, label]) => (
                    <button
                      key={sectionId}
                      type="button"
                      aria-label={`Go to ${label}`}
                      onClick={() => {
                        const section = document.getElementById(sectionId);
                        section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        section?.focus({ preventScroll: true });
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ minHeight: '34px' }}
                    >
                      {label}
                    </button>
                  ))}
                </nav>

                <div className="dashboard-grid-2col quote-business-editor-grid">
                  {/* Left Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <section aria-labelledby="quote-workspace-context-details-heading">
                      <h3 id="quote-workspace-context-details-heading" style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 12px', textTransform: 'uppercase', color: 'var(--accent)' }}>Quote Context</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                        <label className="input-label">Existing Client (optional)</label>
                        <select
                          className="form-input"
                          value={qClientId ?? ''}
                          onChange={e => {
                            const nextId = e.target.value;
                            setQClientId(nextId === '' ? null : nextId);
                            const client = clients.find(item => item.id === nextId);
                            if (client) {
                              setQClientName(client.name || '');
                              setQClientEmail(client.email || '');
                              setQClientAddress(client.address || '');
                            }
                          }}
                        >
                          <option value="">No linked Client (legacy/manual Quote)</option>
                          {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Quote Number</label>
                        <input data-testid="quote-number-input" type="text" className="form-input" value={qNumber} onChange={e => setQNumber(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Quote Date</label>
                        <input data-testid="quote-date-input" type="text" className="form-input" value={qDate} onChange={e => setQDate(e.target.value)} placeholder="YYYY-MM-DD" inputMode="numeric" pattern={DASHBOARD_DATE_ENTRY_PATTERN} maxLength={10} data-dashboard-date-entry="english" />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Currency</label>
                        <select data-testid="quote-currency-select" className="form-select" value={qCurrency} onChange={e => setQCurrency(e.target.value)}>
                          <option value="USD">USD</option>
                          <option value="CAD">CAD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="CNY">CNY</option>
                          {qCurrency && !['USD', 'CAD', 'EUR', 'GBP', 'CNY'].includes(qCurrency) && (
                            <option value={qCurrency}>{qCurrency}</option>
                          )}
                        </select>
                      </div>
                        <div className="input-group">
                          <label className="input-label">Quote Status</label>
                          <div className="form-input" aria-label="Quote delivery status (read-only)">
                            {qStatus === 'sent' ? 'Sent' : qStatus === 'draft' ? 'Draft' : qStatus}
                          </div>
                          {qStatus === 'draft' && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                              Save the Quote, then send it to the stored client email.
                            </span>
                          )}
                        </div>
                      </div>

                    <div className="card" style={{ padding: '20px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Client Specifications</h3>
                      <div className="input-group">
                        <label className="input-label">Client Name</label>
                        <input
                          data-testid="quote-client-name-input"
                          type="text"
                          className="form-input"
                          value={qClientName}
                          onChange={e => {
                            setQClientName(e.target.value);
                            setQClientNameTouched(true);
                          }}
                          onBlur={() => setQClientNameTouched(true)}
                          required
                          placeholder="e.g. Wayne Enterprises"
                          style={{
                            borderColor: (qSubmitAttempted || qClientNameTouched) && quoteClientValidation.nameInvalid ? 'var(--danger)' : 'var(--border)'
                          }}
                        />
                        {(qSubmitAttempted || qClientNameTouched) && quoteClientValidation.nameInvalid && (
                          <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                            Recipient client name is required.
                          </span>
                        )}
                      </div>
                      {getActiveClients().length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Quick Select:</span>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {getActiveClients().map(cli => (
                              <button
                                key={cli.id}
                                type="button"
                                onClick={() => {
                                  setQClientId(cli.id);
                                  setQClientName(cli.name);
                                  setQClientEmail(cli.email || '');
                                  setQClientAddress(cli.address || '');
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', height: 'auto', lineHeight: '1.2' }}
                              >
                                {cli.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="input-group">
                        <label className="input-label">Client Email</label>
                        <input
                          type="email"
                          className="form-input"
                          value={qClientEmail}
                          onChange={e => {
                            setQClientEmail(e.target.value);
                            setQClientEmailTouched(true);
                          }}
                          onBlur={() => setQClientEmailTouched(true)}
                          placeholder="e.g. client@wayne.com"
                          style={{
                            borderColor: (qSubmitAttempted || qClientEmailTouched) && quoteClientValidation.emailInvalid ? 'var(--danger)' : 'var(--border)'
                          }}
                        />
                        {(qSubmitAttempted || qClientEmailTouched) && quoteClientValidation.emailInvalid && (
                          <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                            Please enter a valid email address.
                          </span>
                        )}
                      </div>
                      <div className="input-group">
                        <label className="input-label">Client Address</label>
                        <input type="text" className="form-input" value={qClientAddress} onChange={e => setQClientAddress(e.target.value)} placeholder="e.g. 1007 Mountain Dr, Gotham" />
                      </div>
                    </div>
                    </section>

                    <section id="quote-workspace-scope" tabIndex={-1} aria-labelledby="quote-workspace-scope-heading" className="card glass-panel" data-testid="photography-scope" style={{ padding: '20px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                        <h3 id="quote-workspace-scope-heading" style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--accent)' }}>Photography Scope</h3>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Optional structured capture</span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.45, margin: '8px 0 18px' }}>
                        Capture the agreed shoot details without changing Quote pricing or creating a completion gate.
                      </p>

                      <section aria-labelledby="quote-scope-shoot-heading" style={{ marginBottom: '20px' }}>
                        <h4 id="quote-scope-shoot-heading" style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px' }}>Shoot</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                          {scopeField('shoot_type', qScopeInput('shoot_type', selectedWorkflowTemplate?.fieldPromptOverrides?.shoot_type || 'Shoot type', 'text', selectedWorkflowTemplate?.fieldExamples?.shoot_type || 'e.g. Editorial portrait', selectedWorkflowTemplate?.optionalSubtypeSuggestions || []))}
                          {scopeField('shoot_date', qScopeInput('shoot_date', 'Shoot date', 'date'))}
                          {scopeField('shoot_duration', qScopeInput('shoot_duration', 'Shoot duration (minutes)', 'number', 'e.g. 240'))}
                          {scopeField('primary_location', qScopeInput('primary_location', 'Primary location', 'text', 'e.g. Studio or venue'))}
                        </div>
                      </section>

                      <section aria-labelledby="quote-scope-coverage-heading" style={{ marginBottom: '20px' }}>
                        <h4 id="quote-scope-coverage-heading" style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px' }}>Coverage &amp; Deliverables</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                          {scopeField('coverage_expectation', qScopeInput('coverage_expectation', selectedWorkflowTemplate?.fieldPromptOverrides?.coverage_expectation || 'Coverage expectation', 'text', selectedWorkflowTemplate?.fieldExamples?.coverage_expectation || 'e.g. Ceremony through reception'))}
                          {scopeField('deliverables', qScopeListInput('deliverables', selectedWorkflowTemplate?.fieldPromptOverrides?.deliverables || 'Deliverables', selectedWorkflowTemplate?.fieldExamples?.deliverables || 'e.g. Edited gallery'))}
                          {scopeField('final_image_count', qScopeInput('final_image_count', selectedWorkflowTemplate?.fieldPromptOverrides?.final_image_count || 'Final image count', 'number', 'e.g. 100'))}
                          {scopeField('retouched_image_count', qScopeInput('retouched_image_count', 'Retouched image count', 'number', 'e.g. 20'))}
                          {scopeField('delivery_format', qScopeListInput('delivery_format', 'Delivery format', 'e.g. JPEG\ne.g. TIFF'))}
                        </div>
                      </section>

                      <section aria-labelledby="quote-scope-boundaries-heading">
                        <h4 id="quote-scope-boundaries-heading" style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 12px' }}>Delivery &amp; Boundaries</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                          {scopeField('delivery_deadline', qScopeInput('delivery_deadline', 'Delivery deadline', 'date'))}
                          {scopeField('exclusions', qScopeListInput('exclusions', 'Exclusions', 'e.g. Raw files'))}
                          {scopeField('assumptions', qScopeListInput('assumptions', 'Assumptions', 'e.g. Client selects favorites'))}
                        </div>
                      </section>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setScopeFieldsExpanded((expanded) => !expanded)}
                        aria-expanded={scopeFieldsExpanded}
                        style={{ marginTop: '16px' }}
                      >
                        {scopeFieldsExpanded ? 'Show fewer scope fields' : 'Show more scope fields'}
                      </button>
                    </section>

                    <section id="quote-workspace-usage" tabIndex={-1} aria-labelledby="quote-workspace-usage-heading" className="card" style={{ padding: '20px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                        <h3 id="quote-workspace-usage-heading" style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', margin: 0 }}>Usage</h3>
                        <span data-testid="quote-scope-usage-status" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {qScopeCommon.usage_rights.status === 'specified' ? 'Specified' : qScopeCommon.usage_rights.status === 'not_applicable' ? 'Not applicable' : 'Not specified'}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.45, margin: '8px 0 18px' }}>
                        Record the photographer-authored Usage Rights for this Quote.
                      </p>
                      <div className="input-group">
                        <label className="input-label" htmlFor="quote-scope-usage-status">Usage status</label>
                        <select
                          id="quote-scope-usage-status"
                          className="form-select"
                          value={qScopeCommon.usage_rights.status}
                          onChange={(event) => handleUsageRightsStatusChange(event.target.value)}
                        >
                          <option value="unspecified">Not specified</option>
                          <option value="specified">Specified</option>
                          <option value="not_applicable">Not applicable</option>
                        </select>
                      </div>
                      {qScopeCommon.usage_rights.status === 'specified' && (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setUsageRightsExpanded((expanded) => !expanded)}
                            aria-expanded={usageRightsExpanded}
                            style={{ marginBottom: usageRightsExpanded ? '12px' : 0 }}
                          >
                            {usageRightsExpanded ? 'Hide usage details' : 'Show usage details'}
                          </button>
                          {usageRightsExpanded && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px' }}>
                              <div className="input-group">
                                <label className="input-label" htmlFor="quote-scope-purpose">Purpose</label>
                                <input id="quote-scope-purpose" type="text" className="form-input" value={qScopeCommon.usage_rights.purpose ?? ''} onChange={(event) => updateQPhotographyScope('usage_rights.purpose', event.target.value)} placeholder="e.g. Brand campaign" />
                              </div>
                              <div className="input-group">
                                <label className="input-label" htmlFor="quote-scope-media-channels">Media / channels</label>
                                <textarea id="quote-scope-media-channels" className="form-textarea" value={(qScopeCommon.usage_rights.media_channels || []).join('\n')} onChange={(event) => updateQPhotographyScope('usage_rights.media_channels', event.target.value.split('\n'))} placeholder="e.g. Website\ne.g. Print" rows={3} />
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '4px' }}>One item per line</span>
                              </div>
                              <div className="input-group">
                                <label className="input-label" htmlFor="quote-scope-territory">Territory</label>
                                <input id="quote-scope-territory" type="text" className="form-input" value={qScopeCommon.usage_rights.territory ?? ''} onChange={(event) => updateQPhotographyScope('usage_rights.territory', event.target.value)} placeholder="e.g. North America" />
                              </div>
                              <div className="input-group">
                                <label className="input-label" htmlFor="quote-scope-license-duration">License duration</label>
                                <input id="quote-scope-license-duration" type="text" className="form-input" value={qScopeCommon.usage_rights.license_duration ?? ''} onChange={(event) => updateQPhotographyScope('usage_rights.license_duration', event.target.value)} placeholder="e.g. 12 months" />
                              </div>
                              <div className="input-group">
                                <label className="input-label" htmlFor="quote-scope-exclusivity">Exclusivity</label>
                                <input id="quote-scope-exclusivity" type="text" className="form-input" value={qScopeCommon.usage_rights.exclusivity ?? ''} onChange={(event) => updateQPhotographyScope('usage_rights.exclusivity', event.target.value)} placeholder="e.g. Non-exclusive" />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </section>
                  </div>

                  {/* Right Summary Card */}
                  <div>
                    <section id="quote-workspace-pricing" tabIndex={-1} aria-labelledby="quote-workspace-pricing-heading">
                      <div style={{ marginBottom: '20px' }}>
                        <h3 id="quote-workspace-pricing-heading" style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 12px', textTransform: 'uppercase', color: 'var(--accent)' }}>Pricing</h3>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Line Items</h4>
                        {qSubmitAttempted && (qItems.length === 0 || qItems.every(item => !item.description || !item.description.trim())) && (
                          <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '10px', fontWeight: 600 }}>
                            Please add at least one line item with a description.
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {qItems.map((item, index) => (
                            <div key={index} className="items-editor-row">
                              <input data-testid={`quote-line-description-${index}`} type="text" className="form-input" placeholder="Service / Deliverable description" value={item.description} onChange={e => handleItemChange('quote', index, 'description', e.target.value)} required />
                              <input type="number" className="form-input" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange('quote', index, 'quantity', Number(e.target.value))} required />
                              <input type="number" className="form-input" placeholder="Rate" value={item.unitPrice} onChange={e => handleItemChange('quote', index, 'unitPrice', Number(e.target.value))} required />
                              <button onClick={() => removeItem('quote', index)} style={{ color: 'var(--danger)', fontSize: '1.25rem', cursor: 'pointer' }}>&times;</button>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => addItem('quote')} className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>+ Add Item</button>
                      </div>

                      <div className="card" style={{ padding: '24px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Document Summary</h3>
                      <div className="input-group">
                        <label className="input-label">Tax Rate (%)</label>
                        <input data-testid="quote-tax-input" type="number" className="form-input" value={qTaxRate} onChange={e => setQTaxRate(Number(e.target.value))} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Discount Rate (%)</label>
                        <input type="number" className="form-input" value={qDiscountRate} onChange={e => setQDiscountRate(Number(e.target.value))} />
                      </div>
                      {/* Calculations */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Subtotal:</span>
                              <span>{formatDashboardMoney(quoteTotals.subtotal, qCurrency)}</span>
                            </div>
                            {qDiscountRate > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                                <span>Discount ({qDiscountRate}%):</span>
                                <span>-{formatDashboardMoney(quoteTotals.discount, qCurrency)}</span>
                              </div>
                            )}
                            {qTaxRate > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Tax ({qTaxRate}%):</span>
                                <span>{formatDashboardMoney(quoteTotals.tax, qCurrency)}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', color: 'var(--accent)' }}>
                              <span>Total:</span>
                              <span>{formatDashboardMoney(quoteTotals.total, qCurrency)}</span>
                            </div>
                      </div>

                      </div>
                    </section>

                    <section id="quote-workspace-terms" tabIndex={-1} aria-labelledby="quote-workspace-terms-heading" style={{ marginTop: '20px' }}>
                      <h3 id="quote-workspace-terms-heading" style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 12px', textTransform: 'uppercase', color: 'var(--accent)' }}>Terms &amp; Notes</h3>
                      <div className="input-group">
                        <label className="input-label">Quote Notes</label>
                        <textarea data-testid="quote-notes-input" className="form-textarea" value={qNotes} onChange={e => setQNotes(e.target.value)} placeholder="Proposed document stages, terms, and client notes..." />
                      </div>
                    </section>

                    <section id="quote-workspace-review" tabIndex={-1} data-testid="quote-pre-send-review" aria-labelledby="quote-pre-send-review-heading" style={{ marginTop: '20px', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--background-card)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                          <h3 id="quote-pre-send-review-heading" style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: 'var(--accent)' }}>Review with Corvioz</h3>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Suggestions only</span>
                        </div>
                        <p aria-live="polite" style={{ margin: '10px 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.45 }}>
                          {semanticReviewStatusCopy[semanticReviewDisplayStatus] || semanticReviewStatusCopy.READY}
                        </p>
                        {reviewFindings.length === 0 ? (
                          <p style={{ margin: '10px 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.45 }}>No structured checks need your attention yet. You remain the final authority on this Quote.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                            {reviewCategoryOrder.map((category) => {
                              const findings = reviewFindings.filter((finding) => finding.category === category);
                              if (findings.length === 0) return null;
                              return (
                                <div key={category}>
                                  <h4 style={{ margin: '0 0 6px', fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: category === 'NEEDS_ATTENTION' ? 'var(--danger)' : 'var(--text-muted)' }}>{reviewCategoryLabels[category]}</h4>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {findings.map((finding) => (
                                      <div key={finding.id} style={{ padding: '10px 12px', borderRadius: '6px', background: 'var(--btn-secondary-bg)' }}>
                                        <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-main)' }}>{finding.title}</strong>
                                        <span style={{ display: 'block', marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{finding.message}</span>
                                        <span style={{ display: 'block', marginTop: '5px', fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.4 }}>Next: {finding.recommendedAction}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleRunSemanticReview}
                          disabled={semanticReviewState.status === 'REVIEWING'}
                          aria-busy={semanticReviewState.status === 'REVIEWING'}
                          className="btn btn-secondary btn-sm"
                          style={{ width: '100%', marginTop: '14px', color: 'var(--accent)' }}
                        >
                          {semanticReviewDisplayStatus === 'REVIEWING' ? 'Reviewing…' : 'Review with Corvioz'}
                        </button>
                      </section>

                      <button onClick={handleSaveQuote} disabled={isSaving} className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }}>
                        {isSaving ? 'Saving...' : 'Save Quote'}
                      </button>
                      {qId && qStatus === 'draft' ? (
                        <button
                          type="button"
                          onClick={() => handleSendQuote()}
                          disabled={isSendingQuote || isSaving || !qClientEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(qClientEmail.trim())}
                          className="btn btn-secondary"
                          style={{ width: '100%', marginTop: '10px', color: 'var(--accent)' }}
                        >
                          {isSendingQuote ? 'Sending...' : 'Send Quote'}
                        </button>
                      ) : !qId ? (
                        <button type="button" disabled className="btn btn-secondary" style={{ width: '100%', marginTop: '10px' }}>
                          Save Quote first to send
                        </button>
                      ) : null}

                      {/* Preview Context & Ambient Hint */}
                      <div style={{ 
                        marginTop: '16px', 
                        padding: '10px 12px', 
                        background: 'var(--primary-glow)', 
                        border: '1.5px solid var(--border)', 
                        borderRadius: '6px', 
                        fontSize: '0.8rem',
                        color: 'var(--text-soft)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <span className="animate-pulse" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                          Client-ready preview building...
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Track client review status after document delivery.
                        </div>
                      </div>

                      {/* PDF download trigger button */}
                      <div style={{ marginTop: '12px' }}>
                        {!canExportPdf ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <button
                              onClick={() => handleExportAttempt('printable-quote', `quote_${qNumber}`, qId)}
                              disabled={isDownloadingPdf}
                              className="btn btn-secondary"
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                              {isDownloadingPdf ? 'Generating PDF...' : 'Watermarked PDF export'}
                            </button>
                            <button
                              onClick={() => {
                                trackEvent('pro_upgrade_view', { source: 'dashboard_quote_clean_export' });
                                router.push('/pricing?checkout=pro');
                              }}
                              className="btn btn-primary"
                              style={{ 
                                width: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '6px',
                                background: 'var(--primary)',
                                color: '#fff',
                                fontWeight: 700
                              }}
                            >
                              Export Clean PDF
                            </button>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px', margin: 0 }}>
                              Client-visible watermark will appear
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleExportAttempt('printable-quote', `quote_${qNumber}`, qId)}
                            disabled={isDownloadingPdf}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                          >
                            {isDownloadingPdf ? 'Generating PDF...' : (hasCleanPdf ? 'Download Clean PDF' : 'Download Watermarked PDF')}
                          </button>
                        )}
                      </div>
                  </div>
                </div>
                  </div>
                  </div>
                </div>

                <div className="quote-printable-target" style={{ display: 'none' }}>
                  <div id="printable-quote">
                    <QuoteClientDocument
                      quoteNumber={qNumber}
                      date={qDate || getTodayString()}
                      status={qStatus}
                      clientName={qClientName}
                      clientEmail={qClientEmail}
                      clientAddress={qClientAddress}
                      photographerName={user.name}
                      photographerEmail={user.email}
                      items={qItems}
                      discountRate={qDiscountRate}
                      taxRate={qTaxRate}
                      currency={qCurrency}
                      notes={qNotes}
                      formatMoney={formatDashboardMoney}
                      totals={quoteTotals}
                    />
                  </div>
                  </div>
                  </QuotePresentationBoundary>
                </QuoteEditorSharedProvider>
              </div>
            )}
            </div>
          )
        )}

        {activeTab === 'invoices' && (
          !session && invoiceView !== 'create' ? (
            renderGuestLockState('Invoice Documents', 'Create invoice documents, organize due dates, and keep client records connected.')
          ) : session && !entitlements.invoice && !canAccessFirstRevenueInvoices ? (
            renderPaidLockState('Invoice Documents', 'Create invoice documents, organize due dates, and keep client records connected.', 'pro')
          ) : (
            <div className="animate-fade-in">
              {invoiceView === 'list' && (
              <div>
                <div className="dashboard-invoice-list-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Invoice Documents</h1>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => {
                        if (entitlements.automation) {
                          triggerToast('Batch export generated successfully. Files compiled for document review.', 'success');
                        } else {
                          setModalProps({
                            title: "Batch export is coming soon",
                            description: "Batch invoice export is planned for Studio and is not available for purchase yet.",
                            lockedFeatureValue: "Batch Invoice PDF Export",
                            limit: "batch_export",
                            source: "batch_export_gate",
                            targetPlan: "support"
                          });
                          setActiveModal('upgrade');
                        }
                      }}
                      className="btn btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      Batch Export
                    </button>
                    <button onClick={initCreateInvoice} className="btn btn-secondary">Create Invoice</button>
                  </div>
                </div>

                {getActiveInvoices().length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
                    <svg style={{ width: '48px', height: '48px', color: 'var(--text-soft)', margin: '0 auto 16px', display: 'block', opacity: 0.6 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p style={{ fontSize: '1.05rem', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 700 }}>Move approved work into a clear invoice path with simple client-ready terms.</p>
                    <p style={{ fontSize: '0.85rem', marginBottom: '20px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.45 }}>
                      Use the example preview to start faster, then adjust the client, line items, due date, and invoice notes.
                    </p>
                    <button onClick={initCreateInvoice} className="btn btn-primary btn-sm" style={{ fontWeight: 700 }}>
                      Create your first invoice
                    </button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '16px', marginBottom: 0 }}>
                      Keep client review clear with a document your client can understand.
                    </p>
                  </div>
                ) : (
                  <div className="dashboard-invoice-table-wrap" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--background-card)' }}>
                    <table className="dashboard-invoice-table">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--btn-secondary-bg)' }}>
                          <th style={{ padding: '14px 18px' }}>Invoice #</th>
                          <th style={{ padding: '14px 18px' }}>Recipient Client</th>
                          <th style={{ padding: '14px 18px' }}>Issue & Due dates</th>
                          <th style={{ padding: '14px 18px' }}>Document Total</th>
                          <th style={{ padding: '14px 18px' }}>Status</th>
                          <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getActiveInvoices().map((inv) => (
                          <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }} className="table-row-hover">
                            <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text-main)' }}>{inv.invoice_number}</td>
                            <td style={{ padding: '14px 18px' }}>
                              <div style={{ fontWeight: 600 }}>{inv.client_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{inv.client_email}</div>
                            </td>
                            <td style={{ padding: '14px 18px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              <div>Issued: {formatDashboardDate(inv.invoice_date || inv.created_at)}</div>
                              <div style={{ marginTop: '2px' }}>Due: {formatDashboardDate(inv.due_date)}</div>
                            </td>
                            <td style={{ padding: '14px 18px', fontWeight: 600 }}>
                              {formatDashboardMoney(inv.total / 100, inv.currency)}
                            </td>
                            <td style={{ padding: '14px 18px' }}>
                              <span
                                className="badge"
                                style={{
                                  fontSize: '0.7rem',
                                  backgroundColor: (inv.payment_status || inv.status) === 'paid' ? 'var(--success-glow)' : ((inv.payment_status || inv.status) === 'overdue' ? 'var(--danger-glow)' : 'var(--btn-secondary-bg)'),
                                  color: (inv.payment_status || inv.status) === 'paid' ? 'var(--success-text)' : ((inv.payment_status || inv.status) === 'overdue' ? 'var(--danger-text)' : 'var(--text-muted)')
                                }}
                              >
                                {inv.payment_status || inv.status}
                              </span>
                            </td>
                            <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                              <div className="dashboard-invoice-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button
                                  onClick={() => {
                                    openDocument({ documentType: 'invoice', id: inv.id });
                                  }}
                                  className="btn btn-secondary btn-sm"
                                >
                                  Edit
                                </button>
                                {['sent', 'unpaid', 'partial', 'overdue', 'pending'].includes(inv.payment_status || inv.status) && (
                                  <button
                                    onClick={() => openRecordPaymentModal(inv)}
                                    disabled={isRecordingPayment}
                                    className="btn btn-primary btn-sm"
                                  >
                                    {isRecordingPayment ? 'Recording...' : 'Record Payment'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteInvoice(inv.id)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ color: 'var(--danger)' }}
                                >
                                  Delete
                                </button>
                                {inv.payment_link && (
                                  <a href={inv.payment_link} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ color: 'var(--accent)' }}>Client Link</a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Invoice Create / Edit View */}
            {(invoiceView === 'create' || invoiceView === 'edit') && (
              <div className="card animate-fade-in" style={{ background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                      {invoiceFlowStage === 'paid' ? 'Document Completed' : invoiceFlowStage === 'send' ? 'Send Document' : invoiceFlowStage === 'preview' ? 'Preview Document' : isSelectedInvoiceSettled ? `View Invoice ${invNumber}` : (invoiceView === 'create' ? 'Create Document' : `Edit Document ${invNumber}`)}
                    </h2>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {isSelectedInvoiceSettled ? 'This Invoice has recorded payment and is read-only.' : 'Create, preview, send, then mark completed when the client review is done.'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button onClick={handleCancelInvoice} className="btn btn-secondary btn-sm">Cancel</button>
                    <button onClick={handleExitInvoiceFlow} className="btn btn-secondary btn-sm">Exit to dashboard</button>
                  </div>
                </div>

                {!isSelectedInvoiceSettled && renderInvoiceFlowStepper()}

                {invoiceView === 'create' && !session && (
                  <div style={{
                    backgroundColor: 'var(--primary-glow)',
                    border: '1.5px solid var(--primary)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--text-main)',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span className="product-state-mark">Info</span>
                      <span>You don&apos;t need an account to start. Create your client document, download the PDF, or sign up to save it. Note: The form is pre-filled with sample data (e.g. Acme Corporation) to demonstrate the layout. Replace these fields with your own details.</span>
                  </div>
                )}

                {formError && (
                  <div style={{ padding: '12px 16px', background: 'var(--danger-glow)', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger-text)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div style={{ padding: '12px 16px', background: 'var(--success-glow)', border: '1px solid var(--success-border)', borderRadius: '6px', color: 'var(--success-text)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                    {formSuccess}
                  </div>
                )}

                {isSelectedInvoiceSettled && invoiceFlowStage === 'create' && (
                  <div role="status" style={{ padding: '12px 16px', background: 'var(--success-glow)', border: '1px solid var(--success-border)', borderRadius: '6px', color: 'var(--success-text)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 700 }}>
                    Read only · Recorded payment
                  </div>
                )}

                {showPaymentWaitingBanner && invoiceFlowStage === 'send' && (
                  <div style={{
                    padding: '14px 16px',
                    background: 'var(--warning-glow)',
                    border: '1px solid var(--warning-border)',
                    borderRadius: '10px',
                    color: 'var(--warning-text)',
                    marginBottom: '18px',
                    fontSize: '0.86rem',
                    fontWeight: 750
                  }}>
                    Waiting for client review
                  </div>
                )}

                {invoiceFlowStage === 'preview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                    {renderInvoiceReadonlyPreview()}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => setInvoiceFlowStage('create')} className="btn btn-secondary">Back to create</button>
                      <button
                        type="button"
                        onClick={() => handleSaveInvoice({ advanceToSend: true })}
                        disabled={isSaving}
                        className="btn btn-primary"
                        style={{ fontWeight: 800 }}
                      >
                        {isSaving ? 'Saving...' : 'Send Document'}
                      </button>
                    </div>
                  </div>
                )}

                {invoiceFlowStage === 'send' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                    {renderInvoiceReadonlyPreview({ compact: true })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => setInvoiceFlowStage('preview')} className="btn btn-secondary">Back to preview</button>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={handleExitInvoiceFlow} className="btn btn-secondary">Exit to dashboard</button>
                        <button
                          type="button"
                          onClick={() => openRecordPaymentModal(invoices.find((invoice) => invoice.id === invId) || { id: invId, currency: invCurrency, total: 0 })}
                          className="btn btn-primary"
                          style={{ fontWeight: 800 }}
                        >
                          Record Payment
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {invoiceFlowStage === 'paid' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                    {renderInvoiceTimeline(getSelectedInvoice() || { status: invStatus })}
                    {renderInvoiceReadonlyPreview({ compact: true })}
                    <div style={{
                      padding: '14px 16px',
                      background: 'var(--success-glow)',
                      border: '1px solid var(--success)',
                      borderRadius: '10px',
                      color: 'var(--success)',
                      fontSize: '0.86rem',
                      fontWeight: 800
                    }}>
                      Completed document recorded as a read-only state.
                    </div>
                    <button type="button" onClick={handleExitInvoiceFlow} className="btn btn-primary" style={{ alignSelf: 'flex-start', fontWeight: 800 }}>
                      Exit to dashboard
                    </button>
                  </div>
                )}

                {invoiceFlowStage === 'create' && renderInvoiceTimeline(getSelectedInvoice() || { status: invStatus })}

                <div className="dashboard-grid-2col invoice-editor-grid" style={invoiceFlowStage === 'create' ? undefined : { display: 'none' }}>
                  {/* Left Form */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                        <label className="input-label">Invoice Number</label>
                        <input type="text" className="form-input" value={invNumber} readOnly={isSelectedInvoiceSettled} onChange={e => setInvNumber(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Currency</label>
                        <select className="form-select" value={invCurrency} disabled={isSelectedInvoiceSettled} onChange={e => setInvCurrency(e.target.value)}>
                          <option value="USD">USD</option>
                          <option value="CAD">CAD</option>
                          <option value="EUR">EUR</option>
                          <option value="GBP">GBP</option>
                          <option value="CNY">CNY</option>
                          {invCurrency && !['USD', 'CAD', 'EUR', 'GBP', 'CNY'].includes(invCurrency) && (
                            <option value={invCurrency}>{invCurrency}</option>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="card" style={{ padding: '20px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Client Specifications</h3>
                      <div className="input-group">
                        <label className="input-label">Client Name</label>
                        <input type="text" className="form-input" value={invClientName} readOnly={isSelectedInvoiceSettled} onChange={e => setInvClientName(e.target.value)} required placeholder="e.g. Tony Stark" />
                      </div>
                      {!isSelectedInvoiceSettled && getActiveClients().length > 0 && (
                        <div style={{ marginBottom: '12px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Quick Select:</span>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {getActiveClients().map(cli => (
                              <button
                                key={cli.id}
                                type="button"
                                onClick={() => {
                                  setInvClientId(cli.id);
                                  setInvClientName(cli.name);
                                  setInvClientEmail(cli.email || '');
                                  setInvClientAddress(cli.address || '');
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '2px 8px', fontSize: '0.75rem', borderRadius: '4px', height: 'auto', lineHeight: '1.2' }}
                              >
                                {cli.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="input-group">
                        <label className="input-label">Client Email</label>
                        <input type="email" className="form-input" value={invClientEmail} readOnly={isSelectedInvoiceSettled} onChange={e => setInvClientEmail(e.target.value)} placeholder="e.g. tony@stark.com" />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Client Address</label>
                        <input type="text" className="form-input" value={invClientAddress} readOnly={isSelectedInvoiceSettled} onChange={e => setInvClientAddress(e.target.value)} placeholder="e.g. Malibu Malibu, CA" />
                      </div>
                    </div>

                    {/* Line Items */}
                    <div>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Line Items</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {invItems.map((item, index) => (
                          <div key={index} className="items-editor-row">
                            <input type="text" className="form-input" placeholder="Service description" value={item.description} readOnly={isSelectedInvoiceSettled} onChange={e => handleItemChange('invoice', index, 'description', e.target.value)} required />
                            <input type="number" className="form-input" placeholder="Qty" value={item.quantity} readOnly={isSelectedInvoiceSettled} onChange={e => handleItemChange('invoice', index, 'quantity', Number(e.target.value))} required />
                            <input type="number" className="form-input" placeholder="Rate" value={item.unitPrice} readOnly={isSelectedInvoiceSettled} onChange={e => handleItemChange('invoice', index, 'unitPrice', Number(e.target.value))} required />
                            {!isSelectedInvoiceSettled && <button onClick={() => removeItem('invoice', index)} style={{ color: 'var(--danger)', fontSize: '1.25rem', cursor: 'pointer' }}>&times;</button>}
                          </div>
                        ))}
                      </div>
                      {!isSelectedInvoiceSettled && <button onClick={() => addItem('invoice')} className="btn btn-secondary btn-sm" style={{ marginTop: '12px' }}>+ Add Item</button>}
                    </div>

                    {/* Client Document Link */}
                    <div className="card" style={{ padding: '20px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', textTransform: 'uppercase' }}>
                        Client Document Link
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        Add an optional external client document link
                      </p>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://example.com/client-document"
                        value={invPaymentLink}
                        readOnly={isSelectedInvoiceSettled}
                        onChange={e => setInvPaymentLink(e.target.value)}
                      />
	                    </div>
                  </div>

                  {/* Right Summary Card */}
                  <div>
                    <div className="card" style={{ padding: '24px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Document Summary</h3>
                      <div className="input-group">
                        <label className="input-label">Invoice Terms</label>
                        <select
                          className="form-select"
                          value={invPaymentTerms || 'Net 30'}
                          disabled={isSelectedInvoiceSettled}
                          onChange={e => {
                            setInvPaymentTerms(e.target.value);
                            updateDueDateFromTerms(e.target.value, invDate);
                          }}
                        >
                          <option value="Due on Receipt">Due on Receipt</option>
                          <option value="Net 15">Net 15</option>
                          <option value="Net 30">Net 30</option>
                          <option value="Net 60">Net 60</option>
                          {invPaymentTerms && !['Due on Receipt', 'Net 15', 'Net 30', 'Net 60'].includes(invPaymentTerms) && (
                            <option value={invPaymentTerms}>{invPaymentTerms}</option>
                          )}
                        </select>
                      </div>
                      <div className="invoice-summary-date-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="input-group">
                          <label className="input-label">Issue Date</label>
                          <input type="text" className="form-input" value={invDate} disabled={isSelectedInvoiceSettled} onChange={e => { setInvDate(e.target.value); updateDueDateFromTerms(invPaymentTerms, e.target.value); }} placeholder="YYYY-MM-DD" inputMode="numeric" pattern={DASHBOARD_DATE_ENTRY_PATTERN} maxLength={10} data-dashboard-date-entry="english" />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Due Date</label>
                          <input type="text" className="form-input" value={invDueDate} disabled={isSelectedInvoiceSettled} onChange={e => setInvDueDate(e.target.value)} placeholder="YYYY-MM-DD" inputMode="numeric" pattern={DASHBOARD_DATE_ENTRY_PATTERN} maxLength={10} data-dashboard-date-entry="english" />
                        </div>
                      </div>

                      <div className="input-group">
                        <label className="input-label">Tax Rate (%)</label>
                        <input type="number" className="form-input" value={invTaxRate} readOnly={isSelectedInvoiceSettled} onChange={e => setInvTaxRate(Number(e.target.value))} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Discount Rate (%)</label>
                        <input type="number" className="form-input" value={invDiscountRate} readOnly={isSelectedInvoiceSettled} onChange={e => setInvDiscountRate(Number(e.target.value))} />
                      </div>
                      <div className="input-group" style={{ marginBottom: '20px' }}>
                        <label className="input-label">Invoice Status</label>
                        <div style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-muted)',
                          fontSize: '0.85rem',
                          fontWeight: 750
                        }}>
                          {isSelectedInvoiceSettled
                            ? 'Read only · Recorded payment'
                            : invStatus === 'sent'
                              ? 'Sent'
                              : selectedInvoicePaymentStatus === 'overdue'
                                ? 'Overdue'
                                : 'Pending until sent'}
                        </div>
                      </div>

                      {/* Calculations */}
                      {(() => {
                        const invSubtotal = invItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
                        const invTotal = invSubtotal * (1 - invDiscountRate / 100) * (1 + invTaxRate / 100);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Subtotal:</span>
                              <span>{formatDashboardMoney(invSubtotal, invCurrency)}</span>
                            </div>
                            {invDiscountRate > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                                <span>Discount ({invDiscountRate}%):</span>
                                <span>-{formatDashboardMoney(invSubtotal * invDiscountRate / 100, invCurrency)}</span>
                              </div>
                            )}
                            {invTaxRate > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Tax ({invTaxRate}%):</span>
                                <span>{formatDashboardMoney(invSubtotal * (1 - invDiscountRate / 100) * invTaxRate / 100, invCurrency)}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', color: 'var(--accent)' }}>
                              <span>Total:</span>
                              <span>{formatDashboardMoney(invTotal, invCurrency)}</span>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="input-group" style={{ marginTop: '20px' }}>
                        <label className="input-label">Invoice Notes</label>
                        <textarea className="form-textarea" value={invNotes} readOnly={isSelectedInvoiceSettled} onChange={e => setInvNotes(e.target.value)} placeholder="Document notes for the client..." />
                      </div>

                      {!isSelectedInvoiceSettled && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                          <button
                            type="button"
                            onClick={goToInvoicePreview}
                            className="btn btn-primary"
                            style={{ width: '100%', fontWeight: 800 }}
                          >
                            Continue to preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveInvoice({ exitAfterSave: true })}
                            disabled={isSaving}
                            className="btn btn-secondary"
                            style={{ width: '100%' }}
                          >
                            {isSaving ? 'Saving...' : 'Save draft'}
                          </button>
                        </div>
                      )}

                      {/* PDF render target (hidden preview for html2pdf screenshot) */}
                      <div style={{ display: 'none' }}>
                        <div id="printable-invoice" style={{ padding: '40px', background: '#fff', color: '#1e293b', fontFamily: 'monospace', width: '794px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #cbd5e1', paddingBottom: '15px', marginBottom: '15px' }}>
                            <div>
                              <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a' }}>INVOICE</h2>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Generated via Corvioz</p>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                              <p style={{ margin: 0, fontWeight: 'bold' }}>#{invNumber}</p>
                              <p style={{ margin: '3px 0 0 0' }}>Date: {invDate}</p>
                              <p style={{ margin: '3px 0 0 0' }}>Due Date: {invDueDate}</p>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', fontSize: '0.9rem' }}>
                            <div>
                              <h5 style={{ margin: '0 0 4px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.75rem' }}>Billed To:</h5>
                              <p style={{ margin: 0, fontWeight: 'bold' }}>{invClientName}</p>
                              <p style={{ margin: 0 }}>{invClientEmail}</p>
                              <p style={{ margin: 0 }}>{invClientAddress}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <h5 style={{ margin: '0 0 4px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.75rem' }}>From:</h5>
                              <p style={{ margin: 0, fontWeight: 'bold' }}>{user.name || 'Photographer'}</p>
                              <p style={{ margin: 0 }}>{user.email}</p>
                            </div>
                          </div>

                          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.9rem' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left', color: '#64748b' }}>
                                <th style={{ padding: '8px 0' }}>Description</th>
                                <th style={{ padding: '8px 0', textAlign: 'center', width: '10%' }}>Qty</th>
                                <th style={{ padding: '8px 0', textAlign: 'right', width: '20%' }}>Rate</th>
                                <th style={{ padding: '8px 0', textAlign: 'right', width: '20%' }}>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invItems.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                                  <td style={{ padding: '10px 0' }}>{item.description}</td>
                                  <td style={{ padding: '10px 0', textAlign: 'center' }}>{item.quantity}</td>
                                  <td style={{ padding: '10px 0', textAlign: 'right' }}>
                                    {formatDashboardMoney(Number(item.unitPrice || 0), invCurrency)}
                                  </td>
                                  <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                                    {formatDashboardMoney(item.quantity * Number(item.unitPrice || 0), invCurrency)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', fontSize: '0.9rem' }}>
                            <div>
                              {invNotes && (
                                <>
                                  <h6 style={{ margin: '0 0 4px 0', textTransform: 'uppercase', color: '#94a3b8', fontSize: '0.7rem' }}>Invoice Notes:</h6>
                                  <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4' }}>{invNotes}</p>
                                </>
                              )}
                              {invPaymentLink && (
                                <div style={{ marginTop: '15px', padding: '10px', background: 'var(--btn-secondary-bg)', border: '1px dashed var(--border)', borderRadius: '4px' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>Client Document Link:</span>
                                  <a href={invPaymentLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#4f46e5', textDecoration: 'underline', wordBreak: 'break-all' }}>{invPaymentLink}</a>
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', textAlign: 'right' }}>
                              <div style={{ width: '100%', maxWidth: '200px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                  <span>Subtotal:</span>
                                  <span>{formatDashboardMoney(invItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0), invCurrency)}</span>
                                </div>
                                {invDiscountRate > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#e11d48' }}>
                                    <span>Discount ({invDiscountRate}%):</span>
                                    <span>-{formatDashboardMoney(invItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * invDiscountRate / 100, invCurrency)}</span>
                                  </div>
                                )}
                                {invTaxRate > 0 && (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                                    <span>Tax ({invTaxRate}%):</span>
                                    <span>{formatDashboardMoney(invItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (1 - invDiscountRate / 100) * invTaxRate / 100, invCurrency)}</span>
                                  </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #0f172a', fontWeight: 'bold', fontSize: '1.05rem', color: '#0f172a' }}>
                                  <span>Total:</span>
                                  <span>{formatDashboardMoney(invItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (1 - invDiscountRate / 100) * (1 + invTaxRate / 100), invCurrency)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Preview Context & Ambient Hint */}
                      <div style={{ 
                        marginTop: '16px', 
                        padding: '10px 12px', 
                        background: 'var(--primary-glow)', 
                        border: '1.5px solid var(--border)', 
                        borderRadius: '6px', 
                        fontSize: '0.8rem',
                        color: 'var(--text-soft)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                          <span className="animate-pulse" style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                          Client-ready preview building...
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Track client review status after document delivery.
                        </div>
                      </div>

                      {/* PDF download trigger button */}
                      <div style={{ marginTop: '12px' }}>
                        {firstFlowExportDone ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="animate-fade-in">
                            <div style={{
                              padding: '14px 16px',
                              background: 'rgba(16, 185, 129, 0.1)',
                              border: '1.5px solid var(--success)',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}>
                              <span style={{ fontSize: '1.2rem' }}>✔</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--success)' }}>Invoice created successfully</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Your PDF is ready.</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                padding: '10px',
                                borderRadius: '8px',
                                background: 'var(--primary)',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                textDecoration: 'none',
                                textAlign: 'center',
                                cursor: 'pointer'
                              }}
                              onClick={() => {
                                trackEvent('cta_click', { cta_name: 'Create another invoice', source: 'first_flow_success' });
                                openInvoiceBuilder();
                              }}
                            >
                              + Create another invoice
                            </button>
                            <button
                              onClick={() => handleExportAttempt('printable-invoice', `invoice_${invNumber}`, invId)}
                              disabled={isDownloadingPdf}
                              className="btn btn-secondary"
                              style={{ width: '100%', fontSize: '0.8rem' }}
                            >
                              {isDownloadingPdf ? 'Generating PDF...' : 'Download again'}
                            </button>
                            
                            {isFreePlan && (
                              <div style={{
                                padding: '14px',
                                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                                borderRadius: '10px',
                                border: '1px solid rgba(79, 70, 229, 0.3)',
                                marginTop: '12px',
                                textAlign: 'left'
                              }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  Level Up Your Business Profile
                                </div>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-soft)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                                  Upgrade to a paid plan for clean PDF exports.
                                </p>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <Link
                                    href="/pricing"
                                    onClick={() => trackEvent('upgrade_trigger_clicked', { plan: 'free', target_plan: 'pro', offer_type: 'soft_banner', cta_text: 'Get Pro' })}
                                    style={{
                                      flex: 1,
                                      padding: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      textAlign: 'center',
                                      background: 'var(--primary)',
                                      color: '#fff',
                                      borderRadius: '6px',
                                      textDecoration: 'none'
                                    }}
                                  >
                                    Get Pro
                                  </Link>
                                  <Link
                                    href="/pricing?checkout=pro"
                                    onClick={() => trackEvent('upgrade_trigger_clicked', { plan: 'free', target_plan: 'pro', offer_type: 'soft_banner', cta_text: 'Get Pro' })}
                                    style={{
                                      flex: 1,
                                      padding: '6px',
                                      fontSize: '0.75rem',
                                      fontWeight: 700,
                                      textAlign: 'center',
                                      background: 'rgba(255, 255, 255, 0.1)',
                                      color: '#fff',
                                      borderRadius: '6px',
                                      border: '1px solid rgba(255, 255, 255, 0.2)',
                                      textDecoration: 'none'
                                    }}
                                  >
                                    See pricing
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : !canExportPdf ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                            <button
                              onClick={() => handleExportAttempt('printable-invoice', `invoice_${invNumber}`, invId)}
                              disabled={isDownloadingPdf}
                              className="btn btn-secondary"
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                              {isDownloadingPdf ? 'Generating PDF...' : 'Watermarked PDF export'}
                            </button>
                            <button
                              onClick={() => {
                                trackEvent('pro_upgrade_view', { source: 'dashboard_invoice_clean_export' });
                                router.push('/pricing?checkout=pro');
                              }}
                              className="btn btn-primary"
                              style={{ 
                                width: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '6px',
                                background: 'var(--primary)',
                                color: '#fff',
                                fontWeight: 700
                              }}
                            >
                              Export Clean PDF
                            </button>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px', margin: 0 }}>
                              Client-visible watermark will appear
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleExportAttempt('printable-invoice', `invoice_${invNumber}`, invId)}
                            disabled={isDownloadingPdf}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                          >
                            {isDownloadingPdf ? 'Generating PDF...' : (hasCleanPdf ? 'Download Clean PDF' : 'Download Watermarked PDF')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          )
        )}

        {activeTab === 'clients' && (
          !session && !isSandboxMode ? (
            renderGuestLockState('Clients Directory', 'Store client document details, default currencies, email contacts, and view active milestone histories to organize client admin.')
          ) : (activeTheme === 'studio') ? (
            <StudioSpace
              clients={getActiveClients()}
              invoices={invoices}
              quotes={quotes}
              leads={leads}
              getCurrencySymbol={getCurrencySymbol}
              triggerToast={triggerToast}
              isSandbox={isSandboxMode}
              isStudioPreview={false}
              businessModeBadge={businessModeBadge}
              onUpgrade={() => {}}
              onTabChange={(tab) => handleDashboardTabChange(tab, 'studio')}
              cpLogoUrl={cpLogoUrl}
              setCpLogoUrl={setCpLogoUrl}
              cpBrandColor={cpBrandColor}
              setCpBrandColor={setCpBrandColor}
              cpBrandSecondary={cpBrandSecondary}
              setCpBrandSecondary={setCpBrandSecondary}
              cpFontFamily={cpFontFamily}
              setCpFontFamily={setCpFontFamily}
              cpThemePreference={cpThemePreference}
              setCpThemePreference={setCpThemePreference}
              cpName={cpName}
              cpTitle={cpTitle}
              handleSaveCardProfile={handleSaveCardProfile}
              isSaving={isSaving}
              cpPortfolio={cpPortfolio}
              newClientName={newClientName}
              setNewClientName={setNewClientName}
              newClientEmail={newClientEmail}
              setNewClientEmail={setNewClientEmail}
              newClientAddress={newClientAddress}
              setNewClientAddress={setNewClientAddress}
              handleSaveClient={handleSaveClient}
              handleDeleteClient={handleDeleteClient}
              formError={formError}
              formSuccess={formSuccess}
              initCreateInvoice={initCreateInvoice}
              initCreateQuote={initCreateQuote}
              isQuoteDataLoading={isQuotesLoading}
              isInvoiceDataLoading={isInvoicesLoading}
              quoteDataError={quotesError}
              invoiceDataError={invoicesError}
            />
          ) : (
            <div className="animate-fade-in">
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em' }}>Client Directory</h1>

            <div className="dashboard-grid-2fr-1fr" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))' }}>
              {/* Directory List */}
              <div>
                {getActiveClients().length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', border: '1px dashed var(--border)' }}>
                    <svg style={{ width: '48px', height: '48px', color: 'var(--text-soft)', margin: '0 auto 16px', display: 'block', opacity: 0.6 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20H7m0-3a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p style={{ fontSize: '1.05rem', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 700 }}>Manage client records in one centralized directory to prepare quotes and documents quickly.</p>
                    <p style={{ fontSize: '0.85rem', marginBottom: '20px', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.45 }}>
                      Add client contacts, company details, and default terms to generate customized documents in seconds without repetitive copy-pasting.
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-soft)', fontWeight: 700 }}>
                      👉 Enter client details in the form on the right to save your first contact.
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginTop: '12px', marginBottom: 0 }}>
                      Privacy-focused client data controls. Client details are encrypted and stored in your private database.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {getActiveClients().map((cli) => {
                      const isDocumentsExpanded = expandedClientDocumentsId === cli.id;
                      const documentsControlId = `client-documents-toggle-${cli.id}`;
                      const documentsPanelId = `client-documents-panel-${cli.id}`;
                      return (
                        <div key={cli.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                            <div style={{ minWidth: 0 }}>
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', overflowWrap: 'anywhere' }}>{cli.name}</h3>
                              <p style={{ fontSize: '0.85rem', color: 'var(--accent)', marginTop: '2px', overflowWrap: 'anywhere' }}>{cli.email}</p>
                              {cli.address && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', overflowWrap: 'anywhere' }}>{cli.address}</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                id={documentsControlId}
                                type="button"
                                className="btn btn-secondary btn-sm"
                                aria-expanded={isDocumentsExpanded}
                                aria-controls={documentsPanelId}
                                aria-label={`${isDocumentsExpanded ? 'Hide' : 'View'} documents for ${cli.name}`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setExpandedClientDocumentsId(isDocumentsExpanded ? null : cli.id);
                                }}
                              >
                                {isDocumentsExpanded ? 'Hide documents' : 'View documents'}
                              </button>
                              <button
                                onClick={() => {
                                  initCreateInvoice({
                                    source: 'client_bill',
                                    clientContext: {
                                      client_id: cli.id,
                                      client_name: cli.name,
                                      client_email: cli.email || '',
                                      client_address: cli.address || '',
                                    },
                                  });
                                  trackEvent('quick_action_click', { action: 'bill_client' });
                                }}
                                className="btn btn-secondary btn-sm"
                              >
                                Bill
                              </button>
                              <button onClick={() => handleDeleteClient(cli.id)} style={{ color: 'var(--danger)', fontSize: '0.85rem', padding: '0 8px', cursor: 'pointer' }}>Delete</button>
                            </div>
                          </div>
                          {isDocumentsExpanded && (
                            <ClientDocumentsPanel
                              client={cli}
                              quotes={quotes}
                              invoices={invoices}
                              isQuotesLoading={isQuotesLoading}
                              isInvoicesLoading={isInvoicesLoading}
                              quotesError={quotesError}
                              invoicesError={invoicesError}
                              onOpenDocument={openDocument}
                              controlId={documentsControlId}
                              panelId={documentsPanelId}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Client Card */}
              <div>
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.01em' }}>Save Client Profile</h3>
                  
                  {formError && (
                    <div style={{ padding: '12px 16px', background: 'var(--danger-glow)', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger-text)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                      {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div style={{ padding: '12px 16px', background: 'var(--success-glow)', border: '1px solid var(--success-border)', borderRadius: '6px', color: 'var(--success-text)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                      {formSuccess}
                    </div>
                  )}
                  
                  <form onSubmit={handleSaveClient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label">Client Name</label>
                      <input type="text" className="form-input" value={newClientName} onChange={e => setNewClientName(e.target.value)} required placeholder="e.g. Wayne Enterprises" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Client Email</label>
                      <input type="email" className="form-input" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} placeholder="e.g. Bruce@wayne.com" />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Client Address</label>
                      <textarea className="form-textarea" value={newClientAddress} onChange={e => setNewClientAddress(e.target.value)} placeholder="Mailing / company address..." />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>Save Client</button>
                  </form>
                </div>
              </div>
            </div>
            </div>
          )
        )}

        {/* TAB 6: PUBLIC PROFILE CARD CONFIGURATION */}
        {activeTab === 'profile' && (
          !session ? (
            renderGuestLockState('Public Profile Setup', 'Configure your services, display starting prices, enable Calendly integrations, and showcase customer testimonials on a search-optimized URL.')
          ) : (
            <div className="animate-fade-in">
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em' }}>Public Profile Setup</h1>

            {formError && (
              <div style={{ padding: '12px 16px', background: 'var(--danger-glow)', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger-text)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{ padding: '12px 16px', background: 'var(--success-glow)', border: '1px solid var(--success-border)', borderRadius: '6px', color: 'var(--success-text)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
                {formSuccess}
              </div>
            )}

            {/* AI Profile Generator (Guided Action Lock & First Value Moment) */}
            <div className="card animate-fade-in" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>AI Public Profile Generator</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    Describe your freelance services in a few words. Let AI instantly generate a complete Public Profile.
                  </p>
                </div>
                {isFreePlan && (
                  <span style={{ background: 'var(--accent-glow)', color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
                    1 Generation Attempt Free
                  </span>
                )}
              </div>

              <form onSubmit={handleGenerateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <textarea
                  className="form-textarea"
                  value={profilePrompt}
                  onChange={(e) => setProfilePrompt(e.target.value)}
                  placeholder="e.g. Full-stack developer building Next.js web applications and design systems"
                  rows={2}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="submit"
                    disabled={isGeneratingProfile}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '10px 16px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    {isGeneratingProfile ? 'Generating Profile...' : 'Generate for me'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('profile-attributes-card');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '10px 16px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    Edit manually
                  </button>
                </div>
              </form>
            </div>

            <div className="dashboard-grid-2col">

              {/* Card Profile Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Public Link Generator */}
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Shareable URL</h3>
                  {cpUsername ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        readOnly
                        className="form-input"
                        style={{ background: 'var(--btn-secondary-bg)', color: 'var(--accent)', fontWeight: 600 }}
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${cpUsername}`}
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/profile/${cpUsername}`);
                          triggerToast('Profile Card Link copied!', 'success');
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Copy URL
                      </button>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Select a username below to initialize your public business landing page URL.</p>
                  )}
                </div>
                
                {/* Brand Kit Card — deferred until the Studio tier is available. */}
                {SHOW_DEFERRED_BRAND_KIT && (
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Brand</span> Brand Kit & Logo Customization
                    </h3>
                    {!entitlements.automation && (
                      <span style={{ background: 'var(--accent-glow)', color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                        Studio Pack
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
                    Upload your custom logo, configure brand colors, and set up custom typography styles for public profile pages, quotes, and invoices.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (entitlements.automation) {
                        triggerToast('Brand assets settings loaded. Ready to apply custom typography and logo.', 'success');
                      } else {
                        setModalProps({
                          title: "Brand Kit is coming soon",
                          description: "Custom brand kits are planned for Studio and are not available for purchase yet.",
                          lockedFeatureValue: "Brand Kit & Logo Customization",
                          limit: "brand_kit",
                          source: "brand_kit_gate",
                          targetPlan: "support"
                        });
                        setActiveModal('upgrade');
                      }
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', fontWeight: 700 }}
                  >
                    Configure Brand Kit
                  </button>
                </div>
                )}

                {/* Profile Details Card */}
                <div id="profile-attributes-card" className="card" style={{ padding: '32px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px' }}>Landing Page Attributes</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                        <label className="input-label">Username (URL Slug)</label>
                        <input type="text" className="form-input" placeholder="e.g. alex-morgan" value={cpUsername} onChange={e => setCpUsername(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Display Name</label>
                        <input type="text" className="form-input" placeholder="e.g. Alex Morgan" value={cpName} onChange={e => setCpName(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                        <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Cover Banner CSS Background</span>
                          {isFreePlan && <span style={{ background: 'var(--accent-glow)', color: 'var(--accent)', fontSize: '0.65rem', padding: '1px 4px', borderRadius: '4px', scale: '0.9' }}>Pro</span>}
                        </label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder={isFreePlan ? "Default gradient (Upgrade to customize)" : "e.g. linear-gradient(135deg, #6366f1, #06b6d4)"}
                          value={isFreePlan ? "" : cpCoverBanner}
                          disabled={isFreePlan}
                          onChange={e => setCpCoverBanner(e.target.value)} 
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Avatar Image URL</label>
                        <input type="text" className="form-input" placeholder="e.g. https://example.com/avatar.jpg" value={cpAvatarUrl} onChange={e => setCpAvatarUrl(e.target.value)} />
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Professional Subtitle</label>
                      <input type="text" className="form-input" placeholder="e.g. Full-Stack Developer & SaaS Designer" value={cpTitle} onChange={e => setCpTitle(e.target.value)} />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Value Proposition (Bio)</label>
                      <textarea className="form-textarea" placeholder="Detail your experience, value proposition, and availability..." value={cpBio} onChange={e => setCpBio(e.target.value)} />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Expertise Tags (Comma separated)</label>
                      <input type="text" className="form-input" placeholder="React, Node.js, Figma, UI/UX" value={cpTags} onChange={e => setCpTags(e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="input-group">
                        <label className="input-label">Location</label>
                        <input type="text" className="form-input" placeholder="e.g. Remote / London" value={cpLocation} onChange={e => setCpLocation(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Timezone</label>
                        <input type="text" className="form-input" placeholder="e.g. GMT+1" value={cpTimezone} onChange={e => setCpTimezone(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Languages</label>
                        <input type="text" className="form-input" placeholder="e.g. English, French" value={cpLanguages} onChange={e => setCpLanguages(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="input-group">
                        <label className="input-label">Starting Price</label>
                        <input type="text" className="form-input" placeholder="e.g. CAD 1,500 or USD 1,500" value={cpStartingPrice} onChange={e => setCpStartingPrice(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Avg Response Time</label>
                        <input type="text" className="form-input" placeholder="e.g. < 2 hours" value={cpResponseTime} onChange={e => setCpResponseTime(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Availability Status</label>
                        <select className="form-select" value={cpAvailabilityStatus} onChange={e => setCpAvailabilityStatus(e.target.value)}>
                          <option value="Available for contract">Available for contract</option>
                          <option value="High availability">High availability</option>
                          <option value="Busy / Retainer only">Busy / Retainer only</option>
                          <option value="Vacation / Offline">Vacation / Offline</option>
                        </select>
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Calendly Booking Link URL</label>
                      <input type="url" className="form-input" placeholder="e.g. https://calendly.com/your-username" value={cpCalendlyLink} onChange={e => setCpCalendlyLink(e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                        <label className="input-label">Contact Email</label>
                        <input type="email" className="form-input" value={cpEmail} onChange={e => setCpEmail(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Contact Phone</label>
                        <input type="text" className="form-input" value={cpPhone} onChange={e => setCpPhone(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                        <label className="input-label">GitHub Username</label>
                        <input type="text" className="form-input" value={cpGithub} onChange={e => setCpGithub(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Twitter Username</label>
                        <input type="text" className="form-input" value={cpTwitter} onChange={e => setCpTwitter(e.target.value)} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="input-group">
                        <label className="input-label">LinkedIn Username</label>
                        <input type="text" className="form-input" value={cpLinkedin} onChange={e => setCpLinkedin(e.target.value)} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Website URL</label>
                        <input type="url" className="form-input" value={cpWebsite} onChange={e => setCpWebsite(e.target.value)} />
                      </div>
                    </div>

                    {/* Trust Badges Config */}
                    <div className="card" style={{ padding: '16px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span className="input-label" style={{ fontSize: '0.65rem' }}>Profile Badges</span>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isFreePlan ? 'not-allowed' : 'pointer', opacity: isFreePlan ? 0.7 : 1 }}>
                          <input type="checkbox" checked={isFreePlan ? false : cpVerifiedBadge} disabled={isFreePlan} onChange={e => setCpVerifiedBadge(e.target.checked)} />
                          <span>Verified badge</span>
                          {isFreePlan && <span style={{ background: 'var(--accent-glow)', color: 'var(--accent)', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', scale: '0.85' }}>Pro</span>}
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isFreePlan ? 'not-allowed' : 'pointer', opacity: isFreePlan ? 0.7 : 1 }}>
                          <input type="checkbox" checked={isFreePlan ? false : cpTopRatedBadge} disabled={isFreePlan} onChange={e => setCpTopRatedBadge(e.target.checked)} />
                          <span>Top Rated badge</span>
                          {isFreePlan && <span style={{ background: 'var(--accent-glow)', color: 'var(--accent)', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', scale: '0.85' }}>Pro</span>}
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: isFreePlan ? 'not-allowed' : 'pointer', opacity: isFreePlan ? 0.7 : 1 }}>
                          <input type="checkbox" checked={isFreePlan ? false : cpFastResponseBadge} disabled={isFreePlan} onChange={e => setCpFastResponseBadge(e.target.checked)} />
                          <span>Fast Response badge</span>
                          {isFreePlan && <span style={{ background: 'var(--accent-glow)', color: 'var(--accent)', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', scale: '0.85' }}>Pro</span>}
                        </label>
	                      </div>
	                    </div>

	                    <div className="card" style={{ padding: '16px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)' }}>
	                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
	                        <input type="checkbox" checked={cpIsPublic} onChange={e => setCpIsPublic(e.target.checked)} />
	                        Publish this profile
	                      </label>
	                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '8px 0 0' }}>
	                        Published, complete profiles can be indexed. Unpublished or incomplete profiles stay noindex.
	                      </p>
	                    </div>

	                    <button onClick={handleSaveCardProfile} disabled={isSaving} className="btn btn-primary" style={{ marginTop: '12px', width: '100%' }}>
                      {isSaving ? 'Updating...' : 'Save Public Card Profile'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Services & Portfolios Builders */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Services Section */}
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.01em' }}>Services List</h3>

                  {/* Service list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {cpServices.map((srv, idx) => (
                      <div key={idx} style={{ padding: '10px 12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{srv.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDashboardNumber(srv.rate_amount)} / {srv.rate_type} · Currency not specified</div>
                        </div>
                        <button
                          onClick={() => setCpServices(cpServices.filter((_, i) => i !== idx))}
                          style={{ color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add service form */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" className="form-input" placeholder="Service Name (e.g. Next.js Development)" value={tmpSrvName} onChange={e => setTmpSrvName(e.target.value)} />
                    <input type="text" className="form-input" placeholder="Service description..." value={tmpSrvDesc} onChange={e => setTmpSrvDesc(e.target.value)} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                      <input type="number" className="form-input" placeholder="Amount (e.g. 1500)" value={tmpSrvAmount} onChange={e => setTmpSrvAmount(Number(e.target.value))} />
                      <select className="form-select" value={tmpSrvType} onChange={e => setTmpSrvType(e.target.value)}>
                        <option value="fixed">Fixed</option>
                        <option value="hourly">Hourly</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!tmpSrvName || tmpSrvAmount <= 0) return;
                        setCpServices([...cpServices, { id: `srv_${Date.now()}`, name: tmpSrvName, description: tmpSrvDesc, rate_type: tmpSrvType, rate_amount: tmpSrvAmount }]);
                        setTmpSrvName('');
                        setTmpSrvDesc('');
                        setTmpSrvAmount(0);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      + Add Service
                    </button>
                  </div>
                </div>

                {/* Portfolio Section */}
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.01em' }}>Portfolio Showcase</h3>

                  {/* Portfolio List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {cpPortfolio.map((p, idx) => (
                      <div key={idx} style={{ padding: '10px 12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {p.title}
                            {p.featured && <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>★ Featured</span>}
                          </div>
                          {p.category && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Category: {p.category}</div>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const newPort = [...cpPortfolio];
                              const temp = newPort[idx];
                              newPort[idx] = newPort[idx - 1];
                              newPort[idx - 1] = temp;
                              setCpPortfolio(newPort);
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-soft)', cursor: idx === 0 ? 'default' : 'pointer', fontSize: '0.85rem', opacity: idx === 0 ? 0.3 : 1, padding: '2px 4px' }}
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={idx === cpPortfolio.length - 1}
                            onClick={() => {
                              const newPort = [...cpPortfolio];
                              const temp = newPort[idx];
                              newPort[idx] = newPort[idx + 1];
                              newPort[idx + 1] = temp;
                              setCpPortfolio(newPort);
                            }}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-soft)', cursor: idx === cpPortfolio.length - 1 ? 'default' : 'pointer', fontSize: '0.85rem', opacity: idx === cpPortfolio.length - 1 ? 0.3 : 1, padding: '2px 4px' }}
                            title="Move Down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => setCpPortfolio(cpPortfolio.filter((_, i) => i !== idx))}
                            style={{ color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem', background: 'transparent', border: 'none', marginLeft: '6px' }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add portfolio form */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" className="form-input" placeholder="Project Title" value={tmpProjTitle} onChange={e => setTmpProjTitle(e.target.value)} />
                    <input type="text" className="form-input" placeholder="Project description..." value={tmpProjDesc} onChange={e => setTmpProjDesc(e.target.value)} />
                    <input type="url" className="form-input" placeholder="Project URL Link" value={tmpProjLink} onChange={e => setTmpProjLink(e.target.value)} />
                    
                    {activeTheme !== 'starter' && (
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input type="text" className="form-input" style={{ flex: 1 }} placeholder="Project Category (e.g. Design)" value={tmpProjCategory} onChange={e => setTmpProjCategory(e.target.value)} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                          <input type="checkbox" checked={tmpProjFeatured} onChange={e => setTmpProjFeatured(e.target.checked)} />
                          Featured Work
                        </label>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (!tmpProjTitle) return;
                        setCpPortfolio([...cpPortfolio, {
                          title: tmpProjTitle,
                          description: tmpProjDesc,
                          link: tmpProjLink,
                          category: tmpProjCategory || '',
                          featured: !!tmpProjFeatured
                        }]);
                        setTmpProjTitle('');
                        setTmpProjDesc('');
                        setTmpProjLink('');
                        setTmpProjCategory('');
                        setTmpProjFeatured(false);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      + Add Project
                    </button>
                  </div>
                </div>

                {/* Testimonials Section */}
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.01em' }}>Testimonials / Client Reviews</h3>

                  {/* Testimonial List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {cpTestimonials.map((t, idx) => (
                      <div key={idx} style={{ padding: '10px 12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.client_name} ({t.client_project})</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>&quot;{t.feedback}&quot;</div>
                        </div>
                        <button
                          onClick={() => setCpTestimonials(cpTestimonials.filter((_, i) => i !== idx))}
                          style={{ color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add testimonial form */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" className="form-input" placeholder="Client Name (e.g. Pepper Potts)" value={tmpClientName} onChange={e => setTmpClientName(e.target.value)} />
                    <input type="text" className="form-input" placeholder="Project Name (e.g. Stark Staging Audit)" value={tmpClientProject} onChange={e => setTmpClientProject(e.target.value)} />
                    <textarea className="form-textarea" placeholder="Client feedback details..." value={tmpClientFeedback} onChange={e => setTmpClientFeedback(e.target.value)} style={{ minHeight: '60px' }} />
                    <button
                      type="button"
                      onClick={() => {
                        if (!tmpClientName || !tmpClientFeedback) return;
                        setCpTestimonials([...cpTestimonials, { client_name: tmpClientName, client_project: tmpClientProject, feedback: tmpClientFeedback }]);
                        setTmpClientName('');
                        setTmpClientProject('');
                        setTmpClientFeedback('');
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      + Add Testimonial
                    </button>
                  </div>
                </div>

              </div>

            </div>
            </div>
          )
        )}

        {/* TAB 7: STUDIO SPACE */}
        {activeTab === 'studio' && (
          !session && !isSandboxMode ? (
            renderGuestLockState('Studio Space', 'Centralized client management for multiple client records, overdue management, and reminder communications.')
          ) : (
            <StudioSpace
              clients={getActiveClients()}
              invoices={invoices}
              quotes={quotes}
              leads={leads}
              getCurrencySymbol={getCurrencySymbol}
              triggerToast={triggerToast}
              isSandbox={isSandboxMode}
              isStudioPreview={studioPreviewActive && !isStudio}
              businessModeBadge={businessModeBadge}
              onUpgrade={() => {
                setModalProps({
                  source: 'studio_preview_banner',
                  explanation: 'Studio is a coming-soon preview for future multi-client operations and is not available for purchase yet.',
                });
                setActiveModal('pricing_upsell');
              }}
              onTabChange={(tab) => handleDashboardTabChange(tab, 'studio')}
            />
          )
        )}

        {/* TAB 8: STUDIO PORTFOLIO MANAGER */}
        {activeTab === 'portfolio' && (
          !session && !isSandboxMode ? (
            renderGuestLockState('Studio Showcase Manager', 'Configure case studies, results tracking, and media showcases.')
          ) : (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>Agency Showcase Manager</h1>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>Publish grouped services, client testimonials, and featured work with results metrics.</p>
              </div>

              {formError && (
                <div style={{ padding: '12px 16px', background: 'var(--danger-glow)', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger-text)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ padding: '12px 16px', background: 'var(--success-glow)', border: '1px solid var(--success-border)', borderRadius: '6px', color: 'var(--success-text)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {formSuccess}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* Left Column: Editor controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Landing slug */}
                  <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Agency URL Slug</h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>corvioz.com/profile/</span>
                      <input 
                        type="text" 
                        className="form-input" 
                        style={{ flex: 1 }} 
                        placeholder="e.g. alpha-digital" 
                        value={cpUsername} 
                        onChange={e => setCpUsername(e.target.value)} 
                      />
                    </div>
                  </div>

                  {/* Grouped Services */}
                  <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Service Offerings</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      {cpServices.map((srv, idx) => (
                        <div key={srv.id || idx} style={{ padding: '12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{srv.name} <span style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'var(--primary-glow)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>{srv.group || 'General'}</span></div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }}>{formatDashboardNumber(srv.rate_amount)} &bull; {srv.rate_type} · Currency not specified</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCpServices(cpServices.filter((_, i) => i !== idx))}
                            style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <input type="text" className="form-input" placeholder="Service Name" value={tmpSrvName} onChange={e => setTmpSrvName(e.target.value)} />
                        <input type="text" className="form-input" placeholder="Group (e.g. Design Services)" value={tmpSrvGroup} onChange={e => setTmpSrvGroup(e.target.value)} />
                      </div>
                      <textarea className="form-textarea" placeholder="Service description..." value={tmpSrvDesc} onChange={e => setTmpSrvDesc(e.target.value)} style={{ minHeight: '60px' }} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <select className="form-select" value={tmpSrvType} onChange={e => setTmpSrvType(e.target.value)}>
                          <option value="fixed">Flat Package Fee</option>
                          <option value="hourly">Hourly Rate</option>
                        </select>
                        <input type="number" className="form-input" placeholder="Amount (numeric)" value={tmpSrvAmount || ''} onChange={e => setTmpSrvAmount(Number(e.target.value))} />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!tmpSrvName || tmpSrvAmount <= 0) return;
                          setCpServices([...cpServices, {
                            id: `srv_${Date.now()}`,
                            name: tmpSrvName,
                            description: tmpSrvDesc,
                            rate_type: tmpSrvType,
                            rate_amount: tmpSrvAmount,
                            group: tmpSrvGroup || 'General'
                          }]);
                          setTmpSrvName('');
                          setTmpSrvDesc('');
                          setTmpSrvAmount(0);
                          setTmpSrvGroup('');
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        + Add Service
                      </button>
                    </div>
                  </div>

                  {/* Portfolio Case Studies */}
                  <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Visual Case Studies</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      {cpPortfolio.map((p, idx) => (
                        <div key={idx} style={{ padding: '12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {p.title}
                              {p.featured && <span style={{ fontSize: '0.65rem', background: 'var(--accent-glow)', color: 'var(--accent)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>★ Featured</span>}
                            </div>
                            {p.results && <div style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600 }}>Results: {p.results}</div>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => {
                                const newP = [...cpPortfolio];
                                const temp = newP[idx];
                                newP[idx] = newP[idx - 1];
                                newP[idx - 1] = temp;
                                setCpPortfolio(newP);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: idx === 0 ? 'default' : 'pointer' }}
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={idx === cpPortfolio.length - 1}
                              onClick={() => {
                                const newP = [...cpPortfolio];
                                const temp = newP[idx];
                                newP[idx] = newP[idx + 1];
                                newP[idx + 1] = temp;
                                setCpPortfolio(newP);
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: idx === cpPortfolio.length - 1 ? 'default' : 'pointer' }}
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={() => setCpPortfolio(cpPortfolio.filter((_, i) => i !== idx))}
                              style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', marginLeft: '6px' }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input type="text" className="form-input" placeholder="Project Title" value={tmpProjTitle} onChange={e => setTmpProjTitle(e.target.value)} />
                      <input type="text" className="form-input" placeholder="Project Description" value={tmpProjDesc} onChange={e => setTmpProjDesc(e.target.value)} />
                      <input type="url" className="form-input" placeholder="Case Study URL (Optional)" value={tmpProjLink} onChange={e => setTmpProjLink(e.target.value)} />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <input type="text" className="form-input" placeholder="Category (e.g. Web Dev)" value={tmpProjCategory} onChange={e => setTmpProjCategory(e.target.value)} />
                        <input type="text" className="form-input" placeholder="Results / Metrics (e.g. +82% Load Speed)" value={tmpProjResults} onChange={e => setTmpProjResults(e.target.value)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px', alignItems: 'center' }}>
                        <input type="url" className="form-input" placeholder="Video Embed URL (Vimeo/YouTube)" value={tmpProjMedia} onChange={e => setTmpProjMedia(e.target.value)} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer', userSelect: 'none' }}>
                          <input type="checkbox" checked={tmpProjFeatured} onChange={e => setTmpProjFeatured(e.target.checked)} />
                          Featured Work
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!tmpProjTitle) return;
                          setCpPortfolio([...cpPortfolio, {
                            title: tmpProjTitle,
                            description: tmpProjDesc,
                            link: tmpProjLink,
                            category: tmpProjCategory || '',
                            featured: !!tmpProjFeatured,
                            results: tmpProjResults || '',
                            media_embed: tmpProjMedia || ''
                          }]);
                          setTmpProjTitle('');
                          setTmpProjDesc('');
                          setTmpProjLink('');
                          setTmpProjCategory('');
                          setTmpProjFeatured(false);
                          setTmpProjResults('');
                          setTmpProjMedia('');
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        + Add Case Study
                      </button>
                    </div>
                  </div>

                  {/* Testimonials */}
                  <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '16px' }}>Testimonials & Reviews</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                      {cpTestimonials.map((t, idx) => (
                        <div key={idx} style={{ padding: '12px', background: 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{t.client_name} &bull; <span style={{ color: 'var(--text-muted)' }}>{t.client_project}</span></div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)', fontStyle: 'italic' }}>&quot;{t.feedback}&quot;</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCpTestimonials(cpTestimonials.filter((_, i) => i !== idx))}
                            style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <input type="text" className="form-input" placeholder="Client Name" value={tmpClientName} onChange={e => setTmpClientName(e.target.value)} />
                        <input type="text" className="form-input" placeholder="Project Role / Name" value={tmpClientProject} onChange={e => setTmpClientProject(e.target.value)} />
                      </div>
                      <textarea className="form-textarea" placeholder="Client feedback details..." value={tmpClientFeedback} onChange={e => setTmpClientFeedback(e.target.value)} style={{ minHeight: '60px' }} />
                      <button
                        type="button"
                        onClick={() => {
                          if (!tmpClientName || !tmpClientFeedback) return;
                          setCpTestimonials([...cpTestimonials, {
                            client_name: tmpClientName,
                            client_project: tmpClientProject,
                            feedback: tmpClientFeedback
                          }]);
                          setTmpClientName('');
                          setTmpClientProject('');
                          setTmpClientFeedback('');
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        + Add Testimonial
                      </button>
                    </div>
                  </div>

                </div>

                {/* Right Column: Settings */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'sticky', top: '24px' }}>
                  <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Publish Details</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-soft)', lineHeight: '1.4' }}>Save changes to update your live agency profile. This is instantly reflected on your custom Public Profile link.</p>
                    
                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: '0.72rem' }}>Availability Status</label>
                      <input type="text" className="form-input" value={cpAvailabilityStatus} onChange={e => setCpAvailabilityStatus(e.target.value)} />
                    </div>
                    
                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: '0.72rem' }}>Response target</label>
                      <input type="text" className="form-input" value={cpResponseTime} onChange={e => setCpResponseTime(e.target.value)} />
                    </div>

                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: '0.72rem' }}>Starting Project Price</label>
                      <input type="text" className="form-input" value={cpStartingPrice} onChange={e => setCpStartingPrice(e.target.value)} />
                    </div>

                    <div className="input-group">
                      <label className="input-label" style={{ fontSize: '0.72rem' }}>Calendly Booking URL</label>
                      <input type="url" className="form-input" value={cpCalendlyLink} onChange={e => setCpCalendlyLink(e.target.value)} placeholder="https://calendly.com/your-team" />
                    </div>

                    <button
                      onClick={handleSaveCardProfile}
                      disabled={isSaving}
                      className="btn btn-primary"
                      style={{ width: '100%', fontWeight: 700, padding: '12px' }}
                    >
                      {isSaving ? 'Saving Changes...' : 'Save Public Profile'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )
        )}

        {/* TAB 9: STUDIO BRAND KIT */}
        {activeTab === 'brand' && (
          !session && !isSandboxMode ? (
            renderGuestLockState('Brand Kit Settings', 'White-label client invoice documents, quote layouts, and custom theme presets.')
          ) : (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>Agency Brand Kit</h1>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>Configure white-labeled assets, brand color variables, custom fonts, and profile styles.</p>
              </div>

              {formError && (
                <div style={{ padding: '12px 16px', background: 'var(--danger-glow)', border: '1px solid var(--danger-border)', borderRadius: '6px', color: 'var(--danger-text)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ padding: '12px 16px', background: 'var(--success-glow)', border: '1px solid var(--success-border)', borderRadius: '6px', color: 'var(--success-text)', fontSize: '0.85rem', fontWeight: 600 }}>
                  {formSuccess}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* Brand controls */}
                <div className="card" style={{ padding: '32px', background: 'var(--background-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Theme & Colors</h3>
                  
                  <div className="input-group">
                    <label className="input-label">Agency Logo URL</label>
                    <input 
                      type="url" 
                      className="form-input" 
                      placeholder="https://..." 
                      value={cpLogoUrl} 
                      onChange={e => setCpLogoUrl(e.target.value)} 
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: '4px' }}>Renders on public landing header and in invoice PDFs.</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label">Primary Color</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="color" value={cpBrandColor || '#4f46e5'} onChange={e => setCpBrandColor(e.target.value)} style={{ width: '40px', height: '40px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: 0, background: 'none' }} />
                        <input type="text" className="form-input" value={cpBrandColor} onChange={e => setCpBrandColor(e.target.value)} style={{ flex: 1, fontFamily: 'monospace' }} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Secondary Color</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="color" value={cpBrandSecondary || '#06b6d4'} onChange={e => setCpBrandSecondary(e.target.value)} style={{ width: '40px', height: '40px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: 0, background: 'none' }} />
                        <input type="text" className="form-input" value={cpBrandSecondary} onChange={e => setCpBrandSecondary(e.target.value)} style={{ flex: 1, fontFamily: 'monospace' }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label">Typography Font</label>
                      <select className="form-select" value={cpFontFamily} onChange={e => setCpFontFamily(e.target.value)}>
                        <option value="Inter">Inter (Sans-Serif)</option>
                        <option value="Outfit">Outfit (Agency Clean)</option>
                        <option value="Playfair Display">Playfair Display (Premium Editorial)</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Theme Preference</label>
                      <select className="form-select" value={cpThemePreference} onChange={e => setCpThemePreference(e.target.value)}>
                        <option value="dark">Sleek Dark Mode</option>
                        <option value="light">Crisp Light Mode</option>
                        <option value="glass">Glassmorphism Aesthetic</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveCardProfile}
                    disabled={isSaving}
                    className="btn btn-primary"
                    style={{ width: '100%', fontWeight: 700, padding: '12px', marginTop: '12px' }}
                  >
                    {isSaving ? 'Saving Assets...' : 'Apply Brand Settings'}
                  </button>
                </div>

                {/* Brand Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>
                  <div className="card" style={{ 
                    padding: '32px', 
                    background: cpThemePreference === 'light' ? '#ffffff' : (cpThemePreference === 'glass' ? 'rgba(30, 41, 59, 0.4)' : '#0f172a'),
                    color: cpThemePreference === 'light' ? '#1e293b' : '#f8fafc',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    fontFamily: cpFontFamily === 'Outfit' ? '"Outfit", sans-serif' : (cpFontFamily === 'Playfair Display' ? '"Playfair Display", serif' : 'var(--font-sans)'),
                    backdropFilter: cpThemePreference === 'glass' ? 'blur(16px)' : 'none',
                    boxShadow: 'var(--shadow-lg)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, fontWeight: 700 }}>White-Label Web Preview</span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cpBrandColor || '#4f46e5' }}></span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      {cpLogoUrl ? (
                        <img src={cpLogoUrl} alt="Logo" style={{ height: '40px', objectFit: 'contain' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `linear-gradient(135deg, ${cpBrandColor || '#4f46e5'}, ${cpBrandSecondary || '#06b6d4'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>A</div>
                      )}
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{cpName || 'Alpha Agency'}</h4>
                        <span style={{ fontSize: '0.72rem', color: cpThemePreference === 'light' ? '#64748b' : '#94a3b8' }}>{cpTitle || 'Studio Dashboard'}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 24px 0', opacity: 0.9 }}>
                      This live preview displays how your public landing page, milestone summaries, and itemized client receipts will adapt to your agency brand colors, logo, and selected typography.
                    </p>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: cpBrandColor || '#4f46e5',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}>
                        Primary Button
                      </button>
                      <button style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '8px',
                        border: `1px solid ${cpBrandColor || 'var(--border)'}`,
                        background: 'transparent',
                        color: cpThemePreference === 'light' ? cpBrandColor : '#fff',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}>
                        Outline CTA
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )
        )}

        {/* TAB 10: STUDIO REPORTS */}
        {activeTab === 'reports' && (
          !session && !isSandboxMode ? (
            renderGuestLockState('Studio Reports', 'Access analytics tracking: pipeline velocity, client acquisition rates, and delivery projections.')
          ) : (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>Agency Reports &amp; Analytics</h1>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>Real-time agency metrics, contract values, and delivery velocity indicators.</p>
              </div>

              {/* Top stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Document Total</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--primary)' }}>
                    {formatDashboardNumber(leads.reduce((sum, l) => {
                      const utm = typeof l.source_utm === 'object' ? l.source_utm : JSON.parse(l.source_utm || '{}');
                      return sum + Number(utm.lead_value || l.lead_value || 0);
                    }, 0))}
                  </h3>
                </div>
                <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acquisition Cost (CAC)</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--success)' }}>240.00 · Currency not specified</h3>
                </div>
                <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deal Close Velocity</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--accent)' }}>8.4 Days</h3>
                </div>
                <div className="card" style={{ padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice Clearance Rate</span>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--text-main)' }}>98.2%</h3>
                </div>
              </div>

              {/* Client workflow charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', alignItems: 'stretch' }}>
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Monthly Client Workflow Growth</h3>
                  <div style={{ display: 'flex', gap: '20px', height: '200px', alignItems: 'flex-end', borderBottom: '1px solid var(--border)', paddingBottom: '10px', paddingTop: '20px' }}>
                    {[
                      { month: 'Jan', val: 40, amt: '4,000 · Currency not specified' },
                      { month: 'Feb', val: 55, amt: '5,500 · Currency not specified' },
                      { month: 'Mar', val: 78, amt: '7,800 · Currency not specified' },
                      { month: 'Apr', val: 62, amt: '6,200 · Currency not specified' },
                      { month: 'May', val: 95, amt: '9,500 · Currency not specified' },
                      { month: 'Jun', val: 120, amt: '12,000 · Currency not specified' },
                    ].map((bar, idx) => (
                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-soft)' }}>{bar.amt}</span>
                        <div style={{ width: '100%', height: `${bar.val}%`, background: idx === 5 ? 'var(--primary)' : 'var(--btn-secondary-bg)', border: '1px solid var(--border)', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }} />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{bar.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>Client Conversion Funnel</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { stage: 'Inbound Inquiries', count: 120, percent: 100, color: 'var(--primary)' },
                      { stage: 'Qualified Quotes', count: 72, percent: 60, color: 'var(--accent)' },
                      { stage: 'Accepted Estimates', count: 36, percent: 30, color: 'var(--success)' },
                      { stage: 'Settle Milestones', count: 32, percent: 26, color: '#3b82f6' },
                    ].map((row, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                          <span style={{ color: 'var(--text-soft)' }}>{row.stage}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{row.count} ({row.percent}%)</span>
                        </div>
                        <div style={{ height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${row.percent}%`, background: row.color, borderRadius: '4px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* TAB 11: STUDIO AUTOMATION */}
        {activeTab === 'automation' && (
          !session && !isSandboxMode ? (
            renderGuestLockState('Automation Engine', 'Automate document follow-up reminders, Slack notification channels, and CRM webhooks.')
          ) : (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>Agency Automation Hub</h1>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>Configure automated workflows, client notifications, and Slack notifications.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'stretch' }}>
                
                {/* Automation triggers */}
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Workflow Automations</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked style={{ marginTop: '3px' }} />
                      <div>
                        <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-main)' }}>Automated Overdue Escalation</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Email reminders will automatically dispatch to clients at 7 days, 14 days, and 30 days overdue.</span>
                      </div>
                    </label>

                    <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked style={{ marginTop: '3px' }} />
                      <div>
                        <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-main)' }}>Quote Autoreply Scoping</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Inbound inquiries will receive a confirmation message and direct booking link instantly.</span>
                      </div>
                    </label>

                    <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                      <input type="checkbox" style={{ marginTop: '3px' }} />
                      <div>
                        <strong style={{ fontSize: '0.85rem', display: 'block', color: 'var(--text-main)' }}>Auto-generate Receipts</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>Generate and email watermarked PDFs to clients after document review.</span>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={() => triggerToast('Workflow automation settings saved!', 'success')}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', fontWeight: 700, padding: '10px' }}
                  >
                    Save Automations
                  </button>
                </div>

                {/* Slack webhook integrations */}
                <div className="card" style={{ padding: '24px', background: 'var(--background-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Slack Webhooks</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--success)', background: 'var(--success-glow)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Sandbox Connected</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-soft)', lineHeight: '1.4' }}>Receive Slack alerts in your team channel whenever a new lead enters the CRM pipeline or a document is completed.</p>
                  
                  <div style={{ background: 'var(--btn-secondary-bg)', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    Webhook URL:<br/>
                    <span style={{ color: 'var(--primary)', wordBreak: 'break-all' }}>https://hooks.slack.com/services/T00/B00/X00</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>Webhook Trigger Log</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '0.72rem', padding: '6px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>[SUCCESS]</span> lead.created: Client <strong>Pepper Potts</strong> submitted inquiry &bull; 1h ago
                      </div>
                      <div style={{ fontSize: '0.72rem', padding: '6px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-muted)' }}>
                        <span style={{ color: 'var(--success)', fontWeight: 700 }}>[SUCCESS]</span> document.completed: Document <strong>#INV-041</strong> completed &bull; 4h ago
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )
        )}

      </Container>

      {feedbackModalOpen && (
        <div
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setFeedbackModalOpen(false);
            }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="beta-feedback-title"
            onSubmit={submitBetaFeedback}
            className="card dashboard-modal-card"
            style={{
              width: 'min(100%, 520px)',
              padding: '28px',
              background: 'var(--background-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              transform: 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
              <div>
                <h3 id="beta-feedback-title" style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 850 }}>
                  Share Beta Feedback
                </h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.55 }}>
                  Tell us what broke, what felt unclear, or what should improve before the beta opens wider.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackModalOpen(false)}
                aria-label="Close feedback modal"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--btn-secondary-bg)',
                  color: 'var(--text-main)',
                  borderRadius: '6px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  lineHeight: 1,
                  transform: 'none',
                  transition: 'background-color 0.15s, border-color 0.15s, color 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                  e.currentTarget.style.background = 'var(--btn-secondary-hover-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--btn-secondary-bg)';
                }}
              >
                &times;
              </button>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', fontWeight: 750, color: 'var(--text-soft)' }}>
              Category
              <select
                className="form-select"
                value={feedbackCategory}
                onChange={(e) => setFeedbackCategory(e.target.value)}
              >
                <option>Dashboard</option>
                <option>Client-facing page</option>
                <option>Quote</option>
                <option>Invoice</option>
                <option>Pricing</option>
                <option>Feature Request</option>
                <option>Bug</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', fontWeight: 750, color: 'var(--text-soft)' }}>
              Feedback
              <textarea
                className="form-textarea"
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="What happened? What did you expect instead?"
                rows={5}
                required
              />
            </label>

            {feedbackError && (
              <div style={{ color: 'var(--danger)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                {feedbackError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setFeedbackModalOpen(false)}
                style={{ transform: 'none' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={feedbackSubmitting}
                style={{ transform: 'none' }}
              >
                {feedbackSubmitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </form>
        </div>
      )}

      {recordPaymentInvoice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="record-payment-title"
          data-testid="record-payment-modal"
          className="dashboard-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <form
            className="card animate-fade-in dashboard-modal-card"
            onSubmit={(event) => {
              event.preventDefault();
              handleRecordPayment(recordPaymentInvoice);
            }}
            style={{ maxWidth: '460px', width: '100%', padding: '32px', background: 'var(--background-card)', border: '1px solid var(--border)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 id="record-payment-title" style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Record Payment</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '8px 0 0', lineHeight: 1.45 }}>
                  Record funds already received. Corvioz does not process or collect this payment.
                </p>
              </div>
              <button type="button" onClick={closeRecordPaymentModal} disabled={isRecordingPayment} aria-label="Close record payment dialog" style={{ fontSize: '1.5rem', color: 'var(--text-muted)', cursor: isRecordingPayment ? 'not-allowed' : 'pointer', background: 'none', border: 'none' }}>&times;</button>
            </div>

            <label htmlFor="record-payment-amount" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-soft)' }}>
              Amount received ({recordPaymentInvoice.currency || 'USD'})
              <input
                id="record-payment-amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={recordPaymentAmount}
                onChange={(event) => {
                  setRecordPaymentAmount(event.target.value);
                  setRecordPaymentError('');
                }}
                autoFocus
                required
                disabled={isRecordingPayment}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-page)', color: 'var(--text-main)', fontSize: '1rem' }}
              />
            </label>

            {recordPaymentError && (
              <div role="alert" style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: 'var(--danger-glow)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)', fontSize: '0.82rem', fontWeight: 650 }}>
                {recordPaymentError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" onClick={closeRecordPaymentModal} disabled={isRecordingPayment} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" disabled={isRecordingPayment} className="btn btn-primary" style={{ flex: 1 }}>{isRecordingPayment ? 'Recording...' : 'Record payment'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Paywall Modals */}
      <UpgradeModal
        isOpen={activeModal === 'upgrade'}
        onClose={() => setActiveModal(null)}
        title={modalProps.title}
        description={modalProps.description}
        lockedFeatureValue={modalProps.lockedFeatureValue}
        limit={modalProps.limit}
        source={modalProps.source}
        explanation={modalProps.explanation}
        targetPlan={modalProps.targetPlan || 'pro'}
      />

      <ExportRestrictionModal
        isOpen={activeModal === 'export'}
        onClose={() => {
          setActiveModal(null);
        }}
        onDownloadFree={() => {
          if (modalProps.onDownloadFree) {
            modalProps.onDownloadFree();
          }
          setActiveModal(null);
        }}
        source={modalProps.source}
        explanation={modalProps.explanation}
        documentType={modalProps.documentType}
      />

      <PricingUpsellModal
        isOpen={activeModal === 'pricing_upsell'}
        onClose={() => setActiveModal(null)}
        source={modalProps.source}
        explanation={modalProps.explanation}
      />

      <PricingRedirectOverlay
        isOpen={activeModal === 'redirect_overlay'}
        explanation={modalProps.explanation}
      />

      {showExportPurposeModal && (
        <div role="dialog" className="dashboard-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(3, 7, 18, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="card animate-fade-in dashboard-modal-card" style={{
            maxWidth: '460px',
            width: '95%',
            padding: '28px',
            background: 'var(--bg-card, #111827)',
            border: '1px solid var(--border, #1f2937)',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
            fontFamily: 'Outfit, sans-serif'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-main, #f9fafb)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📦</span> Specify Export Context
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #9ca3af)', margin: '0 0 20px 0', lineHeight: 1.4 }}>
              Before exporting, please indicate the business context of this action. This helps keep your workflow history accurate.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-soft, #d1d5db)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Export Purpose
                </label>
                <select
                  value={exportPurpose}
                  onChange={(e) => {
                    const val = e.target.value;
                    setExportPurpose(val);
                    if (val === 'client send' || val === 'final invoice') {
                      setExportSentToClient(true);
                    } else {
                      setExportSentToClient(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface, #030712)',
                    border: '1px solid var(--border, #1f2937)',
                    color: 'var(--text-main, #f9fafb)',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="draft">📝 Internal Draft Export</option>
                  <option value="client send">Client Delivery Copy</option>
                  <option value="final invoice">Final Accounting Invoice</option>
                  <option value="revision export">🔄 Scope Revision / Edit Update</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border, #1f2937)' }}>
                <input
                  type="checkbox"
                  id="sent-to-client-checkbox"
                  checked={exportSentToClient}
                  onChange={(e) => setExportSentToClient(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: 'var(--primary, #4F46E5)',
                    cursor: 'pointer'
                  }}
                />
                <label htmlFor="sent-to-client-checkbox" style={{ fontSize: '0.8rem', color: 'var(--text-soft, #d1d5db)', cursor: 'pointer', select: 'none', lineHeight: 1.3 }}>
                  This document will be delivered to the client
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowExportPurposeModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px 0', fontSize: '0.85rem', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmExport}
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px 0', fontSize: '0.85rem', fontWeight: 700, background: 'var(--primary, #4F46E5)', color: '#fff' }}
              >
                Confirm &amp; Export
              </button>
            </div>
          </div>
        </div>
      )}



      {/* 3. Business Mode Activated Modal (1st Client created) */}
      {showBusinessModeModal && (
        <div className="dashboard-modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(3, 7, 18, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="card animate-fade-in dashboard-modal-card" style={{
            maxWidth: '460px',
            width: '95%',
            padding: '28px',
            background: 'var(--bg-card, #111827)',
            border: '1px solid var(--border, #1f2937)',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
            fontFamily: 'Outfit, sans-serif'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <span className="product-state-mark">Pro</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #f9fafb)' }}>
                Business Mode Activated
              </h3>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-soft, #d1d5db)', margin: '0 0 16px 0', lineHeight: 1.45, textAlign: 'center' }}>
              Congratulations on creating your first client profile! You are moving from ad-hoc tasks to an organized photography business.
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #9ca3af)', margin: '0 0 20px 0', lineHeight: 1.4, textAlign: 'center' }}>
              To support this growth, paid plans add clean PDF branding while the core quote, invoice, and payment workflow stays available.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href="/pricing?checkout=pro"
                onClick={() => {
                  setShowBusinessModeModal(false);
                  saveSelectedPlan('pro', 'business_mode_modal');
                  trackUpgradeClick('business_mode_modal', 'pro');
                }}
                className="btn btn-primary"
                style={{ width: '100%', textAlign: 'center', textDecoration: 'none', padding: '10px 0', fontSize: '0.85rem', fontWeight: 700, background: 'var(--primary, #4F46E5)', color: '#fff' }}
              >
                Upgrade to Pro
              </Link>
              <button
                onClick={() => setShowBusinessModeModal(false)}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '10px 0', fontSize: '0.82rem', fontWeight: 600 }}
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Studio Preview Welcome Modal (2nd Client created) */}
      {showStudioPreviewModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(3, 7, 18, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(8px)'
        }}>
          <div className="card animate-fade-in" style={{
            maxWidth: '480px',
            width: '95%',
            padding: '32px',
            background: 'var(--bg-card, #111827)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '20px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.5)',
            fontFamily: 'Outfit, sans-serif'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span className="product-state-mark studio-modal-mark">Studio</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-main, #f9fafb)' }}>
                Scale Operations with Studio
              </h3>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-soft, #d1d5db)', margin: '0 0 16px 0', lineHeight: 1.45, textAlign: 'center' }}>
              With 2+ clients in your roster, managing individual contracts gets complex. To help you manage this scale, we have unlocked a **Preview** of the **Service Business Studio**.
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #9ca3af)', margin: '0 0 24px 0', lineHeight: 1.4, textAlign: 'center' }}>
              Explore the Client Status Board, Overdue Invoice Tracker, and communications center. Studio is positioned as a comprehensive hub for your multi-client workflow operations.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  setShowStudioPreviewModal(false);
                  handleDashboardTabChange('studio', 'studio_welcome_modal');
                }}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px 0', fontSize: '0.82rem', fontWeight: 700 }}
              >
                Explore Preview
              </button>
              <button
                type="button"
                disabled
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px 0', fontSize: '0.82rem', fontWeight: 700, background: 'var(--surface-muted, #374151)', color: 'var(--text-muted, #9ca3af)', border: '1px solid var(--border)', cursor: 'not-allowed', opacity: 0.8 }}
              >
                Studio — Coming Soon
              </button>
            </div>
          </div>
        </div>
      )}

      {suggestedActionDoc && (
        <div className="dashboard-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="card animate-fade-in dashboard-modal-card" style={{ maxWidth: '500px', width: '90%', padding: '32px', background: 'var(--background-card)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center' }}>
              <span className="product-state-mark">Done</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
              {suggestedActionDoc.type === 'invoice' ? 'Invoice Ready!' : 'Quote Ready!'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: 1.4 }}>
              Your document draft #{suggestedActionDoc.number} has been created successfully. What would you like to do next?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {/* Option 1: Open the saved document */}
              <button
                onClick={() => {
                  const docInfo = suggestedActionDoc;
                  setSuggestedActionDoc(null);
                  openDocument({ documentType: docInfo.type, id: docInfo.id });
                }}
                className="btn btn-primary animate-pulse-subtle"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  fontSize: '0.9rem', 
                  fontWeight: 700, 
                  background: 'var(--primary)', 
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: 'var(--shadow-glow)',
                  cursor: 'pointer'
                }}
              >
                <span>Open</span>
                <span>Open {suggestedActionDoc.type === 'invoice' ? 'Invoice' : 'Quote'}</span>
              </button>

              {/* Option 2: Export PDF */}
              <button
                onClick={async () => {
	                  const docInfo = suggestedActionDoc;
	                  setSuggestedActionDoc(null);
	                  await handleExportAttempt(docInfo.elementId, `${docInfo.type}_${docInfo.number}`, docInfo.id);
	                  if (docInfo.type === 'invoice') setInvoiceView('list');
	                  else setQuoteView('list');
                }}
                className="btn btn-secondary"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  fontSize: '0.9rem', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <span>Export</span>
                <span>{hasCleanPdf ? 'Export Clean PDF' : 'Export Watermarked PDF'}</span>
              </button>
              {!hasCleanPdf && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '-8px 0 0 0', textAlign: 'center' }}>
                  Client-visible watermark will appear
                </p>
              )}

              {/* Option 3: Create quote/invoice follow-up */}
              <button
                onClick={() => {
                  setSuggestedActionDoc(null);
                  if (suggestedActionDoc.type === 'invoice') {
                    initCreateQuote('suggested_action');
                  } else {
                    openInvoiceBuilder('suggested_action');
                  }
                }}
                className="btn btn-secondary"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  fontSize: '0.9rem', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <span>📝</span>
                <span>{suggestedActionDoc.type === 'invoice' ? 'Improve quote follow-up' : 'Create Invoice'}</span>
              </button>
            </div>

            <button
	              onClick={() => {
	                setSuggestedActionDoc(null);
	                if (suggestedActionDoc.type === 'invoice') setInvoiceView('list');
	                else setQuoteView('list');
	              }}
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-soft)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Post Export Suggested Actions & Insights Modal */}
      {postExportDoc && (
        <div className="dashboard-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="card animate-fade-in dashboard-modal-card" style={{ maxWidth: '500px', width: '90%', padding: '32px', background: 'var(--background-card)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Document Exported</h3>
              <button onClick={() => setPostExportDoc(null)} style={{ fontSize: '1.5rem', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>&times;</button>
            </div>

            {/* Behavioral Feedback Panel */}
            <div style={{ padding: '16px', background: 'var(--primary-glow)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px', textAlign: 'left' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>
                Next-Step Insights
              </h4>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-soft)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Recommended action: Share your exported document with your client.</li>
                <li>Common next step: Track delivery and status updates.</li>
              </ul>
            </div>

            {isFreePlan && (
              <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)',
                borderRadius: '8px',
                border: '1.5px dashed rgba(79, 70, 229, 0.3)',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 6px 0', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⭐</span> Remove PDF Watermarks
                </h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: 'var(--text-soft)', lineHeight: 1.4 }}>
                  Free exports include a Corvioz watermark. Paid plans include clean PDF branding.
                </p>
                <Link
                  href="/pricing"
                  onClick={() => {
                    trackEvent('upgrade_trigger_clicked', {
                      plan: 'free',
                      offer_type: 'checkout_nudge',
                      cta_text: 'View paid plans'
                    });
                    setPostExportDoc(null);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textAlign: 'center',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    background: 'var(--primary)',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  View paid plans (Clean PDF branding)
                </Link>
              </div>
            )}

            {/* Close after export */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  const docInfo = postExportDoc;
                  setPostExportDoc(null);
                  if (docInfo?.id) openDocument({ documentType: docInfo.type, id: docInfo.id });
                }}
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {postExportDoc?.id ? `Open ${postExportDoc.type === 'invoice' ? 'Invoice' : 'Quote'}` : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          padding: firstFlowExportDone && toast.type === 'success' ? '14px 20px' : '12px 20px',
          borderRadius: '10px',
          background: toast.type === 'error' ? 'var(--danger)' : (toast.type === 'info' ? 'var(--primary)' : 'var(--success)'),
          color: '#fff',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          fontSize: '0.85rem',
          fontWeight: 600,
          zIndex: 9999,
          display: 'flex',
          flexDirection: firstFlowExportDone && toast.type === 'success' ? 'column' : 'row',
          alignItems: firstFlowExportDone && toast.type === 'success' ? 'flex-start' : 'center',
          gap: '8px',
          maxWidth: '320px',
          animation: 'fade-in 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{toast.type === 'error' ? 'Error' : (toast.type === 'info' ? 'Info' : 'Done')}</span>
            {toast.message}
          </div>
          {firstFlowExportDone && toast.type === 'success' && (
            <button
              type="button"
              style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.78rem', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}
              onClick={() => {
                trackEvent('cta_click', { cta_name: 'Create another invoice', source: 'success_toast' });
                openInvoiceBuilder();
              }}
            >
              Create another invoice
            </button>
          )}
        </div>
      )}

      {/* Floating Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <DevDashboardAuditPanel
          isDebugPanelVisible={isDebugPanelVisible}
          setIsDebugPanelVisible={setIsDebugPanelVisible}
          exportCount={exportCount}
          isFreePlan={isFreePlan}
          planStatusLabel={planStatusLabel}
          showExportPurposeModal={showExportPurposeModal}
        />
      )}
    </div>
  </div>
);
}

function DevDashboardAuditPanel({
  isDebugPanelVisible,
  setIsDebugPanelVisible,
  exportCount,
  isFreePlan,
  planStatusLabel,
  showExportPurposeModal
}) {
  if (isDebugPanelVisible) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        width: '380px',
        maxHeight: '500px',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        color: '#f8fafc',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '0.82rem',
        textAlign: 'left',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.72rem' }}>Audit</span>
            <strong style={{ fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#38bdf8' }}>Corvioz Verification Audit</strong>
          </div>
          <button
            onClick={() => setIsDebugPanelVisible(false)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
          >
            &times;
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '2px' }}>exportCount</div>
            <strong style={{ fontSize: '1.2rem', color: '#38bdf8' }}>{exportCount}</strong>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '2px' }}>User Plan</div>
            <strong style={{ fontSize: '1rem', color: isFreePlan ? '#f43f5e' : '#10b981' }}>{planStatusLabel}</strong>
          </div>
        </div>

        {/* Trigger Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <strong style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Trigger Status</strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ padding: '3px 8px', borderRadius: '99px', background: showExportPurposeModal ? '#2563eb' : 'rgba(255,255,255,0.05)', color: showExportPurposeModal ? '#fff' : '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
              Purpose Modal: {showExportPurposeModal ? 'VISIBLE' : 'HIDDEN'}
            </span>
          </div>
        </div>

        {/* Last 10 events */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minHeight: '0' }}>
          <strong style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Telemetry Logs (Last 8)</strong>
          <div style={{ 
            background: 'rgba(0,0,0,0.2)', 
            borderRadius: '8px', 
            border: '1px solid rgba(255,255,255,0.05)', 
            padding: '8px', 
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '180px'
          }}>
            {typeof window !== 'undefined' && window.__corvioz_debug_events && window.__corvioz_debug_events.length > 0 ? (
              [...window.__corvioz_debug_events].reverse().slice(0, 8).map((evt, idx) => (
                <div key={idx} style={{ padding: '4px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', borderLeft: '3px solid #38bdf8', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>{evt.name}</span>
                    <span style={{ color: '#64748b', fontSize: '0.68rem' }}>{formatDashboardTime(evt.timestamp)}</span>
                  </div>
                  {evt.props && Object.keys(evt.props).length > 0 && (
                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {JSON.stringify(evt.props)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ color: '#64748b', fontStyle: 'italic', padding: '10px', textAlign: 'center' }}>No events tracked yet.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsDebugPanelVisible(true)}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        background: 'var(--primary, #4F46E5)',
        color: '#fff',
        border: 'none',
        borderRadius: '99px',
        padding: '10px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        zIndex: 99999,
        fontWeight: 700,
        fontSize: '0.8rem',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      <span>Audit</span> Debug UI
    </button>
  );
}
