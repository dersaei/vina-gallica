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
    note: "Bank transfer, payable within 30 days. Use the payment reference so we can match your payment.",
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
    note: "Virement bancaire, à régler sous 30 jours. Indiquez la référence de paiement pour que nous puissions rapprocher votre versement.",
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
          <p className="pay-note">{t.note}</p>
        </>
      ) : (
        <p className="pay-note">{t.fallback}</p>
      )}
    </div>
  );
}
