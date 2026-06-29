import { NextResponse } from 'next/server';
import { createServiceSupabaseClient, writeAuditLog } from '../../../../lib/supabase';
import { rateLimit } from '../../../../lib/rate-limit';
import {
  failClosedResponse,
  getIp,
  hasSpamSignals,
} from '../../../../lib/security';
import { validatePortalCommentPayload, validationResponse } from '../../../../lib/validation';

function tokenlessPortalAccessDisabled() {
  return true;
}

const serializeInvoiceNotes = (baseNotes, metadata) => {
  return `${baseNotes || ''}\n\n---METADATA---\n${JSON.stringify(metadata)}`;
};

const deserializeInvoiceNotes = (fullNotes) => {
  if (!fullNotes) return { notes: '', billing_type: 'standard', comments: [], files: [] };
  const parts = fullNotes.split('\n\n---METADATA---\n');
  if (parts.length > 1) {
    try {
      const meta = JSON.parse(parts[1]);
      return {
        notes: parts[0],
        billing_type: meta.billing_type || 'standard',
        comments: meta.comments || [],
        files: meta.files || []
      };
    } catch {
      // Ignore malformed legacy metadata.
    }
  }
  return { notes: fullNotes, billing_type: 'standard', comments: [], files: [] };
};

function withInvoiceMeta(invoice) {
  const meta = deserializeInvoiceNotes(invoice.notes);
  return {
    type: 'invoice',
    data: {
      ...invoice,
      notes: meta.notes,
      billing_type: meta.billing_type,
      comments: meta.comments,
      files: meta.files || [],
      payment_link: invoice.payment_link || '',
    }
  };
}

function withQuoteMeta(quote) {
  const meta = deserializeInvoiceNotes(quote.notes);
  return {
    type: 'quote',
    data: {
      ...quote,
      notes: meta.notes,
      comments: meta.comments,
        files: meta.files || []
    }
  };
}

async function resolvePortalDocumentById(id) {
  const serviceSupabase = createServiceSupabaseClient();
  if (serviceSupabase) {
    // Try to find the document in invoices first
    const { data: invoice } = await serviceSupabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (invoice) {
      return { type: 'invoice', data: invoice };
    }

    // Try to find the document in quotes
    const { data: quote } = await serviceSupabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (quote) {
      return { type: 'quote', data: quote };
    }

    return null;
  }

  return 'production-unconfigured';
}

async function saveSupabaseCommentById(serviceSupabase, id, type, ownerId, comment) {
  const table = type === 'invoice' ? 'invoices' : 'quotes';
  const { data } = await serviceSupabase
    .from(table)
    .select('notes')
    .eq('id', id)
    .eq('user_id', ownerId)
    .maybeSingle();

  if (!data) return null;

  const notesMeta = deserializeInvoiceNotes(data.notes);
  const comments = [...(notesMeta.comments || []), comment].slice(-100);
  const updatedNotes = serializeInvoiceNotes(notesMeta.notes, { ...notesMeta, comments });

  const { error } = await serviceSupabase
    .from(table)
    .update({ notes: updatedNotes })
    .eq('id', id)
    .eq('user_id', ownerId);

  if (error) return null;
  return comments;
}

