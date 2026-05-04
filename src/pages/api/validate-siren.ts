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
    return json({ valid: true, name: "Château Dev Mode", address: "1 Rue de la Vigne, 33000 Bordeaux" });
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
    results?: Array<{
      siren: string;
      nom_complet?: string;
      etat_administratif?: string;
      siege?: {
        adresse?: string;
        numero_voie?: string;
        type_voie?: string;
        libelle_voie?: string;
        code_postal?: string;
        libelle_commune?: string;
        libelle_pays_etranger?: string;
      };
    }>;
    total_results?: number;
  };

  const match = data.results?.find((r) => r.siren === siren);

  if (!match) {
    return json({ valid: false, error: "SIREN not found in the French business registry." });
  }

  if (match.etat_administratif === "C") {
    return json({ valid: false, error: "This company is closed (radiation). Registration is not possible." });
  }

  const s = match.siege;
  const address = s?.adresse ?? [
    [s?.numero_voie, s?.type_voie, s?.libelle_voie].filter(Boolean).join(" "),
    s?.code_postal,
    s?.libelle_commune ?? s?.libelle_pays_etranger,
  ].filter(Boolean).join(", ");

  return json({ valid: true, name: match.nom_complet, address: address || undefined });
};
