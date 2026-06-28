/**
 * Corvioz v1.1 — Build-Time Entry Freeze Check
 *
 * Recursively scans the src/ directory and root middleware for entry routing violations.
 * Blocks the build by exiting with code 1 if violations exist.
 */

import * as fs from 'fs';
import * as path from 'path';

interface EntryGuardViolation {
  violation: string;
  file: string;
  severity: "CRITICAL";
}

function checkFileRules(filename: string, content: string): EntryGuardViolation[] {
  const violations: EntryGuardViolation[] = [];

  // Skip the core entry-routing files and environment scripts
  const normalizedPath = filename.replace(/\\/g, '/');
  if (
    normalizedPath.includes("ENTRY_AUTHORITY") ||
    normalizedPath.includes("ENTRY_GOVERNANCE") ||
    normalizedPath.includes("ENTRY_SYSTEM_CONTRACT") ||
    normalizedPath.includes("ENTRY_LAYER_GUARD") ||
    normalizedPath.includes("ENTRY_AUDIT_LOG") ||
    normalizedPath.includes("ENTRY_FREEZE_FLAG") ||
    normalizedPath.includes("ENTRY_SYSTEM_BOUNDARY_MAP") ||
    normalizedPath.includes("ENTRY_OUTCOME_BARRIER") ||
    normalizedPath.includes("OUTCOME_EVOLUTION_LOCK") ||
    normalizedPath.includes("entry/outcome") ||
    normalizedPath.includes("entry-resolver") ||
    normalizedPath.includes("entry-priority") ||
    normalizedPath.includes("entry-consistency-check") ||
    normalizedPath.includes("entry-metrics") ||
    normalizedPath.includes("ENTRY_LEAK_DETECTOR") ||
    normalizedPath.includes("ENTRY_BOOT_CHECK") ||
    normalizedPath.includes("ENTRY_BUILD_GUARD") ||
    normalizedPath.includes("entry-guard.rules") ||
    normalizedPath.includes("entry/index.ts") ||
    normalizedPath.includes("node_modules") ||
    normalizedPath.includes(".next") ||
    normalizedPath.includes("scripts/")
  ) {
    return violations;
  }

  // 1. Detect ternary hasActivated ? route :
  if (/hasActivated\s*\?\s*[^:]+:[^;]+/.test(content)) {
    violations.push({
      violation: "Ternary expression 'hasActivated ? route :' detected.",
      file: filename,
      severity: "CRITICAL"
    });
  }

  // 2. Detect /dashboard direct navigation decisions combined with local checks
  if (content.includes("hasActivated") && (content.includes("router.push('/dashboard')") || content.includes("router.replace('/dashboard')"))) {
    violations.push({
      violation: "Direct router redirection to '/dashboard' combined with local 'hasActivated' checks.",
      file: filename,
      severity: "CRITICAL"
    });
  }

  // 3. TierRouter conditional logic
  if (normalizedPath.includes("TierRouter") && (content.includes("plan") || content.includes("hasActivated") || content.includes("redirect"))) {
    violations.push({
      violation: "TierRouter containing conditional plan/activation routing logic.",
      file: filename,
      severity: "CRITICAL"
    });
  }

  // 4. Middleware custom branching logic
  const hasMiddlewareEntryBranching = /\bplan\b/.test(content) || /\bhasActivated\b/.test(content);
  if (normalizedPath.includes("middleware") && hasMiddlewareEntryBranching && !content.includes("ENTRY_AUTHORITY")) {
    violations.push({
      violation: "Middleware containing custom plan/hasActivated branching bypassing ENTRY_AUTHORITY.",
      file: filename,
      severity: "CRITICAL"
    });
  }

  // 5. resolveEntry() usage bypassing ENTRY_AUTHORITY
  const allowedResolverCallers = ["page.js", "page.tsx", "route.js", "route.ts", "auth/page.js"];
  const isAllowedCaller = allowedResolverCallers.some(c => normalizedPath.endsWith(c));
  if (!isAllowedCaller && content.includes("resolveEntry")) {
    violations.push({
      violation: "Unauthorized usage of resolveEntry() instead of ENTRY_AUTHORITY().",
      file: filename,
      severity: "CRITICAL"
    });
  }

  return violations;
}

function walkDir(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkDir(filePath, fileList);
      }
    } else {
      if (/\.(ts|tsx|js|jsx)$/.test(file)) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

export function runBuildGuard() {
  console.log("[ENTRY_BUILD_GUARD] Starting build-time scan...");
  const workspaceRoot = process.cwd();
  
  // Recursively find all source files in src/
  const filesToScan = walkDir(path.join(workspaceRoot, 'src'));
  
  // Add middleware.js at root
  const middlewarePath = path.join(workspaceRoot, 'middleware.js');
  if (fs.existsSync(middlewarePath)) {
    filesToScan.push(middlewarePath);
  }

  const allViolations: EntryGuardViolation[] = [];

  for (const file of filesToScan) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const violations = checkFileRules(file, content);
      if (violations.length > 0) {
        allViolations.push(...violations);
      }
    } catch (err) {
      console.warn(`[ENTRY_BUILD_GUARD] Warning: Could not read file ${file}:`, err);
    }
  }

  if (allViolations.length > 0) {
    console.error("\n=======================================================");
    console.error("❌ CRITICAL ENTRY ROUTING FREEZE VIOLATIONS DETECTED");
    console.error("=======================================================");
    for (const v of allViolations) {
      console.error(`File: ${v.file}`);
      console.error(`Violation: ${v.violation}`);
      console.error(`Severity: ${v.severity}\n`);
    }
    console.error("Build blocked. Entry routing decisions must only flow through ENTRY_AUTHORITY.");
    process.exit(1);
  }

  console.log("✔ [ENTRY_BUILD_GUARD] All entry consistency checks passed.");
}

// Execute the guard scan
runBuildGuard();
