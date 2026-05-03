const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;
const DIRECTUS_SERVICE_TOKEN = import.meta.env.DIRECTUS_SERVICE_TOKEN;

export async function departmentIdFromPostalCode(postalCode: string): Promise<string | null> {
  const code = postalCode.trim();
  if (!code) return null;

  // Korsyka: 2A / 2B
  let deptCode: string;
  if (code.startsWith("20")) {
    const n = parseInt(code.slice(0, 5), 10);
    deptCode = n <= 20190 ? "2A" : "2B";
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
