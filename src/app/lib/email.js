import { Resend } from 'resend';
import { getSiteUrl } from './config';

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const fromSupport = process.env.RESEND_FROM_SUPPORT || 'support@corvioz.com';
const fromBilling = process.env.RESEND_FROM_BILLING || 'billing@corvioz.com';
const siteUrl = getSiteUrl();

export function isEmailConfigured() {
  return Boolean(apiKey && fromSupport && fromBilling);
}

function getRecipientDomain(to) {
  return String(to || '').split('@')[1] || 'unknown';
}

function emailLogBase({ type, from, to, subject }) {
  return {
    type,
    from,
    to_domain: getRecipientDomain(to),
    subject,
  };
}

/**
 * Shared HTML email wrapper with Corvioz branding and dark mode support
 */
function emailLayout({ title, previewText, bodyHtml }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg: #f9fafb;
      --card-bg: #ffffff;
      --text-main: #111827;
      --text-muted: #4b5563;
      --border: #e5e7eb;
      --primary: #4F46E5;
      --accent: #06B6D4;
    }
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #030712 !important;
        color: #f9fafb !important;
      }
      .email-wrapper {
        background-color: #030712 !important;
      }
      .email-card {
        background-color: #111827 !important;
        border-color: #1f2937 !important;
        color: #f9fafb !important;
      }
      .text-muted {
        color: #9ca3af !important;
      }
      .footer {
        color: #6b7280 !important;
      }
      .logo-text {
        color: #ffffff !important;
      }
      .divider {
        border-top-color: #1f2937 !important;
      }
      .data-table th {
        background-color: #1f2937 !important;
        color: #f9fafb !important;
      }
      .data-table td {
        border-bottom-color: #1f2937 !important;
        color: #d1d5db !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; color: #111827; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <!-- Preview Text (Preheader) -->
  <div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; color: transparent; line-height: 1px;">
    ${previewText}
  </div>

  <table class="email-wrapper" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table class="email-card" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <table border="0" cellpadding="0" cellspacing="0" style="display: inline-block;">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="width: 24px; height: 24px; border: 3px solid #4F46E5; border-top-color: #06B6D4; border-radius: 50%;"></div>
                  </td>
                  <td class="logo-text" style="font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.5px; padding-left: 8px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; vertical-align: middle;">
                    Corvioz
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="font-size: 15px; line-height: 1.6; color: #111827;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="divider" style="border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 24px; text-align: center;">
              <p class="footer" style="font-size: 12px; color: #6b7280; margin: 0 0 8px 0;">
                Sent securely by Corvioz &bull; Freelancer Business OS
              </p>
              <p class="footer" style="font-size: 11px; color: #9ca3af; margin: 0;">
                If you have questions, please reach out to <a href="mailto:support@corvioz.com" style="color: #4F46E5; text-decoration: none;">support@corvioz.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Welcome Email (to Freelancer)
 */
export function getWelcomeEmailHtml(freelancerName) {
  const title = 'Welcome to Corvioz!';
  const previewText = 'Your freelancer setup is ready. Let’s get you paid faster!';
  const bodyHtml = `
    <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Welcome aboard, ${freelancerName}!</h2>
    <p style="margin-top: 0; margin-bottom: 16px;">
      We're thrilled to have you join Corvioz. We built this platform specifically for independent professional freelancers who want to streamline client management and collect payments with zero overhead.
    </p>
    <p style="margin-bottom: 24px;">
      Here is what you can do right now to get started:
    </p>
    <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 0 0 12px 0; font-size: 15px;">
          <strong>1. Build your Bento Profile:</strong> Customize your services, rates, and timezone at your card page.
        </td>
      </tr>
      <tr>
        <td style="padding: 0 0 12px 0; font-size: 15px;">
          <strong>2. Create Quotes & Invoices:</strong> Draft professional estimates and invoices with dynamic taxes or discounts.
        </td>
      </tr>
      <tr>
        <td style="padding: 0 0 12px 0; font-size: 15px;">
          <strong>3. Share Client Portals:</strong> Send secure tokenized sharing links so clients can view quotes, leave feedback, and pay inline.
        </td>
      </tr>
    </table>
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${siteUrl}/dashboard" style="background-color: #4F46E5; color: #ffffff; padding: 12px 24px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a>
    </div>
    <p style="margin-bottom: 0;">
      Best regards,<br>
      The Corvioz Team
    </p>
  `;
  return emailLayout({ title, previewText, bodyHtml });
}

/**
 * 2. New Lead Received (to Freelancer)
 */
export function getNewLeadEmailHtml(lead, freelancerName) {
  const title = 'New Inquiry Received!';
  const previewText = `New lead from ${lead.name} (${lead.email}) on your Corvioz profile.`;
  const bodyHtml = `
    <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Hello ${freelancerName},</h2>
    <p style="margin-top: 0; margin-bottom: 16px;">
      You have received a new project inquiry from your public Bento profile card:
    </p>
    <div style="background-color: rgba(79, 70, 229, 0.05); border-left: 4px solid #4F46E5; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>From:</strong> ${lead.name} (${lead.email})</p>
      <p style="margin: 0 0 12px 0; font-size: 14px;"><strong>Message:</strong></p>
      <p style="margin: 0; font-size: 14px; font-style: italic; color: #4b5563;" class="text-muted">"${lead.message}"</p>
      ${lead.source_utm?.source ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af;"><strong>Source:</strong> ${lead.source_utm.source}</p>` : ''}
    </div>
    <p style="margin-bottom: 24px;">
      You can view contact details or generate an AI quote based on this message directly from your Leads Inbox in the dashboard.
    </p>
    <div style="text-align: center; margin-bottom: 0;">
      <a href="${siteUrl}/dashboard" style="background-color: #4F46E5; color: #ffffff; padding: 12px 24px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block;">Open Leads Inbox</a>
    </div>
  `;
  return emailLayout({ title, previewText, bodyHtml });
}

/**
 * 3. Quote Approved (to Freelancer)
 */
export function getQuoteApprovedEmailHtml(quote, freelancerName) {
  const title = `Quote Approved: ${quote.quote_number}`;
  const previewText = `Good news! ${quote.client_name} has approved quote ${quote.quote_number}.`;
  const bodyHtml = `
    <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Hi ${freelancerName},</h2>
    <p style="margin-top: 0; margin-bottom: 16px;">
      Your client <strong>${quote.client_name}</strong> has officially approved quote <strong>${quote.quote_number}</strong>.
    </p>
    <div style="background-color: rgba(6, 182, 212, 0.05); border-left: 4px solid #06B6D4; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Quote Number:</strong> ${quote.quote_number}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Total Value:</strong> ${(quote.total / 100).toLocaleString('en-US', { style: 'currency', currency: quote.currency || 'USD' })}</p>
      <p style="margin: 0; font-size: 14px;"><strong>Status:</strong> Approved</p>
    </div>
    <p style="margin-bottom: 24px;">
      You can now log in to your dashboard to convert this approved quote into a dynamic invoice draft with a single click.
    </p>
    <div style="text-align: center; margin-bottom: 0;">
      <a href="${siteUrl}/dashboard" style="background-color: #06B6D4; color: #ffffff; padding: 12px 24px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block;">Convert to Invoice</a>
    </div>
  `;
  return emailLayout({ title, previewText, bodyHtml });
}

/**
 * 4. Invoice Sent (to Client)
 */
export function getInvoiceSentEmailHtml(invoice, portalUrl, freelancerName) {
  const title = `New Invoice ${invoice.invoice_number} from ${freelancerName}`;
  const previewText = `Invoice ${invoice.invoice_number} for ${(invoice.total / 100).toLocaleString('en-US', { style: 'currency', currency: invoice.currency || 'USD' })} is ready for review.`;
  
  // Format items table for HTML email client rendering
  const itemsRows = (invoice.items || []).map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px;">${item.description}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; text-align: right;">${((item.unit_price || item.unitPrice || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: invoice.currency || 'USD' })}</td>
    </tr>
  `).join('');

  const bodyHtml = `
    <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Hello ${invoice.client_name},</h2>
    <p style="margin-top: 0; margin-bottom: 16px;">
      <strong>${freelancerName}</strong> has prepared invoice <strong>${invoice.invoice_number}</strong> for your project review:
    </p>
    
    <table class="data-table" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <thead>
        <tr style="background-color: #f9fafb;">
          <th style="padding: 10px; text-align: left; font-size: 12px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #e5e7eb;">Description</th>
          <th style="padding: 10px; text-align: center; font-size: 12px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #e5e7eb; width: 60px;">Qty</th>
          <th style="padding: 10px; text-align: right; font-size: 12px; font-weight: 600; color: #4b5563; border-bottom: 1px solid #e5e7eb; width: 100px;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <tr>
          <td colspan="2" style="padding: 12px 10px 4px 10px; text-align: right; font-size: 14px; color: #4b5563;">Subtotal:</td>
          <td style="padding: 12px 10px 4px 10px; text-align: right; font-size: 14px; color: #4b5563;">${((invoice.subtotal || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: invoice.currency || 'USD' })}</td>
        </tr>
        ${invoice.tax_amount ? `
        <tr>
          <td colspan="2" style="padding: 4px 10px; text-align: right; font-size: 14px; color: #4b5563;">Tax (${invoice.tax_rate}%):</td>
          <td style="padding: 4px 10px; text-align: right; font-size: 14px; color: #4b5563;">${((invoice.tax_amount || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: invoice.currency || 'USD' })}</td>
        </tr>` : ''}
        <tr>
          <td colspan="2" style="padding: 4px 10px 12px 10px; text-align: right; font-size: 15px; font-weight: 700; color: #111827;">Total Due:</td>
          <td style="padding: 4px 10px 12px 10px; text-align: right; font-size: 15px; font-weight: 700; color: #4F46E5;">${((invoice.total || 0) / 100).toLocaleString('en-US', { style: 'currency', currency: invoice.currency || 'USD' })}</td>
        </tr>
      </tbody>
    </table>

    <p style="margin-bottom: 8px;"><strong>Due Date:</strong> ${invoice.due_date || 'Upon Receipt'}</p>
    <p style="margin-bottom: 24px;"><strong>Payment Terms:</strong> ${invoice.payment_terms || 'Net 30'}</p>

    <p style="margin-bottom: 24px;">
      You can view the full interactive portal sheet, print the PDF, and pay online through your secure client workspace link:
    </p>
    <div style="text-align: center; margin-bottom: 0;">
      <a href="${portalUrl}" style="background-color: #4F46E5; color: #ffffff; padding: 12px 24px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block;">View Invoice Portal</a>
    </div>
  `;
  return emailLayout({ title, previewText, bodyHtml });
}

