import { useState, useRef, useCallback, useEffect } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

interface WineRegion { id: string; region: string; }
interface Category   { id: string; name: string; name_fr: string | null; }

interface Listing {
  id: string;
  Name: string;
  status: string;
  category: { id: string } | null;
  terroir: { wine_regions_id: { id: string; region: string } }[];
  address: string | null;
  postal_code: string | null;
  place: string | null;
  phone: string | null;
  website: string | null;
  location: { type: "Point"; coordinates: [number, number] } | null;
  logo: string | null;
  description_en: string | null;
  description_fr: string | null;
  translate_to_en: boolean;
  translate_to_fr: boolean;
  gallery: string[] | null;
  certificates: string[] | null;
  video: string[] | null;
}

interface Props {
  lang: "en" | "fr";
  plan: "free" | "premium";
  wineRegions: WineRegion[];
  categories: Category[];
  listing?: Listing;       // jeśli podane → tryb edycji
  onSaved?: (id: string) => void;
  onCancel?: () => void;
}

// ── Translations ─────────────────────────────────────────────────────────────

const t = {
  en: {
    newListing:     "New listing",
    editListing:    "Edit listing",
    saveDraft:      "Save draft",
    submitReview:   "Submit for review",
    saving:         "Saving…",
    submitting:     "Submitting…",
    cancel:         "Cancel",
    saved:          "Draft saved.",
    submitted:      "Submitted for review.",
    name:           "Listing name",
    namePlaceholder:"Château Margaux",
    category:       "Category",
    selectCategory: "Select a category",
    terroir:        "Wine regions (terroir)",
    location:       "Location",
    locationHint:   "Search an address — fields will be filled automatically",
    address:        "Street address",
    postalCode:     "Postal code",
    place:          "City / Village",
    phone:          "Phone",
    phonePlaceholder:"+33 5 57 88 83 83",
    website:        "Website",
    websitePlaceholder:"https://",
    logo:           "Logo",
    logoHint:       "JPG, PNG or WebP · max 2 MB",
    premiumSection: "Premium content",
    premiumLocked:  "Upgrade to Premium to unlock these fields",
    descEn:         "Description (English)",
    descFr:         "Description (French)",
    translateToFr:  "I'd like Vina Gallica to translate this description into French",
    translateToEn:  "I'd like Vina Gallica to translate this description into English",
    gallery:        "Photo gallery",
    galleryHint:    "JPG, PNG or WebP · max 5 MB each",
    certificates:   "Certificates & labels",
    certHint:       "JPG, PNG, WebP or PDF · max 10 MB each",
    video:          "Video",
    videoHint:      "MP4 or WebM · max 100 MB",
    uploadBtn:      "Choose file",
    uploading:      "Uploading…",
    remove:         "Remove",
    required:       "This field is required.",
  },
  fr: {
    newListing:     "Nouvelle fiche",
    editListing:    "Modifier la fiche",
    saveDraft:      "Enregistrer le brouillon",
    submitReview:   "Soumettre pour révision",
    saving:         "Enregistrement…",
    submitting:     "Envoi…",
    cancel:         "Annuler",
    saved:          "Brouillon enregistré.",
    submitted:      "Soumis pour révision.",
    name:           "Nom de la fiche",
    namePlaceholder:"Château Margaux",
    category:       "Catégorie",
    selectCategory: "Sélectionner une catégorie",
    terroir:        "Régions viticoles (terroir)",
    location:       "Localisation",
    locationHint:   "Recherchez une adresse — les champs seront remplis automatiquement",
    address:        "Adresse",
    postalCode:     "Code postal",
    place:          "Ville / Village",
    phone:          "Téléphone",
    phonePlaceholder:"+33 5 57 88 83 83",
    website:        "Site web",
    websitePlaceholder:"https://",
    logo:           "Logo",
    logoHint:       "JPG, PNG ou WebP · max 2 Mo",
    premiumSection: "Contenu premium",
    premiumLocked:  "Passez à Premium pour débloquer ces champs",
    descEn:         "Description (anglais)",
    descFr:         "Description (français)",
    translateToFr:  "Je souhaite que Vina Gallica traduise cette description en français",
    translateToEn:  "Je souhaite que Vina Gallica traduise cette description en anglais",
    gallery:        "Galerie photos",
    galleryHint:    "JPG, PNG ou WebP · max 5 Mo par fichier",
    certificates:   "Certificats & labels",
    certHint:       "JPG, PNG, WebP ou PDF · max 10 Mo par fichier",
    video:          "Vidéo",
    videoHint:      "MP4 ou WebM · max 100 Mo",
    uploadBtn:      "Choisir un fichier",
    uploading:      "Téléchargement…",
    remove:         "Supprimer",
    required:       "Ce champ est obligatoire.",
  },
} as const;

