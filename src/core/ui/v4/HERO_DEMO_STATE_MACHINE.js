/**
 * HERO_DEMO_STATE_MACHINE — Corvioz v4
 *
 * Pure timing authority for the HOME-01 Beta document handoff.
 * The sequence is triggered once when the demo enters the viewport and freezes
 * permanently at `complete`. It never loops and never represents payment.
 */

export const HERO_DEMO_STATES = [
  'idle',
  'sent',
  'reviewing',
  'approved',
  'handoff',
  'invoice',
  'complete',
];

export const FINAL_STATE = 'complete';
export const TOTAL_DURATION_MS = 3200;

export const HERO_DEMO_PHASES = [
  { at: 0, state: 'idle' },
  { at: 220, state: 'sent' },
  { at: 850, state: 'reviewing' },
  { at: 1450, state: 'approved' },
  { at: 2150, state: 'handoff' },
  { at: 2500, state: 'invoice' },
  { at: TOTAL_DURATION_MS, state: FINAL_STATE },
];

export function resolveHeroDemoPhase(elapsedMs) {
  let phase = HERO_DEMO_PHASES[0];
  for (const candidate of HERO_DEMO_PHASES) {
    if (elapsedMs < candidate.at) break;
    phase = candidate;
  }
  return phase.state;
}

export function buildSchedule() {
  return HERO_DEMO_PHASES.map((phase, index) => ({
    state: phase.state,
    start: phase.at,
    end: HERO_DEMO_PHASES[index + 1]?.at ?? phase.at,
  }));
}
