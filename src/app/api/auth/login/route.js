import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function getSupabaseAuthStorageKey() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const hostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  const projectRef = hostname.split('.')[0];
  return `sb-${projectRef}-auth-token`;
}

function getCookieOptions(request) {
  const options = {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
  };

  const hostname = new URL(request.url).hostname;
  if (
    process.env.NODE_ENV === 'production' &&
    (hostname === 'corvioz.com' || hostname === 'www.corvioz.com')
  ) {
    options.domain = '.corvioz.com';
  }

  return options;
}

export async function GET(request) {
  // Redirect to the login interface page
  return NextResponse.redirect(new URL('/auth', request.url));
}

export async function POST(request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Authentication service is not configured' }, { status: 503 });
    }

    const storageKey = getSupabaseAuthStorageKey();
    if (!storageKey) {
      return NextResponse.json({ error: 'Authentication storage is not configured' }, { status: 503 });
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const response = NextResponse.json({ success: true, session: data.session });
    response.cookies.set(storageKey, JSON.stringify(data.session), getCookieOptions(request));

    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
