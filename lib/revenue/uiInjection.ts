// Corvioz Revenue Principle v9.1
// The system must optimize for first payment conversion.
// Every feature must contribute to revenue perception or payment activation.
// No feature is allowed to be neutral.

/*
This system does NOT make decisions.
It only adjusts UI intensity based on intent signals.
No pricing logic is allowed here.
No AI inference is allowed here.
*/

import { getIntentLevel } from './intentTracker';
import { getPricingPressure } from './pressureEngine';

// This is not a feature mapping system.
// This is a behavioral revenue system.
// Pricing is driven by user intent, not functionality.

export interface UIInjectionConfig {
  ctaText: string;
  badgeText: string;
  helperText: string;
}

export function getUIInjection(planId: string): UIInjectionConfig {
  const intentLevel = getIntentLevel();
  const pressure = getPricingPressure();
  
  let ctaText = '';
  let badgeText = '';
  let helperText = '';
  
  if (planId === 'starter') {
    ctaText = 'Choose Starter';
    badgeText = intentLevel === 'HIGH' ? 'WORKFLOW FIT' : 'STARTER';
    helperText = pressure.lossFraming;
  } else if (planId === 'pro') {
    ctaText = 'Choose Pro';
    badgeText = intentLevel === 'HIGH' ? 'RECOMMENDED' : 'PRO';
    helperText = pressure.socialProof;
  } else if (planId === 'studio') {
    ctaText = 'Choose Studio';
    badgeText = 'STUDIO';
    helperText = 'Best for teams coordinating higher client delivery volume.';
  } else {
    ctaText = 'Start Free';
    badgeText = 'TRY';
    helperText = 'Free forever, upgrade anytime.';
  }
  
  return {
    ctaText,
    badgeText,
    helperText,
  };
}
