import { useEffect, useState } from "react";
import DatePicker from "./DatePicker";
import {
  useGeocoder,
  uploadFile,
  assetUrl,
  DAYS,
  DAY_LABELS,
  type WineRegion,
  type Category,
} from "./useListingState";
import {
  EditModal,
  type ListingState,
  type ModalKind,
  type Lang,
  type Tx,
  type ViewModel,
} from "./editorShared";
import "./EditPanel.css";

export type PreviewKind = "card" | "popup" | "panel";

interface Props {
  lang: Lang;
  tx: Tx;
  s: ListingState;
  vm: ViewModel;
  plan: "free" | "premium";
  directusUrl: string;
  wineRegions: WineRegion[];
  categories: Category[];
  /** Shown under the panel title, above the fields. */
  intro?: string;
  /** Opens the matching live preview in a modal owned by the parent. */
  onOpenPreview?: (kind: PreviewKind) => void;
}

// ── TimeInput — masked HH:MM field (ported from ListingForm) ────────────────
function TimeInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel?: string;
}) {
  const [raw, setRaw] = useState(value.replace(":", ""));
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
    const digits = raw.padEnd(4, "0");
    const h = Math.min(parseInt(digits.slice(0, 2), 10), 23);
    const m = Math.min(parseInt(digits.slice(2, 4), 10), 59);
    const normalized = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    setRaw(normalized.replace(":", ""));
    onChange(normalized);
  }
  const display = raw.length > 2 ? `${raw.slice(0, 2)}:${raw.slice(2)}` : raw;

  return (
    <input
      type="text"
      inputMode="numeric"
      className="ep-time-input"
      value={display}
      aria-label={ariaLabel}
      placeholder="09:00"
      maxLength={5}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={(e) => e.target.select()}
    />
  );
}

// One row in the edit panel: field name + current status + opens its modal.
function FieldButton({
  label,
  value,
  notSet,
  onClick,
  error,
}: {
  label: string;
  value: string | null;
  notSet: string;
  onClick: () => void;
  error?: boolean;
}) {
  return (
    <button
      type="button"
      className={`ep-field${error ? " ep-field--error" : ""}`}
      onClick={onClick}
    >
      <span className="ep-field__label">{label}</span>
      <span
        className={`ep-field__value${value ? "" : " ep-field__value--empty"}`}
      >
        {value || notSet}
      </span>
    </button>
  );
}

