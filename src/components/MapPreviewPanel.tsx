import type { CSSProperties } from "react";
import type { ListingState, Tx, ViewModel, Lang } from "./editorShared";
import "./MapPreviewPanel.css";

interface Props {
  lang: Lang;
  tx: Tx;
  s: ListingState;
  vm: ViewModel;
}

// Read-only preview that mirrors the public map side panel (PlacePanel).
// Standard fields only — no logo / phone (those are premium). Renders the same
// shared state as EditableCard, so both previews stay in sync automatically.
export default function MapPreviewPanel({ lang, tx, s, vm }: Props) {
  const firstRegion = vm.selectedRegions[0] ?? null;
  const isEmpty =
    !s.name &&
    !vm.categoryLabel &&
    vm.selectedRegions.length === 0 &&
    !s.address &&
    !vm.cityLine &&
    !s.website &&
    !(s.isFestival && vm.eventLabel);

  return (
    <div className="mpp" aria-label={lang === "fr" ? "Aperçu carte" : "Map preview"}>
      <div className="mpp-inner">
        {/* ── Wine region bar ── */}
        <div className="panel-region-bar">
          <span className="panel-region-bar__label">{tx.wineRegionLabel}</span>
        </div>
        {firstRegion && (
          <div
            className="panel-region-bar__tag"
            style={{ ["--region-color" as string]: firstRegion.color ?? "#888" }}
          >
            {firstRegion.region}
          </div>
        )}

        {/* ── Category ── */}
        {vm.categoryLabel && (
          <div className="panel-category">
            <span
              className="map-popup__category"
              style={
                { backgroundColor: vm.categoryColor ?? "#888" } as CSSProperties
              }
            >
              {vm.categoryLabel}
            </span>
          </div>
        )}

        {/* ── Place label ── */}
        <div className="place-panel__content">
          {isEmpty && <p className="ec-empty">{tx.panelEmpty}</p>}
          {!isEmpty && (
          <div className="place-label">
            <h2 className="place-label__name">
              {s.name || (
                <span className="ec-placeholder">{tx.namePlaceholder}</span>
              )}
            </h2>
            <hr className="place-label__divider" />
            {s.address && <p className="place-label__row">{s.address}</p>}
            {vm.cityLine && <p className="place-label__row">{vm.cityLine}</p>}

            {vm.dept && (
              <div className="panel-location">
                <div
                  className="panel-location__block"
                  style={
                    { ["--loc-color" as string]: vm.dept.color ?? "#888" } as CSSProperties
                  }
                >
                  <span className="panel-location__label">{tx.department}</span>
                  <span className="panel-location__name">{vm.dept.name}</span>
                </div>
                {vm.dept.region_name && (
                  <div
                    className="panel-location__block"
                    style={
                      {
                        ["--loc-color" as string]: vm.dept.region_color ?? "#888",
                      } as CSSProperties
                    }
                  >
                    <span className="panel-location__label panel-location__label--region">
                      {tx.region}
                    </span>
                    <span className="panel-location__name">
                      {vm.dept.region_name}
                    </span>
                  </div>
                )}
              </div>
            )}

            {s.website && (
              <a
                className="place-label__row place-label__link"
                href={s.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.website.replace(/^https?:\/\//, "")}
              </a>
            )}

            {s.isFestival && vm.eventLabel && (
              <div className="panel-event-dates">
                <span>{vm.eventLabel}</span>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
