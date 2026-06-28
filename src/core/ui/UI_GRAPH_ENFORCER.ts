import fs from "fs";
import path from "path";

export interface UIGraphViolation {
  file: string;
  rule: string;
  evidence: string;
}

const DASHBOARD_FORBIDDEN_KEYWORDS = [
  "quotes.",
  "invoices.",
  "leads.",
  ".filter(",
  ".reduce(",
  "getNextBestAction",
];

const RAW_PROP_PATTERNS = [
  /<\w+[^>]*\squotes=\{/,
  /<\w+[^>]*\sinvoices=\{/,
  /<\w+[^>]*\sleads=\{/,
  /function\s+\w+\s*\(\s*\{[^}]*\bquotes\b/,
  /function\s+\w+\s*\(\s*\{[^}]*\binvoices\b/,
  /function\s+\w+\s*\(\s*\{[^}]*\bleads\b/,
  /export\s+default\s+function\s+\w+\s*\(\s*\{[^}]*\bquotes\b/,
  /export\s+default\s+function\s+\w+\s*\(\s*\{[^}]*\binvoices\b/,
  /export\s+default\s+function\s+\w+\s*\(\s*\{[^}]*\bleads\b/,
];

function stripComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("//"))
    .join("\n");
}

function inspectFile(root: string, relPath: string): UIGraphViolation[] {
  const absPath = path.resolve(root, relPath);
  if (!fs.existsSync(absPath)) return [];

  const code = stripComments(fs.readFileSync(absPath, "utf-8"));
  const violations: UIGraphViolation[] = [];

  for (const keyword of DASHBOARD_FORBIDDEN_KEYWORDS) {
    if (code.includes(keyword)) {
      violations.push({
        file: relPath,
        rule: "UI_GRAPH_ONLY_RULE",
        evidence: keyword,
      });
    }
  }

  for (const pattern of RAW_PROP_PATTERNS) {
    const match = code.match(pattern);
    if (match) {
      violations.push({
        file: relPath,
        rule: "RAW_DOMAIN_PROPS_FORBIDDEN",
        evidence: match[0],
      });
    }
  }

  if (!code.includes("getDashboardUI")) {
    violations.push({
      file: relPath,
      rule: "DASHBOARD_UI_GRAPH_ENTRY_MISSING",
      evidence: "getDashboardUI",
    });
  }

  return violations;
}

export function enforceUIGraphOnly(root: string): UIGraphViolation[] {
  return inspectFile(root, "src/app/dashboard/components/DashboardOverview.js");
}

export function assertUIGraphOnly(root: string): void {
  const violations = enforceUIGraphOnly(root);
  if (violations.length > 0) {
    const details = violations.map((violation) => `${violation.file} — ${violation.rule}: ${violation.evidence}`).join("\n");
    throw new Error(`UI Graph enforcement failed:\n${details}`);
  }
}
