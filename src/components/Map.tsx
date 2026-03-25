import { useRef, useEffect, useState, type CSSProperties } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.css";

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface Props {
  geojsonData: string;
  categories: CategoryData[];
}

export default function Map({ geojsonData, categories }: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const allFeaturesRef = useRef<GeoJSON.Feature[]>([]);

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
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

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

      map.on("click", "unclustered-point", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const geom = feature.geometry as GeoJSON.Point;
        const coords = geom.coordinates as [number, number];
        const p = feature.properties as {
          name: string;
          address: string;
          townName: string;
          categoryName: string;
          categoryColor: string;
          wineRegionName: string;
          wineRegionColor: string;
          deptName: string;
          deptColor: string;
          adminRegionName: string;
          adminRegionColor: string;
        };
        const locationTags = [
          p.deptName ? { name: p.deptName, color: p.deptColor || "#888" } : null,
          p.adminRegionName ? { name: p.adminRegionName, color: p.adminRegionColor || "#888" } : null,
        ].filter(Boolean) as { name: string; color: string }[];
        const html = `
          <div class="map-popup">
            ${p.wineRegionName ? `<div class="map-popup__region" style="background-color:${p.wineRegionColor || "#888"}">${p.wineRegionName}</div>` : ""}
            <div class="map-popup__body">
              <p class="map-popup__name">${p.name}</p>
              ${(p.address || p.townName) ? `<p class="map-popup__address">${[p.address, p.townName].filter(Boolean).join(", ")}</p>` : ""}
              ${locationTags.length ? `<div class="map-popup__tags">${locationTags.map(t => `<span class="map-popup__tag-location" style="--loc-color:${t.color}">${t.name}</span>`).join("")}</div>` : ""}
              ${p.categoryName ? `<span class="map-popup__category" style="background-color:${p.categoryColor || "#888"}">${p.categoryName}</span>` : ""}
            </div>
          </div>`;
        popupRef.current!.setLngLat(coords).setHTML(html).addTo(map);
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
    });

    return () => {
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
      <div ref={mapContainerRef} className="map-container" />
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
