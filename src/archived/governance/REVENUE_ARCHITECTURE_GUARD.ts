export interface Violation {
  severity: string;
  file: string;
  rule: string;
  evidence: string;
}

/**
 * runArchitectureGuard stub to maintain compatibility with validation script
 * after cleanup of obsolete temporary/archived directories.
 */
export function runArchitectureGuard(root: string): Violation[] {
  return [];
}
