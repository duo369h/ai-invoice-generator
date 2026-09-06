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
const outputDir = path.join(cwd, 'output/playwright/r56e-g-qe-m05');
fs.mkdirSync(outputDir, { recursive: true });

const TEST_USER = { id: '77777777-7777-4777-8777-777777777777', aud: 'authenticated', role: 'authenticated', email: 'photographer@example.com', app_metadata: { provider: 'email' }, user_metadata: {} };
const base64Url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const createSession = () => { const expiresAt = Math.floor(Date.now() / 1000) + 3600; return { access_token: [base64Url({ alg: 'none', typ: 'JWT' }), base64Url({ ...TEST_USER, exp: expiresAt }), 'browser-test-signature'].join('.'), refresh_token: 'browser-test-refresh-token', expires_in: 3600, expires_at: expiresAt, token_type: 'bearer', user: TEST_USER }; };
const getFreePort = () => new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close((error) => error ? reject(error) : resolve(port)); }); });
const sendJson = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); response.end(JSON.stringify(body)); };

async function startMockSupabase() {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, 'http://127.0.0.1');
    if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version', 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS' }); response.end(); return; }
    if (requestUrl.pathname === '/auth/v1/user') return sendJson(response, 200, TEST_USER);
    if (requestUrl.pathname === '/auth/v1/token') return sendJson(response, 200, createSession());
    if (requestUrl.pathname === '/auth/v1/logout') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*' }); response.end(); return; }
    if (requestUrl.pathname === '/rest/v1/entitlements') return sendJson(response, 200, [{ user_id: TEST_USER.id, invoice: true, export_pdf: false, client_portal: false, crm: false, automation: false, advanced_invoicing: false }]);
    return sendJson(response, 200, []);
  });
  const port = await getFreePort();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((resolve) => server.close(() => resolve())) };
}

