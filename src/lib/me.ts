import type { AstroCookies } from "astro";
import { getValidAccessToken } from "./auth";

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;

/**
 * Resolve the currently authenticated Directus user from the session cookies,
 * transparently refreshing the access token when needed. Returns null when the
 * caller is not authenticated. Never exposes the token to the client.
 */
export async function getMe<T = { id: string }>(
  cookies: AstroCookies,
  fields = "id",
): Promise<T | null> {
  const token = await getValidAccessToken(cookies);
  if (!token) return null;
  try {
    const res = await fetch(`${DIRECTUS_URL}/users/me?fields=${fields}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data: T };
    return body.data;
  } catch {
    return null;
  }
}
