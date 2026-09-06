import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const guided = read('src/components/dashboard/QuoteEditorGuided.js');
const dashboard = read('src/components/dashboard/Dashboard.js');
const scope = read('src/core/quotes/photographyQuoteScope.js');

assert.match(guided, /data-testid="quote-guided-terms-usage-step"/);
assert.match(guided, /data-guided-step="TERMS_USAGE"/);
assert.match(guided, /setMobileQuoteStep\('TERMS_USAGE'\)/);
assert.match(guided, /setMobileQuoteStep\('PRICING'\)/);
assert.match(guided, /setMobileQuoteStep\('COMPATIBILITY_DETAILS'\)/);
assert.match(guided, /quote\.qPhotographyScope/);
assert.match(guided, /quote\.qNotes/);
assert.match(guided, /setters\.setQuoteNotes/);
assert.match(guided, /scope\.updateField/);
assert.match(guided, /scope\.setUsageRightsStatus/);
assert.match(guided, /data-terms-usage-edit-block="true"/);
assert.match(guided, /usage_rights\.(purpose|media_channels|territory|license_duration|exclusivity)/);
assert.match(guided, /Commercial|Product|Portrait/);

for (const status of ['unspecified', 'specified', 'not_applicable']) assert.match(guided, new RegExp(`['"]${status}['"]`));
assert.match(dashboard, /setPhotographyUsageRightsStatus/);
assert.match(dashboard, /updatePhotographyScopeField/);
assert.match(dashboard, /setQuoteNotes/);
assert.match(scope, /requiresConfirmation/);

assert.doesNotMatch(guided, /mobileUsage|guidedUsage|usageLicenseV2|licensingTerms/);
assert.doesNotMatch(guided, /deposit_percentage|deposit_amount|payment_schedule|net_days|due_rule|late_fee|cancellation_fee|reschedule_fee/);
assert.doesNotMatch(guided, /PaymentTerms|PaymentSchedule|ContractTerms/);
assert.doesNotMatch(guided, /fetch\(|save\s*\(|send\s*\(|autosave|auto-save|semantic|AI legal|AI licensing|AI pricing/i);
assert.doesNotMatch(guided, /normalizePhotographyScope|setPhotographyUsageRightsStatus|updatePhotographyScopeField/);

console.log('R56E-G-QE-M05 Terms/Usage contract: PASS');