export async function GET(request, { params }) {
  try {
    if (tokenlessPortalAccessDisabled()) {
      return NextResponse.json(
        { error: 'Portal document access requires a signed portal link' },
        { status: 404 }
      );
    }

    const ip = getIp(request);
    const limitResult = await rateLimit(`portal:get:${ip}`, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: limitResult.error || 'Too many requests' },
        { status: limitResult.status || 429 }
      );
    }

    const { id } = await params;
    const resolved = await resolvePortalDocumentById(id);
    if (resolved === 'production-unconfigured') return failClosedResponse('Portal');
    if (!resolved) {
      return NextResponse.json({ error: 'Portal document not found' }, { status: 404 });
    }

    const serviceSupabase = createServiceSupabaseClient();
    if (!serviceSupabase) return failClosedResponse('Portal');
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('plan')
      .eq('id', resolved.data.user_id)
      .maybeSingle();
    const plan = profile?.plan || 'free';
    const { getUserEntitlements } = await import('../../../../../../lib/entitlements');
    const entitlements = getUserEntitlements(plan);
    if (!entitlements.client_portal) {
      return NextResponse.json({
        error: 'UPGRADE_REQUIRED',
        requiredPlan: 'pro'
      }, { status: 403 });
    }

    const docMeta = resolved.type === 'invoice' ? withInvoiceMeta(resolved.data) : withQuoteMeta(resolved.data);
    return NextResponse.json({ type: resolved.type, data: docMeta.data });
  } catch (error) {
    console.error('Error fetching portal document by ID:', error);
    return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    if (tokenlessPortalAccessDisabled()) {
      return NextResponse.json(
        { error: 'Portal comments require a signed portal link' },
        { status: 404 }
      );
    }

    const ip = getIp(request);
    const limitResult = await rateLimit(`portal:comment:${ip}`, 10, 60000);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: limitResult.error || 'Too many requests. Please try again later.' },
        { status: limitResult.status || 429 }
      );
    }

    const { id } = await params;
    const { author, text } = validatePortalCommentPayload(await request.json());
    if (hasSpamSignals(author, text)) {
      return NextResponse.json({ error: 'Comment rejected' }, { status: 400 });
    }

    const resolved = await resolvePortalDocumentById(id);
    if (resolved === 'production-unconfigured') return failClosedResponse('Portal comments');
    if (!resolved) {
      return NextResponse.json({ error: 'Portal document not found' }, { status: 404 });
    }

    const serviceSupabase = createServiceSupabaseClient();
    if (!serviceSupabase) return failClosedResponse('Portal comments');
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('plan')
      .eq('id', resolved.data.user_id)
      .maybeSingle();
    const plan = profile?.plan || 'free';
    const { getUserEntitlements } = await import('../../../../../../lib/entitlements');
    const entitlements = getUserEntitlements(plan);
    if (!entitlements.client_portal) {
      return NextResponse.json({
        error: 'UPGRADE_REQUIRED',
        requiredPlan: 'pro'
      }, { status: 403 });
    }

    const comment = {
      id: `c_${Math.random().toString(36).substring(2, 14)}`,
      author,
      text,
      created_at: new Date().toISOString()
    };

    const comments = await saveSupabaseCommentById(serviceSupabase, id, resolved.type, resolved.data.user_id, comment);

    if (!comments) {
      return NextResponse.json({ error: 'Unable to save comment' }, { status: 500 });
    }

    await writeAuditLog(serviceSupabase, {
      userId: resolved.data.user_id,
      action: 'portal_comment_created',
      resourceType: resolved.type,
      resourceId: id,
      ip,
    });

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    if (tokenlessPortalAccessDisabled()) {
      return NextResponse.json(
        { error: 'Portal update requires signed portal link' },
        { status: 404 }
      );
    }

    const ip = getIp(request);
    const limitResult = await rateLimit(`portal:patch:${ip}`, 10, 60000);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: limitResult.error || 'Too many requests' },
        { status: 429 }
      );
    }

    const { id } = await params;
    const { action } = await request.json();
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const resolved = await resolvePortalDocumentById(id);
    if (resolved === 'production-unconfigured') return failClosedResponse('Portal update');
    if (!resolved) {
      return NextResponse.json({ error: 'Portal document not found' }, { status: 404 });
    }

    const serviceSupabase = createServiceSupabaseClient();
    if (!serviceSupabase) return failClosedResponse('Portal update');
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('plan')
      .eq('id', resolved.data.user_id)
      .maybeSingle();
    const plan = profile?.plan || 'free';
    const { getUserEntitlements } = await import('../../../../../../lib/entitlements');
    const entitlements = getUserEntitlements(plan);
    if (!entitlements.client_portal) {
      return NextResponse.json({
        error: 'UPGRADE_REQUIRED',
        requiredPlan: 'pro'
      }, { status: 403 });
    }

    // Fetch freelancer profile for notification routing
    const { data: freelancerProfile } = await serviceSupabase
      .from('profiles')
      .select('email, name')
      .eq('id', resolved.data.user_id)
      .maybeSingle();

    const freelancerName = freelancerProfile?.name || 'Freelancer';
    const freelancerEmail = freelancerProfile?.email;

    if (resolved.type === 'quote') {
      if (action === 'approve') {
        const { error } = await serviceSupabase
          .from('quotes')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', resolved.data.user_id);

        if (error) throw error;

        await writeAuditLog(serviceSupabase, {
          userId: resolved.data.user_id,
          action: 'portal_quote_approved',
          resourceType: 'quote',
          resourceId: id,
          ip,
        });

        // Trigger Quote Approved email
        if (freelancerEmail) {
          try {
            const { sendQuoteApprovedEmail } = await import('../../../../lib/email');
            await sendQuoteApprovedEmail(freelancerEmail, resolved.data, freelancerName);
          } catch (mailErr) {
            console.error('Failed to send Quote Approved email:', mailErr);
          }
        }

        return NextResponse.json({ success: true, status: 'approved' });
      }
    }

    if (resolved.type === 'invoice') {
      if (action === 'pay') {
        const { error } = await serviceSupabase
          .from('invoices')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', resolved.data.user_id);

        if (error) throw error;

        await writeAuditLog(serviceSupabase, {
          userId: resolved.data.user_id,
          action: 'portal_invoice_paid',
          resourceType: 'invoice',
          resourceId: id,
          ip,
        });

        // Trigger Invoice Paid email
        if (freelancerEmail) {
          try {
            const { sendInvoicePaidEmail } = await import('../../../../lib/email');
            await sendInvoicePaidEmail(freelancerEmail, resolved.data, freelancerName);
          } catch (mailErr) {
            console.error('Failed to send Invoice Paid email:', mailErr);
          }
        }

        return NextResponse.json({ success: true, status: 'paid' });
      }
    }

    return NextResponse.json({ error: 'Action not supported' }, { status: 400 });
  } catch (error) {
    console.error('Error updating portal document status by ID:', error);
    return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
  }
}
