import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dashboardSource = readFileSync('src/components/dashboard/Dashboard.js', 'utf8');
const contractSource = readFileSync('src/components/dashboard/QuoteEditorSharedContext.js', 'utf8');

assert.match(contractSource, /export function QuoteEditorSharedProvider/);
assert.match(contractSource, /export function useQuoteEditorShared/);
assert.match(contractSource, /QuoteEditorSharedContext\.Provider/);
assert.match(dashboardSource, /<QuoteEditorSharedProvider value=\{quoteSharedContract\}>/);
assert.match(dashboardSource, /<QuoteEditorSharedProvider value=\{quoteSharedContract\}>[\s\S]*<QuotePresentationBoundary>[\s\S]*<\/QuotePresentationBoundary>[\s\S]*<\/QuoteEditorSharedProvider>/);
assert.equal((dashboardSource.match(/<QuoteEditorSharedProvider\b/g) || []).length, 1, 'desktop and guided must share one provider instance');
assert.doesNotMatch(dashboardSource, /DesktopQuoteProvider|MobileQuoteProvider|GuidedQuoteProvider/);
assert.doesNotMatch(contractSource, /activeQuoteRegion|mobileQuoteStep|mobilePreviewOpen|desktopFocus|stickyAction|phoneKeyboard/);

console.log('R56E-G-QE-SHARED-01 same-provider consumer proof: PASS');
