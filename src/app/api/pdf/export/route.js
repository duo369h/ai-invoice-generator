import { NextResponse } from 'next/server';
import { getRequestUser, ensureProfile } from '../../../lib/supabase';
import { getUserEntitlements } from '../../../../../lib/entitlements';

export const runtime = 'nodejs';

function sanitizeFileName(value) {
  const base = String(value || 'corvioz-export.pdf')
    .replace(/[^\w.\- ]+/g, '')
    .trim()
    .slice(0, 120);

  const fileName = base || 'corvioz-export.pdf';
  return fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
}

function validateHtml(value) {
  const html = String(value || '').trim();
  if (!html) {
    throw Object.assign(new Error('Missing html'), { status: 400 });
  }
  if (html.length > 1_000_000) {
    throw Object.assign(new Error('HTML payload too large'), { status: 413 });
  }
  return html;
}

async function renderPdfFromHtml(html) {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 794, height: 1123 },
      deviceScaleFactor: 2,
    });

    await page.setContent(html, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    return await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
    });
  } finally {
    await browser.close();
  }
}

export async function POST(request) {
  try {
    const context = await getRequestUser(request);
    if (!context || context.mode !== 'supabase' || !context.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const profile = await ensureProfile(context.supabase, context.user);
    const plan = profile?.plan || 'free';
    const entitlements = getUserEntitlements(plan);

    if (!entitlements.export_pdf) {
      return NextResponse.json({
        error: 'UPGRADE_REQUIRED',
        requiredPlan: 'pro'
      }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const html = validateHtml(body.html);
    const fileName = sanitizeFileName(body.fileName);
    const pdfBuffer = await renderPdfFromHtml(html);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error?.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('Error generating PDF export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
