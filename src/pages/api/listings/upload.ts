export const prerender = false;

import type { APIRoute } from "astro";

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;
const DIRECTUS_SERVICE_TOKEN = import.meta.env.DIRECTUS_SERVICE_TOKEN;

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const ALLOWED_MIME: Record<string, string[]> = {
  logo:         ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  gallery:      ["image/jpeg", "image/png", "image/webp"],
  certificates: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  video:        ["video/mp4", "video/webm"],
};

const MAX_SIZE: Record<string, number> = {
  logo:         2 * 1024 * 1024,   // 2 MB
  gallery:      5 * 1024 * 1024,   // 5 MB
  certificates: 10 * 1024 * 1024,  // 10 MB
  video:        100 * 1024 * 1024, // 100 MB
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("directus_access_token")?.value;
  if (!accessToken) return json({ error: "Not authenticated." }, 401);

  // Weryfikuj token użytkownika
  const meRes = await fetch(`${DIRECTUS_URL}/users/me?fields=id`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) return json({ error: "Not authenticated." }, 401);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const fieldType = (formData.get("field") as string) ?? "logo";

  if (!file) return json({ error: "No file provided." }, 400);

  const allowed = ALLOWED_MIME[fieldType] ?? ALLOWED_MIME.logo;
  const maxSize = MAX_SIZE[fieldType] ?? MAX_SIZE.logo;

  if (!allowed.includes(file.type)) {
    return json({ error: `File type not allowed. Allowed: ${allowed.join(", ")}` }, 400);
  }
  if (file.size > maxSize) {
    return json({ error: `File too large. Max: ${Math.round(maxSize / 1024 / 1024)} MB` }, 400);
  }

  // Przekaż plik do Directus Files API
  const upstream = new FormData();
  upstream.append("file", file, file.name);

  const uploadRes = await fetch(`${DIRECTUS_URL}/files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}` },
    body: upstream,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    const message = (err as { errors?: { message: string }[] })?.errors?.[0]?.message ?? "Upload failed.";
    return json({ error: message }, uploadRes.status);
  }

  const body = await uploadRes.json() as { data: { id: string } };
  return json({ ok: true, fileId: body.data.id });
};
