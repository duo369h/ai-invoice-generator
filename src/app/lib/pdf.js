import { createBrowserSupabaseClient } from './supabase-client';

function collectDocumentStyles() {
  return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => node.outerHTML)
    .join('\n');
}

function collectRootCssVariables() {
  const computed = window.getComputedStyle(document.documentElement);
  const variables = [];

  for (let i = 0; i < computed.length; i += 1) {
    const key = computed.item(i);
    if (key.startsWith('--')) {
      variables.push(`${key}: ${computed.getPropertyValue(key)};`);
    }
  }

  return variables.join('\n');
}

function buildPdfHtml(element) {
  const clone = element.cloneNode(true);
  clone.style.width = '794px';
  clone.style.maxWidth = '794px';
  clone.style.boxShadow = 'none';
  clone.style.position = 'relative';

  const rootVariables = collectRootCssVariables();
  const styles = collectDocumentStyles();

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      :root { ${rootVariables} }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
        color: #111827;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body {
        width: 794px;
        min-height: 1123px;
      }
      img {
        max-width: 100%;
      }
    </style>
    ${styles}
  </head>
  <body>
    ${clone.outerHTML}
  </body>
</html>`;
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function getSupabaseAccessToken() {
  const supabase = createBrowserSupabaseClient();
  if (!supabase) return '';

  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || '';
}

export async function generatePDF(elementId, fileName = 'invoice.pdf') {
  if (typeof window === 'undefined') return;

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found.`);
  }

  const accessToken = await getSupabaseAccessToken();
  const response = await fetch('/api/pdf/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({
      fileName,
      html: buildPdfHtml(element),
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.error || 'PDF export failed';
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  triggerDownload(blob, fileName);
}
