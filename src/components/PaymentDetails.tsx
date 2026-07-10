import { useState } from "react";
import "./PaymentDetails.css";

type Lang = "en" | "fr";

export interface PaymentInfo {
  payeeName: string | null;
  iban: string | null;
  bic: string | null;
  amountLabel: string;
}

interface Props {
  lang: Lang;
  payment: PaymentInfo;
  reference: string | null;
  /** Optional heading; omit to render the rows without a title. */
  title?: string;
  /** Drop the card chrome (border/shadow/bg) so it blends into a parent card. */
  flat?: boolean;
  /** Concrete due date (already localized). When set, replaces the generic
   *  "within your 30-day trial" phrasing with "please pay by <date>". */
  dueLabel?: string;
}

const COPY = {
  en: {
    heading: "Payment details",
    amount: "Amount",
    payee: "Beneficiary",
    iban: "IBAN",
    bic: "BIC / SWIFT",
    reference: "Payment reference",
    copy: "Copy",
    copied: "Copied",
    copyAll: "Copy all details",
    payBy: (d: string) => `Bank transfer — please pay by ${d}.`,
    payWithin: "Bank transfer, payable within your 30-day trial.",
    useReference:
      "Use the payment reference (your invoice number) as the transfer title, so we can match your payment.",
    fallback:
      "Your full payment details are on the pro-forma invoice we emailed you.",
  },
  fr: {
    heading: "Coordonnées de paiement",
    amount: "Montant",
    payee: "Bénéficiaire",
    iban: "IBAN",
    bic: "BIC / SWIFT",
    reference: "Référence de paiement",
    copy: "Copier",
    copied: "Copié",
    copyAll: "Tout copier",
    payBy: (d: string) => `Virement bancaire — à régler avant le ${d}.`,
    payWithin: "Virement bancaire, à régler pendant votre essai de 30 jours.",
    useReference:
      "Indiquez la référence de paiement (votre numéro de facture) comme libellé du virement, pour que nous puissions le rapprocher.",
    fallback:
      "Vos coordonnées de paiement complètes figurent sur la facture proforma envoyée par e-mail.",
  },
} as const;

/** IBAN is grouped in blocks of 4 for readability; copy uses the compact form. */
function formatIban(iban: string): string {
  return iban.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}

export default function PaymentDetails({
  lang,
  payment,
  reference,
  title,
  flat = false,
  dueLabel,
}: Props) {
  const t = COPY[lang];
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const ibanCompact = payment.iban ? payment.iban.replace(/\s+/g, "") : null;

  const rows: { key: string; label: string; display: string; value: string }[] =
    [];
  rows.push({
    key: "amount",
    label: t.amount,
    display: payment.amountLabel,
    value: payment.amountLabel,
  });
  if (payment.payeeName)
    rows.push({
      key: "payee",
      label: t.payee,
      display: payment.payeeName,
      value: payment.payeeName,
    });
  if (ibanCompact)
    rows.push({
      key: "iban",
      label: t.iban,
      display: formatIban(ibanCompact),
      value: ibanCompact,
    });
  if (payment.bic)
    rows.push({
      key: "bic",
      label: t.bic,
      display: payment.bic,
      value: payment.bic,
    });
  if (reference)
    rows.push({
      key: "reference",
      label: t.reference,
      display: reference,
      value: reference,
    });

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(
        () => setCopiedKey((k) => (k === key ? null : k)),
        1800,
      );
    } catch {
      /* clipboard blocked — the value is still visible to select manually */
    }
  }

  function copyAll() {
    const lines = rows.map((r) => `${r.label}: ${r.value}`);
    void copy("all", lines.join("\n"));
  }

  const hasBank = Boolean(ibanCompact);

  const dueSentence = dueLabel ? t.payBy(dueLabel) : t.payWithin;
  const noteText = reference ? `${dueSentence} ${t.useReference}` : dueSentence;

  return (
    <div className={`pay${flat ? " pay--flat" : ""}`}>
      {title !== undefined ? (
        <h3 className="pay-title">{title || t.heading}</h3>
      ) : null}

      <dl className="pay-rows">
        {rows.map((r) => (
          <div className="pay-row" key={r.key}>
            <dt className="pay-label">{r.label}</dt>
            <dd className="pay-value">
              <span className="pay-value-text">{r.display}</span>
              <button
                type="button"
                className={`pay-copy${copiedKey === r.key ? " pay-copy--done" : ""}`}
                onClick={() => copy(r.key, r.value)}
                aria-label={`${t.copy} — ${r.label}`}
              >
                {copiedKey === r.key ? t.copied : t.copy}
              </button>
            </dd>
          </div>
        ))}
      </dl>

      {hasBank ? (
        <>
          <button type="button" className="pay-copyall" onClick={copyAll}>
            {copiedKey === "all" ? t.copied : t.copyAll}
          </button>
          <p className="pay-note">{noteText}</p>
        </>
      ) : (
        <p className="pay-note">{t.fallback}</p>
      )}
    </div>
  );
}
