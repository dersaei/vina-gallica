import { useCallback, useEffect, useRef, useState } from "react";
import type { Listing, OpeningHour, DayOfWeek } from "./listingTypes";

// ── Constants ────────────────────────────────────────────────────────────────

export const DAYS: DayOfWeek[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

export const DAY_LABELS = {
  en: {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  },
  fr: {
    mon: "Lundi",
    tue: "Mardi",
    wed: "Mercredi",
    thu: "Jeudi",
    fri: "Vendredi",
    sat: "Samedi",
    sun: "Dimanche",
  },
} as const;

// ── Opening-hours helpers ────────────────────────────────────────────────────

export function defaultOpeningHours(): OpeningHour[] {
  return DAYS.map((day) => ({
    day,
    open: "09:00",
    close: "18:00",
    closed: false,
  }));
}

export function mergeOpeningHours(
  saved: OpeningHour[] | null | undefined,
): OpeningHour[] {
  const base = defaultOpeningHours();
  if (!saved || !Array.isArray(saved)) return base;
  return base.map((entry) => saved.find((s) => s.day === entry.day) ?? entry);
}

// ── Shared types ─────────────────────────────────────────────────────────────

export interface WineRegion {
  id: string;
  region: string;
  color?: string | null;
}

export interface Category {
  id: string;
  name: string;
  name_fr: string | null;
  color?: string | null;
}

// ── Geocoder ─────────────────────────────────────────────────────────────────

export interface GeocoderResult {
  geometry: { coordinates: [number, number] };
  place_name: string;
  text: string;
  address?: string;
  context?: { id: string; text: string; short_code?: string }[];
}

export function parseGeocoderResult(result: GeocoderResult) {
  const ctx = result.context ?? [];
  const postcode = ctx.find((c) => c.id.startsWith("postcode"))?.text ?? "";
  const place =
    ctx.find((c) => c.id.startsWith("place"))?.text ??
    ctx.find((c) => c.id.startsWith("locality"))?.text ??
    result.text;

  const placeCtx = ctx.find((c) => c.id.startsWith("place"));
  const shortCode = placeCtx?.short_code ?? "";
  const insee = shortCode.startsWith("fr-") ? shortCode.slice(3) : "";

  const streetNumber = result.address ?? "";
  const streetName = result.text ?? "";
  const address = streetNumber ? `${streetNumber} ${streetName}` : streetName;

  return {
    address,
    postal_code: postcode,
    place,
    insee,
    location: {
      type: "Point" as const,
      coordinates: result.geometry.coordinates,
    },
  };
}

// `active` lets the geocoder mount lazily — e.g. when it lives inside a modal
// that only enters the DOM once opened. Defaults to true for always-rendered
// containers (like the original form).
export function useGeocoder(
  onResult: (result: GeocoderResult) => void,
  active = true,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const geocoderRef = useRef<unknown>(null);
  // Keep the latest callback in a ref so mounting only depends on `active`.
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (!active) return;

    const token = (window as unknown as Record<string, string>)
      .__MAPBOX_TOKEN__;
    if (!token) return;

    let cancelled = false;

    import("@mapbox/mapbox-gl-geocoder").then(({ default: MapboxGeocoder }) => {
      // Modal may have closed before the dynamic import resolved.
      if (cancelled || !containerRef.current || geocoderRef.current) return;
      const geocoder = new MapboxGeocoder({
        accessToken: token,
        types: "address,poi,place",
        countries: "fr",
        language: "fr",
        placeholder: "",
      });
      geocoder.addTo(containerRef.current);
      geocoder.on("result", ({ result }: { result: GeocoderResult }) =>
        onResultRef.current(result),
      );
      geocoderRef.current = geocoder;
    });

    return () => {
      cancelled = true;
      if (geocoderRef.current) {
        (geocoderRef.current as { onRemove: () => void }).onRemove?.();
        geocoderRef.current = null;
      }
    };
  }, [active]);

  return containerRef;
}

// ── File upload ──────────────────────────────────────────────────────────────

export async function uploadFile(file: File, field: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("field", field);
  const res = await fetch("/api/listings/upload", { method: "POST", body: fd });
  const body = (await res.json()) as {
    ok?: boolean;
    fileId?: string;
    error?: string;
  };
  if (!res.ok || !body.fileId) throw new Error(body.error ?? "Upload failed.");
  return body.fileId;
}

