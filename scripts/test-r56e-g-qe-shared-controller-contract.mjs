import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const baseSha = '690d2555e42dd49a331fb30500664609da9ed161';
const dashboardPath = 'src/components/dashboard/Dashboard.js';
const contractPath = 'src/components/dashboard/QuoteEditorSharedContext.js';
const consumerProofPath = 'scripts/test-r56e-g-qe-shared-controller-consumer-proof.mjs';
const browserPath = 'scripts/test-r56e-g-qe-shared-controller-browser-runtime.mjs';
const testPath = 'scripts/test-r56e-g-qe-shared-controller-contract.mjs';
const read = (path) => existsSync(path) ? readFileSync(path, 'utf8') : '';
const dashboardSource = read(dashboardPath);
const contractSource = read(contractPath);
const changedFiles = [
  ...execFileSync('git', ['diff', '--name-only', baseSha, '--'], { encoding: 'utf8' }).trim().split('\n'),
  ...execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { encoding: 'utf8' }).trim().split('\n'),
].filter(Boolean);

assert.ok(existsSync(contractPath), 'shared Quote contract/provider must exist');
assert.match(contractSource, /createContext/);
assert.match(contractSource, /QuoteEditorSharedProvider/);
assert.match(contractSource, /useQuoteEditorShared/);
assert.match(contractSource, /createQuoteEditorSharedContract/);
assert.doesNotMatch(contractSource, /activeQuoteRegion|mobileQuoteStep|mobilePreviewOpen|desktopFocus|stickyAction|phoneKeyboard/);

assert.match(dashboardSource, /QuoteEditorSharedProvider/);
assert.match(dashboardSource, /createQuoteEditorSharedContract/);
assert.equal((dashboardSource.match(/<QuoteEditorSharedProvider\b/g) || []).length, 1, 'exactly one shared Quote provider instance');
assert.equal((dashboardSource.match(/<QuotePresentationBoundary\b/g) || []).length, 1, 'exactly one presentation boundary');
assert.ok(dashboardSource.indexOf('<QuoteEditorSharedProvider') < dashboardSource.indexOf('<QuotePresentationBoundary'), 'shared provider must wrap the presentation boundary');
assert.ok(dashboardSource.includes('const quoteSharedContract = createQuoteEditorSharedContract({'), 'Dashboard must expose one explicit shared contract');

for (const stateName of ['qId', 'qNumber', 'qClientId', 'qClientName', 'qClientEmail', 'qClientAddress', 'qItems', 'qTaxRate', 'qDiscountRate', 'qCurrency', 'qNotes', 'qDate', 'qStatus', 'qPhotographyScope']) {
  assert.equal((dashboardSource.match(new RegExp(`const \\[${stateName}, set`, 'g')) || []).length, 1, `${stateName} must remain one q* state instance`);
  assert.match(dashboardSource, new RegExp(`${stateName}(?:\\s*:|\\s*,)`), `${stateName} must be exposed by the shared contract`);
}

for (const setterName of ['setQNumber', 'setQClientId', 'setQClientName', 'setQClientEmail', 'setQClientAddress', 'setQItems', 'setQTaxRate', 'setQDiscountRate', 'setQCurrency', 'setQNotes', 'setQDate', 'setQPhotographyScope']) {
  assert.match(dashboardSource, new RegExp(`${setterName}\\b`), `${setterName} must remain the existing edit authority`);
}

for (const marker of ['qClientNameTouched', 'qClientEmailTouched', 'qSubmitAttempted', 'selectedQuotePresetId', 'quotePresetSelectionTouched', 'PHOTOGRAPHY_WORKFLOW_TEMPLATES', 'quoteTotals', 'calculateQuoteTotals', 'handleSaveQuote', 'handleSendQuote', 'handleExportAttempt', 'handleCancelQuote', 'handleConvertQuoteToInvoice']) {
  assert.match(dashboardSource, new RegExp(marker), `${marker} must remain in the shared authority contract`);
}

assert.match(contractSource, /quote/);
assert.match(contractSource, /setters/);
assert.match(contractSource, /validation/);
assert.match(contractSource, /workflow/);
assert.match(contractSource, /derived/);
assert.match(contractSource, /actions/);
assert.doesNotMatch(dashboardSource, /if\s*\(\s*(mobile|desktop)\s*\)\s*(save|send)|mobile.*handleSave|desktop.*handleSave/i, 'Save/Send must not fork by device');
assert.equal(execFileSync('git', ['diff', '--name-only', baseSha, '--', 'supabase', 'src/app/api'], { encoding: 'utf8' }).trim(), '', 'SHARED-01 must not change persistence/API paths');
const dashboardAddedLines = execFileSync('git', ['diff', '--unified=0', baseSha, '--', dashboardPath], { encoding: 'utf8' })
  .split('\n')
  .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
  .join('\n');
assert.doesNotMatch(dashboardAddedLines, /autosave|mobileQuoteStep|activeQuoteRegion|QuoteContextEditor|quote-context-editor-mobile-breakout|Project|Job|Portal|Approval/i, 'SHARED-01 must not import later product/device work');

const changedSourceFiles = changedFiles.filter((file) => file.startsWith('src/') || file.startsWith('scripts/'));
const allowedFiles = new Set([dashboardPath, contractPath, testPath, consumerProofPath, browserPath]);
assert.equal(changedSourceFiles.every((file) => allowedFiles.has(file)), true, `changed files must remain narrow: ${changedSourceFiles.filter((file) => !allowedFiles.has(file)).join(', ')}`);

console.log('R56E-G-QE-SHARED-01 shared controller contract: PASS');
