export type SimulatedUserType = 'high_intent' | 'medium_intent' | 'low_intent';

export type SimulatedAction =
  | 'landing_view'
  | 'signup_start'
  | 'signup_complete'
  | 'invoice_create'
  | 'quote_create'
  | 'export_pdf'
  | 'pricing_view';

export type SimulatedUserSession = {
  user_type: SimulatedUserType;
  actions: SimulatedAction[];
  session_length: number;
  conversion_probability: number;
};

export type UserBehaviorSimulationOptions = {
  users?: number;
  seed?: number;
  mix?: Partial<Record<SimulatedUserType, number>>;
};

const DEFAULT_SEED = 7319;
const DEFAULT_USER_COUNT = 120;
const DEFAULT_MIX: Record<SimulatedUserType, number> = {
  high_intent: 0.24,
  medium_intent: 0.46,
  low_intent: 0.3,
};

function createDeterministicRandom(seed = DEFAULT_SEED) {
  let state = Math.abs(Math.floor(seed)) || DEFAULT_SEED;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function round(value: number, precision = 4) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function normalizeMix(mix: UserBehaviorSimulationOptions['mix'] = {}) {
  const merged = { ...DEFAULT_MIX, ...mix };
  const total = Object.values(merged).reduce((sum, value) => sum + Math.max(0, Number(value || 0)), 0) || 1;
  return {
    high_intent: Math.max(0, Number(merged.high_intent || 0)) / total,
    medium_intent: Math.max(0, Number(merged.medium_intent || 0)) / total,
    low_intent: Math.max(0, Number(merged.low_intent || 0)) / total,
  };
}

function pickUserType(randomValue: number, mix: Record<SimulatedUserType, number>): SimulatedUserType {
  if (randomValue < mix.high_intent) return 'high_intent';
  if (randomValue < mix.high_intent + mix.medium_intent) return 'medium_intent';
  return 'low_intent';
}

function maybePush(actions: SimulatedAction[], action: SimulatedAction, random: () => number, probability: number) {
  if (random() <= probability) actions.push(action);
}

function buildActions(userType: SimulatedUserType, random: () => number): SimulatedAction[] {
  const actions: SimulatedAction[] = ['landing_view'];

  if (userType === 'high_intent') {
    maybePush(actions, 'pricing_view', random, 0.78);
    maybePush(actions, 'signup_start', random, 0.88);
    maybePush(actions, 'signup_complete', random, 0.76);
    maybePush(actions, 'invoice_create', random, 0.72);
    maybePush(actions, 'quote_create', random, 0.58);
    maybePush(actions, 'export_pdf', random, 0.64);
    maybePush(actions, 'pricing_view', random, 0.52);
    return actions;
  }

  if (userType === 'medium_intent') {
    maybePush(actions, 'signup_start', random, 0.56);
    maybePush(actions, 'signup_complete', random, 0.4);
    maybePush(actions, 'quote_create', random, 0.38);
    maybePush(actions, 'invoice_create', random, 0.32);
    maybePush(actions, 'pricing_view', random, 0.42);
    maybePush(actions, 'export_pdf', random, 0.26);
    return actions;
  }

  maybePush(actions, 'pricing_view', random, 0.2);
  maybePush(actions, 'signup_start', random, 0.22);
  maybePush(actions, 'signup_complete', random, 0.1);
  maybePush(actions, 'quote_create', random, 0.12);
  maybePush(actions, 'invoice_create', random, 0.1);
  maybePush(actions, 'export_pdf', random, 0.08);
  return actions;
}

function computeSessionLength(userType: SimulatedUserType, actions: SimulatedAction[], random: () => number) {
  const base = userType === 'high_intent' ? 720 : userType === 'medium_intent' ? 420 : 150;
  const actionWeight = actions.length * (userType === 'high_intent' ? 95 : userType === 'medium_intent' ? 70 : 38);
  return Math.round(base + actionWeight + random() * 180);
}

function computeConversionProbability(userType: SimulatedUserType, actions: SimulatedAction[]) {
  const base = userType === 'high_intent' ? 0.34 : userType === 'medium_intent' ? 0.14 : 0.035;
  const actionLift = actions.reduce((sum, action) => {
    if (action === 'pricing_view') return sum + 0.055;
    if (action === 'signup_complete') return sum + 0.09;
    if (action === 'invoice_create') return sum + 0.08;
    if (action === 'quote_create') return sum + 0.055;
    if (action === 'export_pdf') return sum + 0.11;
    return sum;
  }, 0);
  return round(Math.min(0.92, base + actionLift));
}

export function generateSyntheticUserSessions(options: UserBehaviorSimulationOptions = {}): SimulatedUserSession[] {
  const random = createDeterministicRandom(options.seed);
  const mix = normalizeMix(options.mix);
  const users = Math.max(1, Math.floor(options.users || DEFAULT_USER_COUNT));

  return Array.from({ length: users }, () => {
    const user_type = pickUserType(random(), mix);
    const actions = buildActions(user_type, random);
    return {
      user_type,
      actions,
      session_length: computeSessionLength(user_type, actions, random),
      conversion_probability: computeConversionProbability(user_type, actions),
    };
  });
}

export { createDeterministicRandom };
