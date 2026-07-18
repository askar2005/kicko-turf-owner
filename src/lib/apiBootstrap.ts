const LOCAL_API_BASE_URL = 'http://localhost:5000';
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const isDev = import.meta.env.DEV;
const isLocalPage = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const API_BASE_URL = (configuredApiUrl || LOCAL_API_BASE_URL).replace(/\/$/, '');
const LOCAL_API_URLS = ['http://localhost:5000', 'http://127.0.0.1:5000'];

const isLocalApiRequest = (url: string) => LOCAL_API_URLS.some((localUrl) => url.startsWith(localUrl));

const rewriteUrl = (input: RequestInfo | URL) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  return LOCAL_API_URLS.reduce(
    (nextUrl, localUrl) => nextUrl.replace(localUrl, API_BASE_URL),
    url
  );
};

const getApiConfigurationError = (originalUrl: string, rewrittenUrl: string) => {
  if (!isDev && !isLocalPage && isLocalApiRequest(originalUrl) && !configuredApiUrl) {
    return 'Backend API URL is not configured. Set VITE_API_URL to your deployed backend HTTPS URL, then redeploy this app.';
  }

  if (window.location.protocol === 'https:' && rewrittenUrl.startsWith('http://')) {
    return 'Backend API must use HTTPS when the frontend is opened over HTTPS. Set VITE_API_URL to an HTTPS backend URL.';
  }

  return null;
};

const originalFetch = window.fetch.bind(window);

window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const originalUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const rewrittenUrl = rewriteUrl(input);
  const configurationError = getApiConfigurationError(originalUrl, rewrittenUrl);

  if (configurationError) {
    throw new Error(configurationError);
  }

  try {
    if (typeof input === 'string' || input instanceof URL) {
      return await originalFetch(rewrittenUrl, init);
    }

    if (rewrittenUrl !== input.url) {
      return await originalFetch(new Request(rewrittenUrl, input), init);
    }

    return await originalFetch(input, init);
  } catch (error) {
    if (error instanceof TypeError && isLocalApiRequest(originalUrl)) {
      if (isDev || isLocalPage) {
        throw new Error(`Could not reach backend API at ${API_BASE_URL}. Start kicko-backend-main with npm run dev, or set VITE_API_URL to a running backend URL.`);
      }

      throw new Error('Could not reach the backend API. Verify VITE_API_URL points to the live backend and backend CORS allows this frontend domain.');
    }

    throw error;
  }
}) as typeof window.fetch;

export {};
