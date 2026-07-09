import { useEffect, useRef, useState } from "react";
import "./UpgradeFlow.css";

type Lang = "en" | "fr";

export interface ServiceInfo {
  code: string;
  name: string;
  description: string;
}

interface Props {
  lang: Lang;
  service: ServiceInfo | null;
  userEmail: string;
  alreadyPremium: boolean;
  privacyHref: string;
}

type Step = "choose" | "form" | "processing" | "done";

interface Prefill {
  vatId: string;
  siren: string;
  name: string;
  country: string;
  street: string;
  postalCode: string;
  city: string;
}

type TaxPath = "vat" | "siren";

type Feedback = { kind: "error" | "info"; text: string } | null;

const COPY = {
  en: {
    pageTitle: "Upgrade to Premium",
    intro:
      "Start a no-obligation 30-day free trial. Pick the column that matches your situation and enter your tax number. Once it is verified, fill in the form. You will receive a pro-forma invoice and 30 days to pay it — and in the meantime you can use the full version of Vina Gallica to create and add your premium listings to our directory.",
    alreadyPremium:
      "Your account is already on Premium. There is nothing to upgrade — thank you for being with us.",
    vat: {
      title: "EU VAT number",
      priceNote: "€50 excl. VAT — reverse charge",
      subtitle:
        "Enter your EU VAT number (TVA intracommunautaire) to validate it. After a successful check you will see a form to add the remaining details and start your premium trial.",
      placeholder: "e.g. FR12345678901",
      button: "Validate",
      validating: "Verifying with VIES…",
      invalidFormat: "This does not look like a valid VAT number.",
      invalid: "This VAT number was not found in VIES. Please check it.",
      unavailable:
        "The VIES service is temporarily unavailable. Please try again in a moment.",
      rateLimited: "Too many attempts. Please wait a minute and try again.",
    },
    siren: {
      title: "No EU VAT number",
      priceNote: "€50 incl. VAT",
      subtitle:
        "Enter your SIREN number to validate it. After a successful check you will see a form to add the remaining details and start your premium trial.",
      placeholder: "9-digit SIREN",
      button: "Validate",
      validating: "Checking the registry…",
      invalidFormat: "SIREN must be exactly 9 digits.",
      invalid: "This SIREN was not found in the French business registry.",
      closed: "This company is closed (radiation). Registration is not possible.",
      unavailable:
        "The business registry is temporarily unavailable. Please try again in a moment.",
      rateLimited: "Too many attempts. Please wait a minute and try again.",
    },
    form: {
      leadTitle: "Start your free 30-day trial",
      leadPoints: [
        "You'll be able to create a premium card in the Directory. A premium card means more information about your business and a higher position in the results.",
        "You'll be able to create a profile page for your business.",
        "You'll be able to expand your business panel shown on the Map.",
        "You'll see a preview of your listings on the Submit page.",
        "All this for €50 per year, plus a 30-day free trial.",
      ],
      nameLabel: "Company name",
      streetLabel: "Street and number",
      postalLabel: "Postal code",
      cityLabel: "City",
      countryLabel: "Country (ISO code)",
      vatLabel: "VAT number",
      sirenLabel: "SIREN number",
      emailLabel: "Email for the invoice",
      emailNote: "The pro-forma invoice will be sent to this address.",
      prefillNote:
        "Prefilled from your VAT registration — edit anything if needed.",
      consentInvoiceVat:
        "I agree to receive a pro-forma invoice for €50 (reverse charge), payable within 30 days.",
      consentInvoiceSiren:
        "I agree to receive a pro-forma invoice for €50 (incl. VAT), payable within 30 days.",
      consentPrivacyBefore: "I accept the ",
      consentPrivacyLink: "Privacy Policy",
      consentPrivacyAfter: ".",
      submit: "Start my premium trial",
      submitting: "Submitting…",
      back: "← Back",
    },
    result: {
      processing:
        "Creating your pro-forma invoice… this usually takes a few seconds.",
      successTitle: "Your trial has started!",
      successBody: (n: string) =>
        `We have issued pro-forma invoice ${n} and emailed it to you. You have 30 days to pay it, and your Premium trial is active in the meantime.`,
      successNoNumber:
        "Your request was received and the invoice is being issued. Check your inbox in a few minutes.",
      failTitle: "Something went wrong",
      failBody:
        "We could not issue your invoice automatically. Please try again later or contact us — no charge has been made.",
      timeout:
        "Your request was received and is still being processed. We will email your pro-forma invoice shortly.",
      startOver: "Start over",
    },
    genericError: "Something went wrong. Please try again.",
    unavailableService:
      "Premium is not available right now. Please try again later.",
  },
  fr: {
    pageTitle: "Passer au Premium",
    intro:
      "Démarrez un essai gratuit et sans engagement de 30 jours. Choisissez la colonne qui correspond à votre situation et saisissez votre numéro fiscal. Une fois vérifié, remplissez le formulaire. Vous recevrez une facture proforma et 30 jours pour la régler — et vous pourrez entre-temps utiliser la version complète de Vina Gallica pour créer et ajouter vos fiches premium à notre annuaire.",
    alreadyPremium:
      "Votre compte est déjà Premium. Il n'y a rien à mettre à niveau — merci de votre confiance.",
    vat: {
      title: "Un numéro de TVA intracommunautaire",
      priceNote: "50 € HT — autoliquidation",
      subtitle:
        "Saisissez votre numéro de TVA intracommunautaire pour le valider. Après vérification, un formulaire vous permettra d'ajouter les informations restantes et de démarrer votre essai premium.",
      placeholder: "ex. FR12345678901",
      button: "Valider",
      validating: "Vérification auprès de VIES…",
      invalidFormat: "Ce numéro de TVA ne semble pas valide.",
      invalid:
        "Ce numéro de TVA est introuvable dans VIES. Veuillez le vérifier.",
      unavailable:
        "Le service VIES est momentanément indisponible. Veuillez réessayer dans un instant.",
      rateLimited:
        "Trop de tentatives. Veuillez patienter une minute et réessayer.",
    },
    siren: {
      title: "Pas de numéro de TVA intracommunautaire",
      priceNote: "50 € TTC (TVA comprise)",
      subtitle:
        "Saisissez votre numéro SIREN pour le valider. Après vérification, un formulaire vous permettra d'ajouter les informations restantes et de démarrer votre essai premium.",
      placeholder: "SIREN à 9 chiffres",
      button: "Valider",
      validating: "Vérification auprès du registre…",
      invalidFormat: "Le SIREN doit comporter exactement 9 chiffres.",
      invalid: "Ce SIREN est introuvable dans le registre des entreprises françaises.",
      closed: "Cette entreprise est fermée (radiation). L'inscription n'est pas possible.",
      unavailable:
        "Le registre des entreprises est momentanément indisponible. Veuillez réessayer dans un instant.",
      rateLimited:
        "Trop de tentatives. Veuillez patienter une minute et réessayer.",
    },
    form: {
      leadTitle: "Démarrez votre essai gratuit de 30 jours.",
      leadPoints: [
        "Vous pourrez créer une fiche premium dans l'Annuaire. Une fiche premium, c'est plus d'informations sur votre établissement et une meilleure position dans les résultats.",
        "Vous pourrez créer une page de profil pour votre établissement.",
        "Vous pourrez enrichir le panneau de votre établissement affiché sur la Carte.",
        "Vous verrez un aperçu de vos fiches sur la page Rejoindre.",
        "Le tout pour 50 € par an, plus 30 jours d'essai gratuit.",
      ],
      nameLabel: "Nom de l'entreprise",
      streetLabel: "Rue et numéro",
      postalLabel: "Code postal",
      cityLabel: "Ville",
      countryLabel: "Pays (code ISO)",
      vatLabel: "Numéro de TVA",
      sirenLabel: "Numéro SIREN",
      emailLabel: "E-mail pour la facture",
      emailNote: "La facture proforma sera envoyée à cette adresse.",
      prefillNote:
        "Prérempli depuis votre enregistrement TVA — modifiable si besoin.",
      consentInvoiceVat:
        "J'accepte de recevoir une facture proforma de 50 € (autoliquidation), à régler sous 30 jours.",
      consentInvoiceSiren:
        "J'accepte de recevoir une facture proforma de 50 € (TVA comprise), à régler sous 30 jours.",
      consentPrivacyBefore: "J'accepte la ",
      consentPrivacyLink: "Politique de confidentialité",
      consentPrivacyAfter: ".",
      submit: "Démarrer mon essai premium",
      submitting: "Envoi…",
      back: "← Retour",
    },
    result: {
      processing:
        "Création de votre facture proforma… cela prend généralement quelques secondes.",
      successTitle: "Votre essai a commencé !",
      successBody: (n: string) =>
        `Nous avons émis la facture proforma ${n} et vous l'avons envoyée par e-mail. Vous avez 30 jours pour la régler, et votre essai Premium est actif entre-temps.`,
      successNoNumber:
        "Votre demande a bien été reçue et la facture est en cours d'émission. Consultez votre boîte mail dans quelques minutes.",
      failTitle: "Une erreur est survenue",
      failBody:
        "Nous n'avons pas pu émettre votre facture automatiquement. Réessayez plus tard ou contactez-nous — aucun montant n'a été prélevé.",
      timeout:
        "Votre demande a bien été reçue et est encore en cours de traitement. Nous vous enverrons votre facture proforma sous peu.",
      startOver: "Recommencer",
    },
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    unavailableService:
      "Le Premium n'est pas disponible pour le moment. Veuillez réessayer plus tard.",
  },
} as const;