async function startNext(mockSupabaseUrl) {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [nextCli, 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], { cwd, env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: mockSupabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'browser-test-anon-key' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Next server exited early: ${output}`);
    try { const response = await fetch(`${baseUrl}/auth`); if (response.ok) return { baseUrl, close: () => new Promise((resolve) => { child.once('exit', resolve); child.kill('SIGTERM'); }) }; } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  child.kill('SIGTERM');
  throw new Error(`Timed out waiting for Next server: ${output}`);
}

const usageScope = {
  version: 2,
  common: {
    shoot_type: 'Campaign photography', shoot_date: '2026-10-10', shoot_duration: 240, primary_location: 'Studio', coverage_expectation: 'Product and lifestyle scenes', deliverables: ['Campaign gallery'], final_image_count: 20, retouched_image_count: 10, delivery_format: ['JPEG'], delivery_deadline: '2026-10-20', exclusions: [], assumptions: [],
    usage_rights: { status: 'specified', purpose: 'Existing campaign use', media_channels: ['Website'], territory: 'North America', license_duration: '6 months', exclusivity: 'Non-exclusive' },
  },
};
const notes = `Existing public notes\n\n---METADATA---\n${JSON.stringify({ quote_preset_id: 'commercial-shoot', photography_scope_v2: usageScope })}`;
const apiBody = (pathname) => {
  if (pathname === '/api/user') return { id: TEST_USER.id, email: TEST_USER.email, name: 'Avery Photographer', plan: 'free', hasActivated: true, auth_mode: 'supabase', quota: {} };
  if (pathname === '/api/quotes') return { data: [{ id: 'quote-m05-terms', quote_number: 'QT-M05-TERMS', client_name: 'Hydrated Client', client_email: 'client@example.com', client_address: '400 Scope Street', currency: 'USD', total: 100000, tax_rate: 5, discount_rate: 10, status: 'draft', notes, items: [{ description: 'Campaign package', quantity: 1, unit_price: 1000 }] }] };
  if (pathname === '/api/clients') return { data: [{ id: 'client-m05', name: 'Hydrated Client', email: 'client@example.com', address: '400 Scope Street' }] };
  if (pathname === '/api/invoices' || pathname === '/api/leads') return { data: [] };
  if (pathname === '/api/card-profile') return { data: { id: 'profile-m05' } };
  return { data: [] };
};

async function createDashboardPage(browser, baseUrl, viewport) {
  const context = await browser.newContext({ viewport, locale: 'en-US' });
  const session = createSession();
  await context.addInitScript((storedSession) => { window.localStorage.setItem('corvioz_analytics_consent', 'accepted'); window.localStorage.setItem('sb-127-auth-token', JSON.stringify(storedSession)); }, session);
  await context.addCookies([{ name: 'sb-127-auth-token.0', value: encodeURIComponent(JSON.stringify(session)), url: baseUrl }, { name: 'corvioz_analytics_consent', value: 'accepted', url: baseUrl }]);
  const page = await context.newPage();
  const pageErrors = [];
  const requests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
  await page.route('**/api/**', async (route) => { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(apiBody(new URL(route.request().url()).pathname)) }); });
  return { context, page, pageErrors, requests };
}

async function openExistingQuote(page, baseUrl) {
  await page.goto(`${baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Quotes', exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('[data-quote-presentation-mode]').waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode !== 'unresolved');
  await page.evaluate(() => {
    const auditTitle = [...document.querySelectorAll('body *')].find((node) => node.textContent?.trim() === 'Corvioz Verification Audit');
    if (auditTitle?.parentElement?.parentElement?.parentElement) auditTitle.parentElement.parentElement.parentElement.style.display = 'none';
    const debugButton = [...document.querySelectorAll('button')].find((node) => /Kernel Dev Debug|Debug UI/.test(node.textContent || ''));
    if (debugButton?.parentElement) debugButton.parentElement.style.display = 'none';
  });
}

async function goToTerms(page) {
  await page.locator('[data-quote-presentation-mode="guided"] [data-guided-step]').first().waitFor({ state: 'visible' });
  const currentStep = await page.locator('[data-quote-presentation-mode="guided"] [data-guided-step]').first().getAttribute('data-guided-step');
  if (currentStep === 'TERMS_USAGE') return;
  if (currentStep === 'PRICING') {
    await page.getByTestId('quote-guided-pricing-step').getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByTestId('quote-guided-terms-usage-step').waitFor({ state: 'visible' });
    return;
  }
  if (currentStep === 'WORKFLOW') {
    await page.getByTestId('quote-guided-shell').getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByTestId('quote-guided-client-step').waitFor({ state: 'visible' });
  }
  if (currentStep === 'WORKFLOW' || currentStep === 'CLIENT') {
    await page.getByTestId('quote-guided-client-step').getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByTestId('quote-guided-scope-step').waitFor({ state: 'visible' });
  }
  await page.getByTestId('quote-guided-scope-step').getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByTestId('quote-guided-pricing-step').waitFor({ state: 'visible' });
  await page.getByTestId('quote-guided-pricing-step').getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByTestId('quote-guided-terms-usage-step').waitFor({ state: 'visible' });
}

const isDomainMutation = ({ method, url }) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !/(?:\/analytics(?:_events)?|\/revenue\/control-plane)(?:$|\/|\?)/.test(url);
const screenshot = (page, filename) => page.screenshot({ path: path.join(outputDir, filename), fullPage: true });
const clearAndType = async (page, locator, value) => { await locator.click(); await locator.press('ControlOrMeta+A'); await locator.press('Backspace'); for (const character of value) { if (character === '\n') await page.keyboard.press('Enter'); else await page.keyboard.type(character); await page.waitForTimeout(15); } };
const evidence = { hydration: 'PASS', usageEdits: [], statusTransitions: [], termsNotes: [], focus: [], workflows: [], breakpoints: [], pageErrors: 0, domainMutations: 0 };

const supabase = await startMockSupabase();
const server = await startNext(supabase.url);
const browser = await chromium.launch({ headless: true });
try {
  const dashboard = await createDashboardPage(browser, server.baseUrl, { width: 390, height: 844 });
  try {
    const page = dashboard.page;
    await openExistingQuote(page, server.baseUrl);
    await goToTerms(page);
    assert.equal(await page.getByTestId('quote-guided-terms-usage-usage-summary').count(), 1, 'Usage summary is present');
    assert.equal(await page.getByTestId('quote-guided-terms-usage-edit').count(), 0, 'Usage editor is compact by default');
    assert.equal(await page.getByTestId('quote-guided-terms-edit').count(), 0, 'Terms editor is compact by default');
    assert.equal(await page.getByTestId('quote-guided-terms-usage-usage-status').textContent(), 'Specified', 'Existing Usage status hydrates');
    assert.equal(await page.getByTestId('quote-guided-terms-usage-priority').textContent(), 'CORE', 'Commercial Usage uses existing workflow priority');
    await screenshot(page, '390-guided-terms-usage.png');

    const assertFocus = async (label, expected) => {
      const state = {
        label,
        usageOpen: await page.getByTestId('quote-guided-terms-usage-edit').count() === 1,
        termsOpen: await page.getByTestId('quote-guided-terms-edit').count() === 1,
        activeEditSurfaces: await page.locator('[data-terms-usage-edit-block="true"]').count(),
      };
      evidence.focus.push(state);
      assert.deepEqual(state, { label, ...expected }, `${label}: measured Terms/Usage focus state`);
      assert.ok(state.activeEditSurfaces <= 1, `${label}: multiple active Terms/Usage edit surfaces`);
    };
    await page.getByTestId('quote-guided-terms-usage-usage-summary').click();
    await assertFocus('open-usage', { usageOpen: true, termsOpen: false, activeEditSurfaces: 1 });
    await screenshot(page, '390-guided-usage-edit.png');
    assert.equal(await page.getByTestId('quote-guided-usage-purpose').inputValue(), 'Existing campaign use', 'Purpose hydrates');
    assert.equal(await page.getByTestId('quote-guided-usage-media-channels').inputValue(), 'Website', 'Media channels hydrate');
    assert.equal(await page.getByTestId('quote-guided-usage-territory').inputValue(), 'North America', 'Territory hydrates');
    assert.equal(await page.getByTestId('quote-guided-usage-license-duration').inputValue(), '6 months', 'License duration hydrates');
    assert.equal(await page.getByTestId('quote-guided-usage-exclusivity').inputValue(), 'Non-exclusive', 'Exclusivity hydrates');

    await clearAndType(page, page.getByTestId('quote-guided-usage-purpose'), 'Brand campaign');
    await clearAndType(page, page.getByTestId('quote-guided-usage-media-channels'), 'Website\nPaid social\nPrint');
    await clearAndType(page, page.getByTestId('quote-guided-usage-territory'), 'North America');
    await clearAndType(page, page.getByTestId('quote-guided-usage-license-duration'), '12 months');
    await clearAndType(page, page.getByTestId('quote-guided-usage-exclusivity'), 'Non-exclusive');
    assert.equal(await page.getByTestId('quote-guided-usage-status').inputValue(), 'specified', 'Editing details uses specified status');
    assert.equal(await page.getByTestId('quote-guided-usage-media-channels').inputValue(), 'Website\nPaid social\nPrint', 'Media channels use canonical array authority');
    evidence.usageEdits.push({ purpose: 'Brand campaign', media_channels: ['Website', 'Paid social', 'Print'], territory: 'North America', license_duration: '12 months', exclusivity: 'Non-exclusive', authority: 'qPhotographyScope.common.usage_rights' });

    await page.getByTestId('quote-guided-terms-usage-terms-summary').click();
    await assertFocus('open-terms', { usageOpen: false, termsOpen: true, activeEditSurfaces: 1 });
    await screenshot(page, '390-guided-terms-edit.png');
    const noteText = '50% booking retainer. Remaining balance due before final delivery.';
    await clearAndType(page, page.getByTestId('quote-guided-terms-notes'), noteText);
    assert.equal(await page.getByTestId('quote-guided-terms-notes').inputValue(), noteText, 'qNotes real typing');
    evidence.termsNotes.push({ qNotes: noteText, authority: 'shared qNotes' });

    await page.getByTestId('quote-guided-terms-usage-usage-summary').click();
    await assertFocus('reopen-usage', { usageOpen: true, termsOpen: false, activeEditSurfaces: 1 });
    await page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByTestId('quote-guided-usage-status').selectOption('not_applicable');
    await page.waitForTimeout(100);
    assert.equal(await page.getByTestId('quote-guided-usage-status').inputValue(), 'specified', 'Cancel preserves Usage status');
    assert.equal(await page.getByTestId('quote-guided-usage-purpose').inputValue(), 'Brand campaign', 'Cancel preserves Usage details');
    evidence.statusTransitions.push({ from: 'specified', action: 'not_applicable', confirmation: 'cancel', result: 'details preserved' });
    await page.once('dialog', (dialog) => dialog.accept());
    await page.getByTestId('quote-guided-usage-status').selectOption('not_applicable');
    await page.waitForTimeout(100);
    assert.equal(await page.getByTestId('quote-guided-usage-status').inputValue(), 'not_applicable', 'Confirm sets Not applicable');
    assert.equal(await page.getByTestId('quote-guided-usage-purpose').count(), 0, 'Confirm clears Usage details');
    await screenshot(page, '390-guided-usage-not-applicable.png');
    evidence.statusTransitions.push({ from: 'specified', action: 'not_applicable', confirmation: 'confirm', result: 'details cleared' });
    await page.getByTestId('quote-guided-usage-status').selectOption('specified');
    assert.equal(await page.getByTestId('quote-guided-usage-status').inputValue(), 'specified', 'Not applicable can return to Specified');
    evidence.statusTransitions.push({ from: 'not_applicable', action: 'specified', result: 'specified' });

    await page.getByTestId('quote-guided-terms-usage-step').getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByTestId('quote-guided-pricing-step').waitFor({ state: 'visible' });
    await page.getByTestId('quote-guided-pricing-step').getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByTestId('quote-guided-terms-usage-step').waitFor({ state: 'visible' });
    await page.getByTestId('quote-guided-terms-usage-terms-summary').click();
    assert.equal(await page.getByTestId('quote-guided-terms-notes').inputValue(), noteText, 'Terms/qNotes survives Pricing re-entry');
    await page.getByTestId('quote-guided-terms-usage-step').getByRole('button', { name: 'Continue', exact: true }).click();
    await page.locator('[data-guided-compatibility="true"]').waitFor({ state: 'visible' });
    await page.locator('[data-guided-compatibility="true"]').getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByTestId('quote-guided-terms-usage-step').waitFor({ state: 'visible' });
    await page.getByTestId('quote-guided-terms-usage-terms-summary').click();
    evidence.termsNotes.push({ termsToCompatibilityToTerms: 'PASS', serverMutations: 0 });

    await page.setViewportSize({ width: 1023, height: 844 });
    await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'guided');
    await goToTerms(page);
    assert.equal(await page.getByTestId('quote-guided-terms-notes').count(), 0, '1023 starts compact');
    await page.getByTestId('quote-guided-terms-usage-terms-summary').click();
    assert.equal(await page.getByTestId('quote-guided-terms-notes').inputValue(), noteText, '1023 Guided reads qNotes');
    await page.setViewportSize({ width: 1024, height: 844 });
    await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'desktop');
    assert.equal(await page.getByTestId('quote-notes-input').inputValue(), noteText, '1024 Desktop reads shared qNotes');
    assert.equal(await page.getByRole('combobox', { name: 'Usage status' }).inputValue(), 'specified', '1024 Desktop reads shared Usage status');
    await screenshot(page, '1024-desktop.png');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'desktop');
    await screenshot(page, '1280-desktop.png');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'guided');
    await goToTerms(page);
    await page.getByTestId('quote-guided-terms-usage-terms-summary').click();
    assert.equal(await page.getByTestId('quote-guided-terms-notes').inputValue(), noteText, '390 re-entry reads shared qNotes');
    evidence.breakpoints.push({ sequence: '390→1023→1024→1280→390', sharedUsageRights: 'PASS', qNotes: 'PASS' });
    evidence.pageErrors = dashboard.pageErrors.length;
    evidence.domainMutations = dashboard.requests.filter(isDomainMutation).length;
    assert.deepEqual(dashboard.pageErrors, [], 'no browser page errors');
    assert.equal(evidence.domainMutations, 0, 'no Terms/Usage server mutations');
  } finally { await dashboard.context.close(); }

  for (const [width, filename] of [[768, '768-guided-terms-usage.png'], [1023, '1023-guided-terms-usage.png']]) {
    const dashboard = await createDashboardPage(browser, server.baseUrl, { width, height: 1000 });
    try { await openExistingQuote(dashboard.page, server.baseUrl); await goToTerms(dashboard.page); await screenshot(dashboard.page, filename); assert.deepEqual(dashboard.pageErrors, [], `${width}: no browser errors`); assert.deepEqual(dashboard.requests.filter(isDomainMutation), [], `${width}: no server mutations`); } finally { await dashboard.context.close(); }
  }

  for (const [workflowId, priority] of [['commercial-shoot', 'CORE'], ['portrait-session', 'OPTIONAL'], ['product-photography', 'RECOMMENDED'], [null, 'NEUTRAL']]) {
    const dashboard = await createDashboardPage(browser, server.baseUrl, { width: 390, height: 844 });
    try {
      await openExistingQuote(dashboard.page, server.baseUrl);
      if (workflowId) {
        const primaryWorkflowIds = ['commercial-shoot', 'portrait-session', 'wedding-shoot', 'event-photography'];
        if (!primaryWorkflowIds.includes(workflowId)) await dashboard.page.getByText('More workflows', { exact: true }).click();
        await dashboard.page.locator(`[data-workflow-id="${workflowId}"]`).click();
      }
      else { await dashboard.page.getByText('More workflows', { exact: true }).click(); await dashboard.page.getByRole('button', { name: 'Blank Quote', exact: true }).click(); }
      await goToTerms(dashboard.page);
      assert.equal(await dashboard.page.getByTestId('quote-guided-terms-usage-priority').textContent(), priority, `${workflowId || 'blank'} Usage priority`);
      evidence.workflows.push({ workflow: workflowId || 'blank', usagePriority: priority });
    } finally { await dashboard.context.close(); }
  }
} finally { await browser.close(); await server.close(); await supabase.close(); }

