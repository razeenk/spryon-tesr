/**
 * Spryon — Client-side cache invalidation helper
 *
 * Call this after any mutation that affects a restaurant's public data
 * (menu items, restaurant config, logo, categories).
 * It notifies the Cloudflare Worker to purge the edge cache for that
 * restaurant's cache tag so the next visitor gets fresh data.
 */

const API =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787")
    : "http://localhost:8787";

/**
 * Purge Cloudflare edge cache for a specific cache tag.
 *
 * @param tag       The cache tag to purge, e.g. "restaurant-{id}"
 * @param authToken Bearer token for authentication
 */
export async function invalidateCacheTag(
  tag: string,
  authToken: string
): Promise<void> {
  try {
    await fetch(`${API}/api/cache/purge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ tag }),
    });
    // Fire-and-forget — don't block UI on purge result
  } catch {
    // Purge failures are non-critical; the cache will expire naturally
  }
}

/**
 * Purge the cache for a specific restaurant by ID.
 * Call this after: logo update, config save, menu CRUD, category CRUD.
 */
export async function invalidateRestaurantCache(
  restaurantId: string,
  authToken: string
): Promise<void> {
  return invalidateCacheTag(`restaurant-${restaurantId}`, authToken);
}
