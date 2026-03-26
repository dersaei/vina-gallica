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

  return (
    <div
      className={`place-panel${place ? " place-panel--open" : ""}`}
      aria-label="Place details"
      inert={!place || undefined}
    >
      <div className="place-panel__inner" ref={panelRef} tabIndex={-1}>
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

        {place && <div className="place-panel__content" />}
      </div>
    </div>
  );
}
