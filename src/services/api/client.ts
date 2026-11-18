import { config } from '@/config/env';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Status 0 = the request never reached the server (offline, DNS, timeout). */
export const NETWORK_ERROR = 'NETWORK_ERROR';

const TIMEOUT_MS = 15000;

/** Thin fetch wrapper for the All Orders backend. */
export async function apiRequest<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${config.apiBaseUrl}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError('Network request failed', 0, NETWORK_ERROR);
  } finally {
    clearTimeout(timer);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      body?.message ?? `Request failed (${response.status})`,
      response.status,
      body?.errorCode,
    );
  }
  return body as T;
}
