export const prerender = false;

import type { APIRoute } from "astro";

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;
const DIRECTUS_SERVICE_TOKEN = import.meta.env.DIRECTUS_SERVICE_TOKEN;

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const GET: APIRoute = async ({ cookies }) => {
  const accessToken = cookies.get("directus_access_token")?.value;
  if (!accessToken) return json({ error: "Not authenticated." }, 401);

  // Pobierz user id z /users/me
  const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields=id`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) return json({ error: "Not authenticated." }, 401);
  const { data: me } = await meRes.json() as { data: { id: string } };

  const fields = [
    "id", "Name", "slug", "status", "date_created", "date_updated",
    "category.id", "category.name", "category.name_fr",
    "terroir.wine_regions_id.id", "terroir.wine_regions_id.region",
    "address", "postal_code", "place", "location", "website", "phone",
    "logo", "description_en", "description_fr",
    "translate_to_en", "translate_to_fr",
    "gallery", "certificates", "video",
    "opening_hours", "event_date_start", "event_date_end",
    "nearest_bus_station_name", "nearest_bus_station_distance_m",
    "nearest_train_station_name", "nearest_train_station_distance_m",
  ].join(",");

  const res = await fetch(
    `${DIRECTUS_URL}/items/places_vg?filter[user_id][_eq]=${me.id}&fields=${fields}&sort[]=-date_updated&limit=50`,
    { headers: { Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}` } }
  );

  if (!res.ok) return json({ error: "Failed to fetch listings." }, 500);
  const body = await res.json() as { data: unknown[] };
  return json({ listings: body.data });
};
