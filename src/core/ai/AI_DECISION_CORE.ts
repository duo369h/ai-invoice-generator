import * as fs from 'fs';
import * as path from 'path';
import { validateLearningSource } from './AI_LEARNING_GUARD';

// SINGLE SOURCE OF TRUTH RULE:
// ONLY AI_DECISION_CORE.updateFromOutcome may modify learning state
// ALL OTHER SYSTEMS ARE READ-ONLY

export interface AIUserState {
  pricing_bias: number;
  client_sensitivity: number;
  urgency_sensitivity: number;
  win_rate: number;
  conversion_drift: number;
  preferred_strategy: "FAST" | "BALANCED" | "PREMIUM";
}

const DEFAULT_STATE: AIUserState = {
  pricing_bias: 1.0,
  client_sensitivity: 1.0,
  urgency_sensitivity: 1.0,
  win_rate: 0.7,
  conversion_drift: 0.0,
  preferred_strategy: "BALANCED"
};

const STORE_PATH = path.resolve(process.cwd(), 'src/core/ai/ai_user_state_store.json');

function readStore(): Record<string, AIUserState> {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read AI user state store:', err);
  }
  return {};
}

function writeStore(data: Record<string, AIUserState>) {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write AI user state store:', err);
  }
}

/**
 * Retrieves persistent AIUserState for a user, falling back to a default state.
 */
export function getUserAIState(userId?: string): AIUserState {
  const cleanId = userId || 'default';
  const store = readStore();
  return store[cleanId] || { ...DEFAULT_STATE };
}

/**
 * Updates persistent AIUserState using received cross-flow outcome signals.
 * This is the SINGLE learning entry point.
 */
export function updateFromOutcome(userId: string, signal: any, caller?: string): AIUserState {
  // Runtime Guard: enforce single source of truth path
  validateLearningSource(caller || '');

  const cleanId = userId || 'default';
  const store = readStore();
  const state = store[cleanId] || { ...DEFAULT_STATE };

  if (!signal) return state;

  // Process signals based on type
  switch (signal.type) {
    case 'QUOTE_CREATED': {
      const base = signal.basePrice || 1000;
      const suggested = signal.suggestedPrice || 1000;
      if (suggested > base) {
        state.pricing_bias = Math.min(1.5, state.pricing_bias + 0.01);
      }
      break;
    }
    case 'INVOICE_CREATED': {
      const desc = signal.description || '';
      if (desc.includes('Premium')) {
        state.client_sensitivity = Math.min(1.5, state.client_sensitivity + 0.05);
      }
      break;
    }
    case 'PAYMENT_REMINDER_SENT': {
      const level = signal.urgencyLevel || 2;
      state.urgency_sensitivity = Math.min(1.5, state.urgency_sensitivity + (level * 0.02));
      break;
    }
    case 'FEEDBACK_OUTCOME': {
      const outcome = signal.outcome; // "WON" | "LOST" | "REVISED" | "PENDING"
      const offered = signal.priceOffered || 1000;
      const accepted = signal.priceAccepted || offered;

      if (outcome === 'WON') {
        state.win_rate = Math.min(1.0, state.win_rate * 0.9 + 0.1);
        state.pricing_bias = Math.min(1.5, state.pricing_bias + 0.03);
        state.conversion_drift = offered > 0 ? (accepted - offered) / offered : 0.0;
        if (state.win_rate > 0.8) {
          state.preferred_strategy = 'PREMIUM';
        }
      } else if (outcome === 'LOST') {
        state.win_rate = Math.max(0.0, state.win_rate * 0.9);
        state.pricing_bias = Math.max(0.7, state.pricing_bias - 0.05);
        state.preferred_strategy = 'FAST';
      } else if (outcome === 'REVISED') {
        state.pricing_bias = Math.max(0.7, state.pricing_bias - 0.02);
        state.preferred_strategy = 'BALANCED';
      }
      break;
    }
  }

  // Update store
  store[cleanId] = state;
  writeStore(store);

  return state;
}

/**
 * Computes decision bias adjustment factor based on user state and active context.
 */
export function computeDecisionBias(userId: string, context: any): number {
  const cleanId = userId || 'default';
  const state = getUserAIState(cleanId);
  
  let multiplier = state.pricing_bias;

  // Enhance multiplier based on context values
  if (context?.clientContext === 'enterprise') {
    multiplier *= state.client_sensitivity;
  }
  if (context?.urgency === 'high') {
    multiplier *= state.urgency_sensitivity;
  }

  return multiplier;
}

/**
 * DISABLED: reflex learning system removed.
 * Kept for debugging only (NO SIDE EFFECTS).
 */
export function syncCrossFlowLearning(userId: string, outcomes: any[]) {
  console.log(`[AI_DECISION_CORE] Passive sync triggered for user: ${userId}. Outcomes: ${outcomes.length}`);
  return [];
}

/**
 * Authoritative single decision output system.
 */
export function getDecision(userId: string, context?: any) {
  const cleanId = userId || 'default';
  const state = getUserAIState(cleanId);
  const bias = computeDecisionBias(cleanId, context);
  return {
    state,
    output: {
      pricing_bias: bias,
      strategy: state.preferred_strategy,
      confidence: state.win_rate > 0.6 ? "HIGH" : "MEDIUM"
    }
  };
}
