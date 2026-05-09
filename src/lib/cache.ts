/**
 * Spryon — Typed fetch wrapper for SSR data fetching
 *
 * Centralises cache settings so all server-side data fetches use
 * the same strategy: force-cache with ISR revalidation.
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export interface FetchCacheOptions {
  /** ISR revalidation window in seconds (default: 3600 = 1 hour) */
  revalidate?: number;
  /** Set to true to skip cache entirely (e.g. for auth-gated pages) */
  noStore?: boolean;
  /** Extra request headers */
  headers?: Record<string, string>;
}

/**
 * Server-side fetch with Cloudflare edge / Next.js ISR caching.
 * Uses `force-cache` + `{ next: { revalidate } }` for public pages.
 *
 * Example:
 *   const data = await fetchWithCache<MenuData>(`/public/r/${slug}`);
 */
export async function fetchWithCache<T>(
  path: string,
  options: FetchCacheOptions = {}
): Promise<T> {
  const { revalidate = 3600, noStore = false, headers = {} } = options;

  const url = path.startsWith("http") ? path : `${API}${path}`;

  const res = await fetch(url, {
    cache: "no-store", // Rely entirely on Cloudflare edge cache
    headers,
  });

  if (!res.ok) {
    throw new Error(
      `fetchWithCache: ${url} returned ${res.status} ${res.statusText}`
    );
  }

  return res.json() as Promise<T>;
}

/**
 * Convenience wrapper for public menu/restaurant data (1-hour cache).
 */
export async function fetchPublicRestaurant(slug: string) {
  return fetchWithCache(`/public/r/${encodeURIComponent(slug)}`, {
    revalidate: 3600,
  });
}

export { API };