export default function EditPanel({
  lang,
  tx,
  s,
  vm,
  plan,
  directusUrl,
  wineRegions,
  categories,
  intro,
  onOpenPreview,
}: Props) {
  const isPremium = plan === "premium";
  const [modal, setModal] = useState<ModalKind>(null);
  const [nameDraft, setNameDraft] = useState(s.name);
  const [websiteDraft, setWebsiteDraft] = useState(s.website);
  const [phoneDraft, setPhoneDraft] = useState(s.phone);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Geocoder lives inside the location modal — only mount it while open.
  const geocoderRef = useGeocoder(s.onGeoResult, modal === "location");

  const regionsValue =
    vm.selectedRegions.length > 0
      ? vm.selectedRegions.map((r) => r.region).join(", ")
      : null;

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setLogoUploading(true);
    try {
      const id = await uploadFile(file, "logo");
      s.setLogoId(id);
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLogoUploading(false);
    }
  }

  // Slogan helpers — edit up to 3 slots by index (blanks kept in place;
  // buildPayload trims empties on save).
  function setSloganAt(which: "en" | "fr", i: number, val: string) {
    const cur = which === "en" ? s.slogansEn : s.slogansFr;
    const next = [cur[0] ?? "", cur[1] ?? "", cur[2] ?? ""];
    next[i] = val;
    (which === "en" ? s.setSlogansEn : s.setSlogansFr)(next);
  }

  return (
    <div className="ep">
      <h3 className="ep-title">{tx.editFields}</h3>
      {intro && <p className="ep-intro">{intro}</p>}

      <div className="ep-fields">
        <FieldButton
          label={tx.category}
          value={vm.categoryLabel}
          notSet={tx.notSet}
          onClick={() => setModal("category")}
        />
        <FieldButton
          label={tx.name}
          value={s.name || null}
          notSet={tx.notSet}
          error={s.nameError}
          onClick={() => {
            setNameDraft(s.name);
            setModal("name");
          }}
        />
        <FieldButton
          label={tx.terroir}
          value={regionsValue}
          notSet={tx.notSet}
          onClick={() => setModal("terroir")}
        />
        <FieldButton
          label={tx.location}
          value={s.address || null}
          notSet={tx.notSet}
          onClick={() => setModal("location")}
        />
        <FieldButton
          label={tx.website}
          value={s.website ? s.website.replace(/^https?:\/\//, "") : null}
          notSet={tx.notSet}
          onClick={() => {
            setWebsiteDraft(s.website);
            setModal("website");
          }}
        />
        {s.isFestival && (
          <FieldButton
            label={tx.eventDates}
            value={vm.eventLabel || null}
            notSet={tx.notSet}
            onClick={() => setModal("dates")}
          />
        )}

        {isPremium && (
          <>
            <FieldButton
              label={tx.logo}
              value={s.logoId ? tx.logoSet : null}
              notSet={tx.notSet}
              onClick={() => setModal("logo")}
            />
            <FieldButton
              label={tx.phone}
              value={s.phone || null}
              notSet={tx.notSet}
              onClick={() => {
                setPhoneDraft(s.phone);
                setModal("phone");
              }}
            />
            {!s.isFestival && (
              <FieldButton
                label={tx.hours}
                value={
                  s.openingHours.some((h) => !h.closed && h.open)
                    ? s.openingHours.filter((h) => !h.closed && h.open).length +
                      "/7"
                    : null
                }
                notSet={tx.notSet}
                onClick={() => setModal("hours")}
              />
            )}
            <FieldButton
              label={tx.slogansEn}
              value={
                s.slogansEn.filter((x) => x.trim()).length > 0
                  ? tx.slogansCount(s.slogansEn.filter((x) => x.trim()).length)
                  : null
              }
              notSet={tx.notSet}
              onClick={() => setModal("slogansEn")}
            />
            <FieldButton
              label={tx.slogansFr}
              value={
                s.slogansFr.filter((x) => x.trim()).length > 0
                  ? tx.slogansCount(s.slogansFr.filter((x) => x.trim()).length)
                  : null
              }
              notSet={tx.notSet}
              onClick={() => setModal("slogansFr")}
            />
          </>
        )}
      </div>

      {/* ── Live preview launchers — the previews themselves live in modals
             so they never compete with the fields for space. ── */}
      {onOpenPreview && (
        <div className="ep-previews">
          <div className="ep-previews-head">
            <h4 className="ep-previews-title">{tx.previewsTitle}</h4>
            <p className="ep-previews-hint">{tx.previewsHint}</p>
          </div>
          <div className="ep-previews-btns">
            <button
              type="button"
              className="ep-preview-btn"
              onClick={() => onOpenPreview("card")}
            >
              {tx.sectionCard}
            </button>
            <button
              type="button"
              className="ep-preview-btn"
              onClick={() => onOpenPreview("popup")}
            >
              {tx.sectionPopup}
            </button>
            <button
              type="button"
              className="ep-preview-btn"
              onClick={() => onOpenPreview("panel")}
            >
              {tx.sectionPanel}
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {modal === "category" && (
        <EditModal
          title={tx.category}
          onClose={() => setModal(null)}
          doneLabel={tx.done}
        >
          <div className="ec-radio-list">
            {categories.map((c) => (
              <label key={c.id} className="ec-radio">
                <input
                  type="radio"
                  name="ec-category"
                  value={c.id}
                  checked={s.category === c.id}
                  onChange={() => {
                    s.setCategory(c.id);
                    setModal(null);
                  }}
                />
                <span>{lang === "fr" ? (c.name_fr ?? c.name) : c.name}</span>
              </label>
            ))}
          </div>
        </EditModal>
      )}

      {modal === "name" && (
        <EditModal
          title={tx.name}
          onClose={() => setModal(null)}
          doneLabel={tx.done}
        >
          <input
            type="text"
            className="ec-modal-input"
            autoFocus
            value={nameDraft}
            placeholder={tx.namePlaceholder}
            aria-label={tx.name}
            onChange={(e) => {
              setNameDraft(e.target.value);
              s.setNameError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                s.setName(nameDraft.trim());
                setModal(null);
              }
            }}
            onBlur={() => s.setName(nameDraft.trim())}
          />
        </EditModal>
      )}

      {modal === "website" && (
        <EditModal
          title={tx.website}
          onClose={() => {
            s.setWebsite(websiteDraft.trim());
            setModal(null);
          }}
          doneLabel={tx.done}
        >
          <input
            type="url"
            className="ec-modal-input"
            autoFocus
            value={websiteDraft}
            placeholder={tx.websitePlaceholder}
            aria-label={tx.website}
            onChange={(e) => setWebsiteDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                s.setWebsite(websiteDraft.trim());
                setModal(null);
              }
            }}
          />
        </EditModal>
      )}

      {modal === "terroir" && (
        <EditModal
          title={tx.terroir}
          onClose={() => setModal(null)}
          doneLabel={tx.done}
        >
          <div className="ec-check-list ec-check-list--two-col">
            {wineRegions.map((r) => (
              <label key={r.id} className="ec-check">
                <input
                  type="checkbox"
                  checked={s.terroir.includes(r.id)}
                  onChange={(e) =>
                    s.setTerroir((prev) =>
                      e.target.checked
                        ? [...prev, r.id]
                        : prev.filter((id) => id !== r.id),
                    )
                  }
                />
                <span>{r.region}</span>
              </label>
            ))}
          </div>
        </EditModal>
      )}

      {modal === "location" && (
        <EditModal
          title={tx.location}
          hint={tx.locationHint}
          onClose={() => setModal(null)}
          doneLabel={tx.done}
        >
          <div ref={geocoderRef} className="ec-geocoder" />
          {s.location && (
            <div className="ec-coords">
              📍 {s.location.coordinates[1].toFixed(5)},{" "}
              {s.location.coordinates[0].toFixed(5)}
            </div>
          )}
        </EditModal>
      )}

      {modal === "dates" && (
        <EditModal
          title={tx.eventDates}
          hint={tx.eventDatesHint}
          onClose={() => setModal(null)}
          doneLabel={tx.done}
          variant="dates"
        >
          <div className="ec-dates-row">
            <div className="ec-date-field">
              <span className="ec-date-label">{tx.eventStart}</span>
              <DatePicker
                value={s.eventStart}
                ariaLabel={tx.eventStart}
                lang={lang}
                onChange={(v) => {
                  s.setEventStart(v);
                  if (v && s.eventEnd && s.eventEnd < v) s.setEventEnd(v);
                }}
              />
            </div>
            <div className="ec-date-field">
              <span className="ec-date-label">{tx.eventEnd}</span>
              <DatePicker
                value={s.eventEnd}
                ariaLabel={tx.eventEnd}
                lang={lang}
                min={s.eventStart || undefined}
                onChange={s.setEventEnd}
              />
            </div>
          </div>
        </EditModal>
      )}

      {modal === "logo" && (
        <EditModal
          title={tx.logo}
          hint={tx.logoHint}
          onClose={() => setModal(null)}
          doneLabel={tx.done}
        >
          {s.logoId && (
            <div className="ep-logo-preview">
              <img
                src={assetUrl(directusUrl, s.logoId, "width=240&format=webp")}
                alt="Logo"
              />
              <button
                type="button"
                className="lf-btn lf-btn--ghost"
                onClick={() => s.setLogoId(null)}
              >
                {tx.logoRemove}
              </button>
            </div>
          )}
          {!s.logoId && (
            <label className="ep-file">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoFile}
                disabled={logoUploading}
              />
              {logoUploading && <span>{tx.logoUploading}</span>}
            </label>
          )}
          {logoError && <div className="ec-error">{logoError}</div>}
        </EditModal>
      )}

      {modal === "phone" && (
        <EditModal
          title={tx.phone}
          onClose={() => {
            s.setPhone(phoneDraft.trim());
            setModal(null);
          }}
          doneLabel={tx.done}
        >
          <input
            type="tel"
            className="ec-modal-input"
            autoFocus
            value={phoneDraft}
            placeholder={tx.phonePlaceholder}
            aria-label={tx.phone}
            onChange={(e) => setPhoneDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                s.setPhone(phoneDraft.trim());
                setModal(null);
              }
            }}
          />
        </EditModal>
      )}

      {modal === "hours" && (
        <EditModal
          title={tx.hours}
          onClose={() => setModal(null)}
          doneLabel={tx.done}
        >
          <div className="ep-hours">
            {DAYS.map((day) => {
              const h = s.openingHours.find((x) => x.day === day);
              const closed = h?.closed ?? false;
              return (
                <div key={day} className="ep-hours-row">
                  <span className="ep-hours-day">{DAY_LABELS[lang][day]}</span>
                  {closed ? (
                    <span className="ep-hours-closed">{tx.hoursClosed}</span>
                  ) : (
                    <span className="ep-hours-times">
                      <TimeInput
                        value={h?.open ?? ""}
                        ariaLabel={`${DAY_LABELS[lang][day]} open`}
                        onChange={(v) => s.updateHour(day, { open: v })}
                      />
                      <span>–</span>
                      <TimeInput
                        value={h?.close ?? ""}
                        ariaLabel={`${DAY_LABELS[lang][day]} close`}
                        onChange={(v) => s.updateHour(day, { close: v })}
                      />
                    </span>
                  )}
                  <label className="ep-hours-closed-toggle">
                    <input
                      type="checkbox"
                      checked={closed}
                      onChange={(e) =>
                        s.updateHour(day, { closed: e.target.checked })
                      }
                    />
                    <span>{tx.hoursClosed}</span>
                  </label>
                </div>
              );
            })}
          </div>
        </EditModal>
      )}

      {(modal === "slogansEn" || modal === "slogansFr") && (
        <EditModal
          title={modal === "slogansEn" ? tx.slogansEn : tx.slogansFr}
          hint={tx.slogansHint}
          onClose={() => setModal(null)}
          doneLabel={tx.done}
        >
          <div className="ep-slogans">
            {[0, 1, 2].map((i) => {
              const which = modal === "slogansEn" ? "en" : "fr";
              const arr = which === "en" ? s.slogansEn : s.slogansFr;
              return (
                <input
                  key={i}
                  type="text"
                  className="ec-modal-input"
                  value={arr[i] ?? ""}
                  placeholder={`${tx.sloganPlaceholder} ${i + 1}`}
                  aria-label={`${tx.sloganPlaceholder} ${i + 1}`}
                  onChange={(e) => setSloganAt(which, i, e.target.value)}
                />
              );
            })}
          </div>
        </EditModal>
      )}
    </div>
  );
}
