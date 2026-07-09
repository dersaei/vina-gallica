// SIREN validation for French businesses without an EU VAT number.
// Uses the free, open, token-less government registry (DINUM / annuaire-
// entreprises) — the same source the account-registration form already uses.
// No api.insee.fr token is required. Shared by /api/siren-check (interactive)
// and /api/orders (integrity re-check at submit).

export type SirenResult =
  | { status: "valid"; name: string; street: string; postalCode: string; city: string; country: string }
  | { status: "invalid" }
  | { status: "closed" }
  | { status: "unavailable" };

const SIRENE_URL = "https://recherche-entreprises.api.gouv.fr/search";

export function isValidSirenFormat(siren: string): boolean {
  return /^\d{9}$/.test(siren);
}

interface SireneSiege {
  adresse?: string;
  numero_voie?: string;
  type_voie?: string;
  libelle_voie?: string;
  code_postal?: string;
  libelle_commune?: string;
  libelle_pays_etranger?: string;
}

export async function checkSiren(siren: string): Promise<SirenResult> {
  // Dev shortcut mirrors validate-siren.ts so local testing works without a
  // real SIREN and without hitting the live registry.
  if (import.meta.env.DEV) {
    return {
      status: "valid",
      name: "Château Dev Mode",
      street: "1 Rue de la Vigne",
      postalCode: "33000",
      city: "Bordeaux",
      country: "FR",
    };
  }

  let res: Response;
  try {
    res = await fetch(`${SIRENE_URL}?q=${siren}&mtq=siren`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    return { status: "unavailable" };
  }
  if (!res.ok) return { status: "unavailable" };

  const data = (await res.json().catch(() => ({}))) as {
    results?: Array<{
      siren: string;
      nom_complet?: string;
      etat_administratif?: string;
      siege?: SireneSiege;
    }>;
  };

  const match = data.results?.find((r) => r.siren === siren);
  if (!match) return { status: "invalid" };
  if (match.etat_administratif === "C") return { status: "closed" };

  const s = match.siege ?? {};
  const street = [s.numero_voie, s.type_voie, s.libelle_voie]
    .filter(Boolean)
    .join(" ");

  return {
    status: "valid",
    name: match.nom_complet ?? "",
    street,
    postalCode: s.code_postal ?? "",
    city: s.libelle_commune ?? s.libelle_pays_etranger ?? "",
    country: "FR",
  };
}
