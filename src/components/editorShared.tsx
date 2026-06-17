import { useEffect, type ReactNode } from "react";
import type { useListingState, WineRegion } from "./useListingState";

// ── Shared option types ──────────────────────────────────────────────────────

export interface DeptOption {
  id: string;
  code: string;
  name: string;
  color: string | null;
  region_name: string | null;
  region_color: string | null;
}

export type Lang = "en" | "fr";

export type ListingState = ReturnType<typeof useListingState>;

export type ModalKind =
  | "category"
  | "name"
  | "terroir"
  | "location"
  | "website"
  | "dates"
  | null;

// ── Translations ─────────────────────────────────────────────────────────────

export const t = {
  en: {
    newListing: "Create a Free Listing",
    editListing: "Edit listing",
    backToListings: "← Back to listings",
    cancel: "Back",
    saveDraft: "Save draft",
    submitReview: "Submit for review",
    publish: "Publish listing",
    updatePublish: "Update & publish",
    archive: "Archive",
    archiving: "Archiving…",
    saving: "Saving…",
    submitting: "Publishing…",
    saved: "Draft saved.",
    submitted: "Submitted for review.",
    published: "Listing published.",
    archived: "Listing archived.",
    required: "This field is required.",
    edit: "Edit",
    done: "Done",
    editFields: "Editor",
    notSet: "Not set",
    intro:
      "You can create your listing by filling in the fields in the Editor container. Selecting any of them opens a modal window where you can make changes. Everything you do is reflected in the other containers, giving you a preview of how your listing could look live on the Vina Gallica pages. You can save your work as a draft, or submit it to us for review.",
    cardEmpty: "Your card preview will appear here as you fill in the fields.",
    panelEmpty: "Your panel preview will appear here as you fill in the fields.",
    // slot labels / placeholders
    category: "Category",
    selectCategory: "Select a category",
    name: "Listing name",
    namePlaceholder: "Listing name",
    terroir: "Wine regions (terroir)",
    selectTerroir: "Select wine regions",
    location: "Location",
    locationHint:
      "Search for your exact address. Suggestions appear as you type; pick yours from the list. The street, postal code and city are filled automatically — you can refine them afterwards.",
    address: "Address",
    addressPlaceholder: "Search your address",
    website: "Website",
    websitePlaceholder: "Add a website",
    eventDates: "Event dates",
    eventDatesHint: "Shown because the selected category is a festival.",
    eventStart: "Start",
    eventEnd: "End",
    selectDates: "Set event dates",
    websiteLabel: "Visit website",
    wineRegionLabel: "Wine Region",
    department: "Department",
    region: "Region",
  },
  fr: {
    newListing: "Créer une fiche gratuite",
    editListing: "Modifier la fiche",
    backToListings: "← Retour aux fiches",
    cancel: "Retour",
    saveDraft: "Enregistrer le brouillon",
    submitReview: "Soumettre pour révision",
    publish: "Publier la fiche",
    updatePublish: "Mettre à jour et publier",
    archive: "Archiver",
    archiving: "Archivage…",
    saving: "Enregistrement…",
    submitting: "Publication…",
    saved: "Brouillon enregistré.",
    submitted: "Soumis pour révision.",
    published: "Fiche publiée.",
    archived: "Fiche archivée.",
    required: "Ce champ est obligatoire.",
    edit: "Modifier",
    done: "Terminé",
    editFields: "Éditeur",
    notSet: "Non renseigné",
    intro:
      "Vous pouvez créer votre fiche en remplissant les champs du conteneur Éditeur. En sélectionnant l'un d'eux, vous ouvrirez une fenêtre modale dans laquelle vous pourrez effectuer vos modifications. Tout ce que vous faites se répercute dans les autres conteneurs, vous donnant un aperçu de l'apparence de votre fiche en ligne sur les pages de Vina Gallica. Vous pouvez enregistrer votre travail comme brouillon, ou nous le soumettre pour révision.",
    cardEmpty:
      "L'aperçu de votre carte apparaîtra ici au fur et à mesure que vous remplissez les champs.",
    panelEmpty:
      "L'aperçu de votre panneau apparaîtra ici au fur et à mesure que vous remplissez les champs.",
    category: "Catégorie",
    selectCategory: "Sélectionner une catégorie",
    name: "Nom de la fiche",
    namePlaceholder: "Nom de la fiche",
    terroir: "Régions viticoles (terroir)",
    selectTerroir: "Sélectionner les régions viticoles",
    location: "Localisation",
    locationHint:
      "Recherchez votre adresse exacte. Des suggestions apparaissent ; sélectionnez la vôtre. L'adresse, le code postal et la ville se remplissent automatiquement — vous pourrez les corriger ensuite.",
    address: "Adresse",
    addressPlaceholder: "Rechercher votre adresse",
    website: "Site web",
    websitePlaceholder: "Ajouter un site web",
    eventDates: "Dates de l'événement",
    eventDatesHint: "Affiché car la catégorie sélectionnée est un festival.",
    eventStart: "Début",
    eventEnd: "Fin",
    selectDates: "Définir les dates",
    websiteLabel: "Visiter le site",
    wineRegionLabel: "Région viticole",
    department: "Département",
    region: "Région",
  },
} as const;

export type Tx = (typeof t)[keyof typeof t];

// ── View-model — derived display data computed once, shared by all previews ──

export interface ViewModel {
  categoryLabel: string | null;
  categoryColor: string | null;
  selectedRegions: WineRegion[];
  dept: DeptOption | null;
  cityLine: string;
  eventLabel: string;
}

export function buildViewModel(
  s: ListingState,
  lang: Lang,
  wineRegions: WineRegion[],
  categories: { id: string; name: string; name_fr: string | null; color?: string | null }[],
  departments: DeptOption[],
  deptCode: string | null,
): ViewModel {
  const selectedCategory = categories.find((c) => c.id === s.category) ?? null;
  const categoryLabel = selectedCategory
    ? lang === "fr"
      ? (selectedCategory.name_fr ?? selectedCategory.name)
      : selectedCategory.name
    : null;

  const selectedRegions = wineRegions.filter((r) => s.terroir.includes(r.id));

  const dept = deptCode
    ? (departments.find((d) => d.code === deptCode) ?? null)
    : null;

  const cityLine = [s.postalCode, s.place].filter(Boolean).join(" ");

  const fmt = (iso: string) =>
    iso
      ? new Date(iso).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "";
  const eventLabel =
    s.eventStart && s.eventEnd
      ? `${fmt(s.eventStart)} – ${fmt(s.eventEnd)}`
      : s.eventStart
        ? fmt(s.eventStart)
        : "";

  return {
    categoryLabel,
    categoryColor: selectedCategory?.color ?? null,
    selectedRegions,
    dept,
    cityLine,
    eventLabel,
  };
}

// ── Edit modal ───────────────────────────────────────────────────────────────

export function EditModal({
  title,
  hint,
  onClose,
  doneLabel,
  children,
  variant,
}: {
  title: string;
  hint?: string;
  onClose: () => void;
  doneLabel: string;
  children: ReactNode;
  variant?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="ec-modal-backdrop" onClick={onClose}>
      <div
        className={`ec-modal${variant ? ` ec-modal--${variant}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ec-modal-header">
          <h3 className="ec-modal-title">{title}</h3>
          <button
            type="button"
            className="ec-modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {hint && <p className="ec-modal-hint">{hint}</p>}
        <div className="ec-modal-body">{children}</div>
        <div className="ec-modal-actions">
          <button
            type="button"
            className="lf-btn lf-btn--primary"
            onClick={onClose}
          >
            {doneLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
