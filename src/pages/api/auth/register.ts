export const prerender = false;

import type { APIRoute } from "astro";
import { createDirectus, rest, readUsers, updateUser, withToken } from "@directus/sdk";

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;
const DIRECTUS_SERVICE_TOKEN = import.meta.env.DIRECTUS_SERVICE_TOKEN;
const PUBLIC_URL = import.meta.env.PUBLIC_SITE_URL ?? "http://localhost:4321";

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();

  const firstName = (data.get("first_name") as string)?.trim();
  const lastName = (data.get("last_name") as string)?.trim();
  const companyName = (data.get("company_name") as string)?.trim();
  const taxId = (data.get("tax_id") as string)?.trim();
  const companyAddress = (data.get("company_address") as string)?.trim();
  const email = (data.get("email") as string)?.trim();
  const password = data.get("password") as string;
  const passwordConfirm = data.get("password_confirm") as string;

  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  if (!firstName || !lastName || !companyName || !email || !password || !passwordConfirm) {
    return json({ error: "All required fields must be filled in." }, 400);
  }
  if (password !== passwordConfirm) {
    return json({ error: "Passwords do not match." }, 400);
  }
  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters." }, 400);
  }

  // Krok 1: Zarejestruj przez publiczny endpoint — tworzy konto + wysyła email weryfikacyjny
  const regRes = await fetch(`${DIRECTUS_URL}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      verification_url: `${PUBLIC_URL}/verify-email`,
    }),
  });

  if (!regRes.ok) {
    const err = await regRes.json().catch(() => ({}));
    const message =
      (err as { errors?: { message: string }[] })?.errors?.[0]?.message ||
      "Registration failed. Please try again.";
    // Zwróć 409 dla duplikatu emaila, żeby frontend mógł pokazać właściwy komunikat
    const status = regRes.status === 400 ? 409 : 500;
    return json({ error: message }, status);
  }

  // Krok 2: Znajdź nowo utworzonego użytkownika po emailu i uzupełnij custom pola
  const client = createDirectus(DIRECTUS_URL).with(rest());

  try {
    const users = await client.request(
      withToken(
        DIRECTUS_SERVICE_TOKEN,
        readUsers({
          filter: { email: { _eq: email } },
          fields: ["id"],
          limit: 1,
        })
      )
    );

    const userId = users[0]?.id;
    if (userId) {
      await client.request(
        withToken(
          DIRECTUS_SERVICE_TOKEN,
          updateUser(userId, {
            // @ts-expect-error custom fields on directus_users
            company_name: companyName,
            tax_id: taxId || null,
            company_address: companyAddress || null,
            plan: "free",
          })
        )
      );
    }
  } catch (err) {
    // Non-fatal — konto istnieje, email weryfikacyjny wysłany. Custom pola można uzupełnić później.
    console.error("[register] patch custom fields error:", err);
  }

  return json({ ok: true });
};
