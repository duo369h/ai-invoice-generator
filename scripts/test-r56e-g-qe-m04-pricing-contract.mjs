import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const guidedPath = 'src/components/dashboard/QuoteEditorGuided.js';
const dashboardPath = 'src/components/dashboard/Dashboard.js';
const guided = read(guidedPath);
const dashboard = read(dashboardPath);

assert.match(guided, /data-testid="quote-guided-pricing-step"/);
assert.match(guided, /data-guided-step="PRICING"/);
assert.match(guided, /quote\.qItems/);
assert.match(guided, /setters\.setQuoteItems/);
assert.match(guided, /quote\.qTaxRate/);
assert.match(guided, /setters\.setQuoteTaxRate/);
assert.match(guided, /quote\.qDiscountRate/);
assert.match(guided, /setters\.setQuoteDiscountRate/);
assert.match(guided, /quote\.qCurrency/);
assert.match(guided, /setters\.setQuoteCurrency/);
assert.match(guided, /derived\.totals/);
assert.match(guided, /derived\.formatMoney/);
assert.match(guided, /setMobileQuoteStep\('PRICING'\)/);
assert.match(guided, /setMobileQuoteStep\('SCOPE'\)/);
assert.match(guided, /setMobileQuoteStep\('COMPATIBILITY_DETAILS'\)/);

for (const currency of ['USD', 'CAD', 'EUR', 'GBP', 'CNY']) assert.match(guided, new RegExp(`['"]${currency}['"]`));
assert.match(guided, /quote-guided-pricing-item/);
assert.match(guided, /quote-guided-pricing-add-item/);
assert.match(guided, /quote-guided-pricing-remove-item/);
assert.match(guided, /quote-guided-pricing-adjustments/);
assert.match(guided, /quote-guided-pricing-discount/);
assert.match(guided, /quote-guided-pricing-tax/);
assert.match(guided, /ACTIVE_PRICING_EDIT_BLOCKS_MAX|data-pricing-edit-block/);

assert.doesNotMatch(guided, /mobileItems|mobilePricing|mobileTax|mobileDiscount|mobileCurrency|mobileTotals/);
assert.doesNotMatch(guided, /calculateMobileTotals|mobileSubtotal|mobileTotalFormula/);
assert.doesNotMatch(guided, /market rate|market average|recommended market|AI pricing|rate card|FX conversion/i);
assert.doesNotMatch(guided, /fetch\(|save\s*\(|send\s*\(|autosave|auto-save/i);
assert.match(dashboard, /formatMoney:\s*formatDashboardMoney/);

console.log('R56E-G-QE-M04 pricing contract: PASS');
