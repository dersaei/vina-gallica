import { useState, useEffect, useRef } from "react";
import "./RegionFilter.css";

interface WineRegion {
  id: string;
  region: string;
  slug: string;
  color: string;
}

interface AdminRegion {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface Department {
  id: string;
  name: string;
  slug: string;
  color: string;
  administrative_region: string;
}

interface Town {
  id: string;
  name: string;
  slug: string;
  department: string;
}

interface Props {
  wineRegions: WineRegion[];
  adminRegions: AdminRegion[];
  departments: Department[];
  towns: Town[];
}

export default function RegionFilter({
  wineRegions,
  adminRegions,
  departments,
  towns,
}: Props) {
  const [openPanel, setOpenPanel] = useState<"wine" | "state" | null>(null);
  const [activeWine, setActiveWine] = useState<string | null>(null);
  const [activeAdmin, setActiveAdmin] = useState<string | null>(null);
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [activeTown, setActiveTown] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape
  useEffect(() => {
    if (!openPanel) return;

    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpenPanel(null);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenPanel(null);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [openPanel]);

  // Dispatch custom event so the Astro page can react
  function dispatchFilter(
    wine: string | null,
    admin: string | null,
    dept: string | null,
    town: string | null,
  ) {
    document.dispatchEvent(
      new CustomEvent("region-filter", { detail: { wine, admin, dept, town } }),
    );
  }

  function selectWine(slug: string | null) {
    const next = activeWine === slug ? null : slug;
    setActiveWine(next);
    dispatchFilter(next, activeAdmin, activeDept, activeTown);
    setOpenPanel(null);
  }

  function selectAdmin(slug: string | null) {
    const next = activeAdmin === slug ? null : slug;
    setActiveAdmin(next);
    setActiveDept(null);
    setActiveTown(null);
    dispatchFilter(activeWine, next, null, null);
    setOpenPanel(null);
  }

  function selectDept(slug: string | null) {
    const next = activeDept === slug ? null : slug;
    setActiveDept(next);
    setActiveAdmin(null);
    setActiveTown(null);
    dispatchFilter(activeWine, null, next, null);
    setOpenPanel(null);
  }

  function selectTown(slug: string | null) {
    const next = activeTown === slug ? null : slug;
    setActiveTown(next);
    setActiveAdmin(null);
    // keep dept active (town is sub-dept)
    const townObj = towns.find((t) => t.slug === slug);
    const deptForTown = townObj ? departments.find((d) => d.id === townObj.department) : null;
    const newDept = deptForTown ? deptForTown.slug : activeDept;
    setActiveDept(next ? newDept : activeDept);
    dispatchFilter(activeWine, null, next ? newDept : activeDept, next);
    setOpenPanel(null);
  }

  const activeWineObj = activeWine
    ? wineRegions.find((w) => w.slug === activeWine)
    : null;
  const activeAdminObj = activeAdmin
    ? adminRegions.find((a) => a.slug === activeAdmin)
    : null;
  const activeDeptObj = activeDept
    ? departments.find((d) => d.slug === activeDept)
    : null;
  const activeTownObj = activeTown
    ? towns.find((t) => t.slug === activeTown)
    : null;

  return (
    <div className="rf-wrap" ref={wrapRef}>
      <span className="rf-label">
        Filter <small>by</small>
      </span>

      <div className="rf-toggle">
        <button
          className={`rf-btn${openPanel === "wine" ? " rf-btn--open" : ""}${activeWine ? " rf-btn--active" : ""}`}
          onClick={() => setOpenPanel(openPanel === "wine" ? null : "wine")}
          type="button"
        >
          Wine Regions
        </button>
        <button
          className={`rf-btn${openPanel === "state" ? " rf-btn--open" : ""}${activeAdmin || activeDept || activeTown ? " rf-btn--active" : ""}`}
          onClick={() => setOpenPanel(openPanel === "state" ? null : "state")}
          type="button"
        >
          Country's Regions
        </button>
      </div>

      <div className="rf-active-tags">
        {activeWineObj && (
          <button
            className="rf-clear"
            style={{ ["--clear-color" as string]: activeWineObj.color }}
            onClick={() => {
              setActiveWine(null);
              dispatchFilter(null, activeAdmin, activeDept, activeTown);
            }}
            type="button"
          >
            {activeWineObj.region} ×
          </button>
        )}
        {activeAdminObj && (
          <button
            className="rf-clear"
            style={{ ["--clear-color" as string]: activeAdminObj.color }}
            onClick={() => {
              setActiveAdmin(null);
              setActiveTown(null);
              dispatchFilter(activeWine, null, null, null);
            }}
            type="button"
          >
            {activeAdminObj.name} ×
          </button>
        )}
        {activeDeptObj && (
          <button
            className="rf-clear"
            style={{ ["--clear-color" as string]: activeDeptObj.color }}
            onClick={() => {
              setActiveDept(null);
              setActiveTown(null);
              dispatchFilter(activeWine, null, null, null);
            }}
            type="button"
          >
            {activeDeptObj.name} ×
          </button>
        )}
        {activeTownObj && (
          <button
            className="rf-clear"
            style={{ ["--clear-color" as string]: activeDeptObj?.color ?? "#888" }}
            onClick={() => {
              setActiveTown(null);
              dispatchFilter(activeWine, activeAdmin, activeDept, null);
            }}
            type="button"
          >
            {activeTownObj.name} ×
          </button>
        )}
      </div>

      {/* Wine Regions panel */}
      <div
        className={`rf-panel${openPanel === "wine" ? " rf-panel--open" : ""}`}
        aria-hidden={openPanel !== "wine" ? "true" : "false"}
      >
        <ul className="rf-list">
          {wineRegions.map((wr) => (
            <li key={wr.slug}>
              <button
                className={`rf-item${activeWine === wr.slug ? " rf-item--active" : ""}`}
                data-color={wr.color}
                style={{ ["--item-color" as string]: wr.color }}
                onClick={() => selectWine(wr.slug)}
                type="button"
              >
                <span className="rf-bullet" />
                {wr.region}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Country's Regions panel */}
      <div
        className={`rf-panel${openPanel === "state" ? " rf-panel--open" : ""}`}
        aria-hidden={openPanel !== "state" ? "true" : "false"}
      >
        <ul className="rf-list">
          {adminRegions.map((ar) => {
            const depts = departments.filter(
              (d) => d.administrative_region === ar.id,
            );
            return (
              <li key={ar.slug} className="rf-group">
                <button
                  className={`rf-item rf-item--region${activeAdmin === ar.slug ? " rf-item--active" : ""}`}
                  style={{ ["--item-color" as string]: ar.color }}
                  onClick={() => selectAdmin(ar.slug)}
                  type="button"
                >
                  <span className="rf-bullet" />
                  {ar.name}
                </button>
                {depts.length > 0 && (
                  <ul className="rf-depts">
                    {depts.map((d) => {
                      const deptTowns = towns.filter((t) => t.department === d.id);
                      return (
                        <li key={d.slug}>
                          <button
                            className={`rf-item rf-item--dept${activeDept === d.slug ? " rf-item--active" : ""}`}
                            style={{ ["--item-color" as string]: d.color }}
                            onClick={() => selectDept(d.slug)}
                            type="button"
                          >
                            {d.name}
                          </button>
                          {deptTowns.length > 0 && (
                            <ul className="rf-towns">
                              {deptTowns.map((t) => (
                                <li key={t.slug}>
                                  <button
                                    className={`rf-item rf-item--town${activeTown === t.slug ? " rf-item--active" : ""}`}
                                    onClick={() => selectTown(t.slug)}
                                    type="button"
                                  >
                                    {t.name}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
