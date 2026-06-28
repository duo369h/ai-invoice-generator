import fs from 'fs';
import path from 'path';

const pricingPagePath = path.resolve('src/app/pricing/page.js');
const pricingCode = fs.readFileSync(pricingPagePath, 'utf8');

const forbiddenPatterns = [
  { name: 'useUpgradeTrigger', regex: /useUpgradeTrigger/ },
  { name: 'localStorage usageStats decision', regex: /localStorage\.getItem\(['"]corvioz_usage_stats['"]\)/ },
  { name: 'attemptedPlan logic', regex: /attemptedPlan/ },
  { name: 'intent-store decision influence', regex: /getConversionIntent\(\)/ },
];

let failed = false;

console.log('Verifying UI Isolation for pricing page...');

for (const pattern of forbiddenPatterns) {
  if (pattern.regex.test(pricingCode)) {
    const lines = pricingCode.split('\n');
    // Filter out comments to avoid false positives in documentation/comments
    const matchedLines = lines.filter(
      (line) =>
        pattern.regex.test(line) &&
        !line.trim().startsWith('//') &&
        !line.trim().startsWith('*') &&
        !line.trim().startsWith('/*')
    );
    if (matchedLines.length > 0) {
      console.error(`[VIOLATION] Found forbidden pattern "${pattern.name}":`);
      matchedLines.forEach((line) => console.error(`  > ${line.trim()}`));
      failed = true;
    }
  }
}

if (failed) {
  console.error('UI Isolation static verification failed.');
  process.exit(1);
} else {
  console.log('UI Isolation static verification passed successfully. Pricing page is isolated from direct decision logic.');
  process.exit(0);
}
