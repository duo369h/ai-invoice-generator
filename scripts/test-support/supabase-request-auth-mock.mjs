const runtime = globalThis.__corviozSupabaseRequestAuthRuntime__ ||= { clients: [], getUserTokens: [] };

export function resetSupabaseRequestAuthRuntime() {
  runtime.clients.length = 0;
  runtime.getUserTokens.length = 0;
}

export function getSupabaseRequestAuthClients() {
  return [...runtime.clients];
}

export function getSupabaseRequestAuthGetUserTokens() {
  return [...runtime.getUserTokens];
}

export function createClient(_url, _anonKey, options = {}) {
  runtime.clients.push(options);
  const authorization = options?.global?.headers?.Authorization || '';
  const userByToken = {
    'Bearer valid-bearer-token': { id: 'bearer-user' },
    'Bearer valid-cookie-token': { id: 'cookie-user' },
  };

  return {
    auth: {
      async getUser(jwt) {
        runtime.getUserTokens.push(jwt);
        const user = userByToken[jwt ? `Bearer ${jwt}` : authorization];
        return user ? { data: { user }, error: null } : { data: { user: null }, error: new Error('invalid token') };
      },
    },
  };
}
