export const NextResponse = {
  json(body, init = {}) {
    return {
      body,
      status: init.status || 200,
      async json() { return this.body; },
    };
  },
};

export async function getRequestUser() {
  return { mode: 'unauthenticated', user: null, supabase: null };
}

export async function rateLimitAuthenticated() {
  return { success: true };
}

export function requestContextResponse(context, resource) {
  if (context?.mode === 'unauthenticated') return NextResponse.json({ error: `Authentication required to access ${resource}.` }, { status: 401 });
  return null;
}

export function authRequiredResponse(resource) {
  return NextResponse.json({ error: `Authentication required to access ${resource}.` }, { status: 401 });
}
