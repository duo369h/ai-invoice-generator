import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });
const checkText = (name, text, pattern) => check(name, pattern.test(text));

const guidedPath = 'src/components/dashboard/QuoteEditorGuided.js';
const sharedPath = 'src/components/dashboard/QuoteEditorSharedContext.js';
const dashboardPath = 'src/components/dashboard/Dashboard.js';
const boundaryPath = 'src/components/dashboard/QuotePresentationBoundary.js';
const modePath = 'src/components/dashboard/useQuoteEditorPresentationMode.js';

check('Guided component exists', exists(guidedPath));
const guided = read(guidedPath);
const shared = read(sharedPath);
const dashboard = read(dashboardPath);
const boundary = read(boundaryPath);
const mode = read(modePath);

check('Guided keeps Workflow, Client and compatibility states', ['WORKFLOW', 'CLIENT', 'COMPATIBILITY_DETAILS'].every((state) => guided.includes(state)));
checkText('Guided consumes the shared validation function', guided, /validation\.validateClient/);
checkText('Guided reuses existing Client name touched setter', guided, /validation\.setQuoteClientNameTouched/);
checkText('Guided reuses existing Client email touched setter', guided, /validation\.setQuoteClientEmailTouched/);
check('Mobile-local email regex is absent', !/CLIENT_EMAIL_PATTERN/.test(guided));
check('Mobile-local touched state is absent', !/const \[client(Name|Email)Touched\]\s*=\s*useState/.test(guided));
check('Guided does not define a second client validity rule', !/client(Name|Email)Invalid\s*=|CLIENT_EMAIL|isEmailInvalid/.test(guided));
checkText('Shared context exposes the canonical validator', shared, /export function validateQuoteClient/);
checkText('Dashboard imports the canonical validator', dashboard, /validateQuoteClient/);
checkText('Desktop save uses the canonical validator', dashboard, /const clientValidation = validateQuoteClient/);
checkText('Desktop presentation uses the canonical validator result', dashboard, /quoteClientValidation\.(nameInvalid|emailInvalid)/);
checkText('Existing touched setters are exposed through the shared contract', dashboard, /setQuoteClientNameTouched: setQClientNameTouched/);
checkText('Existing touched setters are exposed through the shared contract', dashboard, /setQuoteClientEmailTouched: setQClientEmailTouched/);
checkText('Guided workflow selection requests scoped feedback suppression', guided, /suppressSuccessFeedback/);
checkText('Workflow handler preserves feedback for non-Guided desktop use', dashboard, /suppressSuccessFeedback/);
checkText('Guided does not call the global toast controller', guided, !/triggerToast/.test(guided) ? /./ : /a^/);
checkText('One active presentation tree remains authoritative', boundary, /data-active-quote-presentation-trees=['"]1['"]/);
checkText('Device boundary remains 1023/1024', mode, /max-width:\s*1023px/);
check('No M03+ or forbidden persistence scope appears in Guided', !/M03|M04|M05|M06|autosave|auto-save|project_id|createProject|createJob|supabase|fetch\(|save\(|send\(/i.test(guided));

const failed = checks.filter(({ passed }) => !passed);
for (const { name, passed } of checks) console.log(`${passed ? 'PASS' : 'FAIL'}: ${name}`);
console.log(`M02_FIX1_SHARED_VALIDATION_TOAST_TARGETED=${failed.length === 0 ? 'PASS' : 'FAIL'}`);
if (failed.length > 0) process.exitCode = 1;
