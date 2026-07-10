import PaymentDetails, { type PaymentInfo } from "./PaymentDetails";
import "./PremiumStatus.css";

type Lang = "en" | "fr";

interface Props {
  lang: Lang;
  /** ISO timestamp of trial end, or null when the plan is fully paid. */
  trialEndsAt: string | null;
  payment: PaymentInfo;
  reference: string | null;
  /** Benefit bullets from the CMS; falls back to built-in copy when empty. */
  benefits?: string[];
}

const TRIAL_DAYS = 30;

const COPY = {
  en: {
    title: "Your Premium",
    trialTag: "Premium Trial",
    activeTag: "Premium active",
    dayOf: (elapsed: number) => `Day ${elapsed} of ${TRIAL_DAYS}`,
    daysLeft: (n: number) => `${n} ${n === 1 ? "day" : "days"} left to pay`,
    endsOn: (d: string) => `Trial ends on ${d}`,
    activeBody:
      "Thank you — your Premium subscription is active. Everything below is unlocked.",
    benefitsTitle: "What your Premium includes",
    payHeading: "How to pay",
    benefits: [
      "A premium card in the Directory — more information about your business and a higher position in results.",
      "A dedicated profile page for your business.",
      "An expanded business panel on the interactive Map.",
      "A live preview of your listings on the Submit page.",
    ],
    payHint:
      "Your trial is active now. Pay the pro-forma invoice within the trial to keep Premium after it ends.",
  },
  fr: {
    title: "Votre Premium",
    trialTag: "Essai Premium",
    activeTag: "Premium actif",
    dayOf: (elapsed: number) => `Jour ${elapsed} sur ${TRIAL_DAYS}`,
    daysLeft: (n: number) => `${n} ${n === 1 ? "jour" : "jours"} pour régler`,
    endsOn: (d: string) => `L'essai se termine le ${d}`,
    activeBody:
      "Merci — votre abonnement Premium est actif. Tout ce qui suit est débloqué.",
    benefitsTitle: "Ce que comprend votre Premium",
    payHeading: "Comment payer",
    benefits: [
      "Une fiche premium dans l'Annuaire — plus d'informations sur votre établissement et une meilleure position dans les résultats.",
      "Une page de profil dédiée à votre établissement.",
      "Un panneau enrichi sur la Carte interactive.",
      "Un aperçu en direct de vos fiches sur la page Rejoindre.",
    ],
    payHint:
      "Votre essai est actif. Réglez la facture proforma pendant l'essai pour conserver le Premium ensuite.",
  },
} as const;

export default function PremiumStatus({
  lang,
  trialEndsAt,
  payment,
  reference,
  benefits,
}: Props) {
  const t = COPY[lang];

  const end = trialEndsAt ? new Date(trialEndsAt) : null;
  const daysLeft =
    end && !Number.isNaN(end.getTime())
      ? Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86_400_000))
      : null;
  const isTrial = daysLeft !== null && daysLeft > 0;
  // Day counting is inclusive and 1-based: the grant day is "Day 1 of 30".
  const elapsed =
    daysLeft !== null
      ? Math.min(TRIAL_DAYS, Math.max(1, TRIAL_DAYS - daysLeft + 1))
      : 0;
  const percent = isTrial ? Math.round((elapsed / TRIAL_DAYS) * 100) : 100;

  const endLabel = end
    ? end.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const benefitItems =
    benefits && benefits.length > 0 ? benefits : [...t.benefits];

  return (
    <div className="prem">
      <h1 className="prem-title">{t.title}</h1>
      <section className="prem-columns">
        <div className={`prem-card${isTrial ? "" : " prem-card--active"}`}>
          <span className="prem-tag">{isTrial ? t.trialTag : t.activeTag}</span>

          {isTrial ? (
            <>
              <div className="prem-countdown">
                <span className="prem-day">{t.dayOf(elapsed)}</span>
                <span className="prem-left">{t.daysLeft(daysLeft!)}</span>
              </div>
              <div className="prem-bar" aria-hidden="true">
                <div
                  className="prem-bar-fill"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="prem-ends">{t.endsOn(endLabel)}</p>

              <div className="prem-card-pay">
                <PaymentDetails
                  lang={lang}
                  payment={payment}
                  reference={reference}
                  title={t.payHeading}
                  flat
                />
                <p className="prem-pay-hint">{t.payHint}</p>
              </div>
            </>
          ) : (
            <p className="prem-active-body">{t.activeBody}</p>
          )}
        </div>

        <section className="prem-benefits">
          <h2 className="prem-benefits-title">{t.benefitsTitle}</h2>
          <ul className="prem-benefits-list">
            {benefitItems.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </section>
      </section>
    </div>
  );
}
