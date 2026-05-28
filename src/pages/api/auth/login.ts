export const prerender = false;

import type { APIRoute } from "astro";
import { setAuthCookies } from "../../../lib/auth";

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;

export const POST: APIRoute = async ({ request, cookies }) => {
  const data = await request.formData();
  const email = (data.get("email") as string)?.trim();
  const password = data.get("password") as string;

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  if (!email || !password) {
    return json({ error: "Email and password are required" }, 400);
  }

  try {
    const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, mode: "json" }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message =
        (err as { errors?: { message: string }[] })?.errors?.[0]?.message ||
        "Invalid email or password";
      return json({ error: message }, 401);
    }

    const body = (await res.json()) as {
      data: { access_token: string; refresh_token: string };
    };
    const { access_token, refresh_token } = body.data;

    setAuthCookies(cookies, access_token, refresh_token);

    return json({ ok: true });
  } catch (err) {
    console.error("[login] error:", err);
    return json({ error: "Login failed. Please try again." }, 500);
  }
};
