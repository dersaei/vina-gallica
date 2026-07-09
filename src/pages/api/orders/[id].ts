export const prerender = false;

import type { APIRoute } from "astro";
import { getMe } from "../../../lib/me";

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;
const DIRECTUS_SERVICE_TOKEN = import.meta.env.DIRECTUS_SERVICE_TOKEN;

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// Polled by the client every 2s until the invoicing Flow moves the record out
// of `processing`. Ownership is enforced so a user can only read their own order.
export const GET: APIRoute = async ({ params, cookies }) => {
  const me = await getMe<{ id: string }>(cookies, "id");
  if (!me) return json({ error: "unauthenticated" }, 401);

  const id = params.id;
  if (!id) return json({ error: "not_found" }, 404);

  const res = await fetch(
    `${DIRECTUS_URL}/items/form_submissions/${encodeURIComponent(id)}` +
      `?fields=id,status,issued_invoice_number,last_error,user`,
    { headers: { Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}` } },
  );
  if (!res.ok) return json({ error: "not_found" }, 404);

  const { data } = (await res.json()) as {
    data: {
      status: string;
      issued_invoice_number: string | null;
      last_error: string | null;
      user: string | null;
    };
  };

  if (data.user !== me.id) return json({ error: "forbidden" }, 403);

  return json({
    status: data.status,
    invoiceNumber: data.issued_invoice_number ?? null,
    error: data.last_error ?? null,
  });
};
