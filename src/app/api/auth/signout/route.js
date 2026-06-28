import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ENTRY_AUTH_COOKIE } from '../../../../core/entry/ENTRY_STATE';

export async function GET(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.set(ENTRY_AUTH_COOKIE, '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}

export async function POST(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  await supabase.auth.signOut();

  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.set(ENTRY_AUTH_COOKIE, '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
