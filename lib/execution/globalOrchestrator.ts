import { shadowValidatePlanRead } from '../../src/core/state/planStateAdapter';
import { recordDecisionTelemetry } from '../../src/core/telemetry/decisionTelemetry';

/**
 * Global App State Orchestrator — Corvioz v10 Deterministic UI Decision Engine
 *
 * Unifies Identity, Business Stage Classifier, Studio OS, and Conversion Systems.
 * Enforces System Priority Hierarchy:
 *   1. identity (Highest)
 *   2. business_stage
 *   3. workspace_mode
 *   4. conversion_context (Lowest)
 */

const PRICING_IDENTITIES = ['free', 'starter', 'pro', 'studio'] as const;
const COPY_THEMES = ['starter', 'pro', 'studio'] as const;

export type PricingIdentityType = typeof PRICING_IDENTITIES[number];
export type IdentityType = PricingIdentityType | null;
type CopyThemeType = typeof COPY_THEMES[number];
export type BusinessStageType = 'freelancer' | 'business';
export type WorkspaceModeType = 'studio' | 'standard';
export type ConversionContextType = 'onboarding' | 'pricing' | 'checkout' | 'dashboard';

export interface AppState {
  identity: IdentityType;
  business_stage: BusinessStageType;
  workspace_mode: WorkspaceModeType;
  conversion_context: ConversionContextType;
}

function isPricingIdentity(value: string | null): value is PricingIdentityType {
  return Boolean(value && (PRICING_IDENTITIES as readonly string[]).includes(value));
}

function shadowPlanRead(label: string, legacyResult: string | null, options?: { activePlan?: string | null }) {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return;
  shadowValidatePlanRead(
    label,
    legacyResult,
    {
      explicitPlan: options?.activePlan,
      localStorage: window.localStorage,
      sessionStorage: window.sessionStorage,
    },
    label,
    console,
  );
}

function observeCTA(state: AppState, context: string, legacyOutput: string): string {
  recordDecisionTelemetry({
    source: 'lib/execution/globalOrchestrator.ts:getCTA',
    decisionType: 'CTA decision',
    legacyOutput,
    adapterOutput: {
      owner: 'lib/execution/globalOrchestrator.ts',
      output: legacyOutput,
      state,
      context,
    },
    tags: ['CTA', 'LOG_ONLY', 'v5.2.1'],
  });
  return legacyOutput;
}

/**
 * Gathers and resolves the current AppState based on runtime environment,
 * localStorage, active tier, page pathname, and developer debug overrides.
 */
