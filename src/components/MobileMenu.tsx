import { useState, useEffect, useRef } from "react";
import "./MobileMenu.css";

const navItems = [
  { label: "Directory", href: "/directory" },
  { label: "Map", href: "/map" },
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms-of-service" },
];

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
        aria-label={open ? "Close menu" : "Open menu"}
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
        aria-label="Mobile navigation"
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
