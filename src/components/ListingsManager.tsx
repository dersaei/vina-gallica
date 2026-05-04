import { useState, useEffect } from "react";
import ListingForm from "./ListingForm";
import type { Listing } from "./listingTypes";
import "./ListingForm.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

interface WineRegion {
  id: string;
  region: string;
}
interface Category {
  id: string;
  name: string;
  name_fr: string | null;
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
    draft: "Draft",
    pending_review: "Pending review",
    published: "Published",
    archived: "Archived",
  },
  fr: {
    draft: "Brouillon",
    pending_review: "En attente de révision",
    published: "Publié",
    archived: "Archivé",
  },
};

const T = {
  en: {
    title: "Submit a listing",
    newListing: "+ New listing",
    intro:
      "You can add multiple listings to Vina Gallica. You can also create drafts and save them to come back to later. All your listings — both drafts and those already submitted — appear below in this section. You will be able to edit and delete them. A Premium account gives access to more form fields, letting you create profiles that stand out and appear higher in our directory.",
    upgradeNote:
      "Upgrade to Premium to publish instantly and unlock descriptions, gallery, certificates and video",
    loading: "Loading…",
    noListings: "No listings yet. Create your first one above.",
    yourListings: "Your listings",
    edit: "Edit",
    archive: "Archive",
    delete: "Delete",
    deleteConfirm: "Are you sure you want to delete",
    deleteCancel: "Cancel",
    deleteConfirmBtn: "Yes, delete",
    deleting: "Deleting…",
    created: "Created",
    updated: "Updated",
    never: "never",
  },
  fr: {
    title: "Soumettre une fiche",
    newListing: "+ Nouvelle fiche",
    intro:
      "Vous pouvez ajouter plusieurs fiches à Vina Gallica. Vous pouvez également créer des brouillons et les enregistrer pour y revenir plus tard. Toutes vos fiches — brouillons et fiches déjà soumises — apparaissent ci-dessous dans cette section. Vous pourrez les modifier et les supprimer. Un compte Premium donne accès à davantage de champs dans le formulaire, vous permettant de créer des profils qui se démarquent et apparaissent en tête de notre répertoire.",
    upgradeNote:
      "Passez à Premium pour publier instantanément et débloquer les descriptions, la galerie, les certificats et la vidéo",
    loading: "Chargement…",
    noListings:
      "Aucune fiche pour l'instant. Créez votre première fiche ci-dessus.",
    yourListings: "Vos fiches",
    edit: "Modifier",
    archive: "Archiver",
    delete: "Supprimer",
    deleteConfirm: "Voulez-vous vraiment supprimer",
    deleteCancel: "Annuler",
    deleteConfirmBtn: "Oui, supprimer",
    deleting: "Suppression…",
    created: "Créée",
    updated: "Modifiée",
    never: "jamais",
  },
} as const;

type View = "list" | "new" | { edit: Listing };

