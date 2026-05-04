const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;
const DIRECTUS_SERVICE_TOKEN = import.meta.env.DIRECTUS_SERVICE_TOKEN;

// Oficjalna lista kodów INSEE 59 gmin Métropole de Lyon (ustawowo zdefiniowana, stabilna)
const METROPOLE_LYON_INSEE = new Set([
  "69123", // Lyon (commune entière — arrondissements 69001–69009)
  "69003", "69029", "69033", "69034", "69040", "69044", "69046",
  "69052", "69063", "69068", "69069", "69071", "69072", "69081",
  "69085", "69087", "69088", "69089", "69091", "69096", "69100",
  "69116", "69117", "69127", "69142", "69143", "69149", "69152",
  "69153", "69163", "69168", "69191", "69194", "69199", "69202",
  "69199", "69204", "69205", "69207", "69233", "69244", "69250",
  "69256", "69259", "69260", "69266", "69271", "69273", "69278",
  "69279", "69282", "69283", "69284", "69286", "69290", "69292",
  "69293", "69296", "69297",
]);

export async function departmentIdFromPostalCode(
  postalCode: string,
  inseeCode?: string,
): Promise<string | null> {
  const code = postalCode.trim();
  if (!code) return null;

  let deptCode: string;

  if (code.startsWith("20")) {
    // Korsyka: 2A (≤20190) / 2B (>20190)
    const n = parseInt(code.slice(0, 5), 10);
    deptCode = n <= 20190 ? "2A" : "2B";
  } else if (code.startsWith("69")) {
    // Rhône vs Métropole de Lyon — rozróżnienie tylko przez kod INSEE gminy
    // Lyon (69123) i jego arrondissements (69001–69009) należą do 69M
    const insee = inseeCode?.trim() ?? "";
    const isLyonArr = /^6900[1-9]$/.test(insee);
    deptCode = (METROPOLE_LYON_INSEE.has(insee) || isLyonArr) ? "69M" : "69D";
  } else {
    deptCode = code.slice(0, 2);
  }

  try {
    const res = await fetch(
      `${DIRECTUS_URL}/items/departments?filter[code][_eq]=${encodeURIComponent(deptCode)}&fields=id&limit=1`,
      { headers: { Authorization: `Bearer ${DIRECTUS_SERVICE_TOKEN}` } }
    );
    if (!res.ok) return null;
    const body = await res.json() as { data: { id: string }[] };
    return body.data[0]?.id ?? null;
  } catch {
    return null;
  }
}
