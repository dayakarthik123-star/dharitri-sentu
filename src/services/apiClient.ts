// The full-stack dev launcher starts both Vite and the API. Default to API mode in development
// unless explicitly disabled; production builds must opt in with VITE_API_MODE=true.
export const API_MODE = import.meta.env.PROD === true || import.meta.env.VITE_API_MODE === 'true' ||
  (import.meta.env.DEV === true && import.meta.env.VITE_API_MODE !== 'false');

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function apiRequest<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const message = typeof payload === 'object' && payload?.error?.message
      ? payload.error.message
      : `Request failed (${response.status}).`;
    const code = typeof payload === 'object' ? payload?.error?.code : undefined;
    throw new ApiError(message, response.status, code);
  }
  return payload as T;
}
