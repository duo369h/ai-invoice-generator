import { shadowValidatePlanRead } from '../../src/core/state/planStateAdapter';
import { recordDecisionTelemetry } from '../../src/core/telemetry/decisionTelemetry';
import { getUnifiedDecision } from './unifiedDecisionEngine';

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

    if (cCount !== -1 && iCount !== -1) {
      const isStudioMode = cCount >= 3 || iCount >= 5 || hasOverdue;
      business_stage = isStudioMode ? 'business' : 'freelancer';
    } else {
      const userId = typeof window !== 'undefined' ? window.localStorage.getItem('corvioz_user_id') : null;
      const decision = getUnifiedDecision(userId);
      business_stage = decision.recommendedPlan === 'studio' ? 'business' : 'freelancer';
    }
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
    return observeCTA(state, context, 'Choose Starter');
  }
  if (context === 'pricing_pro') {
    return observeCTA(state, context, 'Choose Pro');
  }
  if (context === 'pricing_studio') {
    return observeCTA(state, context, 'Scale client operations');
  }

  // 1️⃣ Priority Level 1: identity override
  if (identity === 'starter') {
    return observeCTA(state, context, 'Organize client delivery');
  }
  if (identity === 'pro') {
    return observeCTA(state, context, 'Keep client follow-up organized');
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
  if (context === 'dashboard_primary') return observeCTA(state, context, 'Create document');
  if (context === 'navbar') return observeCTA(state, context, 'Create Document');
  return observeCTA(state, context, 'Start Workspace');
}

