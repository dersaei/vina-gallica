export const prerender = false;

import type { APIRoute } from "astro";

const SIRENE_URL = "https://recherche-entreprises.api.gouv.fr/search";

export const GET: APIRoute = async ({ request, url }) => {
  const json = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=300",
      },
    });

  const siren = url.searchParams.get("siren")?.trim() ?? "";

  if (!/^\d{9}$/.test(siren)) {
    return json({ valid: false, error: "SIREN must be exactly 9 digits" }, 400);
  }

  // In dev mode, skip the real API call so local testing works without a real SIREN
  if (import.meta.env.DEV) {
    return json({ valid: true, name: "Dev mode — validation skipped" });
  }

  let res: Response;
  try {
    res = await fetch(`${SIRENE_URL}?q=${siren}&mtq=siren`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return json({ valid: false, error: "Could not reach the business registry. Please try again." }, 502);
  }

  if (!res.ok) {
    return json({ valid: false, error: "Business registry returned an error. Please try again." }, 502);
  }

  const data = (await res.json()) as {
    results?: Array<{ siren: string; nom_complet?: string; etat_administratif?: string }>;
    total_results?: number;
  };

  const match = data.results?.find((r) => r.siren === siren);

  if (!match) {
    return json({ valid: false, error: "SIREN not found in the French business registry." });
  }

  if (match.etat_administratif === "C") {
    return json({ valid: false, error: "This company is closed (radiation). Registration is not possible." });
  }

  return json({ valid: true, name: match.nom_complet });
};
