export function loadPaddleScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(null);
    if (window.Paddle) return resolve(window.Paddle);

    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v3/paddle.js';
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
