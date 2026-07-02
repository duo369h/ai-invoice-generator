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
      socialProof: 'Built for freelancers who need cleaner client delivery',
      urgencyLabel: 'Early access pricing active',
      lossFraming: "You're missing client-ready proposal structure"
    };
  } else if (intentLevel === 'MEDIUM') {
    return {
      socialProof: 'Built for freelancers who need cleaner client delivery',
      urgencyLabel: 'Limited early access pricing',
      lossFraming: "You're missing client-ready proposal structure"
    };
  } else {
    return {
      socialProof: 'Built for freelancers who need cleaner client delivery',
      urgencyLabel: 'Early access pricing active',
      lossFraming: 'Upgrade to create client-ready documents'
    };
  }
}
