import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));

const boundaryPath = 'src/components/dashboard/QuotePresentationBoundary.js';
const guidedPath = 'src/components/dashboard/QuoteEditorGuided.js';
const dashboardPath = 'src/components/dashboard/Dashboard.js';
const modePath = 'src/components/dashboard/useQuoteEditorPresentationMode.js';
const workflowPath = 'src/core/quotes/photographyWorkflowTemplates.js';
const layoutsPath = 'src/app/styles/layouts.css';

const boundary = read(boundaryPath);
const dashboard = read(dashboardPath);
const mode = read(modePath);
const workflowRegistry = read(workflowPath);
const layouts = read(layoutsPath);

const checks = [];
function check(name, condition) {
  checks.push({ name, passed: Boolean(condition) });
}
function checkText(name, text, pattern) {
  check(name, pattern.test(text));
}

check('Guided shell component exists', exists(guidedPath));
const guided = exists(guidedPath) ? read(guidedPath) : '';

checkText('Presentation boundary imports the Guided shell', boundary, /QuoteEditorGuided/);
checkText('Guided branch is selected by the existing presentation mode', boundary, /mode\s*===\s*['"]GUIDED['"]/);
checkText('Desktop branch remains the existing children tree', boundary, /children/);
checkText('Boundary does not mount a second tree hidden with CSS', boundary, /mode\s*===\s*['"]GUIDED['"].*\?.*QuoteEditorGuided/s);
checkText('Guided shell consumes the shared Quote contract', guided, /useQuoteEditorShared/);
checkText('Guided shell owns UI-only mobile step state', guided, /useState/);
checkText('Guided shell includes workflow and compatibility states', guided, /WORKFLOW/);
checkText('Guided shell marks compatibility as transitional runtime metadata', guided, /data-guided-compatibility/);
checkText('Compatibility handoff is not presented as technical product copy', guided, /Temporary editing bridge|Edit quote details|Continue/);
check('Guided initial surface has no permanent document preview', !/QuoteClientDocument|quote-client-document|794px/.test(guided));
checkText('Continue only changes presentation step state', guided, /setMobileQuoteStep\(['"]COMPATIBILITY_DETAILS['"]\)/);
check('Guided shell does not call Save or Send', !/\b(save|send|handleSaveQuote|handleSendQuote)\s*\(/i.test(guided));
check('Guided shell does not create Project or Job state', !/project_id|project_name|createProject|createJob|Job\b/.test(guided));
check('Guided shell does not add autosave', !/autosave|auto-save|autoSave/i.test(guided));

for (const [id, label] of [
  ['commercial-shoot', 'Commercial'],
  ['wedding-shoot', 'Wedding'],
  ['portrait-session', 'Portrait'],
  ['event-photography', 'Event'],
]) {
  checkText(`${label} is a compact primary workflow option`, guided, new RegExp(id));
}
for (const id of ['product-photography', 'food-photography', 'architecture-interior']) {
  checkText(`${id} remains in the shared workflow registry`, workflowRegistry, new RegExp(`id:\\s*['"]${id}['"]`));
}
checkText('Additional workflows are mapped from the shared template collection', guided, /additionalTemplates\.map\(\(template\)/);
checkText('Additional workflow buttons use registry IDs', guided, /data-workflow-id=\{template\.id\}/);
checkText('Workflow options use provider workflow templates', guided, /workflow\.templates/);
checkText('Workflow selection uses provider commands', guided, /workflow\.applyPreset/);
checkText('Blank Quote remains reachable through provider skip command', guided, /workflow\.skipPreset/);
check('Descriptions are hidden by default', !/shortDescription/.test(guided));
checkText('Guided primary action is singular', guided, /Continue/);
checkText('Guided selector is compact and scrollable', layouts, /quote-guided-workflow-selector[\s\S]*overflow-x:\s*auto/);
checkText('Guided touch targets are usable', layouts, /quote-guided-workflow-tab[\s\S]*min-height:\s*44px/);

check('Only one shared provider is mounted in Dashboard', (dashboard.match(/<QuoteEditorSharedProvider\b/g) || []).length === 1);
check('Only one presentation boundary is mounted in Dashboard', (dashboard.match(/<QuotePresentationBoundary\b/g) || []).length === 1);
checkText('Dashboard still uses the existing shared contract', dashboard, /createQuoteEditorSharedContract/);
check('No duplicate mobile Quote business state names exist', !/mobileQ(ClientName|Items|Currency|Scope|Totals|Save|Send)/.test(`${dashboard}\n${guided}\n${boundary}`));
checkText('Device breakpoint remains 1023/1024 authority', mode, /max-width:\s*1023px/);
checkText('Guided branch is marked as a single active tree', boundary, /data-active-quote-presentation-trees=['"]1['"]/);
checkText('Compatibility state is marked transitional and not final', guided, /TRANSITIONAL|NOT_FINAL_AUTHORITY/);
check('No QE02 import exists in M01 surfaces', !/QE02|activeQuoteRegion/.test(`${boundary}\n${guided}\n${dashboard}`));

const failed = checks.filter(({ passed }) => !passed);
for (const { name, passed } of checks) console.log(`${passed ? 'PASS' : 'FAIL'}: ${name}`);
console.log(`M01_GUIDED_SHELL_TARGETED=${failed.length === 0 ? 'PASS' : 'FAIL'}`);
if (failed.length > 0) process.exitCode = 1;
