'use client';

/**
 * TierRouter — Corvioz v10
 *
 * Demoted to a pure enforcer/wrapper. Client-side routing decisions are eliminated.
 *
 * RULE:
 *   👉 Client must NEVER decide route
 */

export default function TierRouter({ children }) {
  return children;
}
export { TierRouter };
