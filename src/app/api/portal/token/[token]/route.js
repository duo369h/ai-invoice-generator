import { NextResponse } from 'next/server';
import { createServiceSupabaseClient, resolveSupabasePortalToken, writeAuditLog, recordServerGrowthEvent } from '../../../../lib/supabase';
import { rateLimit } from '../../../../lib/rate-limit';
import {
  failClosedResponse,
  getIp,
  hasSpamSignals,
} from '../../../../lib/security';
import { validatePortalCommentPayload, validationResponse } from '../../../../lib/validation';

const serializeInvoiceNotes = (baseNotes, metadata) => {
  return `${baseNotes || ''}\n\n---METADATA---\n${JSON.stringify(metadata)}`;
};

const deserializeInvoiceNotes = (fullNotes) => {
  if (!fullNotes) return { notes: '', billing_type: 'standard', comments: [], files: [] };
  const marker = '---METADATA---';
  const markerMatches = [...fullNotes.matchAll(/(?:^|\n\n)---METADATA---\n/g)];
  if (markerMatches.length > 0) {
    const firstMarkerIndex = markerMatches[0].index + (markerMatches[0][0].startsWith('\n\n') ? 2 : 0);
    const lastMatch = markerMatches[markerMatches.length - 1];
    const lastMarkerIndex = lastMatch.index + (lastMatch[0].startsWith('\n\n') ? 2 : 0);
    const publicNotes = fullNotes.slice(0, firstMarkerIndex).trim();
    const rawMeta = fullNotes.slice(lastMarkerIndex + marker.length).trim();
    try {
      let meta;
      try {
        meta = JSON.parse(rawMeta);
      } catch {
        const decodedMeta = rawMeta
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'");
        meta = JSON.parse(decodedMeta);
      }
      return {
        notes: publicNotes,
        billing_type: meta.billing_type || 'standard',
        comments: meta.comments || [],
        files: meta.files || []
      };
    } catch {
      // Ignore malformed legacy metadata.
    }
    return { notes: publicNotes, billing_type: 'standard', comments: [], files: [] };
  }
  return { notes: fullNotes, billing_type: 'standard', comments: [], files: [] };
};

function isValidPublicToken(token) {
  return /^[A-Za-z0-9_-]{32,160}$/.test(String(token || ''));
}

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

async function resolvePortalDocument(token) {
  if (!isValidPublicToken(token)) return null;

  const serviceSupabase = createServiceSupabaseClient();
  if (serviceSupabase) {
    const portalToken = await resolveSupabasePortalToken(serviceSupabase, token);
    if (!portalToken) return null;

    if (portalToken.resource_type === 'invoice') {
      const { data } = await serviceSupabase
        .from('invoices')
        .select('*')
        .eq('id', portalToken.resource_id)
        .eq('user_id', portalToken.owner_id)
        .maybeSingle();
      if (!data) return null;

      const { data: profile } = await serviceSupabase
        .from('profiles')
        .select('plan')
        .eq('id', portalToken.owner_id)
        .maybeSingle();

      return { portalToken, plan: profile?.plan || 'free', ...withInvoiceMeta(data) };
    }

    if (portalToken.resource_type === 'quote') {
      const { data } = await serviceSupabase
        .from('quotes')
        .select('*')
        .eq('id', portalToken.resource_id)
        .eq('user_id', portalToken.owner_id)
        .maybeSingle();
      if (!data) return null;

      const { data: profile } = await serviceSupabase
        .from('profiles')
        .select('plan')
        .eq('id', portalToken.owner_id)
        .maybeSingle();

      return { portalToken, plan: profile?.plan || 'free', ...withQuoteMeta(data) };
    }

    return null;
  }

  return 'production-unconfigured';
}

async function saveSupabaseComment(serviceSupabase, portalToken, comment) {
  const table = portalToken.resource_type === 'invoice' ? 'invoices' : 'quotes';
  const { data } = await serviceSupabase
    .from(table)
    .select('notes')
    .eq('id', portalToken.resource_id)
    .eq('user_id', portalToken.owner_id)
    .maybeSingle();

  if (!data) return null;

  const notesMeta = deserializeInvoiceNotes(data.notes);
  const comments = [...(notesMeta.comments || []), comment].slice(-100);
  const updatedNotes = serializeInvoiceNotes(notesMeta.notes, { ...notesMeta, comments });

  const { error } = await serviceSupabase
    .from(table)
    .update({ notes: updatedNotes })
    .eq('id', portalToken.resource_id)
    .eq('user_id', portalToken.owner_id);

  if (error) return null;
  return comments;
}