/**
 * 5. Invoice Paid (to Client & Freelancer)
 */
export function getInvoicePaidEmailHtml(invoice, freelancerName) {
  const title = `Invoice Paid: ${invoice.invoice_number}`;
  const previewText = `Payment received for invoice ${invoice.invoice_number} - ${(invoice.total / 100).toLocaleString('en-US', { style: 'currency', currency: invoice.currency || 'USD' })}.`;
  const bodyHtml = `
    <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Payment Confirmed</h2>
    <p style="margin-top: 0; margin-bottom: 16px;">
      This email confirms that payment has been received and settled for invoice <strong>${invoice.invoice_number}</strong>.
    </p>
    <div style="background-color: rgba(16, 185, 129, 0.05); border-left: 4px solid #10B981; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Invoice:</strong> ${invoice.invoice_number}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Paid Amount:</strong> ${(invoice.total / 100).toLocaleString('en-US', { style: 'currency', currency: invoice.currency || 'USD' })}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Paid To:</strong> ${freelancerName}</p>
      <p style="margin: 0; font-size: 14px;"><strong>Status:</strong> Paid / Settled</p>
    </div>
    <p style="margin-bottom: 0;">
      Thank you for your business. The transaction has been recorded in our freelancer accounting history.
    </p>
  `;
  return emailLayout({ title, previewText, bodyHtml });
}

