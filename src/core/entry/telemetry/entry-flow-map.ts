/**
 * READ ONLY SYSTEM
 * MUST NOT affect routing, activation, or RDCL
 */

/**
 * Corvioz v1.2 — Entry Flow Visual Mapper
 *
 * Models transition probabilities between entry steps.
 *
 * Flow structure:
 *   /dashboard
 *     ↓
 *   /activation
 *     ↓
 *   /invoice/create
 *     ↓
 *   activation_complete
 *
 * RULE:
 *   ✔ visualization only
 *   ✔ no routing influence
 */

export interface FlowNodeTransition {
  node:        string;
  nextNode:    string;
  probability: number;
}

export function generateFlowMap(data: {
  node:        string;
  transitions: Record<string, number>; // Maps nextNode to frequency count
}): FlowNodeTransition[] {
  const total = Object.values(data.transitions).reduce((sum, val) => sum + val, 0);
  if (total === 0) return [];

  return Object.keys(data.transitions).map(nextNode => ({
    node:        data.node,
    nextNode,
    probability: Number((data.transitions[nextNode] / total).toFixed(3)),
  }));
}
