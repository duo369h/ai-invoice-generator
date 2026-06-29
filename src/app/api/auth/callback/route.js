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

function safeNextPath(value) {
  if (!value || typeof value !== 'string') return '/dashboard';
  if (!value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  return value;
}

function getCookieOptions() {
  return {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365,
  };
}

function serializeForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function createRedirectWithBrowserPersistence(nextPath, storageKey, session) {
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex" />
    <title>Completing sign in...</title>
  </head>
  <body>
    <script>
      try {
        window.localStorage.setItem(${serializeForScript(storageKey)}, ${serializeForScript(JSON.stringify(session))});
      } catch (error) {}
      window.location.replace(${serializeForScript(nextPath)});
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  const storageKey = getSupabaseAuthStorageKey();
  if (!storageKey) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  const memoryStorage = new Map();
  const cookieOptions = getCookieOptions();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey,
        storage: {
          getItem: (key) => request.cookies.get(key)?.value ?? memoryStorage.get(key) ?? null,
          setItem: (key, value) => {
            memoryStorage.set(key, value);
          },
          removeItem: (key) => {
            memoryStorage.delete(key);
          },
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data?.session) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  const response = createRedirectWithBrowserPersistence(next, storageKey, data.session);
  response.cookies.set(storageKey, JSON.stringify(data.session), cookieOptions);

  return response;
}
