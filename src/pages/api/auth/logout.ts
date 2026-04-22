export const prerender = false;

import type { APIRoute } from "astro";

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;

export const POST: APIRoute = async ({ cookies }) => {
  const refreshToken = cookies.get("directus_refresh_token")?.value;

  // Unieważnij token w Directus
  if (refreshToken) {
    await fetch(`${DIRECTUS_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => {});
  }

  cookies.delete("directus_access_token", { path: "/" });
  cookies.delete("directus_refresh_token", { path: "/" });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
