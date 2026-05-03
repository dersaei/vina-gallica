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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function nanoid6(): string {
  return Math.random().toString(36).slice(2, 8);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("directus_access_token")?.value;
  if (!accessToken) return json({ error: "Not authenticated." }, 401);

  // Pobierz user id
  const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields=id,plan`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) return json({ error: "Not authenticated." }, 401);
  const { data: me } = await meRes.json() as { data: { id: string; plan?: string } };
  const isPremium = me.plan === "premium";

  const data = await request.json() as Record<string, unknown>;

  const name = (data.Name as string)?.trim();
  if (!name) return json({ error: "Name is required." }, 400);

  const postalCode = (data.postal_code as string)?.trim() ?? "";
  const departmentId = postalCode ? await departmentIdFromPostalCode(postalCode) : null;

  // Buduj payload
  const payload: Record<string, unknown> = {
    Name: name,
    slug: `${slugify(name)}-${nanoid6()}`,
    logo_alt: name,
    status: (data.submit === true) ? "pending_review" : "draft",
    user_id: me.id,
    category: data.category ?? null,
    address: (data.address as string)?.trim() || null,
    postal_code: postalCode || null,
    place: (data.place as string)?.trim() || null,
    phone: (data.phone as string)?.trim() || null,
    website: (data.website as string)?.trim() || null,
    location: data.location ?? null,
    department: departmentId,
  };

  // Terroir (M2M) — tablica uuid regionów winiarskich
  if (Array.isArray(data.terroir) && data.terroir.length > 0) {
    payload.terroir = data.terroir;
  }

  // Logo (już jako file_id po uploadzie)
  if (data.logo) payload.logo = data.logo;

  // Pola premium
  if (isPremium) {
    payload.description_en = (data.description_en as string)?.trim() || null;
    payload.description_fr = (data.description_fr as string)?.trim() || null;
    payload.translate_to_en = data.translate_to_en === true;
    payload.translate_to_fr = data.translate_to_fr === true;
    if (Array.isArray(data.gallery)) payload.gallery = data.gallery;
    if (Array.isArray(data.certificates)) payload.certificates = data.certificates;
    if (Array.isArray(data.video)) payload.video = data.video;
  }

  console.log("[listings/create] payload", JSON.stringify(payload));
  const res = await fetch(`${DIRECTUS_URL}/items/places_vg`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[listings/create] Directus error", res.status, JSON.stringify(err));
    const message = (err as { errors?: { message: string }[] })?.errors?.[0]?.message ?? "Failed to create listing.";
    return json({ error: message }, res.status);
  }

  const body = await res.json() as { data: { id: string; slug: string } };
  return json({ ok: true, id: body.data.id, slug: body.data.slug });
};
