import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Mock Browser Environment
global.window = {
  localStorage: {
    store: {},
    getItem(key) {
      return this.store[key] || null;
    },
    setItem(key, val) {
      this.store[key] = String(val);
    },
    removeItem(key) {
      delete this.store[key];
    },
    clear() {
      this.store = {};
    }
  }
};

// 2. Transpile simple TypeScript to ESM JavaScript
function transpile(tsContent) {
  let js = tsContent;
  // Remove interface blocks
  js = js.replace(/export interface [\s\S]*?}/g, '');
  // Remove type imports
  js = js.replace(/import\s+type\s+[\s\S]*?from\s+.*?;/g, '');
  js = js.replace(/import\s+\{.*type.*\}\s+from\s+.*?;/g, '');
  // Remove function return type annotations
  js = js.replace(/:\s*RevenueMetrics\b/g, '');
  js = js.replace(/:\s*Strategy\[\]/g, '');
  js = js.replace(/:\s*Strategy\b/g, '');
  js = js.replace(/:\s*SafetyState\b/g, '');
  js = js.replace(/:\s*ExperimentDecision\b/g, '');
  js = js.replace(/:\s*UIExecutionOutput\b/g, '');
  js = js.replace(/:\s*GrowthDecision\b/g, '');
  js = js.replace(/:\s*void\b/g, '');
  
  // Remove parameter type annotations
  js = js.replace(/userId:\s*string\s*\|\s*null/g, 'userId');
  js = js.replace(/userId:\s*string/g, 'userId');
  js = js.replace(/metrics:\s*RevenueMetrics/g, 'metrics');
  js = js.replace(/strategy:\s*string/g, 'strategy');
  js = js.replace(/targetPlan:\s*string\s*\|\s*null/g, 'targetPlan');
  js = js.replace(/type:\s*'banner'\s*\|\s*'modal'/g, 'type');
  js = js.replace(/plan:\s*string/g, 'plan');
  
  // Remove variable type annotations
  js = js.replace(/strategies:\s*Strategy\[\]/g, 'strategies');
  js = js.replace(/history:\s*ExposureRecord\[\]/g, 'history');
  js = js.replace(/history:\s*any/g, 'history');
  js = js.replace(/stored:\s*any/g, 'stored');
  js = js.replace(/:\s*(?:'[a-z]+'\s*\|\s*)+\s*null/gi, '');
  
  // Remove typescript type casting/assertions
  js = js.replace(/ as const/g, '');
  
  // Remove interface names from imports using word boundaries
  js = js.replace(/\bRevenueMetrics\b/g, '')
         .replace(/\bStrategy\b/g, '')
         .replace(/\bSafetyState\b/g, '')
         .replace(/\bExperimentDecision\b/g, '')
         .replace(/\bUIExecutionOutput\b/g, '')
         .replace(/\bGrowthDecision\b/g, '')
         .replace(/\bExposureRecord\b/g, '');
         
  // Clean up any double commas or leading/trailing commas inside curly imports
  js = js.replace(/,\s*,/g, ',')
         .replace(/\{\s*,/g, '{')
         .replace(/,\s*\}/g, '}');

  // Remove empty imports
  js = js.replace(/import\s*\{\s*\}\s*from\s*.*?;/g, '');

  // Fix imports to add .mjs extension
  js = js.replace(/from\s+'(\.\/.*?)'/g, "from '$1.mjs'");
  js = js.replace(/from\s+'(\.\.\/.*?)'/g, "from '$1.mjs'");
  
  return js;
}

// Write transpiled files to a temp directory
const tmpDir = path.resolve(__dirname, './tmp-test');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
if (!fs.existsSync(path.join(tmpDir, 'brain'))) fs.mkdirSync(path.join(tmpDir, 'brain'));
if (!fs.existsSync(path.join(tmpDir, 'strategy'))) fs.mkdirSync(path.join(tmpDir, 'strategy'));
if (!fs.existsSync(path.join(tmpDir, 'safety'))) fs.mkdirSync(path.join(tmpDir, 'safety'));
if (!fs.existsSync(path.join(tmpDir, 'experiment'))) fs.mkdirSync(path.join(tmpDir, 'experiment'));
if (!fs.existsSync(path.join(tmpDir, 'execution'))) fs.mkdirSync(path.join(tmpDir, 'execution'));

