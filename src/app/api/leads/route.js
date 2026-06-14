import { NextResponse } from 'next/server';
import { getLeadsByUserId, saveLead, getCardProfileByUsername, updateLeadDetails } from '../../lib/db';
import { createPublicSupabaseClient, getRequestUser, writeAuditLog } from '../../lib/supabase';
import { rateLimit } from '../../lib/rate-limit';
import { failClosedResponse, getIp, hasSpamSignals, isDemoModeAllowed } from '../../lib/security';
import { enumValue, validateLeadPayload, validateObject, validationResponse } from '../../lib/validation';

export async function GET(request) {
  try {
    const ip = getIp(request);
    const limitResult = await rateLimit(ip, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const context = await getRequestUser(request);
    
    if (context.mode === 'supabase') {
      const { data, error } = await context.supabase
        .from('leads')
        .select('*')
        .eq('freelancer_id', context.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ data: data || [] });
    }

    // Local / Mock fallback
    if (!isDemoModeAllowed()) return failClosedResponse('Leads');
    const targetUserId = context.mode === 'mock' ? 'usr_mock123' : 'usr_demo123';
    const leads = getLeadsByUserId(targetUserId);
    return NextResponse.json({ data: leads });

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

    // Retrieve context to see if Supabase is used or fallback
    const context = await getRequestUser(request);
    const publicSupabase = context.mode === 'supabase' ? context.supabase : createPublicSupabaseClient();

    if (publicSupabase) {
      // Find card profile by username
      const { data: profile, error: cpErr } = await publicSupabase
        .from('card_profiles')
        .select('id, user_id')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle();

      if (cpErr || !profile) {
        return NextResponse.json({ error: 'Freelancer profile not found' }, { status: 404 });
      }

      // Check lead limit for Free plan
      const { data: userProfile } = await publicSupabase
        .from('profiles')
        .select('plan')
        .eq('id', profile.user_id)
        .single();
      
      const plan = userProfile?.plan || 'free';
      if (plan === 'free') {
        const { count, error: countErr } = await publicSupabase
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

      const { data, error } = await publicSupabase
        .from('leads')
        .insert(payload)
        .select('*')
        .single();

      if (error) throw error;
      return NextResponse.json(data, { status: 201 });
    }

    // Local / Mock fallback
    if (!isDemoModeAllowed()) return failClosedResponse('Leads');
    const profile = getCardProfileByUsername(username.toLowerCase().trim());
    if (!profile) {
      return NextResponse.json({ error: 'Freelancer profile not found' }, { status: 404 });
    }

    // Check lead limit for Free plan locally
    const existingLeads = getLeadsByUserId(profile.user_id);
    const { getUserById } = await import('../../lib/db');
    const freelancerUser = getUserById(profile.user_id);
    const plan = freelancerUser?.plan || 'free';
    if (plan === 'free' && existingLeads.length >= 5) {
      return NextResponse.json(
        { error: 'This freelancer inbox has reached capacity. Please contact them directly or try again later.' },
        { status: 403 }
      );
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

    const newLead = saveLead(payload);
    return NextResponse.json(newLead, { status: 201 });

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
    const limitResult = await rateLimit(ip, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const context = await getRequestUser(request);
    if (context.mode === 'demo') {
      return NextResponse.json({ error: 'Authentication required for modifications' }, { status: 401 });
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

    // Local / Mock fallback
    if (!isDemoModeAllowed()) return failClosedResponse('Leads');
    const updated = updateLeadDetails(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    return NextResponse.json(updated);

  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error updating lead details:', error);
    return NextResponse.json({ error: 'Failed to update lead details' }, { status: 500 });
  }
}
