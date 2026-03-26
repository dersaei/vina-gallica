import { useRef, useEffect, useState, type CSSProperties } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
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
  wineRegionName: string;
  wineRegionColor: string;
}

interface Props {
  geojsonData: string;
  categories: CategoryData[];
  onOpenPanel: (place: PlaceData) => void;
}

export default function Map({ geojsonData, categories, onOpenPanel }: Props) {
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
        const features = map.queryRenderedFeatures(e.point, { layers: ["clusters"] });
        const clusterId = features[0]?.properties?.cluster_id as number | undefined;
        if (clusterId === undefined) return;
        (map.getSource("places") as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err || zoom === null) return;
            const geom = features[0].geometry as GeoJSON.Point;
            map.easeTo({ center: geom.coordinates as [number, number], zoom });
          },
        );
      });

      map.on("click", "unclustered-point", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const geom = feature.geometry as GeoJSON.Point;
        const coords = geom.coordinates as [number, number];
        const p = feature.properties as {
          name: string;
          slug: string;
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
              ${locationTags.length ? `<div class="map-popup__tags">${locationTags.map((t) => `<span class="map-popup__tag-location" style="--loc-color:${t.color}">${t.name}</span>`).join("")}</div>` : ""}
              <div class="map-popup__footer">
                ${p.categoryName ? `<span class="map-popup__category" style="background-color:${p.categoryColor || "#888"}">${p.categoryName}</span>` : ""}
                <button class="map-popup__open-btn" type="button" aria-label="Open place panel" data-slug="${p.slug}">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 93.74728546 47.86400883" aria-hidden="true" focusable="false"><path d="M92.36347523 20.91257029c-2.85754395-5.97277832-10.07348633-9.45983887-15.7619629-12.11669922C62.16993276 2.05539255 44.06379262-1.20766897 28.1952013.40780955 14.06043568 1.84689646-.93962536 11.03073435.04609241 26.95627146c.33282471 5.3774414 2.38897705 11.07104492 6.43688965 14.75634766 5.91503906 5.38537597 14.51269531 5.86254882 22.09747315 5.86828613.50048828.00036621-.1001587-4.37341309-1.25427246-4.37426758-6.96759034-.00524902-14.82849121-.335083-20.56866455-4.80187988-9.62353516-7.4885254-3.89520264-20.78149414 4.02307128-26.8334961 12.16778565-9.30004882 29.43792725-7.7779541 43.63635254-5.39038085 7.942688 1.33569335 15.78137207 3.50500488 23.09210205 6.91967773 3.27459717 1.52929687 6.48022461 3.28271484 9.44226075 5.36108398 3.24676513 2.27832032 6.18634033 4.26611329 4.33013916 9.30688477-.53271485 1.44665527-1.71661377 2.94433594-2.7128296 4.09179687C77.3090929 44.82858591 57.30073109 43.9047578 41.8535265 43.0815156c-.42858887-.02294922.0579834 4.3104248 1.25427246 4.37426758C58.781505 48.2912324 78.70130482 49.123874 90.08015003 35.99167185c3.79107666-4.37524414 4.80133057-9.8161621 2.2833252-15.07910156"/><path d="M30.68484133 25.43008608c0 4.30859375-3.45410157 7.00097656-7.31689453 7.00097656-3.7138672 0-6.8334961-2.93359375-6.8334961-6.87109375 0-4.04785156 2.61816406-7.40917969 7.07519531-7.40917969 4.54931641 0 7.07519532 3.50976563 7.07519532 7.27929688m-4.30859375.16699219c0-1.4482422-.94677735-2.98925782-2.72949219-2.98925782-1.80126953 0-2.9711914 1.31835938-2.9711914 3.25 0 1.55957032.94677734 3.08203125 2.98974609 3.08203125 1.65283203 0 2.7109375-1.37402343 2.7109375-3.34277343M35.68435305 30.89004702c.03710937 1.48535156-.31591797 1.83789062-1.8569336 1.83789062-1.50439453 0-1.87597656-.35253906-1.91308594-1.85644531l-.25976562-10.12109375c-.03710938-1.39257813.38964844-1.91210938 1.74560547-2.15429688.8725586-.16699218 1.78271484-.22265625 2.7109375-.22265625 3.6772461 0 6.3696289 1.5234375 6.3696289 4.3828125 0 3.32421875-2.32128906 5.64550782-6.87109375 5.84960938zm3.49072265-7.4091797c0-.78027343-.7241211-1.48632812-2.3022461-1.48632812-.50146484 0-1.02148437.07421875-1.44873046.22363282l.09277344 3.32324218c.16748047.0185547.33447265.0185547.48291015.0185547 2.02441407 0 3.17529297-1.09570313 3.17529297-2.07910157M50.54323976 31.8929767l-5.21826171.81640625c-1.46679688.2421875-1.8569336-.09277343-1.93115235-1.5595703l-.53857422-10.3623047c-.07421875-1.50390625.25976563-1.89355468 1.76416016-2.04199218l5.2553711-.50195313c1.48535156-.1484375 1.89404296.18554688 1.89404296 1.671875v.77929688c0 1.5048828-.31591797 1.89453125-1.81982422 2.00585937l-3.75146484.27832031.07470703 1.65332032 3.30517578-.29785157c1.02148438-.09277343 1.37402344.1484375 1.37402344 1.20703125 0 1.04003907-.16699219 1.2998047-1.20703125 1.41210938l-3.2866211.35253906.07421876 1.85644531 3.75097656-.46386718c1.22558594-.1484375 1.59716797.1298828 1.67138672 1.37402343.07421875 1.28125-.16699219 1.63476563-1.41113282 1.8203125M64.47292726 31.39102358c.03759766.91015625-.18554687 1.15136719-1.13232421 1.24414062-.92871094.09277344-1.24462891-.05566406-1.74560547-.85351562l-4.27148438-6.61132813.81738281 5.58984375c.22265625 1.46679688-.09277343 1.875-1.56005859 2.0419922l-1.39257812.16796874c-1.46728516.16699219-1.83837891-.16796875-1.87548829-1.65332031l-.22314453-11.41992188c-.01855468-1.24414062.2788086-1.5048828 1.54150391-1.5048828s1.72705078.29785155 2.46972656 1.29980468l3.15673828 4.30859375-.57568359-4.234375c-.20410156-1.4296875.14892578-1.80078125 1.57861328-1.63378906l.89160156.11132812c1.48535157.16699219 1.8569336.55761719 1.91259766 2.06152344z"/></svg>
                </button>
              </div>
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

      // Delegate clicks on popup open-btn (raw HTML, not React)
      mapContainerRef.current!.addEventListener("click", (e) => {
        const btn = (e.target as Element).closest<HTMLButtonElement>(".map-popup__open-btn");
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
          wineRegionName: string;
          wineRegionColor: string;
        };
        onOpenPanel({
          slug: p.slug,
          name: p.name,
          wineRegionName: p.wineRegionName ?? "",
          wineRegionColor: p.wineRegionColor ?? "",
        });
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
