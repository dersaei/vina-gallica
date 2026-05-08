export const prerender = false;

import type { APIRoute } from "astro";
import { createDirectus, rest, readUsers, updateUser, withToken } from "@directus/sdk";

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;
const DIRECTUS_SERVICE_TOKEN = import.meta.env.DIRECTUS_SERVICE_TOKEN;
const TURNSTILE_SECRET = import.meta.env.TURNSTILE_SECRET_KEY;

export const POST: APIRoute = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const data = await request.formData();
  const lang = data.get("lang") === "fr" ? "fr" : "en";

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
  if (password.length < 16) {
    return json({ error: "Password must be at least 16 characters." }, 400);
  }

  const turnstileToken = data.get("cf-turnstile-response") as string | null;
  if (!turnstileToken) {
    return json({ error: "Please complete the security check." }, 400);
  }
  const tsVerify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: TURNSTILE_SECRET,
      response: turnstileToken,
      remoteip: request.headers.get("CF-Connecting-IP") ?? undefined,
    }),
  });
  const tsData = await tsVerify.json() as { success: boolean };
  if (!tsData.success) {
    return json({ error: "Security check failed. Please try again." }, 400);
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
      verification_url: lang === "fr" ? `${origin}/fr/verification-email` : `${origin}/verify-email`,
    }),
  });

  if (!regRes.ok) {
    const err = await regRes.json().catch(() => ({}));
    const firstError = (err as { errors?: { message: string; extensions?: { code: string } }[] })?.errors?.[0];
    const message = firstError?.message || "Registration failed. Please try again.";
    const isDuplicate = firstError?.extensions?.code === "RECORD_NOT_UNIQUE";
    return json({ error: message }, isDuplicate ? 409 : 500);
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
