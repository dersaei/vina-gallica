export const prerender = false;

import type { APIRoute } from "astro";

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("directus_access_token")?.value;
  if (!accessToken) {
    return json({ error: "Not authenticated." }, 401);
  }

  const data = await request.formData();
  const field = data.get("field") as string;
  const value = (data.get("value") as string)?.trim();

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  const allowed = ["first_name", "last_name", "email", "company_name", "tax_id", "company_address"];
  if (!field || !allowed.includes(field)) {
    return json({ error: "Invalid field." }, 400);
  }

  const res = await fetch(`${DIRECTUS_URL}/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ [field]: value || null }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { errors?: { message: string }[] })?.errors?.[0]?.message || "Update failed.";
    return json({ error: message }, res.status);
  }

  return json({ ok: true });
};
