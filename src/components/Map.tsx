import { useRef, useEffect, useState, type CSSProperties } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { mapOpenIcon } from "./mapOpenIcon";
import "./Map.css";

export interface CategoryData {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface PlaceData {
  slug: string;
  name: string;
  address: string;
  postalCode: string;
  townName: string;
  phone: string;
  website: string;
  logoUrl: string;
  categoryName: string;
  categoryColor: string;
  eventDates: string;
  deptName: string;
  deptColor: string;
  adminRegionName: string;
  adminRegionColor: string;
  wineRegionName: string;
  wineRegionColor: string;
}

interface Props {
  geojsonData: string;
  categories: CategoryData[];
  onOpenPanel: (place: PlaceData) => void;
  lang?: "en" | "fr";
}

// GeoJSON properties are flat strings, so the full wine-region list is carried
// as a JSON string. Decode it defensively (popup HTML must never throw).
function parseRegions(raw: string): { region: string; color: string }[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as { region: string; color: string }[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function Map({
  geojsonData,
  categories,
  onOpenPanel,
  lang = "en",
}: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const popupCategoryRef = useRef<string | null>(null);
  const allFeaturesRef = useRef<GeoJSON.Feature[]>([]);
  const geocoderContainerRef = useRef<HTMLDivElement | null>(null);

  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    () => new Set(categories.map((c) => c.id)),
  );

  // Map initialization — runs once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = import.meta.env.PUBLIC_MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [2.0, 46.2],
      zoom: 4.8,
      language: lang,
    });

    mapRef.current = map;

