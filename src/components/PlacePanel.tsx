import { useEffect, useLayoutEffect, useRef, type CSSProperties } from "react";
import type { PlaceData } from "./Map";
import "./PlacePanel.css";

interface Props {
  place: PlaceData | null;
  onClose: () => void;
}

export default function PlacePanel({ place, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const prevPlaceRef = useRef<PlaceData | null>(null);

  // Close on Escape key or click outside
  useEffect(() => {
    if (!place) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Element;
      if (target.closest(".map-popup__open-btn")) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
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

  // Focus only on first open (not when switching between places)
  // Preserve scroll position when switching between places
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const isFirstOpen = place !== null && prevPlaceRef.current === null;
    const scrollTop = isFirstOpen ? 0 : panel.scrollTop;
    prevPlaceRef.current = place;
    if (isFirstOpen) {
      panel.focus();
      panel.scrollTop = 0;
    } else {
      panel.scrollTop = scrollTop;
    }
  }, [place]);

  const cityLine = [place?.postalCode, place?.townName].filter(Boolean).join(" ");

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

        {/* ── Kategoria ── */}
        {place?.categoryName && (
          <div className="panel-category">
            <span
              className="map-popup__category"
              style={{ backgroundColor: place.categoryColor || "#888" } as CSSProperties}
            >
              {place.categoryName}
            </span>
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
              {place.address && (
                <p className="place-label__row">{place.address}</p>
              )}
              {cityLine && (
                <p className="place-label__row">{cityLine}</p>
              )}
              {(place.deptName || place.adminRegionName) && (
                <div className="panel-location">
                  {place.deptName && (
                    <div
                      className="panel-location__block"
                      style={{ "--loc-color": place.deptColor || "#888" } as CSSProperties}
                    >
                      <span className="panel-location__label">Department</span>
                      <span className="panel-location__name">{place.deptName}</span>
                    </div>
                  )}
                  {place.adminRegionName && (
                    <div
                      className="panel-location__block"
                      style={{ "--loc-color": place.adminRegionColor || "#888" } as CSSProperties}
                    >
                      <span className="panel-location__label panel-location__label--region">Region</span>
                      <span className="panel-location__name">{place.adminRegionName}</span>
                    </div>
                  )}
                </div>
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
