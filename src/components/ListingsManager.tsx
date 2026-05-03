import { useState, useEffect } from "react";
import ListingForm from "./ListingForm";
import "./ListingForm.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

interface WineRegion { id: string; region: string; }
interface Category   { id: string; name: string; name_fr: string | null; }

interface Listing {
  id: string;
  Name: string;
  status: string;
  date_updated: string | null;
  date_created: string | null;
  category: { id: string; name: string; name_fr: string | null } | null;
  terroir: { wine_regions_id: { id: string; region: string } }[];
  address: string | null;
  postal_code: string | null;
  place: string | null;
  phone: string | null;
  website: string | null;
  location: { type: "Point"; coordinates: [number, number] } | null;
  logo: string | null;
  description_en: string | null;
  description_fr: string | null;
  translate_to_en: boolean;
  translate_to_fr: boolean;
  gallery: string[] | null;
  certificates: string[] | null;
  video: string[] | null;
}

interface Props {
  lang: "en" | "fr";
  plan: "free" | "premium";
  wineRegions: WineRegion[];
  categories: Category[];
  mapboxToken: string;
}

const STATUS_LABEL: Record<string, Record<string, string>> = {
  en: {
    draft:          "Draft",
    pending_review: "Pending review",
    published:      "Published",
    archived:       "Archived",
  },
  fr: {
    draft:          "Brouillon",
    pending_review: "En attente de révision",
    published:      "Publié",
    archived:       "Archivé",
  },
};

const STATUS_COLOR: Record<string, string> = {
  draft:          "#888",
  pending_review: "#b58a00",
  published:      "#2d6a4f",
  archived:       "#721c24",
};

const T = {
  en: {
    myListings:   "My listings",
    newListing:   "+ New listing",
    loading:      "Loading…",
    noListings:   "You have no listings yet.",
    edit:         "Edit",
    lastUpdated:  "Updated",
    never:        "never",
    upgradeNote:  "Upgrade to Premium to unlock descriptions, gallery, certificates and video.",
  },
  fr: {
    myListings:   "Mes fiches",
    newListing:   "+ Nouvelle fiche",
    loading:      "Chargement…",
    noListings:   "Vous n'avez pas encore de fiche.",
    edit:         "Modifier",
    lastUpdated:  "Mis à jour",
    never:        "jamais",
    upgradeNote:  "Passez à Premium pour débloquer les descriptions, la galerie, les certificats et la vidéo.",
  },
} as const;

type View = "list" | "new" | { edit: Listing };

export default function ListingsManager({ lang, plan, wineRegions, categories, mapboxToken }: Props) {
  const tx = T[lang];
  const [view, setView]         = useState<View>("list");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading]   = useState(true);

  // Inject mapbox token for geocoder
  useEffect(() => {
    (window as unknown as Record<string, string>).__MAPBOX_TOKEN__ = mapboxToken;
  }, [mapboxToken]);

  async function loadListings() {
    setLoading(true);
    try {
      const res = await fetch("/api/listings");
      if (res.ok) {
        const body = await res.json() as { listings: Listing[] };
        setListings(body.listings);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadListings(); }, []);

  function formatDate(iso: string | null) {
    if (!iso) return tx.never;
    return new Date(iso).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  if (view === "new" || (typeof view === "object" && "edit" in view)) {
    const listing = typeof view === "object" && "edit" in view ? view.edit : undefined;
    return (
      <ListingForm
        lang={lang}
        plan={plan}
        wineRegions={wineRegions}
        categories={categories}
        listing={listing}
        onSaved={() => { setView("list"); loadListings(); }}
        onCancel={() => setView("list")}
      />
    );
  }

  return (
    <div className="lm">
      <div className="lm-header">
        <h2 className="lm-title">{tx.myListings}</h2>
        <button className="lf-btn lf-btn--primary" onClick={() => setView("new")}>
          {tx.newListing}
        </button>
      </div>

      {plan === "free" && (
        <div className="lm-upgrade-note">{tx.upgradeNote}</div>
      )}

      {loading && <p className="lm-loading">{tx.loading}</p>}

      {!loading && listings.length === 0 && (
        <p className="lm-empty">{tx.noListings}</p>
      )}

      {!loading && listings.length > 0 && (
        <ul className="lm-list">
          {listings.map(l => (
            <li key={l.id} className="lm-item">
              <div className="lm-item-main">
                <span className="lm-item-name">{l.Name}</span>
                <span
                  className="lm-item-status"
                  style={{ color: STATUS_COLOR[l.status] ?? "#888" }}
                >
                  {STATUS_LABEL[lang][l.status] ?? l.status}
                </span>
              </div>
              <div className="lm-item-meta">
                {l.category && (
                  <span className="lm-item-cat">
                    {lang === "fr" ? (l.category.name_fr ?? l.category.name) : l.category.name}
                  </span>
                )}
                <span className="lm-item-date">
                  {tx.lastUpdated}: {formatDate(l.date_updated ?? l.date_created)}
                </span>
              </div>
              {l.status !== "published" && (
                <button
                  className="lf-btn lf-btn--secondary lm-edit-btn"
                  onClick={() => setView({ edit: l })}
                >
                  {tx.edit}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
