import type { ListingState, Tx, ViewModel, Lang } from "./editorShared";
import { DAYS, DAY_LABELS } from "./useListingState";
import "./PlaceCardPremium.css";

interface Props {
  lang: Lang;
  tx: Tx;
  s: ListingState;
  vm: ViewModel;
  directusUrl: string;
}

// React port of PlaceCardPremium.astro — same markup + shared CSS, driven by
// live editor state so the responsive preview reflects unsaved changes.
export default function PlaceCardPremiumPreview({
  lang,
  tx,
  s,
  vm,
  directusUrl,
}: Props) {
  const accent = vm.categoryColor ?? "#6e2331";
  const logoUrl = s.logoId
    ? `${directusUrl}/assets/${s.logoId}?width=300&format=webp&quality=85`
    : null;
  const phoneHref = s.phone
    ? `tel:${s.phone.replace(/[^+\d]/g, "")}`
    : undefined;

  const slogans =
    (lang === "fr" ? s.slogansFr : s.slogansEn)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 3);

  const hours = s.openingHours.some((h) => !h.closed && h.open && h.close)
    ? DAYS.map((day) => {
        const h = s.openingHours.find((x) => x.day === day);
        const time =
          !h || h.closed || !h.open || !h.close
            ? tx.hoursClosed
            : `${h.open} – ${h.close}`;
        return { day: DAY_LABELS[lang][day], time };
      })
    : [];

  const cityLine = vm.cityLine;
  const dept = vm.dept;

  return (
    <article
      className="place-card-premium"
      style={{ ["--pcp-accent" as string]: accent }}
    >
      <div className="pcp-web">
        <div className="pcp-main">
          {logoUrl && (
            <div className="pcp-logo pcp-logo--corner">
              <img src={logoUrl} alt={`${s.name} logo`} />
            </div>
          )}

          {vm.categoryLabel && (
            <div className="pcp-cat-row">
              <span
                className="pcp-tag"
                style={{ ["--tag-color" as string]: vm.categoryColor ?? accent }}
              >
                {vm.categoryLabel}
              </span>
            </div>
          )}

          <h3 className="pcp-name">
            {s.name || tx.namePlaceholder}
          </h3>

          <div className="pcp-info">
            {vm.selectedRegions.length > 0 && (
              <div className="pcp-wine">
                {vm.selectedRegions.map((wr) => (
                  <span
                    key={wr.id}
                    style={{ ["--wine-region-color" as string]: wr.color ?? "#000" }}
                  >
                    {wr.region}
                  </span>
                ))}
              </div>
            )}

            {(s.address || cityLine) && (
              <address className="pcp-address">
                {s.address && <span>{s.address}</span>}
                {cityLine && <span className="pcp-town">{cityLine}</span>}
              </address>
            )}

            {dept && (
              <div className="pcp-loc">
                <span style={{ ["--loc-color" as string]: dept.color ?? "#888" }}>
                  {dept.name}
                </span>
                {dept.region_name && (
                  <span
                    style={{ ["--loc-color" as string]: dept.region_color ?? "#888" }}
                  >
                    {dept.region_name}
                  </span>
                )}
              </div>
            )}
          </div>

          {slogans.length > 0 && (
            <ul className="pcp-slogans">
              {slogans.map((sl, i) => (
                <li key={i}>{sl}</li>
              ))}
            </ul>
          )}
        </div>

        <aside className="pcp-side">
          {s.phone && (
            <a href={phoneHref} className="pcp-side-phone">
              <span className="pcp-phone-label">{tx.phone}</span>
              <span className="pcp-phone-num">{s.phone}</span>
            </a>
          )}

          <div className="pcp-side-actions">
            <span className="pcp-btn pcp-side-btn">
              {tx.profileLabel} <span className="arrow">→</span>
            </span>
            {s.website && (
              <span className="pcp-btn pcp-side-btn">
                {tx.websiteLabel} <span className="arrow">→</span>
              </span>
            )}
          </div>

          {s.isFestival ? (
            vm.eventLabel && (
              <div className="pcp-side-hours">
                <div className="pcp-side-label">{tx.eventDates}</div>
                <div className="pcp-side-dates">{vm.eventLabel}</div>
              </div>
            )
          ) : (
            hours.length > 0 && (
              <div className="pcp-side-hours">
                <div className="pcp-side-label">{tx.hours}</div>
                <div className="pcp-side-hours-list">
                  {hours.map((h) => (
                    <div key={h.day}>
                      <span className="pcp-day">{h.day}</span>
                      <span className="pcp-time">{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </aside>
      </div>
    </article>
  );
}
