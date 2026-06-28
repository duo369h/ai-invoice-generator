/**
 * CORVIOZ ARCHITECTURE FREEZE v1
 * DO NOT MODIFY WITHOUT V2 CONTRACT
 */
export const ARCHITECTURE_STATE = {
  version: "v1-stable",
  mode: "frozen",
  layers: ["ui", "event", "analytics", "backend", "intelligence"],
  enforcement: "strict-runtime-boundary",
  intelligenceMode: "offline-only",
  eventMode: "ledger-only"
};
