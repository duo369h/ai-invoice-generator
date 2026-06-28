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

const ACTION_WEIGHTS: Record<string, number> = {
  VIEW_PRICING: 20,
  CLICK_CTA: 30,
  OPEN_MODAL: 20,
  ATTEMPT_EXPORT: 30,
  START_CHECKOUT: 40,
};

export function trackIntentAction(action: string): void {
  if (typeof window === 'undefined') return;
  
  const weight = ACTION_WEIGHTS[action.toUpperCase()] || 0;
  if (weight === 0) return;
  
  const currentScore = getIntentScore();
  const nextScore = Math.min(100, currentScore + weight);
  
  window.localStorage.setItem('corvioz_intent_score', String(nextScore));
  
  console.log(`[INTENT TRACKER] Action tracked: ${action} (+${weight}). Current Score: ${nextScore}`);
}

export function getIntentScore(): number {
  if (typeof window === 'undefined') return 0;
  const stored = window.localStorage.getItem('corvioz_intent_score');
  return stored ? Math.min(100, Math.max(0, Number(stored))) : 0;
}

export function getIntentLevel(): 'LOW' | 'MEDIUM' | 'HIGH' {
  const score = getIntentScore();
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}
