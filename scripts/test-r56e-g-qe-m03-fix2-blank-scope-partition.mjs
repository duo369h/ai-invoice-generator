import fs from 'node:fs';
import path from 'node:path';

const sourcePath = path.join(process.cwd(), 'src/components/dashboard/QuoteEditorGuided.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const checks = [];
const check = (name, condition) => checks.push({ name, passed: Boolean(condition) });

check('Blank partition has an explicit primary subset', /blankPrimaryFields/.test(source));
check('Blank partition has an explicit secondary subset', /blankSecondaryFields/.test(source));
check('Blank secondary fields exclude Blank primary fields', /blankSecondaryFields[\s\S]*blankPrimaryFields/.test(source));
check('Blank does not use workflow priority fallback for presentation', /selectedTemplate \? primaryScopeFields : blankPrimaryFields/.test(source));
check('Blank primary and secondary surfaces use neutral wording', /Start here|More details|Neutral/.test(source));
check('Blank Scope remains a single shared business state', /quote\.qPhotographyScope[\s\S]*scope\.updateField/.test(source));
check('Blank primary fields are not re-rendered in secondary disclosures', !/neutralScopeFields[\s\S]*optionalScopeFields/.test(source));

const failed = checks.filter(({ passed }) => !passed);
for (const { name, passed } of checks) console.log(`${passed ? 'PASS' : 'FAIL'}: ${name}`);
console.log(`M03_FIX2_BLANK_SCOPE_PARTITION_TARGETED=${failed.length === 0 ? 'PASS' : 'FAIL'}`);
if (failed.length > 0) process.exitCode = 1;