export function assetUrl(directusUrl: string, id: string, params?: string) {
  return `${directusUrl}/assets/${id}${params ? `?${params}` : ""}`;
}

// ── Small value helpers ──────────────────────────────────────────────────────

export function toIntOrNull(v: string): number | null {
  const trimmed = v.trim();
  if (!trimmed) return null;
  const n = parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseListingStateArgs {
  plan: "free" | "premium";
  categories: Category[];
  listing?: Listing;
  onSaved?: (id: string, newStatus: string, updatedListing?: Listing) => void;
}

export function useListingState({
  plan,
  categories,
  listing,
  onSaved,
}: UseListingStateArgs) {
  const isPremium = plan === "premium";
  const isEdit = !!listing;
  const isPublished = listing?.status === "published";

  const [name, setName] = useState(listing?.Name ?? "");
  const [category, setCategory] = useState(listing?.category?.id ?? "");
  const [terroir, setTerroir] = useState<string[]>(
    listing?.terroir?.map((t) => t.wine_regions_id.id) ?? [],
  );
  const [address, setAddress] = useState(listing?.address ?? "");
  const [postalCode, setPostal] = useState(listing?.postal_code ?? "");
  const [place, setPlace] = useState(listing?.place ?? "");
  const [insee, setInsee] = useState("");
  const [phone, setPhone] = useState(listing?.phone ?? "");
  const [website, setWebsite] = useState(listing?.website ?? "");
  const [location, setLocation] = useState<{
    type: "Point";
    coordinates: [number, number];
  } | null>(listing?.location ?? null);
  const [logoId, setLogoId] = useState<string | null>(listing?.logo ?? null);

  const [descEn, setDescEn] = useState(listing?.description_en ?? "");
  const [descFr, setDescFr] = useState(listing?.description_fr ?? "");
  const [slogansEn, setSlogansEn] = useState<string[]>(
    (listing?.slogans_en ?? []).map((s) => s.text),
  );
  const [slogansFr, setSlogansFr] = useState<string[]>(
    (listing?.slogans_fr ?? []).map((s) => s.text),
  );
  const [transEn, setTransEn] = useState(listing?.translate_to_en ?? false);
  const [transFr, setTransFr] = useState(listing?.translate_to_fr ?? false);
  const [gallery, setGallery] = useState<string[]>(listing?.gallery ?? []);
  const [certs, setCerts] = useState<string[]>(listing?.certificates ?? []);
  const [video, setVideo] = useState<string[]>(listing?.video ?? []);

  const [openingHours, setOpeningHours] = useState<OpeningHour[]>(
    mergeOpeningHours(listing?.opening_hours),
  );
  const [eventStart, setEventStart] = useState(
    (listing?.event_date_start ?? "").slice(0, 10),
  );
  const [eventEnd, setEventEnd] = useState(
    (listing?.event_date_end ?? "").slice(0, 10),
  );
  const [busStopName, setBusStopName] = useState(
    listing?.nearest_bus_station_name ?? "",
  );
  const [busStopDist, setBusStopDist] = useState<string>(
    listing?.nearest_bus_station_distance_m != null
      ? String(listing.nearest_bus_station_distance_m)
      : "",
  );
  const [trainName, setTrainName] = useState(
    listing?.nearest_train_station_name ?? "",
  );
  const [trainDist, setTrainDist] = useState<string>(
    listing?.nearest_train_station_distance_m != null
      ? String(listing.nearest_train_station_distance_m)
      : "",
  );

  const isFestival = (() => {
    if (!category) return false;
    const cat = categories.find((c) => c.id === category);
    if (!cat) return false;
    const haystack = `${cat.name} ${cat.name_fr ?? ""}`.toLowerCase();
    return haystack.includes("festival");
  })();

  function updateHour(day: DayOfWeek, patch: Partial<OpeningHour>) {
    setOpeningHours((prev) =>
      prev.map((h) => {
        if (h.day !== day) return h;
        const next = { ...h, ...patch };
        // clear time values when marking as closed
        if (patch.closed === true) return { ...next, open: "", close: "" };
        // restore defaults when unchecking closed
        if (patch.closed === false)
          return { ...next, open: "09:00", close: "18:00" };
        return next;
      }),
    );
  }

  const [status, setStatus] = useState<
    "idle" | "saving" | "submitting" | "archiving"
  >("idle");
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(
    null,
  );
  const [nameError, setNameError] = useState(false);

  const onGeoResult = useCallback((result: GeocoderResult) => {
    const parsed = parseGeocoderResult(result);
    setAddress(parsed.address);
    setPostal(parsed.postal_code);
    setPlace(parsed.place);
    setInsee(parsed.insee);
    setLocation(parsed.location);
  }, []);

  function buildPayload(submit: boolean, archive = false) {
    return {
      Name: name,
      category: category || null,
      terroir,
      address,
      postal_code: postalCode,
      place,
      insee,
      phone,
      website,
      location,
      logo: logoId,
      description_en: isPremium ? descEn : undefined,
      description_fr: isPremium ? descFr : undefined,
      slogans_en: isPremium
        ? slogansEn.map((t) => t.trim()).filter(Boolean).map((text) => ({ text }))
        : undefined,
      slogans_fr: isPremium
        ? slogansFr.map((t) => t.trim()).filter(Boolean).map((text) => ({ text }))
        : undefined,
      translate_to_en: isPremium ? transEn : undefined,
      translate_to_fr: isPremium ? transFr : undefined,
      gallery: isPremium ? gallery : undefined,
      certificates: isPremium ? certs : undefined,
      video: isPremium ? video : undefined,
      opening_hours: isFestival ? null : openingHours,
      event_date_start: isFestival ? eventStart || null : null,
      event_date_end: isFestival ? eventEnd || null : null,
      nearest_bus_station_name: busStopName.trim() || null,
      nearest_bus_station_distance_m: toIntOrNull(busStopDist),
      nearest_train_station_name: trainName.trim() || null,
      nearest_train_station_distance_m: toIntOrNull(trainDist),
      submit,
      archive,
    };
  }

  async function save(
    tx: { archived: string; published: string; submitted: string; saved: string },
    submit: boolean,
    archive = false,
  ) {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    if (archive) setStatus("archiving");
    else setStatus(submit ? "submitting" : "saving");
    setFeedback(null);

    try {
      const url = isEdit
        ? `/api/listings/${listing!.id}`
        : "/api/listings/create";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(submit, archive)),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        id?: string;
        listing?: Listing;
        error?: string;
      };

      if (!res.ok || !body.ok) {
        setFeedback({ msg: body.error ?? "Error.", ok: false });
      } else {
        let successMsg: string;
        let newStatus: string;
        if (archive) {
          successMsg = tx.archived;
          newStatus = "archived";
        } else if (submit) {
          successMsg = isPublished
            ? tx.published
            : isPremium
              ? tx.published
              : tx.submitted;
          newStatus = isPublished
            ? "published"
            : isPremium
              ? "published"
              : "pending_review";
        } else {
          successMsg = tx.saved;
          newStatus = "draft";
        }
        setFeedback({ msg: successMsg, ok: true });
        const savedId =
          body.id ?? body.listing?.id ?? (isEdit ? listing!.id : undefined);
        if (savedId) onSaved?.(savedId, newStatus, body.listing);
      }
    } catch {
      setFeedback({ msg: "Network error.", ok: false });
    } finally {
      setStatus("idle");
    }
  }

  return {
    // flags
    isPremium,
    isEdit,
    isPublished,
    isFestival,
    // primitive fields
    name,
    setName,
    category,
    setCategory,
    terroir,
    setTerroir,
    address,
    setAddress,
    postalCode,
    setPostal,
    place,
    setPlace,
    insee,
    setInsee,
    phone,
    setPhone,
    website,
    setWebsite,
    location,
    setLocation,
    logoId,
    setLogoId,
    // premium fields
    descEn,
    setDescEn,
    descFr,
    setDescFr,
    slogansEn,
    setSlogansEn,
    slogansFr,
    setSlogansFr,
    transEn,
    setTransEn,
    transFr,
    setTransFr,
    gallery,
    setGallery,
    certs,
    setCerts,
    video,
    setVideo,
    // hours / event / transport
    openingHours,
    updateHour,
    eventStart,
    setEventStart,
    eventEnd,
    setEventEnd,
    busStopName,
    setBusStopName,
    busStopDist,
    setBusStopDist,
    trainName,
    setTrainName,
    trainDist,
    setTrainDist,
    // status & validation
    status,
    feedback,
    nameError,
    setNameError,
    // geocoder
    onGeoResult,
    // actions
    save,
  };
}
