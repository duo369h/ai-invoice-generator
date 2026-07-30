import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';

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

async function request(baseUrl, pathname) {
  return fetch(`${baseUrl}${pathname}`, {
    redirect: 'manual',
    signal: AbortSignal.timeout(15_000),
  });
}

function tagText(html, tagName) {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return (match?.[1] || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleText(html) {
  return tagText(html, 'title');
}

function jsonLdObjects(html) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
}

const seo = await importSourceModule('src/app/lib/seo-data.js');
const programmaticFreelancer = seo.programmaticSeoSegments.find((entry) => entry.slug === 'freelancer' && entry.category === 'type');
const matrixFreelancer = seo.matrixSeoTypes.find((entry) => entry.slug === 'freelancer');
const programmaticPhotographer = seo.programmaticSeoSegments.find((entry) => entry.slug === 'photographer' && entry.category === 'type');
const matrixPhotographer = seo.matrixSeoTypes.find((entry) => entry.slug === 'photographer');

assert.equal(programmaticFreelancer?.label, 'Freelancer');
assert.equal(matrixFreelancer?.label, 'Freelancer');
pass('both shared freelancer configurations use Freelancer');
assert.equal(programmaticPhotographer?.label, 'Photographer');
assert.equal(matrixPhotographer?.label, 'Photographer');
pass('both independent photographer configurations remain Photographer');

for (const productType of ['quote', 'invoice']) {
  const programmaticPage = seo.buildProgrammaticSeoPage(productType, 'freelancer');
  assert.match(programmaticPage.title, /Freelancer/);
  assert.match(programmaticPage.h1, /Freelancer/);
  assert.doesNotMatch(programmaticPage.title, /Photographer/);
  assert.doesNotMatch(programmaticPage.h1, /Photographer/);

  const matrixCountryPage = seo.buildMatrixCountryPage(productType, { type: 'freelancer', country: 'canada' });
  const matrixUseCasePage = seo.buildMatrixSeoPage(productType, {
    type: 'freelancer',
    country: 'canada',
    'use-case': 'hourly',
  });
  for (const page of [matrixCountryPage, matrixUseCasePage]) {
    assert.match(page.title, /Freelancer/);
    assert.match(page.h1, /Freelancer/);
    assert.doesNotMatch(page.title, /Photographer/);
    assert.doesNotMatch(page.h1, /Photographer/);
    assert.equal(page.breadcrumbs.find((crumb) => crumb.item.endsWith('/freelancer'))?.name, 'Freelancer');
  }
}
pass('freelancer titles, visible labels, metadata data, and breadcrumbs are semantically consistent');

for (const productType of ['quote', 'invoice']) {
  const programmaticPage = seo.buildProgrammaticSeoPage(productType, 'photographer');
  const matrixPage = seo.buildMatrixCountryPage(productType, { type: 'photographer', country: 'canada' });
  assert.match(programmaticPage.title, /Photographer/);
  assert.match(programmaticPage.h1, /Photographer/);
  assert.match(matrixPage.title, /Photographer/);
  assert.match(matrixPage.h1, /Photographer/);
}
pass('photographer page data remains unchanged');

const server = await startServer();
try {
  const freelancerPaths = [
    '/quote-generator/freelancer',
    '/invoice-generator/freelancer',
    '/quote-generator/freelancer/canada',
    '/invoice-generator/freelancer/canada/hourly',
  ];
  for (const pathname of freelancerPaths) {
    const response = await request(server.baseUrl, pathname);
    assert.equal(response.status, 200, `${pathname} must return 200`);
    const html = await response.text();
    assert.match(tagText(html, 'h1'), /Freelancer/);
    assert.doesNotMatch(tagText(html, 'h1'), /Photographer/);
    assert.match(titleText(html), /Freelancer/);
    assert.doesNotMatch(titleText(html), /Photographer/);
    const schemas = jsonLdObjects(html);
    const schemaText = JSON.stringify(schemas);
    assert.match(schemaText, /Freelancer/);
    if (pathname.includes('/canada')) {
      const breadcrumb = schemas.find((schema) => schema['@type'] === 'BreadcrumbList');
      assert.ok(breadcrumb, `${pathname} must output BreadcrumbList`);
      const freelancerCrumb = breadcrumb.itemListElement.find((item) => item.item.endsWith('/freelancer'));
      assert.equal(freelancerCrumb?.name, 'Freelancer');
    }
  }
  pass('runtime freelancer pages expose correct visible, metadata, breadcrumb, and schema semantics');

  const photographerPaths = [
    '/quote-generator/photographer',
    '/invoice-generator/photographer/canada',
  ];
  for (const pathname of photographerPaths) {
    const response = await request(server.baseUrl, pathname);
    assert.equal(response.status, 200, `${pathname} must return 200`);
    const html = await response.text();
    assert.match(tagText(html, 'h1'), /Photographer/);
    assert.match(titleText(html), /Photographer/);
    assert.match(JSON.stringify(jsonLdObjects(html)), /Photographer/);
  }
  pass('runtime photographer pages retain Photographer behavior');
} finally {
  await server.stop();
}

console.log('SEO_FREELANCER_LABEL_RUNTIME_PASS');
