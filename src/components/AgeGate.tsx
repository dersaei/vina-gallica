import { useState, useEffect } from "react";
import "./AgeGate.css";

const COOKIE_KEY = "vg_age_verified";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

function setVerifiedCookie() {
  document.cookie = `${COOKIE_KEY}=1; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

function isVerified(): boolean {
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${COOKIE_KEY}=`));
}

const copy = {
  en: {
    logo: "Vina Gallica is a guide to the French wine",
    title: "You must be of legal drinking age to enter",
    text: "By entering, you confirm you are of legal drinking age in your country of residence.",
    question: "Are you 21 or older?",
    confirm: "Yes, enter",
    deny: "No",
    disclaimer: "Please drink responsibly.",
  },
  fr: {
    logo: "Vina Gallica est un guide du vin français",
    title: "Vous devez avoir l'âge légal pour consommer de l'alcool",
    text: "En entrant, vous confirmez avoir l'âge légal de consommer de l'alcool dans votre pays de résidence.",
    question: "Avez-vous 18 ans ou plus ?",
    confirm: "Oui, entrer",
    deny: "Non",
    disclaimer: "Veuillez consommer avec modération.",
  },
} as const;

export default function AgeGate({ lang = "en" }: { lang?: "en" | "fr" }) {
  const t = copy[lang];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isVerified()) {
      setVisible(true);
      document.documentElement.classList.add("age-gate-open");
    }
  }, []);

  function confirm() {
    setVerifiedCookie();
    setVisible(false);
    document.documentElement.classList.remove("age-gate-open");
  }

  function deny() {
    window.location.href = "https://www.google.com";
  }

  if (!visible) return null;

  return (
    <div
      className="age-gate-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div className="age-gate-modal">
        <p className="age-gate-logo">{t.logo}</p>
        <h2 id="age-gate-title" className="age-gate-title">{t.title}</h2>
        <p className="age-gate-text">{t.text}</p>
        <p className="age-gate-question">{t.question}</p>
        <div className="age-gate-actions">
          <button className="age-gate-btn age-gate-btn--confirm" onClick={confirm}>
            {t.confirm}
          </button>
          <button className="age-gate-btn age-gate-btn--deny" onClick={deny}>
            {t.deny}
          </button>
        </div>
        <p className="age-gate-disclaimer">{t.disclaimer}</p>
      </div>
    </div>
  );
}
