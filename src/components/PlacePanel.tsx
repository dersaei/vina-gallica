import { useEffect, useRef } from "react";
import "./PlacePanel.css";

interface Props {
  slug: string | null;
  onClose: () => void;
}

export default function PlacePanel({ slug, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Close on Escape key or click outside
  useEffect(() => {
    if (!slug) return;
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
  }, [slug, onClose]);

  // Trap focus when open (accessibility)
  useEffect(() => {
    if (slug) panelRef.current?.focus();
  }, [slug]);

  return (
    <div
      className={`place-panel${slug ? " place-panel--open" : ""}`}
      aria-label="Place details"
      inert={!slug || undefined}
    >
      <div className="place-panel__inner" ref={panelRef} tabIndex={-1}>
        <button
          className="place-panel__close"
          type="button"
          aria-label="Close panel"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="place-panel__content">
          {/* Content will be built in the next step */}
          {slug && <p className="place-panel__slug">{slug}</p>}
        </div>
      </div>
    </div>
  );
}
