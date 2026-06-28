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

export interface PricingPressure {
  socialProof: string;
  urgencyLabel: string;
  lossFraming: string;
}

export function getPricingPressure(): PricingPressure {
  const intentLevel = getIntentLevel();
  
  if (intentLevel === 'HIGH') {
    return {
      socialProof: '12 freelancers upgraded in the last hour',
      urgencyLabel: 'Early access pricing ends shortly',
      lossFraming: "You're missing client-ready proposals & losing deals now"
    };
  } else if (intentLevel === 'MEDIUM') {
    return {
      socialProof: '12 freelancers upgraded today',
      urgencyLabel: 'Limited early access pricing',
      lossFraming: "You're missing client-ready proposals"
    };
  } else {
    return {
      socialProof: 'Freelancers are upgrading to secure clients',
      urgencyLabel: 'Early access pricing active',
      lossFraming: 'Upgrade to create client-ready documents'
    };
  }
}
