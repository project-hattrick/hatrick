import { env } from '@/lib/env';
import { useAuthStore } from '@/store/auth.store';

/** Thrown by the http client on any non-2xx response — carries the HTTP status. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** JSON-serializable request body; sets Content-Type automatically. */
  body?: unknown;
  signal?: AbortSignal;
}

/** Best-effort message from an error response ({ message } | text | status). */
async function extractError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { message?: string | string[] };
    const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    if (msg) return msg;
  } catch {
    /* not JSON — fall through */
  }
  return `Request failed (${res.status})`;
}

/**
 * The single seam every service call goes through. Sends the httpOnly session
 * cookie (`credentials: 'include'`), normalizes errors to `ApiError`, and on a
 * 401 drops any stale client session so the UI reflects the expired cookie.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;
  const res = await fetch(`${env.apiUrl}${path}`, {
    method,
    credentials: 'include',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (res.status === 401) {
    // Cookie missing/expired/invalid — the server is the source of truth, so
    // reconcile the client to signed-out. Read the store outside React on purpose.
    useAuthStore.getState().onUnauthorized();
  }

  if (!res.ok) throw new ApiError(res.status, await extractError(res));
  if (res.status === 204) return undefined as T;
  // A 200 with an empty body (e.g. a handler that returns `null`, like GET /fantasy/squad
  // with no squad yet) must NOT be fed to JSON.parse — that throws and rejects the whole
  // call. Treat an empty body as `undefined` so nullable endpoints resolve cleanly.
  const text = await res.text();
  return (text ? (JSON.parse(text) as T) : (undefined as T));
}

/** Verb helpers — thin sugar over apiFetch. */
export const api = {
  get: <T>(path: string, signal?: AbortSignal) => apiFetch<T>(path, { method: 'GET', signal }),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};
