import { useState, useRef, useCallback, useEffect } from "react";
import type { Listing, OpeningHour, DayOfWeek } from "./listingTypes";

const DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const DAY_LABELS = {
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

function defaultOpeningHours(): OpeningHour[] {
  return DAYS.map((day) => ({
    day,
    open: "09:00",
    close: "18:00",
    closed: false,
  }));
}

function mergeOpeningHours(
  saved: OpeningHour[] | null | undefined,
): OpeningHour[] {
  const base = defaultOpeningHours();
  if (!saved || !Array.isArray(saved)) return base;
  return base.map((entry) => saved.find((s) => s.day === entry.day) ?? entry);
}

// ── TimeInput — masked text field HH:MM ─────────────────────────────────────

function TimeInput({
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  // Display raw digits while typing, store as "HH:MM"
  const [raw, setRaw] = useState(value.replace(":", ""));

  // Sync if parent resets value (e.g. closed → open again)
  useEffect(() => {
    setRaw(value.replace(":", ""));
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    setRaw(digits);
    if (digits.length === 4) {
      const h = parseInt(digits.slice(0, 2), 10);
      const m = parseInt(digits.slice(2, 4), 10);
      if (h <= 23 && m <= 59) {
        onChange(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
  }

  function handleBlur() {
    // On blur: normalize whatever was typed into HH:MM
    const digits = raw.padEnd(4, "0");
    const h = Math.min(parseInt(digits.slice(0, 2), 10), 23);
    const m = Math.min(parseInt(digits.slice(2, 4), 10), 59);
    const normalized = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    setRaw(normalized.replace(":", ""));
    onChange(normalized);
  }

  // Format for display: insert colon after 2 digits
  const display = raw.length > 2 ? `${raw.slice(0, 2)}:${raw.slice(2)}` : raw;

  return (
    <input
      type="text"
      inputMode="numeric"
      className="lf-input lf-input--time"
      value={display}
      disabled={disabled}
      aria-label={ariaLabel}
      placeholder="09:00"
      maxLength={5}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={(e) => e.target.select()}
    />
  );
}

// ── DateTimeInput — datetime-local ───────────────────────────────────────────

function DateTimeInput({
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <input
      type="datetime-local"
      className="lf-input lf-input--datetime"
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      min="2000-01-01T00:00"
      max="2099-12-31T23:59"
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

interface WineRegion {
  id: string;
  region: string;
}
interface Category {
  id: string;
  name: string;
  name_fr: string | null;
}

interface Props {
  lang: "en" | "fr";
  plan: "free" | "premium";
  wineRegions: WineRegion[];
  categories: Category[];
  listing?: Listing;
  directusUrl: string;
  onSaved?: (id: string, newStatus: string, updatedListing?: Listing) => void;
  onCancel?: () => void;
}

// ── Translations ─────────────────────────────────────────────────────────────

const t = {
  en: {
    newListing: "New listing",
    editListing: "Edit listing",
    saveDraft: "Save draft",
    submitReview: "Submit for review",
    publish: "Publish listing",
    updatePublish: "Update & publish",
    archive: "Archive",
    archiving: "Archiving…",
    saving: "Saving…",
    submitting: "Publishing…",
    cancel: "Back",
    saved: "Draft saved.",
    submitted: "Submitted for review.",
    published: "Listing published.",
    archived: "Listing archived.",
    name: "Listing name",
    namePlaceholder: "Château Margaux",
    category: "Category",
    selectCategory: "Select a category",
    terroir: "Wine regions (terroir)",
    location: "Location",
    locationHint:
      "Enter your exact address. Suggestions will appear as you type; select your location from the list. Once selected, the Street Address, Postal Code, and City / Village fields will be filled automatically. You can edit them later to correct any potential inaccuracies",
    address: "Street address",
    postalCode: "Postal code",
    place: "City / Village",
    autoFilledHint: "Auto-filled after selection",
    phone: "Phone",
    phonePlaceholder: "+33 5 57 88 83 83",
    website: "Website",
    websitePlaceholder: "https://",
    logo: "Logo",
    logoHint: "JPG, PNG, SVG, Avif or WebP · max 2 MB",
    premiumSection: "Premium content",
    premiumLocked: "Upgrade to Premium to unlock these fields",
    descEn: "Description (English)",
    descFr: "Description (French)",
    translateToFr:
      "I'd like Vina Gallica to translate this description into French",
    translateToEn:
      "I'd like Vina Gallica to translate this description into English",
    gallery: "Photo gallery",
    galleryHint: "JPG, PNG, SVG, Avif or WebP · max 5 MB each",
    certificates: "Certificates & labels",
    certHint: "JPG, PNG, SVG, Avif, WebP or PDF · max 10 MB each",
    video: "Video",
    videoHint: "MP4 or WebM · max 100 MB",
    uploadBtn: "Choose file",
    uploading: "Uploading…",
    remove: "Remove",
    required: "This field is required.",
    backToListings: "← Back to listings",
    openingHours: "Opening hours",
    closed: "Closed",
    eventDates: "Event dates",
    eventDatesHint: "Visible because the selected category is a festival.",
    eventStart: "Start",
    eventEnd: "End",
    transport: "Public transport",
    busStop: "Nearest bus stop",
    trainStation: "Nearest train station",
    stopName: "Name",
    stopDistance: "Distance (m)",
  },
  fr: {
    newListing: "Nouvelle fiche",
    editListing: "Modifier la fiche",
    saveDraft: "Enregistrer le brouillon",
    submitReview: "Soumettre pour révision",
    publish: "Publier la fiche",
    updatePublish: "Mettre à jour et publier",
    archive: "Archiver",
    archiving: "Archivage…",
    saving: "Enregistrement…",
    submitting: "Publication…",
    cancel: "Retour",
    saved: "Brouillon enregistré.",
    submitted: "Soumis pour révision.",
    published: "Fiche publiée.",
    archived: "Fiche archivée.",
    name: "Nom de la fiche",
    namePlaceholder: "Château Margaux",
    category: "Catégorie",
    selectCategory: "Sélectionner une catégorie",
    terroir: "Régions viticoles (terroir)",
    location: "Localisation",
    locationHint:
      "Saisissez l'adresse exacte. Des suggestions apparaîtront ; sélectionnez alors votre emplacement. Une fois votre choix effectué, les champs Adresse, Code postal et Ville / Village se rempliront automatiquement. Vous pourrez les modifier ultérieurement pour corriger d'éventuelles inexactitudes",
    address: "Adresse",
    postalCode: "Code postal",
    place: "Ville / Village",
    autoFilledHint: "S'auto-remplit après sélection",
    phone: "Téléphone",
    phonePlaceholder: "+33 5 57 88 83 83",
    website: "Site web",
    websitePlaceholder: "https://",
    logo: "Logo",
    logoHint: "JPG, PNG, SVG, Avif or WebP · max 2 Mo",
    premiumSection: "Contenu premium",
    premiumLocked: "Passez à Premium pour débloquer ces champs",
    descEn: "Description (anglais)",
    descFr: "Description (français)",
    translateToFr:
      "Je souhaite que Vina Gallica traduise cette description en français",
    translateToEn:
      "Je souhaite que Vina Gallica traduise cette description en anglais",
    gallery: "Galerie photos",
    galleryHint: "JPG, PNG, SVG, Avif or WebP · max 5 Mo par fichier",
    certificates: "Certificats & labels",
    certHint: "JPG, PNG, SVG, Avif or WebP ou PDF · max 10 Mo par fichier",
    video: "Vidéo",
    videoHint: "MP4 ou WebM · max 100 Mo",
    uploadBtn: "Choisir un fichier",
    uploading: "Téléchargement…",
    remove: "Supprimer",
    required: "Ce champ est obligatoire.",
    backToListings: "← Retour aux fiches",
    openingHours: "Horaires d'ouverture",
    closed: "Fermé",
    eventDates: "Dates de l'événement",
    eventDatesHint: "Visible car la catégorie sélectionnée est un festival.",
    eventStart: "Début",
    eventEnd: "Fin",
    transport: "Transports en commun",
    busStop: "Arrêt de bus le plus proche",
    trainStation: "Gare la plus proche",
    stopName: "Nom",
    stopDistance: "Distance (m)",
  },
} as const;

// ── Geocoder hook ────────────────────────────────────────────────────────────

function useGeocoder(onResult: (result: GeocoderResult) => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const geocoderRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || geocoderRef.current) return;

    const token = (window as unknown as Record<string, string>)
      .__MAPBOX_TOKEN__;
    if (!token) return;

    import("@mapbox/mapbox-gl-geocoder").then(({ default: MapboxGeocoder }) => {
      const geocoder = new MapboxGeocoder({
        accessToken: token,
        types: "address,poi,place",
        countries: "fr",
        language: "fr",
        placeholder: "",
      });
      geocoder.addTo(containerRef.current!);
      geocoder.on("result", ({ result }: { result: GeocoderResult }) =>
        onResult(result),
      );
      geocoderRef.current = geocoder;
    });

    return () => {
      if (geocoderRef.current) {
        (geocoderRef.current as { onRemove: () => void }).onRemove?.();
        geocoderRef.current = null;
      }
    };
  }, [onResult]);

  return containerRef;
}

interface GeocoderResult {
  geometry: { coordinates: [number, number] };
  place_name: string;
  text: string;
  address?: string;
  context?: { id: string; text: string; short_code?: string }[];
}

function parseGeocoderResult(result: GeocoderResult) {
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

// ── File upload helper ───────────────────────────────────────────────────────

async function uploadFile(file: File, field: string): Promise<string> {
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

// ── FileUploadField ──────────────────────────────────────────────────────────

function assetUrl(directusUrl: string, id: string, params?: string) {
  return `${directusUrl}/assets/${id}${params ? `?${params}` : ""}`;
}

function FileUploadField({
  label,
  hint,
  field,
  multiple,
  fileIds,
  onChange,
  disabled,
  tx,
  directusUrl,
  accept,
  isImage,
  isVideo,
}: {
  label: string;
  hint: string;
  field: string;
  multiple: boolean;
  fileIds: string[];
  onChange: (ids: string[]) => void;
  disabled: boolean;
  tx: typeof t.en | typeof t.fr;
  directusUrl: string;
  accept: string;
  isImage: boolean;
  isVideo: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const ids = await Promise.all(
        Array.from(files).map((f) => uploadFile(f, field)),
      );
      onChange(multiple ? [...fileIds, ...ids] : ids);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`lf-file-field${disabled ? " lf-file-field--locked" : ""}`}>
      <div className="lf-label">{label}</div>
      <div className="lf-hint">{hint}</div>
      {fileIds.length > 0 && (
        <ul className="lf-file-list">
          {fileIds.map((id, i) => (
            <li
              key={id}
              className={`lf-file-item${!isImage ? " lf-file-item--icon" : ""}`}
            >
              {isImage && (
                <img
                  src={assetUrl(directusUrl, id)}
                  alt=""
                  className="lf-file-thumb"
                />
              )}
              {isVideo && <span className="lf-file-icon">🎬</span>}
              {!isImage && !isVideo && <span className="lf-file-icon">📄</span>}
              {!disabled && (
                <button
                  type="button"
                  className="lf-file-remove"
                  aria-label={tx.remove}
                  onClick={() => onChange(fileIds.filter((_, j) => j !== i))}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!disabled && (
        <>
          <button
            type="button"
            className="lf-upload-btn"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? tx.uploading : tx.uploadBtn}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            aria-label={label}
            className="lf-hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ListingForm({
  lang,
  plan,
  wineRegions,
  categories,
  listing,
  directusUrl,
  onSaved,
  onCancel,
}: Props) {
  const tx = t[lang];
  const isPremium = plan === "premium";
  const isEdit = !!listing;

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
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [descEn, setDescEn] = useState(listing?.description_en ?? "");
  const [descFr, setDescFr] = useState(listing?.description_fr ?? "");
  const [transEn, setTransEn] = useState(listing?.translate_to_en ?? false);
  const [transFr, setTransFr] = useState(listing?.translate_to_fr ?? false);
  const [gallery, setGallery] = useState<string[]>(listing?.gallery ?? []);
  const [certs, setCerts] = useState<string[]>(listing?.certificates ?? []);
  const [video, setVideo] = useState<string[]>(listing?.video ?? []);

  const [openingHours, setOpeningHours] = useState<OpeningHour[]>(
    mergeOpeningHours(listing?.opening_hours),
  );
  const [eventStart, setEventStart] = useState(listing?.event_date_start ?? "");
  const [eventEnd, setEventEnd] = useState(listing?.event_date_end ?? "");
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

  function toIntOrNull(v: string): number | null {
    const trimmed = v.trim();
    if (!trimmed) return null;
    const n = parseInt(trimmed, 10);
    return Number.isFinite(n) ? n : null;
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

  const geocoderRef = useGeocoder(onGeoResult);

  const isPublished = listing?.status === "published";

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

  async function save(submit: boolean, archive = false) {
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

  async function handleLogoUpload(files: FileList) {
    if (!files[0]) return;
    setLogoUploading(true);
    try {
      const id = await uploadFile(files[0], "logo");
      setLogoId(id);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLogoUploading(false);
    }
  }

  return (
    <div className="lf">
      {onCancel && (
        <button type="button" className="lf-back" onClick={onCancel}>
          {tx.backToListings}
        </button>
      )}
      <h2 className="lf-title">{isEdit ? tx.editListing : tx.newListing}</h2>

      {/* NAME */}
      <div className="lf-field">
        <label className="lf-label" htmlFor="lf-name">
          {tx.name} *
        </label>
        <input
          id="lf-name"
          className={`lf-input${nameError ? " lf-input--err" : ""}`}
          type="text"
          value={name}
          placeholder={tx.namePlaceholder}
          autoComplete="organization"
          onChange={(e) => {
            setName(e.target.value);
            setNameError(false);
          }}
        />
        {nameError && <span className="lf-error">{tx.required}</span>}
      </div>

      {/* CATEGORY */}
      <fieldset className="lf-fieldset">
        <legend className="lf-label">{tx.category}</legend>
        <div className="lf-bullets lf-bullets--vertical">
          {categories.map((c) => (
            <label key={c.id} className="lf-bullet lf-bullet--radio">
              <input
                type="radio"
                name="lf-category"
                value={c.id}
                checked={category === c.id}
                onChange={() => setCategory(c.id)}
              />
              <span>{lang === "fr" ? (c.name_fr ?? c.name) : c.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* TERROIR */}
      <fieldset className="lf-fieldset">
        <legend className="lf-label">{tx.terroir}</legend>
        <div className="lf-bullets">
          {wineRegions.map((r) => (
            <label key={r.id} className="lf-bullet">
              <input
                type="checkbox"
                checked={terroir.includes(r.id)}
                onChange={(e) => {
                  setTerroir((prev) =>
                    e.target.checked
                      ? [...prev, r.id]
                      : prev.filter((id) => id !== r.id),
                  );
                }}
              />
              <span>{r.region}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* LOCATION */}
      <div className="lf-field">
        <label className="lf-label">{tx.location}</label>
        <div className="lf-hint">{tx.locationHint}</div>
        <div ref={geocoderRef} className="lf-geocoder" />
        {location && (
          <div className="lf-coords">
            📍 {location.coordinates[1].toFixed(5)},{" "}
            {location.coordinates[0].toFixed(5)}
          </div>
        )}
      </div>

      {/* ADDRESS */}
      <div className="lf-field">
        <label className="lf-label" htmlFor="lf-address">
          {tx.address}
        </label>
        {!location && <div className="lf-hint">{tx.autoFilledHint}</div>}
        <input
          id="lf-address"
          className="lf-input"
          type="text"
          value={address}
          disabled={!location}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      {/* POSTAL CODE + PLACE */}
      <div className="lf-row">
        <div className="lf-field">
          <label className="lf-label" htmlFor="lf-postal">
            {tx.postalCode}
          </label>
          {!location && <div className="lf-hint">{tx.autoFilledHint}</div>}
          <input
            id="lf-postal"
            className="lf-input"
            type="text"
            value={postalCode}
            disabled={!location}
            onChange={(e) => setPostal(e.target.value)}
          />
        </div>
        <div className="lf-field lf-field--grow">
          <label className="lf-label" htmlFor="lf-place">
            {tx.place}
          </label>
          {!location && <div className="lf-hint">{tx.autoFilledHint}</div>}
          <input
            id="lf-place"
            className="lf-input"
            type="text"
            value={place}
            disabled={!location}
            onChange={(e) => setPlace(e.target.value)}
          />
        </div>
      </div>

      {/* PHONE */}
      <div className="lf-field">
        <label className="lf-label" htmlFor="lf-phone">
          {tx.phone}
        </label>
        <input
          id="lf-phone"
          className="lf-input"
          type="tel"
          value={phone}
          placeholder={tx.phonePlaceholder}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      {/* WEBSITE */}
      <div className="lf-field">
        <label className="lf-label" htmlFor="lf-website">
          {tx.website}
        </label>
        <input
          id="lf-website"
          className="lf-input"
          type="url"
          value={website}
          placeholder={tx.websitePlaceholder}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {/* LOGO */}
      <div className="lf-field">
        <label className="lf-label">{tx.logo}</label>
        <div className="lf-hint">{tx.logoHint}</div>
        {logoId && (
          <div className="lf-file-list">
            <div className="lf-file-item">
              <img
                src={assetUrl(directusUrl, logoId)}
                alt="Logo preview"
                className="lf-file-thumb lf-file-thumb--logo"
              />
              <button
                type="button"
                className="lf-file-remove"
                aria-label={tx.remove}
                onClick={() => setLogoId(null)}
              >
                ×
              </button>
            </div>
          </div>
        )}
        {!logoId && (
          <>
            <button
              type="button"
              className="lf-upload-btn"
              disabled={logoUploading}
              onClick={() => logoInputRef.current?.click()}
            >
              {logoUploading ? tx.uploading : tx.uploadBtn}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              aria-label={tx.logo}
              className="lf-hidden"
              onChange={(e) =>
                e.target.files && handleLogoUpload(e.target.files)
              }
            />
          </>
        )}
      </div>

      {/* EVENT DATES */}
      {isFestival && (
        <fieldset className="lf-fieldset">
          <legend className="lf-label">{tx.eventDates}</legend>
          <div className="lf-hint">{tx.eventDatesHint}</div>
          <div className="lf-row">
            <div className="lf-field lf-field--grow">
              <span className="lf-label">{tx.eventStart}</span>
              <DateTimeInput
                value={eventStart}
                ariaLabel={tx.eventStart}
                onChange={setEventStart}
              />
            </div>
            <div className="lf-field lf-field--grow">
              <span className="lf-label">{tx.eventEnd}</span>
              <DateTimeInput
                value={eventEnd}
                ariaLabel={tx.eventEnd}
                onChange={setEventEnd}
              />
            </div>
          </div>
        </fieldset>
      )}

      {/* PREMIUM */}
      <div
        className={`lf-premium-section${!isPremium ? " lf-premium-section--locked" : ""}`}
      >
        <div className="lf-premium-header">
          <span className="lf-premium-label">{tx.premiumSection}</span>
          {!isPremium && (
            <span className="lf-premium-lock">{tx.premiumLocked}</span>
          )}
        </div>

        <div className="lf-field">
          <label className="lf-label" htmlFor="lf-desc-en">
            {tx.descEn}
          </label>
          <textarea
            id="lf-desc-en"
            className="lf-textarea"
            rows={5}
            disabled={!isPremium}
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
          />
          <label
            className={`lf-checkbox${!isPremium ? " lf-checkbox--disabled" : ""}`}
          >
            <input
              type="checkbox"
              disabled={!isPremium}
              checked={transFr}
              onChange={(e) => setTransFr(e.target.checked)}
            />
            <span>{tx.translateToFr}</span>
          </label>
        </div>

        <div className="lf-field">
          <label className="lf-label" htmlFor="lf-desc-fr">
            {tx.descFr}
          </label>
          <textarea
            id="lf-desc-fr"
            className="lf-textarea"
            rows={5}
            disabled={!isPremium}
            value={descFr}
            onChange={(e) => setDescFr(e.target.value)}
          />
          <label
            className={`lf-checkbox${!isPremium ? " lf-checkbox--disabled" : ""}`}
          >
            <input
              type="checkbox"
              disabled={!isPremium}
              checked={transEn}
              onChange={(e) => setTransEn(e.target.checked)}
            />
            <span>{tx.translateToEn}</span>
          </label>
        </div>

        <FileUploadField
          label={tx.gallery}
          hint={tx.galleryHint}
          field="gallery"
          multiple
          disabled={!isPremium}
          fileIds={gallery}
          onChange={setGallery}
          tx={tx}
          directusUrl={directusUrl}
          accept="image/jpeg,image/png,image/webp"
          isImage
          isVideo={false}
        />
        <FileUploadField
          label={tx.certificates}
          hint={tx.certHint}
          field="certificates"
          multiple
          disabled={!isPremium}
          fileIds={certs}
          onChange={setCerts}
          tx={tx}
          directusUrl={directusUrl}
          accept="image/jpeg,image/png,image/webp,application/pdf"
          isImage={false}
          isVideo={false}
        />
        <FileUploadField
          label={tx.video}
          hint={tx.videoHint}
          field="video"
          multiple={false}
          disabled={!isPremium}
          fileIds={video}
          onChange={setVideo}
          tx={tx}
          directusUrl={directusUrl}
          accept="video/mp4,video/webm"
          isImage={false}
          isVideo
        />

        {/* OPENING HOURS */}
        {!isFestival && (
          <fieldset className="lf-fieldset">
            <legend className="lf-label">{tx.openingHours}</legend>
            <div className="lf-hours">
              {openingHours.map((h) => (
                <div
                  key={h.day}
                  className={`lf-hours-row${h.closed ? " lf-hours-row--closed" : ""}`}
                >
                  <span className="lf-hours-day">
                    {DAY_LABELS[lang][h.day]}
                  </span>
                  <TimeInput
                    value={h.open}
                    disabled={h.closed || !isPremium}
                    ariaLabel={`${DAY_LABELS[lang][h.day]} – ${tx.eventStart}`}
                    onChange={(v) => updateHour(h.day, { open: v })}
                  />
                  <span className="lf-hours-sep">–</span>
                  <TimeInput
                    value={h.close}
                    disabled={h.closed || !isPremium}
                    ariaLabel={`${DAY_LABELS[lang][h.day]} – ${tx.eventEnd}`}
                    onChange={(v) => updateHour(h.day, { close: v })}
                  />
                  <label
                    className={`lf-checkbox lf-hours-closed${!isPremium ? " lf-checkbox--disabled" : ""}`}
                  >
                    <input
                      type="checkbox"
                      disabled={!isPremium}
                      checked={h.closed}
                      onChange={(e) =>
                        updateHour(h.day, { closed: e.target.checked })
                      }
                    />
                    <span>{tx.closed}</span>
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
        )}

        {/* PUBLIC TRANSPORT */}
        <fieldset className="lf-fieldset">
          <legend className="lf-label">{tx.transport}</legend>
          <div className="lf-field">
            <div className="lf-sublabel">🚌 {tx.busStop}</div>
            <div className="lf-row">
              <div className="lf-field lf-field--grow">
                <label className="lf-label" htmlFor="lf-bus-name">
                  {tx.stopName}
                </label>
                <input
                  id="lf-bus-name"
                  className="lf-input"
                  type="text"
                  disabled={!isPremium}
                  value={busStopName}
                  onChange={(e) => setBusStopName(e.target.value)}
                />
              </div>
              <div className="lf-field">
                <label className="lf-label" htmlFor="lf-bus-dist">
                  {tx.stopDistance}
                </label>
                <input
                  id="lf-bus-dist"
                  className="lf-input"
                  type="number"
                  min="0"
                  step="1"
                  disabled={!isPremium}
                  value={busStopDist}
                  onChange={(e) => setBusStopDist(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="lf-field">
            <div className="lf-sublabel">🚆 {tx.trainStation}</div>
            <div className="lf-row">
              <div className="lf-field lf-field--grow">
                <label className="lf-label" htmlFor="lf-train-name">
                  {tx.stopName}
                </label>
                <input
                  id="lf-train-name"
                  className="lf-input"
                  type="text"
                  disabled={!isPremium}
                  value={trainName}
                  onChange={(e) => setTrainName(e.target.value)}
                />
              </div>
              <div className="lf-field">
                <label className="lf-label" htmlFor="lf-train-dist">
                  {tx.stopDistance}
                </label>
                <input
                  id="lf-train-dist"
                  className="lf-input"
                  type="number"
                  min="0"
                  step="1"
                  disabled={!isPremium}
                  value={trainDist}
                  onChange={(e) => setTrainDist(e.target.value)}
                />
              </div>
            </div>
          </div>
        </fieldset>
      </div>

      {/* ACTIONS */}
      <div className="lf-actions">
        {feedback && (
          <div
            className={`lf-feedback lf-feedback--${feedback.ok ? "ok" : "err"}`}
          >
            {feedback.msg}
          </div>
        )}
        <div className="lf-actions-btns">
          {onCancel && (
            <button
              type="button"
              className="lf-btn lf-btn--ghost"
              onClick={onCancel}
            >
              {tx.cancel}
            </button>
          )}
          {isPublished ? (
            <>
              <button
                type="button"
                className="lf-btn lf-btn--danger"
                disabled={status !== "idle"}
                onClick={() => save(false, true)}
              >
                {status === "archiving" ? tx.archiving : tx.archive}
              </button>
              <button
                type="button"
                className="lf-btn lf-btn--primary"
                disabled={status !== "idle"}
                onClick={() => save(true)}
              >
                {status === "submitting" ? tx.submitting : tx.updatePublish}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="lf-btn lf-btn--secondary"
                disabled={status !== "idle"}
                onClick={() => save(false)}
              >
                {status === "saving" ? tx.saving : tx.saveDraft}
              </button>
              <button
                type="button"
                className="lf-btn lf-btn--primary"
                disabled={status !== "idle"}
                onClick={() => save(true)}
              >
                {status === "submitting"
                  ? tx.submitting
                  : isPremium
                    ? tx.publish
                    : tx.submitReview}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
