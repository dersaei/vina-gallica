import type { ListingState, Tx, ViewModel } from "./editorShared";
import "./EditableCard.css";

interface Props {
  tx: Tx;
  s: ListingState;
  vm: ViewModel;
}

// Read-only directory-style card. All editing happens in EditPanel; this only
// renders the current state, so it stays in sync with any other preview.
export default function EditableCard({ tx, s, vm }: Props) {
  const isEmpty =
    !s.name &&
    !vm.categoryLabel &&
    vm.selectedRegions.length === 0 &&
    !s.address &&
    !vm.cityLine &&
    !s.website &&
    !(s.isFestival && vm.eventLabel);

  if (isEmpty) {
    return (
      <article className="place-card ec-card ec-card--empty">
        <p className="ec-empty">{tx.cardEmpty}</p>
      </article>
    );
  }

  return (
    <article className="place-card ec-card">
      {/* Event dates badge (festival only) */}
      {s.isFestival && vm.eventLabel && (
        <span className="card-event-dates">
          <span>{vm.eventLabel}</span>
        </span>
      )}

      {/* Category */}
      {vm.categoryLabel && (
        <div className="card-meta">
          <span
            className="tag tag-category"
            style={{ ["--tag-color" as string]: vm.categoryColor ?? "#888" }}
          >
            {vm.categoryLabel}
          </span>
        </div>
      )}

      {/* Name */}
      <h3 className="card-name">
        {s.name || <span className="ec-placeholder">{tx.namePlaceholder}</span>}
      </h3>

      {/* Wine regions */}
      {vm.selectedRegions.length > 0 && (
        <div className="card-wine-regions">
          {vm.selectedRegions.map((r) => (
            <span
              key={r.id}
              className="card-wine-region"
              style={{ ["--wine-region-color" as string]: r.color ?? "#000" }}
            >
              {r.region}
            </span>
          ))}
        </div>
      )}

      {/* Address */}
      {(s.address || vm.cityLine) && (
        <address className="card-address">
          {s.address && <span>{s.address}</span>}
          {vm.cityLine && <span className="card-town">{vm.cityLine}</span>}
        </address>
      )}

      {/* Department + region — derived from the address */}
      {vm.dept && (
        <div className="card-regions">
          <span
            className="tag-location"
            style={{ ["--loc-color" as string]: vm.dept.color ?? "#888" }}
          >
            {vm.dept.name}
          </span>
          {vm.dept.region_name && (
            <span
              className="tag-location"
              style={{
                ["--loc-color" as string]: vm.dept.region_color ?? "#888",
              }}
            >
              {vm.dept.region_name}
            </span>
          )}
        </div>
      )}

      {/* Website */}
      {s.website && (
        <span className="card-link ec-card-link-preview">{tx.websiteLabel}</span>
      )}
    </article>
  );
}
