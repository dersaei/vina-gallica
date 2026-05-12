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
  const email = data.get("email") as string;
  const lang = data.get("lang") as string || "en";

  if (!email) {
    return json({ error: "Email is required." }, 400);
  }

  const resetUrl = lang === "fr" 
    ? `${new URL(request.url).origin}/fr/mise-a-jour-mot-de-passe`
    : `${new URL(request.url).origin}/update-password`;

  const res = await fetch(`${DIRECTUS_URL}/auth/password/request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, reset_url: resetUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { errors?: { message: string }[] })?.errors?.[0]?.message || "Request failed.";
    // Mask specific Directus errors if desired, but for now passing the error allows users to see if email was not found, depending on Directus config.
    // Directus usually returns 200 even if user doesn't exist for security reasons, so this might be rare.
    return json({ error: message }, res.status);
  }

  return json({ ok: true });
};
