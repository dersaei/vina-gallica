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

export default function AgeGate() {
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
        <p className="age-gate-logo">
          Vina Gallica is a guide to the French wine
        </p>
        <h2 id="age-gate-title" className="age-gate-title">
          You must be of legal drinking age to enter
        </h2>
        <p className="age-gate-text">
          By entering, you confirm you are of legal drinking age in your country
          of residence.
        </p>
        <p className="age-gate-question">Are you 21 or older?</p>
        <div className="age-gate-actions">
          <button
            className="age-gate-btn age-gate-btn--confirm"
            onClick={confirm}
          >
            Yes, enter
          </button>
          <button className="age-gate-btn age-gate-btn--deny" onClick={deny}>
            No
          </button>
        </div>
        <p className="age-gate-disclaimer">Please drink responsibly.</p>
      </div>
    </div>
  );
}
