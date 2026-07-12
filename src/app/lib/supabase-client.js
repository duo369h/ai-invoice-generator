import { createClient } from '@supabase/supabase-js';

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let supabaseInstance = null;
let authCookieSyncAttached = false;

function getSupabaseAuthStorageKey() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const hostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;
  const projectRef = hostname.split('.')[0];
  return `sb-${projectRef}-auth-token`;
}

function getCookieDomain() {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  if (hostname === 'corvioz.com' || hostname === 'www.corvioz.com') {
    return '; Domain=.corvioz.com';
  }
  return '';
}

function writeSupabaseAuthCookie(session) {
  if (typeof document === 'undefined') return;
  const storageKey = getSupabaseAuthStorageKey();
  if (!storageKey) return;

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const cookieOptions = `; Path=/; SameSite=Lax${getCookieDomain()}${secure}`;
  const clearCookie = (name) => {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${getCookieDomain()}${secure}`;
  };
  const existingChunkNames = (document.cookie || '')
    .split(';')
    .map((cookie) => cookie.trim().split('=')[0])
    .filter((name) => /^\d+$/.test(name.slice(`${storageKey}.`.length)) && name.startsWith(`${storageKey}.`));

  if (!session?.access_token || !session?.refresh_token) {
    clearCookie(storageKey);
    existingChunkNames.forEach(clearCookie);
    return;
  }

  const expiresAt = Number(session.expires_at || 0);
  const maxAge = Math.max(60, expiresAt ? expiresAt - Math.floor(Date.now() / 1000) : 3600);
  const value = encodeURIComponent(JSON.stringify(session));
  const chunkSize = 3800;
  const chunkCount = Math.ceil(value.length / chunkSize);

  // The request-side session reader reassembles contiguous `${storageKey}.<index>` cookies.
  // Remove the legacy direct cookie because it takes precedence over chunks on the server.
  clearCookie(storageKey);
  for (let index = 0; index < chunkCount; index += 1) {
    const chunk = value.slice(index * chunkSize, (index + 1) * chunkSize);
    document.cookie = `${storageKey}.${index}=${chunk}; Max-Age=${maxAge}${cookieOptions}`;
  }

  existingChunkNames
    .filter((name) => Number(name.slice(`${storageKey}.`.length)) >= chunkCount)
    .forEach(clearCookie);
}

function attachAuthCookieSync(client) {
  if (authCookieSyncAttached || !client || typeof window === 'undefined') return;
  authCookieSyncAttached = true;

  client.auth.getSession().then(({ data }) => {
    if (data?.session) writeSupabaseAuthCookie(data.session);
  }).catch(() => {});

  client.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      writeSupabaseAuthCookie(null);
      return;
    }
    if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
      writeSupabaseAuthCookie(session);
    }
  });
}

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured() || typeof window === 'undefined') return null;

  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );

    // Expose instance for E2E tests
    window.supabaseClientInstance = supabaseInstance;

  }
  attachAuthCookieSync(supabaseInstance);
  return supabaseInstance;
}
