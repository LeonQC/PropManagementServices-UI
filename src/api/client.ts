// Tiny fetch wrapper. Paths are relative so the Vite dev proxy (and the prod
// nginx reverse-proxy) can forward them to the listings-service.

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(path, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}
