import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const cwd = process.cwd();
const sharedNodeModulesRoot = process.env.CORVIOZ_NODE_MODULES_ROOT || cwd;
const sharedRequire = createRequire(path.join(sharedNodeModulesRoot, 'package.json'));
const { chromium } = sharedRequire('playwright');

const dashboardSource = await readFile(
  new URL('../src/components/dashboard/Dashboard.js', import.meta.url),
  'utf8',
);

function matchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error('Unbalanced function body');
}

function extractAsyncArrow(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing function marker: ${marker}`);
  const asyncStart = source.indexOf('async', start);
  const open = source.indexOf('{', asyncStart);
  const close = matchingBrace(source, open);
  return source.slice(asyncStart, close + 1);
}

const handleDeleteQuoteSource = extractAsyncArrow(
  dashboardSource,
  'const handleDeleteQuote =',
);

async function prepareScenario(page, {
  quoteIds = ['quote-target'],
  responses = [200],
  responseDelayMs = 0,
} = {}) {
  const requests = [];
  let responseIndex = 0;

  await page.unrouteAll({ behavior: 'wait' });
  await page.route('**/api/quotes?*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push({
      id: url.searchParams.get('id'),
      method: request.method(),
    });
    if (responseDelayMs) {
      await new Promise((resolve) => setTimeout(resolve, responseDelayMs));
    }
    const status = responses[Math.min(responseIndex, responses.length - 1)];
    responseIndex += 1;
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(status >= 200 && status < 300
        ? { success: true }
        : { error: status === 409 ? 'Quote conflict' : 'Delete failed' }),
    });
  });

  await page.setContent(`
    <base href="http://corvioz.test/">
    <main>
      ${quoteIds.map((id) => `
        <div data-quote-id="${id}">
          <span>${id}</span>
          <button type="button" data-delete-id="${id}">Delete</button>
        </div>
      `).join('')}
    </main>
    <div id="toast" role="status"></div>
  `);

  await page.evaluate(({ handlerSource }) => {
    const factory = new Function('dependencies', `
      const { confirm, deleteQuote, triggerToast } = dependencies;
      const session = { access_token: 'test-access-token' };
      const isDemo = false;
      return (${handlerSource});
    `);
    const deleteQuote = async (id, token) => {
      const response = await fetch(`/api/quotes?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to delete quote' };
      }
      document.querySelector(`[data-quote-id="${id}"]`)?.remove();
      return { success: true };
    };
    const triggerToast = (message, type) => {
      const toast = document.querySelector('#toast');
      toast.textContent = message;
      toast.dataset.type = type;
    };
    const handleDeleteQuote = factory({
      confirm: window.confirm.bind(window),
      deleteQuote,
      triggerToast,
    });
    document.querySelectorAll('[data-delete-id]').forEach((button) => {
      button.addEventListener('click', () => {
        void handleDeleteQuote(button.dataset.deleteId);
      });
    });
  }, { handlerSource: handleDeleteQuoteSource });

  return requests;
}

async function clickWithNativeConfirm(page, button, {
  accept = true,
  quoteId,
} = {}) {
  const responsePromise = accept
    ? page.waitForResponse((response) => {
      const url = new URL(response.url());
      return response.request().method() === 'DELETE'
        && url.pathname === '/api/quotes'
        && url.searchParams.get('id') === quoteId;
    })
    : null;
  const dialogPromise = page.waitForEvent('dialog');
  const clickPromise = button.click();
  const dialog = await dialogPromise;
  assert.equal(dialog.type(), 'confirm');
  if (accept) await dialog.accept();
  else await dialog.dismiss();
  await clickPromise;
  const response = responsePromise ? await responsePromise : null;
  await page.waitForTimeout(25);
  return response;
}

function createDeleteHarness(page) {
  const inFlight = new Map();
  let dialogCount = 0;

  const deleteOnce = (quoteId, { accept = true } = {}) => {
    if (inFlight.has(quoteId)) return inFlight.get(quoteId);
    const action = (async () => {
      const button = page.locator(`[data-delete-id="${quoteId}"]`);
      assert.equal(await button.count(), 1, `Delete button for ${quoteId} must be unique`);
      dialogCount += 1;
      return clickWithNativeConfirm(page, button, { accept, quoteId });
    })().finally(() => {
      inFlight.delete(quoteId);
    });
    inFlight.set(quoteId, action);
    return action;
  };

  return {
    deleteOnce,
    dialogCount: () => dialogCount,
    pendingCount: () => inFlight.size,
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    {
      const requests = await prepareScenario(page);
      const harness = createDeleteHarness(page);
      const response = await harness.deleteOnce('quote-target');
      assert.equal(response.status(), 200);
      assert.equal(requests.length, 1);
      assert.equal(await page.locator('[data-quote-id="quote-target"]').count(), 0);
      console.log('normal delete request count = 1');
    }

    {
      const requests = await prepareScenario(page, { responseDelayMs: 250 });
      const harness = createDeleteHarness(page);
      const first = harness.deleteOnce('quote-target');
      const second = harness.deleteOnce('quote-target');
      await Promise.all([first, second]);
      assert.equal(requests.length, 1);
      assert.equal(harness.dialogCount(), 1);
      console.log('double click request count = 1');
    }

    {
      const requests = await prepareScenario(page, {
        quoteIds: ['quote-target', 'quote-existing'],
        responses: [200, 409],
      });
      const harness = createDeleteHarness(page);
      await harness.deleteOnce('quote-target');

      // Regaining page control after a native dialog is read-only recovery.
      // The accepted click promise is the single source of truth; never locate
      // or click another Delete button after the target row disappears.
      assert.equal(await page.locator('[data-quote-id="quote-target"]').count(), 0);
      assert.equal(await page.locator('[data-quote-id="quote-existing"]').count(), 1);
      assert.deepEqual(requests.map((request) => request.id), ['quote-target']);
      console.log('dialog recovery request count = 1');
    }

    {
      const requests = await prepareScenario(page);
      const harness = createDeleteHarness(page);
      await harness.deleteOnce('quote-target');
      assert.equal(harness.pendingCount(), 0);
      await page.waitForTimeout(50);
      assert.equal(requests.length, 1);
      assert.equal(await page.locator('[data-quote-id="quote-target"]').count(), 0);
      console.log('success cleanup request count = 1');
    }

    {
      const requests = await prepareScenario(page, { responses: [500, 200] });
      const harness = createDeleteHarness(page);
      const firstResponse = await harness.deleteOnce('quote-target');
      assert.equal(firstResponse.status(), 500);
      await page.waitForTimeout(100);
      assert.equal(requests.length, 1);
      console.log('failed request automatic retry count = 0');
      const retryResponse = await harness.deleteOnce('quote-target');
      assert.equal(retryResponse.status(), 200);
      assert.equal(requests.length, 2);
      console.log('explicit retry total request count = 2');
    }

    {
      const requests = await prepareScenario(page);
      const harness = createDeleteHarness(page);
      const response = await harness.deleteOnce('quote-target', { accept: false });
      assert.equal(response, null);
      assert.equal(requests.length, 0);
      assert.equal(await page.locator('[data-quote-id="quote-target"]').count(), 1);
      console.log('cancel request count = 0');
    }
  } finally {
    await page.close();
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
