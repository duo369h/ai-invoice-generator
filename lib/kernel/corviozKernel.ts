import { 
  resolveAppState, 
  getCTA, 
  resolveCopy, 
  AppState, 
  IdentityType, 
  BusinessStageType, 
  WorkspaceModeType, 
  ConversionContextType 
} from '../execution/globalOrchestrator';

export interface UI_STATE {
  identity: IdentityType;
  business_stage: BusinessStageType;
  workspace_mode: WorkspaceModeType;
  conversion_context: ConversionContextType;
  cta: (context: any) => string;
  copy: any;
  pricing: any;
  pricing_variant: string;
  checkout_flow: string;
  layout_mode: string;
  trust_layer: {
    trustBadge: string;
    trustMicrocopy: string;
    trustStripTitle: string;
    trustStripBullets: string[];
    trustBadges: string[];
    cardTrustMicrocopy: string;
  };
}

export const CorviozKernel = {
  // Expose underlying getter
  getState(options?: { activePlan?: string | null }): AppState {
    try {
      return resolveAppState(options);
    } catch (e) {
      console.error('[KERNEL] Error resolving AppState:', e);
      // Safe Fallback
      return {
        identity: null,
        business_stage: 'freelancer',
        workspace_mode: 'standard',
        conversion_context: 'onboarding',
      };
    }
  },

  // Main compute engine
  compute(
    page: 'homepage' | 'pricing' | 'checkout' | 'dashboard' = 'homepage',
    options?: { activePlan?: string | null }
  ): UI_STATE {
    const state = this.getState(options);
    
    // Resolve theme (identity always determines experience, defaults to starter safety on null)
    const activeTheme = state.identity || (state.business_stage === 'business' ? 'studio' : 'starter');

    // Safe Resolve Copy
    let copy: any = {};
    try {
      copy = resolveCopy(state, page);
    } catch (e) {
      console.error('[KERNEL] resolveCopy failed for page:', page, e);
    }

    // Safe Resolve Pricing/Trust Copy for global footer reference
    let pricingCopy: any = {};
    try {
      pricingCopy = resolveCopy(state, 'pricing');
    } catch (e) {}

    // Dynamic CTA mapper
    const cta = (context: any) => {
      try {
        return getCTA(state, context);
      } catch (e) {
        console.error('[KERNEL] getCTA failed for context:', context, e);
        return 'Continue';
      }
    };

    return {
      identity: state.identity,
      business_stage: state.business_stage,
      workspace_mode: state.workspace_mode,
      conversion_context: state.conversion_context,
      cta,
      copy,
      pricing: pricingCopy,
      pricing_variant: activeTheme,
      checkout_flow: activeTheme,
      layout_mode: state.workspace_mode,
      trust_layer: {
        trustBadge: copy?.trustBadge || '',
        trustMicrocopy: copy?.trustMicrocopy || '',
        trustStripTitle: pricingCopy?.trustStripTitle || '',
        trustStripBullets: pricingCopy?.trustStripBullets || [],
        trustBadges: pricingCopy?.trustBadges || [],
        cardTrustMicrocopy: pricingCopy?.cardTrustMicrocopy || '',
      }
    };
  }
};
export type { AppState, IdentityType, BusinessStageType, WorkspaceModeType, ConversionContextType };
