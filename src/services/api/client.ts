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

/** Thin fetch wrapper for the All Orders backend. */
export async function apiRequest<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = init;
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      body?.message ?? `Request failed (${response.status})`,
      response.status,
      body?.code,
    );
  }
  return body as T;
}
