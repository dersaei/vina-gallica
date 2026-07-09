export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getMe } from "../../lib/me";
import { parseVatId, checkVies, isoCountry, normalizedVatId, parseVatAddress } from "../../lib/vies";

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const RATE_LIMIT = 10; // requests per minute per user

export const POST: APIRoute = async ({ request, cookies }) => {
  const me = await getMe(cookies);
  if (!me) return json({ error: "unauthenticated" }, 401);

  // Soft rate limit — VIES is a shared public service we must not hammer.
  const kv = env.SESSION;
  if (kv) {
    const key = `rl:vies:${me.id}`;
    const count = parseInt((await kv.get(key)) ?? "0", 10);
    if (count >= RATE_LIMIT) return json({ status: "rate_limited" }, 429);
    await kv.put(key, String(count + 1), { expirationTtl: 60 });
  }

  const body = (await request.json().catch(() => ({}))) as { vatId?: string };
  const parsed = typeof body.vatId === "string" ? parseVatId(body.vatId) : null;
  if (!parsed) return json({ status: "invalid_format" });

  const result = await checkVies(parsed.countryCode, parsed.vatNumber);
  if (result.status === "unavailable") return json({ status: "unavailable" }, 503);
  if (result.status === "invalid") return json({ status: "invalid" });

  const addr = parseVatAddress(result.address);
  return json({
    status: "valid",
    vatId: normalizedVatId(result.countryCode, result.vatNumber),
    name: result.name,
    country: isoCountry(result.countryCode),
    street: addr.street,
    postalCode: addr.postalCode,
    city: addr.city,
  });
};
