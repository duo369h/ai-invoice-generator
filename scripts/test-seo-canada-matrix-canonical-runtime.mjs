import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const appRoot = process.cwd();
const canonicalOrigin = (process.env.SEO_EXPECTED_CANONICAL_ORIGIN || 'https://www.corvioz.com').replace(/\/$/, '');

function pass(message) {
  console.log(`PASS ${message}`);
}

async function importSourceModule(relativePath) {
  const source = await readFile(path.join(appRoot, relativePath), 'utf8');
  const encoded = Buffer.from(source).toString('base64');
  return import(`data:text/javascript;base64,${encoded}#${Date.now()}`);
}

async function findOpenPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function startServer() {
  if (process.env.SEO_TEST_BASE_URL) {
    return {
      baseUrl: process.env.SEO_TEST_BASE_URL.replace(/\/$/, ''),
      stop: async () => {},
    };
  }

  const port = await findOpenPort();
  const nextCli = path.join(appRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(
    process.execPath,
    [nextCli, 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)],
    {
      cwd: appRoot,
      env: {
        ...process.env,
        NEXT_PUBLIC_SITE_URL: canonicalOrigin,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  let logs = '';
  child.stdout.on('data', (chunk) => { logs += chunk; });
  child.stderr.on('data', (chunk) => { logs += chunk; });
  const baseUrl = `http://127.0.0.1:${port}`;

  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Next server exited before readiness.\n${logs}`);
    }
    try {
      await fetch(`${baseUrl}/ca`, { redirect: 'manual', signal: AbortSignal.timeout(2_000) });
      return {
        baseUrl,
        stop: async () => {
          child.kill('SIGTERM');
          await new Promise((resolve) => {
            child.once('exit', resolve);
            setTimeout(resolve, 5_000);
          });
        },
      };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  child.kill('SIGTERM');
  throw new Error(`Timed out waiting for Next server.\n${logs}`);
}

async function request(baseUrl, pathname, options = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    redirect: 'manual',
    signal: AbortSignal.timeout(15_000),
    ...options,
  });
}

function canonicalHrefs(html) {
  return [...html.matchAll(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/gi)]
    .map((match) => match[1]);
}

function matrixTerminalCountry(url) {
  const pathname = new URL(url).pathname;
  const match = pathname.match(/^\/(?:quote-generator|invoice-generator)\/[^/]+\/(ca|canada)(?:\/[^/]+)?$/);
  return match?.[1] || null;
}

async function listFilesRecursively(directory) {
  const files = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFilesRecursively(absolutePath));
    if (entry.isFile()) files.push(absolutePath);
  }
  return files;
}

const seoDataSource = await readFile(path.join(appRoot, 'src/app/lib/seo-data.js'), 'utf8');
const seo = await importSourceModule('src/app/lib/seo-data.js');
const nextConfigModule = await import(`${pathToFileURL(path.join(appRoot, 'next.config.mjs')).href}?t=${Date.now()}`);
const redirects = await nextConfigModule.default.redirects();

assert.equal(seo.matrixSeoCountries.filter((country) => country.slug === 'ca').length, 0);
pass('matrix country data excludes the ca alias');
assert.equal(seo.matrixSeoCountries.filter((country) => country.slug === 'canada').length, 1);
pass('matrix country data has one canonical canada entry');
assert.equal(seo.matrixSeoParams.some((params) => params.country === 'ca'), false);
assert.equal(seo.matrixCountryParams.some((params) => params.country === 'ca'), false);
pass('both matrix static-param generators exclude ca');
assert.equal(seo.matrixSeoPaths.filter((url) => matrixTerminalCountry(`https://example.test${url}`) === 'ca').length, 0);
assert.equal(seo.matrixSeoPaths.filter((url) => matrixTerminalCountry(`https://example.test${url}`) === 'canada').length, 96);
assert.equal(new Set(seo.matrixSeoPaths).size, seo.matrixSeoPaths.length);
pass('matrix sitemap source has 0 ca URLs, 96 canada URLs, and no duplicates');

const programmaticCanada = seo.programmaticSeoPaths.filter((url) => url.endsWith('/canada'));
assert.deepEqual(programmaticCanada.sort(), ['/invoice-generator/canada', '/quote-generator/canada']);
pass('the two programmatic canada pages remain present');

const expectedRedirects = new Map([
  ['/quote-generator/:type/ca', '/quote-generator/:type/canada'],
  ['/quote-generator/:type/ca/:useCase', '/quote-generator/:type/canada/:useCase'],
  ['/invoice-generator/:type/ca', '/invoice-generator/:type/canada'],
  ['/invoice-generator/:type/ca/:useCase', '/invoice-generator/:type/canada/:useCase'],
]);
for (const [source, destination] of expectedRedirects) {
  const redirect = redirects.find((entry) => entry.source === source);
  assert.ok(redirect, `missing shared redirect ${source}`);
  assert.equal(redirect.destination, destination);
  assert.equal(redirect.permanent, true);
}
pass('all four shared matrix route families declare permanent ca-to-canada redirects');

const canada = seo.matrixSeoCountries.find((country) => country.slug === 'canada');
assert.deepEqual(
  {
    label: canada.label,
    currency: canada.currency,
    symbol: canada.symbol,
    taxLabel: canada.taxLabel,
    taxRate: canada.taxRate,
  },
  {
    label: 'Canada',
    currency: 'CAD',
    symbol: 'C$',
    taxLabel: 'GST/HST',
    taxRate: 0.13,
  }
);
assert.match(seoDataSource, /clients in Canada/);
pass('legitimate Canada locale, currency, tax, and audience data remains intact');

const buildIdPath = path.join(appRoot, '.next', 'BUILD_ID');
const sourcePaths = [
  path.join(appRoot, 'src/app/lib/seo-data.js'),
  path.join(appRoot, 'next.config.mjs'),
];
let buildIsFresh = false;
try {
  const [buildIdStat, ...sourceStats] = await Promise.all([stat(buildIdPath), ...sourcePaths.map((file) => stat(file))]);
  buildIsFresh = sourceStats.every((sourceStat) => buildIdStat.mtimeMs >= sourceStat.mtimeMs);
} catch {
  buildIsFresh = false;
}

if (buildIsFresh) {
  const prerenderManifestPath = path.join(appRoot, '.next', 'prerender-manifest.json');
  const prerenderManifest = JSON.parse(await readFile(prerenderManifestPath, 'utf8'));
  const builtRoutes = Object.keys(prerenderManifest.routes || {});
  assert.equal(
    builtRoutes.some((route) => /^\/(?:quote-generator|invoice-generator)\/[^/]+\/ca(?:\/|$)/.test(route)),
    false
  );
  assert.equal(builtRoutes.includes('/ca'), false);
  assert.equal(builtRoutes.includes('/canada'), false);
  pass('build prerender manifest contains neither matrix ca pages nor top-level Canada pages');

  const builtHtmlFiles = (await listFilesRecursively(path.join(appRoot, '.next', 'server', 'app')))
    .filter((file) => file.endsWith('.html'));
  assert.equal(
    builtHtmlFiles.some((file) => /\/(?:quote-generator|invoice-generator)\/[^/]+\/ca(?:\/|\.html$)/.test(file)),
    false
  );
  pass('build output does not contain matrix ca HTML pages');
} else {
  console.log('INFO build output is absent or older than the changed SEO sources; build assertions are deferred');
}

const server = await startServer();
try {
  for (const topLevelPath of ['/ca', '/canada']) {
    const response = await request(server.baseUrl, topLevelPath);
    assert.equal(response.status, 404, `${topLevelPath} must remain 404`);
  }
  pass('top-level /ca and /canada remain 404');

  const routeFamilySamples = [
    '/quote-generator/freelancer/canada',
    '/quote-generator/consultant/canada/hourly',
    '/invoice-generator/web-designer/canada',
    '/invoice-generator/photographer/canada/project',
  ];
  for (const canonicalPath of routeFamilySamples) {
    const canonicalResponse = await request(server.baseUrl, canonicalPath);
    assert.equal(canonicalResponse.status, 200, `${canonicalPath} must return 200`);
    assert.equal(canonicalResponse.headers.has('location'), false, `${canonicalPath} must not redirect`);
    const html = await canonicalResponse.text();
    assert.deepEqual(canonicalHrefs(html), [`${canonicalOrigin}${canonicalPath}`]);
    assert.equal(/(?:href|item|url)=?["']?[^"'<\s]*\/ca(?:\/|["'<\s])/i.test(html), false);

    const aliasPath = canonicalPath.replace('/canada', '/ca');
    const aliasResponse = await request(server.baseUrl, aliasPath);
    assert.equal(aliasResponse.status, 308, `${aliasPath} must return 308`);
    const location = aliasResponse.headers.get('location');
    assert.ok(location, `${aliasPath} must provide Location`);
    const resolvedLocation = new URL(location, server.baseUrl);
    assert.equal(resolvedLocation.pathname, canonicalPath);
    const finalResponse = await request(server.baseUrl, `${resolvedLocation.pathname}${resolvedLocation.search}`);
    assert.equal(finalResponse.status, 200, `${aliasPath} must redirect directly to a 200 page`);
    assert.equal(finalResponse.headers.has('location'), false, `${aliasPath} must not create a redirect chain`);
  }
  pass('four route families return canonical 200 pages and one-hop 308 alias redirects');

  const queryAlias = '/quote-generator/freelancer/ca?x=1';
  const queryResponse = await request(server.baseUrl, queryAlias);
  assert.equal(queryResponse.status, 308);
  const queryLocation = new URL(queryResponse.headers.get('location'), server.baseUrl);
  assert.equal(queryLocation.pathname, '/quote-generator/freelancer/canada');
  assert.equal(queryLocation.search, '?x=1');
  pass('ca redirect preserves the query string');

  const sitemapResponse = await request(server.baseUrl, '/sitemap.xml');
  assert.equal(sitemapResponse.status, 200);
  const sitemapXml = await sitemapResponse.text();
  const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const matrixCa = sitemapUrls.filter((url) => matrixTerminalCountry(url) === 'ca');
  const matrixCanada = sitemapUrls.filter((url) => matrixTerminalCountry(url) === 'canada');
  assert.equal(matrixCa.length, 0);
  assert.equal(matrixCanada.length, 96);
  assert.equal(new Set(sitemapUrls).size, sitemapUrls.length);
  for (const programmaticPath of ['/invoice-generator/canada', '/quote-generator/canada']) {
    assert.ok(sitemapUrls.some((url) => new URL(url).pathname === programmaticPath));
  }
  pass('runtime sitemap has 0 matrix ca URLs, 96 matrix canada URLs, two programmatic canada pages, and no duplicates');

  const otherCountryResponse = await request(server.baseUrl, '/invoice-generator/consultant/us/hourly');
  assert.equal(otherCountryResponse.status, 200);
  assert.deepEqual(
    canonicalHrefs(await otherCountryResponse.text()),
    [`${canonicalOrigin}/invoice-generator/consultant/us/hourly`]
  );
  pass('another country remains 200 with its original self-canonical');

  for (const programmaticPath of ['/invoice-generator/canada', '/quote-generator/canada']) {
    assert.equal((await request(server.baseUrl, programmaticPath)).status, 200);
  }
  pass('two non-matrix programmatic canada pages remain 200');
} finally {
  await server.stop();
}

console.log('SEO_CANADA_MATRIX_CANONICAL_RUNTIME_PASS');
