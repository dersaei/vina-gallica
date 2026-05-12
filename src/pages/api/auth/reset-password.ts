export const prerender = false;
import type { APIRoute } from "astro";

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;

export const POST: APIRoute = async ({ request }) => {
  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  const data = await request.formData();
  const token = data.get("token") as string;
  const password = data.get("password") as string;
  const passwordConfirm = data.get("password_confirm") as string;

  if (!token) return json({ error: "Token is missing." }, 400);
  if (!password || !passwordConfirm) return json({ error: "Both fields are required." }, 400);
  if (password !== passwordConfirm) return json({ error: "Passwords do not match." }, 400);
  if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);

  const res = await fetch(`${DIRECTUS_URL}/auth/password/reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { errors?: { message: string }[] })?.errors?.[0]?.message || "Reset failed.";
    return json({ error: message }, res.status);
  }

  return json({ ok: true });
};