// Copy pools organized by theme
const COPY_POOL = {
  starter: {
    homepage: {
      headline: 'Run every client workflow with structure.',
      lede: 'Corvioz helps independent professionals organize quotes, proposals, client documents, and project records in one focused workspace.',
      trustBadge: '⚡ Starter Identity Active',
      trustMicrocopy: 'Safe way to organize client work',
      trustStripTitle: 'Beginner-safe workflow layout designed to organize client delivery',
      trustStripBullets: [
        'Zero bookkeeping setup complexity',
        'Instant 14-day risk-free refund window',
        'Local draft browser sandbox option',
        'Secure checkout provider'
      ],
      threeStepFlow: [
        { step: '① Pitch estimate', color: 'var(--text-soft)' },
        { step: '→', color: 'var(--text-muted)' },
        { step: '② Prepare proposal', color: 'var(--text-soft)' },
        { step: '→', color: 'var(--text-muted)' },
        { step: '③ Manage delivery', color: 'var(--primary)' }
      ],
      featuresTitle: 'From Request to Delivery Record',
      featuresLede: 'Draft milestone estimates, prepare client documents, and keep the first workflow organized without complexity.',
      featuresList: [
        { title: 'Milestone estimates', text: 'Create clear, simple quotes for client approval.' },
        { title: 'Starter documents', text: 'Prepare professional client documents for your first workflow.' },
        { title: 'Client status tracking', text: 'Track document review and follow-up status.' },
        { title: 'Client portal link', text: 'Give your client a clean portal to approve and view documents.' }
      ],
      profileTitle: 'Your Freelancer Business Card',
      profileLede: 'Create a shareable, simple services profile that helps your first client discover and hire you directly.',
      profileBullets: [
        'Single-column service list',
        'Direct email inquiry CTA',
        'Clean professional avatar card'
      ],
      showcaseTitle: 'Your Path to Structured Client Work',
      showcaseLede: 'A direct client workflow designed for new freelancers. From request capture to document delivery, Starter eliminates clutter so you can focus on the work.',
      faqs: [
        {
          q: 'How does Starter help me organize client work?',
          a: 'Starter mode is built to simplify the client workflow. You can pitch milestone estimates, prepare professional documents, and track follow-up with less complexity.'
        },
        {
          q: 'Do I need a registered business to use Starter?',
          a: 'No. You can use your personal name, upload a profile photo, list your services, and prepare client documents as a sole proprietor.'
        },
        {
          q: 'Can I use Starter for free?',
          a: 'Yes. You can generate local draft documents, preview PDFs, and manage your first client workspace for free.'
        }
      ]
    },
    pricing: {
      headline: 'Choose the workspace that fits your client operation.',
      lede: 'Start with a focused client workflow, then upgrade when your documents, clients, and delivery process need more structure.',
      kicker: 'SIMPLE PLANS FOR CLIENT WORKFLOW MATURITY',
      cards: {
        free: {
          outcome: 'Spend less time on admin and start pitching projects.',
          features: ['Pitch custom estimates & quotes', 'Share your professional Public Profile', 'Export watermarked proposal documents']
        },
        starter: {
          outcome: 'Organize client delivery and present a polished brand.',
          features: ['Client-ready proposals', 'Quote and document workflow', 'Auto-fill client details on future documents']
        },
        pro: {
          outcome: 'Keep client follow-up organized for repeat work.',
          features: ['Organize follow-up moments', 'Build custom client portfolios for repeat work', 'Qualify and capture prospective client inquiries']
        },
        studio: {
          outcome: 'Scale your operations and manage workflow complexity.',
          features: ['Brand client workspaces under your custom domain', 'Qualify inbound inquiries with budget filters', 'Present specialist team members to secure larger contracts']
        }
      },
      trustStripTitle: 'Beginner-safe workflow layout designed to organize client delivery',
      trustStripBullets: [
        'Zero bookkeeping setup complexity',
        'Instant 14-day risk-free refund window',
        'Local draft browser sandbox option',
        'Secure checkout provider'
      ],
      trustBadges: [
        'Safe way to organize client work',
        'No setup risk',
        'Cancel anytime in 1 click',
        '14-day zero-risk refund'
      ],
      cardTrustMicrocopy: 'No setup risk. Start freelancing safely.'
    },
    checkout: {
      heading: 'Unlock your Starter workspace',
      quote: '“Organize your first client workflow”',
      bullets: [
        'Beginner-safe document tracking',
        'Direct client approval workflow',
        'Instant 14-day full refund window'
      ],
      loadingHeader: 'Setting up your Starter dashboard...',
      loadingDesc: 'Safe way to organize client work. No setup risk.',
      spinnerSub: 'Opening Starter checkout...'
    },
    dashboard: {
      title: 'Corvioz Starter OS',
      description: 'Organize client delivery. Create quotes, prepare client documents, and track review status in one simple dashboard.',
      badgeLabel: 'Freelancer Mode',
      nudgeTitle: 'Starter Dashboard Ready',
      nudgeText: 'Pitch estimates and organize your first client workflow without extra complexity.'
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
      showcaseTitle: 'Your Client Delivery Pipeline',
      showcaseLede: 'A complete freelancer workflow system. Scale from capturing inbound leads to proposing scopes, organizing documents, and building client relationships for repeat work.',
      faqs: [
        {
          q: 'How does Pro help organize repeat client work?',
          a: 'Pro mode includes pipeline CRM features, lead capture forms on your public profile, interactive proposals with milestone signatures, and organized follow-up for repeat clients.'
        },
        {
          q: 'How does the lead capture and CRM pipeline work?',
          a: 'When clients visit your public profile, they can submit quote requests. These inquiries flow directly into your CRM Kanban board as new inbound leads, allowing you to track them from pitch to client review.'
        },
        {
          q: 'Can I organize client document schedules?',
          a: 'Yes. In Pro mode you can organize client document schedules and keep proposal, quote, and project follow-up context in your workspace.'
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
          features: ['Pitch custom estimates & quotes', 'Share your professional Public Profile', 'Export watermarked proposal documents']
        },
        starter: {
          outcome: 'Organize client delivery and present a polished brand.',
          features: ['Client-ready proposals', 'Quote and document workflow', 'Auto-fill client details on future documents']
        },
        pro: {
          outcome: 'Keep client follow-up organized for repeat work.',
          features: ['Organize follow-up moments', 'Build custom client portfolios for repeat work', 'Qualify and capture prospective client inquiries']
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
      quote: '“You’re about to upgrade your client workflow”',
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
      description: 'Manage repeat client work. Monitor your pipeline, prepare proposals, organize client documents, and view workflow analytics in one workspace.',
      badgeLabel: 'Freelancer Mode',
      nudgeTitle: 'Pro System Recommendation',
      nudgeText: 'Connect proposals with client review steps to keep delivery terms clear.'
    }
  },
  studio: {
    homepage: {
      headline: 'Run Your Freelance Studio',
      lede: 'A unified command center for client operations. White-label your client delivery portal, display team profiles, showcase outcome case studies, and qualify high-budget inquiries.',
      trustBadge: '🚀 Studio OS Active',
      trustMicrocopy: 'Professional studio client workflow',
      trustStripTitle: 'Professional infrastructure for studio operations',
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
      kicker: 'STUDIO CLIENT WORKFLOW',
      cards: {
        free: {
          outcome: 'Spend less time on admin and start pitching projects.',
          features: ['Pitch custom estimates & quotes', 'Share your professional Public Profile', 'Export watermarked proposal documents']
        },
        starter: {
          outcome: 'Organize client delivery and present a polished brand.',
          features: ['Client-ready proposals', 'Quote and document workflow', 'Auto-fill client details on future documents']
        },
        pro: {
          outcome: 'Keep client follow-up organized for repeat work.',
          features: ['Organize follow-up moments', 'Build custom client portfolios for repeat work', 'Qualify and capture prospective client inquiries']
        },
        studio: {
          outcome: 'Scale your operations and manage workflow complexity.',
          features: ['Brand client workspaces under your custom domain', 'Qualify inbound inquiries with budget filters', 'Present specialist team members to secure larger contracts']
        }
      },
      trustStripTitle: 'Professional infrastructure for studio operations',
      trustStripBullets: [
        'Custom domain white-labeling',
        'Specialist & collaborator rosters',
        'Multi-step budget screening filters',
        'Ledger export for professional accountants'
      ],
      trustBadges: [
        'Professional studio client workflow',
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
      loadingDesc: 'Professional studio client workflow. Built for multi-client operations.',
      spinnerSub: 'Opening Studio checkout...'
    },
    dashboard: {
      title: 'Corvioz Studio OS',
      description: 'Win clients, generate milestone quotes, send professional invoices, and track payment status in one dashboard.',
      badgeLabel: 'Business Mode',
      nudgeTitle: 'Studio Dashboard Active',
      nudgeText: 'Run white-labeled client portals, coordinate team lists, and manage multiple operations.'
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
