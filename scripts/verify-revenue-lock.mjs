import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Setup Mock Supabase Client for Testing
global.mockPlan = 'free';
global.mockCount = 0;

const queryBuilder = {
  select() { return this; },
  eq() { return this; },
  gte() { return this; },
  is() { return this; },
  order() { return this; },
  limit() { return this; },
  single() { return Promise.resolve({ data: { plan: global.mockPlan }, count: global.mockCount, error: null }); },
  maybeSingle() { return Promise.resolve({ data: { plan: global.mockPlan }, count: global.mockCount, error: null }); },
  then(resolve) {
    resolve({ count: global.mockCount, data: [], error: null });
  }
};

global.mockSupabaseClient = {
  from() { return queryBuilder; }
};

// 2. Transpile TS to ESM JS
function transpile(tsContent) {
  let js = tsContent;
  
  // Strip TypeScript interface/types
  js = js.replace(/export interface [\s\S]*?\n\}/g, '');
  js = js.replace(/export type [\s\S]*?;/g, '');
  
  // Strip type annotations
  js = js.replace(/:\s*PromptType\b/g, '');
  js = js.replace(/:\s*PromptExecutionResult\b/g, '');
  js = js.replace(/:\s*RevenueLockResult\b/g, '');
  js = js.replace(/:\s*CostEstimationResult\b/g, '');
  js = js.replace(/:\s*Promise<[\s\S]*?>/g, '');
  js = js.replace(/:\s*string\s*\|\s*null/g, '');
  js = js.replace(/:\s*string/g, '');
  js = js.replace(/:\s*number/g, '');
  js = js.replace(/:\s*boolean/g, '');
  js = js.replace(/as const;/g, ';');
  js = js.replace(/,\s*PromptType\b/g, '');
  js = js.replace(/:\s*(?:['"a-z_]+\s*\|\s*)+['"a-z_]+/gi, '');
  
  // Replace Supabase imports with Mock client
  js = js.replace(
    /import \{\s*createServiceSupabaseClient\s*\} from '..\/..\/src\/app\/lib\/supabase';/g,
    'const createServiceSupabaseClient = () => global.mockSupabaseClient;'
  );

  // Fix imports extension for transpiled mjs files
  js = js.replace(/from\s+'(\.\/.*?)'/g, "from '$1.mjs'");
  js = js.replace(/from\s+'(\.\.\/.*?)'/g, "from '$1.mjs'");

  return js;
}

const tmpDir = path.resolve(__dirname, './tmp-revenue-test');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

const filesToTranspile = [
  { src: '../lib/prompt/architecture/promptArchitectureMap.ts', dest: './architecture/promptArchitectureMap.mjs' },
  { src: '../lib/prompt/promptExecutor.ts', dest: './promptExecutor.mjs' },
  { src: '../lib/revenue/revenueLock.ts', dest: './revenueLock.mjs' },
  { src: '../lib/revenue/costEstimator.ts', dest: './costEstimator.mjs' },
];

for (const file of filesToTranspile) {
  const srcPath = path.resolve(__dirname, file.src);
  const destPath = path.resolve(tmpDir, file.dest);
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const tsContent = fs.readFileSync(srcPath, 'utf8');
  const jsContent = transpile(tsContent);
  fs.writeFileSync(destPath, jsContent, 'utf8');
}

async function runTests() {
  console.log('Running Corvioz Prompt & Revenue Lock Layer Verification...');

  const { PromptArchitectureMap } = await import('./tmp-revenue-test/architecture/promptArchitectureMap.mjs');
  const { executePrompt } = await import('./tmp-revenue-test/promptExecutor.mjs');
  const { checkRevenueLock } = await import('./tmp-revenue-test/revenueLock.mjs');
  const { estimateCost } = await import('./tmp-revenue-test/costEstimator.mjs');

  let failed = false;

  const assert = (condition, message) => {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      failed = true;
    } else {
      console.log(`✓ PASS: ${message}`);
    }
  };

  // --- 1. Prompt Architecture Map Tests ---
  assert(PromptArchitectureMap.invoice.system.includes('freelancers'), 'Invoice template is correct');
  assert(PromptArchitectureMap.quote.constraints.length === 3, 'Quote constraints has 3 items');
  assert(PromptArchitectureMap.profile.tone === 'personal brand positioning', 'Profile tone is personal brand positioning');

  // --- 2. Prompt Executor Tests ---
  const result = executePrompt('invoice', 'User message text here');
  assert(result.systemPrompt === PromptArchitectureMap.invoice.system, 'Executor correctly maps system prompt');
  assert(result.userInput === 'User message text here', 'Executor preserves user input');
  assert(result.constraints.includes('Use USD'), 'Executor maps constraints');

  // --- 3. Cost Estimator Tests ---
  const costInvoice = estimateCost('invoice', 500); // 500 chars -> low tokens
  assert(costInvoice.costUSD === 0.02, 'Invoice estimation math is correct');
  assert(costInvoice.riskLevel === 'low', 'Invoice has low riskLevel');
  assert(costInvoice.recommendation === 'allow', 'Invoice recommendation is allow');

  const costHigh = estimateCost('proposal', 5000); // 5000 tokens proxy -> high cost
  assert(costHigh.costUSD > 0.08, 'High token proposal calculates correct USD cost');
  assert(costHigh.riskLevel === 'high', 'High cost registers high riskLevel');
  assert(costHigh.recommendation === 'block', 'High cost recommends blocking');

  // --- 4. Revenue Lock Tests ---
  // A. Anonymous Checks
  const anonInvoice = await checkRevenueLock(null, 'invoice');
  assert(anonInvoice.allowed === true, 'Anonymous allowed invoice parsing');
  
  const anonExport = await checkRevenueLock(null, 'bulk_export');
  assert(anonExport.allowed === false, 'Anonymous blocked from bulk export');

  // B. Free Tier checks
  global.mockPlan = 'free';
  global.mockCount = 0; // 0 logs today
  const freeInvoice = await checkRevenueLock('user_1', 'invoice');
  assert(freeInvoice.allowed === true, 'Free tier allowed invoice parsing');

  const freeExport = await checkRevenueLock('user_1', 'bulk_export');
  assert(freeExport.allowed === false, 'Free tier blocked from bulk export');
  assert(freeExport.suggestedUpgrade === 'growth', 'Bulk export suggests Pro');

  // C. Daily limit checks for Free tier (Proposals - max 1)
  global.mockPlan = 'free';
  global.mockCount = 0; // 0 proposals created today
  const allowedProposal = await checkRevenueLock('user_1', 'proposal');
  assert(allowedProposal.allowed === true, 'Free tier allowed proposal under limit (0/1)');

  global.mockCount = 1; // 1 proposal created today
  const blockedProposal = await checkRevenueLock('user_1', 'proposal');
  assert(blockedProposal.allowed === false, 'Free tier blocked proposal over limit (1/1)');
  assert(blockedProposal.suggestedUpgrade === 'pro', 'Proposal suggests Pro upgrade');

  // D. Daily limit checks for Free tier (Profiles - max 1)
  global.mockCount = 0; // 0 profiles created today
  const allowedProfile = await checkRevenueLock('user_1', 'profile');
  assert(allowedProfile.allowed === true, 'Free tier allowed profile under limit (0/1)');

  global.mockCount = 1; // 1 profile created today
  const blockedProfile = await checkRevenueLock('user_1', 'profile');
  assert(blockedProfile.allowed === false, 'Free tier blocked profile over limit (1/1)');
  assert(blockedProfile.suggestedUpgrade === 'pro', 'Profile suggests Pro upgrade');

  // E. Premium tier overrides daily limit checks
  global.mockPlan = 'growth';
  global.mockCount = 10; // 10 profiles created today
  const premiumProfile = await checkRevenueLock('user_1', 'profile');
  assert(premiumProfile.allowed === true, 'Growth tier ignores daily profile generation limit');

  // Cleanup temp files
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}

  if (failed) {
    console.error('❌ Corvioz Prompt & Revenue Lock Layer Verification FAILED.');
    process.exit(1);
  } else {
    console.log('✅ Corvioz Prompt & Revenue Lock Layer Verification PASSED.');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error(err);
  try {
    const tmpDir = path.resolve(__dirname, './tmp-revenue-test');
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch (_) {}
  process.exit(1);
});
