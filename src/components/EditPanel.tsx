import { useState } from "react";
import DatePicker from "./DatePicker";
import { useGeocoder, type WineRegion, type Category } from "./useListingState";
import {
  EditModal,
  type ListingState,
  type ModalKind,
  type Lang,
  type Tx,
  type ViewModel,
} from "./editorShared";
import "./EditPanel.css";

interface Props {
  lang: Lang;
  tx: Tx;
  s: ListingState;
  vm: ViewModel;
  wineRegions: WineRegion[];
  categories: Category[];
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
  wineRegions,
  categories,
}: Props) {
  const [modal, setModal] = useState<ModalKind>(null);
  const [nameDraft, setNameDraft] = useState(s.name);
  const [websiteDraft, setWebsiteDraft] = useState(s.website);

  // Geocoder lives inside the location modal — only mount it while open.
  const geocoderRef = useGeocoder(s.onGeoResult, modal === "location");

  const regionsValue =
    vm.selectedRegions.length > 0
      ? vm.selectedRegions.map((r) => r.region).join(", ")
      : null;

  return (
    <div className="ep">
      <h3 className="ep-title">{tx.editFields}</h3>

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
      </div>

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
    </div>
  );
}
