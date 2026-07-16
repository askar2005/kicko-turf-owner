const DEFAULT_API_BASE_URL = 'http://localhost:5000';
const API_BASE_URL = (import.meta.env.DEV
  ? DEFAULT_API_BASE_URL
  : import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

const rewriteUrl = (input: RequestInfo | URL) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  return url
    .replace('http://localhost:5000', API_BASE_URL)
    .replace('http://127.0.0.1:5000', API_BASE_URL);
};

const originalFetch = window.fetch.bind(window);

window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string' || input instanceof URL) {
    return originalFetch(rewriteUrl(input), init);
  }

  const rewrittenUrl = rewriteUrl(input.url);
  if (rewrittenUrl !== input.url) {
    return originalFetch(new Request(rewrittenUrl, input), init);
  }

  return originalFetch(input, init);
}) as typeof window.fetch;

export {};