    if (window.innerWidth >= 600) {
      map.addControl(new mapboxgl.NavigationControl(), "bottom-right");
    }

    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: true,
      maxWidth: "300px",
    });

    map.on("load", () => {
      const geojson = JSON.parse(geojsonData) as GeoJSON.FeatureCollection;
      allFeaturesRef.current = geojson.features;

      map.addSource("places", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 10,
        clusterRadius: 40,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#0c0e0b",
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 28],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffd700",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "places",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 11,
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
        },
        paint: {
          "text-color": "#ffd700",
        },
      });

      map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "places",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 7,
          "circle-color": ["get", "categoryColor"],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      });

      map.on("click", "clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterId = features[0]?.properties?.cluster_id as
          | number
          | undefined;
        if (clusterId === undefined) return;
        (
          map.getSource("places") as mapboxgl.GeoJSONSource
        ).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom === null) return;
          const geom = features[0].geometry as GeoJSON.Point;
          map.easeTo({ center: geom.coordinates as [number, number], zoom });
        });
      });

      type SingleProps = {
        name: string;
        slug: string;
        address: string;
        postalCode: string;
        townName: string;
        categoryId: string;
        categoryName: string;
        categoryColor: string;
        wineRegionName: string;
        wineRegionColor: string;
        wineRegions: string;
        deptName: string;
        deptColor: string;
        adminRegionName: string;
        adminRegionColor: string;
      };

      const openSvg = mapOpenIcon(lang ?? "en");

      function buildSinglePopupHtml(p: SingleProps) {
        const locationTags = [
          p.deptName
            ? { name: p.deptName, color: p.deptColor || "#888" }
            : null,
          p.adminRegionName
            ? { name: p.adminRegionName, color: p.adminRegionColor || "#888" }
            : null,
        ].filter(Boolean) as { name: string; color: string }[];
        const regions = parseRegions(p.wineRegions);
        return `
          <div class="map-popup">
            ${regions.length ? `<div class="map-popup__region">${regions.map((r) => `<span class="map-popup__region-line" style="background-color:${r.color || "#888"}">${r.region}</span>`).join("")}</div>` : ""}
            <div class="map-popup__body">
              <p class="map-popup__name">${p.name}</p>
              ${p.address || p.postalCode || p.townName ? `<p class="map-popup__address">${[p.address, [p.postalCode, p.townName].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</p>` : ""}
              ${locationTags.length ? `<div class="map-popup__tags">${locationTags.map((t) => `<span class="map-popup__tag-location" style="--loc-color:${t.color}">${t.name}</span>`).join("")}</div>` : ""}
              <div class="map-popup__footer">
                ${p.categoryName ? `<span class="map-popup__category" style="background-color:${p.categoryColor || "#888"}">${p.categoryName}</span>` : ""}
                <button class="map-popup__open-btn" type="button" aria-label="Open place panel" data-slug="${p.slug}">${openSvg}</button>
              </div>
            </div>
          </div>`;
      }

      function buildMultiPopupHtml(places: SingleProps[]) {
        const rows = places
          .map(
            (p) => `
          <div class="map-popup__multi-item">
            ${(() => {
              const rs = parseRegions(p.wineRegions);
              return rs.length
                ? `<div class="map-popup__multi-regions">${rs.map((r) => `<div class="map-popup__multi-region" style="--region-color:${r.color || "#888"}" title="${r.region}"></div>`).join("")}</div>`
                : "";
            })()}
            <div class="map-popup__multi-row">
              ${p.categoryName ? `<span class="map-popup__category" style="background-color:${p.categoryColor || "#888"}">${p.categoryName}</span>` : ""}
              <span class="map-popup__multi-name">${p.name}</span>
              <button class="map-popup__open-btn map-popup__open-btn--sm" type="button" aria-label="Open place panel" data-slug="${p.slug}">${openSvg}</button>
            </div>
          </div>`,
          )
          .join("");
        return `<div class="map-popup map-popup--multi"><div class="map-popup__body">${rows}</div></div>`;
      }

      map.on("click", "unclustered-point", (e) => {
        if (!e.point) return;

        // query a small bbox to catch overlapping points at the same coords
        const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [
          [e.point.x - 6, e.point.y - 6],
          [e.point.x + 6, e.point.y + 6],
        ];
        const features = map.queryRenderedFeatures(bbox, {
          layers: ["unclustered-point"],
        });
        if (!features.length) return;

        // deduplicate by slug (same point may appear twice in rendered features)
        const seen = new Set<string>();
        const unique = features.filter((f) => {
          const slug = (f.properties as { slug: string }).slug;
          if (seen.has(slug)) return false;
          seen.add(slug);
          return true;
        });

        const geom = unique[0].geometry as GeoJSON.Point;
        const coords = geom.coordinates as [number, number];

        if (unique.length === 1) {
          const p = unique[0].properties as SingleProps;
          popupCategoryRef.current = p.categoryId ?? null;
          popupRef
            .current!.setLngLat(coords)
            .setHTML(buildSinglePopupHtml(p))
            .addTo(map);
        } else {
          const places = unique.map((f) => f.properties as SingleProps);
          popupCategoryRef.current = null;
          popupRef
            .current!.setLngLat(coords)
            .setHTML(buildMultiPopupHtml(places))
            .addTo(map);
        }
      });

      map.on("mouseenter", "unclustered-point", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "unclustered-point", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      // Delegate clicks on popup open-btn (raw HTML, not React)
      mapContainerRef.current!.addEventListener("click", (e) => {
        const btn = (e.target as Element).closest<HTMLButtonElement>(
          ".map-popup__open-btn",
        );
        if (!btn) return;
        const slug = btn.dataset.slug;
        if (!slug) return;
        const feature = allFeaturesRef.current.find(
          (f) => (f.properties as { slug: string }).slug === slug,
        );
        if (!feature) return;
        const p = feature.properties as {
          slug: string;
          name: string;
          address: string;
          postalCode: string;
          townName: string;
          phone: string;
          website: string;
          logoUrl: string;
          categoryName: string;
          categoryColor: string;
          eventDates: string;
          deptName: string;
          deptColor: string;
          adminRegionName: string;
          adminRegionColor: string;
          wineRegionName: string;
          wineRegionColor: string;
        };
        onOpenPanel({
          slug: p.slug,
          name: p.name,
          address: p.address ?? "",
          postalCode: p.postalCode ?? "",
          townName: p.townName ?? "",
          phone: p.phone ?? "",
          website: p.website ?? "",
          logoUrl: p.logoUrl ?? "",
          categoryName: p.categoryName ?? "",
          categoryColor: p.categoryColor ?? "",
          eventDates: p.eventDates ?? "",
          deptName: p.deptName ?? "",
          deptColor: p.deptColor ?? "",
          adminRegionName: p.adminRegionName ?? "",
          adminRegionColor: p.adminRegionColor ?? "",
          wineRegionName: p.wineRegionName ?? "",
          wineRegionColor: p.wineRegionColor ?? "",
        });
      });
    });

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl as never,
      language: lang,
      placeholder: lang === "fr" ? "Rechercher un lieu…" : "Search places…",
      marker: false,
      flyTo: { speed: 1.4, curve: 1 },
    });

    if (geocoderContainerRef.current) {
      geocoderContainerRef.current.appendChild(geocoder.onAdd(map));

      const input =
        geocoderContainerRef.current.querySelector<HTMLInputElement>(
          ".mapboxgl-ctrl-geocoder--input",
        );

      if (input) {
        // po wyborze miejsca — przesuń kursor na koniec tekstu
        geocoder.on("result", () => {
          requestAnimationFrame(() => {
            const len = input.value.length;
            input.setSelectionRange(len, len);
          });
        });

        // kliknięcie w input — zaznacz cały tekst żeby można go od razu nadpisać
        input.addEventListener("click", () => {
          input.select();
        });
      }

      // mobile: rozwijanie/zwijanie
      const container = geocoderContainerRef.current;
      const getInput = () =>
        container.querySelector<HTMLInputElement>(
          ".mapboxgl-ctrl-geocoder--input",
        );

      // dotknięcie/kliknięcie kontenera gdy zwinięty → focusuj input
      container.addEventListener("pointerdown", (e) => {
        if (!container.classList.contains("is-expanded")) {
          e.preventDefault(); // zapobiega utracie focusu przez inne elementy
          container.classList.add("is-expanded");
          requestAnimationFrame(() => getInput()?.focus());
        }
      });

      container.addEventListener("focusin", () => {
        container.classList.add("is-expanded");
      });
      container.addEventListener("focusout", () => {
        // opóźnienie: dajemy czas na mousedown/touchstart na sugestii zanim sprawdzimy focus
        setTimeout(() => {
          if (!container.contains(document.activeElement)) {
            container.classList.remove("is-expanded");
          }
        }, 200);
      });
    }

    return () => {
      geocoder.onRemove();
      popupRef.current?.remove();
      mapRef.current?.remove();
    };
  }, []);

  // Category filter — update source data so clusters also respect active categories
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const activeIds = new Set(activeCategories);
    const filtered = allFeaturesRef.current.filter((f) =>
      activeIds.has((f.properties as { categoryId: string }).categoryId),
    );

    (map.getSource("places") as mapboxgl.GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: filtered,
    });
  }, [activeCategories]);

  function toggleCategory(id: string) {
    if (popupCategoryRef.current === id) {
      popupRef.current?.remove();
      popupCategoryRef.current = null;
    }
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="map-root">
      <div className="map-container-wrap">
        <div ref={mapContainerRef} className="map-container" />
        <div ref={geocoderContainerRef} className="map-search" />
      </div>
      <div className="cat-filter-bar">
        <div className="cat-filter-buttons">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`cat-btn${activeCategories.has(cat.id) ? " active" : ""}`}
              style={{ "--btn-color": cat.color } as CSSProperties}
              onClick={() => toggleCategory(cat.id)}
              type="button"
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
