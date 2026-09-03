#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const registryPath = path.join(repoRoot, "docs/product-knowledge/registry.json");
const requiredAuthorityFields = [
  "knowledge_authority",
  "implementation_authority",
  "runtime_authority"
];

const failures = [];
const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    failures.push(`${filePath}: ${error.message}`);
    return null;
  }
};

const registry = readJson(registryPath);
const entries = registry?.entries;
if (!Array.isArray(entries)) failures.push("registry.entries must be an array");

const seenIds = new Set();
for (const entry of entries ?? []) {
  if (!entry?.id || seenIds.has(entry.id)) {
    failures.push(`registry id missing or duplicated: ${entry?.id ?? "<missing>"}`);
  }
  seenIds.add(entry?.id);

  const manifestPath = path.join(repoRoot, entry.path ?? "");
  if (!entry.path || !fs.existsSync(manifestPath)) {
    failures.push(`manifest missing: ${entry.path ?? "<missing>"}`);
    continue;
  }

  const manifest = readJson(manifestPath);
  for (const field of requiredAuthorityFields) {
    if (!manifest || !(field in manifest)) {
      failures.push(`${entry.id}: required field missing: ${field}`);
    }
  }

  const sourcePath = manifest
    ? path.join(path.dirname(manifestPath), manifest.source_document ?? "")
    : "";
  if (!manifest?.source_document || !fs.existsSync(sourcePath)) {
    failures.push(`${entry.id}: source document missing`);
    continue;
  }

  const actualHash = crypto
    .createHash("sha256")
    .update(fs.readFileSync(sourcePath))
    .digest("hex");
  if (actualHash !== manifest.source_sha256 || actualHash !== entry.source_sha256) {
    failures.push(`${entry.id}: source SHA-256 mismatch`);
  }
}
if (failures.length) {
  console.error("PRODUCT_KNOWLEDGE_REGISTRY=FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`PRODUCT_KNOWLEDGE_REGISTRY=PASS entries=${entries.length}`);
}
