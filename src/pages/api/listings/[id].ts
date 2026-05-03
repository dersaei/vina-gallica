export const prerender = false;

import type { APIRoute } from "astro";
import { departmentIdFromPostalCode } from "../../../lib/departmentFromPostalCode";

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;
const DIRECTUS_SERVICE_TOKEN = import.meta.env.DIRECTUS_SERVICE_TOKEN;

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const PATCH: APIRoute = async ({ request, cookies, params }) => {
  const accessToken = cookies.get("directus_access_token")?.value;
  if (!accessToken) return json({ error: "Not authenticated." }, 401);

  const listingId = params.id;
  if (!listingId) return json({ error: "Missing listing id." }, 400);

  // Pobierz user id i plan
  const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields=id,plan`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) return json({ error: "Not authenticated." }, 401);
  const { data: me } = await meRes.json() as { data: { id: string; plan?: string } };
  const isPremium = me.plan === "premium";

  // Sprawdź czy wpis należy do tego użytkownika
  const checkRes = await fetch(
    `${DIRECTUS_URL}/items/places_vg/${listingId}?fields=id,user_id,status`,
    { headers: { Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}` } }
  );
  if (!checkRes.ok) return json({ error: "Listing not found." }, 404);
  const { data: existing } = await checkRes.json() as { data: { id: string; user_id: string; status: string } };
  if (existing.user_id !== me.id) return json({ error: "Forbidden." }, 403);

  // Nie pozwól edytować opublikowanych bez cofnięcia do draft
  if (existing.status === "published") return json({ error: "Published listings cannot be edited directly. Contact support." }, 403);

  const data = await request.json() as Record<string, unknown>;

  const name = (data.Name as string)?.trim();
  if (!name) return json({ error: "Name is required." }, 400);

  const postalCode = (data.postal_code as string)?.trim() ?? "";
  const departmentId = postalCode ? await departmentIdFromPostalCode(postalCode) : null;

  const payload: Record<string, unknown> = {
    Name: name,
    logo_alt: name,
    status: (data.submit === true) ? (isPremium ? "published" : "pending_review") : "draft",
    category: data.category ?? null,
    address: (data.address as string)?.trim() || null,
    postal_code: postalCode || null,
    place: (data.place as string)?.trim() || null,
    phone: (data.phone as string)?.trim() || null,
    website: (data.website as string)?.trim() || null,
    location: data.location ?? null,
    department: departmentId,
  };

  if (Array.isArray(data.terroir)) {
    payload.terroir = (data.terroir as string[]).map(id => ({ wine_regions_id: id }));
  }
  if (data.logo !== undefined) payload.logo = data.logo;

  if (isPremium) {
    payload.description_en = (data.description_en as string)?.trim() || null;
    payload.description_fr = (data.description_fr as string)?.trim() || null;
    payload.translate_to_en = data.translate_to_en === true;
    payload.translate_to_fr = data.translate_to_fr === true;
    if (Array.isArray(data.gallery)) payload.gallery = data.gallery;
    if (Array.isArray(data.certificates)) payload.certificates = data.certificates;
    if (Array.isArray(data.video)) payload.video = data.video;
  }

  const res = await fetch(`${DIRECTUS_URL}/items/places_vg/${listingId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { errors?: { message: string }[] })?.errors?.[0]?.message ?? "Failed to update listing.";
    return json({ error: message }, res.status);
  }

  return json({ ok: true });
};

export const DELETE: APIRoute = async ({ cookies, params }) => {
  const accessToken = cookies.get("directus_access_token")?.value;
  if (!accessToken) return json({ error: "Not authenticated." }, 401);

  const listingId = params.id;
  if (!listingId) return json({ error: "Missing listing id." }, 400);

  const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields=id`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) return json({ error: "Not authenticated." }, 401);
  const { data: me } = await meRes.json() as { data: { id: string } };

  const checkRes = await fetch(
    `${DIRECTUS_URL}/items/places_vg/${listingId}?fields=id,user_id,status`,
    { headers: { Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}` } }
  );
  if (!checkRes.ok) return json({ error: "Listing not found." }, 404);
  const { data: existing } = await checkRes.json() as { data: { id: string; user_id: string; status: string } };
  if (existing.user_id !== me.id) return json({ error: "Forbidden." }, 403);
  if (existing.status === "published") return json({ error: "Published listings cannot be deleted. Contact support." }, 403);

  const res = await fetch(`${DIRECTUS_URL}/items/places_vg/${listingId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { errors?: { message: string }[] })?.errors?.[0]?.message ?? "Failed to delete listing.";
    return json({ error: message }, res.status);
  }

  return json({ ok: true });
};
