import { validateUI } from "./validateUI";

/**
 * UI_GATE
 * Runtime gate wrapper for Corvioz UI components tree.
 * Traverses React elements recursively to ensure strict layout, styling,
 * and component module isolation constraints.
 */
export function UI_GATE(tree: any) {
  validateUI(tree);
  return tree;
}