/**
 * Production-ready server send function
 */
async function sendMail({ type = 'transactional', from, to, subject, html }) {
  const logBase = emailLogBase({ type, from, to, subject });

  if (!to) {
    console.error('[EMAIL] send_failed', { ...logBase, error: 'Recipient is required' });
    return { success: false, error: 'Recipient is required' };
  }

  console.info('[EMAIL] send_attempt', logBase);

  if (!resend) {
    const error = 'Email not sent: RESEND_API_KEY is not configured.';
    console.error('[EMAIL] send_failed', { ...logBase, error });
    return { success: false, error };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('[EMAIL] send_failed', { ...logBase, error: error.message });
      return { success: false, error: error.message };
    }

    console.info('[EMAIL] send_success', { ...logBase, resend_id: data.id });
    return { success: true, id: data.id };
  } catch (err) {
    console.error('[EMAIL] send_failed', { ...logBase, error: err.message });
    return { success: false, error: err.message };
  }
}

export async function sendWelcomeEmail(toEmail, freelancerName) {
  return sendMail({
    type: 'welcome',
    from: fromSupport,
    to: toEmail,
    subject: 'Welcome to Corvioz!',
    html: getWelcomeEmailHtml(freelancerName),
  });
}

export async function sendNewLeadEmail(toEmail, lead, freelancerName) {
  return sendMail({
    type: 'new_lead',
    from: fromSupport,
    to: toEmail,
    subject: `New Inquiry Received from ${lead.name}`,
    html: getNewLeadEmailHtml(lead, freelancerName),
  });
}