export async function GET(request, { params }) {
  try {
    const ip = getIp(request);
    const limitResult = await rateLimit(`portal:get:${ip}`, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: limitResult.error || 'Too many requests' },
        { status: limitResult.status || 429 }
      );
    }

    const { token } = await params;
    const resolved = await resolvePortalDocument(token);
    if (resolved === 'production-unconfigured') return failClosedResponse('Portal');
    if (!resolved) {
      return NextResponse.json({ error: 'Portal link expired' }, { status: 404 });
    }

    // Telemetry tracking for Client Reality Loop
    const ownerId = resolved.portalToken.owner_id;
    const serviceSupabase = createServiceSupabaseClient();
    if (serviceSupabase) {
      if (resolved.type === 'invoice') {
        await recordServerGrowthEvent(serviceSupabase, {
          eventName: 'invoice_viewed',
          userId: ownerId,
          source: 'client',
          properties: {
            invoice_id: resolved.data?.id,
            invoice_number: resolved.data?.invoice_number,
            client_email: resolved.data?.client_email
          }
        });
      } else if (resolved.type === 'quote' && resolved.data?.status === 'sent') {
        await recordServerGrowthEvent(serviceSupabase, {
          eventName: 'quote_status_pending',
          userId: ownerId,
          source: 'client',
          properties: {
            quote_id: resolved.data?.id,
            quote_number: resolved.data?.quote_number,
            client_email: resolved.data?.client_email
          }
        });
      }
    }

    return NextResponse.json({
      type: resolved.type,
      data: resolved.data,
      plan: resolved.plan,
      owner_id: ownerId
    });
  } catch (error) {
    console.error('Error fetching portal document:', error);
    return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const ip = getIp(request);
    const limitResult = await rateLimit(`portal:comment:${ip}`, 10, 60000);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: limitResult.error || 'Too many requests. Please try again later.' },
        { status: limitResult.status || 429 }
      );
    }

    const { token } = await params;
    const { author, text } = validatePortalCommentPayload(await request.json());
    if (hasSpamSignals(author, text)) {
      return NextResponse.json({ error: 'Comment rejected' }, { status: 400 });
    }

    const resolved = await resolvePortalDocument(token);
    if (resolved === 'production-unconfigured') return failClosedResponse('Portal comments');
    if (!resolved) {
      return NextResponse.json({ error: 'Portal link expired' }, { status: 404 });
    }

    const comment = {
      id: `c_${Math.random().toString(36).substring(2, 14)}`,
      author,
      text,
      created_at: new Date().toISOString()
    };

    const serviceSupabase = createServiceSupabaseClient();
    if (!serviceSupabase) return failClosedResponse('Portal comments');
    const comments = await saveSupabaseComment(serviceSupabase, resolved.portalToken, comment);

    if (!comments) {
      return NextResponse.json({ error: 'Unable to save comment' }, { status: 500 });
    }

    await writeAuditLog(serviceSupabase, {
      userId: resolved.portalToken.owner_id,
      action: 'portal_comment_created',
      resourceType: resolved.portalToken.resource_type,
      resourceId: resolved.portalToken.resource_id,
      ip,
    });

    // Telemetry tracking
    await recordServerGrowthEvent(serviceSupabase, {
      eventName: 'client_response_received',
      userId: resolved.portalToken.owner_id,
      source: 'client',
      properties: {
        resource_type: resolved.portalToken.resource_type,
        resource_id: resolved.portalToken.resource_id,
        author,
        comment_length: text.length
      }
    });

    try {
      const { trackProfileMetric } = await import('../../../../lib/supabase');
      await trackProfileMetric(serviceSupabase, resolved.portalToken.owner_id, 'time_to_first_client_response');
    } catch (trackErr) {
      console.error('Failed to track client response metric:', trackErr);
    }

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
    const ip = getIp(request);
    const limitResult = await rateLimit(`portal:patch:${ip}`, 10, 60000);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: limitResult.error || 'Too many requests' },
        { status: 429 }
      );
    }

    const { token } = await params;
    const resolved = await resolvePortalDocument(token);
    if (resolved === 'production-unconfigured') return failClosedResponse('Portal update');
    if (!resolved) {
      return NextResponse.json({ error: 'Portal link expired' }, { status: 404 });
    }

    const { action } = await request.json();
    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const serviceSupabase = createServiceSupabaseClient();
    if (!serviceSupabase) return failClosedResponse('Portal update');

    // Fetch freelancer profile for notification routing
    const { data: freelancerProfile } = await serviceSupabase
      .from('profiles')
      .select('email, name')
      .eq('id', resolved.portalToken.owner_id)
      .maybeSingle();

    const freelancerName = freelancerProfile?.name || 'Freelancer';
    const freelancerEmail = freelancerProfile?.email;

    if (resolved.type === 'quote') {
      if (action === 'approve') {
        const { error } = await serviceSupabase
          .from('quotes')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('id', resolved.portalToken.resource_id)
          .eq('user_id', resolved.portalToken.owner_id);

        if (error) throw error;

        await recordServerGrowthEvent(serviceSupabase, {
          eventName: 'quote_accepted',
          userId: resolved.portalToken.owner_id,
          source: 'client',
          properties: {
            quote_id: resolved.portalToken.resource_id,
            quote_number: resolved.data?.quote_number
          }
        });

        try {
          const { trackProfileMetric } = await import('../../../../lib/supabase');
          await trackProfileMetric(serviceSupabase, resolved.portalToken.owner_id, 'time_to_first_client_response');
        } catch (trackErr) {
          console.error('Failed to track quote approved client response:', trackErr);
        }

        await writeAuditLog(serviceSupabase, {
          userId: resolved.portalToken.owner_id,
          action: 'portal_quote_approved',
          resourceType: 'quote',
          resourceId: resolved.portalToken.resource_id,
          ip,
        });

        // Trigger Quote Approved email
        if (freelancerEmail) {
          try {
            const { sendQuoteApprovedEmail } = await import('../../../../lib/email');
            await sendQuoteApprovedEmail(
              freelancerEmail,
              resolved.data,
              freelancerName
            );
          } catch (mailErr) {
            console.error('Failed to send Quote Approved email:', mailErr);
          }
        }

        return NextResponse.json({ success: true, status: 'approved' });
      }

      if (action === 'reject') {
        const { error } = await serviceSupabase
          .from('quotes')
          .update({ status: 'declined', updated_at: new Date().toISOString() })
          .eq('id', resolved.portalToken.resource_id)
          .eq('user_id', resolved.portalToken.owner_id);

        if (error) throw error;

        await recordServerGrowthEvent(serviceSupabase, {
          eventName: 'quote_rejected',
          userId: resolved.portalToken.owner_id,
          source: 'client',
          properties: {
            quote_id: resolved.portalToken.resource_id,
            quote_number: resolved.data?.quote_number
          }
        });

        try {
          const { trackProfileMetric } = await import('../../../../lib/supabase');
          await trackProfileMetric(serviceSupabase, resolved.portalToken.owner_id, 'time_to_first_client_response');
        } catch (trackErr) {
          console.error('Failed to track quote rejected client response:', trackErr);
        }

        await writeAuditLog(serviceSupabase, {
          userId: resolved.portalToken.owner_id,
          action: 'portal_quote_declined',
          resourceType: 'quote',
          resourceId: resolved.portalToken.resource_id,
          ip,
        });

        return NextResponse.json({ success: true, status: 'declined' });
      }
    }

    if (resolved.type === 'invoice') {
      if (action === 'pay') {
        const { error } = await serviceSupabase
          .from('invoices')
          .update({ status: 'paid', updated_at: new Date().toISOString() })
          .eq('id', resolved.portalToken.resource_id)
          .eq('user_id', resolved.portalToken.owner_id);

        if (error) throw error;

        await writeAuditLog(serviceSupabase, {
          userId: resolved.portalToken.owner_id,
          action: 'portal_invoice_paid',
          resourceType: 'invoice',
          resourceId: resolved.portalToken.resource_id,
          ip,
        });

        // Trigger Invoice Paid email
        if (freelancerEmail) {
          try {
            const { sendInvoicePaidEmail } = await import('../../../../lib/email');
            await sendInvoicePaidEmail(
              freelancerEmail,
              resolved.data,
              freelancerName
            );
          } catch (mailErr) {
            console.error('Failed to send Invoice Paid email:', mailErr);
          }
        }

        return NextResponse.json({ success: true, status: 'paid' });
      }
    }

    return NextResponse.json({ error: 'Action not supported' }, { status: 400 });
  } catch (error) {
    console.error('Error updating portal document status:', error);
    return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
  }
}
