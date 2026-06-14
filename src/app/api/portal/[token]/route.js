import { NextResponse } from 'next/server';
import { getInvoices, getPortalTokenByHash, getQuotes } from '../../../lib/db';
import { createServiceSupabaseClient, resolveSupabasePortalToken } from '../../../lib/supabase';
import { rateLimit } from '../../../lib/rate-limit';
import {
  failClosedResponse,
  getIp,
  hashPortalToken,
  hasSpamSignals,
  isDemoModeAllowed,
} from '../../../lib/security';
import { validatePortalCommentPayload, validationResponse } from '../../../lib/validation';

const serializeInvoiceNotes = (baseNotes, metadata) => {
  return `${baseNotes || ''}\n\n---METADATA---\n${JSON.stringify(metadata)}`;
};

const deserializeInvoiceNotes = (fullNotes) => {
  if (!fullNotes) return { notes: '', billing_type: 'standard', late_fee: 0, auto_reminder: false, comments: [], files: [] };
  const parts = fullNotes.split('\n\n---METADATA---\n');
  if (parts.length > 1) {
    try {
      const meta = JSON.parse(parts[1]);
      return {
        notes: parts[0],
        billing_type: meta.billing_type || 'standard',
        late_fee: meta.late_fee || 0,
        auto_reminder: !!meta.auto_reminder,
        comments: meta.comments || [],
        files: meta.files || []
      };
    } catch {
      // Ignore malformed legacy metadata.
    }
  }
  return { notes: fullNotes, billing_type: 'standard', late_fee: 0, auto_reminder: false, comments: [], files: [] };
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
      late_fee: meta.late_fee,
      auto_reminder: meta.auto_reminder,
      comments: meta.comments,
      files: meta.files && meta.files.length ? meta.files : [
        { name: 'Branding Assets Guidelines (Handoff).pdf', size: '4.8 MB', url: '#' },
        { name: 'High-Fidelity Figma Prototype Board', size: 'External Link', url: 'https://figma.com' }
      ],
      payment_link: invoice.payment_link || invoice.stripe_payment_link || '',
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
      files: meta.files && meta.files.length ? meta.files : [
        { name: 'Initial Specifications Requirements Document.pdf', size: '1.2 MB', url: '#' }
      ]
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
      return data ? { portalToken, ...withInvoiceMeta(data) } : null;
    }

    if (portalToken.resource_type === 'quote') {
      const { data } = await serviceSupabase
        .from('quotes')
        .select('*')
        .eq('id', portalToken.resource_id)
        .eq('user_id', portalToken.owner_id)
        .maybeSingle();
      return data ? { portalToken, ...withQuoteMeta(data) } : null;
    }

    return null;
  }

  if (!isDemoModeAllowed()) return 'production-unconfigured';

  const portalToken = getPortalTokenByHash(hashPortalToken(token));
  if (!portalToken) return null;

  if (portalToken.resource_type === 'invoice') {
    const invoice = getInvoices().find((item) => item.id === portalToken.resource_id && item.user_id === portalToken.owner_id);
    return invoice ? { portalToken, ...withInvoiceMeta(invoice) } : null;
  }

  if (portalToken.resource_type === 'quote') {
    const quote = getQuotes().find((item) => item.id === portalToken.resource_id && item.user_id === portalToken.owner_id);
    return quote ? { portalToken, ...withQuoteMeta(quote) } : null;
  }

  return null;
}

async function saveLocalComment(portalToken, comment) {
  const fs = await import('fs');
  const path = await import('path');
  const dbPath = path.join(process.cwd(), 'db.json');
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const collection = portalToken.resource_type === 'invoice' ? 'invoices' : 'quotes';
  const index = (data[collection] || []).findIndex((item) => item.id === portalToken.resource_id && item.user_id === portalToken.owner_id);
  if (index === -1) return null;

  const notesMeta = deserializeInvoiceNotes(data[collection][index].notes);
  const comments = [...(notesMeta.comments || []), comment].slice(-100);
  data[collection][index].notes = serializeInvoiceNotes(notesMeta.notes, { ...notesMeta, comments });
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  return comments;
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
    const limitResult = rateLimit(`portal:get:${ip}`, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { token } = await params;
    const resolved = await resolvePortalDocument(token);
    if (resolved === 'production-unconfigured') return failClosedResponse('Portal');
    if (!resolved) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ type: resolved.type, data: resolved.data });
  } catch (error) {
    console.error('Error fetching portal document:', error);
    return NextResponse.json({ error: 'Failed to retrieve document' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const ip = getIp(request);
    const limitResult = rateLimit(`portal:comment:${ip}`, 5, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { token } = await params;
    const { author, text } = validatePortalCommentPayload(await request.json());
    if (hasSpamSignals(author, text)) {
      return NextResponse.json({ error: 'Comment rejected' }, { status: 400 });
    }

    const resolved = await resolvePortalDocument(token);
    if (resolved === 'production-unconfigured') return failClosedResponse('Portal comments');
    if (!resolved) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    const comment = {
      id: `c_${Math.random().toString(36).substring(2, 14)}`,
      author,
      text,
      created_at: new Date().toISOString()
    };

    const serviceSupabase = createServiceSupabaseClient();
    const comments = serviceSupabase
      ? await saveSupabaseComment(serviceSupabase, resolved.portalToken, comment)
      : await saveLocalComment(resolved.portalToken, comment);

    if (!comments) {
      return NextResponse.json({ error: 'Unable to save comment' }, { status: 500 });
    }

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