export default function ListingsManager({
  lang,
  plan,
  wineRegions,
  categories,
  mapboxToken,
}: Props) {
  const tx = T[lang];
  const [view, setView] = useState<View>("list");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    (window as unknown as Record<string, string>).__MAPBOX_TOKEN__ =
      mapboxToken;
  }, [mapboxToken]);

  async function loadListings() {
    setLoading(true);
    try {
      const res = await fetch("/api/listings");
      if (res.ok) {
        const body = (await res.json()) as { listings: Listing[] };
        setListings(body.listings);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
  }, []);

  function formatDate(iso: string | null) {
    if (!iso) return tx.never;
    return new Date(iso).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  if (view === "new" || (typeof view === "object" && "edit" in view)) {
    const listing =
      typeof view === "object" && "edit" in view ? view.edit : undefined;
    return (
      <ListingForm
        lang={lang}
        plan={plan}
        wineRegions={wineRegions}
        categories={categories}
        listing={listing}
        onSaved={(id, newStatus, updatedListing) => {
          if (typeof view === "object" && "edit" in view) {
            setListings(prev => prev.map(l =>
              l.id === id
                ? (updatedListing ?? { ...l, status: newStatus, date_updated: new Date().toISOString() })
                : l
            ));
            setView("list");
          } else {
            setView("list");
            loadListings();
          }
        }}
        onCancel={() => setView("list")}
      />
    );
  }

  async function archiveListing(l: Listing) {
    setArchiving(true);
    const res = await fetch(`/api/listings/${l.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Name: l.Name,
        category: l.category?.id ?? null,
        terroir: l.terroir.map(t => t.wine_regions_id.id),
        address: l.address,
        postal_code: l.postal_code,
        place: l.place,
        phone: l.phone,
        website: l.website,
        location: l.location,
        logo: l.logo,
        archive: true,
        submit: false,
      }),
    });
    if (res.ok) {
      setListings(prev => prev.map(item =>
        item.id === l.id ? { ...item, status: "archived" } : item
      ));
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      alert(body.error ?? "Failed to archive.");
    }
    setArchiving(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/listings/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      setListings(prev => prev.filter(l => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      setDeleteTarget(null);
      alert(body.error ?? "Failed to delete.");
    }
    setDeleting(false);
  }

  return (
    <div className="lm">
      {/* ── Hero header ── */}
      <div className="lm-hero">
        <h2 className="lm-hero-title">{tx.title}</h2>
        <button
          type="button"
          className="lf-btn lf-btn--primary"
          onClick={() => setView("new")}
        >
          {tx.newListing}
        </button>
        <p className="lm-hero-intro">
          {tx.intro}
        </p>
      </div>

      {plan === "free" && (
        <div className="lm-upgrade-note">{tx.upgradeNote}</div>
      )}

      {/* ── Listings ── */}
      <div className="lm-section">
        <h3 className="lm-section-title">{tx.yourListings}</h3>

        {loading && <p className="lm-loading">{tx.loading}</p>}

        {!loading && listings.length === 0 && (
          <p className="lm-empty">{tx.noListings}</p>
        )}

        {!loading && listings.length > 0 && (
          <ul className="lm-list">
            {listings.map((l) => {
              const catLabel = l.category
                ? lang === "fr"
                  ? (l.category.name_fr ?? l.category.name)
                  : l.category.name
                : null;
              const meta = [
                `${tx.created} ${formatDate(l.date_created)}`,
                l.date_updated && l.date_updated !== l.date_created
                  ? `${tx.updated} ${formatDate(l.date_updated)}`
                  : null,
              ].filter(Boolean).join(" · ");

              return (
                <li key={l.id} className={`lm-card lm-card--${l.status}`}>
                  <div className="lm-card-inner">
                    <div className="lm-card-content">
                      <div className="lm-card-top">
                        <span className="lm-card-name">{l.Name}</span>
                        <span className="lm-card-status">
                          {STATUS_LABEL[lang][l.status] ?? l.status}
                        </span>
                      </div>
                      <div className="lm-card-bottom">
                        {catLabel && <span className="lm-card-cat">{catLabel}</span>}
                        <span className="lm-card-meta">{meta}</span>
                      </div>
                    </div>
                  </div>
                  <div className="lm-card-actions">
                    <button
                      type="button"
                      className="lf-btn lf-btn--secondary"
                      onClick={() => setView({ edit: l })}
                    >
                      {tx.edit}
                    </button>
                    {l.status === "published" ? (
                      <button
                        type="button"
                        className="lf-btn lf-btn--danger"
                        disabled={archiving}
                        onClick={() => archiveListing(l)}
                      >
                        {tx.archive}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="lf-btn lf-btn--danger"
                        onClick={() => setDeleteTarget(l)}
                      >
                        {tx.delete}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <div className="lm-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="lm-modal" onClick={e => e.stopPropagation()}>
            <div className="lm-modal-header">
              <div className="lm-modal-icon">🗑</div>
              <h3 className="lm-modal-heading">{tx.delete}</h3>
            </div>
            <p className="lm-modal-msg">
              {tx.deleteConfirm}{" "}
              <strong>&ldquo;{deleteTarget.Name}&rdquo;</strong>?
            </p>
            <div className="lm-modal-actions">
              <button
                type="button"
                className="lf-btn lf-btn--secondary"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                {tx.deleteCancel}
              </button>
              <button
                type="button"
                className="lf-btn lf-btn--danger"
                disabled={deleting}
                onClick={confirmDelete}
              >
                {deleting ? tx.deleting : tx.deleteConfirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
