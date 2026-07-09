export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getMe } from "../../lib/me";
import { checkSiren, isValidSirenFormat } from "../../lib/siren";

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const RATE_LIMIT = 10; // requests per minute per user

export const POST: APIRoute = async ({ request, cookies }) => {
  const me = await getMe(cookies);
  if (!me) return json({ error: "unauthenticated" }, 401);

  // Soft rate limit — the public registry must not be hammered.
  const kv = env.SESSION;
  if (kv) {
    const key = `rl:siren:${me.id}`;
    const count = parseInt((await kv.get(key)) ?? "0", 10);
    if (count >= RATE_LIMIT) return json({ status: "rate_limited" }, 429);
    await kv.put(key, String(count + 1), { expirationTtl: 60 });
  }

  const body = (await request.json().catch(() => ({}))) as { siren?: string };
  const siren = (typeof body.siren === "string" ? body.siren : "").replace(/\D/g, "");
  if (!isValidSirenFormat(siren)) return json({ status: "invalid_format" });

  const result = await checkSiren(siren);
  if (result.status === "unavailable") return json({ status: "unavailable" }, 503);
  if (result.status === "closed") return json({ status: "closed" });
  if (result.status !== "valid") return json({ status: "invalid" });

  return json({
    status: "valid",
    name: result.name,
    country: result.country,
    street: result.street,
    postalCode: result.postalCode,
    city: result.city,
  });
};