// ── Geocoder hook ────────────────────────────────────────────────────────────

function useGeocoder(onResult: (result: GeocoderResult) => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const geocoderRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || geocoderRef.current) return;

    const token = (window as unknown as Record<string, string>).__MAPBOX_TOKEN__;
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
      geocoder.on("result", ({ result }: { result: GeocoderResult }) => onResult(result));
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
  context?: { id: string; text: string }[];
}

function parseGeocoderResult(result: GeocoderResult) {
  const ctx = result.context ?? [];
  const postcode = ctx.find(c => c.id.startsWith("postcode"))?.text ?? "";
  const place    = ctx.find(c => c.id.startsWith("place"))?.text
                ?? ctx.find(c => c.id.startsWith("locality"))?.text
                ?? result.text;

  const streetNumber = result.address ?? "";
  const streetName   = result.text ?? "";
  const address = streetNumber ? `${streetNumber} ${streetName}` : streetName;

  return {
    address,
    postal_code: postcode,
    place,
    location: { type: "Point" as const, coordinates: result.geometry.coordinates },
  };
}

// ── File upload helper ───────────────────────────────────────────────────────

async function uploadFile(file: File, field: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("field", field);
  const res = await fetch("/api/listings/upload", { method: "POST", body: fd });
  const body = await res.json() as { ok?: boolean; fileId?: string; error?: string };
  if (!res.ok || !body.fileId) throw new Error(body.error ?? "Upload failed.");
  return body.fileId;
}

// ── FileUploadField ──────────────────────────────────────────────────────────

