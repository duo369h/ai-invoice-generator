import { NextResponse } from 'next/server';
import { createServiceSupabaseClient, getRequestUser, writeAuditLog } from '../../lib/supabase';
import { rateLimit, rateLimitAuthenticated } from '../../lib/rate-limit';
import { authRequiredResponse, failClosedResponse, getIp, hasSpamSignals, requestContextResponse } from '../../lib/security';
import { enumValue, validateLeadPayload, validateObject, validationResponse } from '../../lib/validation';

export async function GET(request) {
  try {
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'leads');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }
    
    if (context.mode === 'supabase') {
      const { data, error } = await context.supabase
        .from('leads')
        .select('*')
        .eq('freelancer_id', context.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }

    return authRequiredResponse('leads');

  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ip = getIp(request);
    const limitResult = await rateLimit(ip, 5, 60000); // 5 submissions per minute
    if (!limitResult.success) {
      console.warn(`Rate limit exceeded for IP: ${ip} on POST /api/leads`);
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const body = validateLeadPayload(await request.json());
    const { username, name, email, message, source_utm = {} } = body;
    if (hasSpamSignals(name, email, message)) {
      return NextResponse.json({ error: 'Submission rejected' }, { status: 400 });
    }

    // Look up IP address from headers
    const visitor_ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    const context = await getRequestUser(request);
    if (context.mode === 'unconfigured') return failClosedResponse('Leads');
    const serviceSupabase = createServiceSupabaseClient();
    if (!serviceSupabase) return failClosedResponse('Leads');

    if (serviceSupabase) {
      // Find card profile by username
      const { data: profile, error: cpErr } = await serviceSupabase
        .from('card_profiles')
        .select('id, user_id')
        .eq('username', username.toLowerCase().trim())
        .eq('is_public', true)
        .maybeSingle();

      if (cpErr || !profile) {
        return NextResponse.json({ error: 'Freelancer profile not found' }, { status: 404 });
      }

            // Check lead limit for Free plan
      const { data: userProfile } = await serviceSupabase
        .from('profiles')
        .select('plan, email, name')
        .eq('id', profile.user_id)
        .single();
      
      const plan = userProfile?.plan || 'free';
      if (plan === 'free') {
        const { count, error: countErr } = await serviceSupabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('freelancer_id', profile.user_id);
        
        if (!countErr && count !== null && count >= 5) {
          return NextResponse.json(
            { error: 'This freelancer inbox has reached capacity. Please contact them directly or try again later.' },
            { status: 403 }
          );
        }
      }

      const payload = {
        card_profile_id: profile.id,
        freelancer_id: profile.user_id,
        name,
        email,
        message,
        status: 'new',
        visitor_ip,
        source_utm
      };

      const { error } = await serviceSupabase
        .from('leads')
        .insert(payload);

      if (error) throw error;

      // Trigger New Lead email notification
      if (userProfile?.email) {
        try {
          const { sendNewLeadEmail } = await import('../../lib/email');
          await sendNewLeadEmail(
            userProfile.email,
            { name, email, message, source_utm },
            userProfile.name || 'Freelancer'
          );
        } catch (mailErr) {
          console.error('Failed to send New Lead email:', mailErr);
        }
      }

      return NextResponse.json({ success: true }, { status: 201 });
    }

    return failClosedResponse('Leads');

  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'leads');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }
    const body = validateObject(await request.json());
    const { id, ...rest } = body;
    const status = body.status ? enumValue(body.status, 'status', ['new', 'contacted', 'quote_generated', 'archived']) : undefined;

    if (!id) {
      return NextResponse.json({ error: 'Missing required field: id' }, { status: 400 });
    }

    const updates = {};
    if (status !== undefined) updates.status = status;
    
    const allowedKeys = ['pipeline_status', 'lead_value', 'source', 'tags', 'last_contact_date', 'notes', 'reminder_date'];
    allowedKeys.forEach(key => {
      if (rest[key] !== undefined) {
        updates[key] = rest[key];
      }
    });

    if (context.mode === 'supabase') {
      const { data: existingLead, error: fetchErr } = await context.supabase
        .from('leads')
        .select('source_utm, status')
        .eq('id', id)
        .eq('freelancer_id', context.user.id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;

      const mergedUtm = {
        ...(existingLead?.source_utm || {}),
        ...updates
      };

      let dbStatus = status || existingLead?.status || 'new';
      if (updates.pipeline_status) {
        if (updates.pipeline_status === 'New') dbStatus = 'new';
        else if (updates.pipeline_status === 'Qualified' || updates.pipeline_status === 'Negotiation') dbStatus = 'contacted';
        else if (updates.pipeline_status === 'Proposal Sent') dbStatus = 'quote_generated';
        else if (updates.pipeline_status === 'Won' || updates.pipeline_status === 'Lost') dbStatus = 'archived';
      }

      const { data, error } = await context.supabase
        .from('leads')
        .update({
          status: dbStatus,
          source_utm: mergedUtm
        })
        .eq('id', id)
        .eq('freelancer_id', context.user.id)
        .select('*')
        .single();

      if (error) throw error;
      await writeAuditLog(context.supabase, {
        userId: context.user.id,
        action: 'lead_status_changed',
        resourceType: 'lead',
        resourceId: data.id,
        ip,
      });
      return NextResponse.json(data);
    }

    return authRequiredResponse('leads');

  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error updating lead details:', error);
    return NextResponse.json({ error: 'Failed to update lead details' }, { status: 500 });
  }
}
