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
  | "logo"
  | "phone"
  | "hours"
  | "slogans"
  | null;

// ── Translations ─────────────────────────────────────────────────────────────

export const t = {
  en: {
    newListing: "Create a Free Listing",
    newListingPremium: "Create a Premium Listing",
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
    saveField: "Save",
    cancelField: "Cancel",
    editFields: "Editor",
    notSet: "Not set",
    intro:
      "You can create your listing by filling in the fields in the Editor container. Selecting any of them opens a modal window where you can make changes. Everything you do is reflected in the other containers, giving you a preview of how your listing could look live on the Vina Gallica pages. You can save your work as a draft, or submit it to us for review.",
    cardEmpty: "Your card preview will appear here as you fill in the fields.",
    panelEmpty:
      "Your panel preview will appear here as you fill in the fields.",
    popupEmpty: "Your map popup preview will appear here.",
    // slot labels / placeholders
    category: "Category",
    selectCategory: "Select a category",
    name: "Listing name",
    namePlaceholder: "Listing name",
    terroir: "Wine regions",
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
    profileLabel: "Visit profile",
    wineRegionLabel: "Wine Region",
    department: "Department",
    region: "Region",
    // premium fields
    logo: "Logo",
    logoHint: "Upload your logo (PNG, JPG, WebP or SVG, max 2 MB).",
    logoUploading: "Uploading…",
    logoRemove: "Remove logo",
    logoSet: "Logo added",
    logoChoose: "Choose a file",
    logoReplace: "Replace logo",
    logoDrop: "or drag it here",
    logoFormats: "PNG · JPG · WebP · SVG — max 2 MB",
    phone: "Phone",
    phonePlaceholder: "+33 5 57 88 83 83",
    hours: "Opening hours",
    hoursClosed: "Closed",
    slogans: "Slogans",
    slogansHint:
      "Add up to 3 short marketing taglines that capture the spirit of your venture. Write each one in both English and French — English slogans appear on the English site, French ones on the French site.",
    slogansLangEn: "English",
    slogansLangFr: "French",
    sloganPair: (n: number) => `Slogan ${n}`,
    sloganPlaceholder: "Marketing tagline",
    slogansCountPair: (en: number, fr: number) => `${en} EN · ${fr} FR`,
    previewDesktop: "Desktop",
    previewMobile: "Mobile",
    // section headings for the stacked preview layout
    sectionCard: "Directory listing",
    sectionCardHint:
      "How your listing appears in the directory. Switch between desktop and mobile.",
    sectionPopup: "Map popup",
    sectionPopupHint: "What visitors see when they click your pin on the map.",
    sectionPanel: "Map side panel",
    sectionPanelHint: "The detail panel that opens beside the map.",
    previewsTitle: "Live previews",
    previewsHint: "Open any preview to see how your listing will look.",
    close: "Close",
  },
  fr: {
    newListing: "Créer une fiche gratuite",
    newListingPremium: "Créer une fiche Premium",
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
    saveField: "Enregistrer",
    cancelField: "Annuler",
    editFields: "Éditeur",
    notSet: "Non renseigné",
    intro:
      "Vous pouvez créer votre fiche en remplissant les champs du conteneur Éditeur. En sélectionnant l'un d'eux, vous ouvrirez une fenêtre modale dans laquelle vous pourrez effectuer vos modifications. Tout ce que vous faites se répercute dans les autres conteneurs, vous donnant un aperçu de l'apparence de votre fiche en ligne sur les pages de Vina Gallica. Vous pouvez enregistrer votre travail comme brouillon, ou nous le soumettre pour révision.",
    cardEmpty:
      "L'aperçu de votre carte apparaîtra ici au fur et à mesure que vous remplissez les champs.",
    panelEmpty:
      "L'aperçu de votre panneau apparaîtra ici au fur et à mesure que vous remplissez les champs.",
    popupEmpty: "L'aperçu de votre infobulle de carte apparaîtra ici.",
    category: "Catégorie",
    selectCategory: "Sélectionner une catégorie",
    name: "Nom de la fiche",
    namePlaceholder: "Nom de la fiche",
    terroir: "Régions viticoles",
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
    profileLabel: "Voir le profil",
    wineRegionLabel: "Région viticole",
    department: "Département",
    region: "Région",
    // premium fields
    logo: "Logo",
    logoHint: "Téléchargez votre logo (PNG, JPG, WebP ou SVG, max 2 Mo).",
    logoUploading: "Téléchargement…",
    logoRemove: "Retirer le logo",
    logoSet: "Logo ajouté",
    logoChoose: "Choisir un fichier",
    logoReplace: "Remplacer le logo",
    logoDrop: "ou glissez-le ici",
    logoFormats: "PNG · JPG · WebP · SVG — max 2 Mo",
    phone: "Téléphone",
    phonePlaceholder: "+33 5 57 88 83 83",
    hours: "Horaires d'ouverture",
    hoursClosed: "Fermé",
    slogans: "Slogans",
    slogansHint:
      "Ajoutez jusqu'à 3 courts slogans marketing qui traduisent l'esprit de votre établissement. Rédigez chacun en anglais et en français — les slogans anglais apparaissent sur le site anglais, les français sur le site français.",
    slogansLangEn: "Anglais",
    slogansLangFr: "Français",
    sloganPair: (n: number) => `Slogan ${n}`,
    sloganPlaceholder: "Slogan marketing",
    slogansCountPair: (en: number, fr: number) => `${en} EN · ${fr} FR`,
    previewDesktop: "Ordinateur",
    previewMobile: "Mobile",
    // section headings for the stacked preview layout
    sectionCard: "Fiche dans l'annuaire",
    sectionCardHint:
      "L'apparence de votre fiche dans l'annuaire. Basculez entre ordinateur et mobile.",
    sectionPopup: "Infobulle de la carte",
    sectionPopupHint:
      "Ce que voient les visiteurs lorsqu'ils cliquent sur votre repère.",
    sectionPanel: "Panneau latéral de la carte",
    sectionPanelHint: "Le panneau de détail qui s'ouvre à côté de la carte.",
    previewsTitle: "Aperçus en direct",
    previewsHint: "Ouvrez un aperçu pour voir le rendu de votre fiche.",
    close: "Fermer",
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
  categories: {
    id: string;
    name: string;
    name_fr: string | null;
    color?: string | null;
  }[],
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
  onCancel,
  doneLabel,
  cancelLabel,
  children,
  variant,
}: {
  title: string;
  hint?: string;
  /** Confirms the edit and closes. */
  onClose: () => void;
  /** Discards the edit and closes. When given, the modal becomes a commit /
   *  discard dialog: the backdrop no longer closes it and Escape cancels. */
  onCancel?: () => void;
  doneLabel: string;
  cancelLabel?: string;
  children: ReactNode;
  variant?: string;
}) {
  // Escape discards when there is something to discard, otherwise it just
  // closes (preview modals have no edits to lose).
  const dismiss = onCancel ?? onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dismiss]);

  return (
    <div
      className="ec-modal-backdrop"
      // Editing modals must not close on a stray backdrop click — that used to
      // commit the changes with no way back. Read-only modals still do.
      onClick={onCancel ? undefined : onClose}
    >
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
            aria-label={cancelLabel ?? "Close"}
            onClick={dismiss}
          >
            ✕
          </button>
        </div>
        {hint && <p className="ec-modal-hint">{hint}</p>}
        <div className="ec-modal-body">{children}</div>
        <div className="ec-modal-actions">
          {onCancel && (
            <button
              type="button"
              className="lf-btn lf-btn--secondary"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
          )}
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
