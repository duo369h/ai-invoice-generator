import assert from 'node:assert/strict';
import fs from 'node:fs';

const layoutSource = fs.readFileSync('src/app/layout.js', 'utf8');
const configSource = fs.readFileSync('src/app/lib/config.js', 'utf8');
const publicSourceFiles = [
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
  'src/app/invoice-generator/[type]/page.js',
  'src/app/invoice-generator/[type]/[country]/page.js',
  'src/app/invoice-generator/[type]/[country]/[use-case]/page.js',
  'src/app/quote-generator/[type]/page.js',
  'src/app/quote-generator/[type]/[country]/page.js',
  'src/app/quote-generator/[type]/[country]/[use-case]/page.js',
];
const publicSource = publicSourceFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const canonicalAuthorityFiles = [
  'src/app/layout.js',
  'src/app/sitemap.js',
  'src/app/robots.js',
  'src/app/rss.xml/route.js',
  'src/app/components/SeoEntryLandingPage.js',
  'src/app/components/SeoMoneyPage.js',
  'src/app/blog/[slug]/page.js',
  'src/app/invoice-generator/[type]/page.js',
  'src/app/invoice-generator/[type]/[country]/page.js',
  'src/app/invoice-generator/[type]/[country]/[use-case]/page.js',
  'src/app/quote-generator/[type]/page.js',
  'src/app/quote-generator/[type]/[country]/page.js',
  'src/app/quote-generator/[type]/[country]/[use-case]/page.js',
];
const publicSocialMetadataFiles = [
  'src/app/blog/[slug]/page.js',
  'src/app/card/[username]/page.js',
  'src/app/consultants/page.js',
  'src/app/designers/page.js',
  'src/app/developers/page.js',
  'src/app/freelancer-profile-demo/page.js',
  'src/app/freelancers/[category]/page.js',
  'src/app/freelancers/page.js',
  'src/app/how-it-works/page.js',
  'src/app/invoice-generator/[type]/[country]/[use-case]/page.js',
  'src/app/invoice-generator/[type]/[country]/page.js',
  'src/app/invoice-generator/[type]/page.js',
  'src/app/invoice-generator/page.js',
  'src/app/invoice-template/[industry]/page.js',
  'src/app/invoice-template/page.js',
  'src/app/marketers/page.js',
  'src/app/photographer-invoice-software/page.js',
  'src/app/photographer-invoice-template/page.js',
  'src/app/photographer-quote-template/page.js',
  'src/app/profile/[username]/page.js',
  'src/app/quote-generator/[type]/[country]/[use-case]/page.js',
  'src/app/quote-generator/[type]/[country]/page.js',
  'src/app/quote-generator/[type]/page.js',
  'src/app/quote-generator/page.js',
  'src/app/quote-template/[industry]/page.js',
  'src/app/quote-template/page.js',
];

assert.match(
  configSource,
  /export function getCanonicalSiteUrl\(\)/,
  'canonical metadata must use a dedicated authority function',
);

function evaluateConfig(source, siteUrl) {
  const executable = source
    .replaceAll('export function ', 'function ')
    .replaceAll('export const ', 'const ');
  return new Function('process', `${executable}\nreturn { getSiteUrl, getCanonicalSiteUrl };`)({
    env: { NEXT_PUBLIC_SITE_URL: siteUrl },
  });
}

const hostilePreviewUrl = 'https://some-preview.vercel.app';
const config = evaluateConfig(configSource, hostilePreviewUrl);
assert.equal(config.getSiteUrl(), hostilePreviewUrl, 'runtime URL behavior must remain environment-aware');
assert.equal(
  config.getCanonicalSiteUrl(),
  'https://www.corvioz.com',
  'canonical authority must ignore a hostile Preview SITE_URL',
);

for (const file of canonicalAuthorityFiles) {
  const source = fs.readFileSync(file, 'utf8');
  assert.match(
    source,
    /getCanonicalSiteUrl/,
    `${file} must use canonical authority for public metadata`,
  );
  assert.doesNotMatch(
    source,
    /getSiteUrl\s*\(/,
    `${file} must not use the runtime URL for public metadata`,
  );
}

assert.match(layoutSource, /metadataBase:\s*new URL\(canonicalSiteUrl\)/);
assert.match(layoutSource, /url:\s*canonicalSiteUrl/);
assert.match(layoutSource, /url:\s*canonicalOgImageUrl/);
assert.match(layoutSource, /images:\s*\[canonicalTwitterImageUrl\]/);
assert.equal(
  fs.existsSync('src/app/opengraph-image.png'),
  false,
  'file-based Open Graph metadata must not override the canonical absolute image URL',
);
assert.equal(
  fs.existsSync('src/app/twitter-image.png'),
  false,
  'file-based Twitter metadata must not override the canonical absolute image URL',
);
assert.equal(fs.existsSync('public/opengraph-image.png'), true, 'the Open Graph asset must remain available at a public path');
assert.equal(fs.existsSync('public/twitter-image.png'), true, 'the Twitter asset must remain available at a public path');
assert.match(fs.readFileSync('src/app/sitemap.js', 'utf8'), /const baseUrl = getCanonicalSiteUrl\(\)/);
assert.match(fs.readFileSync('src/app/robots.js', 'utf8'), /const baseUrl = getCanonicalSiteUrl\(\)/);
assert.match(fs.readFileSync('src/app/rss.xml/route.js', 'utf8'), /const baseUrl = getCanonicalSiteUrl\(\)/);
for (const file of publicSocialMetadataFiles) {
  const source = fs.readFileSync(file, 'utf8');
  assert.match(source, /images:\s*\[CANONICAL_OG_IMAGE_URL\]/, `${file} must pin its OG image to canonical authority`);
  if (/twitter\s*:/.test(source)) {
    assert.match(source, /images:\s*\[CANONICAL_TWITTER_IMAGE_URL\]/, `${file} must pin its Twitter image to canonical authority`);
  }
}

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
console.log('ENV_PREVIEW_URL_CANNOT_OVERRIDE_CANONICAL=PASS');