export default function UpgradeFlow({
  lang,
  service,
  userEmail,
  alreadyPremium,
  privacyHref,
}: Props) {
  const t = COPY[lang];

  const [step, setStep] = useState<Step>("choose");

  // VAT column
  const [vatInput, setVatInput] = useState("");
  const [vatChecking, setVatChecking] = useState(false);
  const [vatFeedback, setVatFeedback] = useState<Feedback>(null);

  // SIREN column
  const [sirenInput, setSirenInput] = useState("");
  const [sirenChecking, setSirenChecking] = useState(false);
  const [sirenFeedback, setSirenFeedback] = useState<Feedback>(null);

  // Which tax path led to the form (drives which id field + how we submit)
  const [path, setPath] = useState<TaxPath>("vat");

  // Form
  const [form, setForm] = useState<Prefill & { email: string }>({
    vatId: "",
    siren: "",
    name: "",
    country: "",
    street: "",
    postalCode: "",
    city: "",
    email: userEmail,
  });
  const [consentInvoice, setConsentInvoice] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Order / polling
  const idemRef = useRef<string>("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [result, setResult] = useState<"success" | "fail" | "timeout" | null>(
    null,
  );
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);

  function beginForm(prefill: Prefill, taxPath: TaxPath) {
    idemRef.current = crypto.randomUUID();
    setPath(taxPath);
    setForm({ ...prefill, email: userEmail });
    setConsentInvoice(false);
    setConsentPrivacy(false);
    setFormError(null);
    setStep("form");
  }

  async function validateVat() {
    if (vatChecking) return;
    setVatFeedback(null);
    setVatChecking(true);
    try {
      const res = await fetch("/api/vies-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vatId: vatInput }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        status?: string;
        vatId?: string;
        name?: string;
        country?: string;
        street?: string;
        postalCode?: string;
        city?: string;
      };
      if (res.status === 429 || data.status === "rate_limited") {
        setVatFeedback({ kind: "error", text: t.vat.rateLimited });
      } else if (data.status === "valid") {
        beginForm(
          {
            vatId: data.vatId ?? "",
            siren: "",
            name: data.name ?? "",
            country: data.country ?? "",
            street: data.street ?? "",
            postalCode: data.postalCode ?? "",
            city: data.city ?? "",
          },
          "vat",
        );
      } else if (data.status === "invalid_format") {
        setVatFeedback({ kind: "error", text: t.vat.invalidFormat });
      } else if (data.status === "unavailable") {
        setVatFeedback({ kind: "error", text: t.vat.unavailable });
      } else {
        setVatFeedback({ kind: "error", text: t.vat.invalid });
      }
    } catch {
      setVatFeedback({ kind: "error", text: t.vat.unavailable });
    } finally {
      setVatChecking(false);
    }
  }

  async function validateSiren() {
    if (sirenChecking) return;
    setSirenFeedback(null);
    setSirenChecking(true);
    try {
      const res = await fetch("/api/siren-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siren: sirenInput }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        status?: string;
        name?: string;
        country?: string;
        street?: string;
        postalCode?: string;
        city?: string;
      };
      if (res.status === 429 || data.status === "rate_limited") {
        setSirenFeedback({ kind: "error", text: t.siren.rateLimited });
      } else if (data.status === "valid") {
        beginForm(
          {
            vatId: "",
            siren: sirenInput,
            name: data.name ?? "",
            country: data.country ?? "FR",
            street: data.street ?? "",
            postalCode: data.postalCode ?? "",
            city: data.city ?? "",
          },
          "siren",
        );
      } else if (data.status === "invalid_format") {
        setSirenFeedback({ kind: "error", text: t.siren.invalidFormat });
      } else if (data.status === "closed") {
        setSirenFeedback({ kind: "error", text: t.siren.closed });
      } else if (data.status === "unavailable") {
        setSirenFeedback({ kind: "error", text: t.siren.unavailable });
      } else {
        setSirenFeedback({ kind: "error", text: t.siren.invalid });
      }
    } catch {
      setSirenFeedback({ kind: "error", text: t.siren.unavailable });
    } finally {
      setSirenChecking(false);
    }
  }

  const taxIdComplete =
    path === "vat" ? form.vatId.trim() !== "" : form.siren.trim() !== "";

  const formComplete =
    form.name.trim() !== "" &&
    form.street.trim() !== "" &&
    form.postalCode.trim() !== "" &&
    form.city.trim() !== "" &&
    form.country.trim() !== "" &&
    form.email.trim() !== "" &&
    taxIdComplete &&
    consentInvoice &&
    consentPrivacy;

  async function submitOrder() {
    if (!formComplete || submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idemRef.current,
          path,
          vatId: path === "vat" ? form.vatId : undefined,
          siren: path === "siren" ? form.siren : undefined,
          buyerName: form.name,
          buyerEmail: form.email,
          buyerCountry: form.country,
          buyerStreet: form.street,
          buyerPostalCode: form.postalCode,
          buyerCity: form.city,
          consentInvoice,
          consentPrivacy,
          lang,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
      };
      if (res.ok && data.id) {
        setOrderId(data.id);
        setResult(null);
        setInvoiceNumber(null);
        setStep("processing");
      } else if (data.error === "vies_unavailable") {
        setFormError(t.vat.unavailable);
      } else {
        setFormError(t.genericError);
      }
    } catch {
      setFormError(t.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  // Poll order status every 2s, up to ~30s.
  useEffect(() => {
    if (step !== "processing" || !orderId) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 15;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      attempts += 1;
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = (await res.json().catch(() => ({}))) as {
          status?: string;
          invoiceNumber?: string | null;
        };
        if (cancelled) return;
        if (data.status === "issued") {
          setInvoiceNumber(data.invoiceNumber ?? null);
          setResult("success");
          setStep("done");
          return;
        }
        if (data.status === "failed") {
          setResult("fail");
          setStep("done");
          return;
        }
      } catch {
        /* transient — keep polling */
      }
      if (cancelled) return;
      if (attempts >= maxAttempts) {
        setResult("timeout");
        setStep("done");
        return;
      }
      timer = setTimeout(tick, 2000);
    }

    timer = setTimeout(tick, 2000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [step, orderId]);

  function startOver() {
    setStep("choose");
    setVatInput("");
    setVatFeedback(null);
    setSirenInput("");
    setSirenFeedback(null);
    setOrderId(null);
    setResult(null);
    setInvoiceNumber(null);
  }

  if (alreadyPremium) {
    return (
      <div className="upg">
        <h1 className="upg-title">{t.pageTitle}</h1>
        <p className="upg-note">{t.alreadyPremium}</p>
      </div>
    );
  }

  return (
    <div className="upg">
      <h1 className="upg-title">{t.pageTitle}</h1>

      {step === "choose" && (
        <>
          <p className="upg-intro">{t.intro}</p>
          {!service && (
            <p className="upg-feedback upg-feedback--error">
              {t.unavailableService}
            </p>
          )}

          <div className="upg-columns">
            {/* Left — SIREN (no EU VAT) */}
            <section className="upg-col">
              <h2 className="upg-col-title">{t.siren.title}</h2>
              <p className="upg-col-subtitle">{t.siren.subtitle}</p>
              <p className="upg-col-price">{t.siren.priceNote}</p>
              <div className="upg-inputrow">
                <input
                  type="text"
                  className="upg-input"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder={t.siren.placeholder}
                  value={sirenInput}
                  disabled={sirenChecking}
                  onChange={(e) => {
                    setSirenInput(e.target.value.replace(/\D/g, ""));
                    setSirenFeedback(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") validateSiren();
                  }}
                />
                <button
                  type="button"
                  className="upg-btn"
                  onClick={validateSiren}
                  disabled={sirenChecking || sirenInput.trim() === ""}
                >
                  {sirenChecking ? t.siren.validating : t.siren.button}
                </button>
              </div>
              {sirenFeedback && (
                <p
                  className={`upg-feedback upg-feedback--${sirenFeedback.kind}`}
                >
                  {sirenFeedback.text}
                </p>
              )}
            </section>

            {/* Right — VAT-EU */}
            <section className="upg-col upg-col--vat">
              <h2 className="upg-col-title">{t.vat.title}</h2>
              <p className="upg-col-subtitle">{t.vat.subtitle}</p>
              <p className="upg-col-price">{t.vat.priceNote}</p>
              <div className="upg-inputrow">
                <input
                  type="text"
                  className="upg-input"
                  autoComplete="off"
                  placeholder={t.vat.placeholder}
                  value={vatInput}
                  disabled={vatChecking}
                  onChange={(e) => {
                    setVatInput(e.target.value.toUpperCase());
                    setVatFeedback(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") validateVat();
                  }}
                />
                <button
                  type="button"
                  className="upg-btn upg-btn--primary"
                  onClick={validateVat}
                  disabled={vatChecking || vatInput.trim() === ""}
                >
                  {vatChecking ? t.vat.validating : t.vat.button}
                </button>
              </div>
              {vatFeedback && (
                <p className={`upg-feedback upg-feedback--${vatFeedback.kind}`}>
                  {vatFeedback.text}
                </p>
              )}
            </section>
          </div>
        </>
      )}

      {step === "form" && (
        <div className="upg-form-wrap">
          <button type="button" className="upg-back" onClick={startOver}>
            {t.form.back}
          </button>
          <p className="upg-form-subtitle">{t.form.leadTitle}</p>
          <ol className="upg-form-points">
            {t.form.leadPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ol>

          <form
            className="upg-form"
            onSubmit={(e) => {
              e.preventDefault();
              submitOrder();
            }}
          >
            <p className="upg-prefill-note">{t.form.prefillNote}</p>

            <label className="upg-field">
              <span className="upg-label">{t.form.nameLabel}</span>
              <input
                className="upg-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>

            <label className="upg-field">
              <span className="upg-label">{t.form.streetLabel}</span>
              <input
                className="upg-input"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                required
              />
            </label>

            <div className="upg-row">
              <label className="upg-field">
                <span className="upg-label">{t.form.postalLabel}</span>
                <input
                  className="upg-input"
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm({ ...form, postalCode: e.target.value })
                  }
                  required
                />
              </label>
              <label className="upg-field">
                <span className="upg-label">{t.form.cityLabel}</span>
                <input
                  className="upg-input"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  required
                />
              </label>
              <label className="upg-field upg-field--country">
                <span className="upg-label">{t.form.countryLabel}</span>
                <input
                  className="upg-input"
                  value={form.country}
                  maxLength={2}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value.toUpperCase() })
                  }
                  required
                />
              </label>
            </div>

            {path === "vat" ? (
              <label className="upg-field">
                <span className="upg-label">{t.form.vatLabel}</span>
                <input
                  className="upg-input"
                  value={form.vatId}
                  onChange={(e) =>
                    setForm({ ...form, vatId: e.target.value.toUpperCase() })
                  }
                  required
                />
              </label>
            ) : (
              <label className="upg-field">
                <span className="upg-label">{t.form.sirenLabel}</span>
                <input
                  className="upg-input"
                  value={form.siren}
                  inputMode="numeric"
                  maxLength={9}
                  onChange={(e) =>
                    setForm({ ...form, siren: e.target.value.replace(/\D/g, "") })
                  }
                  required
                />
              </label>
            )}

            <label className="upg-field">
              <span className="upg-label">{t.form.emailLabel}</span>
              <span className="upg-label-note">{t.form.emailNote}</span>
              <input
                className="upg-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>

            <label className="upg-check">
              <input
                type="checkbox"
                checked={consentInvoice}
                onChange={(e) => setConsentInvoice(e.target.checked)}
              />
              <span>
                {path === "vat" ? t.form.consentInvoiceVat : t.form.consentInvoiceSiren}
              </span>
            </label>

            <label className="upg-check">
              <input
                type="checkbox"
                checked={consentPrivacy}
                onChange={(e) => setConsentPrivacy(e.target.checked)}
              />
              <span>
                {t.form.consentPrivacyBefore}
                <a href={privacyHref} target="_blank" rel="noopener noreferrer">
                  {t.form.consentPrivacyLink}
                </a>
                {t.form.consentPrivacyAfter}
              </span>
            </label>

            {formError && (
              <p className="upg-feedback upg-feedback--error">{formError}</p>
            )}

            <button
              type="submit"
              className="upg-submit"
              disabled={!formComplete || submitting}
            >
              {submitting ? t.form.submitting : t.form.submit}
            </button>
          </form>
        </div>
      )}

      {step === "processing" && (
        <div className="upg-status">
          <div className="upg-spinner" aria-hidden="true" />
          <p className="upg-status-text">{t.result.processing}</p>
        </div>
      )}

      {step === "done" && (
        <div className="upg-status">
          {result === "success" && (
            <>
              <h2 className="upg-status-title upg-status-title--ok">
                {t.result.successTitle}
              </h2>
              <p className="upg-status-text">
                {invoiceNumber
                  ? t.result.successBody(invoiceNumber)
                  : t.result.successNoNumber}
              </p>
            </>
          )}
          {result === "timeout" && (
            <>
              <h2 className="upg-status-title upg-status-title--ok">
                {t.result.successTitle}
              </h2>
              <p className="upg-status-text">{t.result.timeout}</p>
            </>
          )}
          {result === "fail" && (
            <>
              <h2 className="upg-status-title upg-status-title--fail">
                {t.result.failTitle}
              </h2>
              <p className="upg-status-text">{t.result.failBody}</p>
              <button type="button" className="upg-btn" onClick={startOver}>
                {t.result.startOver}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
