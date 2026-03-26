import { useEffect, useRef, type CSSProperties } from "react";
import type { PlaceData } from "./Map";
import "./PlacePanel.css";

interface Props {
  place: PlaceData | null;
  onClose: () => void;
}

export default function PlacePanel({ place, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape key or click outside
  useEffect(() => {
    if (!place) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [place, onClose]);

  // Focus when opened
  useEffect(() => {
    if (place) panelRef.current?.focus();
  }, [place]);

  const addressLine = [place?.address, place?.townName].filter(Boolean).join(", ");

  return (
    <div
      className={`place-panel${place ? " place-panel--open" : ""}`}
      aria-label="Place details"
      inert={!place || undefined}
    >
      <div className="place-panel__inner" ref={panelRef} tabIndex={-1}>

        {/* ── Nagłówek z regionem winiarskim ── */}
        <div className="panel-region-bar">
          <span className="panel-region-bar__label">Wine Region</span>
          <button
            className="place-panel__close"
            type="button"
            aria-label="Close panel"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {place?.wineRegionName && (
          <div
            className="panel-region-bar__tag"
            style={{ "--region-color": place.wineRegionColor } as CSSProperties}
          >
            {place.wineRegionName}
          </div>
        )}

        {/* ── Etykieta miejsca ── */}
        {place && (
          <div className="place-panel__content">
            <div className="place-label">
              {place.logoUrl && (
                <div className="place-label__logo-wrap">
                  <img
                    className="place-label__logo"
                    src={place.logoUrl}
                    alt={`${place.name} logo`}
                  />
                </div>
              )}
              <h2 className="place-label__name">{place.name}</h2>
              <hr className="place-label__divider" />
              {addressLine && (
                <p className="place-label__row">{addressLine}</p>
              )}
              {place.phone && (
                <a className="place-label__row place-label__link" href={`tel:${place.phone}`}>
                  {place.phone}
                </a>
              )}
              {place.website && (
                <a
                  className="place-label__row place-label__link"
                  href={place.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {place.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
