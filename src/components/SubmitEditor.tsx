import type { Listing } from "./listingTypes";
import { useToast, ToastContainer } from "./Toast";
import {
  useListingState,
  type WineRegion,
  type Category,
} from "./useListingState";
import { deptCodeFromPostalCode } from "../lib/departmentFromPostalCode";
import { t, buildViewModel, type Lang, type DeptOption } from "./editorShared";
import EditPanel from "./EditPanel";
import EditableCard from "./EditableCard";
import MapPopupPreview from "./MapPopupPreview";
import MapPreviewPanel from "./MapPreviewPanel";
import PlaceCardPremiumPreview from "./PlaceCardPremiumPreview";
import ResponsivePreview from "./ResponsivePreview";
import "./SubmitEditor.css";

export type { DeptOption };

interface Props {
  lang: Lang;
  plan: "free" | "premium";
  wineRegions: WineRegion[];
  categories: Category[];
  departments: DeptOption[];
  listing?: Listing;
  directusUrl: string;
  onSaved?: (id: string, newStatus: string, updatedListing?: Listing) => void;
  onCancel?: () => void;
}

export default function SubmitEditor({
  lang,
  plan,
  wineRegions,
  categories,
  departments,
  listing,
  directusUrl,
  onSaved,
  onCancel,
}: Props) {
  const tx = t[lang];
  const { toasts, dismissToast } = useToast();
  const s = useListingState({ plan, categories, listing, onSaved });

  const deptCode = deptCodeFromPostalCode(s.postalCode, s.insee);
  const vm = buildViewModel(
    s,
    lang,
    wineRegions,
    categories,
    departments,
    deptCode,
  );

  const txSave = {
    archived: tx.archived,
    published: tx.published,
    submitted: tx.submitted,
    saved: tx.saved,
  };

  return (
    <div className="se">
      {onCancel && (
        <button type="button" className="ec-back" onClick={onCancel}>
          {tx.backToListings}
        </button>
      )}
      <h2 className="ec-title">{s.isEdit ? tx.editListing : tx.newListing}</h2>
      <p className="se-intro">{tx.intro}</p>

      {/* ── Tiles: edit panel + two synced previews ── */}
      <div className="se-tiles">
        <div className="se-track">
          <div className="se-tile se-tile--edit">
            <EditPanel
              lang={lang}
              tx={tx}
              s={s}
              vm={vm}
              plan={plan}
              directusUrl={directusUrl}
              wineRegions={wineRegions}
              categories={categories}
            />
          </div>
          <div
            className={`se-tile se-tile--card${plan === "premium" ? " se-tile--premium-card" : ""}`}
          >
            {plan === "premium" ? (
              <ResponsivePreview
                labels={{ desktop: tx.previewDesktop, mobile: tx.previewMobile }}
              >
                <PlaceCardPremiumPreview
                  lang={lang}
                  tx={tx}
                  s={s}
                  vm={vm}
                  directusUrl={directusUrl}
                />
              </ResponsivePreview>
            ) : (
              <EditableCard tx={tx} s={s} vm={vm} />
            )}
            <MapPopupPreview lang={lang} tx={tx} s={s} vm={vm} />
          </div>
          <div className="se-tile se-tile--panel">
            <MapPreviewPanel lang={lang} tx={tx} s={s} vm={vm} />
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="ec-actions">
        {s.feedback && (
          <div
            className={`lf-feedback lf-feedback--${s.feedback.ok ? "ok" : "err"}`}
          >
            {s.feedback.msg}
          </div>
        )}
        <div className="ec-actions-btns">
          {onCancel && (
            <button
              type="button"
              className="lf-btn lf-btn--ghost"
              onClick={onCancel}
            >
              {tx.cancel}
            </button>
          )}
          {s.isPublished ? (
            <>
              <button
                type="button"
                className="lf-btn lf-btn--danger"
                disabled={s.status !== "idle"}
                onClick={() => s.save(txSave, false, true)}
              >
                {s.status === "archiving" ? tx.archiving : tx.archive}
              </button>
              <button
                type="button"
                className="lf-btn lf-btn--primary"
                disabled={s.status !== "idle"}
                onClick={() => s.save(txSave, true)}
              >
                {s.status === "submitting" ? tx.submitting : tx.updatePublish}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="lf-btn lf-btn--secondary"
                disabled={s.status !== "idle"}
                onClick={() => s.save(txSave, false)}
              >
                {s.status === "saving" ? tx.saving : tx.saveDraft}
              </button>
              <button
                type="button"
                className="lf-btn lf-btn--primary"
                disabled={s.status !== "idle"}
                onClick={() => s.save(txSave, true)}
              >
                {s.status === "submitting"
                  ? tx.submitting
                  : s.isPremium
                    ? tx.publish
                    : tx.submitReview}
              </button>
            </>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
