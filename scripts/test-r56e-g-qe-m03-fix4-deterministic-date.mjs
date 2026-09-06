import fs from 'node:fs';

const guidedSource = fs.readFileSync(new URL('../src/components/dashboard/QuoteEditorGuided.js', import.meta.url), 'utf8');
const checks = [
  ['Guided Scope declares shoot_date as a date field', /field:\s*'shoot_date'[\s\S]*?kind:\s*'date'/.test(guidedSource)],
  ['Guided date controls use deterministic text presentation', /type=\{kind\s*===\s*'date'\s*\?\s*'text'\s*:\s*kind\}/.test(guidedSource)],
  ['Guided date controls show YYYY-MM-DD placeholder', /placeholder:\s*kind\s*===\s*'date'\s*\?\s*'YYYY-MM-DD'/.test(guidedSource)],
  ['Guided date controls use numeric input mode', /inputMode:\s*kind\s*===\s*'date'\s*\?\s*'numeric'/.test(guidedSource)],
  ['Guided date controls use the YYYY-MM-DD pattern', /pattern:\s*kind\s*===\s*'date'\s*\?\s*'\\\\d\{4\}-\\\\d\{2\}-\\\\d\{2}'/.test(guidedSource)],
  ['Guided source contains no native date input', !/type\s*=\s*['"]date['"]/.test(guidedSource)],
];

let failed = 0;
for (const [label, passed] of checks) {
  if (passed) console.log(`PASS: ${label}`);
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}

console.log(`M03_FIX4_DETERMINISTIC_DATE_TARGETED=${failed === 0 ? 'PASS' : 'FAIL'}`);
if (failed > 0) process.exitCode = 1;