export function resolveAppState(options?: {
  activePlan?: string | null;
  clientsCount?: number;
  invoicesCount?: number;
  hasOverdueInvoices?: boolean;
}): AppState {
  // SSR Safety Check
  if (typeof window === 'undefined') {
    return {
      identity: null,
      business_stage: 'freelancer',
      workspace_mode: 'standard',
      conversion_context: 'onboarding',
    };
  }

  // 1. Resolve Developer Debug Overrides first (sessionStorage keys set by debug overlay)
  const debugIdentity = window.sessionStorage.getItem('corvioz_debug_identity') as IdentityType;
  const debugStage = window.sessionStorage.getItem('corvioz_debug_business_stage') as BusinessStageType;
  const debugMode = window.sessionStorage.getItem('corvioz_debug_workspace_mode') as WorkspaceModeType;
  const debugContext = window.sessionStorage.getItem('corvioz_debug_conversion_context') as ConversionContextType;

  // 2. Resolve Identity
  let identity: IdentityType = null;
  if (isPricingIdentity(debugIdentity)) {
    identity = debugIdentity;
  } else {
    const storedIdentity = window.localStorage.getItem('corvioz_identity');
    if (isPricingIdentity(storedIdentity)) {
      identity = storedIdentity;
    } else {
      const plan = options?.activePlan || window.localStorage.getItem('corvioz_user_plan');
      shadowPlanRead('globalOrchestrator.identity', plan, options);
      if (isPricingIdentity(plan)) {
        identity = plan;
      }
    }
  }

  // 3. Resolve Business Stage (Classifier)
  let business_stage: BusinessStageType = 'freelancer';
  if (debugStage && ['freelancer', 'business'].includes(debugStage)) {
    business_stage = debugStage;
  } else {
    // Read from options parameters or calculate from local storage stats
    let cCount = options?.clientsCount ?? -1;
    let iCount = options?.invoicesCount ?? -1;
    let hasOverdue = options?.hasOverdueInvoices ?? false;

    if (cCount === -1 || iCount === -1) {
      try {
        const stats = JSON.parse(window.localStorage.getItem('corvioz_usage_stats') || '{}');
        if (cCount === -1) cCount = Number(stats.clientsCount || stats.client_count || 0);
        if (iCount === -1) iCount = Number(stats.invoicesCount || stats.invoice_count || 0);
        if (!hasOverdue) hasOverdue = Boolean(stats.hasOverdueInvoices || stats.has_overdue || false);
      } catch (_) {}
    }

    const isStudioMode = cCount >= 3 || iCount >= 5 || hasOverdue;
    business_stage = isStudioMode ? 'business' : 'freelancer';
  }

  // 4. Resolve Workspace Mode
  let workspace_mode: WorkspaceModeType = 'standard';
  if (debugMode && ['studio', 'standard'].includes(debugMode)) {
    workspace_mode = debugMode;
  } else {
    // Priority Rule: identity === 'studio' always overrides workspace_mode to 'studio'
    if (identity === 'studio') {
      workspace_mode = 'studio';
    } else {
      const plan = options?.activePlan || window.localStorage.getItem('corvioz_user_plan');
      shadowPlanRead('globalOrchestrator.workspace_mode', plan, options);
      if (plan === 'studio') {
        workspace_mode = 'studio';
      }
    }
  }

  // 5. Resolve Conversion Context
  let conversion_context: ConversionContextType = 'onboarding';
  if (debugContext && ['onboarding', 'pricing', 'checkout', 'dashboard'].includes(debugContext)) {
    conversion_context = debugContext;
  } else {
    const path = window.location.pathname;
    if (path.startsWith('/pricing')) {
      conversion_context = 'pricing';
    } else if (path.startsWith('/checkout')) {
      conversion_context = 'checkout';
    } else if (path.startsWith('/dashboard')) {
      conversion_context = 'dashboard';
    }
  }

  const resolved = {
    identity,
    business_stage,
    workspace_mode,
    conversion_context,
  };

  recordDecisionTelemetry({
    source: 'lib/execution/globalOrchestrator.ts:resolveAppState',
    decisionType: 'AppState resolution',
    legacyOutput: resolved,
    tags: ['APP_STATE', 'DRIFT', 'v5.2.2'],
  });

  return resolved;

}

/**
 * Unified CTA Engine — Resolves button actions deterministically.
 * CTA = f(identity, business_stage, context)
 *
 * Strict System Priority:
 *   - `identity` overrides everything else.
 *   - If `identity` is not a paid tier, resolves from `business_stage`.
 */
export function getCTA(
  state: AppState, 
  context: 'onboarding_primary' | 'pricing_select' | 'checkout_continue' | 'checkout_back' | 'dashboard_primary' | 'homepage_final' | 'navbar' | 'pricing_free' | 'pricing_starter' | 'pricing_pro' | 'pricing_studio'
): string {
  const { identity, business_stage } = state;

  // Render context-specific decisions
  if (context === 'checkout_continue') {
    return observeCTA(state, context, 'Continue to payment');
  }
  if (context === 'checkout_back') {
    return observeCTA(state, context, 'Go back');
  }

  // Plan-specific Pricing Page / Homepage Pricing Grid CTAs
  if (context === 'pricing_free') {
    if (identity === 'starter') return observeCTA(state, context, 'Start free with Starter');
    if (identity === 'pro') return observeCTA(state, context, 'Start free with Pro');
    if (identity === 'studio') return observeCTA(state, context, 'Start free with Studio');
    return observeCTA(state, context, 'Start Free');
  }
  if (context === 'pricing_starter') {
    return observeCTA(state, context, 'Get paid faster');
  }
  if (context === 'pricing_pro') {
    return observeCTA(state, context, 'Never miss a payment');
  }
  if (context === 'pricing_studio') {
    return observeCTA(state, context, 'Scale client operations');
  }

  // 1️⃣ Priority Level 1: identity override
  if (identity === 'starter') {
    return observeCTA(state, context, 'Get paid faster');
  }
  if (identity === 'pro') {
    return observeCTA(state, context, 'Never miss a payment');
  }
  if (identity === 'studio') {
    return observeCTA(state, context, 'Scale client operations');
  }

  // 2️⃣ Priority Level 2: business_stage resolution
  if (business_stage === 'business') {
    if (context === 'pricing_select') return observeCTA(state, context, 'Unlock studio scale');
    if (context === 'dashboard_primary') return observeCTA(state, context, 'Manage studio workload');
    return observeCTA(state, context, 'Scale client operations');
  }

  // Default freelancer resolution
  if (context === 'pricing_select') return observeCTA(state, context, 'Upgrade your business');
  if (context === 'dashboard_primary') return observeCTA(state, context, 'Create invoice');
  if (context === 'navbar') return observeCTA(state, context, 'Create Invoice');
  return observeCTA(state, context, 'Start freelancing safely');
}

