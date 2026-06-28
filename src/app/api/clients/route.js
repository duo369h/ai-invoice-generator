import { NextResponse } from 'next/server';
import { getRequestUser, trackProfileMetric } from '../../lib/supabase';
import { rateLimitAuthenticated } from '../../lib/rate-limit';
import { authRequiredResponse, requestContextResponse } from '../../lib/security';
import { validateClientPayload, validationResponse } from '../../lib/validation';

export async function GET(request) {
  try {
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'clients');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }

    if (context.mode === 'supabase') {
      const { data, error } = await context.supabase
        .from('clients')
        .select('*')
        .eq('user_id', context.user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      return NextResponse.json({
        object: 'list',
        data: data || [],
        auth_mode: 'supabase'
      });
    }

    return authRequiredResponse('clients');
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'clients');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }
    const { id, name, email = '', address = '' } = validateClientPayload(await request.json());

    if (context.mode === 'supabase') {
      const payload = {
        name,
        email,
        address,
        user_id: context.user.id
      };

      let result;
      if (id) {
        const { data, error } = await context.supabase
          .from('clients')
          .update(payload)
          .eq('id', id)
          .eq('user_id', context.user.id)
          .select('*')
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await context.supabase
          .from('clients')
          .insert(payload)
          .select('*')
          .single();
        if (error) throw error;
        result = data;

        await trackProfileMetric(context.supabase, context.user.id, 'first_client_added_at');
      }

      return NextResponse.json(result);
    }

    return authRequiredResponse('clients');
  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error saving client:', error);
    return NextResponse.json({ error: 'Failed to save client' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'clients');
    if (contextFailure) return contextFailure;
    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    if (context.mode === 'supabase') {
      const { error } = await context.supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('user_id', context.user.id);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return authRequiredResponse('clients');
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
