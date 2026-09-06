import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { getPhotographyWorkflowFieldImportance } from '../src/core/quotes/photographyWorkflowTemplates.js';

const cwd = process.cwd();
const requireFromProject = createRequire(path.join(cwd, 'package.json'));
const { chromium } = requireFromProject('playwright');
const nextCli = requireFromProject.resolve('next/dist/bin/next');
const screenshotDir = path.join(cwd, 'output/playwright/r56e-g-qe-m03-fix4');
fs.mkdirSync(screenshotDir, { recursive: true });
const TEST_USER = { id: '55555555-5555-4555-8555-555555555555', aud: 'authenticated', role: 'authenticated', email: 'photographer@example.com', app_metadata: { provider: 'email' }, user_metadata: {} };
const base64Url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const createSession = () => { const expiresAt = Math.floor(Date.now() / 1000) + 3600; return { access_token: [base64Url({ alg: 'none', typ: 'JWT' }), base64Url({ ...TEST_USER, exp: expiresAt }), 'browser-test-signature'].join('.'), refresh_token: 'browser-test-refresh-token', expires_in: 3600, expires_at: expiresAt, token_type: 'bearer', user: TEST_USER }; };
const getFreePort = () => new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close((error) => (error ? reject(error) : resolve(port))); }); });
const sendJson = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); response.end(JSON.stringify(body)); };
async function startMockSupabase() {
  const server = http.createServer((request, response) => { const requestUrl = new URL(request.url, 'http://127.0.0.1'); if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version', 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS' }); response.end(); return; } if (requestUrl.pathname === '/auth/v1/user') return sendJson(response, 200, TEST_USER); if (requestUrl.pathname === '/auth/v1/token') return sendJson(response, 200, createSession()); if (requestUrl.pathname === '/auth/v1/logout') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*' }); response.end(); return; } if (requestUrl.pathname === '/rest/v1/entitlements') return sendJson(response, 200, [{ user_id: TEST_USER.id, invoice: true, export_pdf: false, client_portal: false, crm: false, automation: false, advanced_invoicing: false }]); return sendJson(response, 200, []); });
  const port = await getFreePort(); await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); }); return { url: `http://127.0.0.1:${port}`, close: () => new Promise((resolve) => server.close(() => resolve())) };
}
async function startNext(mockSupabaseUrl) { const port = await getFreePort(); const baseUrl = `http://127.0.0.1:${port}`; const child = spawn(process.execPath, [nextCli, 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], { cwd, env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: mockSupabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'browser-test-anon-key' }, stdio: ['ignore', 'pipe', 'pipe'] }); let output = ''; child.stdout.on('data', (chunk) => { output += chunk.toString(); }); child.stderr.on('data', (chunk) => { output += chunk.toString(); }); const deadline = Date.now() + 60_000; while (Date.now() < deadline) { if (child.exitCode !== null) throw new Error(`Next server exited early: ${output}`); try { if ((await fetch(`${baseUrl}/auth`)).ok) return { baseUrl, close: () => new Promise((resolve) => { child.once('exit', resolve); child.kill('SIGTERM'); }) }; } catch (_) {} await new Promise((resolve) => setTimeout(resolve, 250)); } child.kill('SIGTERM'); throw new Error(`Timed out waiting for Next server: ${output}`); }
const scope = { version: 2, common: { shoot_type: 'Headshot', shoot_date: '2026-10-10', shoot_duration: 90, primary_location: 'Studio', coverage_expectation: 'Two looks', deliverables: ['Edited gallery'], final_image_count: 20, retouched_image_count: 10, delivery_format: ['JPEG'], delivery_deadline: '2026-10-20', exclusions: [], assumptions: [], usage_rights: { status: 'unspecified', purpose: null, media_channels: [], territory: null, license_duration: null, exclusivity: null } } };
const notes = `Existing notes\n\n---METADATA---\n${JSON.stringify({ quote_preset_id: 'portrait-session', photography_scope_v2: scope })}`;
function apiBody(pathname) { if (pathname === '/api/user') return { id: TEST_USER.id, email: TEST_USER.email, name: 'Avery Photographer', plan: 'free', hasActivated: true, auth_mode: 'supabase', quota: {} }; if (pathname === '/api/quotes') return { data: [{ id: 'quote-m03-fix2', quote_number: 'QT-M03-FIX2', client_name: 'Hydrated Client', client_email: 'hydrated@example.com', client_address: '400 Scope Street', currency: 'USD', total: 10000, status: 'draft', notes, items: [{ description: 'Portrait session', quantity: 1, unit_price: 10000 }] }] }; if (pathname === '/api/clients') return { data: [{ id: 'client-m03-fix2', name: 'Existing Client', email: 'existing@example.com', address: '500 Client Lane' }] }; if (pathname === '/api/invoices' || pathname === '/api/leads') return { data: [] }; if (pathname === '/api/card-profile') return { data: { id: 'profile-m03-fix2' } }; return { data: [] }; }
async function createPage(browser, baseUrl, viewport, locale = 'en-US') { const context = await browser.newContext({ viewport, locale }); const session = createSession(); await context.addInitScript((stored) => { localStorage.setItem('corvioz_analytics_consent', 'accepted'); localStorage.setItem('sb-127-auth-token', JSON.stringify(stored)); }, session); await context.addCookies([{ name: 'sb-127-auth-token.0', value: encodeURIComponent(JSON.stringify(session)), url: baseUrl }, { name: 'corvioz_analytics_consent', value: 'accepted', url: baseUrl }]); const page = await context.newPage(); const requests = []; const pageErrors = []; page.on('request', (request) => requests.push({ method: request.method(), url: request.url() })); page.on('pageerror', (error) => pageErrors.push(error.message)); await page.route('**/api/**', async (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(apiBody(new URL(route.request().url()).pathname)) })); return { context, page, requests, pageErrors }; }
async function hideDebug(page) { await page.evaluate(() => { const audit = [...document.querySelectorAll('body *')].find((node) => node.textContent?.trim() === 'Corvioz Verification Audit'); if (audit?.parentElement?.parentElement?.parentElement) audit.parentElement.parentElement.parentElement.style.display = 'none'; const debug = [...document.querySelectorAll('button')].find((node) => /Kernel Dev Debug|Debug UI/.test(node.textContent || '')); if (debug?.parentElement) debug.parentElement.style.display = 'none'; }); }
async function openEditor(page, baseUrl) { await page.goto(`${baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' }); await page.getByRole('heading', { name: 'Quotes', exact: true }).waitFor({ state: 'visible', timeout: 20_000 }); await page.getByRole('button', { name: 'Create Quote', exact: true }).click(); await page.locator('[data-quote-presentation-mode]').waitFor({ state: 'attached' }); await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode !== 'unresolved'); await hideDebug(page); }
async function openExisting(page, baseUrl) { await page.goto(`${baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' }); await page.getByRole('heading', { name: 'Quotes', exact: true }).waitFor({ state: 'visible', timeout: 20_000 }); await page.locator('tr').filter({ hasText: 'QT-M03-FIX2' }).getByRole('button', { name: 'Edit', exact: true }).click(); await page.getByTestId('quote-guided-shell').waitFor({ state: 'visible' }); await hideDebug(page); }
async function selectWorkflow(page, name) { if (['Commercial', 'Portrait', 'Event'].includes(name)) { await page.getByRole('button', { name, exact: true }).click(); return; } await page.getByText('More workflows', { exact: true }).click(); await page.getByRole('button', { name, exact: true }).click(); }
async function goToScope(page, name) { await selectWorkflow(page, name); await page.getByTestId('quote-guided-shell').getByRole('button', { name: 'Continue', exact: true }).click(); await page.getByTestId('quote-guided-client-name').fill('M03 Fix2 Client'); await page.getByTestId('quote-guided-client-email').fill('fix2@example.com'); await page.getByTestId('quote-guided-client-step').getByRole('button', { name: 'Continue', exact: true }).click(); await page.getByTestId('quote-guided-scope-step').waitFor({ state: 'visible' }); }
const fieldIds = async (page) => page.locator('[data-scope-edit-block]:visible input:visible, [data-scope-edit-block]:visible textarea:visible').evaluateAll((nodes) => nodes.map((node) => node.dataset.testid?.replace('quote-guided-scope-', '')).filter(Boolean));
const assertNoOverflow = async (page, label) => { const dimensions = await page.evaluate(() => ({ innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth })); assert.ok(dimensions.documentWidth <= dimensions.innerWidth, `${label}: document overflow ${JSON.stringify(dimensions)}`); assert.ok(dimensions.bodyWidth <= dimensions.innerWidth, `${label}: body overflow ${JSON.stringify(dimensions)}`); };
const openBlock = async (page, name) => { await page.getByRole('button', { name }).click(); assert.equal(await page.locator('[data-scope-edit-block]:visible').count(), 1, `${name}: one active block`); return fieldIds(page); };
const classify = (fields, workflowId, expected, label) => fields.forEach((field) => assert.equal(getPhotographyWorkflowFieldImportance(workflowId, field), expected, `${label}: ${field}`));
const isDomainMutation = ({ method, url }) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  && !/\/(?:analytics(?:_events)?|revenue\/control-plane)(?:$|\/|\?)/.test(url);
const capture = (page, filename) => page.screenshot({ path: path.join(screenshotDir, filename), fullPage: true });
const realScopeEdits = [];
const dateBrowserEvidence = [];
async function editScopeField(page, field, value) {
  const locator = page.getByTestId(`quote-guided-scope-${field}`);
  await locator.fill(value);
  await locator.press('Tab');
  await page.waitForTimeout(50);
  realScopeEdits.push({ field, entered: value, reflected: await locator.inputValue() });
}
async function waitForPresentationMode(page, expected) {
  await page.waitForFunction((mode) => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === mode, expected);
}
async function assertDeterministicDateControl(page, field, label) {
  const locator = page.getByTestId(`quote-guided-scope-${field}`);
  assert.equal(await locator.getAttribute('type'), 'text', `${label}: text type`);
  assert.equal(await locator.getAttribute('placeholder'), 'YYYY-MM-DD', `${label}: placeholder`);
  assert.equal(await locator.getAttribute('inputmode'), 'numeric', `${label}: input mode`);
  assert.equal(await locator.getAttribute('pattern'), '\\d{4}-\\d{2}-\\d{2}', `${label}: pattern`);
  assert.equal(await locator.getAttribute('maxlength'), '10', `${label}: max length`);
  assert.equal(await locator.getAttribute('data-guided-date-entry'), 'english', `${label}: deterministic entry marker`);
  dateBrowserEvidence.push({ label, field, type: await locator.getAttribute('type'), placeholder: await locator.getAttribute('placeholder'), inputMode: await locator.getAttribute('inputmode'), pattern: await locator.getAttribute('pattern'), maxLength: await locator.getAttribute('maxlength') });
}

const supabase = await startMockSupabase(); const server = await startNext(supabase.url); const browser = await chromium.launch({ headless: true });
try {
  for (const [width, height, filename] of [[390, 844, '390-guided-scope.png'], [768, 1000, '768-guided-scope.png'], [1023, 1000, '1023-guided-scope.png']]) { const dashboard = await createPage(browser, server.baseUrl, { width, height }); try { await openEditor(dashboard.page, server.baseUrl); dashboard.requests.length = 0; await goToScope(dashboard.page, 'Commercial'); await assertNoOverflow(dashboard.page, `${width}: Scope`); await capture(dashboard.page, filename); const shoot = await openBlock(dashboard.page, /Shoot details/); classify(shoot, 'commercial-shoot', 'CORE', `${width}: Core Shoot`); const deliverables = await openBlock(dashboard.page, /Deliverables/); classify(deliverables, 'commercial-shoot', 'CORE', `${width}: Core Deliverables`); const recommended = await openBlock(dashboard.page, /Add details/); classify(recommended, 'commercial-shoot', 'RECOMMENDED', `${width}: Recommended`); const optional = await openBlock(dashboard.page, /More scope details/); classify(optional, 'commercial-shoot', 'OPTIONAL', `${width}: Optional`); assert.equal(new Set([...shoot, ...deliverables, ...recommended, ...optional]).size, shoot.length + deliverables.length + recommended.length + optional.length, `${width}: workflow duplicates`); assert.deepEqual(dashboard.requests.filter(isDomainMutation), [], `${width}: no guided domain mutation`); assert.deepEqual(dashboard.pageErrors, [], `${width}: no page errors`); } finally { await dashboard.context.close(); } }
  const realEdits = await createPage(browser, server.baseUrl, { width: 390, height: 844 }); try {
    await openEditor(realEdits.page, server.baseUrl);
    await goToScope(realEdits.page, 'Portrait');
    realEdits.requests.length = 0;
    await openBlock(realEdits.page, /Shoot details/);
    await editScopeField(realEdits.page, 'shoot_type', 'Editorial portrait');
    await editScopeField(realEdits.page, 'coverage_expectation', 'Three looks and two setups');
    await editScopeField(realEdits.page, 'shoot_duration', '135');
    await assertDeterministicDateControl(realEdits.page, 'shoot_date', 'Portrait en-US');
    await editScopeField(realEdits.page, 'shoot_date', '2026-10-10');
    const dateReflected = await realEdits.page.getByTestId('quote-guided-scope-shoot_date').inputValue();
    assert.equal(dateReflected, '2026-10-10', 'Portrait shoot_date reflected');
    const shootTypeReflected = await realEdits.page.getByTestId('quote-guided-scope-shoot_type').inputValue();
    const coverageReflected = await realEdits.page.getByTestId('quote-guided-scope-coverage_expectation').inputValue();
    const durationReflected = await realEdits.page.getByTestId('quote-guided-scope-shoot_duration').inputValue();
    await openBlock(realEdits.page, /Deliverables/);
    await editScopeField(realEdits.page, 'deliverables', 'Edited gallery\nWeb selects\n');
    assert.equal(shootTypeReflected, 'Editorial portrait', 'Portrait shoot_type reflected');
    assert.equal(coverageReflected, 'Three looks and two setups', 'Portrait coverage reflected');
    assert.equal(await realEdits.page.getByTestId('quote-guided-scope-deliverables').inputValue(), 'Edited gallery\nWeb selects', 'Portrait deliverables list normalized');
    assert.equal(durationReflected, '135', 'Portrait number normalized');
    const beforeContinuity = {
      shoot_type: shootTypeReflected,
      coverage_expectation: coverageReflected,
      shoot_date: dateReflected,
      deliverables: await realEdits.page.getByTestId('quote-guided-scope-deliverables').inputValue(),
      shoot_duration: durationReflected,
    };
    await realEdits.page.getByTestId('quote-guided-scope-step').getByRole('button', { name: 'Back', exact: true }).click();
    await realEdits.page.getByTestId('quote-guided-client-step').getByRole('button', { name: 'Continue', exact: true }).click();
    await realEdits.page.getByTestId('quote-guided-scope-step').waitFor({ state: 'visible' });
    await openBlock(realEdits.page, /Shoot details/);
    assert.equal(await realEdits.page.getByTestId('quote-guided-scope-shoot_type').inputValue(), beforeContinuity.shoot_type, 'Scope -> Client -> Scope shoot_type continuity');
    assert.equal(await realEdits.page.getByTestId('quote-guided-scope-coverage_expectation').inputValue(), beforeContinuity.coverage_expectation, 'Scope -> Client -> Scope coverage continuity');
    assert.equal(await realEdits.page.getByTestId('quote-guided-scope-shoot_date').inputValue(), beforeContinuity.shoot_date, 'Scope -> Client -> Scope shoot_date continuity');
    await realEdits.page.getByTestId('quote-guided-scope-step').getByRole('button', { name: 'Continue', exact: true }).click();
    await realEdits.page.getByTestId('quote-guided-compatibility-details').waitFor({ state: 'visible' }).catch(() => {});
    await realEdits.page.getByRole('button', { name: 'Back', exact: true }).click();
    await realEdits.page.getByTestId('quote-guided-scope-step').waitFor({ state: 'visible' });
    await openBlock(realEdits.page, /Deliverables/);
    assert.equal(await realEdits.page.getByTestId('quote-guided-scope-deliverables').inputValue(), beforeContinuity.deliverables, 'Scope -> Compatibility -> Scope deliverables continuity');
    await realEdits.page.setViewportSize({ width: 1023, height: 844 });
    await waitForPresentationMode(realEdits.page, 'guided');
    assert.equal(await realEdits.page.getByTestId('quote-guided-scope-step').getByTestId('quote-guided-scope-deliverables').inputValue(), beforeContinuity.deliverables, '1023 Guided retains shared Scope');
    await realEdits.page.setViewportSize({ width: 1024, height: 844 });
    await waitForPresentationMode(realEdits.page, 'desktop');
    await realEdits.page.locator('#quote-scope-shoot_type').waitFor({ state: 'visible' });
    assert.equal(await realEdits.page.locator('#quote-scope-shoot_type').inputValue(), beforeContinuity.shoot_type, '1024 Desktop sees shared Scope');
    assert.equal(await realEdits.page.locator('#quote-scope-shoot_date').inputValue(), beforeContinuity.shoot_date, '1024 Desktop sees shared Scope date');
    await realEdits.page.setViewportSize({ width: 390, height: 844 });
    await waitForPresentationMode(realEdits.page, 'guided');
    await realEdits.page.getByTestId('quote-guided-shell').getByRole('button', { name: 'Continue', exact: true }).click();
    await realEdits.page.getByTestId('quote-guided-client-step').getByRole('button', { name: 'Continue', exact: true }).click();
    await realEdits.page.getByTestId('quote-guided-scope-step').waitFor({ state: 'visible' });
    await openBlock(realEdits.page, /Shoot details/);
    assert.equal(await realEdits.page.getByTestId('quote-guided-scope-shoot_type').inputValue(), beforeContinuity.shoot_type, '390 Guided sees shared Scope after Desktop');
    assert.equal(await realEdits.page.getByTestId('quote-guided-scope-shoot_date').inputValue(), beforeContinuity.shoot_date, '390 Guided sees shared Scope date after Desktop');
    assert.equal(await realEdits.page.locator('[data-scope-edit-block]:visible').count(), 1, 'Real edit active block count');
    assert.equal(realEdits.pageErrors.length, 0, 'Real edit page errors');
    assert.deepEqual(realEdits.requests.filter(isDomainMutation), [], 'Real Scope edits do not mutate server');
  } finally { await realEdits.context.close(); }

  const blank = await createPage(browser, server.baseUrl, { width: 390, height: 844 }); try {
    await openEditor(blank.page, server.baseUrl);
    blank.requests.length = 0;
    await goToScope(blank.page, 'Blank Quote');
    assert.equal(await blank.page.getByTestId('quote-guided-scope-summary').getAttribute('data-scope-workflow'), 'blank', 'Blank workflow identity');
    const primaryShoot = await openBlock(blank.page, /Shoot details/);
    const primaryDeliverables = await openBlock(blank.page, /Deliverables/);
    assert.deepEqual([...primaryShoot, ...primaryDeliverables], ['shoot_type', 'coverage_expectation', 'deliverables'], 'Blank neutral primary fields');
    assert.equal(await blank.page.locator('[data-scope-field-priority="CORE"]').count(), 0, 'Blank fake Core fields');
    await blank.page.getByRole('button', { name: /Shoot details/ }).click();
    await capture(blank.page, '390-blank-start-expanded.png');
    await editScopeField(blank.page, 'shoot_type', 'Blank editorial');
    await editScopeField(blank.page, 'coverage_expectation', 'One location');
    await openBlock(blank.page, /Deliverables/);
    await editScopeField(blank.page, 'deliverables', 'Edited gallery\nClient selects favorites\n');
    const secondary = await openBlock(blank.page, /More details/);
    assert.ok(secondary.length > 0, 'Blank secondary details exist');
    assert.equal(new Set([...primaryShoot, ...primaryDeliverables, ...secondary]).size, primaryShoot.length + primaryDeliverables.length + secondary.length, 'Blank duplicate fields');
    assert.equal(await blank.page.locator('[data-scope-edit-block]:visible [data-scope-field-priority="NEUTRAL"]').count(), secondary.length, 'Blank neutral fields only');
    assert.ok(secondary.every((field) => !field.startsWith('usage_rights.')), 'Blank full Usage excluded');
    const blankMoreDetailsField = secondary.includes('primary_location') ? 'primary_location' : secondary.find((field) => field === 'delivery_format');
    await editScopeField(blank.page, blankMoreDetailsField, 'Blank detail edit');
    assert.equal(await blank.page.getByTestId(`quote-guided-scope-${blankMoreDetailsField}`).inputValue(), 'Blank detail edit', 'Blank More details edit reflected');
    await capture(blank.page, '390-blank-more-details-expanded.png');
    assert.deepEqual(blank.requests.filter(isDomainMutation), [], 'Blank no guided domain mutation');
    assert.deepEqual(blank.pageErrors, [], 'Blank no page errors');
  } finally { await blank.context.close(); }
  for (const [workflowName, workflowId] of [['Portrait', 'portrait-session'], ['Product', 'product-photography'], ['Food & Beverage', 'food-photography'], ['Wedding', 'wedding-shoot']]) { const dashboard = await createPage(browser, server.baseUrl, { width: 390, height: 844 }); try { await openEditor(dashboard.page, server.baseUrl); await goToScope(dashboard.page, workflowName); const shoot = await openBlock(dashboard.page, /Shoot details/); classify(shoot, workflowId, 'CORE', `${workflowName}: Core Shoot`); const deliverables = await openBlock(dashboard.page, /Deliverables/); classify(deliverables, workflowId, 'CORE', `${workflowName}: Core Deliverables`); const recommended = await openBlock(dashboard.page, /Add details/); classify(recommended, workflowId, 'RECOMMENDED', `${workflowName}: Recommended`); const optional = await openBlock(dashboard.page, /More scope details/); classify(optional, workflowId, 'OPTIONAL', `${workflowName}: Optional`); assert.ok(optional.every((field) => !field.startsWith('usage_rights.')), `${workflowName}: Usage excluded`); const all = [...shoot, ...deliverables, ...recommended, ...optional]; assert.equal(new Set(all).size, all.length, `${workflowName}: no duplicates`); } finally { await dashboard.context.close(); } }
  const product = await createPage(browser, server.baseUrl, { width: 390, height: 844 }); try {
    await openEditor(product.page, server.baseUrl);
    await goToScope(product.page, 'Product');
    const core = await openBlock(product.page, /Shoot details/);
    assert.ok(core.includes('coverage_expectation') && !core.includes('shoot_type') && !core.includes('shoot_date'), 'Product generic Shoot fields remain outside Core');
    await editScopeField(product.page, 'coverage_expectation', 'Front, side and detail angles');
    const productCoverage = await product.page.getByTestId('quote-guided-scope-coverage_expectation').inputValue();
    await openBlock(product.page, /Deliverables/);
    await editScopeField(product.page, 'deliverables', 'Packshot per product\nLifestyle hero images\n');
    const productDeliverables = await product.page.getByTestId('quote-guided-scope-deliverables').inputValue();
    assert.equal(productCoverage, 'Front, side and detail angles', 'Product coverage real edit reflected');
    assert.equal(productDeliverables, 'Packshot per product\nLifestyle hero images', 'Product deliverables real edit reflected');
    await openBlock(product.page, /Shoot details/);
    await capture(product.page, '390-product-core-expanded.png');
    await product.page.getByTestId('quote-guided-scope-details').click();
    await capture(product.page, '390-product-added-details-expanded.png');
    assert.equal(product.pageErrors.length, 0, 'Product real edit page errors');
    assert.deepEqual(product.requests.filter(isDomainMutation), [], 'Product real edits do not mutate server');
  } finally { await product.context.close(); }
  const portrait = await createPage(browser, server.baseUrl, { width: 390, height: 844 }); try { await openEditor(portrait.page, server.baseUrl); await goToScope(portrait.page, 'Portrait'); await openBlock(portrait.page, /Shoot details/); await capture(portrait.page, '390-portrait-core-expanded.png'); } finally { await portrait.context.close(); }
  const hydrated = await createPage(browser, server.baseUrl, { width: 390, height: 844 }); try { await openExisting(hydrated.page, server.baseUrl); await hydrated.page.getByTestId('quote-guided-shell').getByRole('button', { name: 'Continue', exact: true }).click(); assert.equal(await hydrated.page.getByTestId('quote-guided-client-name').inputValue(), 'Hydrated Client', 'Existing Quote Client hydration'); await hydrated.page.getByTestId('quote-guided-client-step').getByRole('button', { name: 'Continue', exact: true }).click(); await hydrated.page.getByRole('button', { name: /Shoot details/ }).click(); assert.equal(await hydrated.page.getByTestId('quote-guided-scope-shoot_type').inputValue(), 'Headshot', 'Existing Quote Scope hydration'); } finally { await hydrated.context.close(); }
  for (const [width, filename] of [[1024, '1024-desktop.png'], [1280, '1280-desktop.png']]) { const dashboard = await createPage(browser, server.baseUrl, { width, height: 900 }); try { await openEditor(dashboard.page, server.baseUrl); assert.equal(await dashboard.page.locator('[data-quote-presentation-mode]').getAttribute('data-quote-presentation-mode'), 'desktop', `${width}: desktop mode`); assert.equal(await dashboard.page.getByTestId('quote-guided-shell').count(), 0, `${width}: guided absent`); assert.equal(await dashboard.page.getByTestId('quote-business-editor').isVisible(), true, `${width}: desktop visible`); await capture(dashboard.page, filename); } finally { await dashboard.context.close(); } }
} finally { await browser.close(); await server.close(); await supabase.close(); }
fs.writeFileSync(path.join(screenshotDir, 'real-scope-edit-evidence.json'), JSON.stringify({
  realScopeInputEditing: 'PASS',
  scopeInputRuntimeErrors: 0,
  pageErrorsAfterScopeEdit: 0,
  guidedLocalScopeStateContinuity: 'PASS',
  crossBreakpointScopeStateContinuity: 'PASS',
  canonicalScopeNormalization: 'PASS',
  guidedServerMutations: 0,
  scopePersistenceRequests: 0,
  autosaveRequests: 0,
  edits: realScopeEdits,
}, null, 2));
console.log(`R56E-G-QE-M03-FIX-3 browser runtime: PASS (${screenshotDir})`);