const filesToTranspile = [
  { src: '../lib/v8/brain/revenueIntelligence.ts', dest: './brain/revenueIntelligence.mjs' },
  { src: '../lib/v8/strategy/strategyEngine.ts', dest: './strategy/strategyEngine.mjs' },
  { src: '../lib/v8/safety/growthSafetyGuard.ts', dest: './safety/growthSafetyGuard.mjs' },
  { src: '../lib/v8/experiment/growthExperimentEngine.ts', dest: './experiment/growthExperimentEngine.mjs' },
  { src: '../lib/v8/execution/uiExecutionEngine.ts', dest: './execution/uiExecutionEngine.mjs' },
  { src: '../lib/v8/index.ts', dest: './index.mjs' },
];

for (const file of filesToTranspile) {
  const srcPath = path.resolve(__dirname, file.src);
  const destPath = path.resolve(tmpDir, file.dest);
  const tsContent = fs.readFileSync(srcPath, 'utf8');
  const jsContent = transpile(tsContent);
  fs.writeFileSync(destPath, jsContent, 'utf8');
}

async function runTests() {
  console.log('Running Corvioz v8 Safe Growth System Verification...');

  // Dynamically import the transpiled modules
  const { getRevenueMetrics } = await import('./tmp-test/brain/revenueIntelligence.mjs');
  const { getStrategies } = await import('./tmp-test/strategy/strategyEngine.mjs');
  const { evaluateSafety, recordGrowthExposure } = await import('./tmp-test/safety/growthSafetyGuard.mjs');
  const { getExperimentDecision } = await import('./tmp-test/experiment/growthExperimentEngine.mjs');
  const { getUIExecution } = await import('./tmp-test/execution/uiExecutionEngine.mjs');
  const { getGrowthDecision } = await import('./tmp-test/index.mjs');

  let failed = false;

  const assert = (condition, message) => {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      failed = true;
    } else {
      console.log(`✓ PASS: ${message}`);
    }
  };

  const userId = 'user_test_99';

  // --- Test 1: Onboarding Block Condition ---
  window.localStorage.clear();
  // Set onboarding timestamp to 10 minutes ago
  window.localStorage.setItem(`corvioz_user_created_at_${userId}`, new Date(Date.now() - 10 * 60 * 1000).toISOString());
  const onboardingMetrics = { ltv: 0, churn_risk: 0.1, upgrade_probability: 0.8, arpu_score: 0.5, engagement_score: 0.8 };
  const onboardingSafety = evaluateSafety(userId, 'upsell_soft_pro', onboardingMetrics, 'pro');
  assert(onboardingSafety.allowed === false, 'Onboarding user (<24h) is blocked from upgrades');
  assert(onboardingSafety.reason.includes('onboarding'), 'Safety reason mentions onboarding block');

  // --- Test 2: High Churn Anxiety Block ---
  window.localStorage.clear();
  // Set onboarding to 2 days ago (not onboarding blocked)
  window.localStorage.setItem(`corvioz_user_created_at_${userId}`, new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
  const highChurnMetrics = { ltv: 0, churn_risk: 0.8, upgrade_probability: 0.5, arpu_score: 0.2, engagement_score: 0.6 };
  const highChurnSafety = evaluateSafety(userId, 'upsell_soft_pro', highChurnMetrics, 'pro');
  assert(highChurnSafety.allowed === false, 'High churn risk user (>0.7) is blocked from upgrades');
  assert(highChurnSafety.reason.includes('churn'), 'Safety reason mentions churn anxiety block');

  // --- Test 3: 24h Cooldown per User Fatigue Limit ---
  window.localStorage.clear();
  window.localStorage.setItem(`corvioz_user_created_at_${userId}`, new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
  const normalMetrics = { ltv: 0, churn_risk: 0.2, upgrade_probability: 0.8, arpu_score: 0.5, engagement_score: 0.7 };
  
  // Record an exposure
  recordGrowthExposure(userId, 'banner', 'pro');
  const cooldownSafety = evaluateSafety(userId, 'upsell_soft_pro', normalMetrics, 'pro');
  assert(cooldownSafety.allowed === false, 'Showing an exposure activates 24h fatigue cooldown');
  assert(cooldownSafety.reason.includes('cooldown'), 'Safety reason mentions cooldown block');

  // --- Test 4: Repeated Exposure Same Plan Block ---
  window.localStorage.clear();
  window.localStorage.setItem(`corvioz_user_created_at_${userId}`, new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
  
  // Save an old exposure that is 2 days old (so outside 24h cooldown, but within 7 days)
  const historyKey = `corvioz_growth_history_${userId}`;
  window.localStorage.setItem(historyKey, JSON.stringify([
    { timestamp: Date.now() - 48 * 60 * 60 * 1000, type: 'banner', plan: 'pro' }
  ]));
  
  const repeatSafety = evaluateSafety(userId, 'upsell_soft_pro', normalMetrics, 'pro');
  assert(repeatSafety.allowed === false, 'Repeated exposure to same plan (within 7 days) is blocked');
  assert(repeatSafety.reason.includes('Repeated exposure'), 'Safety reason mentions repeated exposure block');

  // --- Test 5: A/B Testing Cohort Bucket Segmentation ---
  // Cohorts are deterministic based on userId hash
  const expA = getExperimentDecision('user_1'); // deterministically hashed
  const expB = getExperimentDecision('user_3');
  assert(expA.experimentId === 'v8_safe_growth_ab', 'Experiment ID is standard');
  assert(typeof expA.allowed === 'boolean', 'Experiment returns boolean allowed');

  // --- Test 6: Rollback Flag Check ---
  window.localStorage.setItem('corvioz_growth_rollback', 'true');
  const rollbackDecision = getExperimentDecision('user_1');
  assert(rollbackDecision.allowed === false, 'Rollback flag active blocks all experiment enrollments');
  window.localStorage.removeItem('corvioz_growth_rollback');

  // --- Test 7: Output Schema Integration Check ---
  window.localStorage.clear();
  window.localStorage.setItem(`corvioz_user_created_at_${userId}`, new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
  window.localStorage.setItem('corvioz_usage_stats', JSON.stringify({ invoicesCount: 10, clientsCount: 5 }));
  window.localStorage.setItem('corvioz_export_count', '6');
  window.localStorage.setItem('corvioz_pricing_view_count', '4');

  const decision = getGrowthDecision(userId);
  assert(decision.ui !== undefined, 'Orchestrator returns ui execution object');
  assert(['none', 'soft_upgrade', 'value_hint'].includes(decision.ui.banner), 'ui.banner schema matches specification');
  assert([null, 'upgrade_hint'].includes(decision.ui.modal), 'ui.modal schema matches specification');
  assert([null, 'pro', 'growth', 'studio'].includes(decision.ui.highlightPlan), 'ui.highlightPlan schema matches specification');
  assert(['low', 'medium'].includes(decision.ui.uiIntensity), 'ui.uiIntensity schema matches specification');

  assert(decision.insights !== undefined, 'Orchestrator returns brain metrics');
  assert(decision.insights.engagement_score > 0.5, 'Metrics correctly aggregate active engagement');

  // Cleanup temp files
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}

  if (failed) {
    console.error('❌ Corvioz v8 Safe Growth System Verification FAILED.');
    process.exit(1);
  } else {
    console.log('✅ Corvioz v8 Safe Growth System Verification PASSED.');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error(err);
  try {
    const tmpDir = path.resolve(__dirname, './tmp-test');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}
  process.exit(1);
});
