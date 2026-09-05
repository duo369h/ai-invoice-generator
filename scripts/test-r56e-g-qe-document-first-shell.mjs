import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { PHOTOGRAPHY_WORKFLOW_TEMPLATES } from '../src/core/quotes/photographyWorkflowTemplates.js';

const baseSha = '1eaafa19941df8dedf7ed90adbbdef865edf0177';
const dashboardPath = 'src/components/dashboard/Dashboard.js';
const documentPath = 'src/components/dashboard/QuoteClientDocument.js';
const previewFramePath = 'src/components/dashboard/QuoteClientDocumentPreviewFrame.js';
const totalsPath = 'src/components/dashboard/quoteTotals.js';
const layoutPath = 'src/app/styles/layouts.css';
const dashboardSource = readFileSync(dashboardPath, 'utf8');
const documentSource = readFileSync(documentPath, 'utf8');
const previewFrameSource = readFileSync(previewFramePath, 'utf8');
const totalsSource = readFileSync(totalsPath, 'utf8');
const layoutSource = readFileSync(layoutPath, 'utf8');
const changedFiles = execFileSync('git', ['diff', '--name-only', baseSha, '--'], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

const allowedFiles = new Set([
  dashboardPath,
  documentPath,
  previewFramePath,
  totalsPath,
  layoutPath,
  'scripts/test-r56e-g-qe-document-first-shell.mjs',
  'scripts/test-r56e-g-qe-browser-runtime.mjs',
]);

assert.ok(changedFiles.every((file) => allowedFiles.has(file)), `QE-01 changed-file scope is narrow: ${changedFiles.join(', ')}`);
assert.equal(existsSync(documentPath), true, 'shared QuoteClientDocument must remain present');
assert.equal(existsSync(previewFramePath), true, 'canonical document preview frame must remain present');
assert.equal(existsSync(totalsPath), true, 'shared Quote totals helper must remain present');
assert.match(dashboardSource, /import QuoteClientDocument from ['"]\.\/QuoteClientDocument['"]/);
assert.match(dashboardSource, /import QuoteClientDocumentPreviewFrame from ['"]\.\/QuoteClientDocumentPreviewFrame['"]/);
assert.equal((dashboardSource.match(/<QuoteClientDocument\b/g) || []).length, 2, 'screen and PDF must use one shared renderer');
assert.match(dashboardSource, /data-testid="quote-client-document-canvas"[\s\S]*<QuoteClientDocumentPreviewFrame>[\s\S]*<QuoteClientDocument\b/);
assert.match(dashboardSource, /id="printable-quote"[\s\S]*<QuoteClientDocument\b/);
assert.match(documentSource, /width: '794px'/);
assert.match(previewFrameSource, /ResizeObserver/);
assert.match(previewFrameSource, /transform:\s*`scale\(/);
assert.match(layoutSource, /\.quote-document-first-shell[\s\S]*display:\s*flex/);
assert.match(layoutSource, /\.quote-client-canvas[\s\S]*order:\s*0/);
assert.match(layoutSource, /\.quote-editor-bridge[\s\S]*order:\s*1/);
assert.equal(dashboardSource.indexOf('data-testid="quote-client-document-canvas"') < dashboardSource.indexOf('data-testid="quote-business-editor"'), true, 'document must precede the temporary editor bridge');
assert.doesNotMatch(dashboardSource, /quoteWorkspaceMode|quote-workspace-mode-switch/);
assert.doesNotMatch(layoutSource, /grid-template-columns:\s*minmax\(420px, 480px\) minmax\(0, 1fr\)/);
assert.match(dashboardSource, /data-testid="quote-workflow-selector"/);
assert.match(dashboardSource, /\['commercial-shoot', 'Commercial'\]/);
assert.match(dashboardSource, /\['wedding-shoot', 'Wedding'\]/);
assert.match(dashboardSource, /\['portrait-session', 'Portrait'\]/);
assert.match(dashboardSource, /\['event-photography', 'Event'\]/);
assert.match(dashboardSource, />More workflows</);
for (const templateId of ['product-photography', 'food-photography', 'architecture-interior']) {
  assert.ok(PHOTOGRAPHY_WORKFLOW_TEMPLATES.some((template) => template.id === templateId), `${templateId} remains registered`);
}
assert.match(dashboardSource, /PHOTOGRAPHY_WORKFLOW_TEMPLATES\.filter\(\(template\) => !\[/, 'More workflows must expose every non-primary registered workflow');
assert.match(dashboardSource, /Food & Beverage/);
assert.match(dashboardSource, /Blank Quote/);
assert.doesNotMatch(dashboardSource, /<span[^>]*>\{template\.shortDescription\}<\/span>/);
assert.doesNotMatch(dashboardSource, /repeat\(auto-fit,\s*minmax\(145px/);
assert.match(dashboardSource, /PHOTOGRAPHY_WORKFLOW_TEMPLATES/);
assert.match(dashboardSource, /quotePresetSelectionTouched/);
assert.match(dashboardSource, /qPhotographyScope/);
assert.match(dashboardSource, /handleSaveQuote/);
assert.match(dashboardSource, /handleSendQuote/);
assert.match(dashboardSource, /data-dashboard-date-entry="english"/);
assert.match(dashboardSource, /placeholder="YYYY-MM-DD"/);
assert.match(dashboardSource, /quoteTotals/);
assert.match(documentSource, /formatMoney\(/);
assert.equal(execFileSync('git', ['diff', '--name-only', baseSha, '--', 'supabase', 'src/app/api'], { encoding: 'utf8' }).trim(), '', 'QE-01 must not change database or API paths');

const changedSource = execFileSync('git', ['diff', '--unified=0', baseSha, '--', dashboardPath, layoutPath, documentPath, previewFramePath, totalsPath], { encoding: 'utf8' });
assert.equal((changedSource.match(/\b(fetch|supabase)\s*\(/g) || []).length, 0, 'QE-01 must not add persistence/API calls');
assert.doesNotMatch(changedSource, /AI Price|Market Price|Generate Price|Portal|Approval|Project|Job/);
assert.match(totalsSource, /export function calculateQuoteTotals/);
assert.match(totalsSource, /total: discountedSubtotal \+ tax/);

console.log('R56E-G-QE-01 document-first shell contract: PASS');
