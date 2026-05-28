import { useEffect, useRef, useState } from "react";
import "./DatePicker.css";

interface Props {
  value: string; // "YYYY-MM-DD" or ""
  onChange: (v: string) => void;
  lang: "en" | "fr";
  ariaLabel?: string;
  disabled?: boolean;
  min?: string; // "YYYY-MM-DD" — disables earlier days
}

const MONTHS = {
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
  fr: [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ],
} as const;

// Week starts on Monday (both locales)
const WEEKDAYS = {
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
  fr: ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"],
} as const;

const PLACEHOLDER = { en: "Select a date", fr: "Choisir une date" } as const;
const CLEAR = { en: "Clear", fr: "Effacer" } as const;
const TODAY = { en: "Today", fr: "Aujourd'hui" } as const;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toISO(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseISO(v: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!match) return null;
  return {
    y: parseInt(match[1], 10),
    m: parseInt(match[2], 10) - 1,
    d: parseInt(match[3], 10),
  };
}

function formatDisplay(v: string, lang: "en" | "fr"): string {
  const p = parseISO(v);
  if (!p) return "";
  return `${p.d} ${MONTHS[lang][p.m].slice(0, 3)} ${p.y}`;
}

// Monday-based weekday index (0 = Monday … 6 = Sunday)
function mondayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export default function DatePicker({
  value,
  onChange,
  lang,
  ariaLabel,
  disabled,
  min,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const selected = parseISO(value);

  // Month/year currently shown in the calendar grid
  const [viewYear, setViewYear] = useState(
    selected?.y ?? today.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    selected?.m ?? today.getMonth(),
  );

  // Re-sync the visible month when value changes externally
  useEffect(() => {
    const p = parseISO(value);
    if (p) {
      setViewYear(p.y);
      setViewMonth(p.m);
    }
  }, [value]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const firstWeekday = mondayIndex(new Date(viewYear, viewMonth, 1).getDay());
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const minP = min ? parseISO(min) : null;

  function isDisabledDay(d: number): boolean {
    if (!minP) return false;
    const iso = toISO(viewYear, viewMonth, d);
    return iso < min!;
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function selectDay(d: number) {
    if (isDisabledDay(d)) return;
    onChange(toISO(viewYear, viewMonth, d));
    setOpen(false);
  }

  function selectToday() {
    const iso = toISO(today.getFullYear(), today.getMonth(), today.getDate());
    if (min && iso < min) return;
    onChange(iso);
    setOpen(false);
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const display = formatDisplay(value, lang);

  return (
    <div className="dp" ref={rootRef}>
      <button
        type="button"
        className={`dp-trigger${value ? " dp-trigger--filled" : ""}`}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="dp-trigger__text">
          {display || PLACEHOLDER[lang]}
        </span>
        <svg
          className="dp-trigger__icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <rect x="3" y="4.5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 9h18M8 2.5v4M16 2.5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="dp-popover" role="dialog" aria-label={ariaLabel}>
          <div className="dp-head">
            <button
              type="button"
              className="dp-nav"
              aria-label={lang === "fr" ? "Mois précédent" : "Previous month"}
              onClick={prevMonth}
            >
              ‹
            </button>
            <span className="dp-title">
              {MONTHS[lang][viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              className="dp-nav"
              aria-label={lang === "fr" ? "Mois suivant" : "Next month"}
              onClick={nextMonth}
            >
              ›
            </button>
          </div>

          <div className="dp-weekdays">
            {WEEKDAYS[lang].map((w) => (
              <span key={w} className="dp-weekday">
                {w}
              </span>
            ))}
          </div>

          <div className="dp-grid">
            {cells.map((d, i) => {
              if (d === null) return <span key={`e${i}`} className="dp-cell dp-cell--empty" />;
              const iso = toISO(viewYear, viewMonth, d);
              const isSelected = value === iso;
              const isToday =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth &&
                today.getDate() === d;
              const off = isDisabledDay(d);
              return (
                <button
                  key={d}
                  type="button"
                  className={`dp-cell${isSelected ? " dp-cell--selected" : ""}${isToday ? " dp-cell--today" : ""}`}
                  disabled={off}
                  onClick={() => selectDay(d)}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="dp-foot">
            <button type="button" className="dp-foot-btn" onClick={selectToday}>
              {TODAY[lang]}
            </button>
            {value && (
              <button
                type="button"
                className="dp-foot-btn dp-foot-btn--clear"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                {CLEAR[lang]}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