// Copy pools organized by theme
const COPY_POOL = {
  starter: {
    homepage: {
      headline: 'Get Your First Client & Get Paid',
      lede: 'The direct milestone-to-payment engine for new freelancers. Pitch estimates, send simple invoices, and clear your very first payment with zero complexity.',
      trustBadge: '⚡ Starter Identity Active',
      trustMicrocopy: 'Safe way to send your first invoices',
      trustStripTitle: 'Beginner-safe billing layout designed to start freelancing safely',
      trustStripBullets: [
        'Zero bookkeeping setup complexity',
        'Instant 14-day risk-free refund window',
        'Local draft browser sandbox option',
        'Paddle-ready billing gateway'
      ],
      threeStepFlow: [
        { step: '① Pitch estimate', color: 'var(--text-soft)' },
        { step: '→', color: 'var(--text-muted)' },
        { step: '② Send invoice', color: 'var(--text-soft)' },
        { step: '→', color: 'var(--text-muted)' },
        { step: '③ Get Paid', color: 'var(--primary)' }
      ],
      featuresTitle: 'From Estimate to Paid Invoice',
      featuresLede: 'Draft milestone estimates, send simple invoices, and clear your first contract payment without complexity.',
      featuresList: [
        { title: 'Milestone estimates', text: 'Create clear, simple quotes for client approval.' },
        { title: 'Starter invoices', text: 'Send secure professional invoices for your first contract.' },
        { title: 'First payment tracking', text: 'Receive and track credit card or bank transfer settlements.' },
        { title: 'Client portal link', text: 'Give your client a clean portal to approve and view documents.' }
      ],
      profileTitle: 'Your Freelancer Business Card',
      profileLede: 'Create a shareable, simple services profile that helps your first client discover and hire you directly.',
      profileBullets: [
        'Single-column service list',
        'Direct email inquiry CTA',
        'Clean professional avatar card'
      ],
      showcaseTitle: 'Your Path to Getting Paid',
      showcaseLede: 'A direct outcome-based loop designed for new freelancers. From pitching to billing to clearing funds, Starter eliminates clutter so you can focus on what matters.',
      faqs: [
        {
          q: 'How does the Starter mode help me get my first client?',
          a: 'Starter mode is built to simplify the conversion loop. You can pitch milestone estimates, send simple professional invoices, and track your first payments with zero complexity.'
        },
        {
          q: 'Do I need a registered business to use Starter?',
          a: 'No. You can use your personal name, upload a profile photo, list your services, and start invoicing clients immediately as a sole proprietor.'
        },
        {
          q: 'Can I use Starter for free?',
          a: 'Yes. You can generate local draft invoices, export PDFs, and manage your first client workspace for free.'
        }
      ]
    },
    pricing: {
      headline: 'Get your first client',
      lede: 'No setup risk. Start freelancing safely.',
      kicker: 'SAFE WAY TO SEND YOUR FIRST INVOICES',
      cards: {
        free: {
          outcome: 'Spend less time on admin and start pitching projects.',
          features: ['Pitch custom estimates & quotes', 'Share your professional Bento card', 'Export watermarked proposal documents']
        },
        starter: {
          outcome: 'Get paid faster and present a polished brand.',
          features: ['Collect credit card or bank transfers instantly', 'Avoid billing delays with professional templates', 'Auto-fill client details on future documents']
        },
        pro: {
          outcome: 'Never lose another payment and secure repeat business.',
          features: ['Automate follow-ups on late payments', 'Build custom client portfolios to win repeat work', 'Qualify and capture prospective client inquiries']
        },
        studio: {
          outcome: 'Scale your operations and manage workflow complexity.',
          features: ['Brand client workspaces under your custom domain', 'Qualify inbound inquiries with budget filters', 'Present specialist team members to secure larger contracts']
        }
      },
      trustStripTitle: 'Beginner-safe billing layout designed to start freelancing safely',
      trustStripBullets: [
        'Zero bookkeeping setup complexity',
        'Instant 14-day risk-free refund window',
        'Local draft browser sandbox option',
        'Paddle-ready billing gateway'
      ],
      trustBadges: [
        'Safe way to send your first invoices',
        'No setup risk',
        'Cancel anytime in 1 click',
        '14-day zero-risk refund'
      ],
      cardTrustMicrocopy: 'No setup risk. Start freelancing safely.'
    },
    checkout: {
      heading: 'Unlock your Starter workspace',
      quote: '“Start your freelance journey safely”',
      bullets: [
        'Beginner-safe invoice tracking',
        'Direct client approved quote converter',
        'Instant 14-day full refund window'
      ],
      loadingHeader: 'Setting up your Starter workspace...',
      loadingDesc: 'Safe way to send your first invoices. No setup risk.',
      spinnerSub: 'Opening Starter checkout...'
    },
    dashboard: {
      title: 'Corvioz Starter OS',
      description: 'Get your first client faster. Create quotes, send invoices, and track payment status in one simple workspace.',
      badgeLabel: 'Freelancer Mode',
      nudgeTitle: 'Starter Workspace Ready',
      nudgeText: 'Pitch estimates and bill your first client safely without financial overhead.'
    }
  },
  pro: {
    homepage: {
      headline: 'Build Stable Freelance Income',
      lede: 'A complete business operation suite for professional freelancers. Capture inbound leads, send professional proposals, track your CRM pipeline, and secure repeat business.',
      trustBadge: '📈 Pro OS Active',
      trustMicrocopy: 'Secure client pipeline management',
      trustStripTitle: 'Client trust tools built to secure repeat business',
      trustStripBullets: [
        'Visual CRM pipeline status board',
        'Legally compliant proposal e-signatures',
        'Automated client reminder sequences',
        'Dedicated client portal hubs'
      ],
      threeStepFlow: [
        { step: '① CRM Intake', color: 'var(--text-soft)' },
        { step: '→', color: 'var(--text-muted)' },
        { step: '② Sign Proposal', color: 'var(--text-soft)' },
        { step: '→', color: 'var(--text-muted)' },
        { step: '③ Settle Invoice', color: 'var(--text-soft)' },
        { step: '→', color: 'var(--text-muted)' },
        { step: '④ Repeat Client', color: 'var(--success)' }
      ],
      featuresTitle: 'From Lead Capture to Retainer',
      featuresLede: 'Capture inbound inquiries, pitch professional proposals, sign contracts, and secure recurring freelance income.',
      featuresList: [
        { title: 'CRM Lead Capture', text: 'Capture visitor inquiries directly from your profile into your CRM pipeline.' },
        { title: 'Interactive proposals', text: 'Draft comprehensive milestone proposals for client e-signatures.' },
        { title: 'Automated billing rules', text: 'Set up milestone payments, auto-followups, and secure exports.' },
        { title: 'Dedicated client hubs', text: 'Maintain private portals for repeat business and category portfolios.' }
      ],
      profileTitle: 'Your Professional Services OS',
      profileLede: 'Display client testimonials, organize work categories, display availability tags, and capture CRM leads.',
      profileBullets: [
        'Featured portfolio work & categories',
        'Availability indicators & social proof',
        'Inbound lead capture form'
      ],
      showcaseTitle: 'Your Freelance Income Pipeline',
      showcaseLede: 'A complete freelancer business operating system. Scale from capturing inbound leads to proposing scopes, invoicing milestones, and building client relationships for repeat work.',
      faqs: [
        {
          q: 'How does the Pro mode help build stable income?',
          a: 'Pro mode includes pipeline CRM features, lead capture forms on your public profile, interactive proposals with milestone signatures, and automated billing rules for repeat clients.'
        },
        {
          q: 'How does the lead capture and CRM pipeline work?',
          a: 'When clients visit your public profile, they can submit quote requests. These inquiries flow directly into your CRM Kanban board as new inbound leads, allowing you to track them from pitch to payment.'
        },
        {
          q: 'Can I connect my own custom payment gateways?',
          a: 'Yes, in Pro mode you can configure custom payment schedules and attach links to bank transfers, check deposits, or card gateways in your portals.'
        }
      ]
    },
    pricing: {
      headline: 'Build stable freelance income',
      lede: 'Trusted by growing freelance professionals.',
      kicker: 'SECURE CLIENT PIPELINE MANAGEMENT',
      cards: {
        free: {
          outcome: 'Spend less time on admin and start pitching projects.',
          features: ['Pitch custom estimates & quotes', 'Share your professional Bento card', 'Export watermarked proposal documents']
        },
        starter: {
          outcome: 'Get paid faster and present a polished brand.',
          features: ['Collect credit card or bank transfers instantly', 'Avoid billing delays with professional templates', 'Auto-fill client details on future documents']
        },
        pro: {
          outcome: 'Never lose another payment and secure repeat business.',
          features: ['Automate follow-ups on late payments', 'Build custom client portfolios to win repeat work', 'Qualify and capture prospective client inquiries']
        },
        studio: {
          outcome: 'Scale your operations and manage workflow complexity.',
          features: ['Brand client workspaces under your custom domain', 'Qualify inbound inquiries with budget filters', 'Present specialist team members to secure larger contracts']
        }
      },
      trustStripTitle: 'Client trust tools built to secure repeat business',
      trustStripBullets: [
        'Visual CRM pipeline status board',
        'Legally compliant proposal e-signatures',
        'Automated client reminder sequences',
        'Dedicated client portal hubs'
      ],
      trustBadges: [
        'Secure client pipeline management',
        'Trusted by growing professionals',
        'Legally compliant e-signatures',
        'Client portal hubs'
      ],
      cardTrustMicrocopy: 'Trusted by growing freelance professionals.'
    },
    checkout: {
      heading: 'Unlock your Pro workspace',
      quote: '“You’re about to upgrade your income system”',
      bullets: [
        'CRM pipeline status board',
        'Legally compliant proposal e-signatures',
        'Automated client reminder sequences'
      ],
      loadingHeader: 'Initializing your Pro operating system...',
      loadingDesc: 'Secure client pipeline management. Trusted by growing freelance professionals.',
      spinnerSub: 'Opening Pro checkout...'
    },
    dashboard: {
      title: 'Corvioz Pro OS',
      description: 'Build stable freelance income. Monitor your pipeline, send proposals, invoice clients, and view analytics in one workspace.',
      badgeLabel: 'Freelancer Mode',
      nudgeTitle: 'Pro System Recommendation',
      nudgeText: 'Connect proposals with legally-binding e-signatures to secure payment terms.'
    }
  },
  studio: {
    homepage: {
      headline: 'Run Your Freelance Studio',
      lede: 'A unified command center for client operations. White-label your client delivery portal, display team profiles, showcase outcome case studies, and qualify high-budget inquiries.',
      trustBadge: '🚀 Studio OS Active',
      trustMicrocopy: 'Enterprise-grade studio infrastructure',
      trustStripTitle: 'Enterprise-grade infrastructure for studio operations',
      trustStripBullets: [
        'Custom domain white-labeling',
        'Specialist & collaborator rosters',
        'Multi-step budget screening filters',
        'Ledger export for professional accountants'
      ],
      threeStepFlow: [
        { step: '① Qualify Budget', color: 'var(--text-soft)' },
        { step: '→', color: 'var(--text-muted)' },
        { step: '② White-label Portals', color: 'var(--text-soft)' },
        { step: '→', color: 'var(--text-muted)' },
        { step: '③ Team Delivery', color: 'var(--text-soft)' },
        { step: '→', color: 'var(--text-muted)' },
        { step: '④ Scale Operations', color: 'var(--accent)' }
      ],
      featuresTitle: 'From Scoping Inquiry to Scale',
      featuresLede: 'Qualify budgets, coordinate specialist team delivery, and manage client operations like an studio.',
      featuresList: [
        { title: 'Multi-Step Inquiry Flow', text: 'Qualify prospective client budgets and requirements before scoping.' },
        { title: 'Team Delivery Portal', text: 'Coordinate active milestones with specialist team members.' },
        { title: 'White-Labeled Domain', text: 'Apply custom color schemes, logos, and custom domains.' },
        { title: 'Automation command center', text: 'Leverage automated payment reminders and pipeline analytics.' }
      ],
      profileTitle: 'Your Studio Brand Kit Showcase',
      profileLede: 'Cohesively showcase studio case study metrics, media embeds, outcomes, and present your specialist team.',
      profileBullets: [
        'White-labeled portal branding & kit',
        'Case studies & outcome metrics',
        'Specialists team presentation roster'
      ],
      showcaseTitle: 'Studio Operations System',
      showcaseLede: 'Scale your operation, unify your client relationships, white-label your delivery workspace, build a cohesive custom studio brand kit, and automate business pro.',
      faqs: [
        {
          q: 'How does the Studio mode support studio operations?',
          a: 'Studio is designed for teams and multi-client setups. It provides white-labeled client workspaces, custom domain integration, specialist profiles for team rosters, and inquiry budget thresholds.'
        },
        {
          q: 'Can I white-label my client portal with a custom domain?',
          a: 'Yes. With Studio, you can map your portals to clients.yourstudio.com with custom logos and color profiles.'
        },
        {
          q: 'How do specialists team rosters work?',
          a: 'You can invite freelancers or contractors to join your studio workspace. They get specialist profiles, and clients can see who is assigned to their project milestones.'
        }
      ]
    },
    pricing: {
      headline: 'Run your freelance studio',
      lede: 'Built for multi-client operations at scale.',
      kicker: 'ENTERPRISE-GRADE STUDIO INFRASTRUCTURE',
      cards: {
        free: {
          outcome: 'Spend less time on admin and start pitching projects.',
          features: ['Pitch custom estimates & quotes', 'Share your professional Bento card', 'Export watermarked proposal documents']
        },
        starter: {
          outcome: 'Get paid faster and present a polished brand.',
          features: ['Collect credit card or bank transfers instantly', 'Avoid billing delays with professional templates', 'Auto-fill client details on future documents']
        },
        pro: {
          outcome: 'Never lose another payment and secure repeat business.',
          features: ['Automate follow-ups on late payments', 'Build custom client portfolios to win repeat work', 'Qualify and capture prospective client inquiries']
        },
        studio: {
          outcome: 'Scale your operations and manage workflow complexity.',
          features: ['Brand client workspaces under your custom domain', 'Qualify inbound inquiries with budget filters', 'Present specialist team members to secure larger contracts']
        }
      },
      trustStripTitle: 'Enterprise-grade infrastructure for studio operations',
      trustStripBullets: [
        'Custom domain white-labeling',
        'Specialist & collaborator rosters',
        'Multi-step budget screening filters',
        'Ledger export for professional accountants'
      ],
      trustBadges: [
        'Enterprise-grade studio infrastructure',
        'Built for multi-client operations',
        'White-labeled client portals',
        'Multi-step budget screening'
      ],
      cardTrustMicrocopy: 'Built for multi-client operations at scale.'
    },
    checkout: {
      heading: 'Unlock your Studio workspace',
      quote: '“You’re scaling to studio-level operations”',
      bullets: [
        'White-labeled client workspace',
        'Team roster delivery slots',
        'Inquiry budget threshold qualification'
      ],
      loadingHeader: 'Scaling to Studio infrastructure...',
      loadingDesc: 'Enterprise-grade studio infrastructure. Built for multi-client operations at scale.',
      spinnerSub: 'Opening Studio checkout...'
    },
    dashboard: {
      title: 'Corvioz Studio OS',
      description: 'Win clients, generate milestone quotes, send professional invoices, and secure payments in one workspace.',
      badgeLabel: 'Business Mode',
      nudgeTitle: 'Studio Workspace Active',
      nudgeText: 'Run white-labeled client workspaces, coordinate team lists, and manage multiple operations.'
    }
  }
};

/**
 * Global Copy Resolver — Maps AppState variables to copy blocks.
 * copy = resolveCopy(state, page)
 *
 * Strict System Priority:
 *   - `identity` overrides copy tone.
 *   - If `identity` is not a paid tier, resolves from `business_stage`:
 *     - 'business' stage defaults to 'studio' copy (studio tone).
 *     - 'freelancer' stage defaults to 'starter' copy (beginner safety tone).
 */
export function resolveCopy(state: AppState, page: 'homepage' | 'pricing' | 'checkout' | 'dashboard') {
  const { identity, business_stage } = state;

  let activeTheme: CopyThemeType = 'starter';

  if (identity && identity !== 'free') {
    activeTheme = identity;
  } else {
    activeTheme = business_stage === 'business' ? 'studio' : 'starter';
  }

  return COPY_POOL[activeTheme][page];
}
