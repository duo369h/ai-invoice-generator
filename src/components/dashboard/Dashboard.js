'use client';
import useQuoteDraftContinuity from './useQuoteDraftContinuity';
import QuoteLeaveDialog from './QuoteLeaveDialog';
import { buildQuoteDraftFingerprint } from './quoteEditorProfessionalModel';
import { captureInvoicePdfDocument, captureQuotePdfDocument } from '../../app/lib/pdf';

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

import IntelligenceUsageNotice from './IntelligenceUsageNotice.js';
import {prepareSemanticAnalysis, recordAnalysisAttempt, readAnalysisOperation,fetchIntelligenceUsage,resumeAnalysisOperation} from './intelligenceBudgetClient.js';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import DashboardAccountMenu from './DashboardAccountMenu';
import Link from 'next/link';
import PublicProfileWorkspace from './PublicProfileWorkspace';
import HarborMobileNavigation from './HarborMobileNavigation';
import { getHarborFocusedContext } from './harborMobileNavigation.mjs';
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
import BusinessTimezoneSetting from './BusinessTimezoneSetting';
import ExportDownloadAction from './ExportDownloadAction';
import InvoiceClientDocument from './InvoiceClientDocument';
import InvoiceReviewPresentation from './InvoiceReviewPresentation';
import { invoiceEditorViewRecord, captureInvoiceEvidence, hydrateInvoiceItems, invoiceEvidenceMatches, invoiceNotificationMessage, canRetryInvoiceNotification } from '../../core/revenue/invoiceEditorEvidence.mjs';
import { resolveInvoiceClientDocument } from '../../core/revenue/invoiceClientDocument.mjs';
import { calculateLineItemAmount } from '../../core/quotes/lineItemBilling.js';
import StudioSpace, { StudioClientsEntry } from '@/app/dashboard/components/StudioSpace';
import ClientWorkspace from './ClientWorkspace';
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
import { getDashboardTabForTool as getWave1DashboardTabForTool, getDashboardRouteForTab, getOverviewWorkDetails } from './dashboardWave1.mjs';
import { deserializeQuoteNotes as deserializeInvoiceNotes, serializeQuoteNotes as serializeInvoiceNotes, readNarrativePaymentTermsV1, readPreparedForDisplayOverride, withNarrativePaymentTermsV1 } from './quoteNotes.mjs';
import { getClientDocumentContinuity, getEffectiveDocumentTimestamp } from './clientDocumentContinuity.mjs';
import { getBusinessReferenceDate, addCalendarDays, normalizeDateOnly } from '../../app/lib/businessTimezone.mjs';
import { hasRecordedInvoicePayment, paymentStatusForInvoice, resolveInvoicePaymentReadModel, summarizeInvoicePayments } from '../../core/revenue/invoicePaymentState.js';
import QuotePresentationBoundary from './QuotePresentationBoundary';
import QuoteEditorProfessional from './QuoteEditorProfessional';
import ProjectCoverPicker from './ProjectCoverPicker';
import { resolveProjectCover } from '../../core/quotes/projectCover.mjs';
import { createQuoteEditorCoherenceSession, reviewQuotePreSend, dismissQuoteEditorFinding, getQuoteEditorFinding } from './quoteEditorCoherenceSession.js';
import { ensureQuoteLineItemId, fetchQuoteAcceptedBaseline } from './quoteEditorProfessionalModel';
import ProjectUnderstandingWorkspace from './ProjectUnderstandingWorkspace';
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

