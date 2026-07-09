// VAT-EU (TVA intracommunautaire) validation against the EU VIES service.
// Uses the VIES REST/JSON endpoint — SOAP is avoided on purpose because it is
// painful and unreliable to build from a Cloudflare Worker. Shared by
// /api/vies-check (interactive) and /api/orders (compliance re-check at submit).

export type ViesResult =
  | { status: "valid"; name: string; address: string; countryCode: string; vatNumber: string }
  | { status: "invalid" }
  | { status: "unavailable" };

// VIES member-state codes. Greece is "EL" in VIES (ISO is "GR"); Northern
// Ireland is "XI". Everything else matches ISO 3166-1 alpha-2.
const VIES_COUNTRIES = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR",
  "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK", "XI",
]);

// VIES userError codes that mean "try again later", not "invalid number".
const TEMPORARY_ERRORS = new Set([
  "MS_UNAVAILABLE", "MS_MAX_CONCURRENT_REQ", "SERVICE_UNAVAILABLE",
  "TIMEOUT", "SERVER_BUSY", "GLOBAL_MAX_CONCURRENT_REQ",
]);

/**
 * Split a raw VAT-EU string (e.g. "FR 12 345678901") into a VIES country code
 * and number. Returns null when the format is obviously wrong so we never even
 * hit VIES for garbage input.
 */
export function parseVatId(raw: string): { countryCode: string; vatNumber: string } | null {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length < 4) return null;
  let cc = cleaned.slice(0, 2);
  if (cc === "GR") cc = "EL"; // caller may type ISO code for Greece
  const number = cleaned.slice(2);
  if (!/^[A-Z]{2}$/.test(cc) || !VIES_COUNTRIES.has(cc) || number.length === 0) return null;
  return { countryCode: cc, vatNumber: number };
}

/** ISO country code for storage / invoicing (VIES "EL" → ISO "GR"). */
export function isoCountry(viesCountryCode: string): string {
  return viesCountryCode === "EL" ? "GR" : viesCountryCode;
}

/** Canonical VAT id for the invoice, using the ISO prefix. */
export function normalizedVatId(countryCode: string, vatNumber: string): string {
  return `${isoCountry(countryCode)}${vatNumber}`;
}

export async function checkVies(countryCode: string, vatNumber: string): Promise<ViesResult> {
  try {
    const res = await fetch(
      "https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ countryCode, vatNumber }),
      },
    );
    if (!res.ok) return { status: "unavailable" };

    const data = (await res.json()) as {
      valid?: boolean;
      name?: string;
      address?: string;
      userError?: string;
      countryCode?: string;
      vatNumber?: string;
    };

    if (data.userError && TEMPORARY_ERRORS.has(data.userError)) {
      return { status: "unavailable" };
    }
    if (data.valid === true) {
      return {
        status: "valid",
        name: (data.name ?? "").trim(),
        address: (data.address ?? "").trim(),
        countryCode: data.countryCode ?? countryCode,
        vatNumber: data.vatNumber ?? vatNumber,
      };
    }
    return { status: "invalid" };
  } catch {
    return { status: "unavailable" };
  }
}

// Matches a standalone postal-code token across common EU formats: plain 4–5
// digits (FR, DE, ES, IT, BE…) and the Polish "NN-NNN" shape.
const POSTAL_TOKEN = /^(?:\d{2}-\d{3}|\d{4,5})$/;

/**
 * Best-effort split of a VIES address string into street / postal code / city.
 * VIES returns one blob whose line breaks and format vary by member state. We
 * normalise whitespace, then locate the last token that looks like a postal
 * code: everything before it is the street, everything after is the city.
 * Scanning from the end avoids mistaking a street number for the postal code.
 * This is only a prefill convenience — the fields stay fully editable.
 */
export function parseVatAddress(address: string): { street: string; postalCode: string; city: string } {
  const compact = address.replace(/\s+/g, " ").trim();
  const tokens = compact.split(" ");

  for (let i = tokens.length - 1; i >= 0; i--) {
    if (i > 0 && i < tokens.length - 1 && POSTAL_TOKEN.test(tokens[i])) {
      return {
        street: tokens.slice(0, i).join(" ").replace(/[,\s]+$/, "").trim(),
        postalCode: tokens[i],
        city: tokens.slice(i + 1).join(" "),
      };
    }
  }
  return { street: compact, postalCode: "", city: "" };
}
