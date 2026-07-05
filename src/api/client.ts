// Fetch wrapper with in-memory bearer auth and silent refresh.
//
// Per the security design (Architecture §6.1): the access token lives only in
// memory (never localStorage — XSS protection); the refresh token is an HttpOnly
// cookie the browser sends automatically. When a request 401s, we transparently
// hit /auth/v1/refresh once and retry. Paths are relative so the Vite dev proxy
// (and the prod nginx reverse-proxy) forward them to the right service.

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// The AuthProvider registers this so a failed refresh can clear the session and
// bounce the user to /login.
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

/** Structured API error carrying the HTTP status and (for enveloped auth
 * responses) the error code and field-level details. */
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: { field: string; message: string }[];

  constructor(
    status: number,
    message: string,
    code?: string,
    details?: { field: string; message: string }[]
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function toError(res: Response): Promise<ApiError> {
  // Auth-service failures are enveloped as { error: { code, message, details } };
  // listings failures are plain. Try the envelope, fall back to status text.
  try {
    const body = await res.json();
    if (body?.error) {
      return new ApiError(
        res.status,
        body.error.message ?? res.statusText,
        body.error.code,
        body.error.details
      );
    }
  } catch {
    /* non-JSON body */
  }
  return new ApiError(res.status, `Request failed: ${res.status} ${res.statusText}`);
}

// Coordinate concurrent refreshes: at most one /auth/v1/refresh in flight, so a
// burst of 401s shares a single refresh instead of stampeding the endpoint.
let refreshInFlight: Promise<boolean> | null = null;

export function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch("/auth/v1/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: "{}",
          credentials: "include",
        });
        if (!res.ok) return false;
        const body = await res.json();
        const token = body?.data?.accessToken as string | undefined;
        if (!token) return false;
        setAccessToken(token);
        return true;
      } catch {
        return false;
      }
    })();
    void refreshInFlight.finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  /** Skip the bearer header + refresh interceptor (for login/refresh themselves). */
  skipAuth?: boolean;
}

async function request(path: string, opts: RequestOptions = {}): Promise<Response> {
  const { method = "GET", body, signal, skipAuth = false } = opts;

  const doFetch = (): Promise<Response> => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (!skipAuth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
      signal,
    });
  };

  let res = await doFetch();
  if (res.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await doFetch();
    } else {
      onUnauthorized?.();
    }
  }
  return res;
}

// --- Plain helpers (listings-service returns un-enveloped JSON) --------------

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await request(path, { signal });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const res = await request(path, { method: "POST", body, signal });
  if (!res.ok) throw await toError(res);
  return (await res.json()) as T;
}

// --- Enveloped helpers (auth-service wraps payloads in { data, meta }) -------

export async function authGet<T>(path: string, opts?: RequestOptions): Promise<T> {
  const res = await request(path, { ...opts });
  if (!res.ok) throw await toError(res);
  const body = await res.json();
  return body.data as T;
}

export async function authPost<T>(
  path: string,
  body: unknown,
  opts?: RequestOptions
): Promise<T> {
  const res = await request(path, { method: "POST", body, ...opts });
  if (!res.ok) throw await toError(res);
  const json = await res.json();
  return json.data as T;
}
