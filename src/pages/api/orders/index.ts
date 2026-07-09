export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { getMe } from "../../../lib/me";
import { parseVatId, checkVies, normalizedVatId } from "../../../lib/vies";
import { checkSiren, isValidSirenFormat } from "../../../lib/siren";

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;
const DIRECTUS_SERVICE_TOKEN = import.meta.env.DIRECTUS_SERVICE_TOKEN;

// Only VG's annual French subscription is offered from the portal for now.
const SERVICE_CODE = "VG_ANNUAL_FR";

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type OrderBody = {
  idempotencyKey?: string;
  path?: "vat" | "siren";
  vatId?: string;
  siren?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerCountry?: string;
  buyerStreet?: string;
  buyerPostalCode?: string;
  buyerCity?: string;
  consentInvoice?: boolean;
  consentPrivacy?: boolean;
  lang?: string;
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const me = await getMe<{ id: string }>(cookies, "id");
  if (!me) return json({ error: "unauthenticated" }, 401);

  const body = (await request.json().catch(() => ({}))) as OrderBody;

  if (!body.consentInvoice || !body.consentPrivacy) {
    return json({ error: "consent_required" }, 400);
  }

  const lang = body.lang === "fr" ? "fr" : "en";
  const name = str(body.buyerName);
  const email = str(body.buyerEmail);
  const country = str(body.buyerCountry).toUpperCase();
  const street = str(body.buyerStreet);
  const postal = str(body.buyerPostalCode);
  const city = str(body.buyerCity);

  if (!name || !email || !country || !street || !postal || !city) {
    return json({ error: "missing_fields" }, 400);
  }
  if (!EMAIL_RE.test(email)) return json({ error: "invalid_email" }, 400);
  if (!/^[A-Z]{2}$/.test(country)) return json({ error: "invalid_country" }, 400);

  // We re-validate the tax id server-side so the client cannot bypass the check.
  // VAT-EU path: never accept without a positive VIES check (VAT compliance).
  // SIREN path: confirm the company exists (and is not closed) in the registry;
  // the invoice is issued with VAT (no EU VAT id), so buyer_vat_id stays null.
  let vatId: string | null = null;
  if (body.path === "siren") {
    const siren = (typeof body.siren === "string" ? body.siren : "").replace(/\D/g, "");
    if (!isValidSirenFormat(siren)) return json({ error: "siren_invalid" }, 400);
    const check = await checkSiren(siren);
    if (check.status === "unavailable") return json({ error: "siren_unavailable" }, 503);
    if (check.status !== "valid") return json({ error: "siren_invalid" }, 400);
    vatId = null;
  } else {
    const parsed = typeof body.vatId === "string" ? parseVatId(body.vatId) : null;
    if (!parsed) return json({ error: "vat_invalid" }, 400);
    const vies = await checkVies(parsed.countryCode, parsed.vatNumber);
    if (vies.status === "unavailable") return json({ error: "vies_unavailable" }, 503);
    if (vies.status !== "valid") return json({ error: "vat_invalid" }, 400);
    vatId = normalizedVatId(parsed.countryCode, parsed.vatNumber);
  }

  // Idempotency: a double-click (same client UUID) must not create two records.
  const idem = str(body.idempotencyKey);
  const kv = env.SESSION;
  const idemKey = idem ? `order:idem:${idem}` : null;
  if (idemKey && kv) {
    const cached = await kv.get(idemKey);
    if (cached) return json({ id: cached, idempotent: true });
  }

  const payload = {
    service_code: SERVICE_CODE,
    language: lang,
    buyer_name: name,
    buyer_email: email,
    buyer_vat_id: vatId,
    buyer_country: country,
    buyer_street: street,
    buyer_postal_code: postal,
    buyer_city: city,
    user: me.id,
  };

  const res = await fetch(`${DIRECTUS_URL}/items/form_submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[orders] Directus error", res.status, JSON.stringify(err));
    return json({ error: "create_failed" }, 502);
  }

  const created = (await res.json()) as { data: { id: string } };
  const id = created.data.id;
  if (idemKey && kv) await kv.put(idemKey, id, { expirationTtl: 300 });

  return json({ id });
};