export async function sendQuoteApprovedEmail(toEmail, quote, freelancerName) {
  return sendMail({
    type: 'quote_approved',
    from: fromBilling,
    to: toEmail,
    subject: `Quote Approved: ${quote.quote_number}`,
    html: getQuoteApprovedEmailHtml(quote, freelancerName),
  });
}

export async function sendInvoiceSentEmail(toEmail, invoice, portalUrl, freelancerName) {
  return sendMail({
    type: 'invoice_sent',
    from: fromBilling,
    to: toEmail,
    subject: `New Invoice ${invoice.invoice_number} from ${freelancerName}`,
    html: getInvoiceSentEmailHtml(invoice, portalUrl, freelancerName),
  });
}

export async function sendInvoicePaidEmail(toEmail, invoice, freelancerName) {
  return sendMail({
    type: 'invoice_paid',
    from: fromBilling,
    to: toEmail,
    subject: `Invoice Paid: ${invoice.invoice_number}`,
    html: getInvoicePaidEmailHtml(invoice, freelancerName),
  });
}

export async function sendFeedbackEmail({ category, message, pageUrl, email, timestamp }) {
  const previewText = `New Beta Feedback: [${category}]`;
  const bodyHtml = `
    <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">New Beta Feedback</h2>
    <div style="background-color: rgba(79, 70, 229, 0.05); border-left: 4px solid #4F46E5; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Category:</strong> ${category}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>User Email:</strong> ${email || 'Not provided'}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Page URL:</strong> ${pageUrl || 'Not provided'}</p>
      <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Timestamp:</strong> ${timestamp || new Date().toISOString()}</p>
      <p style="margin: 16px 0 0 0; font-size: 14px;"><strong>Message:</strong></p>
      <p style="margin: 8px 0 0 0; font-size: 14px; font-style: italic; color: #4b5563; white-space: pre-wrap;">"${message}"</p>
    </div>
  `;
  return sendMail({
    type: 'feedback',
    from: fromSupport,
    to: 'support@corvioz.com',
    subject: `[Beta Feedback] ${category}`,
    html: emailLayout({ title: 'New Beta Feedback', previewText, bodyHtml }),
  });
}

/**
 * 7. Payment Reminder (to Client)
 */
export function getPaymentReminderEmailHtml(invoice, portalUrl, reminderText, freelancerName) {
  const title = `Overdue Invoice Reminder: ${invoice.invoice_number}`;
  const previewText = `Payment reminder for Invoice ${invoice.invoice_number} from ${freelancerName}.`;
  
  const formattedText = String(reminderText || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br />');

  const bodyHtml = `
    <h2 style="font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Invoice Payment Reminder</h2>
    <div style="background-color: rgba(239, 68, 68, 0.03); border-left: 4px solid #EF4444; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
        ${formattedText}
      </p>
    </div>
    
    <p style="margin-bottom: 24px;">
      You can review invoice details, download the PDF, and complete your payment via the secure client portal link below:
    </p>
    <div style="text-align: center; margin-bottom: 0;">
      <a href="${portalUrl}" style="background-color: #EF4444; color: #ffffff; padding: 12px 24px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Invoice & View Portal</a>
    </div>
  `;
  return emailLayout({ title, previewText, bodyHtml });
}

export async function sendPaymentReminderEmail(toEmail, invoice, portalUrl, reminderText, freelancerName) {
  return sendMail({
    type: 'payment_reminder',
    from: fromBilling,
    to: toEmail,
    subject: `Payment Reminder: Invoice ${invoice.invoice_number} from ${freelancerName}`,
    html: getPaymentReminderEmailHtml(invoice, portalUrl, reminderText, freelancerName),
  });
}


