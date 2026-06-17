import type { CSSProperties } from "react";
import type { ListingState, Tx, ViewModel, Lang } from "./editorShared";
import "./MapPopupPreview.css";

interface Props {
  lang: Lang;
  tx: Tx;
  s: ListingState;
  vm: ViewModel;
}

// Read-only preview of the map pin popup (the compact bubble shown above a pin,
// see buildSinglePopupHtml in Map.tsx). Standard fields only; no "open panel"
// button since there's no panel to open here. Same shared state as the other
// previews, so it stays in sync automatically.
export default function MapPopupPreview({ lang, tx, s, vm }: Props) {
  const addressLine = [s.address, vm.cityLine].filter(Boolean).join(", ");
  const isEmpty =
    !s.name &&
    !vm.categoryLabel &&
    vm.selectedRegions.length === 0 &&
    !s.address &&
    !vm.cityLine;

  return (
    <div
      className="mpop"
      aria-label={lang === "fr" ? "Aperçu infobulle carte" : "Map popup preview"}
    >
      <div className="map-popup mpop-inner">
        {isEmpty ? (
          <div className="map-popup__body">
            <p className="mpop-empty">{tx.popupEmpty}</p>
          </div>
        ) : (
          <>
            {vm.selectedRegions.length > 0 && (
              <div className="map-popup__region">
                {vm.selectedRegions.map((r) => (
                  <span
                    key={r.id}
                    className="map-popup__region-line"
                    style={
                      { backgroundColor: r.color ?? "#888" } as CSSProperties
                    }
                  >
                    {r.region}
                  </span>
                ))}
              </div>
            )}
            <div className="map-popup__body">
              <p className="map-popup__name">
                {s.name || (
                  <span className="ec-placeholder">{tx.namePlaceholder}</span>
                )}
              </p>
              {addressLine && (
                <p className="map-popup__address">{addressLine}</p>
              )}
              {vm.dept && (
                <div className="map-popup__tags">
                  <span
                    className="map-popup__tag-location"
                    style={
                      { ["--loc-color" as string]: vm.dept.color ?? "#888" } as CSSProperties
                    }
                  >
                    {vm.dept.name}
                  </span>
                  {vm.dept.region_name && (
                    <span
                      className="map-popup__tag-location"
                      style={
                        {
                          ["--loc-color" as string]: vm.dept.region_color ?? "#888",
                        } as CSSProperties
                      }
                    >
                      {vm.dept.region_name}
                    </span>
                  )}
                </div>
              )}
              {vm.categoryLabel && (
                <div className="map-popup__footer">
                  <span
                    className="map-popup__category"
                    style={
                      {
                        backgroundColor: vm.categoryColor ?? "#888",
                      } as CSSProperties
                    }
                  >
                    {vm.categoryLabel}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
