/**
 * RDCL v3.2.2 — Decision Gateway (SINGLE ACTION ENTRY POINT)
 *
 * RULE: ALL revenue action decisions MUST flow through this gateway.
 * Helper modules (context, scoring, signals) are NOT blocked — only
 * action-producing calls from outside RDCL are rejected.
 *
 * Flow: Event → Context → RDCL → decisionGateway → Action
 */

import { RDCL } from "./RDCL";
import { guard } from "./rdcl-guard";

/**
 * The ONLY public API that produces a revenue action.
 * All callers MUST pass source="RDCL". Any other source throws.
 */
export function decisionGateway(
  event: any,
  context: any,
  source: string = "RDCL"
): ReturnType<typeof RDCL> {
  // Hard guard: blocks any non-RDCL action-producing call
  guard(source);
  return RDCL(event, context);
}

