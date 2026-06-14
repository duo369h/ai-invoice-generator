import { NextResponse } from 'next/server';
import { getClients, saveClient, deleteClient } from '../../lib/db';
import { getRequestUser } from '../../lib/supabase';
import { rateLimit } from '../../lib/rate-limit';
import { failClosedResponse, getIp, isDemoModeAllowed } from '../../lib/security';
import { validateClientPayload, validationResponse } from '../../lib/validation';

const DEMO_USER_ID = 'usr_demo123';

export async function GET(request) {
  try {
    const ip = getIp(request);
    const limitResult = rateLimit(ip, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const context = await getRequestUser(request);

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

    if (!isDemoModeAllowed()) return failClosedResponse('Clients');
    const targetUserId = context.mode === 'mock' ? 'usr_mock123' : DEMO_USER_ID;
    const clients = getClients().filter(c => c.user_id === targetUserId);

    return NextResponse.json({
      object: 'list',
      data: clients,
      auth_mode: context.mode
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ip = getIp(request);
    const limitResult = rateLimit(ip, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const context = await getRequestUser(request);
    if (context.mode === 'demo') {
      return NextResponse.json({ error: 'Authentication required to save clients' }, { status: 401 });
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
      }

      return NextResponse.json(result);
    }

    if (!isDemoModeAllowed()) return failClosedResponse('Clients');
    const targetUserId = context.mode === 'mock' ? 'usr_mock123' : DEMO_USER_ID;
    
    const client = {
      id: id || `cli_${Math.random().toString(36).substring(2, 14)}`,
      user_id: targetUserId,
      name,
      email,
      address,
      created_at: new Date().toISOString()
    };

    saveClient(client);
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error saving client:', error);
    return NextResponse.json({ error: 'Failed to save client' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const ip = getIp(request);
    const limitResult = rateLimit(ip, 60, 60000);
    if (!limitResult.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    const context = await getRequestUser(request);
    if (context.mode === 'demo') {
      return NextResponse.json({ error: 'Authentication required to delete clients' }, { status: 401 });
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

    const targetUserId = context.mode === 'mock' ? 'usr_mock123' : DEMO_USER_ID;
    if (!isDemoModeAllowed()) return failClosedResponse('Clients');
    const clients = getClients();
    const client = clients.find(c => c.id === id && c.user_id === targetUserId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 });
    }

    deleteClient(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
