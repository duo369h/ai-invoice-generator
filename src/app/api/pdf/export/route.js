import { NextResponse } from 'next/server';
import { getRequestUser } from '../../../lib/supabase';
import { ensureProfile } from '../../../lib/supabase-service';
import { getUserEntitlements } from '../../../../../lib/entitlements';

export const runtime = "nodejs";

function sanitizeFileName(value) {
  const base = String(value || "corvioz-export.pdf")
    .replace(/[^\w.\- ]+/g, "")
    .trim()
    .slice(0, 120);

  const fileName = base || "corvioz-export.pdf";
  return fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
}

function validateHtml(value) {
  const html = String(value || "").trim();
  if (!html) {
    throw Object.assign(new Error("Missing html"), { status: 400 });
  }
  if (html.length > 1_000_000) {
    throw Object.assign(new Error("HTML payload too large"), { status: 413 });
  }
  return html;
}

function injectPdfBranding(html, branding) {
  if (branding !== "branded") return html;

  // Visual QA Tag: PDF_BRANDING_VISUAL_QA_REQUIRED
  const brandBlock = `
    <!-- PDF_BRANDING_VISUAL_QA_REQUIRED -->
    <style>
      .corvioz-pdf-branding { margin-top: 32px; padding-top: 16px; border-top: 1px solid rgb(226, 232, 240); display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: rgb(100, 116, 139); font-family: system-ui, -apple-system, sans-serif; }
      .corvioz-pdf-branding-name { font-weight: 700; color: rgb(15, 23, 42); letter-spacing: -0.02em; }
    </style>
    <div class="corvioz-pdf-branding">
      <span class="corvioz-pdf-branding-name">Corvioz</span>
      <span>Created with Corvioz &middot; corvioz.com</span>
    </div>
  `;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${brandBlock}</body>`);
  }
  return `${html}${brandBlock}`;
}

async function renderPdfFromHtml(html) {
  const isServerless = process.env.VERCEL === "1";
  let browser;
  if (isServerless) {
    const [puppeteerModule, chromiumModule] = await Promise.all([
      import("puppeteer-core"),
      import("@sparticuz/chromium"),
    ]);
    const puppeteer = puppeteerModule.default;
    const serverlessChromium = chromiumModule.default;
    serverlessChromium.setGraphicsMode = false;
    browser = await puppeteer.launch({
      args: serverlessChromium.args,
      executablePath: await serverlessChromium.executablePath(),
      headless: "shell",
    });
  } else {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  try {
    const page = await browser.newPage();
    if (isServerless) {
      await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    } else {
      await page.setViewportSize({ width: 794, height: 1123 });
    }

    await page.setContent(html, {
      waitUntil: isServerless ? "networkidle0" : "networkidle",
      timeout: 15000,
    });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function POST(request) {
  try {
    const context = await getRequestUser(request);
    if (!context || context.mode !== "supabase" || !context.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const profile = await ensureProfile(context.supabase, context.user);
    const plan = profile?.plan || "free";
    const entitlements = getUserEntitlements(plan);

    if (!entitlements.export_pdf) {
      return NextResponse.json({
        error: "UPGRADE_REQUIRED",
        requiredPlan: "pro"
      }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    let html = validateHtml(body.html);
    const fileName = sanitizeFileName(body.fileName);

    html = injectPdfBranding(html, entitlements.pdf_branding);

    const pdfBuffer = await renderPdfFromHtml(html);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error?.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Error generating PDF export:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