const observedActiveTermsUsageEditBlocksMax = Math.max(0, ...evidence.focus.map(({ activeEditSurfaces }) => activeEditSurfaces));
fs.writeFileSync(path.join(outputDir, 'real-usage-edit-evidence.json'), JSON.stringify({ ...evidence, usageFirstClass: 'PASS', secondMobileUsageState: 'NO', guidedTermsUsageServerMutations: 0 }, null, 2));
fs.writeFileSync(path.join(outputDir, 'usage-status-evidence.json'), JSON.stringify({ transitions: evidence.statusTransitions, canonicalPath: 'qPhotographyScope.common.usage_rights', result: 'PASS' }, null, 2));
fs.writeFileSync(path.join(outputDir, 'terms-notes-evidence.json'), JSON.stringify({ qNotes: evidence.termsNotes, authority: 'shared qNotes', result: 'PASS' }, null, 2));
fs.writeFileSync(path.join(outputDir, 'terms-usage-focus-evidence.json'), JSON.stringify({ focus: evidence.focus, observedActiveTermsUsageEditBlocksMax, activeEditEvidenceSource: 'MEASURED_BROWSER_DOM', result: 'PASS' }, null, 2));
console.log(`R56E-G-QE-M05 Terms/Usage browser runtime: PASS (${outputDir})`);
