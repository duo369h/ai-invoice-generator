#!/usr/bin/env node

/**
 * Current revenue authority verification.
 *
 * This test loads lib/revenue/revenueLock.ts and lib/revenue/costEstimator.ts
 * with the repository's installed TypeScript compiler. The service client is
 * an in-memory dependency supplied to the compiled module; no environment
 * secrets, network, or database are used.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

globalThis.fetch = () => {
  throw new Error('network access is forbidden in verify-revenue-lock.mjs');
};

function loadTypeScriptModule(relativePath, mocks = {}) {
  const filename = path.join(root, relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;

  const loadedModule = { exports: {} };
  const localRequire = (specifier) => {
    const mock = Object.entries(mocks).find(([needle]) => specifier.includes(needle));
    return mock ? mock[1] : require(specifier);
  };
  const wrapper = new Function('exports', 'require', 'module', '__filename', '__dirname', code);
  wrapper(loadedModule.exports, localRequire, loadedModule, filename, path.dirname(filename));
  return loadedModule.exports;
}

const revenueState = {
  serviceClientAvailable: true,
  plan: 'free',
  auditCounts: {
    proposal_generated: 0,
    card_profile_created: 0,
  },
  auditQueries: [],
};

function makeQuery(table) {
  const filters = [];
  const query = {
    select(_columns, options) {
      query.selectOptions = options;
      return query;
    },
    eq(column, value) {
      filters.push([column, value]);
      return query;
    },
    gte(column, value) {
      filters.push([column, value]);
      return query;
    },
    async maybeSingle() {
      assert.equal(table, 'profiles');
      return { data: { plan: revenueState.plan }, error: null };
    },
    then(resolve, reject) {
      try {
        assert.equal(table, 'audit_logs');
        revenueState.auditQueries.push({ filters, options: query.selectOptions });
        const action = filters.find(([column]) => column === 'action')?.[1];
        resolve({ count: revenueState.auditCounts[action] || 0, data: null, error: null });
      } catch (error) {
        reject(error);
      }
    },
  };
  return query;
}

const serviceClient = {
  from(table) {
    return makeQuery(table);
  },
};

const revenueModule = loadTypeScriptModule('lib/revenue/revenueLock.ts', {
  'supabase-service': {
    createServiceSupabaseClient: () => (
      revenueState.serviceClientAvailable ? serviceClient : null
    ),
  },
});
const costModule = loadTypeScriptModule('lib/revenue/costEstimator.ts');
const { checkRevenueLock } = revenueModule;
const { estimateCost } = costModule;

function resetState({ plan = 'free', proposalCount = 0, profileCount = 0, serviceClientAvailable = true } = {}) {
  revenueState.plan = plan;
  revenueState.auditCounts.proposal_generated = proposalCount;
  revenueState.auditCounts.card_profile_created = profileCount;
  revenueState.serviceClientAvailable = serviceClientAvailable;
  revenueState.auditQueries.length = 0;
}

async function assertRevenue(action, userId, expected) {
  const result = await checkRevenueLock(userId, action);
  assert.deepEqual(
    {
      allowed: result.allowed,
      suggestedUpgrade: result.suggestedUpgrade,
    },
    expected,
    `${userId || 'anonymous'} ${action} current revenue authority`
  );
  return result;
}

async function run() {
  // Anonymous authority: invoice parsing is public; other actions require auth.
  await assertRevenue('invoice', null, { allowed: true, suggestedUpgrade: 'pro' });
  await assertRevenue('proposal', null, { allowed: false, suggestedUpgrade: 'pro' });
  await assertRevenue('profile', null, { allowed: false, suggestedUpgrade: 'pro' });
  await assertRevenue('bulk_export', null, { allowed: false, suggestedUpgrade: 'studio' });

  // Free plan: one daily proposal/profile allowance, with current suggestions.
  resetState({ plan: 'free', proposalCount: 0, profileCount: 0 });
  await assertRevenue('invoice', 'free-user', { allowed: true, suggestedUpgrade: 'pro' });
  await assertRevenue('proposal', 'free-user', { allowed: true, suggestedUpgrade: 'pro' });
  await assertRevenue('profile', 'free-user', { allowed: true, suggestedUpgrade: 'starter' });
  await assertRevenue('bulk_export', 'free-user', { allowed: false, suggestedUpgrade: 'studio' });

  resetState({ plan: 'free', proposalCount: 1, profileCount: 1 });
  await assertRevenue('proposal', 'free-user', { allowed: false, suggestedUpgrade: 'starter' });
  await assertRevenue('profile', 'free-user', { allowed: false, suggestedUpgrade: 'starter' });
  assert.equal(revenueState.auditQueries.length, 2, 'free daily limits use current audit-log count queries');
  assert.equal(revenueState.auditQueries.every(({ options }) => options?.count === 'exact' && options?.head === true), true);

  // Starter plan: same daily limit, with current upgrade suggestions.
  resetState({ plan: 'starter', proposalCount: 0, profileCount: 0 });
  await assertRevenue('invoice', 'starter-user', { allowed: true, suggestedUpgrade: 'pro' });
  await assertRevenue('proposal', 'starter-user', { allowed: true, suggestedUpgrade: 'pro' });
  await assertRevenue('profile', 'starter-user', { allowed: true, suggestedUpgrade: 'pro' });
  await assertRevenue('bulk_export', 'starter-user', { allowed: false, suggestedUpgrade: 'studio' });

  resetState({ plan: 'starter', proposalCount: 1, profileCount: 1 });
  await assertRevenue('proposal', 'starter-user', { allowed: false, suggestedUpgrade: 'pro' });
  await assertRevenue('profile', 'starter-user', { allowed: false, suggestedUpgrade: 'pro' });

  // Pro is unlimited for proposal/profile, but bulk export remains Studio-only.
  resetState({ plan: 'pro', proposalCount: 99, profileCount: 99 });
  await assertRevenue('invoice', 'pro-user', { allowed: true, suggestedUpgrade: 'pro' });
  await assertRevenue('proposal', 'pro-user', { allowed: true, suggestedUpgrade: 'pro' });
  await assertRevenue('profile', 'pro-user', { allowed: true, suggestedUpgrade: 'starter' });
  await assertRevenue('bulk_export', 'pro-user', { allowed: false, suggestedUpgrade: 'studio' });
  assert.equal(revenueState.auditQueries.length, 0, 'unlimited Pro actions do not query daily audit limits');

  // Studio is the current bulk-export authority and is unlimited otherwise.
  resetState({ plan: 'studio', proposalCount: 99, profileCount: 99 });
  await assertRevenue('invoice', 'studio-user', { allowed: true, suggestedUpgrade: 'pro' });
  await assertRevenue('proposal', 'studio-user', { allowed: true, suggestedUpgrade: 'pro' });
  await assertRevenue('profile', 'studio-user', { allowed: true, suggestedUpgrade: 'starter' });
  await assertRevenue('bulk_export', 'studio-user', { allowed: true, suggestedUpgrade: 'studio' });

  // Service-client absence falls back to the source's free-plan defaults and
  // never attempts a database/network access.
  resetState({ serviceClientAvailable: false });
  await assertRevenue('proposal', 'fallback-user', { allowed: true, suggestedUpgrade: 'pro' });
  await assertRevenue('profile', 'fallback-user', { allowed: true, suggestedUpgrade: 'starter' });
  await assertRevenue('bulk_export', 'fallback-user', { allowed: false, suggestedUpgrade: 'studio' });
  assert.equal(revenueState.auditQueries.length, 0, 'missing service client skips audit-log access safely');

  // Cost estimator authority: representative allow, warn, block, and both
  // strict threshold boundaries from the current source.
  assert.deepEqual(estimateCost('invoice', 500), {
    costUSD: 0.02,
    riskLevel: 'low',
    recommendation: 'allow',
  });
  assert.deepEqual(estimateCost('invoice', 1000).recommendation, 'allow');
  assert.deepEqual(estimateCost('invoice', 1001), {
    costUSD: 0.03002,
    riskLevel: 'medium',
    recommendation: 'warn',
  });
  assert.deepEqual(estimateCost('proposal', 1500).recommendation, 'warn');
  assert.deepEqual(estimateCost('proposal', 1501), {
    costUSD: 0.08002,
    riskLevel: 'high',
    recommendation: 'block',
  });
  assert.deepEqual(estimateCost('bulk_export', 0), {
    costUSD: 0.1,
    riskLevel: 'high',
    recommendation: 'block',
  });

  console.log('REVENUE_LOCK_CURRENT_AUTHORITY=PASS');
  console.log('COST_ESTIMATOR_CURRENT_AUTHORITY=PASS');
  console.log('NETWORK_ACCESS=NO');
  console.log('DATABASE_ACCESS=NO');
  console.log('ENV_SECRET_REQUIRED=NO');
}

run().catch((error) => {
  console.error('REVENUE_LOCK_CURRENT_AUTHORITY=FAIL');
  console.error(error);
  process.exitCode = 1;
});
