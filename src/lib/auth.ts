import type { AstroCookies } from "astro";

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;
const isProd = import.meta.env.PROD;

const ACCESS_MAX_AGE = 60 * 15; // 15 min
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7; // 7 dni

export function setAuthCookies(
  cookies: AstroCookies,
  accessToken: string,
  refreshToken: string,
) {
  cookies.set("directus_access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  cookies.set("directus_refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });
}

function clearAuthCookies(cookies: AstroCookies) {
  cookies.delete("directus_access_token", { path: "/" });
  cookies.delete("directus_refresh_token", { path: "/" });
}

/**
 * Returns a usable Directus access token, transparently refreshing it when the
 * short-lived access cookie has expired but the 7-day refresh token is still
 * valid. Writes refreshed tokens back to cookies. Returns null only when the
 * session is genuinely over (no/expired refresh token) — callers should treat
 * null as "not authenticated".
 */
export async function getValidAccessToken(
  cookies: AstroCookies,
): Promise<string | null> {
  const accessToken = cookies.get("directus_access_token")?.value;
  if (accessToken) return accessToken;

  const refreshToken = cookies.get("directus_refresh_token")?.value;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${DIRECTUS_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken, mode: "json" }),
    });
    if (!res.ok) {
      clearAuthCookies(cookies);
      return null;
    }
    const body = (await res.json()) as {
      data: { access_token: string; refresh_token: string };
    };
    setAuthCookies(cookies, body.data.access_token, body.data.refresh_token);
    return body.data.access_token;
  } catch {
    return null;
  }
}
