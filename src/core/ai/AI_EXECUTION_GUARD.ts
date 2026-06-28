/**
 * Corvioz — AI Execution Guard v3.1
 *
 * Enforces runtime separation between deterministic logic engines and language generators.
 */

import { AIRole, AI_ROLE_PERMISSIONS, FORBIDDEN_ROLES } from "./AI_ROLE_REGISTRY.ts";

export type ValidationResult = {
  allowed: boolean;
  reason?: string;
};

/**
 * Validates whether an AI role is permitted to perform a specific operation.
 */
export function validateAIOperation(operation: string, role: AIRole): ValidationResult {
  if ((FORBIDDEN_ROLES as readonly string[]).includes(role)) {
    return {
      allowed: false,
      reason: `AI role "${role}" is hard-blocked from runtime execution.`,
    };
  }

  // 1️⃣ Check forbidden operations list
  if (AI_ROLE_PERMISSIONS.forbidden.includes(operation as any)) {
    return {
      allowed: false,
      reason: `Operation "${operation}" is explicitly forbidden. AI must not make decision-making tasks.`,
    };
  }

  // 2️⃣ Check role-specific permissions
  const allowedOps = (AI_ROLE_PERMISSIONS as Record<string, readonly string[]>)[role];
  if (!allowedOps || !allowedOps.includes(operation as any)) {
    return {
      allowed: false,
      reason: `Operation "${operation}" is not permitted for AI role "${role}".`,
    };
  }

  return { allowed: true };
}
