'use client';

/**
 * GLOBAL UX PRINCIPLES:
 * RULE 1: Every screen must have ONE primary action only
 * RULE 2: Every monetization event must be observable (never silent)
 * RULE 3: First invoice must never be blocked
 * RULE 4: Pricing message must match outcome promise
 * RULE 5: Remove all competing CTAs above fold
 *
 * useRevenueAction — Corvioz v5.95 Revenue Action Hook
 *
 * Adapter layer that bridges the Dashboard component API
 * (evaluateAction / activeModal / modalProps) to the new
 * Revenue Control Plane backend (/api/revenue/control-plane).
 *
 * This hook replaces all previous local paywall triggers and
 * hardcoded frontend business logic. ALL revenue decisions
 * now come exclusively from the backend decision engine.
 *
 * Compatible with: Dashboard.js (existing API unchanged)
 * Internally uses: useRevenueDecision → /api/revenue/control-plane
 *
 * Modes:
 *   live    → real API evaluation
 *   demo    → mocked decisions, same schema
 *   preview → read-only, no blocking
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveSelectedPlan } from '@/app/lib/intent-store';
// Telemetry layer purged - UI is pure render only
const trackEvent = () => {};
import { trackUpgradeClick } from 'lib/monetization/revenueEvents';
import { useRevenueDecision } from '@/app/lib/revenue/useRevenueDecision';
import { shadowValidatePlanRead } from '@/core/state/planStateAdapter';
import { shadowReadDecisionState } from '@/core/decision/decisionAdapter';

// ── Action name normalization ─────────────────────────────────────────────────
// Maps Dashboard.js action names → Control Plane event names
const ACTION_EVENT_MAP = {
  create_invoice: 'create_invoice',
  create_quote: 'create_quote',
  export_pdf: 'export_pdf',
  pricing_cta: 'pricing_cta',
  upgrade_cta: 'upgrade_cta',
  send_invoice: 'send_invoice',
  client_portal: 'client_portal',
  repeat_dashboard_without_payment: 'upgrade_cta',
};

function normalizeEvent(actionName) {
  return ACTION_EVENT_MAP[actionName] ?? actionName;
}

function normalizePlanForAnalytics(plan) {
  const normalized = String(plan || 'free').toLowerCase();
  if (normalized === 'studio') return 'studio';
  if (normalized === 'starter') return 'starter';
  if (normalized === 'pro') return 'pro';
  return 'free';
}

// ── Modal title / description helpers (same as before) ───────────────────────
function getUpgradeModalProps(actionName, decisionMessage, decision = null) {
  const titleMap = {
    create_invoice: 'Get paid faster with Starter',
    create_quote: 'Pitch projects with professional quotes',
    send_invoice: 'Never lose another payment',
    client_portal: 'Build client trust with professional workspaces',
  };
  const descMap = {
    create_invoice: 'Get paid faster and present a polished brand',
    create_quote: 'Pitch proposals with clear project milestones',
    send_invoice: 'Avoid payment delays with automated reminders',
    client_portal: 'Secure client approvals via professional portal links',
  };

  return {
    title: titleMap[actionName] ?? 'Premium Feature Gated',
    description: decisionMessage || 'This action is available on Pro.',
    lockedFeatureValue: descMap[actionName] ?? 'Full professional freelancer workspace access',
    limit: actionName,
    source: `${actionName}_intercept`,
    explanation: decision?.showExplanation ? decision.explanation : null,
    intentBreakdown: decision?.intentBreakdown ?? null,
  };
}

// ── Main Hook ─────────────────────────────────────────────────────────────────

export function useRevenueAction(user, usageStats = {}) {
  const router = useRouter();

  const invoicesCount = usageStats.invoicesCount || 0;
  const quotesCount = usageStats.quotesCount || 0;
  const exportAttempts = usageStats.exportAttempts || usageStats.exportCount || 0;

  // Detect operating mode from user plan context
  const isSandbox =
    typeof window !== 'undefined' &&
    window.sessionStorage.getItem('corvioz_sandbox_mode') === 'true';

  const mode = isSandbox ? 'demo' : 'live';

  // New control-plane decision hook
  const { evaluate } = useRevenueDecision({ mode });

  // Modal state (kept identical to previous API so Dashboard.js is unchanged)
  const [activeModal, setActiveModal] = useState(null); // 'upgrade' | 'export' | 'pricing_upsell' | 'redirect_overlay' | null
  const [modalProps, setModalProps] = useState({});
  const [bannerMessage, setBannerMessage] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Track component mount time for intent-score estimation
  const mountTimeRef = useRef(0);
  useEffect(() => {
    mountTimeRef.current = Date.now();
  }, []);

  // ── Main evaluateAction (same signature as before) ────────────────────────
  const evaluateAction = useCallback(
    async (actionName, onSuccess, details = {}) => {
      setIsEvaluating(true);

      // Derive simple baseline intent signals (TASK 3: Intent scoring removed)
      const intentScore = 0;
      const pricingViewCount = 0;
      const sessionTime = 0;

      // Detect first-time actions (safety rule: first invoice/quote is never blocked)
      const isFirstInvoice = actionName === 'create_invoice' && invoicesCount === 0;
      const isFirstQuote = actionName === 'create_quote' && quotesCount === 0;
      const isProtected = isFirstInvoice || isFirstQuote;

      // Check session limit for monetization prompts
      const hasShownPromptThisSession = typeof window !== 'undefined' && 
                                        window.sessionStorage.getItem('corvioz_monetization_prompt_shown') === 'true';
      const isExplicitExportSend = actionName === 'export_pdf' || actionName === 'send_invoice';
      const userPlan = user?.plan || 'free';
      const analyticsPlan = normalizePlanForAnalytics(userPlan);
      const promptCount = hasShownPromptThisSession ? 1 : 0;
      if (process.env.NODE_ENV !== 'production') {
        shadowValidatePlanRead(
          'useRevenueAction.user_plan',
          userPlan,
          {
            userId: user?.id,
            serverPlan: userPlan,
            localStorage: typeof window !== 'undefined' ? window.localStorage : null,
            sessionStorage: typeof window !== 'undefined' ? window.sessionStorage : null,
          },
          'src/hooks/useRevenueAction.js:user.plan',
          console,
        );
      }

      try {
        if (actionName === 'export_pdf') {
          trackEvent('export_attempt', {
            source: details.source || 'dashboard_export',
            export_target: details.export_target || 'pdf',
            document_type: details.document_type || 'invoice',
            user_plan: analyticsPlan,
            watermark_expected: analyticsPlan === 'free',
          });
        }

        const decision = await evaluate({
          event: normalizeEvent(actionName),
          invoices_count: invoicesCount,
          quotes_count: quotesCount,
          intent_score: intentScore,
          pricing_view_count: pricingViewCount,
          export_attempts: exportAttempts + (actionName === 'export_pdf' ? 1 : 0),
          session_time: sessionTime,
          is_first_action: isProtected,
          user_plan: userPlan,
          is_authenticated: Boolean(user?.id || user?.email),
          session_id: typeof window !== 'undefined' ? (window.sessionStorage.getItem('corvioz_session_id') || '') : '',
          monetization_prompt_count: promptCount,
          has_seen_monetization_prompt: hasShownPromptThisSession,
          explicit_retry: Boolean(hasShownPromptThisSession && isExplicitExportSend),
          ...details,
        });
        if (process.env.NODE_ENV !== 'production') {
          shadowReadDecisionState(
            `useRevenueAction.${actionName}`,
            decision,
            {
              userId: user?.id,
              planState: { userId: user?.id, serverPlan: userPlan },
              revenue: {
                action_type: normalizeEvent(actionName),
                funnel_step: details.funnel_step || actionName,
                intent_score: intentScore,
                user_state: userPlan,
                usage_count: {
                  invoice_create_count: invoicesCount,
                  quote_create_count: quotesCount,
                  export_pdf_count: exportAttempts + (actionName === 'export_pdf' ? 1 : 0),
                },
                session_state: {
                  pricing_view_count: pricingViewCount,
                  export_attempt_count: exportAttempts + (actionName === 'export_pdf' ? 1 : 0),
                },
              },
            },
            'src/hooks/useRevenueAction.js:useRevenueDecision.evaluate',
            console,
          );
        }

        // ── Handle redirects ─────────────────────────────────────────────────
        if (decision.redirectUrl && !decision.shouldProceed) {
          if (hasShownPromptThisSession && !isExplicitExportSend) {
            console.log(`[useRevenueAction] Session limit reached. Bypassing redirect for action: "${actionName}"`);
            if (onSuccess) onSuccess(true);
            setIsEvaluating(false);
            return true;
          }
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('corvioz_monetization_prompt_shown', 'true');
          }
          setModalProps({
            explanation: decision.showExplanation ? decision.explanation : null,
            intentBreakdown: decision.intentBreakdown,
          });
          setActiveModal('redirect_overlay');
          setTimeout(() => {
            router.push(decision.redirectUrl);
            setActiveModal(null);
          }, 1400);
          setIsEvaluating(false);
          return false;
        }

        // ── Handle modals ────────────────────────────────────────────────────
        if (decision.showModal) {
          if (hasShownPromptThisSession && !isExplicitExportSend) {
            console.log(`[useRevenueAction] Session limit reached. Bypassing modal for action: "${actionName}"`);
            if (onSuccess) onSuccess(true);
            setIsEvaluating(false);
            return true;
          }
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('corvioz_monetization_prompt_shown', 'true');
          }

          if (decision.modalType === 'export' || actionName === 'export_pdf') {
            setModalProps({
              onDownloadFree: () => {
                if (onSuccess) onSuccess(false); // allowed but watermarked
              },
              source: `${details.document_type || 'invoice'}_export_upsell`,
              explanation: decision.showExplanation ? decision.explanation : null,
              intentBreakdown: decision.intentBreakdown,
              documentType: details.document_type || 'invoice',
            });
            setActiveModal('export');
          } else if (decision.modalType === 'upgrade') {
            setModalProps(getUpgradeModalProps(actionName, decision.reason, decision));
            setActiveModal('upgrade');
          } else {
            setModalProps({
              explanation: decision.showExplanation ? decision.explanation : null,
              intentBreakdown: decision.intentBreakdown,
              source: `${actionName}_pricing_upsell`,
            });
            setActiveModal('pricing_upsell');
          }

          // Export soft paywalls must never auto-run premium export behavior.
          if (decision.shouldProceed && onSuccess && actionName !== 'export_pdf') {
            onSuccess(true);
          }

          setIsEvaluating(false);
          return decision.shouldProceed;
        }

        // ── Handle hard block ────────────────────────────────────────────────
        if (!decision.shouldProceed) {
          if (hasShownPromptThisSession && !isExplicitExportSend) {
            console.log(`[useRevenueAction] Session limit reached. Bypassing block for action: "${actionName}"`);
            if (onSuccess) onSuccess(true);
            setIsEvaluating(false);
            return true;
          }
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('corvioz_monetization_prompt_shown', 'true');
          }
          setModalProps(getUpgradeModalProps(actionName, decision.reason, decision));
          setActiveModal('upgrade');
          setIsEvaluating(false);
          return false;
        }

        // ── Allow: proceed normally ──────────────────────────────────────────
        setBannerMessage('');
        if (onSuccess) onSuccess(true);
        setIsEvaluating(false);
        return true;
      } catch (err) {
        console.error('[useRevenueAction] Decision evaluation error, blocking client-side continuation:', err);
        setBannerMessage('We could not verify access right now. Please try again.');
        setIsEvaluating(false);
        return false;
      }
    },
    [evaluate, invoicesCount, quotesCount, exportAttempts, router, user],
  );

  return {
    evaluateAction,
    activeModal,
    setActiveModal,
    modalProps,
    setModalProps,
    bannerMessage,
    setBannerMessage,
    isEvaluating,
  };
}
