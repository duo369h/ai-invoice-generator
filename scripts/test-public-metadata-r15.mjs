import assert from 'node:assert/strict';
import fs from 'node:fs';

const layoutSource = fs.readFileSync('src/app/layout.js', 'utf8');
const configSource = fs.readFileSync('src/app/lib/config.js', 'utf8');
const publicSource = [
  'src/app/layout.js',
  'src/app/sitemap.js',
  'src/app/robots.js',
  'src/app/rss.xml/route.js',
  'src/app/page.js',
  'src/app/home/homeFaqData.js',
  'src/app/components/SeoEntryLandingPage.js',
  'src/app/components/SeoMoneyPage.js',
  'src/app/components/TemplateSeoPage.js',
  'src/app/components/MatrixCountryPage.js',
  'src/app/components/MatrixSeoPage.js',
  'src/app/components/ProgrammaticSeoPage.js',
  'src/app/blog/[slug]/page.js',
].map((file) => fs.readFileSync(file, 'utf8')).join('\n');

assert.equal(
  publicSource.includes('google-site-verification-placeholder'),
  false,
  'public metadata must not contain the Google verification placeholder',
);
assert.match(
  layoutSource,
  /NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION\s*\?/,
  'Google verification must be conditional on a configured token',
);
assert.match(
  configSource,
  /https:\/\/www\.corvioz\.com/,
  'the canonical site URL fallback must use the www production origin',
);
assert.equal(
  /https?:\/\/[^\s'"`]*vercel\.app/i.test(publicSource),
  false,
  'public metadata must not contain a Vercel Preview host',
);
assert.equal(
  /https?:\/\/localhost(?::\d+)?/i.test(publicSource),
  false,
  'public metadata must not contain a localhost URL',
);
assert.equal(
  /https?:\/\/corvioz\.com(?:[/'"`]|\s|$)/i.test(publicSource),
  false,
  'public metadata must not hardcode the apex origin',
);
assert.doesNotMatch(
  publicSource,
  /(?:\bproposal\b|\bcrm\b|\be-sign\b|\besign\b|\bonline\s+client\s+payment\b|\bclient\s+payment\s+processing\b)/i,
  'public metadata/JSON-LD must not advertise unsupported capabilities',
);

console.log('PUBLIC_METADATA_R15_CONTRACT_PASS');
