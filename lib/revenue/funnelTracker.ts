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

export interface FunnelState {
  conversionPath: string[];
  startTime: number;
  lastEventTime: number;
  dropPoint: string;
}

export function trackFunnelEvent(event: string, metadata: Record<string, any> = {}): void {
  if (typeof window === 'undefined') return;
  
  const stored = window.localStorage.getItem('corvioz_funnel_state');
  const state: FunnelState = stored ? JSON.parse(stored) : {
    conversionPath: [],
    startTime: Date.now(),
    lastEventTime: Date.now(),
    dropPoint: '',
  };
  
  state.conversionPath.push(event);
  state.lastEventTime = Date.now();
  
  // Set drop point (defaulting to current event until progression changes it)
  if (event !== 'payment_success') {
    state.dropPoint = event;
  } else {
    state.dropPoint = '';
  }
  
  window.localStorage.setItem('corvioz_funnel_state', JSON.stringify(state));
  
  console.log(`[FUNNEL TRACKER] Tracked event: ${event}`, {
    path: state.conversionPath,
    timeToCurrent: Math.round((Date.now() - state.startTime) / 1000),
  });
  
  // Log event to existing growth events api to record metrics backend
  fetch('/api/growth/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: event,
      source: 'user',
      metadata: {
        session_id: window.localStorage.getItem('corvioz_session_id') || 'unknown',
        ...metadata,
      }
    })
  }).catch(() => {});
}

export function getFunnelReport(): { conversionPath: string[]; dropPoint: string; timeToConversion: number } {
  if (typeof window === 'undefined') {
    return { conversionPath: [], dropPoint: '', timeToConversion: 0 };
  }
  const stored = window.localStorage.getItem('corvioz_funnel_state');
  if (!stored) return { conversionPath: [], dropPoint: '', timeToConversion: 0 };
  
  const state: FunnelState = JSON.parse(stored);
  const isConverted = state.conversionPath.includes('payment_success');
  const timeToConversion = isConverted 
    ? Math.round((state.lastEventTime - state.startTime) / 1000)
    : 0;
     
  return {
    conversionPath: state.conversionPath,
    dropPoint: state.dropPoint,
    timeToConversion,
  };
}