export function ClientDocumentsPanel({
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
      : document.status === 'draft' ? 'draft' : paymentStatusForInvoice(document);
    const date = formatDocumentDate(document);
    return (
      <li
        key={document.id || reference}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,.05)', flexWrap: 'wrap' }}
      >
        <div style={{ minWidth: 0, flex: '1 1 180px' }}>
          <div style={{ overflowWrap: 'anywhere', color: 'var(--block02-dark-ink)', fontWeight: 650 }}>{reference}</div>
          <div style={{ color: 'var(--block02-gray-muted)', fontSize: '0.8rem' }}>{status}{date ? ` · ${date}` : ''}</div>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          aria-label={`Open ${type === 'quote' ? 'Quote' : 'Invoice'} ${reference}`}
          onClick={() => { if (onOpenDocument?.({ documentType: type, id: document.id }) === false) window.alert('This document is not available in the loaded records.'); }}
        >
          Open
        </button>
      </li>
    );
  });

  const renderResource = ({ label, documents, more, unavailable, stale, emptyEligible, emptyMessage, loading }) => (
    <div style={{ minWidth: 0 }}>
      <h5 style={{ margin: '0 0 6px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--block02-gray-muted)' }}>{label}</h5>
      {loading && <p role="status" style={{ margin: '0 0 6px', color: 'var(--block02-gray-muted)', fontSize: '0.82rem' }}>Loading {label.toLowerCase()}…</p>}
      {unavailable && <p role="alert" style={{ margin: '0 0 6px', color: '#b91c1c', fontSize: '0.82rem' }}>{label} unavailable.</p>}
      {stale && <p role="status" style={{ margin: '0 0 6px', color: 'var(--block02-gray-muted)', fontSize: '0.82rem' }}>{label} data is retained but may be stale.</p>}
      {emptyEligible && <p style={{ margin: '0', color: 'var(--block02-gray-muted)', fontSize: '0.82rem' }}>No linked {label.toLowerCase()} in the loaded records.</p>}
      {documents.length > 0 && (
        <>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>{renderDocuments(documents, label === 'Quotes' ? 'quote' : 'invoice')}</ul>
          {more > 0 && <p style={{ margin: '7px 0 0', color: 'var(--block02-gray-muted)', fontSize: '0.78rem' }}>+ {more} more loaded {label.toLowerCase()}</p>}
        </>
      )}
    </div>
  );

  return (
    <section
      id={panelId}
      data-testid={panelId}
      aria-label="Loaded document records"
      style={{ width: '100%', padding: '14px 16px', borderRadius: '2px', background: 'var(--white)', border: '1px solid rgba(0,0,0,.05)', overflow: 'hidden' }}
    >
      <h4 style={{ margin: '0 0 12px', fontSize: '0.95rem', color: 'var(--block02-dark-ink)' }}>Loaded document records</h4>
      {clientDocuments.combinedEmptyEligible ? (
        <p style={{ margin: 0, color: 'var(--block02-gray-muted)', fontSize: '0.85rem' }}>No linked documents in the loaded records.</p>
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
  { id: 'create', label: 'Edit' },
  { id: 'preview', label: 'Preview' },
  { id: 'send', label: 'Send' },
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
export const getInvoiceTimelineState = (invoice = {}, now = new Date(), options = {}) => {
  const resolvedInvoice = (typeof invoice === 'string' ? { status: invoice } : invoice) || {};
  const status = resolvedInvoice.status || 'draft';
  const created = Boolean(resolvedInvoice?.id);
  const payment = resolveInvoicePaymentReadModel(resolvedInvoice, now, options);
  const paymentStatus = payment.payment_status;
  const sent = created && status === 'sent';
  const completed = created && paymentStatus === 'paid';
  const overdue = created && status !== 'draft' && payment.is_overdue;

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
const renderInvoiceTimeline = (invoice, now, options) => {
  const { stages, progressWidth, overdue } = getInvoiceTimelineState(invoice, now, options);

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

// Display-only ledger context follows the existing notes and exact invoice lineage.
function formatDocumentLedgerMoney(record) {
  const total = record?.total;
  const currency = typeof record?.currency === 'string' ? record.currency.trim().toUpperCase() : '';
  const hasAmount = (typeof total === 'number' || (typeof total === 'string' && total.trim() !== '')) && Number.isFinite(Number(total));
  if (!hasAmount || !/^[A-Z]{3}$/.test(currency)) return 'Total unavailable';
  return formatDashboardMoney(Number(total) / 100, currency);
}

function getDocumentLedgerDetails(record, documentType = 'quote', quotes = [], now = new Date()) {
  let metadata = deserializeInvoiceNotes(typeof record?.notes === 'string' ? record.notes : '').metadata;
  if (documentType === 'invoice' && !metadata.quote_preset_id && record?.quote_id) {
    const linkedQuote = (Array.isArray(quotes) ? quotes : []).find((quote) => quote?.id === record.quote_id);
    if (linkedQuote) metadata = deserializeInvoiceNotes(typeof linkedQuote.notes === 'string' ? linkedQuote.notes : '').metadata;
  }
  const preset = getPhotographyWorkflowTemplateById(typeof metadata.quote_preset_id === 'string' ? metadata.quote_preset_id.trim() : null);
  const scope = normalizePhotographyScope(metadata.photography_scope_v2);
  return {
    ...getOverviewWorkDetails(record, documentType, quotes, now),
    title: scope.common.shoot_type || preset?.label || `Photography ${documentType}`,
    category: preset?.label || 'Photography',
  };
}

function DocumentLedgerStatus({ status }) {
  const label = { draft: 'Draft', sent: 'Sent', approved: 'Approved', converted: 'Converted', declined: 'Declined', unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid' }[status] || 'Status unavailable';
  return (
    <span className={`document-ledger-status document-ledger-status-${status || 'unknown'}`}>
      <svg aria-hidden="true" viewBox="0 0 100 12" preserveAspectRatio="none">
        <path opacity="0.12" d="M3 5.7 12 5.5 23 5.7 35 5.4 47 5.6 59 5.5 71 5.7 83 5.4 98 5.6 96 10.6 87 10.8 75 10.6 64 10.9 52 10.7 40 10.9 28 10.6 16 10.8 1 10.6Z" />
        <path opacity="0.05" d="M5 6.2 19 6.4 32 6.1 46 6.3 60 6.1 74 6.4 96 6.2 94 10.1 79 9.9 64 10.2 50 10 36 10.2 21 9.9 4 10.1Z" />
        <path opacity="0.025" d="M7 7.2 24 7 40 7.3 57 7.1 75 7.3 94 7.1 94 7.5 74 7.7 58 7.5 40 7.7 24 7.4 7 7.6Z M4 9.2 20 9.1 34 9.3 53 9.1 69 9.4 90 9.2 90 9.6 70 9.8 53 9.5 34 9.7 20 9.5 4 9.6Z" />
        <path opacity="0.035" d="M9 6.1h2v.3H9Z M18 8.2h3v.25h-3Z M26 6.6h1.5v.35H26Z M34 9.8h2v.25h-2Z M42 7.9h3v.3h-3Z M51 6h2v.25h-2Z M59 8.7h1.5v.3H59Z M68 6.8h2.5v.25H68Z M77 9.6h3v.3h-3Z M85 8h2v.3h-2Z M92 6.6h1.5v.3H92Z" />
      </svg>
      <span>{label}</span>
    </span>
  );
}

function DocumentLedgerImageToggle({ showImages, onToggle }) {
  return (
    <button type="button" className="document-ledger-image-toggle" aria-pressed={showImages} aria-label={showImages ? 'Hide project images' : 'Show project images'} onClick={onToggle}>
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="1" /><circle cx="7" cy="7" r="1" /><path d="m4 15 4-4 3 3 2-2 3 3" /></svg>
      {showImages ? 'Hide images' : 'Show images'}
    </button>
  );
}

function DocumentLedgerColumns({ showImages, documentType }) {
  return (
    <div className={`document-ledger-columns document-ledger-grid${showImages ? ' document-ledger-with-images' : ''}`} aria-hidden="true">
      {showImages && <span />}
      <span>Project / Document</span><span>Client</span><span>{documentType === 'invoice' ? 'Issued / Due' : 'Updated'}</span><span className="document-ledger-amount">Total</span><span>Status</span>
    </div>
  );
}

function DocumentLedgerState({ kind, documentType, onCreate, error = false }) {
  if (kind === 'loading') {
    return (
      <div className="document-ledger-state document-ledger-loading" data-testid={`${documentType}s-loading`} role="status" aria-label={`Loading ${documentType}s`}>
        <span className="document-ledger-state-title">Loading {documentType}s…</span>
        {[0, 1, 2].map((row) => <div className="document-ledger-loading-line" key={row}><span className="skeleton animate-pulse" /><span className="skeleton animate-pulse" /><span className="skeleton animate-pulse" /></div>)}
      </div>
    );
  }
  if (error) {
    return (
      <div className="document-ledger-state" role="alert">
        <h2>{documentType === 'quote' ? 'Quotes' : 'Invoices'} unavailable</h2>
        <p>Refresh to load your {documentType}s.</p>
        <button type="button" onClick={onCreate} className="document-ledger-new-action">+ New {documentType}</button>
      </div>
    );
  }
  return (
    <div className="document-ledger-state">
      <h2><span className="document-ledger-desktop-copy">{documentType === 'quote' ? 'Your next project starts here.' : 'A clear path from work to payment.'}</span><span className="document-ledger-mobile-copy">{error ? `${documentType === 'quote' ? 'Quotes' : 'Invoices'} unavailable` : `No ${documentType}s yet.`}</span></h2>
      <p><span className="document-ledger-desktop-copy">{documentType === 'quote' ? 'Choose a shoot preset, shape the scope, and prepare your first client quote.' : 'Create an invoice with client details, line items, a due date, and clear payment terms.'}</span><span className="document-ledger-mobile-copy">{error ? `Refresh to load your ${documentType}s.` : documentType === 'quote' ? 'New quotes will appear here.' : 'New invoices will appear here.'}</span></p>
      <button type="button" onClick={onCreate} className="document-ledger-new-action">+ New {documentType}</button>
    </div>
  );
}

// Screen-only preview fitting. The canonical document measures at 1:1 first.
function InvoicePreviewFrame({ children }) {
  const frameRef = useRef(null);
  useEffect(() => {
    const frame = frameRef.current;
    const canvas = frame?.querySelector('.invoice-preview-canvas');
    if (!frame || !canvas) return undefined;
    const updateFit = () => {
      const available = frame.getBoundingClientRect().width;
      const sourceWidth = canvas.offsetWidth;
      if (available > 0 && sourceWidth > 0) {
        frame.style.setProperty('--invoice-preview-scale', String(Math.min(1, available / sourceWidth)));
      }
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(updateFit) : null;
    observer?.observe(frame);
    observer?.observe(canvas);
    window.addEventListener('resize', updateFit);
    updateFit();
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateFit);
    };
  }, []);
  return <div className="invoice-document-preview invoice-preview-fit" ref={frameRef} role="region" aria-label="Invoice document preview" tabIndex={0}>
    <p className="invoice-preview-preparing" role="status">Preparing preview…</p>
    <div className="invoice-preview-canvas">{children}</div>
  </div>;
}

// Invoice presentation only: measure scroll-tail clearance and retain usable focus.
function useInvoiceFloatingActions(workspaceRef, enabled) {
  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!enabled || !workspace) return;
    const actions = workspace.querySelector('.invoice-editor-actions');
    const scroll = workspace.querySelector('.invoice-document-workspace');
    if (!actions || !scroll) return;

    const keepFocusedFieldVisible = ({ target }) => {
      if (!scroll.contains(target) || !target?.matches?.('input, textarea, select, button, a, summary')) return;
      const field = target.getBoundingClientRect();
      const viewport = scroll.getBoundingClientRect();
      const safeBottom = Math.min(viewport.bottom, actions.getBoundingClientRect().top - 16);
      if (field.bottom > safeBottom) scroll.scrollBy({ top: Math.ceil(field.bottom - safeBottom), behavior: 'auto' });
      else if (field.top < viewport.top + 16) scroll.scrollBy({ top: Math.floor(field.top - viewport.top - 16), behavior: 'auto' });
    };
    const updateClearance = () => {
      const height = actions.getBoundingClientRect().height;
      if (height > 0) workspace.style.setProperty('--invoice-actions-height', `${height}px`);
      keepFocusedFieldVisible({ target: scroll.ownerDocument?.activeElement });
    };
    updateClearance();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(updateClearance) : null;
    observer?.observe(actions);
    scroll.addEventListener('focusin', keepFocusedFieldVisible);
    window.addEventListener('resize', updateClearance);
    return () => {
      observer?.disconnect();
      scroll.removeEventListener('focusin', keepFocusedFieldVisible);
      window.removeEventListener('resize', updateClearance);
      workspace.style.removeProperty('--invoice-actions-height');
    };
  }, [workspaceRef, enabled]);
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
  const [quoteLedgerImagesVisible, setQuoteLedgerImagesVisible] = useState(true);
  const [invoiceLedgerImagesVisible, setInvoiceLedgerImagesVisible] = useState(true);
  
  const [session, setSession] = useState(null);
  const sessionRef = useRef(null);
  const [supabaseClient, setSupabaseClient] = useState(undefined);
  const [authChecked, setAuthChecked] = useState(previewMode);
  const [dashboardDataError, setDashboardDataError] = useState(null);
  
  const dashboardData = useDashboardData(mode, session);
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
    readInvoiceStatus,
    saveCardProfile,
    deleteQuote,
    deleteInvoice,
    clientWorkspace,
    saveLead
  } = dashboardData;

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
    if (isDevelopment) console.log('[INSTRUMENTATION] exportCount_updated:', exportCount);
  }, [exportCount]);

  const isSandboxMode = isDemo || (typeof window !== 'undefined' && window.sessionStorage.getItem('corvioz_sandbox_mode') === 'true');
  const isStudio = entitlements.crm || entitlements.automation || isSandboxMode;

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [toast, setToast] = useState(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountButtonRef = useRef(null);
  const [profileFocused, setProfileFocused] = useState(false);
  const [isSavingLearningPreference, setIsSavingLearningPreference] = useState(false);
  const [learningPreferenceError, setLearningPreferenceError] = useState('');
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
      triggerToast('Feedback sent. Thank you.', 'success');
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
  const [quoteView, setQuoteView] = useState(() => initialQuoteCreateMode ? 'project_understanding' : 'list'); // list, create, edit
  const [buildQuoteHandoff, setBuildQuoteHandoff] = useState(null);
  const buildQuoteHandoffResolveRef = useRef(null);
  const [invoiceView, setInvoiceView] = useState(() => initialTool === 'invoice' ? 'create' : 'list'); // list, create, edit
  const [invoiceFlowStage, setInvoiceFlowStage] = useState(() => initialTool === 'invoice' ? 'create' : 'create');
  const [invoiceFlowLocked, setInvoiceFlowLocked] = useState(() => initialTool === 'invoice');
  const [showPaymentWaitingBanner, setShowPaymentWaitingBanner] = useState(false);
  const [isParsingLead, setIsParsingLead] = useState(null); // ID of lead parsing
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [quotePreSendSessions, setQuotePreSendSessions] = useState(() => new Map());
  const [quotePreSendNotice, setQuotePreSendNotice] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfExportError, setPdfExportError] = useState(null);
  const pdfExportPendingRef = useRef(false);
  const pdfExportDocumentRef = useRef(null);

  // Quote Editor State
  const [qId, setQId] = useState('');
  const [qClientPresentation, setQClientPresentation] = useState(undefined);
  const [qApprovedSnapshotId, setQApprovedSnapshotId] = useState(null);
  const [projectCoverQuoteId, setProjectCoverQuoteId] = useState(null);
  const [qNumber, setQNumber] = useState(() => initialQuoteCreateMode ? generateRandomNumberString('QT') : '');
  const [qClientName, setQClientName] = useState('');
  const [qClientEmail, setQClientEmail] = useState('');
  const [qClientAddress, setQClientAddress] = useState('');
  const [qClientId, setQClientId] = useState(null);
  const [qPreparedForOverridePresent, setQPreparedForOverridePresent] = useState(false);
  const [qPreparedForDisplayOverride, setQPreparedForDisplayOverride] = useState('');
  const [persistedLineageByItemId, setPersistedLineageByItemId] = useState({});
  const loadAcceptedBaseline = useCallback((quoteId, signal) => fetchQuoteAcceptedBaseline({ quoteId, signal, accessToken: session?.access_token }), [session?.access_token]);
  const loadApprovedQuoteClientDocument = useCallback(async (quoteId, signal) => {
    if (!session?.access_token) throw new Error('Sign in to preview the approved Quote.');
    const response = await fetch(`/api/quotes/${encodeURIComponent(quoteId)}/approved-client-document`, {
      signal, headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) throw new Error('The approved Quote preview is unavailable.');
    const result = await response.json();
    if (result.approval_truth !== 'snapshot' || !result.data) throw new Error('The approved Quote preview is unavailable.');
    return result.data;
  }, [session?.access_token]);
  const [qItems, setQItems] = useState(() => [ensureQuoteLineItemId({ description: '', quantity: 1, unitPrice: 0 })]);
  const [qTaxRate, setQTaxRate] = useState(0);
  const [qDiscountRate, setQDiscountRate] = useState(0);
  const [qCurrency, setQCurrency] = useState('USD');
  const [qNotes, setQNotes] = useState('');
  const [qNarrativePaymentTerms, setQNarrativePaymentTerms] = useState('');
  const [qDate, setQDate] = useState('');
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
  const [pendingSemanticOperation,setPendingSemanticOperation]=useState(null);
  const [sharedModelUsage,setSharedModelUsage]=useState(null);
  useEffect(()=>{if(!session?.access_token)return;let alive=true;fetchIntelligenceUsage({accessToken:session.access_token}).then(value=>{if(alive){setSharedModelUsage(value);if(value.active_operation?.kind==='semantic_review')setPendingSemanticOperation(value.active_operation);}}).catch(()=>{});return()=>{alive=false};},[session?.access_token]);
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
  const [invClientSearch, setInvClientSearch] = useState('');
  const invoiceWorkspaceRef = useRef(null);
  useInvoiceFloatingActions(invoiceWorkspaceRef, authChecked && !isLoading && activeTab === 'invoices' && (invoiceView === 'create' || invoiceView === 'edit'));
  const [invoiceHydratedRow, setInvoiceHydratedRow] = useState(null);
  const invoiceEvidenceRef = useRef(null);
  const invoiceUnknownPersistenceRef = useRef(false);
  const [invoiceNotificationState, setInvoiceNotificationState] = useState(null);
  const [isCheckingInvoiceStatus, setIsCheckingInvoiceStatus] = useState(false);
  const invoiceSavePendingRef = useRef(false);
  const invoiceBaselineRef = useRef(null);
  const [invoiceEditorGeneration, setInvoiceEditorGeneration] = useState(0);
  const invoiceEditStateRef = useRef(null);
  const invoiceNavigationRef = useRef(null);
  const invoiceNavigationBypassRef = useRef(false);
  const [showInvoiceLeaveDialog, setShowInvoiceLeaveDialog] = useState(false);
  const invoiceLeaveDialogRef = useRef(null);
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
  const [invDate, setInvDate] = useState('');
  const [invDueDate, setInvDueDate] = useState('');
  const [invPaymentTerms, setInvPaymentTerms] = useState('Net 30');
  const [invStatus, setInvStatus] = useState('pending');
  const [invPaymentLink, setInvPaymentLink] = useState('');
  const [invQuoteId, setInvQuoteId] = useState(null);
  const [invBillingType, setInvBillingType] = useState('standard');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [recordPaymentInvoice, setRecordPaymentInvoice] = useState(null);
  const [recordPaymentAmount, setRecordPaymentAmount] = useState('');
  const [recordPaymentError, setRecordPaymentError] = useState('');

  const getSelectedInvoice = () => invId ? invoiceEditorViewRecord(invId, invoiceHydratedRow, invoices) : null;
  const captureInvoiceHydration = invoice => {
    invoiceSavePendingRef.current = false;
    setIsSaving(false);
    setIsCheckingInvoiceStatus(false);
    invoiceEditStateRef.current = null;
    invoiceEvidenceRef.current = captureInvoiceEvidence(invoice, session?.user?.id || null);
    invoiceUnknownPersistenceRef.current = false;
    setInvoiceHydratedRow(invoice || null);
    setInvoiceNotificationState(null);
    setFormError(''); setFormSuccess('');
  };
  const invoiceCommercialReadonly = Boolean(invId && (isDemo || previewMode ? hasRecordedInvoicePayment(getSelectedInvoice())
    : !invoiceHydratedRow || invoiceHydratedRow.issuance_provenance !== 'created_under_contract' || invoiceHydratedRow.issued_at
      || invoiceHydratedRow.approval_snapshot_id || invoiceNotificationState?.eligibility?.can_save === false));
  const invoiceRetryAvailable = canRetryInvoiceNotification(invoiceNotificationState?.notification, invoiceNotificationState?.eligibility);
  const invoiceNotificationText = invoiceNotificationMessage(invoiceNotificationState?.notification, invoiceNotificationState?.eligibility);
  const isSelectedInvoiceSettled = Boolean(invId && (hasRecordedInvoicePayment(getSelectedInvoice()) || hasRecordedInvoicePayment(invoices.find(invoice => invoice.id === invId))));
  const selectedInvoicePayment = resolveInvoicePaymentReadModel(getSelectedInvoice() || { status: invStatus }, new Date(), { timeZone: user?.business_timezone });
  const selectedInvoicePaymentStatus = selectedInvoicePayment.payment_status;
  // Only an untouched optional row is omitted from both review and persistence.
  const invoiceEditorItems = invItems.filter(item => !(!String(item.description || '').trim()
    && Number(item.quantity) === 1 && Number(item.unitPrice) === 0
    && !item.secondaryQuantity && !item.billingUnit && !item.secondaryUnit));
  const invoiceClientDocument = resolveInvoiceClientDocument({
    invoice: getSelectedInvoice(),
    editor: { id: invId, number: invNumber, status: invId ? invStatus : 'draft', quoteId: invQuoteId,
      clientName: invClientName, clientEmail: invClientEmail, clientAddress: invClientAddress,
      currency: invCurrency, date: invDate, dueDate: invDueDate, items: invoiceEditorItems,
      discountRate: invDiscountRate, taxRate: invTaxRate, paymentTerms: invPaymentTerms,
      notes: invNotes, paymentLink: invPaymentLink },
    issuer: { name: user.name, email: user.email }, timeZone: user?.business_timezone,
  });


  const invoiceValidationMessage = invoiceClientDocument.integrity.ok ? '' : ({
    INVALID_INVOICE_ITEMS: 'Every invoice item needs a description, a positive quantity, and a non-negative rate.',
    INVALID_INVOICE_RATES: 'Discount and tax must be between 0 and 100%.',
    INCOMPLETE_INVOICE_IDENTITY: 'Enter a client name, invoice number, currency, and valid invoice and due dates.',
    INCONSISTENT_INVOICE_SETTLEMENT: 'The saved payment balance does not match this invoice. Refresh and review it before saving or sending.',
    INVOICE_UNAVAILABLE: 'This invoice is unavailable. Reopen it before continuing.',
  }[invoiceClientDocument.integrity.code] || 'The invoice amounts are invalid. Review the items, discount, tax, and payment balance.');
  const [qPendingEditorDrafts, setQPendingEditorDrafts] = useState({});
  const [quoteSaveUnknown, setQuoteSaveUnknown] = useState(false);
  const [quoteEditorGeneration, setQuoteEditorGeneration] = useState(0);
  const quoteDraftSnapshot = useMemo(() => ({ qId, qClientPresentation, qApprovedSnapshotId,
    qNumber, qClientId, qClientName, qClientEmail, qClientAddress, qPreparedForOverridePresent,
    qPreparedForDisplayOverride, qItems, persistedLineageByItemId, qTaxRate, qDiscountRate,
    qCurrency, qNotes, qNarrativePaymentTerms, qDate, qStatus, qPhotographyScope, qQuoteProvenance, quoteSaveUnknown, qPendingEditorDrafts,
  }), [qId, qClientPresentation, qApprovedSnapshotId, qNumber, qClientId, qClientName, qClientEmail,
    qClientAddress, qPreparedForOverridePresent, qPreparedForDisplayOverride, qItems,
    persistedLineageByItemId, qTaxRate, qDiscountRate, qCurrency, qNotes, qNarrativePaymentTerms,
    qDate, qStatus, qPhotographyScope, qQuoteProvenance, quoteSaveUnknown, qPendingEditorDrafts]);
  const quoteContinuity = useQuoteDraftContinuity({ actor: session?.user?.id || null,
    generation: quoteEditorGeneration, active: activeTab === 'quotes' && ['edit', 'create'].includes(quoteView),
    snapshot: quoteDraftSnapshot, fingerprint: buildQuoteDraftFingerprint(quoteDraftSnapshot) });
  const registerQuotePendingDraft = useCallback((kind, value) => {
    const ticket = quoteContinuity.guard.capture();
    if (ticket.generation !== quoteEditorGeneration || ticket.actor !== (session?.user?.id || null)
      || (sessionRef.current?.user?.id || null) !== ticket.actor) return;
    setQPendingEditorDrafts(current => {
      const next = { ...current };
      if (value) next[kind] = value; else delete next[kind];
      return JSON.stringify(current) === JSON.stringify(next) ? current : next;
    });
  }, [quoteContinuity.guard, quoteEditorGeneration, session?.user?.id]);
  const requestQuoteNavigation = quoteContinuity.requestNavigation;
  const suspendQuoteDraft = quoteContinuity.suspend;
  useEffect(() => {
    const unload = event => {
      if (!quoteContinuity.guard.dirty && !quoteContinuity.guard.busy) return;
      event.preventDefault(); event.returnValue = '';
    };
    const link = event => {
      const anchor = event.target.closest?.('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download') || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.href === window.location.href || !['http:', 'https:'].includes(url.protocol)) return;
      if (!requestQuoteNavigation(() => { window.location.href = url.href; })) { event.preventDefault(); event.stopPropagation(); }
    };
    window.addEventListener('beforeunload', unload);
    document.addEventListener('click', link, true);
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', link, true); };
  }, [quoteContinuity.guard, requestQuoteNavigation]);

  const invoiceEditSignature = JSON.stringify([invClientId, invNumber, invClientName, invClientEmail,
    invClientAddress, invCurrency.toUpperCase(), invoiceEditorItems, invDiscountRate, invTaxRate,
    invNotes, invDate, invDueDate, invPaymentTerms, invPaymentLink, invQuoteId, invBillingType]);
  const invoiceEditorKey = activeTab === 'invoices' && invoiceView !== 'list'
    ? `${session?.user?.id || 'guest'}:${invId || 'new'}:${invoiceEditorGeneration}` : null;
  useEffect(() => {
    if (invoiceEditorKey && invoiceBaselineRef.current?.key !== invoiceEditorKey) {
      invoiceBaselineRef.current = { key: invoiceEditorKey, signature: invoiceEditSignature };
    }
    if (!invoiceEditorKey) invoiceBaselineRef.current = null;
    invoiceEditStateRef.current = { key: invoiceEditorKey, signature: invoiceEditSignature,
      dirty: Boolean(invoiceEditorKey && (invoiceUnknownPersistenceRef.current || invoiceBaselineRef.current?.signature !== invoiceEditSignature)),
      actor: session?.user?.id || null, generation: invoiceEditorGeneration };
  }, [invoiceEditorKey, invoiceEditSignature, session?.user?.id, invoiceEditorGeneration]);
  const requestInvoiceNavigation = useCallback((action) => {
    if (invoiceNavigationBypassRef.current) return true;
    if (invoiceSavePendingRef.current) return false;
    const current = invoiceEditStateRef.current;
    if (!current?.dirty) return true;
    invoiceNavigationRef.current = { action, key: current.key, actor: current.actor, generation: current.generation };
    setShowInvoiceLeaveDialog(true);
    return false;
  }, []);
  const handleCheckInvoiceStatus = useCallback(async () => {
    const current = invoiceEditStateRef.current;
    if (isDemo || previewMode || !invId || !current?.key || invoiceSavePendingRef.current) return false;
    const actor = session?.user?.id || null;
    const isSameEditor = () => (sessionRef.current?.user?.id || null) === actor && invoiceEditStateRef.current?.key === current.key;
    const isCurrent = () => isSameEditor() && invoiceEditStateRef.current?.signature === current.signature;
    setIsCheckingInvoiceStatus(true);
    try {
      const result = await readInvoiceStatus(invId, session?.access_token, isCurrent);
      if (!isCurrent()) return false;
      if (!result.success) { setFormError(result.error || 'The saved invoice status could not be verified.'); return false; }
      setInvoiceNotificationState(result);
      if (!invoiceEvidenceMatches(result.data, invoiceEvidenceRef.current)) {
        setFormError('The saved invoice changed after this editor opened. Reopen it before saving or sending. Your current input is unchanged.');
      }
      return true;
    } finally { if (isSameEditor()) setIsCheckingInvoiceStatus(false); }
  }, [invId, isDemo, previewMode, readInvoiceStatus, session?.access_token, session?.user?.id]);
  useEffect(() => {
    if (invoiceEditorKey && invId && !isDemo && !previewMode) void handleCheckInvoiceStatus();
    // Read on explicit opening only; edits and token refresh never submit or rehydrate a document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceEditorKey]);
  useEffect(() => {
    const guard = event => {
      if (!invoiceEditStateRef.current?.dirty && !invoiceSavePendingRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    // Keep ordinary links outside the Invoice toolbar from bypassing the guard.
    const guardLink = event => {
      const link = event.target.closest?.('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download') || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const url = new URL(link.href, window.location.href);
      if (url.href === window.location.href || url.protocol === 'mailto:' || url.protocol === 'tel:') return;
      if (invoiceSavePendingRef.current || invoiceEditStateRef.current?.dirty) {
        event.preventDefault(); event.stopPropagation();
        requestInvoiceNavigation(() => { window.location.href = url.href; });
      }
    };
    document.addEventListener('click', guardLink, true);
    return () => { window.removeEventListener('beforeunload', guard); document.removeEventListener('click', guardLink, true); };
  }, [requestInvoiceNavigation]);
  useEffect(() => {
    if (!showInvoiceLeaveDialog) return;
    const previous = document.activeElement;
    const dialog = invoiceLeaveDialogRef.current;
    dialog?.querySelector('[data-invoice-continue]')?.focus();
    const keyboard = event => {
      if (event.key === 'Escape') { setShowInvoiceLeaveDialog(false); invoiceNavigationRef.current = null; }
      if (event.key !== 'Tab') return;
      const buttons = Array.from(dialog?.querySelectorAll('button:not(:disabled)') || []);
      if (!buttons.length) { event.preventDefault(); dialog?.focus(); return; }
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && (document.activeElement === first || !buttons.includes(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !buttons.includes(document.activeElement))) { event.preventDefault(); first?.focus(); }
    };
    dialog?.addEventListener('keydown', keyboard);
    return () => { dialog?.removeEventListener('keydown', keyboard); previous?.isConnected && previous.focus?.(); };
  }, [showInvoiceLeaveDialog]);


  // Focus the current Invoice stage or its validation feedback after navigation.
  useEffect(() => {
    if (activeTab !== 'invoices' || invoiceView === 'list') return;
    if (showInvoiceLeaveDialog) {
      invoiceLeaveDialogRef.current?.querySelector('[role="alert"]')?.focus();
      return;
    }
    const target = invoiceWorkspaceRef.current?.querySelector(formError ? '[role="alert"]' : '[data-invoice-stage-heading]');
    target?.focus();
  }, [activeTab, invoiceView, invoiceFlowStage, formError, showInvoiceLeaveDialog]);

  // Client editor state



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

  // Account business-day reference; stored date-only values never change zone.
  const referenceInstant = new Date();
  const paymentOptions = { timeZone: user?.business_timezone };
  const invoicePayment = (invoice) => resolveInvoicePaymentReadModel(invoice, referenceInstant, paymentOptions);
  const getTodayString = () => getBusinessReferenceDate(new Date(), user?.business_timezone);
  const getFutureDateString = (days, baseDate = getTodayString()) => addCalendarDays(baseDate, days);

  // Wait for the owned profile before initializing route-entry defaults.
  useEffect(() => {
    if (!authChecked || (!user?.id && !previewMode)) return;
    const today = getBusinessReferenceDate(new Date(), user?.business_timezone);
    if (initialQuoteCreateMode && !qDate) setQDate(today);
    if (initialTool === 'invoice' && !invDate) {
      invoiceBaselineRef.current = null;
      setInvDate(today);
      setInvDueDate(addCalendarDays(today, 30));
    }
  }, [authChecked, user?.id, user?.business_timezone]);

  const updateDueDateFromTerms = (terms, dateStr) => {
    const baseDate = normalizeDateOnly(dateStr);
    const days = { 'Due on Receipt': 0, 'Net 7': 7, 'Net 14': 14, 'Net 15': 15, 'Net 30': 30, 'Net 60': 60 }[terms];
    if (baseDate && days !== undefined) setInvDueDate(addCalendarDays(baseDate, days));
  };

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
    invoiceNavigationRef.current = null;
    invoiceEvidenceRef.current = null;
    invoiceUnknownPersistenceRef.current = false;
    setInvoiceHydratedRow(null);
    setInvoiceNotificationState(null);
    invoiceBaselineRef.current = null;
    setShowInvoiceLeaveDialog(false);
    invoiceSavePendingRef.current = false;
    setIsSaving(false);
    setQPendingEditorDrafts({});
    setQuoteView('list');
    setInvoiceView('list');
    setInvoiceFlowStage('create');
    setInvoiceFlowLocked(false);
    setQId('');
    setQClientPresentation(undefined);
    setQApprovedSnapshotId(null);
    setPersistedLineageByItemId({});
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
  }, [setQuoteView, setInvoiceView, setInvoiceFlowStage, setInvoiceFlowLocked, setQId, setQClientId, setQPhotographyScope, setQQuoteProvenance, setSelectedQuotePresetId, setQuotePresetSelectionTouched, setUsageRightsExpanded, setSemanticReviewState, setInvId, setInvClientId, setInvQuoteId]);

  const getDashboardTabs = useCallback((state) => {
    return [
      { id: 'overview', label: 'Overview' },
      { id: 'quotes', label: 'Quotes' },
      { id: 'invoices', label: 'Invoices' },
      { id: 'clients', label: 'Clients' },
      { id: 'profile', label: 'Public Profile', sectionBefore: true }
    ];
  }, []);

  const handleDashboardTabChange = useCallback(function changeDashboardTab(tab, source = 'dashboard') {
    if (tab !== activeTab && !clientWorkspace.controller.canLeave(false)) {
      if (clientWorkspace.controller.getSnapshot().saving || !window.confirm('Discard unsaved client changes?')) return false;
      clientWorkspace.controller.cancel(true);
    }
    if (tab !== activeTab && activeTab === 'quotes') {
      if (!requestQuoteNavigation(() => changeDashboardTab(tab, source === 'history' ? 'quote_leave_history' : source))) return false;
      setQPendingEditorDrafts({});
      setQuoteView('list');
    }
    if (tab !== activeTab && activeTab === 'invoices') {
      if (!requestInvoiceNavigation(() => changeDashboardTab(tab, source === 'history' ? 'invoice_leave_history' : source))) return false;
      setInvoiceView('list');
      setInvoiceFlowLocked(false);
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
    if (source !== 'history' && !previewMode && pathname === '/dashboard' && typeof window !== 'undefined') {
      const nextRoute = getDashboardRouteForTab(resolvedTab);
      const currentRoute = `${window.location.pathname}${window.location.search}`;
      if (currentRoute !== nextRoute) router.push(nextRoute);
    }
    setFormError('');
    setFormSuccess('');
    return true;
  }, [activeTab, pathname, previewMode, router, clientWorkspace.controller, requestInvoiceNavigation, requestQuoteNavigation]);

  useEffect(() => {
    if (previewMode) return;
    const syncDashboardTabFromLocation = event => {
      if (quoteContinuity.guard.dirty || quoteContinuity.guard.busy) {
        const destination = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (!requestQuoteNavigation(() => { setQuoteView('list'); router.push(destination); })) {
          event.stopImmediatePropagation();
          router.replace(getDashboardRouteForTab(activeTab));
          return;
        }
      }
      const nextTab = getDashboardTabForTool(new URLSearchParams(window.location.search).get('tool'));
      if (nextTab !== activeTab && handleDashboardTabChange(nextTab, 'history') === false) {
        router.replace(getDashboardRouteForTab(activeTab));
      }
    };
    window.addEventListener('popstate', syncDashboardTabFromLocation, true);
    return () => window.removeEventListener('popstate', syncDashboardTabFromLocation, true);
  }, [activeTab, handleDashboardTabChange, previewMode, router, quoteContinuity.guard, requestQuoteNavigation]);

  const harborFocusedContext = getHarborFocusedContext({
    activeTab, quoteView, invoiceView, clientMode: clientWorkspace.state.mode, profileFocused,
    quoteAvailable: (!session || entitlements.invoice || canAccessFirstRevenueQuotes)
      && (Boolean(session) || ['create', 'project_understanding'].includes(quoteView)),
    invoiceAvailable: (!session || entitlements.invoice || canAccessFirstRevenueInvoices)
      && (Boolean(session) || invoiceView === 'create'),
    clientAvailable: Boolean(session) || isSandboxMode,
  });

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
    if (!requestQuoteNavigation(handleSignOut)) return false;
    if (!requestInvoiceNavigation(handleSignOut)) return false;
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
      if (isAccountSwitch || authEventAction === 'clear') suspendQuoteDraft();
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
  }, [clearDashboardData, fetchData, invalidateDashboardData, pathname, previewMode, redirectToAuth, resetAccountScopedState, router, supabaseClient, trackDashboardViewOnce, restoreUserIntent, triggerToast, suspendQuoteDraft]);

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
    setQClientPresentation(undefined);
    setQApprovedSnapshotId(null);
    setPersistedLineageByItemId({});
    setQClientId(null);
    setQNumber(generateRandomNumberString('QT'));
    setQClientName('');
    setQClientEmail('');
    setQClientAddress('');
    setQPreparedForOverridePresent(false);
    setQPreparedForDisplayOverride('');
    setQItems([ensureQuoteLineItemId({ description: '', quantity: 1, unitPrice: 0 })]);
    setQTaxRate(0);
    setQDiscountRate(0);
    setQCurrency('USD');
    setQNotes('');
    setQNarrativePaymentTerms('');
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
    captureInvoiceHydration(null);
    setInvoiceEditorGeneration(value => value + 1);
    setInvId('');
    setInvClientId(null);
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
    if (!requestInvoiceNavigation(handleRestorePendingInvoiceDraft)) return false;
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
    setInvDueDate(pendingInvoiceDraft.due_date || getFutureDateString(30, normalizeDateOnly(pendingInvoiceDraft.invoice_date) || getTodayString()));
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
  const quoteGenerationRequestRef = useRef(0);
  const handleAiQuoteGeneration = async (lead) => {
    if (!requestQuoteNavigation(() => handleAiQuoteGeneration(lead))) return false;
    const operation = ++quoteGenerationRequestRef.current;
    const ticket = quoteContinuity.guard.capture();
    const actor = session?.user?.id || null;
    const isCurrent = () => quoteGenerationRequestRef.current === operation && quoteContinuity.guard.isSameSession(ticket)
      && (sessionRef.current?.user?.id || null) === actor;
    trackEvent('create_quote_click', { source: 'ai_generator' });
    evaluateAction('create_quote', async () => {
      if (!isCurrent()) return false;
      if (!session) {
        setIsParsingLead(lead.id);
        setTimeout(() => {
          if (!isCurrent()) return;
          setIsParsingLead(null);
          setQPendingEditorDrafts({});
          setQuoteSaveUnknown(false);
          setQuoteEditorGeneration(value => value + 1);
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
            ensureQuoteLineItemId({ description: 'Phase 1: Brand Strategy & Mockups', quantity: 1, unitPrice: 0 }),
            ensureQuoteLineItemId({ description: 'Phase 2: Custom Core Frontend Engineering', quantity: 1, unitPrice: 0 }),
            ensureQuoteLineItemId({ description: 'Phase 3: Integration & Launch Clearance', quantity: 1, unitPrice: 0 })
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

        if (!isCurrent()) return false;
        if (res.ok) {
          const { parsed_data } = await res.json();
          if (!isCurrent()) return false;
          if (parsed_data) {
            setIsParsingLead(null);
            // Pre-populate Quote Editor states
            setQPendingEditorDrafts({});
          setQuoteSaveUnknown(false);
          setQuoteEditorGeneration(value => value + 1);
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
              setQItems(parsed_data.items.map(i => ensureQuoteLineItemId({
                description: i.description,
                quantity: i.quantity || 1,
                unitPrice: 0
              })));
            } else {
              setQItems([ensureQuoteLineItemId({ description: `Consulting: ${lead.message.substring(0, 30)}...`, quantity: 1, unitPrice: 0 })]);
            }

            // Move to quote tab and open editor
            handleDashboardTabChange('quotes', 'lead_ai_quote');
            setQuoteView('create');

            // Update Lead Status to 'quote_generated'
            await saveLead({ id: lead.id, status: 'quote_generated' }, session?.access_token);
            if (!isCurrent()) return false;
            triggerToast('AI successfully parsed visitor inquiry into a Quote draft!', 'success');
          }
        } else {
          triggerToast('Failed to generate Quote using AI. You can write the Quote manually.', 'error');
        }
      } catch (error) {
        if (!isCurrent()) return false;
        console.error(error);
        triggerToast('Error during AI Quote parsing.', 'error');
      } finally {
        if (isCurrent()) setIsParsingLead(null);
      }
    });
  };

  const openInvoiceFromQuote = (quote, { firstRevenueDraft = false } = {}) => {
    if (!requestInvoiceNavigation(() => openInvoiceFromQuote(quote, { firstRevenueDraft }))) return false;
    captureInvoiceHydration(null);
    setInvoiceEditorGeneration(value => value + 1);
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
      unitPrice: item.unitPrice || (item.unit_price || 0) / 100,
      ...(item.billingUnit ? { billingUnit: item.billingUnit } : {}),
      ...(item.secondaryQuantity ? { secondaryQuantity: item.secondaryQuantity, secondaryUnit: item.secondaryUnit } : {}),
    })));
    setInvTaxRate(Number(quote.tax_rate || 0));
    setInvDiscountRate(Number(quote.discount_rate || 0));

    trackEvent('quote_convert_to_invoice', { quote_id: quote.id });
    handleDashboardTabChange('invoices', 'quote_conversion');
    setInvoiceView('create');
    triggerToast('Quote loaded into Invoice builder. Add invoice terms and click save.', 'success');
  };

  const openInvoiceDraft = (invoice, quote, created = true) => {
    if (!requestInvoiceNavigation(() => openInvoiceDraft(invoice, quote, created))) return false;
    setInvoiceEditorGeneration(value => value + 1);
    captureInvoiceHydration(invoice);
    const parsedItems = Array.isArray(invoice.items) ? invoice.items : [];
    const deserialized = deserializeInvoiceNotes(invoice.notes || '');
    setInvId(invoice.id);
    setInvClientId(invoice.client_id || null);
    setInvNumber(invoice.invoice_number || generateRandomNumberString('INV'));
    setInvClientName(invoice.client_name || '');
    setInvClientEmail(invoice.client_email || '');
    setInvClientAddress(invoice.client_address || '');
    setInvCurrency(invoice.currency || 'USD');
    setInvNotes(deserialized.notes || '');
    setInvBillingType(deserialized.billing_type);
    setInvDate(invoice.invoice_date || getTodayString());
    setInvDueDate(invoice.due_date || '');
    setInvPaymentTerms(invoice.payment_terms || 'Net 30');
    setInvStatus('draft');
    setInvQuoteId(quote.id);
    setInvPaymentLink(invoice.payment_link || '');
    setInvoiceFlowStage('create');
    setInvoiceFlowLocked(false);
    setShowPaymentWaitingBanner(false);
    setInvItems(hydrateInvoiceItems(parsedItems));
    setInvTaxRate(Number(invoice.tax_rate ?? 0));
    setInvDiscountRate(Number(invoice.discount_rate ?? 0));
    handleDashboardTabChange('invoices', 'quote_conversion');
    setInvoiceView('create');
    triggerToast(created ? 'Invoice draft created. Review the saved document before sending.' : 'Existing Invoice draft opened. Review it before sending.', 'success');
  };

  const handleConvertQuoteToInvoice = async (quote) => {
    const initiatingUserId = session?.user?.id || null;
    const isCurrentActor = () => (sessionRef.current?.user?.id || null) === initiatingUserId;
    if (!isCurrentActor()) return false;
    trackEvent('create_invoice_click', { source: 'quote_convert' });
    if (quote.status !== 'approved') return;
    if (quote.has_linked_invoice !== false) {
      triggerToast('Invoice conversion eligibility is unavailable. Refresh and review this Quote.', 'info');
      return false;
    }
    try {
      const response = await fetch(`/api/quotes/${quote.id}/invoice-draft`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const result = await response.json().catch(() => ({}));
      if (!isCurrentActor()) return false;
      if (!response.ok) throw new Error(result.error || 'Unable to create Invoice draft');
      await fetchData(session?.access_token).catch(() => null);
      if (!isCurrentActor()) return false;
      setInvoices(current => [...current.filter(invoice => invoice.id !== result.invoice.id), result.invoice]);
      if (result.created === false) {
        openDocument({ documentType: 'invoice', id: result.invoice.id, invoiceSnapshot: result.invoice });
        triggerToast('Existing Invoice opened.', 'success');
      } else {
        openInvoiceDraft(result.invoice, quote, true);
      }
    } catch (error) {
      if (!isCurrentActor()) return false;
      triggerToast(error.message || 'Unable to create Invoice draft.', 'error');
    }
  };

  const dismissQuotePreSendFinding = () => {
    if (!quotePreSendNotice) return;
    const { quoteId, finding, scope: savedScope } = quotePreSendNotice;
    const current = quotePreSendSessions.get(quoteId);
    if (!current) return;
    const next = dismissQuoteEditorFinding(current, finding);
    setQuotePreSendSessions(current => new Map(current).set(quoteId, next));
    const remaining = getQuoteEditorFinding(next, savedScope);
    setQuotePreSendNotice(remaining ? { quoteId, finding: remaining, scope: savedScope } : null);
  };

  const handleSendQuote = async (quoteOverride = null, editorReview = null) => {
    // Delivery and revalidation use the same current saved row, never an override's draft scope.
    const quoteId = quoteOverride?.id || qId;
    const quote = quoteId ? quotes.find((item) => item.id === quoteId) : null;
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

    let preSend;
    let savedScope;
    try {
      savedScope = deserializeInvoiceNotes(quote.notes || '').metadata?.photography_scope_v2;
      const current = editorReview?.coherenceSession
        || quotePreSendSessions.get(quote.id)
        || createQuoteEditorCoherenceSession();
      preSend = reviewQuotePreSend(current, savedScope);
    } catch {
      // Auxiliary pure review failure preserves existing delivery authority; no new judgment.
      console.warn('H01.7 local pre-send evaluation unavailable; existing send checks retained.');
    }
    if (preSend) {
      if (editorReview?.onCoherenceReview) editorReview.onCoherenceReview(preSend.session);
      else setQuotePreSendSessions(current => new Map(current).set(quote.id, preSend.session));
      const finding = getQuoteEditorFinding(preSend.session, savedScope);
      setQuotePreSendNotice(!editorReview && finding ? { quoteId: quote.id, finding, scope: savedScope } : null);
      if (finding) return false;
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
    if (!requestInvoiceNavigation(handlePrepareFirstRevenuePayment)) return false;
    setInvoiceEditorGeneration(value => value + 1);
    if (!firstRevenueLoop?.can_prepare_payment || !firstRevenueLoop.invoice_id) return;
    const invoice = invoices.find((item) => item.id === firstRevenueLoop.invoice_id);
    if (!invoice) {
      triggerToast('Your linked invoice is still loading. Refresh and try again.', 'error');
      return;
    }
    captureInvoiceHydration(invoice);
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
    setInvDueDate(invoice.due_date || '');
    setInvPaymentTerms(invoice.payment_terms || 'Net 30');
    setInvPaymentLink(invoice.payment_link || '');
    setInvQuoteId(invoice.quote_id || null);
    const itemsParsed = Array.isArray(invoice.items) ? invoice.items : JSON.parse(invoice.items || '[]');
    setInvItems(hydrateInvoiceItems(itemsParsed));
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
    const analysisScope = `semantic:${user?.id || 'session'}:${qId || 'draft'}:${input.inputFingerprint}`;
    try {
      const prepared=await prepareSemanticAnalysis({scope:analysisScope,accessToken:session.access_token});
      if(prepared.recoveredResult){setSemanticReviewState(prepared.recoveredResult);triggerToast('Saved review recovered. No additional model analysis was used.','success');return;}
      const {attempt,usage}=prepared;
      triggerToast(`${usage.available} model analyses remaining. This review uses 1.`, 'info');
      const response = await fetch('/api/intelligence/photography-quote-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'Idempotency-Key': attempt.key,
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
      if(result.operation)recordAnalysisAttempt({scope:analysisScope,operationId:result.operation.operation_id,status:result.operation.status});
      if (response.status === 202) { const saved=await readAnalysisOperation({operationId:result.operation?.operation_id,key:attempt.key,accessToken:session.access_token}); if(saved.status==='SUCCEEDED'&&saved.result){setSemanticReviewState(saved.result);return;} throw new Error('Analysis completion is awaiting confirmation. Check status before trying again; no automatic resend will occur.'); }
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
    setQItems([ensureQuoteLineItemId({ description: '', quantity: 1, unitPrice: 0 })]);
    setQNotes('');
    setQNarrativePaymentTerms('');
    setScopeFieldsExpanded(false);
    if (!suppressFeedback) triggerToast('Blank quote ready. Add your shoot, deposit, delivery, and usage rights details.', 'info');
  };

  // Save Quote
  const persistQuoteDraft = async (options = {}) => {
    const initiatingUserId = session?.user?.id || null;
    const isCurrentActor = () => (sessionRef.current?.user?.id || null) === initiatingUserId
      && quoteContinuity.guard.isCurrent(options.quoteTicket);
    if (!isCurrentActor()) return false;
    // Shared editor saves retain their own actions/freshness UI after persistence.
    const stayInEditor = options?.stayInEditor === true;
    const performSave = async () => {
      if (!isCurrentActor()) return false;
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
      if (qPreparedForOverridePresent) {
        nextMetadata.prepared_for_display_override_v1 = qPreparedForDisplayOverride;
      } else {
        delete nextMetadata.prepared_for_display_override_v1;
      }
      const notesWithMeta = serializeInvoiceNotes(qNotes, withNarrativePaymentTermsV1(nextMetadata, qNarrativePaymentTerms));

      const payload = {
        id: qId || undefined,
        ...(!qId && qClientPresentation !== undefined ? { client_presentation: qClientPresentation } : {}),
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
            if (isCurrentActor()) redirectToAuth('guest_quote_save');
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
        const res = await saveQuote(payload, session?.access_token, isCurrentActor);
        if (!isCurrentActor()) return false;
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
            const activationClaimed = await claimAndEmitFirstActivation({ documentType: 'quote', documentNumber: qNumber, token: session?.access_token, isDemo, isPreview: previewMode, sendEvent: (...args) => { if (isCurrentActor()) sendEvent(...args); } });
            if (!isCurrentActor()) return false;
            if (activationClaimed) {
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
                if (!isCurrentActor()) return false;
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
          if (res.data?.id) {
            setQuotes((current) => [...current.filter((record) => record.id !== res.data.id), res.data]);
            if (res.data.client_presentation !== undefined) setQClientPresentation(res.data.client_presentation);
          }
          setQQuoteProvenance(quoteProvenance);
          if (res.data?.created_at) setQDate(res.data.created_at.substring(0, 10));
          setFormSuccess(isDemo ? 'Quote saved successfully (Sandbox Mode)!' : 'Quote saved and verified.');
          triggerToast(isDemo ? 'Quote saved successfully (Sandbox Mode)!' : 'Quote saved and verified.', 'success');
          if (!qId && mode === 'live' && !stayInEditor) {
            await fetchData(session?.access_token);
            if (!isCurrentActor()) return false;
          }
          if (!stayInEditor) {
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
          if (res.persistence === 'unknown') { quoteContinuity.guard.markUnknown(options.quoteTicket, res.quoteId); setQuoteSaveUnknown(true); if (res.quoteId && !qId) setQId(res.quoteId); }
          setFormError(res.error || 'Failed to save quote. Please verify all inputs.');
          return false;
        }
      } catch (e) {
        console.error(e);
        if (!isCurrentActor()) return false;
        setFormError('Network error when saving quote.');
        return false;
      } finally {
        if (isCurrentActor()) setIsSaving(false);
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

  const handleSaveQuote = async (options = {}) => {
    if (Object.keys(qPendingEditorDrafts).length) { setFormError('Apply or cancel the open sheet edits before saving the Quote.'); return false; }
    if (quoteSaveUnknown) { setFormError('The previous save outcome is unknown. Reopen the saved Quote before saving again. Your current input remains open.'); return false; }
    const ticket = quoteContinuity.guard.beginSave();
    if (!ticket) return false;
    let success = false;
    try { success = await persistQuoteDraft({ ...options, quoteTicket: ticket }); }
    finally { success = quoteContinuity.finishSave(ticket, success); }
    if (success && options.leaveAfterSave) quoteContinuity.leaveAfterSave(ticket);
    return success;
  };

  // Capture the actor, editor and hydration proof before any asynchronous operation.
  const handleSaveInvoice = async ({ advanceToSend = false, explicitRetry = false, exitAfterSave = false, showCompletion = true } = {}) => {
    if (invoiceSavePendingRef.current) return false;
    const intendedSignature = invoiceEditSignature;
    let intendedEditorKey = invoiceEditStateRef.current?.key;
    const initiatingUserId = session?.user?.id || null;
    const evidence = invoiceEvidenceRef.current;
    const unchanged = Boolean(invId && invoiceBaselineRef.current?.key === intendedEditorKey && invoiceBaselineRef.current?.signature === intendedSignature);
    const isSameEditor = () => (sessionRef.current?.user?.id || null) === initiatingUserId && invoiceEditStateRef.current?.key === intendedEditorKey;
    const isCurrentActor = () => isSameEditor() && invoiceEditStateRef.current?.signature === intendedSignature;
    if (!isCurrentActor()) return false;
    const performSave = async () => {
      if (!isCurrentActor() || invoiceSavePendingRef.current) return false;
      if (invoiceUnknownPersistenceRef.current) {
        setFormError('The previous outcome is unknown. Check status and reopen the saved invoice before attempting another save. Your input remains open.');
        return false;
      }
      if (isSelectedInvoiceSettled) { setFormError('This Invoice has recorded payment and is read-only.'); return false; }
      setFormError(''); setFormSuccess('');
      if (!invoiceClientDocument.integrity.ok) { setFormError(invoiceValidationMessage); return false; }
      if (advanceToSend && !invClientEmail.trim()) {
        setFormError(invId ? 'This saved invoice has no recipient email. Sending is unavailable; its saved recipient cannot be changed.' : 'Add a recipient email before sending. You can still save and download this invoice.');
        return false;
      }
      if (invId && !isDemo && !previewMode && (!evidence || evidence.id !== invId || evidence.actor !== initiatingUserId)) {
        setFormError('Reopen this invoice to verify its saved content and revision.'); return false;
      }
      if (invId && invoiceCommercialReadonly && !(advanceToSend && unchanged)) {
        setFormError('This invoice is read-only. Its saved document cannot be changed.'); return false;
      }
      if (explicitRetry && (!unchanged || !invoiceRetryAvailable)) {
        setFormError('A verified retry is unavailable for this editor. Check status and reopen the saved invoice.'); return false;
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
            currency: invCurrency.toUpperCase(),
            items: invoiceEditorItems,
            discount_rate: invDiscountRate,
            tax_rate: invTaxRate,
            invoice_number: invNumber,
            payment_terms: invPaymentTerms,
            notes: notesWithMeta,
            invoice_date: invDate || getTodayString(),
            due_date: invDueDate || getFutureDateString(30, normalizeDateOnly(invDate) || getTodayString()),
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
          trackEvent('invoice_created', { invoice_number: invNumber, currency: invCurrency.toUpperCase(), sandbox: isDemo });

          saveIntendedRoute('/dashboard', 'guest_invoice_save');
          triggerToast('Invoice draft saved locally! Please sign up to save it securely to your account.', 'success');
          setTimeout(() => {
            if (isCurrentActor()) redirectToAuth('guest_invoice_save');
          }, 1500);
          return true;
        } catch (err) {
          console.error(err);
          setFormError('Failed to save draft locally.');
          return false;
        }
      }

      invoiceSavePendingRef.current = true;
      setIsSaving(true);
      const isNewInvoice = !invId;
      try {
        let res;
        if (advanceToSend && invId && unchanged) {
          // The approved first Send is a verified read/no-op before any notes or amount construction.
          res = await saveAndSendInvoice(null, session?.access_token, invId, explicitRetry, isCurrentActor, { evidence, unchanged: true, simulatedInvoice: isDemo || previewMode ? invoiceHydratedRow : null });
        } else {
          const originalNotes = invoiceHydratedRow?.notes || '';
          const originalMetadata = deserializeInvoiceNotes(originalNotes).metadata || {};
          const notesWithMeta = invId && unchanged ? originalNotes : serializeInvoiceNotes(invNotes, {
            ...originalMetadata,
            billing_type: invBillingType === 'recurring' ? 'standard' : invBillingType,
            billing_mode: 'manual',
            edit_count: isNewInvoice ? 0 : (Number(originalMetadata.edit_count) || 0) + 1,
          });
          const payload = {
            id: invId || undefined, ...(invId ? { expected_revision: evidence?.revision } : {}),
            client_id: invClientId, client_name: invClientName.trim(), client_email: invClientEmail.trim(),
            client_address: invClientAddress.trim(), currency: invCurrency.toUpperCase(), items: invoiceEditorItems,
            discount_rate: invDiscountRate, tax_rate: invTaxRate, invoice_number: invNumber, payment_terms: invPaymentTerms,
            notes: notesWithMeta, invoice_date: invDate || getTodayString(),
            due_date: invDueDate || getFutureDateString(30, normalizeDateOnly(invDate) || getTodayString()),
            doc_type: 'invoice', payment_link: invPaymentLink,
          };
          res = advanceToSend
            ? await saveAndSendInvoice(payload, session?.access_token, invId, false, isCurrentActor)
            : await saveInvoice(payload, session?.access_token, isCurrentActor);
        }
        if (!isCurrentActor()) return false;
        const confirmed = res.readbackVerified === true || isDemo || previewMode;
        // A later notification failure cannot erase an already verified creation.
        const confirmedDocument = confirmed ? res.data : res.savedDocument?.persistence === 'confirmed' && res.savedDocument?.readbackVerified === true ? res.savedDocument.data : null;
        if (confirmedDocument?.id) {
          const savedInvoiceId = confirmedDocument.id;
          const nextEvidence = captureInvoiceEvidence(confirmedDocument, initiatingUserId);
          if (!nextEvidence && !isDemo && !previewMode) { setFormError('Invoice save could not be verified. Your edits remain open.'); return false; }
          invoiceEvidenceRef.current = nextEvidence;
          setInvoiceHydratedRow(confirmedDocument);
          setInvoiceNotificationState({ notification: res.notification, eligibility: res.eligibility });
          intendedEditorKey = `${initiatingUserId || 'guest'}:${savedInvoiceId}:${invoiceEditorGeneration}`;
          invoiceEditStateRef.current = { ...invoiceEditStateRef.current, key: intendedEditorKey, dirty: false };
          invoiceBaselineRef.current = { key: intendedEditorKey, signature: intendedSignature };
          if (isNewInvoice) setInvId(savedInvoiceId);
          if (confirmed && res.statusPersisted) setInvStatus(confirmedDocument.status || 'sent');
          if (isNewInvoice) {
            trackEvent('invoice_created', { invoice_number: invNumber, currency: invCurrency.toUpperCase(), sandbox: isDemo });
            if (typeof window !== 'undefined') window.sessionStorage.setItem('corvioz_invoice_creation_completed', 'true');
            const activationClaimed = await claimAndEmitFirstActivation({ documentType: 'invoice', documentNumber: invNumber, token: session?.access_token, isDemo, isPreview: previewMode,
              sendEvent: (...args) => { if (isCurrentActor()) sendEvent(...args); } });
            if (!isCurrentActor()) return false;
            if (activationClaimed && typeof window !== 'undefined') {
              window.sessionStorage.setItem('corvioz_first_invoice_created', 'true');
              sendEvent('INVOICE_CREATED_INTENT', { documentType: 'invoice', invoice_number: invNumber, source: 'auth_flow' });
              sendEvent('FIRST_ACTION_TAKEN', { action: 'first_invoice_created' });
            }
          }
        }
        if (!res.success || !confirmed) {
          if (res.persistence === 'unknown' || (res.success && !confirmed)) {
            invoiceUnknownPersistenceRef.current = true;
            if (invoiceEditStateRef.current) invoiceEditStateRef.current.dirty = true;
          }
          if (advanceToSend && res.notification) setInvoiceNotificationState({ notification: res.notification, eligibility: res.eligibility });
          setFormError(res.error || 'Invoice save could not be verified. Your edits remain open.');
          return false;
        }
        const successMessage = advanceToSend
          ? (isDemo ? 'Invoice marked sent in Sandbox Mode. No email was sent.' : previewMode ? 'Invoice marked sent in Preview Mode. No email was sent.' : 'Email notification accepted; delivery is unverified.')
          : (isDemo ? 'Invoice saved in Sandbox Mode.' : previewMode ? 'Invoice saved in Preview Mode. No account data changed.' : 'Invoice saved and verified.');
        setFormSuccess(successMessage); triggerToast(successMessage, 'success');
        if (showCompletion && !advanceToSend) setSuggestedActionDoc({ type: 'invoice', simulated: isDemo || previewMode, created: isNewInvoice, number: invNumber, id: res.data.id, elementId: 'printable-invoice' });
        return true;
      } catch {
        if (!isCurrentActor()) return false;
        invoiceUnknownPersistenceRef.current = true;
        if (invoiceEditStateRef.current) invoiceEditStateRef.current.dirty = true;
        setFormError('The save or notification outcome is unknown. Your edits remain open. Check status before continuing.');
        return false;
      } finally {
        if (isSameEditor()) { invoiceSavePendingRef.current = false; setIsSaving(false); }
      }
    };
    const finishSave = async () => {
      const saved = await performSave();
      if (!saved || !isCurrentActor()) return false;
      if (advanceToSend) { setInvoiceFlowStage('send'); setShowPaymentWaitingBanner(false); setInvStatus('sent'); }
      if (exitAfterSave) {
        invoiceNavigationBypassRef.current = true;
        try { handleExitInvoiceFlow(); } finally { invoiceNavigationBypassRef.current = false; }
      }
      return true;
    };
    if (!invId) {
      if (canCreateFirstRevenueInvoiceDraft && invQuoteId === firstRevenueLoop?.quote_id) return finishSave();
      let saving;
      await evaluateAction('create_invoice', () => { if (isCurrentActor()) saving = finishSave(); });
      return saving ? await saving : false;
    }
    return finishSave();
  };

  const handleLearningPreferenceChange = async (event) => {
    const value = event.target.checked;
    setIsSavingLearningPreference(true);
    setLearningPreferenceError('');
    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ intelligence_learning_opt_in: value }),
      });
      const body = await response.json();
      if (!response.ok || typeof body.intelligence_learning_opt_in !== 'boolean') {
        throw new Error('Unable to save this preference. Try again.');
      }
      setUser((current) => current ? { ...current, intelligence_learning_opt_in: body.intelligence_learning_opt_in } : current);
    } catch {
      setLearningPreferenceError('Could not save your preference. Your last saved choice is still shown.');
    } finally {
      setIsSavingLearningPreference(false);
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
    const actor = session?.user?.id || null;
    const editorKey = invoiceEditStateRef.current?.key;
    const signature = invoiceEditStateRef.current?.signature;
    const isCurrent = () => (sessionRef.current?.user?.id || null) === actor && invoiceEditStateRef.current?.key === editorKey && invoiceEditStateRef.current?.signature === signature;
    const revision = id === invId ? invoiceEvidenceRef.current?.revision : invoices.find(invoice => invoice.id === id)?.document_revision;
    try {
      const res = await deleteInvoice(id, session?.access_token, revision, isCurrent);
      if (!isCurrent()) return;
      triggerToast(res.success ? (isDemo ? 'Invoice deleted (Sandbox Mode).' : 'Invoice deleted successfully.') : res.error || 'Failed to delete invoice.', res.success ? 'info' : 'error');
    } catch { if (isCurrent()) triggerToast('The deletion outcome is unknown. Refresh and review the saved invoice.', 'error'); }
  };

  // Keep deferred commercial callbacks tied to the document currently on screen.
  useEffect(() => {
    pdfExportDocumentRef.current = {
      quote: { id: qId, number: qNumber, status: qStatus, approvedSnapshotId: qApprovedSnapshotId },
      invoice: invoiceClientDocument.identity || { id: invId, number: invNumber, status: invStatus },
    };
  }, [qId, qNumber, qStatus, qApprovedSnapshotId, invId, invNumber, invStatus, invoiceClientDocument.identity]);

  const handleExportAttempt = async (elementId, name, resourceId = null) => {
    if (pdfExportPendingRef.current) return false;
    const documentType = elementId === 'printable-quote' ? 'quote' : elementId === 'printable-invoice' ? 'invoice' : null;
    if (documentType === 'invoice' && resourceId === '') resourceId = null;
    const fail = (message) => {
      setPdfExportError({ elementId, name, message });
      triggerToast(message, 'error');
      return false;
    };
    const documentAvailable = () => {
      const current = pdfExportDocumentRef.current?.[documentType];
      if (!current || !current.number || name !== `${documentType}_${current.number}`
        || (resourceId !== null && resourceId !== current.id)) {
        return fail('This document is unavailable. Open it again and try downloading.');
      }
      const target = document.getElementById(elementId);
      if (!target || target.querySelector('.quote-client-document-error, .invoice-client-document-error')) {
        return fail('This document is unavailable. Open it again and try downloading.');
      }
      return true;
    };
    let sealedInvoice = null;
    const invoiceSourceMatches = identity => {
      const current = pdfExportDocumentRef.current?.invoice;
      const target = document.getElementById('printable-invoice');
      return Boolean(current && target && ['id','number','status','quoteId','approvalSnapshotId','paymentFingerprint'].every(key => (current[key] || null) === (identity[key] || null))
        && target.getAttribute('data-invoice-id') === (identity.id || '')
        && target.getAttribute('data-invoice-number') === identity.number
        && target.getAttribute('data-invoice-status') === identity.status
        && target.getAttribute('data-approval-snapshot-id') === (identity.approvalSnapshotId || '')
        && target.getAttribute('data-payment-fingerprint') === (identity.paymentFingerprint || ''));
    };
    let sealedQuote = null;
    const quoteSourceMatches = (identity) => {
      const current = pdfExportDocumentRef.current?.quote;
      // Edits and preference changes retain the sealed document. A different
      // Quote or approval state cannot inherit a pending export or retry.
      const target = document.getElementById(elementId);
      return Boolean(current && target && current.id === identity.id && current.number === identity.number
        && current.status === identity.status && current.approvedSnapshotId === identity.approvedSnapshotId
        && target.getAttribute('data-quote-id') === (identity.id || '')
        && target.getAttribute('data-quote-status') === identity.status
        && target.getAttribute('data-approved-snapshot-id') === (['approved', 'converted'].includes(identity.status) ? identity.approvedSnapshotId || '' : ''));
    };
    if (!documentAvailable()) return false;
    if (!previewMode && !canExportPdf) return fail('PDF export permission is unavailable. Check your account access and try again.');

    if (documentType === 'quote') {
      try { sealedQuote = captureQuotePdfDocument(elementId, pdfExportDocumentRef.current.quote); }
      catch (error) { return fail(error.message); }
    }

    if (documentType === 'invoice') {
      try { sealedInvoice = captureInvoicePdfDocument(elementId, pdfExportDocumentRef.current.invoice); }
      catch (error) { return fail(error.message); }
    }

    pdfExportPendingRef.current = true;
    setIsDownloadingPdf(true);
    setPdfExportError(null);
    let downloadTask = null;
    let observedExportCount = null;
    let evaluationFinished = false;
    let started = false;
    const download = () => {
      if (started) return downloadTask;
      if (evaluationFinished && pdfExportPendingRef.current) return false;
      if (sealedInvoice ? !invoiceSourceMatches(sealedInvoice.identity) : sealedQuote ? !quoteSourceMatches(sealedQuote.identity) : !documentAvailable()) {
        return fail('This document changed. Open it again and try downloading.');
      }
      started = true;
      pdfExportPendingRef.current = true;
      setIsDownloadingPdf(true);
      setPdfExportError(null);
      downloadTask = triggerActualPdfDownload(elementId, name, hasCleanPdf, resourceId, observedExportCount, sealedQuote ? { document: sealedQuote, validateSource: quoteSourceMatches } : sealedInvoice ? { document: sealedInvoice, validateSource: invoiceSourceMatches } : null).finally(() => {
        pdfExportPendingRef.current = false;
        setIsDownloadingPdf(false);
      });
      return downloadTask;
    };
    try {
      if (previewMode) return await download();
      const currentCount = isDevelopment
        ? Number(window.localStorage.getItem('corvioz_export_count') || 0)
        : exportCount;
      const newCount = currentCount + 1;
      observedExportCount = newCount;
      if (isDevelopment) window.localStorage.setItem('corvioz_export_count', String(newCount));
      setExportCount(newCount);
      // Observe the actual attempt without inventing intent or claiming delivery.
      await evaluateAction('export_pdf', download, {
        document_type: documentType,
        export_count: newCount,
        source: 'document_download',
      });
      evaluationFinished = true;
      if (downloadTask) return await downloadTask;
      return fail('Download has not started. Check the account access message and try again.');
    } catch {
      return fail('PDF download could not start. Try again.');
    } finally {
      evaluationFinished = true;
      if (!downloadTask) {
        pdfExportPendingRef.current = false;
        setIsDownloadingPdf(false);
      }
    }
  };

  const triggerActualPdfDownload = async (elementId, name, watermarkFree, resourceId = null, observedExportCount = null, quoteRequest = null) => {
    try {
      const { generatePDF } = await import('@/app/lib/pdf');
      const fileName = quoteRequest && elementId === 'printable-invoice' ? `invoice_${quoteRequest.document.documentNumber}.pdf` : quoteRequest ? `quote_${quoteRequest.document.documentNumber}.pdf` : `${name}.pdf`;
      await generatePDF(elementId, fileName, watermarkFree, quoteRequest);
      if (!previewMode) sendEvent('FIRST_ACTION_TAKEN', {
        action: 'export_pdf', documentType: elementId === 'printable-quote' ? 'quote' : 'invoice', export_count: observedExportCount, source: 'document_download',
      });
      triggerToast(`${elementId === 'printable-quote' ? 'Quote' : 'Invoice'} PDF download started.`, 'success');
      return true;
    } catch (err) {
      const message = err?.status === 401 ? 'Sign in again, then retry the PDF download.'
        : err?.status === 403 ? 'PDF export permission was denied. Check your account access before retrying.'
        : err?.status === 404 ? 'This document is unavailable. Open it again and try downloading.'
        : elementId === 'printable-invoice' && err?.status === 409 && quoteRequest?.document?.identity?.id ? 'This Invoice changed or has unsaved edits. Save any pending edits, reopen Preview and retry.'
        : elementId === 'printable-invoice' && err?.status === 409 ? 'This Draft changed. Reopen Preview and retry.'
        : 'PDF download failed. Try again. If it continues, review the document in Preview.';
      setPdfExportError({ elementId, name, message });
      triggerToast(message, 'error');
      return false;
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
      setQItems([...qItems, ensureQuoteLineItemId({ description: '', quantity: 1, unitPrice: 0 })]);
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

  const clientWorkspaceProps = {
    controller: clientWorkspace.controller,
    writable: clientWorkspace.writable,
    readOnlyMessage: clientWorkspace.readOnlyMessage,
    renderDocuments: client => <ClientDocumentsPanel
      client={client} quotes={quotes} invoices={invoices}
      isQuotesLoading={isQuotesLoading} isInvoicesLoading={isInvoicesLoading}
      quotesError={quotesError} invoicesError={invoicesError}
      controlId={`client-documents-${client.id}`} panelId={`client-documents-panel-${client.id}`}
      onOpenDocument={openDocument}
    />,
    onCreateQuote: client => initCreateQuote({ source: 'client_workspace', clientContext: {
      client_id: client.id, client_name: client.name,
      client_email: client.email || '', client_address: client.address || '',
    } }),
    onBill: client => initCreateInvoice({ source: 'client_bill', clientContext: {
      client_id: client.id, client_name: client.name,
      client_email: client.email || '', client_address: client.address || '',
    } }),
  };

  // Render components based on auth status and tabs
  const getActiveLeads = () => leads;
  const getActiveQuotes = () => quotes;
  const getActiveInvoices = () => invoices;
  const getActiveClients = () => clients.filter(client => !client.archived_at);
  const getActiveProfile = () => cardProfile;

  const openDocument = ({ documentType, id, invoiceSnapshot = null } = {}) => {
    if (!requestInvoiceNavigation(() => openDocument({ documentType, id, invoiceSnapshot }))) return false;
    if (!requestQuoteNavigation(() => openDocument({ documentType, id, invoiceSnapshot }))) return false;
    if (!id) return false;

    if (documentType === 'quote') {
      const quote = quotes.find((document) => document?.id === id);
      if (!quote) return false;

      const itemsParsed = (Array.isArray(quote.items) ? quote.items : JSON.parse(quote.items || '[]')).map((item) => ensureQuoteLineItemId(item));
      setPersistedLineageByItemId(Object.fromEntries(itemsParsed.map((item) => [item.id, Array.isArray(item.source_component_refs) ? [...item.source_component_refs] : []])));
      setQPendingEditorDrafts({});
      setQuoteSaveUnknown(false);
      setQuoteEditorGeneration(value => value + 1);
      setQId(quote.id);
      setQClientPresentation(Object.prototype.hasOwnProperty.call(quote, 'client_presentation') ? quote.client_presentation : undefined);
      setQApprovedSnapshotId(quote.approved_snapshot_id || null);
      setQNumber(quote.quote_number || '');
      setQClientName(quote.client_name || '');
      setQClientEmail(quote.client_email || '');
      setQClientAddress(quote.client_address || '');
      setQClientId(quote.client_id || null);
      setQCurrency(quote.currency || 'USD');
      const parsedQuoteNotes = deserializeInvoiceNotes(quote.notes || '');
      const preparedForOverride = readPreparedForDisplayOverride(parsedQuoteNotes.metadata);
      setQPreparedForOverridePresent(preparedForOverride.overridePresent);
      setQPreparedForDisplayOverride(preparedForOverride.overrideValue);
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
      setQNarrativePaymentTerms(readNarrativePaymentTermsV1(parsedQuoteNotes.metadata));
      setQTaxRate(Number(quote.tax_rate || 0));
      setQDiscountRate(Number(quote.discount_rate || 0));
      setQDate(quote.created_at?.substring(0, 10) || '');
      setQItems(itemsParsed.map((item) => ({
        id: ensureQuoteLineItemId(item).id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice || (item.unit_price || 0) / 100,
        ...(item.billingUnit ? { billingUnit: item.billingUnit } : {}),
        ...(item.secondaryQuantity ? { secondaryQuantity: item.secondaryQuantity, secondaryUnit: item.secondaryUnit } : {}),
        ...(Array.isArray(item.source_component_refs) ? { source_component_refs: [...item.source_component_refs] } : {}),
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
      const invoice = invoiceSnapshot?.id === id ? invoiceSnapshot : invoices.find((document) => document?.id === id);
      if (!invoice) return false;

      const deserialized = deserializeInvoiceNotes(invoice.notes);
      const itemsParsed = Array.isArray(invoice.items) ? invoice.items : JSON.parse(invoice.items || '[]');
      captureInvoiceHydration(invoice);
      setInvoiceEditorGeneration(value => value + 1);
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
      let invoiceDate = invoice.invoice_date;
      if (!invoiceDate && invoice.created_at) {
        try { invoiceDate = getBusinessReferenceDate(invoice.created_at, user?.business_timezone); } catch { /* Invalid legacy instant: use current business day below. */ }
      }
      setInvDate(invoiceDate || getTodayString());
      setInvDueDate(invoice.due_date || '');
      setInvPaymentTerms(invoice.payment_terms || 'Net 30');
      setInvPaymentLink(invoice.payment_link || '');
      setInvQuoteId(invoice.quote_id || null);
      setInvItems(hydrateInvoiceItems(itemsParsed));
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

  useEffect(() => {
    if (buildQuoteHandoff?.status !== 'opening') return;
    if (quotes === buildQuoteHandoff.previousQuotes && !quotesError) return;
    const quote = quotes.find((document) => document?.id === buildQuoteHandoff.quoteId);
    let opened = false;
    try {
      // Resume the explicit editor-opening request only after the persisted quote list refreshes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      opened = quote ? openDocument({ documentType: 'quote', id: buildQuoteHandoff.quoteId }) : false;
    } catch {
      opened = false;
    }
    setBuildQuoteHandoff(null);
    const resolve = buildQuoteHandoffResolveRef.current;
    buildQuoteHandoffResolveRef.current = null;
    resolve?.(Boolean(opened));
  }, [buildQuoteHandoff, quotes, quotesError]);

  // Document total computations
  const currentInvoices = getActiveInvoices();
  const invoiceTotals = summarizeInvoicePayments(currentInvoices, referenceInstant, paymentOptions);
  const totalPaid = invoiceTotals.paidCents / 100;
  const totalPending = invoiceTotals.outstandingCents / 100;
  const totalOverdue = invoiceTotals.overdueCents / 100;
  const totalVolume = invoiceTotals.totalCents / 100;

  // Init blank Quote
  const initCreateQuote = (options = 'quick_action') => {
    if (!requestQuoteNavigation(() => initCreateQuote(options))) return false;
    const quoteTicket = quoteContinuity.guard.capture();
    const initiatingUserId = session?.user?.id || null;
    const isCurrentActor = () => (sessionRef.current?.user?.id || null) === initiatingUserId;
    if (!isCurrentActor()) return false;
    const normalizedOptions = typeof options === 'string' ? { source: options } : (options || {});
    const quoteSource = normalizedOptions.source || 'quick_action';
    const clientContext = normalizedOptions.clientContext || null;
    trackEvent('create_quote_click', { source: quoteSource });
    trackEvent('quick_action_click', { action: 'create_quote', source: quoteSource });
    evaluateAction('create_quote', () => {
      if (!isCurrentActor() || !quoteContinuity.guard.isSameSession(quoteTicket)) return false;
      setQPendingEditorDrafts({});
      setQuoteSaveUnknown(false);
      setQuoteEditorGeneration(value => value + 1);
      resetQuoteCreateState();
      if (clientContext?.client_id) {
        setQClientId(clientContext.client_id);
        setQClientName(clientContext.client_name || '');
        setQClientEmail(clientContext.client_email || '');
        setQClientAddress(clientContext.client_address || '');
      }
      setIsFirstQuoteFlow(quoteSource === 'first_quote_onboarding');
      handleDashboardTabChange('quotes', quoteSource);
      setQuoteView('project_understanding');
    });
  };

  // Init blank Invoice
  const openInvoiceBuilder = (source = 'quick_action', clientContext = null) => {
    if (!requestInvoiceNavigation(() => openInvoiceBuilder(source, clientContext))) return false;
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
    const initiatingUserId = session?.user?.id || null;
    const isCurrentActor = () => (sessionRef.current?.user?.id || null) === initiatingUserId;
    if (!isCurrentActor()) return false;
    const normalizedOptions = typeof options === 'string' ? { source: options } : (options || {});
    const source = normalizedOptions.source || 'quick_action';
    const clientContext = normalizedOptions.clientContext || null;
    trackEvent('create_invoice_click', { source });
    trackEvent('quick_action_click', { action: 'create_invoice', source });
    evaluateAction(
      'create_invoice',
      () => { if (isCurrentActor()) openInvoiceBuilder(source, clientContext); },
      clientContext?.client_id ? { client_id: clientContext.client_id } : {}
    );
  };

  const initFirstValueInvoice = () => {
    trackEvent('create_invoice_click', { source: 'first_value_card' });
    openInvoiceBuilder();
  };

  const handleCancelQuote = () => {
    if (!requestQuoteNavigation(handleCancelQuote)) return false;
    setQPendingEditorDrafts({});
    if (typeof setQPhotographyScope === 'function') setQPhotographyScope(createEmptyPhotographyScope());
    if (typeof setUsageRightsExpanded === 'function') setUsageRightsExpanded(false);
    if (typeof setSemanticReviewState === 'function') setSemanticReviewState({ status: 'READY', inputFingerprint: null, semanticFindings: [] });
    setQuoteView('list');
  };

  const handleBuildQuoteEditorNavigation = async ({ quoteId, retryOpenOnly = false } = {}) => {
    if (!quoteId || (buildQuoteHandoffResolveRef.current && !retryOpenOnly)) return false;
    const previousQuotes = quotes;
    const opening = new Promise((resolve) => {
      buildQuoteHandoffResolveRef.current = resolve;
    });
    setBuildQuoteHandoff({ quoteId, status: 'refreshing', previousQuotes });
    try {
      const refreshed = await fetchData(session?.access_token);
      if (refreshed?.error) throw refreshed.error;
      setBuildQuoteHandoff({ quoteId, status: 'opening', previousQuotes });
      return await opening;
    } catch {
      setBuildQuoteHandoff(null);
      const resolve = buildQuoteHandoffResolveRef.current;
      buildQuoteHandoffResolveRef.current = null;
      resolve?.(false);
      return false;
    }
  };

  const handleCancelInvoice = () => {
    if (!requestInvoiceNavigation(handleCancelInvoice)) return false;
    setInvoiceFlowLocked(false);
    setInvoiceFlowStage('create');
    setShowPaymentWaitingBanner(false);
    setInvoiceView('list');
  };

  const handleExitInvoiceFlow = () => {
    if (!requestInvoiceNavigation(handleExitInvoiceFlow)) return false;
    setInvoiceFlowLocked(false);
    setInvoiceFlowStage('create');
    setShowPaymentWaitingBanner(false);
    setInvoiceView('list');
    handleDashboardTabChange('overview', 'invoice_flow_exit');
  };

  const resumeInvoiceNavigation = () => {
    const pending = invoiceNavigationRef.current;
    const current = invoiceEditStateRef.current;
    if (!pending || pending.generation !== current?.generation || pending.actor !== current?.actor) return false;
    invoiceNavigationRef.current = null;
    setShowInvoiceLeaveDialog(false);
    invoiceNavigationBypassRef.current = true;
    try {
      setInvoiceView('list');
      setInvoiceFlowLocked(false);
      return pending.action();
    } finally { invoiceNavigationBypassRef.current = false; }
  };

  const getInvoiceTotals = () => {
    if (invoiceClientDocument.integrity.ok) {
      const { subtotal, discount, tax, total } = invoiceClientDocument.totals;
      return { subtotal: subtotal / 100, discount: discount / 100, tax: tax / 100, total: total / 100 };
    }
    const subtotal = invItems.reduce((sum, item) => sum + calculateLineItemAmount(item), 0);
    const discounted = subtotal * (1 - Number(invDiscountRate || 0) / 100);
    const tax = discounted * Number(invTaxRate || 0) / 100;
    return {
      subtotal,
      discount: subtotal * Number(invDiscountRate || 0) / 100,
      tax,
      total: discounted + tax,
    };
  };

  const isInvoiceDraftReady = () => Boolean(invoiceClientDocument.integrity.ok);

  const goToInvoicePreview = () => {
    setFormError('');
    if (!isInvoiceDraftReady()) {
      setFormError(invoiceValidationMessage);
      return;
    }
    setInvoiceFlowStage('preview');
  };

  const handleInvoiceStageClick = event => {
    const stage = event.currentTarget.dataset.invoiceStage;
    if (stage === 'create') setInvoiceFlowStage('create');
    else if (stage === 'preview') goToInvoicePreview();
    else handleSaveInvoice({ advanceToSend: true });
  };

  const renderInvoiceFlowStepper = () => (
    <nav className="invoice-workflow-navigation" aria-label="Invoice workflow">
      {INVOICE_FLOW_STAGES.map(stage => (
        <button key={stage.id} type="button" aria-current={stage.id === invoiceFlowStage ? 'page' : undefined}
          disabled={isSaving || (stage.id === 'send' && invoiceFlowStage !== 'preview')}
          data-invoice-stage={stage.id} onClick={handleInvoiceStageClick}>{stage.label}</button>
      ))}
    </nav>
  );

  // One paper surface for inline editing and the existing preview/send stages.
  const renderInvoicePaper = ({ readonly = false, compact = false } = {}) => {
    const locked = readonly || isSelectedInvoiceSettled || invoiceCommercialReadonly;
    const identityLocked = locked || Boolean(invId);
    const totals = getInvoiceTotals();
    const sourceQuote = invQuoteId ? quotes.find(quote => quote.id === invQuoteId) : null;
    const status = invStatus === 'draft' || !invId ? 'draft' : selectedInvoicePaymentStatus;
    const presetTerms = ['Due on Receipt', 'Net 7', 'Net 14', 'Net 30'];
    const termDays = { 'Due on Receipt': 0, 'Net 7': 7, 'Net 14': 14, 'Net 30': 30 }[invPaymentTerms];
    const issueDate = normalizeDateOnly(invDate);
    const dueDateIsDerived = issueDate && termDays !== undefined && invDueDate === addCalendarDays(issueDate, termDays);
    const clientSearch = invClientSearch.trim().toLowerCase();
    const availableClients = getActiveClients();
    const matchingClients = availableClients.filter(client => [client.name, client.email].some(value => String(value || '').toLowerCase().includes(clientSearch)));
    // Recorded amounts come only from the existing payment read model.
    const paid = selectedInvoicePayment.amount_paid_cents / 100;
    const balance = isSelectedInvoiceSettled ? selectedInvoicePayment.amount_due_cents / 100 : totals.total;
    return (
      <article className={`invoice-paper${compact ? ' invoice-paper-compact' : ''}`} aria-label="Invoice document" data-readonly={locked} aria-busy={isSaving}>
        <fieldset className="invoice-worksheet-fields" disabled={isSaving}>
        <legend className="invoice-sr-only">Invoice details</legend>
        <header className="invoice-paper-header">
          <div className="invoice-issuer">
            <strong>{invoiceClientDocument.issuer?.name || user.name || 'Photographer'}</strong>
            {(invoiceClientDocument.issuer?.email || user.email) && <span>{invoiceClientDocument.issuer?.email || user.email}</span>}
          </div>
          <div className="invoice-document-identity">
            <h1 id="invoice-editor-heading" data-invoice-stage-heading tabIndex={-1}>Invoice</h1>
            <span className="invoice-number" aria-label="Invoice number">{invNumber}</span>
            {!locked && <details className="invoice-secondary-control invoice-number-override">
              <summary>Override number</summary>
              <label>Invoice number<input className="invoice-document-input" aria-label="Invoice number" readOnly={locked} value={invNumber} onChange={e => setInvNumber(e.target.value)} required /></label>
            </details>}
            <div className="invoice-status-line">
              <DocumentLedgerStatus status={status} />
              {invStatus === 'sent' && <span>Sent</span>}
              {selectedInvoicePayment.is_overdue && invStatus !== 'draft' && invId && <span className="document-ledger-urgency">Overdue</span>}
            </div>
          </div>
        </header>
        {isFreePlan && <p className="invoice-platform-credit">Made with Corvioz</p>}
        {sourceQuote && (
          <p className="invoice-source-reference">
            From Quote <span>{sourceQuote.quote_number || 'Linked Quote'}</span>
          </p>
        )}
        <section className="invoice-payment-overview" aria-label="Payment overview">
          <dl>
            <div><dt>Due date</dt><dd>{invDueDate || '—'}</dd></div>
            <div><dt>Payment</dt><dd><DocumentLedgerStatus status={selectedInvoicePaymentStatus} /><small>Paid {formatDashboardMoney(paid, invCurrency)}</small></dd></div>
            <div><dt>Invoice total</dt><dd>{formatDashboardMoney(totals.total, invCurrency)}</dd></div>
            <div className="invoice-payment-overview-balance"><dt>Balance due</dt><dd>{formatDashboardMoney(balance, invCurrency)}</dd></div>
          </dl>
        </section>
        <div className="invoice-parties-and-terms">
          <section className="invoice-bill-to" id="invoice-recipient" aria-label="Bill to">
            <div className="invoice-section-heading"><h3>Bill to</h3>
            {!identityLocked && getActiveClients().length > 0 && (
              <details className="invoice-client-picker" onToggle={e => { if (!e.currentTarget.open) setInvClientSearch(''); }}>
                <summary>{invClientName ? 'Change client' : 'Select existing client'}</summary>
                <div className="invoice-client-search">
                  <input type="search" className="invoice-document-input" aria-label="Search existing clients" readOnly={locked} placeholder="Search name or email" value={invClientSearch} onChange={e => setInvClientSearch(e.target.value)} />
                  <div className="invoice-client-results" aria-label="Existing clients">
                    {matchingClients.map(cli => {
                      const recipientAvailable = cli.client_kind !== 'company' && Array.isArray(cli.contacts) && cli.contacts.length === 0;
                      return <button key={cli.id} type="button" disabled={!recipientAvailable || isSaving} onClick={e => {
                        if (!recipientAvailable || isSaving) return;
                        setInvClientId(cli.id);
                        setInvClientName(cli.name);
                        setInvClientEmail(cli.email || '');
                        setInvClientAddress(cli.address || '');
                        e.currentTarget.closest('details').open = false;
                        setInvClientSearch('');
                      }}><strong>{cli.name}</strong>{cli.email && <span>{cli.email}</span>}{!recipientAvailable && <span>Recipient selection unavailable for this record</span>}</button>;
                    })}
                    {matchingClients.length === 0 && <p role="status">No matching clients. You can enter the billing details below.</p>}
                  </div>
                </div>
              </details>
            )}
            </div>
            <label>Client name<input className="invoice-document-input invoice-client-name" aria-label="Client name" value={invClientName} readOnly={identityLocked} onChange={e => setInvClientName(e.target.value)} placeholder="Client name" autoComplete="off" required /></label>
            <label>Client email<input type="email" className="invoice-document-input" aria-label="Client email" value={invClientEmail} readOnly={identityLocked} onChange={e => setInvClientEmail(e.target.value)} placeholder="name@example.com" autoComplete="off" /></label>
            <label>Client address<textarea className="invoice-document-input" aria-label="Client address" rows={2} value={invClientAddress} readOnly={identityLocked} onChange={e => setInvClientAddress(e.target.value)} placeholder="Billing address (optional)" autoComplete="off" /></label>
          </section>
          <section className="invoice-terms" aria-label="Invoice terms">
            <h3>Dates &amp; terms</h3>
            <div className="invoice-summary-date-grid">
              <label>Issue date<input type="text" className="invoice-document-input" aria-label="Issue date" value={invDate} disabled={locked} onFocus={e => { e.currentTarget.dataset.deriveDueDate = !invId && dueDateIsDerived ? 'true' : 'false'; }} onBlur={e => { delete e.currentTarget.dataset.deriveDueDate; }} onChange={e => { if (!invId && dueDateIsDerived) e.currentTarget.dataset.deriveDueDate = 'true'; setInvDate(e.target.value); if (!invId && e.currentTarget.dataset.deriveDueDate === 'true') updateDueDateFromTerms(invPaymentTerms, e.target.value); }} placeholder="YYYY-MM-DD" inputMode="numeric" pattern={DASHBOARD_DATE_ENTRY_PATTERN} maxLength={10} data-dashboard-date-entry="english" /></label>
              <label>Due date<input type="text" className="invoice-document-input" aria-label="Due date" aria-describedby={locked ? undefined : 'invoice-due-date-help'} value={invDueDate} disabled={locked} readOnly={Boolean(dueDateIsDerived)} onChange={e => { setInvPaymentTerms('Custom'); setInvDueDate(e.target.value); }} placeholder="YYYY-MM-DD" inputMode="numeric" pattern={DASHBOARD_DATE_ENTRY_PATTERN} maxLength={10} data-dashboard-date-entry="english" /></label>
            </div>
            {!locked && <div className="invoice-field-help" id="invoice-due-date-help">
              <span>{dueDateIsDerived ? 'From issue date + payment terms' : 'Stored or custom due date'}</span>
              {dueDateIsDerived && <button type="button" onClick={() => setInvPaymentTerms('Custom')}>Set custom due date</button>}
            </div>}
            <label>Payment terms
              <select className="invoice-document-input invoice-select" aria-label="Payment terms" value={presetTerms.includes(invPaymentTerms) ? invPaymentTerms : 'Custom'} disabled={locked} onChange={e => { setInvPaymentTerms(e.target.value); updateDueDateFromTerms(e.target.value, invDate); }}>
                <option value="Due on Receipt">Due on receipt</option><option value="Net 7">Net 7</option><option value="Net 14">Net 14</option><option value="Net 30">Net 30</option><option value="Custom">Custom</option>
              </select>
            </label>
            {!presetTerms.includes(invPaymentTerms) && <label>Custom terms<input className="invoice-document-input" aria-label="Custom payment terms" value={invPaymentTerms} readOnly={locked} maxLength={80} onChange={e => setInvPaymentTerms(e.target.value)} placeholder="Payment terms for this invoice" /></label>}
            {identityLocked ? <div className="invoice-currency-output">Currency <span>{invCurrency}</span></div> : <div className="invoice-currency-control">
              <label>Currency<select className="invoice-document-input invoice-select" aria-label="Currency" value={invCurrency.toUpperCase()} disabled={locked} onChange={e => setInvCurrency(e.target.value)}>
                <option value="USD">USD — US Dollar</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="AUD">AUD — Australian Dollar</option>
                <option value="SGD">SGD — Singapore Dollar</option>
                {invCurrency && !['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'SGD'].includes(invCurrency.toUpperCase()) && <option value={invCurrency.toUpperCase()}>{invCurrency.toUpperCase()}</option>}
              </select></label>
            </div>}
          </section>
        </div>
        <section className="invoice-line-items" id="invoice-items" aria-label="Line items">
          <div className="invoice-section-heading"><h3>Services &amp; line items</h3><span className="invoice-section-meta">{invCurrency}</span></div>
          <div className="invoice-item-columns" aria-hidden="true"><span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span><span /></div>
          {invItems.map((item, index) => (
            <div key={index} className="invoice-item-row">
              <div className="invoice-item-description">
                <div className="invoice-item-copy" aria-hidden="true">
                  <span className="invoice-item-title">{item.description?.split('\n')[0] || 'Service description'}</span>
                  {item.description?.includes('\n') && <span className="invoice-item-support">{item.description.split('\n').slice(1).join('\n')}</span>}
                </div>
                <textarea className="invoice-document-input" aria-label={`Line item ${index + 1} description`} placeholder="Service description" rows={2} value={item.description} readOnly={locked} onChange={e => handleItemChange('invoice', index, 'description', e.target.value)} required />
                {item.billingUnit && <small>{item.billingUnit}{item.secondaryQuantity ? ` · ${item.secondaryQuantity} ${item.secondaryUnit || ''}` : ''}</small>}
              </div>
              <label className="invoice-item-quantity"><span>Qty</span><input type="number" className="invoice-document-input" aria-label={`Line item ${index + 1} quantity`} step="any" inputMode="decimal" value={item.quantity} readOnly={locked} onChange={e => handleItemChange('invoice', index, 'quantity', Number(e.target.value))} required /></label>
              <label className="invoice-item-rate"><span>Rate</span><input type="number" className="invoice-document-input" aria-label={`Line item ${index + 1} rate`} step="any" inputMode="decimal" value={item.unitPrice} readOnly={locked} onChange={e => handleItemChange('invoice', index, 'unitPrice', Number(e.target.value))} required /></label>
              <div className="invoice-item-amount"><span>Amount</span><strong>{formatDashboardMoney(invoiceClientDocument.integrity.ok && invoiceClientDocument.items[invoiceEditorItems.indexOf(item)] ? invoiceClientDocument.items[invoiceEditorItems.indexOf(item)].amount / 100 : calculateLineItemAmount(item), invCurrency)}</strong></div>
              {!locked && <button type="button" className="invoice-remove-item" aria-label={`Remove line item ${index + 1}`} onClick={() => removeItem('invoice', index)}>&times;</button>}
            </div>
          ))}
          {!locked && <button type="button" className="invoice-add-item" onClick={() => addItem('invoice')}><span aria-hidden="true">+</span> Add line item</button>}
        </section>
        <div className="invoice-document-footer">
          <section className="invoice-notes" id="invoice-notes" aria-label="Invoice notes">
            <div className="invoice-section-heading"><h3>Notes</h3></div>
            <textarea className="invoice-document-input" aria-label="Invoice notes" rows={3} value={invNotes} readOnly={locked} onChange={e => setInvNotes(e.target.value)} placeholder="Document notes for the client..." />
            <label>Client document link<input type="url" className="invoice-document-input" aria-label="Client document link" placeholder="Optional external document link" value={invPaymentLink} readOnly={locked} onChange={e => setInvPaymentLink(e.target.value)} /></label>
          </section>
          <section className="invoice-financials" aria-label="Invoice totals">
            <h3>Invoice summary</h3>
            <div><span>Subtotal</span><span>{formatDashboardMoney(totals.subtotal, invCurrency)}</span></div>
            {(!readonly || invDiscountRate > 0) && <div><label>Discount <input type="number" className="invoice-document-input invoice-percent" aria-label="Discount rate (%)" step="any" inputMode="decimal" value={invDiscountRate} readOnly={locked} onChange={e => setInvDiscountRate(Number(e.target.value))} />%</label><span>−{formatDashboardMoney(totals.discount, invCurrency)}</span></div>}
            {(!readonly || invTaxRate > 0) && <div><label>Tax <input type="number" className="invoice-document-input invoice-percent" aria-label="Tax rate (%)" min="0" max="100" step="any" value={invTaxRate} readOnly={locked} onChange={e => setInvTaxRate(Number(e.target.value))} />%</label><span>{formatDashboardMoney(totals.tax, invCurrency)}</span></div>}
            <div className="invoice-total"><span>Total</span><span>{formatDashboardMoney(totals.total, invCurrency)}</span></div>
            <div><span>Paid</span><span>{formatDashboardMoney(paid, invCurrency)}</span></div>
            <div className="invoice-balance-due"><span>Balance due</span><strong>{formatDashboardMoney(balance, invCurrency)}</strong></div>
          </section>
        </div>
        </fieldset>
      </article>
    );
  };


  const renderInvoiceReadonlyPreview = () => <InvoiceReviewPresentation document={invoiceClientDocument}><InvoicePreviewFrame><InvoiceClientDocument key={JSON.stringify(invoiceClientDocument)} document={invoiceClientDocument} /></InvoicePreviewFrame></InvoiceReviewPresentation>;

  const hasNoData = !isLoading && getActiveQuotes().length === 0 && getActiveInvoices().length === 0;
  const shouldShowActivationGuide = !activationGuideDismissed && (showActivationGuide || hasNoData) && activeTab === 'overview' && !previewMode;

  const renderActivationGuide = () => {
    return null;
  };

  const activeClientsCount = clients ? clients.length : 0;
  const activeInvoicesCount = invoices ? invoices.length : 0;
  const hasOverdueInvoices = invoices.some(inv => inv.status !== 'draft' && invoicePayment(inv).is_overdue);

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
  const projectCoverQuote = quotes.find((record) => record.id === projectCoverQuoteId);
  const handleSelectProjectCover = async (quoteId, assetId) => {
    if (!session?.access_token || isDemo || previewMode) throw new Error('Sign in to change this project cover.');
    const response = await fetch(`/api/quotes/${encodeURIComponent(quoteId)}/project-cover`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ asset_id: assetId }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Unable to change project cover.');
    setQuotes((current) => current.map((record) => {
      if (record.id !== quoteId) return record;
      return { ...record, project_cover_v1: body.project_cover_v1 };
    }));
  };
  const handleUploadProjectCover = async (quoteId, derivatives, onCommitted) => {
    const token = session?.access_token;
    if (!token || isDemo || previewMode) throw new Error('Sign in to upload a project cover.');
    const quote = quotes.find((record) => record.id === quoteId);
    if (!quote) throw new Error('Quote not found. Reload and try again.');
    const current = quote.project_cover_v1;
    const revision = current == null ? 0 : current.revision;
    if (!Number.isSafeInteger(revision) || revision < 0) throw new Error('The current project-cover revision is unavailable. Reload before uploading.');
    const form = new FormData();
    form.append('cover', derivatives.cover, 'cover.jpg');
    form.append('thumbnail', derivatives.thumbnail, 'thumbnail.jpg');
    form.append('expected_revision', String(revision));
    onCommitted?.({ phase: 'uploading', message: 'Uploading your photo…' });
    const response = await fetch(`/api/quotes/${encodeURIComponent(quoteId)}/project-cover/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const body = await response.json().catch(() => ({}));
    if (response.status === 409 || body.code === 'PROJECT_COVER_CONFLICT') {
      await fetchData(token).catch(() => null);
      throw new Error(body.error || 'The project cover changed. Reload and retry.');
    }
    if (!response.ok) throw new Error(body.error || 'Unable to upload the project cover.');
    const returned = body.project_cover_v1;
    if (body.cover_committed === true && body.media_ready === false && body.warning_code === 'PROJECT_COVER_SIGN_FAILED') {
      setQuotes((currentQuotes) => currentQuotes.map((record) => record.id === quoteId
        ? { ...record, project_cover_v1: returned } : record));
      onCommitted?.({ phase: 'refreshing', revision: returned?.revision, message: 'Photo saved. Refreshing preview…' });
      await fetchData(token).catch(() => null);
      return { keepOpen: true, revision: returned?.revision, notice: 'Photo saved, but the preview is temporarily unavailable.' };
    }
    if (!returned || typeof returned.coverSrc !== 'string' || typeof returned.thumbnailSrc !== 'string') {
      throw new Error(body.error || 'The server did not return a usable project-cover preview.');
    }
    setQuotes((currentQuotes) => currentQuotes.map((record) => record.id === quoteId
      ? { ...record, project_cover_v1: returned } : record));
    return { keepOpen: false };
  };

  const saveQuoteClientPresentation = async (presentation) => {
    const ticket = quoteContinuity.guard.capture();
    const isCurrentQuote = () => quoteContinuity.guard.isCurrent(ticket)
      && (sessionRef.current?.user?.id || null) === ticket.actor;
    if (!isCurrentQuote()) return false;

    if (qStatus === 'approved' || qStatus === 'converted') throw new Error('The approved client view is locked.');
    if (!qId) {
      setQClientPresentation(presentation);
      return true;
    }
    if (!session?.access_token) throw new Error('Sign in to save the client view.');
    const response = await fetch('/api/quotes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id: qId, client_presentation: presentation }),
    });
    const result = await response.json().catch(() => ({}));
    if (!isCurrentQuote()) return false;
    if (!response.ok || !result.id) throw new Error('Unable to save the client view. Please try again.');
    setQClientPresentation(result.client_presentation);
    setQuotes((current) => current.map((record) => record.id === qId ? { ...record, client_presentation: result.client_presentation } : record));
    return true;
  };

  // This factory only forwards actions; it never invokes the export callback or reads its refs.
  // eslint-disable-next-line react-hooks/refs
  const quoteSharedContract = createQuoteEditorSharedContract({
    quote: {
      editorGeneration: quoteEditorGeneration,
      qPendingEditorDrafts,
      projectCover: resolveProjectCover(quotes.find((record) => record.id === qId) || { notes: serializeInvoiceNotes('', { quote_preset_id: selectedQuotePresetId }) }),
      qId,
      qClientPresentation,
      qApprovedSnapshotId,
      qNumber,
      qClientId,
      qClientName,
      qClientEmail,
      qClientAddress,
      qPreparedForOverridePresent,
      qPreparedForDisplayOverride,
      qItems,
      persistedLineageByItemId,
      qTaxRate,
      qDiscountRate,
      qCurrency,
      qNotes,
      qNarrativePaymentTerms,
      qDate,
      qStatus,
      qPhotographyScope,
      photographerName: user?.name || 'Photographer',
      photographerEmail: user?.email || '',
      availableClients: clients,
      persistedRecipient: quotes.find(record => record.id === qId) || null,
    },
    setters: {
      setQuoteNumber: setQNumber,
      setQuoteClientId: setQClientId,
      setQuoteClientName: setQClientName,
      setQuoteClientEmail: setQClientEmail,
      setQuoteClientAddress: setQClientAddress,
      setQuotePreparedForOverridePresent: setQPreparedForOverridePresent,
      setQuotePreparedForDisplayOverride: (value) => {
        setQPreparedForOverridePresent(true);
        setQPreparedForDisplayOverride(value);
      },
      resetQuotePreparedForDisplayOverride: () => {
        setQPreparedForOverridePresent(false);
        setQPreparedForDisplayOverride('');
      },
      setQuoteItems: setQItems,
      setQuoteTaxRate: setQTaxRate,
      setQuoteDiscountRate: setQDiscountRate,
      setQuoteCurrency: setQCurrency,
      setQuoteNotes: setQNotes,
      setQuoteNarrativePaymentTerms: setQNarrativePaymentTerms,
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
      openProjectCover: qId && session?.access_token && !isDemo && !previewMode ? () => setProjectCoverQuoteId(qId) : null,
      loadAcceptedBaseline,
      registerPendingDraft: registerQuotePendingDraft,
      save: () => handleSaveQuote({ stayInEditor: true }),
      saveClientPresentation: saveQuoteClientPresentation,
      loadApprovedClientDocument: loadApprovedQuoteClientDocument,
      send: handleSendQuote,
      exportPdf: (elementId, name, resourceId) => handleExportAttempt(elementId, name, resourceId),
      runSemanticReview: handleRunSemanticReview,
      cancel: handleCancelQuote,
      convertToInvoice: handleConvertQuoteToInvoice,
    },
    scope: {
      updateField: updateQPhotographyScope,
      setUsageRightsStatus: handleUsageRightsStatusChange,
    },
    ui: {
      quoteDirty: quoteContinuity.dirty,
      quoteCommercialDirty: quoteContinuity.guard.commercialDirty,
      formError,
      formSuccess,
      isSaving,
      isSendingQuote,
      isDownloadingPdf,
      canExportPdf,
      hasCleanPdf,
      pdfExportError: pdfExportError?.elementId === 'printable-quote' && pdfExportError.name === `quote_${qNumber}` ? pdfExportError.message : '',
    },
  });

  return (
    <div
      className="dashboard-shell" data-harbor-focused={Boolean(harborFocusedContext)}
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
      {pendingSemanticOperation && <IntelligenceUsageNotice usage={sharedModelUsage} operation={pendingSemanticOperation} onCheck={async()=>{try{const op=await readAnalysisOperation({operationId:pendingSemanticOperation.operation_id,accessToken:session?.access_token});if(op.status==='SUCCEEDED'&&op.result){setSemanticReviewState(op.result);setPendingSemanticOperation(null);}else setPendingSemanticOperation(op);}catch(error){triggerToast(error.message,'info');}}} onResume={async()=>{try{const result=await resumeAnalysisOperation({operationId:pendingSemanticOperation.operation_id,accessToken:session?.access_token});setSemanticReviewState(result);setPendingSemanticOperation(null);}catch(error){triggerToast(error.message,'info');}}} />}

      {projectCoverQuote && <ProjectCoverPicker key={projectCoverQuote.id} quote={projectCoverQuote} onSelect={handleSelectProjectCover} onUpload={handleUploadProjectCover} onClose={() => setProjectCoverQuoteId(null)} />}
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

      <div className="harbor-mobile-brand" aria-label="Corvioz" role="img"><span className="logo-wordmark" aria-hidden="true">Corvioz</span></div>

      {/* Sidebar navigation */}
      <aside className={`dashboard-sidebar-aside${sidebarCollapsed ? ' dashboard-sidebar-collapsed' : ''}`} aria-label="Dashboard navigation">
        <div className="dashboard-sidebar-body">
          {/* Logo */}
          <div className="dashboard-sidebar-logo">
            <Logo className="dashboard-sidebar-wordmark" size={20} style={{ fontSize: '1.1rem' }} />
            <span className="dashboard-sidebar-mark" aria-label="Corvioz" role="img">
              <img src="/brand/corvioz-icon-small.svg" alt="" aria-hidden="true" />
            </span>
            <button
              type="button"
              className="dashboard-sidebar-toggle"
              data-testid="dashboard-sidebar-collapse"
              aria-expanded={!sidebarCollapsed}
              aria-controls="dashboard-primary-navigation"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={toggleSidebar}
            >
              <Icons.ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
              <span className="dashboard-sidebar-toggle-label">{sidebarCollapsed ? 'Expand' : 'Collapse'}</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav id="dashboard-primary-navigation" className="dashboard-sidebar-nav" aria-label="Primary">
            {getDashboardTabs(kernelUi).map(tab => {
              const IconComponent = Icons[tab.id];
              const isActive = activeTab === tab.id;
              const iconColor = isActive ? 'var(--primary)' : 'var(--text-muted)';
              // B+ icon set (Quote/Invoice/Clients) uses its own stroke-width
              // convention (1.7 default / 1.8 active) per the approved design
              // handoff. Other tabs (e.g. profile) keep their existing values.
              const isBPlusIcon = tab.id === 'quotes' || tab.id === 'invoices' || tab.id === 'clients';
              const iconStrokeWidth = isBPlusIcon ? (isActive ? 1.8 : 1.7) : (isActive ? 2.5 : 2);

              return (
                <React.Fragment key={tab.id}>
                  <button
                    onClick={() => handleDashboardTabChange(tab.id, 'sidebar')}
                    className={`dashboard-sidebar-nav-item${isActive ? ' is-active' : ''}`}
                    type="button"
                    aria-label={tab.label}
                    aria-current={isActive ? 'page' : undefined}
                    title={sidebarCollapsed ? tab.label : undefined}
                  >
                    <div className="dashboard-sidebar-nav-content">
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
          <div className="dashboard-sidebar-account">
            <div className="dashboard-sidebar-account-control">
              {session?.user?.email ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm dashboard-sidebar-account-action"
                  ref={accountButtonRef}
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
                <Link href="/auth" className="btn btn-secondary btn-sm dashboard-sidebar-sign-in-action" style={{ width: '100%', textDecoration: 'none', textAlign: 'center' }}>
                  Sign in
                </Link>
              )}
            </div>

            {accountMenuOpen && session?.user?.email && (
              <DashboardAccountMenu
                anchorRef={accountButtonRef}
                sidebarCollapsed={sidebarCollapsed}
                onClose={() => setAccountMenuOpen(false)}
              >
                <div className="dashboard-account-menu-identity">
                  <div className="dashboard-account-menu-email">
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
                  className="dashboard-account-menu-sign-out"
                >
                  {isSigningOut ? 'Signing out…' : 'Sign out'}
                </button>
              </DashboardAccountMenu>
            )}
          </div>
          <div className="dashboard-sidebar-plan">
            <div className="dashboard-sidebar-plan-row">
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
                className="btn btn-primary btn-sm dashboard-sidebar-plan-action"
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
              aria-label="Share Feedback"
              title="Share Feedback"
            >
              <svg className="dashboard-sidebar-feedback-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="dashboard-sidebar-feedback-label">Share Feedback</span>
            </button>
          </div>
        </div>
      </aside>

      {quoteContinuity.dialogOpen && <QuoteLeaveDialog busy={isSaving}
        canSave={!Object.keys(qPendingEditorDrafts).length && !quoteSaveUnknown && Boolean(session) && !['approved', 'converted', 'declined'].includes(qStatus) && validateQuoteClient({ name: qClientName, email: qClientEmail }).isValid}
        error={formError} onContinue={quoteContinuity.cancel} onDiscard={quoteContinuity.discard}
        onSave={() => handleSaveQuote({ stayInEditor: true, leaveAfterSave: true })} />}
      {quoteContinuity.recovery && quoteView === 'list' && <div className="quote-recovery-notice" role="status">
        <span>An unsaved Quote from this account is retained in this page.</span>
        <button type="button" onClick={() => {
          if (!requestQuoteNavigation(() => {})) return;
          const draft = quoteContinuity.guard.restoreRecovery(session?.user?.id);
          if (!draft) return;
          setQPendingEditorDrafts(draft.qPendingEditorDrafts || {});
          setQuoteSaveUnknown(Boolean(draft.quoteSaveUnknown));
          setQuoteEditorGeneration(value => value + 1);
          setQId(draft.qId); setQClientPresentation(draft.qClientPresentation); setQApprovedSnapshotId(draft.qApprovedSnapshotId);
          setQNumber(draft.qNumber); setQClientId(draft.qClientId); setQClientName(draft.qClientName);
          setQClientEmail(draft.qClientEmail); setQClientAddress(draft.qClientAddress);
          setQPreparedForOverridePresent(draft.qPreparedForOverridePresent); setQPreparedForDisplayOverride(draft.qPreparedForDisplayOverride);
          setQItems(draft.qItems); setPersistedLineageByItemId(draft.persistedLineageByItemId);
          setQTaxRate(draft.qTaxRate); setQDiscountRate(draft.qDiscountRate); setQCurrency(draft.qCurrency);
          setQNotes(draft.qNotes); setQNarrativePaymentTerms(draft.qNarrativePaymentTerms); setQDate(draft.qDate);
          setQStatus(draft.qStatus); setQPhotographyScope(draft.qPhotographyScope); setQQuoteProvenance(draft.qQuoteProvenance);
          quoteContinuity.guard.clearRecovery(session?.user?.id);
          handleDashboardTabChange('quotes'); setQuoteView('edit');
        }}>Restore unsaved Quote</button>
        <button type="button" onClick={() => { quoteContinuity.guard.clearRecovery(session?.user?.id); quoteContinuity.cancel(); }}>Discard retained Quote</button>
      </div>}
      <HarborMobileNavigation activeTab={activeTab} focusedContext={harborFocusedContext}
        onNavigate={handleDashboardTabChange} signedIn={Boolean(session?.user?.email)}
        accountOpen={accountMenuOpen} onAccountOpenChange={setAccountMenuOpen}
        accountEmail={session?.user?.email} isSigningOut={isSigningOut} onSignOut={handleSignOut} />

      {/* Main dashboard content */}
      <Container className="dashboard-main-content" style={{ overflowY: 'auto' }}>
        <header className="dashboard-shell-topbar non-printing" aria-label="Current location">
          <span className="dashboard-shell-topbar-label">Workspace</span>
          <span className="dashboard-shell-topbar-divider" aria-hidden="true">/</span>
          <span className="dashboard-shell-topbar-location">
            {getDashboardTabs(kernelUi).find(tab => tab.id === activeTab)?.label}
          </span>
        </header>
        {quotePreSendNotice && (
          <div className="professional-editor-feedback is-error non-printing" role="status" data-testid="quote-pre-send-finding">
            <strong>{quotePreSendNotice.finding.title}</strong>
            <p>{quotePreSendNotice.finding.message}</p>
            <p>{quotePreSendNotice.finding.recommendedAction}</p>
            <p>Review or dismiss this finding, then retry Send Quote.</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                openDocument({ documentType: 'quote', id: quotePreSendNotice.quoteId });
                setQuotePreSendNotice(null);
              }}>Review fields</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={dismissQuotePreSendFinding}>Dismiss for this session</button>
            </div>
          </div>
        )}
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
                businessTimezone: user?.business_timezone,
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
          !session && quoteView !== 'create' && quoteView !== 'project_understanding' ? (
            renderGuestLockState('Quotes', 'Prepare shoot scope, deposit terms, delivery timelines, usage rights, and final payment details.')
          ) : session && !entitlements.invoice && !canAccessFirstRevenueQuotes ? (
            renderPaidLockState('Quotes', 'Prepare shoot scope, deposit terms, delivery timelines, usage rights, and final payment details.', 'pro')
          ) : (
            <div className="animate-fade-in">
            {quoteView === 'list' && (
              <div className="dashboard-document-ledger" data-document-type="quote" data-has-documents={getActiveQuotes().length > 0}>
                <div className="document-ledger-header">
                  <div><h1>Quotes</h1><p>Scope, terms, and the work ahead.</p></div>
                  <div className="document-ledger-header-actions">
                    <DocumentLedgerImageToggle showImages={quoteLedgerImagesVisible} onToggle={() => setQuoteLedgerImagesVisible((visible) => !visible)} />
                    <button type="button" onClick={() => initCreateQuote('quotes_header')} className="document-ledger-new-action document-ledger-desktop-create">+ New quote</button>
                    <button type="button" onClick={() => initCreateQuote(getQuotesContentState(isQuotesLoading, getActiveQuotes().length) === 'empty' ? 'first_quote_onboarding' : 'quotes_header')} className="document-ledger-new-action document-ledger-mobile-create">+ New quote</button>
                  </div>
                </div>
                {getQuotesContentState(isQuotesLoading, getActiveQuotes().length) === 'loading' ? (
                  <DocumentLedgerState kind="loading" documentType="quote" />
                ) : getQuotesContentState(isQuotesLoading, getActiveQuotes().length) === 'empty' ? (
                  <div className="quotes-ledger-empty-state">
                    <DocumentLedgerState kind="empty" documentType="quote" error={Boolean(quotesError)} onCreate={() => initCreateQuote('first_quote_onboarding')} />
                    {isLive && session?.user?.id && session?.access_token
                      && user?.id === session.user.id && user?.hasActivated
                      && entitlementReady && !isEntitlementLoading && !isEntitlementError
                      && (entitlements.invoice || canAccessFirstRevenueQuotes)
                      && dashboardData.quotesLoadProvenance?.accountId === session.user.id
                      && !isLoading && !isQuotesLoading && !isRefreshing
                      && !quotesError && !invoicesError && !quotaError && !dashboardDataError
                      && getActiveQuotes().length === 0 && (
                        <img
                          className="quotes-ledger-empty-artwork"
                          src="/illustrations/quotes-empty/quotes-v03-256-q95.webp"
                          srcSet="/illustrations/quotes-empty/quotes-v03-256-q95.webp 256w, /illustrations/quotes-empty/quotes-v03-512-q95.webp 512w, /illustrations/quotes-empty/quotes-v03-1024-q95.webp 1024w"
                          sizes="(max-width: 767px) 160px, 260px"
                          width="260"
                          height="260"
                          alt=""
                          draggable={false}
                          onError={(event) => { event.currentTarget.hidden = true; }}
                        />
                      )}
                  </div>
                ) : (
                  <div className="document-ledger-list" aria-label="Quotes">
                    <DocumentLedgerColumns showImages={quoteLedgerImagesVisible} documentType="quote" />
                    {getActiveQuotes().map((q) => {
                      const detail = getDocumentLedgerDetails(q, 'quote', quotes, referenceInstant);
                      const ledgerContextId = `quote-ledger-${q.id}`;
                      const canDeleteQuote = (q.status === 'draft' || q.status === 'sent') && q.id !== firstRevenueLoop?.quote_id && q.has_linked_invoice !== true && q.is_prequote_identity !== true && !invoices.some((inv) => inv.quote_id === q.id);
                      return (
                        <div key={q.id} className="document-ledger-row">
                          <button type="button" className={`document-ledger-entry document-ledger-grid${quoteLedgerImagesVisible ? ' document-ledger-with-images' : ''}`} aria-label={`Open quote ${q.quote_number || q.id}`} aria-describedby={`${ledgerContextId}-project ${ledgerContextId}-client ${ledgerContextId}-date ${ledgerContextId}-amount ${ledgerContextId}-status`} onClick={() => {
                            openDocument({ documentType: 'quote', id: q.id });
                          }}>
                            {quoteLedgerImagesVisible && <span className="document-ledger-cover"><img src={detail.coverSrc} alt="" loading="lazy" /></span>}
                            <span id={`${ledgerContextId}-project`} className="document-ledger-project"><strong>{q.quote_number || 'Quote'}</strong><span className="document-ledger-project-title">{detail.title}</span><span className="document-ledger-category">{detail.category}</span></span>
                            <span id={`${ledgerContextId}-client`} className="document-ledger-client"><strong>{q.client_name || 'Client not specified'}</strong>{q.client_email && <span>{q.client_email}</span>}</span>
                            <span id={`${ledgerContextId}-date`} className="document-ledger-date"><span className="document-ledger-mobile-label">Updated</span>{formatDashboardDate(detail.updatedAt) || 'Date not specified'}</span>
                            <span id={`${ledgerContextId}-amount`} className="document-ledger-amount"><span className="document-ledger-mobile-label">Total</span>{formatDocumentLedgerMoney(q)}</span>
                            <span id={`${ledgerContextId}-status`} className="document-ledger-status-cell"><DocumentLedgerStatus status={q.status} /></span>
                          </button>
                          {(q.status === 'draft' || canDeleteQuote || (q.status === 'approved' && q.has_linked_invoice === false) || (session?.access_token && !isDemo && !previewMode)) && (
                            <details className="document-ledger-overflow" onClick={(event) => { event.stopPropagation(); if (event.target.closest('button, a')) event.currentTarget.removeAttribute('open'); }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.removeAttribute('open'); }} onKeyDown={(event) => { if (event.key === 'Escape') { event.currentTarget.removeAttribute('open'); event.currentTarget.querySelector('summary')?.focus(); } }}>
                              <summary aria-label={`Actions for quote ${q.quote_number || q.id}`}><span aria-hidden="true">···</span></summary>
                              <div className="document-ledger-menu">
                                {session?.access_token && !isDemo && !previewMode && <button type="button" onClick={() => setProjectCoverQuoteId(q.id)}>Change project cover</button>}
                                {q.status === 'draft' && <button type="button" onClick={() => handleSendQuote(q)} disabled={isSendingQuote || !q.client_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.client_email.trim())}>{isSendingQuote ? 'Sending...' : 'Send Quote'}</button>}
                                {q.status === 'approved' && q.has_linked_invoice === false && <button type="button" onClick={() => handleConvertQuoteToInvoice(q)}>Create Invoice Draft</button>}
                                {canDeleteQuote && <button type="button" className="document-ledger-delete" onClick={() => handleDeleteQuote(q.id)}>Delete</button>}
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Project Understanding Workspace View */}
            {quoteView === 'project_understanding' && (
              <ProjectUnderstandingWorkspace
                onStartBlankQuote={() => setQuoteView('create')}
                onBuildQuoteSuccess={handleBuildQuoteEditorNavigation}
                onCancel={handleCancelQuote}
                accessToken={session?.access_token}
                clientContext={{
                  id: qClientId,
                  name: qClientName,
                  email: qClientEmail,
                  address: qClientAddress,
                  isFirstQuoteFlow,
                }}
              />
            )}

            {/* Quote Create / Edit View */}
            {(quoteView === 'create' || quoteView === 'edit') && (
              <div className="quote-editor-host animate-fade-in">
                <QuoteEditorSharedProvider key={quoteEditorGeneration} value={quoteSharedContract}>
                  <QuotePresentationBoundary key="quote-presentation-boundary">
                  <QuoteEditorProfessional key="professional-quote-editor-fallback" />
                  
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
              <div className="dashboard-document-ledger" data-document-type="invoice" data-has-documents={getActiveInvoices().length > 0}>
                <div className="document-ledger-header">
                  <div><h1>Invoices</h1><p>Client documents, due dates, and settlement.</p></div>
                  <div className="document-ledger-header-actions">
                    <DocumentLedgerImageToggle showImages={invoiceLedgerImagesVisible} onToggle={() => setInvoiceLedgerImagesVisible((visible) => !visible)} />
                    <button type="button" className="document-ledger-quiet-action document-ledger-batch-unavailable"
                      onClick={() => {
                        setModalProps({
                          title: "Batch export is coming soon",
                          description: "Batch invoice export is planned for Studio and is not available for purchase yet.",
                          lockedFeatureValue: "Batch Invoice PDF Export",
                          limit: "batch_export",
                          source: "batch_export_gate",
                          targetPlan: "support"
                        });
                        setActiveModal('upgrade');
                      }}
                    >Batch Export</button>
                    <button type="button" onClick={initCreateInvoice} className="document-ledger-new-action">+ New invoice</button>
                  </div>
                </div>
                {isInvoicesLoading ? (
                  <DocumentLedgerState kind="loading" documentType="invoice" />
                ) : getActiveInvoices().length === 0 ? (
                  <DocumentLedgerState kind="empty" documentType="invoice" error={Boolean(invoicesError)} onCreate={initCreateInvoice} />
                ) : (
                  <div className="document-ledger-list" aria-label="Invoices">
                    <DocumentLedgerColumns showImages={invoiceLedgerImagesVisible} documentType="invoice" />
                    {getActiveInvoices().map((inv) => {
                      const detail = getDocumentLedgerDetails(inv, 'invoice', quotes, referenceInstant);
                      const ledgerContextId = `invoice-ledger-${inv.id}`;
                      const payment = invoicePayment(inv);
                      const settlementStatus = inv.status === 'draft' ? 'draft' : payment.payment_status;
                      const isOverdue = inv.status !== 'draft' && settlementStatus !== 'paid' && payment.is_overdue;
                      return (
                        <div key={inv.id} className="document-ledger-row">
                          <button type="button" className={`document-ledger-entry document-ledger-grid${invoiceLedgerImagesVisible ? ' document-ledger-with-images' : ''}`} aria-label={`Open invoice ${inv.invoice_number || inv.id}`} aria-describedby={`${ledgerContextId}-project ${ledgerContextId}-client ${ledgerContextId}-date ${ledgerContextId}-amount ${ledgerContextId}-status`} onClick={() => {
                            openDocument({ documentType: 'invoice', id: inv.id });
                          }}>
                            {invoiceLedgerImagesVisible && <span className="document-ledger-cover"><img src={detail.coverSrc} alt="" loading="lazy" /></span>}
                            <span id={`${ledgerContextId}-project`} className="document-ledger-project"><strong>{inv.invoice_number || 'Invoice'}</strong><span className="document-ledger-project-title">{detail.title}</span><span className="document-ledger-category">{detail.category}</span></span>
                            <span id={`${ledgerContextId}-client`} className="document-ledger-client"><strong>{inv.client_name || 'Client not specified'}</strong>{inv.client_email && <span>{inv.client_email}</span>}</span>
                            <span id={`${ledgerContextId}-date`} className="document-ledger-date"><span>Issued {formatDashboardDate(inv.invoice_date || inv.created_at) || '—'}</span><span>Due {formatDashboardDate(inv.due_date) || '—'}</span></span>
                            <span id={`${ledgerContextId}-amount`} className="document-ledger-amount"><span className="document-ledger-mobile-label">Total</span>{formatDocumentLedgerMoney(inv)}</span>
                            <span id={`${ledgerContextId}-status`} className="document-ledger-status-cell"><DocumentLedgerStatus status={settlementStatus} />{isOverdue && <span className="document-ledger-urgency">Overdue</span>}</span>
                          </button>
                          {(['unpaid', 'partial'].includes(settlementStatus) || !hasRecordedInvoicePayment(inv) || inv.payment_link) && (
                            <details className="document-ledger-overflow" onClick={(event) => { event.stopPropagation(); if (event.target.closest('button, a')) event.currentTarget.removeAttribute('open'); }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.removeAttribute('open'); }} onKeyDown={(event) => { if (event.key === 'Escape') { event.currentTarget.removeAttribute('open'); event.currentTarget.querySelector('summary')?.focus(); } }}>
                              <summary aria-label={`Actions for invoice ${inv.invoice_number || inv.id}`}><span aria-hidden="true">···</span></summary>
                              <div className="document-ledger-menu">
                                {['unpaid', 'partial'].includes(settlementStatus) && <button type="button" onClick={() => openRecordPaymentModal(inv)} disabled={isRecordingPayment}>{isRecordingPayment ? 'Recording...' : 'Record Payment'}</button>}
                                {inv.payment_link && <a href={inv.payment_link} target="_blank" rel="noreferrer">Client Link</a>}
                                {!hasRecordedInvoicePayment(inv) && <button type="button" className="document-ledger-delete" onClick={() => handleDeleteInvoice(inv.id)}>Delete</button>}
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Invoice Create / Edit View */}
            {(invoiceView === 'create' || invoiceView === 'edit') && (
              <div className="invoice-workspace animate-fade-in" ref={invoiceWorkspaceRef} aria-busy={isSaving}>
                {showInvoiceLeaveDialog && createPortal(<div className="invoice-leave-overlay">
                  <section className="invoice-leave-dialog" ref={invoiceLeaveDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="invoice-leave-title" aria-describedby="invoice-leave-description">
                    <h2 id="invoice-leave-title">Save your invoice changes?</h2>
                    <p id="invoice-leave-description">Your invoice has unsaved changes. Save them before leaving, discard them, or continue editing.</p>
                    {formError && <p role="alert" tabIndex={-1}>{formError}</p>}
                    <div>
                      <button type="button" data-invoice-continue disabled={isSaving} onClick={() => { invoiceNavigationRef.current = null; setShowInvoiceLeaveDialog(false); }}>Continue editing</button>
                      <button type="button" disabled={isSaving} onClick={resumeInvoiceNavigation}>Discard changes</button>
                      <button type="button" disabled={isSaving || isSelectedInvoiceSettled} onClick={async () => {
                        if (await handleSaveInvoice({ showCompletion: false })) resumeInvoiceNavigation();
                      }}>{isSaving ? 'Saving…' : 'Save and leave'}</button>
                    </div>
                  </section>
                </div>, document.body)}
                <header className="invoice-workspace-toolbar non-printing" aria-label="Invoice editor toolbar">
                  <div className="invoice-editor-location"><span>Invoices</span><span aria-hidden="true">/</span><h2>{isSelectedInvoiceSettled ? `View Invoice ${invNumber}` : invNumber}</h2></div>
                  {!isSelectedInvoiceSettled && renderInvoiceFlowStepper()}
                  <div className="invoice-editor-navigation">
                    <button type="button" disabled={isSaving} onClick={handleCancelInvoice}>Back to invoices</button>
                    <button type="button" disabled={isSaving} onClick={handleExitInvoiceFlow}>Dashboard</button>
                  </div>
                </header>
                <div className="invoice-document-workspace" role="region" aria-label="Invoice document workspace" tabIndex={0}>
                {invoiceFlowStage !== 'create' && <h1 className="invoice-sr-only" data-invoice-stage-heading tabIndex={-1}>{invoiceFlowStage === 'preview' ? 'Review invoice' : invoiceFlowStage === 'paid' ? 'Payment recorded' : 'Invoice marked sent'}</h1>}
                {invoiceView === 'create' && !session && (
                  <div className="invoice-workspace-notice">
                    <span className="product-state-mark">Info</span>
                      <span>You don&apos;t need an account to start. Create and preview your client document, then sign up or sign in to save it to your account or download the PDF with export access. Draft PDF downloads don&apos;t require saving first. Note: The form is pre-filled with sample data (e.g. Acme Corporation) to demonstrate the layout. Replace these fields with your own details.</span>
                  </div>
                )}

                {formError && (
                  <div className="invoice-workspace-notice is-error" role="alert" tabIndex={-1}>
                    <strong>{formError}</strong>
                  </div>
                )}
                {formSuccess && <div className="invoice-workspace-notice is-success" role="status">{formSuccess}</div>}
                {invoiceNotificationText && <div className="invoice-workspace-notice" role="status">{invoiceNotificationText}</div>}
                {invoiceCommercialReadonly && !isSelectedInvoiceSettled && !invoiceNotificationText && <div className="invoice-workspace-notice" role="status">Read only · Saved document. An unchanged approved invoice may still be sent when verified.</div>}
                {isSelectedInvoiceSettled && invoiceFlowStage === 'create' && <div className="invoice-workspace-notice is-success" role="status">Read only · Recorded payment</div>}
                {showPaymentWaitingBanner && invoiceFlowStage === 'send' && <div className="invoice-workspace-notice" role="status">Waiting for client review</div>}

                {invoiceFlowStage === 'preview' && (
                  <div className="invoice-stage-panel">
                    {renderInvoiceReadonlyPreview()}

                  </div>
                )}

                {invoiceFlowStage === 'send' && (
                  <div className="invoice-stage-panel">
                    {renderInvoiceReadonlyPreview({ compact: true })}

                  </div>
                )}

                {invoiceFlowStage === 'paid' && (
                  <div className="invoice-stage-panel">
                    {renderInvoiceTimeline(getSelectedInvoice() || { status: invStatus }, referenceInstant, paymentOptions)}
                    {renderInvoiceReadonlyPreview({ compact: true })}
                    <div className="invoice-workspace-notice is-success" role="status">
                      Completed document recorded as a read-only state.
                    </div>

                  </div>
                )}


                <div className="dashboard-grid-2col invoice-editor-grid" hidden={invoiceFlowStage !== 'create'}>
                  {renderInvoicePaper()}

                </div>
                      {/* Measurable canonical Invoice source; never display:none. */}
                      <div className="invoice-pdf-render-target" aria-hidden="true">
                        <InvoiceClientDocument document={invoiceClientDocument} print />
                      </div>

                </div>
                <div className="invoice-editor-actions">
                <div className="invoice-export-action" data-export-state={pdfExportError?.elementId === 'printable-invoice' && pdfExportError.name === `invoice_${invNumber}` && pdfExportError.message ? 'error' : !canExportPdf ? 'access' : 'ready'}>
                <ExportDownloadAction
                  documentType="invoice" number={invNumber}
                  pending={isDownloadingPdf} canExport={canExportPdf} branding={hasCleanPdf ? 'clean' : 'branded'}
                  error={pdfExportError?.elementId === 'printable-invoice' && pdfExportError.name === `invoice_${invNumber}` ? pdfExportError.message : ''}
                  onDownload={() => handleExportAttempt('printable-invoice', `invoice_${invNumber}`, invId)}
                />
                </div>
                  <div className="invoice-footer-controls">
                    {invId && !isDemo && !previewMode && <button type="button" className="btn btn-secondary" disabled={isSaving || isCheckingInvoiceStatus} onClick={handleCheckInvoiceStatus}>{isCheckingInvoiceStatus ? 'Checking status…' : 'Check status'}</button>}
                    {invoiceFlowStage === 'create' && !isSelectedInvoiceSettled && (
                      <>
                      {isSaving && <div className="invoice-save-guidance" role="status"><p>Saving your invoice…</p></div>}
                      <div className="invoice-stage-action-group">
                        <button type="button" onClick={() => handleSaveInvoice({ exitAfterSave: true })} disabled={isSaving || invoiceCommercialReadonly} className="btn btn-secondary">{isSaving ? 'Saving...' : 'Save invoice'}</button>
                        <button type="button" disabled={isSaving} onClick={goToInvoicePreview} className="btn btn-primary">Continue to preview <span aria-hidden="true">→</span></button>
                      </div>
                      </>
                    )}
                    {invoiceFlowStage === 'preview' && (
                    <div className="invoice-stage-actions">
                      {!isSelectedInvoiceSettled && <button type="button" disabled={isSaving || invoiceCommercialReadonly} onClick={() => handleSaveInvoice({ showCompletion: false })} className="btn btn-secondary">Save invoice</button>}
                      <button type="button" disabled={isSaving} onClick={() => setInvoiceFlowStage('create')} className="btn btn-secondary">Back to edit</button>
                      <button
                        type="button"
                        onClick={() => handleSaveInvoice({ advanceToSend: true, explicitRetry: invoiceRetryAvailable })}
                        disabled={isSaving || isSelectedInvoiceSettled || (Boolean(invId) && !isDemo && !previewMode && invoiceNotificationState?.eligibility?.can_send !== true && !invoiceRetryAvailable)}
                        className="btn btn-primary"
                      >
                        {isSaving ? 'Sending…' : invoiceRetryAvailable ? 'Retry notification' : 'Send Document'}
                      </button>
                    </div>
                    )}
                    {invoiceFlowStage === 'send' && (
                    <div className="invoice-stage-actions">
                      <button type="button" disabled={isSaving} onClick={() => setInvoiceFlowStage('preview')} className="btn btn-secondary">Back to preview</button>
                      <div className="invoice-stage-action-group">
                        <button type="button" onClick={handleExitInvoiceFlow} className="btn btn-secondary">Exit to dashboard</button>
                        <button
                          type="button"
                          onClick={() => openRecordPaymentModal(invoices.find((invoice) => invoice.id === invId) || { id: invId, currency: invCurrency, total: 0 })}
                          className="btn btn-primary"
                          >
                          Record Payment
                        </button>
                      </div>
                    </div>
                    )}
                    {invoiceFlowStage === 'paid' && (
                    <button type="button" onClick={handleExitInvoiceFlow} className="btn btn-primary">
                      Exit to dashboard
                    </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          )
        )}

        {activeTab === 'clients' && (
          !session && !isSandboxMode ? (
            renderGuestLockState('Clients Directory', 'Save client details for your documents.')
          ) : activeTheme === 'studio' ? (
            <StudioClientsEntry {...clientWorkspaceProps} />
          ) : (
            <ClientWorkspace {...clientWorkspaceProps} />
          )
        )}

        {/* The contextual owner workspace remains mounted across Harbor navigation to retain unsaved edits. */}
        {session && <div hidden={!['profile', 'portfolio', 'brand'].includes(activeTab)}>
          <PublicProfileWorkspace key={session.user.id}
            onFocusedEditingChange={setProfileFocused}
            accountId={session.user.id} accessToken={session.access_token} plan={user?.plan || 'free'}
            crm={entitlements.crm === true} permissionsReady={entitlementReady}
            isCurrentActor={id => sessionRef.current?.user?.id === id}
            mode={mode} saveProfile={saveCardProfile} initialProfile={mode === 'live' ? null : cardProfile} />
          <details className="pp-account-settings"><summary>Account timezone &amp; privacy settings</summary>
            <BusinessTimezoneSetting key={user?.id || session.user.id}
              businessTimezone={user?.business_timezone} accessToken={session?.access_token}
              onSaved={value => setUser(current => current ? { ...current, business_timezone: value } : current)} />

            <section className="card" aria-labelledby="learning-preference-heading" style={{ padding: '20px 24px', marginBottom: '24px' }}>
              <h2 id="learning-preference-heading" style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 8px' }}>Privacy &amp; Data</h2>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontWeight: 700 }}>
                <input
                  type="checkbox"
                  aria-label="Help improve Corvioz Intelligence"
                  checked={user?.intelligence_learning_opt_in === true}
                  disabled={typeof user?.intelligence_learning_opt_in !== 'boolean' || isSavingLearningPreference}
                  onChange={handleLearningPreferenceChange}
                />
                <span>Help improve Corvioz Intelligence</span>
              </label>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '8px 0 0 27px' }}>
                Participation is optional and off by default; collection also requires Corvioz’s global server-side gate. If enabled, privacy-minimized structured workflow and decision signals may be collected to improve Corvioz and Photography Intelligence. Current learning telemetry excludes raw briefs, client details, and quote pricing. You can turn this preference off at any time.
              </p>
              <p role="status" aria-live="polite" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '8px 0 0 27px' }}>
                {isSavingLearningPreference
                  ? 'Saving… the displayed choice is still your last saved preference.'
                  : typeof user?.intelligence_learning_opt_in === 'boolean'
                    ? `Saved preference: ${user.intelligence_learning_opt_in ? 'On' : 'Off'}.`
                    : 'Loading your saved preference…'}
              </p>
              {learningPreferenceError && <p role="alert" style={{ fontSize: '0.78rem', color: 'var(--danger-text)', margin: '8px 0 0 27px' }}>{learningPreferenceError}</p>}
            </section>

          </details>
        </div>}
        {!session && activeTab === 'profile' && renderGuestLockState('Public Profile', 'Sign in to edit your public profile.')}

        {/* TAB 7: STUDIO SPACE */}
        {activeTab === 'studio' && (
          !session && !isSandboxMode ? (
            renderGuestLockState('Studio Space', 'Centralized client management for multiple client records, overdue management, and reminder communications.')
          ) : (
            <StudioSpace
              businessTimezone={user?.business_timezone}
              clients={getActiveClients()}
              invoices={invoices}
              quotes={quotes}
              leads={leads}
              getCurrencySymbol={getCurrencySymbol}
              triggerToast={triggerToast}
              isSandbox={isSandboxMode}
              isStudioPreview={false}
              clientWorkspaceProps={clientWorkspaceProps}
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
                  Share Feedback
                </h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.55 }}>
                  Tell us what broke, what felt unclear, or what we can improve.
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

      {suggestedActionDoc && (
        <div className="dashboard-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="card animate-fade-in dashboard-modal-card" style={{ maxWidth: '500px', width: '90%', padding: '32px', background: 'var(--background-card)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center' }}>
              <span className="product-state-mark">Done</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
              {suggestedActionDoc.type === 'invoice' ? suggestedActionDoc.simulated ? 'Sample Invoice Ready' : suggestedActionDoc.created === false ? 'Invoice Saved' : 'Invoice Ready!' : 'Quote Ready!'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 24px 0', lineHeight: 1.4 }}>
              {suggestedActionDoc.type === 'invoice' && suggestedActionDoc.simulated
                ? `Your sample Invoice #${suggestedActionDoc.number} is ready. No account data changed.`
                : suggestedActionDoc.type === 'invoice' && suggestedActionDoc.created === false
                ? `Your Invoice #${suggestedActionDoc.number} has been saved and verified. What would you like to do next?`
                : `Your document draft #${suggestedActionDoc.number} has been created successfully. What would you like to do next?`}
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
                <span>{suggestedActionDoc.type === 'invoice' ? 'Create Quote' : 'Create Invoice'}</span>
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
          isDownloadingPdf={isDownloadingPdf}
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
  isDownloadingPdf
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
            <span style={{ padding: '3px 8px', borderRadius: '99px', background: isDownloadingPdf ? '#2563eb' : 'rgba(255,255,255,0.05)', color: isDownloadingPdf ? '#fff' : '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
              PDF download: {isDownloadingPdf ? 'PENDING' : 'IDLE'}
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