function FileUploadField({
  label, hint, field, multiple, fileIds, onChange, disabled, tx,
}: {
  label: string; hint: string; field: string; multiple: boolean;
  fileIds: string[]; onChange: (ids: string[]) => void;
  disabled: boolean; tx: typeof t.en | typeof t.fr;
}) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const ids = await Promise.all(Array.from(files).map(f => uploadFile(f, field)));
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
            <li key={id} className="lf-file-item">
              <span className="lf-file-id">{id.slice(0, 8)}…</span>
              {!disabled && (
                <button
                  type="button"
                  className="lf-file-remove"
                  onClick={() => onChange(fileIds.filter((_, j) => j !== i))}
                >{tx.remove}</button>
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
          >{uploading ? tx.uploading : tx.uploadBtn}</button>
          <input
            ref={inputRef}
            type="file"
            multiple={multiple}
            aria-label={label}
            style={{ display: "none" }}
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
        </>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ListingForm({ lang, plan, wineRegions, categories, listing, onSaved, onCancel }: Props) {
  const tx = t[lang];
  const isPremium = plan === "premium";
  const isEdit = !!listing;

  const [name, setName]           = useState(listing?.Name ?? "");
  const [category, setCategory]   = useState(listing?.category?.id ?? "");
  const [terroir, setTerroir]     = useState<string[]>(
    listing?.terroir?.map(t => t.wine_regions_id.id) ?? []
  );
  const [address, setAddress]     = useState(listing?.address ?? "");
  const [postalCode, setPostal]   = useState(listing?.postal_code ?? "");
  const [place, setPlace]         = useState(listing?.place ?? "");
  const [phone, setPhone]         = useState(listing?.phone ?? "");
  const [website, setWebsite]     = useState(listing?.website ?? "");
  const [location, setLocation]   = useState<{ type: "Point"; coordinates: [number, number] } | null>(
    listing?.location ?? null
  );
  const [logoId, setLogoId]       = useState<string | null>(listing?.logo ?? null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Premium fields
  const [descEn, setDescEn]       = useState(listing?.description_en ?? "");
  const [descFr, setDescFr]       = useState(listing?.description_fr ?? "");
  const [transEn, setTransEn]     = useState(listing?.translate_to_en ?? false);
  const [transFr, setTransFr]     = useState(listing?.translate_to_fr ?? false);
  const [gallery, setGallery]     = useState<string[]>(listing?.gallery ?? []);
  const [certs, setCerts]         = useState<string[]>(listing?.certificates ?? []);
  const [video, setVideo]         = useState<string[]>(listing?.video ?? []);

  const [status, setStatus]       = useState<"idle" | "saving" | "submitting">("idle");
  const [feedback, setFeedback]   = useState<{ msg: string; ok: boolean } | null>(null);
  const [nameError, setNameError] = useState(false);

  const onGeoResult = useCallback((result: GeocoderResult) => {
    const parsed = parseGeocoderResult(result);
    setAddress(parsed.address);
    setPostal(parsed.postal_code);
    setPlace(parsed.place);
    setLocation(parsed.location);
  }, []);

  const geocoderRef = useGeocoder(onGeoResult);

  function buildPayload(submit: boolean) {
    return {
      Name: name,
      category: category || null,
      terroir,
      address,
      postal_code: postalCode,
      place,
      phone,
      website,
      location,
      logo: logoId,
      description_en: isPremium ? descEn : undefined,
      description_fr: isPremium ? descFr : undefined,
      translate_to_en: isPremium ? transEn : undefined,
      translate_to_fr: isPremium ? transFr : undefined,
      gallery:         isPremium ? gallery : undefined,
      certificates:    isPremium ? certs   : undefined,
      video:           isPremium ? video   : undefined,
      submit,
    };
  }

  async function save(submit: boolean) {
    if (!name.trim()) { setNameError(true); return; }
    setNameError(false);
    setStatus(submit ? "submitting" : "saving");
    setFeedback(null);

    try {
      const url = isEdit ? `/api/listings/${listing!.id}` : "/api/listings/create";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(submit)),
      });
      const body = await res.json() as { ok?: boolean; id?: string; error?: string };

      if (!res.ok || !body.ok) {
        setFeedback({ msg: body.error ?? "Error.", ok: false });
      } else {
        setFeedback({ msg: submit ? tx.submitted : tx.saved, ok: true });
        if (body.id) onSaved?.(body.id);
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
      <h2 className="lf-title">{isEdit ? tx.editListing : tx.newListing}</h2>

      {feedback && (
        <div className={`lf-feedback lf-feedback--${feedback.ok ? "ok" : "err"}`}>
          {feedback.msg}
        </div>
      )}

      {/* NAME */}
      <div className="lf-field">
        <label className="lf-label" htmlFor="lf-name">{tx.name} *</label>
        <input
          id="lf-name"
          className={`lf-input${nameError ? " lf-input--err" : ""}`}
          type="text"
          value={name}
          placeholder={tx.namePlaceholder}
          autoComplete="organization"
          onChange={e => { setName(e.target.value); setNameError(false); }}
        />
        {nameError && <span className="lf-error">{tx.required}</span>}
      </div>

      {/* CATEGORY */}
      <fieldset className="lf-fieldset">
        <legend className="lf-label">{tx.category}</legend>
        <div className="lf-bullets lf-bullets--vertical">
          {categories.map(c => (
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
          {wineRegions.map(r => (
            <label key={r.id} className="lf-bullet">
              <input
                type="checkbox"
                checked={terroir.includes(r.id)}
                onChange={e => {
                  setTerroir(prev =>
                    e.target.checked ? [...prev, r.id] : prev.filter(id => id !== r.id)
                  );
                }}
              />
              <span>{r.region}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* LOCATION (Geocoder) */}
      <div className="lf-field">
        <label className="lf-label">{tx.location}</label>
        <div className="lf-hint">{tx.locationHint}</div>
        <div ref={geocoderRef} className="lf-geocoder" />
        {location && (
          <div className="lf-coords">
            📍 {location.coordinates[1].toFixed(5)}, {location.coordinates[0].toFixed(5)}
          </div>
        )}
      </div>

      {/* ADDRESS */}
      <div className="lf-field">
        <label className="lf-label" htmlFor="lf-address">{tx.address}</label>
        <input id="lf-address" className="lf-input" type="text" value={address}
          onChange={e => setAddress(e.target.value)} />
      </div>

      {/* POSTAL CODE + PLACE (row) */}
      <div className="lf-row">
        <div className="lf-field">
          <label className="lf-label" htmlFor="lf-postal">{tx.postalCode}</label>
          <input id="lf-postal" className="lf-input" type="text" value={postalCode}
            onChange={e => setPostal(e.target.value)} />
        </div>
        <div className="lf-field lf-field--grow">
          <label className="lf-label" htmlFor="lf-place">{tx.place}</label>
          <input id="lf-place" className="lf-input" type="text" value={place}
            onChange={e => setPlace(e.target.value)} />
        </div>
      </div>

      {/* PHONE */}
      <div className="lf-field">
        <label className="lf-label" htmlFor="lf-phone">{tx.phone}</label>
        <input id="lf-phone" className="lf-input" type="tel" value={phone}
          placeholder={tx.phonePlaceholder}
          onChange={e => setPhone(e.target.value)} />
      </div>

      {/* WEBSITE */}
      <div className="lf-field">
        <label className="lf-label" htmlFor="lf-website">{tx.website}</label>
        <input id="lf-website" className="lf-input" type="url" value={website}
          placeholder={tx.websitePlaceholder}
          onChange={e => setWebsite(e.target.value)} />
      </div>

      {/* LOGO */}
      <div className="lf-field">
        <label className="lf-label">{tx.logo}</label>
        <div className="lf-hint">{tx.logoHint}</div>
        {logoId && (
          <div className="lf-file-item">
            <span className="lf-file-id">{logoId.slice(0, 8)}…</span>
            <button type="button" className="lf-file-remove" onClick={() => setLogoId(null)}>
              {tx.remove}
            </button>
          </div>
        )}
        {!logoId && (
          <>
            <button type="button" className="lf-upload-btn" disabled={logoUploading}
              onClick={() => logoInputRef.current?.click()}>
              {logoUploading ? tx.uploading : tx.uploadBtn}
            </button>
            <input ref={logoInputRef} type="file" accept="image/*" aria-label={tx.logo}
              style={{ display: "none" }}
              onChange={e => e.target.files && handleLogoUpload(e.target.files)} />
          </>
        )}
      </div>

      {/* ── PREMIUM SECTION ── */}
      <div className={`lf-premium-section${!isPremium ? " lf-premium-section--locked" : ""}`}>
        <div className="lf-premium-header">
          <span className="lf-premium-label">{tx.premiumSection}</span>
          {!isPremium && <span className="lf-premium-lock">{tx.premiumLocked}</span>}
        </div>

        {/* DESCRIPTION EN */}
        <div className="lf-field">
          <label className="lf-label" htmlFor="lf-desc-en">{tx.descEn}</label>
          <textarea id="lf-desc-en" className="lf-textarea" rows={5}
            disabled={!isPremium} value={descEn}
            onChange={e => setDescEn(e.target.value)} />
          <label className={`lf-checkbox${!isPremium ? " lf-checkbox--disabled" : ""}`}>
            <input type="checkbox" disabled={!isPremium} checked={transFr}
              onChange={e => setTransFr(e.target.checked)} />
            <span>{tx.translateToFr}</span>
          </label>
        </div>

        {/* DESCRIPTION FR */}
        <div className="lf-field">
          <label className="lf-label" htmlFor="lf-desc-fr">{tx.descFr}</label>
          <textarea id="lf-desc-fr" className="lf-textarea" rows={5}
            disabled={!isPremium} value={descFr}
            onChange={e => setDescFr(e.target.value)} />
          <label className={`lf-checkbox${!isPremium ? " lf-checkbox--disabled" : ""}`}>
            <input type="checkbox" disabled={!isPremium} checked={transEn}
              onChange={e => setTransEn(e.target.checked)} />
            <span>{tx.translateToEn}</span>
          </label>
        </div>

        {/* GALLERY */}
        <FileUploadField label={tx.gallery} hint={tx.galleryHint} field="gallery"
          multiple disabled={!isPremium} fileIds={gallery} onChange={setGallery} tx={tx} />

        {/* CERTIFICATES */}
        <FileUploadField label={tx.certificates} hint={tx.certHint} field="certificates"
          multiple disabled={!isPremium} fileIds={certs} onChange={setCerts} tx={tx} />

        {/* VIDEO */}
        <FileUploadField label={tx.video} hint={tx.videoHint} field="video"
          multiple={false} disabled={!isPremium} fileIds={video} onChange={setVideo} tx={tx} />
      </div>

      {/* ACTIONS */}
      <div className="lf-actions">
        {onCancel && (
          <button type="button" className="lf-btn lf-btn--ghost" onClick={onCancel}>
            {tx.cancel}
          </button>
        )}
        <button type="button" className="lf-btn lf-btn--secondary"
          disabled={status !== "idle"}
          onClick={() => save(false)}>
          {status === "saving" ? tx.saving : tx.saveDraft}
        </button>
        <button type="button" className="lf-btn lf-btn--primary"
          disabled={status !== "idle"}
          onClick={() => save(true)}>
          {status === "submitting" ? tx.submitting : tx.submitReview}
        </button>
      </div>
    </div>
  );
}
