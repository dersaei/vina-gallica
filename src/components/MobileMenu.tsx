import { useState, useEffect, useRef } from "react";
import "./MobileMenu.css";

const navItemsEn = [
  { label: "Directory", href: "/directory" },
  { label: "Map", href: "/map" },
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms-of-service" },
  { label: "Submit", href: "/submit" },
  { label: "Login", href: "/login" },
];

const navItemsFr = [
  { label: "Annuaire", href: "/fr/annuaire" },
  { label: "Carte", href: "/fr/carte" },
  { label: "À propos", href: "/fr/a-propos" },
  { label: "Confidentialité", href: "/fr/politique-de-confidentialite" },
  { label: "CGU", href: "/fr/conditions-generales" },
  { label: "Rejoindre", href: "/fr/rejoindre" },
  { label: "Login", href: "/login" },
];

interface Props {
  lang?: "en" | "fr";
}

export default function MobileMenu({ lang = "en" }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navItems = lang === "fr" ? navItemsFr : navItemsEn;

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="mobile-menu" ref={menuRef}>
      <button
        className={`menu-toggle${open ? " menu-toggle--open" : ""}`}
        onClick={() => setOpen(!open)}
        aria-label={open ? (lang === "fr" ? "Fermer le menu" : "Close menu") : (lang === "fr" ? "Ouvrir le menu" : "Open menu")}
        aria-expanded={open}
        aria-controls="mobile-nav"
        type="button"
      >
        <span className="menu-toggle__label">Menu</span>
        <span className="menu-toggle__bar" aria-hidden="true" />
        <span className="menu-toggle__bar" aria-hidden="true" />
        <span className="menu-toggle__bar" aria-hidden="true" />
      </button>

      <nav
        id="mobile-nav"
        className={`mobile-nav${open ? " mobile-nav--open" : ""}`}
        aria-label={lang === "fr" ? "Navigation mobile" : "Mobile navigation"}
        inert={open ? undefined : true}
      >
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
