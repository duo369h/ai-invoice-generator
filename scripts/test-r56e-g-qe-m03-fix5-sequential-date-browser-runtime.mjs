import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const cwd = process.cwd();
const requireFromProject = createRequire(path.join(cwd, 'package.json'));
const { chromium } = requireFromProject('playwright');
const nextCli = requireFromProject.resolve('next/dist/bin/next');
const outputDir = path.join(cwd, 'output/playwright/r56e-g-qe-m03-fix5');
fs.mkdirSync(outputDir, { recursive: true });
const TEST_USER = { id: '55555555-5555-4555-8555-555555555555', aud: 'authenticated', role: 'authenticated', email: 'photographer@example.com', app_metadata: { provider: 'email' }, user_metadata: {} };
const base64Url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const createSession = () => { const expiresAt = Math.floor(Date.now() / 1000) + 3600; return { access_token: [base64Url({ alg: 'none', typ: 'JWT' }), base64Url({ ...TEST_USER, exp: expiresAt }), 'browser-test-signature'].join('.'), refresh_token: 'browser-test-refresh-token', expires_in: 3600, expires_at: expiresAt, token_type: 'bearer', user: TEST_USER }; };
const getFreePort = () => new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close((error) => (error ? reject(error) : resolve(port))); }); });
const sendJson = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); response.end(JSON.stringify(body)); };
async function startMockSupabase() { const server = http.createServer((request, response) => { const requestUrl = new URL(request.url, 'http://127.0.0.1'); if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version', 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS' }); response.end(); return; } if (requestUrl.pathname === '/auth/v1/user') return sendJson(response, 200, TEST_USER); if (requestUrl.pathname === '/auth/v1/token') return sendJson(response, 200, createSession()); if (requestUrl.pathname === '/auth/v1/logout') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*' }); response.end(); return; } if (requestUrl.pathname === '/rest/v1/entitlements') return sendJson(response, 200, [{ user_id: TEST_USER.id, invoice: true, export_pdf: false, client_portal: false, crm: false, automation: false, advanced_invoicing: false }]); return sendJson(response, 200, []); }); const port = await getFreePort(); await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); }); return { url: `http://127.0.0.1:${port}`, close: () => new Promise((resolve) => server.close(() => resolve())) }; }
async function startNext(mockSupabaseUrl) { const port = await getFreePort(); const baseUrl = `http://127.0.0.1:${port}`; const child = spawn(process.execPath, [nextCli, 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], { cwd, env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: mockSupabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'browser-test-anon-key' }, stdio: ['ignore', 'pipe', 'pipe'] }); let output = ''; child.stdout.on('data', (chunk) => { output += chunk.toString(); }); child.stderr.on('data', (chunk) => { output += chunk.toString(); }); const deadline = Date.now() + 60_000; while (Date.now() < deadline) { if (child.exitCode !== null) throw new Error(`Next server exited early: ${output}`); try { if ((await fetch(`${baseUrl}/auth`)).ok) return { baseUrl, close: () => new Promise((resolve) => { child.once('exit', resolve); child.kill('SIGTERM'); }) }; } catch (_) {} await new Promise((resolve) => setTimeout(resolve, 250)); } child.kill('SIGTERM'); throw new Error(`Timed out waiting for Next server: ${output}`); }
const scope = { version: 2, common: { shoot_type: 'Headshot', shoot_date: '2026-10-10', shoot_duration: 90, primary_location: 'Studio', coverage_expectation: 'Two looks', deliverables: ['Edited gallery'], final_image_count: 20, retouched_image_count: 10, delivery_format: ['JPEG'], delivery_deadline: '2026-10-20', exclusions: [], assumptions: [], usage_rights: { status: 'unspecified', purpose: null, media_channels: [], territory: null, license_duration: null, exclusivity: null } } };
const notes = `Existing notes\n\n---METADATA---\n${JSON.stringify({ quote_preset_id: 'portrait-session', photography_scope_v2: scope })}`;
function apiBody(pathname) { if (pathname === '/api/user') return { id: TEST_USER.id, email: TEST_USER.email, name: 'Avery Photographer', plan: 'free', hasActivated: true, auth_mode: 'supabase', quota: {} }; if (pathname === '/api/quotes') return { data: [{ id: 'quote-m03-fix5', quote_number: 'QT-M03-FIX5', client_name: 'Hydrated Client', client_email: 'hydrated@example.com', client_address: '400 Scope Street', currency: 'USD', total: 10000, status: 'draft', notes, items: [{ description: 'Portrait session', quantity: 1, unit_price: 10000 }] }] }; if (pathname === '/api/clients') return { data: [{ id: 'client-m03-fix5', name: 'Existing Client', email: 'existing@example.com', address: '500 Client Lane' }] }; if (pathname === '/api/invoices' || pathname === '/api/leads') return { data: [] }; if (pathname === '/api/card-profile') return { data: { id: 'profile-m03-fix5' } }; return { data: [] }; }
async function createPage(browser, baseUrl) { const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' }); const session = createSession(); await context.addInitScript((stored) => { localStorage.setItem('corvioz_analytics_consent', 'accepted'); localStorage.setItem('sb-127-auth-token', JSON.stringify(stored)); }, session); await context.addCookies([{ name: 'sb-127-auth-token.0', value: encodeURIComponent(JSON.stringify(session)), url: baseUrl }, { name: 'corvioz_analytics_consent', value: 'accepted', url: baseUrl }]); const page = await context.newPage(); const requests = []; const pageErrors = []; page.on('request', (request) => requests.push({ method: request.method(), url: request.url() })); page.on('pageerror', (error) => pageErrors.push(error.message)); await page.route('**/api/**', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(apiBody(new URL(route.request().url()).pathname)) })); return { context, page, requests, pageErrors }; }
async function hideDebug(page) { await page.evaluate(() => { const audit = [...document.querySelectorAll('body *')].find((node) => node.textContent?.trim() === 'Corvioz Verification Audit'); if (audit?.parentElement?.parentElement?.parentElement) audit.parentElement.parentElement.parentElement.style.display = 'none'; const debug = [...document.querySelectorAll('button')].find((node) => /Kernel Dev Debug|Debug UI/.test(node.textContent || '')); if (debug?.parentElement) debug.parentElement.style.display = 'none'; }); }
async function openEditor(page, baseUrl) { await page.goto(`${baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' }); await page.getByRole('heading', { name: 'Quotes', exact: true }).waitFor({ state: 'visible', timeout: 20_000 }); await page.getByRole('button', { name: 'Create Quote', exact: true }).click(); await page.locator('[data-quote-presentation-mode]').waitFor({ state: 'attached' }); await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode !== 'unresolved'); await hideDebug(page); }
async function goToScope(page, baseUrl, workflow) { await openEditor(page, baseUrl); await page.getByRole('button', { name: workflow, exact: true }).click(); await page.getByTestId('quote-guided-shell').getByRole('button', { name: 'Continue', exact: true }).click(); await page.getByTestId('quote-guided-client-name').fill('M03 Fix5 Client'); await page.getByTestId('quote-guided-client-email').fill('fix5@example.com'); await page.getByTestId('quote-guided-client-step').getByRole('button', { name: 'Continue', exact: true }).click(); await page.getByTestId('quote-guided-scope-step').waitFor({ state: 'visible' }); await page.getByRole('button', { name: /Shoot details/ }).click(); }
async function ensureShootOpen(page) { if (await page.locator('[data-scope-edit-block="SHOOT"]:visible').count() === 0) await page.getByRole('button', { name: /Shoot details/ }).click(); }
async function clearField(locator) { await locator.click(); await locator.press('ControlOrMeta+A'); await locator.press('Backspace'); }
const formatExpectedDateValue = (value) => { const digits = String(value).replace(/\D/g, '').slice(0, 8); if (digits.length <= 4) return digits; if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`; return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`; };
async function typeSequentially(page, locator, value, expectedPrefixes) { const observed = []; await clearField(locator); for (const character of value) { await page.keyboard.type(character); await page.waitForTimeout(25); const reflected = await locator.inputValue(); observed.push(reflected); assert.equal(reflected, formatExpectedDateValue(value.slice(0, observed.length)), `sequential prefix ${value.slice(0, observed.length)} retained`); } const expectedFormatted = [...new Set(expectedPrefixes.map(formatExpectedDateValue))]; assert.deepEqual([...new Set(observed.filter((entry) => expectedFormatted.includes(entry)))], expectedFormatted, 'required intermediate prefixes retained'); return observed; }
async function assertDateAttrs(locator) { assert.equal(await locator.getAttribute('type'), 'text'); assert.equal(await locator.getAttribute('placeholder'), 'YYYY-MM-DD'); assert.equal(await locator.getAttribute('inputmode'), 'numeric'); assert.equal(await locator.getAttribute('pattern'), '\\d{4}-\\d{2}-\\d{2}'); assert.equal(await locator.getAttribute('maxlength'), '10'); }
async function leaveDate(locator) { await locator.press('Tab'); await locator.page().waitForTimeout(50); }
const isDomainMutation = ({ method, url }) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !/(?:\/analytics(?:_events)?|\/revenue\/control-plane)(?:$|\/|\?)/.test(url);
const evidence = [];

const supabase = await startMockSupabase();
const server = await startNext(supabase.url);
const browser = await chromium.launch({ headless: true });
try {
  const portrait = await createPage(browser, server.baseUrl);
  try {
    const page = portrait.page;
    await goToScope(page, server.baseUrl, 'Portrait');
    const shootDate = page.getByTestId('quote-guided-scope-shoot_date');
    await assertDateAttrs(shootDate);
    await clearField(shootDate);
    await page.keyboard.type('2026-10-');
    assert.equal(await shootDate.inputValue(), '2026-10', 'partial draft remains visible');
    await page.screenshot({ path: path.join(outputDir, '390-portrait-date-partial.png'), fullPage: true });
    await page.keyboard.type('10');
    assert.equal(await shootDate.inputValue(), '2026-10-10', 'complete date remains visible');
    await page.screenshot({ path: path.join(outputDir, '390-portrait-date-complete.png'), fullPage: true });
    await leaveDate(shootDate);
    evidence.push({ workflow: 'Portrait', field: 'shoot_date', sequential: '2026-10-10', requiredPrefixes: ['2', '20', '2026', '2026-', '2026-10', '2026-10-', '2026-10-10'], partialDraft: '2026-10', canonicalAfterCommit: '2026-10-10' });
    await page.getByTestId('quote-guided-scope-step').getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByTestId('quote-guided-client-step').getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByTestId('quote-guided-scope-step').waitFor({ state: 'visible' });
    await ensureShootOpen(page);
    assert.equal(await page.getByTestId('quote-guided-scope-shoot_date').inputValue(), '2026-10-10', 'canonical date survives Scope to Client to Scope');
    await page.setViewportSize({ width: 1023, height: 844 });
    await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'guided');
    await ensureShootOpen(page);
    assert.equal(await page.getByTestId('quote-guided-scope-shoot_date').inputValue(), '2026-10-10', '1023 Guided date continuity');
    await page.setViewportSize({ width: 1024, height: 844 });
    await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'desktop');
    await page.locator('#quote-scope-shoot_date').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#quote-scope-shoot_date').inputValue(), '2026-10-10', '1024 Desktop date continuity');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'guided');
    assert.equal(portrait.pageErrors.length, 0, 'Portrait sequential page errors');
    assert.deepEqual(portrait.requests.filter(isDomainMutation), [], 'Portrait sequential no server mutation');
  } finally { await portrait.context.close(); }

  for (const workflow of ['Wedding', 'Commercial']) {
    const run = await createPage(browser, server.baseUrl);
    try {
      const page = run.page;
      await goToScope(page, server.baseUrl, workflow);
      const locator = page.getByTestId('quote-guided-scope-shoot_date');
      await assertDateAttrs(locator);
      const observed = await typeSequentially(page, locator, '2026-10-10', ['2', '20', '2026', '2026-', '2026-10', '2026-10-', '2026-10-10']);
      await leaveDate(locator);
      assert.equal(await locator.inputValue(), '2026-10-10', `${workflow} canonical date commit`);
      evidence.push({ workflow, field: 'shoot_date', observed, canonicalAfterCommit: '2026-10-10' });
      if (workflow === 'Commercial') {
        await page.getByRole('button', { name: /Deliverables/ }).click();
        const deadline = page.getByTestId('quote-guided-scope-delivery_deadline');
        await assertDateAttrs(deadline);
        const deadlineObserved = await typeSequentially(page, deadline, '2026-10-20', ['2', '20', '2026', '2026-', '2026-10', '2026-10-', '2026-10-20']);
        await leaveDate(deadline);
        assert.equal(await deadline.inputValue(), '2026-10-20', 'Commercial delivery deadline canonical commit');
        evidence.push({ workflow, field: 'delivery_deadline', observed: deadlineObserved, canonicalAfterCommit: '2026-10-20' });
      }
      assert.equal(run.pageErrors.length, 0, `${workflow} sequential page errors`);
      assert.deepEqual(run.requests.filter(isDomainMutation), [], `${workflow} sequential no server mutation`);
    } finally { await run.context.close(); }
  }

  const invalid = await createPage(browser, server.baseUrl);
  try {
    const page = invalid.page;
    await goToScope(page, server.baseUrl, 'Portrait');
    const locator = page.getByTestId('quote-guided-scope-shoot_date');
    await typeSequentially(page, locator, '2026-02-30', ['2', '20', '2026', '2026-', '2026-02', '2026-02-', '2026-02-30']);
    await leaveDate(locator);
    assert.equal(await locator.inputValue(), '', 'invalid calendar date clears on blur');
    await ensureShootOpen(page);
    const clearable = page.getByTestId('quote-guided-scope-shoot_date');
    await typeSequentially(page, clearable, '2026-10-10', ['2', '20', '2026', '2026-', '2026-10', '2026-10-', '2026-10-10']);
    await leaveDate(clearable);
    await clearField(clearable);
    await leaveDate(clearable);
    assert.equal(await clearable.inputValue(), '', 'intentional clear leaves empty canonical date');
    assert.equal(invalid.pageErrors.length, 0, 'invalid and clear page errors');
    assert.deepEqual(invalid.requests.filter(isDomainMutation), [], 'invalid and clear no server mutation');
    evidence.push({ workflow: 'Portrait', field: 'shoot_date', invalidInput: '2026-02-30', invalidCanonicalPersistence: 'NO', clearDate: 'PASS', canonicalAfterClear: null });
  } finally { await invalid.context.close(); }
} finally { await browser.close(); await server.close(); await supabase.close(); }
fs.writeFileSync(path.join(outputDir, 'sequential-date-evidence.json'), JSON.stringify({ sequentialDateTyping: 'PASS', partialDateDraftRetention: 'PASS', validDateCanonicalCommit: 'PASS', invalidDateCanonicalRejection: 'PASS', clearDate: 'PASS', evidence }, null, 2));
console.log(`R56E-G-QE-M03-FIX-5 sequential human date browser runtime: PASS (${outputDir})`);
