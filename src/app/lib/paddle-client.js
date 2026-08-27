const CLIENT_TOKEN_PATTERN = /^(test|live)_[a-zA-Z0-9]{27}$/;

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export function resolvePaddleEnvironment({
  deploymentEnvironment = process.env.NEXT_PUBLIC_VERCEL_ENV,
  paddleEnvironment = process.env.NEXT_PUBLIC_PADDLE_ENV,
} = {}) {
  const deployment = normalize(deploymentEnvironment);
  const environment = normalize(paddleEnvironment);

  if (!['sandbox', 'production'].includes(environment)) {
    throw new Error('Unsupported Paddle environment. Set NEXT_PUBLIC_PADDLE_ENV to sandbox or production.');
  }

  if (deployment === 'preview' && environment !== 'sandbox') {
    throw new Error('Preview Paddle checkout requires Sandbox configuration.');
  }

  if (deployment === 'production' && environment !== 'production') {
    throw new Error('Production Paddle checkout cannot use Sandbox configuration.');
  }

  // A Live checkout is allowed only when the deployment authority explicitly
  // identifies Production. Sandbox remains safe for local development.
  if (environment === 'production' && deployment !== 'production') {
    throw new Error('Production Paddle checkout requires an explicit Production deployment environment.');
  }

  return environment;
}

export function isSandboxClientToken(token) {
  return CLIENT_TOKEN_PATTERN.test(String(token || '').trim()) && String(token).trim().startsWith('test_');
}

export function isLiveClientToken(token) {
  return CLIENT_TOKEN_PATTERN.test(String(token || '').trim()) && String(token).trim().startsWith('live_');
}

export function validatePaddleClientToken(token, environment) {
  const normalizedToken = String(token || '').trim();
  if (!CLIENT_TOKEN_PATTERN.test(normalizedToken)) {
    throw new Error('Invalid Paddle client token class.');
  }
  if (environment === 'sandbox' && !isSandboxClientToken(normalizedToken)) {
    throw new Error('Sandbox Paddle checkout requires a test_ client token.');
  }
  if (environment === 'production' && !isLiveClientToken(normalizedToken)) {
    throw new Error('Production Paddle checkout requires a live_ client token.');
  }
  return normalizedToken;
}

export function loadPaddleScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    if (window.Paddle) return resolve(window.Paddle);

    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => {
      resolve(window.Paddle);
    };
    script.onerror = () => {
      resolve(null);
    };
    document.body.appendChild(script);
  });
}
