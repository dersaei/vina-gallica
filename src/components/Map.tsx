import { useRef, useEffect, useState, type CSSProperties } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
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
}

export default function Map({ geojsonData, categories, onOpenPanel }: Props) {
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

      type SingleProps = {
        name: string; slug: string; address: string; postalCode: string; townName: string;
        categoryId: string; categoryName: string; categoryColor: string;
        wineRegionName: string; wineRegionColor: string;
        deptName: string; deptColor: string; adminRegionName: string; adminRegionColor: string;
      };

      const openSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 93.74728546 47.86400883" aria-hidden="true" focusable="false"><path d="M92.36347523 20.91257029c-2.85754395-5.97277832-10.07348633-9.45983887-15.7619629-12.11669922C62.16993276 2.05539255 44.06379262-1.20766897 28.1952013.40780955 14.06043568 1.84689646-.93962536 11.03073435.04609241 26.95627146c.33282471 5.3774414 2.38897705 11.07104492 6.43688965 14.75634766 5.91503906 5.38537597 14.51269531 5.86254882 22.09747315 5.86828613.50048828.00036621-.1001587-4.37341309-1.25427246-4.37426758-6.96759034-.00524902-14.82849121-.335083-20.56866455-4.80187988-9.62353516-7.4885254-3.89520264-20.78149414 4.02307128-26.8334961 12.16778565-9.30004882 29.43792725-7.7779541 43.63635254-5.39038085 7.942688 1.33569335 15.78137207 3.50500488 23.09210205 6.91967773 3.27459717 1.52929687 6.48022461 3.28271484 9.44226075 5.36108398 3.24676513 2.27832032 6.18634033 4.26611329 4.33013916 9.30688477-.53271485 1.44665527-1.71661377 2.94433594-2.7128296 4.09179687C77.3090929 44.82858591 57.30073109 43.9047578 41.8535265 43.0815156c-.42858887-.02294922.0579834 4.3104248 1.25427246 4.37426758C58.781505 48.2912324 78.70130482 49.123874 90.08015003 35.99167185c3.79107666-4.37524414 4.80133057-9.8161621 2.2833252-15.07910156"/><path d="M30.68484133 25.43008608c0 4.30859375-3.45410157 7.00097656-7.31689453 7.00097656-3.7138672 0-6.8334961-2.93359375-6.8334961-6.87109375 0-4.04785156 2.61816406-7.40917969 7.07519531-7.40917969 4.54931641 0 7.07519532 3.50976563 7.07519532 7.27929688m-4.30859375.16699219c0-1.4482422-.94677735-2.98925782-2.72949219-2.98925782-1.80126953 0-2.9711914 1.31835938-2.9711914 3.25 0 1.55957032.94677734 3.08203125 2.98974609 3.08203125 1.65283203 0 2.7109375-1.37402343 2.7109375-3.34277343M35.68435305 30.89004702c.03710937 1.48535156-.31591797 1.83789062-1.8569336 1.83789062-1.50439453 0-1.87597656-.35253906-1.91308594-1.85644531l-.25976562-10.12109375c-.03710938-1.39257813.38964844-1.91210938 1.74560547-2.15429688.8725586-.16699218 1.78271484-.22265625 2.7109375-.22265625 3.6772461 0 6.3696289 1.5234375 6.3696289 4.3828125 0 3.32421875-2.32128906 5.64550782-6.87109375 5.84960938zm3.49072265-7.4091797c0-.78027343-.7241211-1.48632812-2.3022461-1.48632812-.50146484 0-1.02148437.07421875-1.44873046.22363282l.09277344 3.32324218c.16748047.0185547.33447265.0185547.48291015.0185547 2.02441407 0 3.17529297-1.09570313 3.17529297-2.07910157M50.54323976 31.8929767l-5.21826171.81640625c-1.46679688.2421875-1.8569336-.09277343-1.93115235-1.5595703l-.53857422-10.3623047c-.07421875-1.50390625.25976563-1.89355468 1.76416016-2.04199218l5.2553711-.50195313c1.48535156-.1484375 1.89404296.18554688 1.89404296 1.671875v.77929688c0 1.5048828-.31591797 1.89453125-1.81982422 2.00585937l-3.75146484.27832031.07470703 1.65332032 3.30517578-.29785157c1.02148438-.09277343 1.37402344.1484375 1.37402344 1.20703125 0 1.04003907-.16699219 1.2998047-1.20703125 1.41210938l-3.2866211.35253906.07421876 1.85644531 3.75097656-.46386718c1.22558594-.1484375 1.59716797.1298828 1.67138672 1.37402343.07421875 1.28125-.16699219 1.63476563-1.41113282 1.8203125M64.47292726 31.39102358c.03759766.91015625-.18554687 1.15136719-1.13232421 1.24414062-.92871094.09277344-1.24462891-.05566406-1.74560547-.85351562l-4.27148438-6.61132813.81738281 5.58984375c.22265625 1.46679688-.09277343 1.875-1.56005859 2.0419922l-1.39257812.16796874c-1.46728516.16699219-1.83837891-.16796875-1.87548829-1.65332031l-.22314453-11.41992188c-.01855468-1.24414062.2788086-1.5048828 1.54150391-1.5048828s1.72705078.29785155 2.46972656 1.29980468l3.15673828 4.30859375-.57568359-4.234375c-.20410156-1.4296875.14892578-1.80078125 1.57861328-1.63378906l.89160156.11132812c1.48535157.16699219 1.8569336.55761719 1.91259766 2.06152344z"/></svg>`;

      function buildSinglePopupHtml(p: {
        name: string; slug: string; address: string; postalCode: string; townName: string;
        categoryId: string; categoryName: string; categoryColor: string;
        wineRegionName: string; wineRegionColor: string;
        deptName: string; deptColor: string; adminRegionName: string; adminRegionColor: string;
      }) {
        const locationTags = [
          p.deptName ? { name: p.deptName, color: p.deptColor || "#888" } : null,
          p.adminRegionName ? { name: p.adminRegionName, color: p.adminRegionColor || "#888" } : null,
        ].filter(Boolean) as { name: string; color: string }[];
        return `
          <div class="map-popup">
            ${p.wineRegionName ? `<div class="map-popup__region" style="background-color:${p.wineRegionColor || "#888"}">${p.wineRegionName}</div>` : ""}
            <div class="map-popup__body">
              <p class="map-popup__name">${p.name}</p>
              ${(p.address || p.postalCode || p.townName) ? `<p class="map-popup__address">${[p.address, [p.postalCode, p.townName].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</p>` : ""}
              ${locationTags.length ? `<div class="map-popup__tags">${locationTags.map((t) => `<span class="map-popup__tag-location" style="--loc-color:${t.color}">${t.name}</span>`).join("")}</div>` : ""}
              <div class="map-popup__footer">
                ${p.categoryName ? `<span class="map-popup__category" style="background-color:${p.categoryColor || "#888"}">${p.categoryName}</span>` : ""}
                <button class="map-popup__open-btn" type="button" aria-label="Open place panel" data-slug="${p.slug}">${openSvg}</button>
              </div>
            </div>
          </div>`;
      }

      function buildMultiPopupHtml(places: SingleProps[]) {
        const rows = places.map((p) => `
          <div class="map-popup__multi-item">
            ${p.wineRegionName ? `<div class="map-popup__multi-region" style="--region-color:${p.wineRegionColor || "#888"}" title="${p.wineRegionName}"></div>` : ""}
            <div class="map-popup__multi-row">
              ${p.categoryName ? `<span class="map-popup__category" style="background-color:${p.categoryColor || "#888"}">${p.categoryName}</span>` : ""}
              <span class="map-popup__multi-name">${p.name}</span>
              <button class="map-popup__open-btn map-popup__open-btn--sm" type="button" aria-label="Open place panel" data-slug="${p.slug}">${openSvg}</button>
            </div>
          </div>`).join("");
        return `<div class="map-popup map-popup--multi"><div class="map-popup__body">${rows}</div></div>`;
      }

      map.on("click", "unclustered-point", (e) => {
        if (!e.point) return;

        // query a small bbox to catch overlapping points at the same coords
        const bbox: [mapboxgl.PointLike, mapboxgl.PointLike] = [
          [e.point.x - 6, e.point.y - 6],
          [e.point.x + 6, e.point.y + 6],
        ];
        const features = map.queryRenderedFeatures(bbox, { layers: ["unclustered-point"] });
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
          popupRef.current!.setLngLat(coords).setHTML(buildSinglePopupHtml(p)).addTo(map);
        } else {
          const places = unique.map((f) => f.properties as SingleProps);
          popupCategoryRef.current = null;
          popupRef.current!.setLngLat(coords).setHTML(buildMultiPopupHtml(places)).addTo(map);
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
          address: string;
          postalCode: string;
          townName: string;
          phone: string;
          website: string;
          logoUrl: string;
          categoryName: string;
          categoryColor: string;
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
        language: "en",
        placeholder: "Search places…",
        marker: false,
        flyTo: { speed: 1.4, curve: 1 },
      });

      if (geocoderContainerRef.current) {
        geocoderContainerRef.current.appendChild(geocoder.onAdd(map));

        const input = geocoderContainerRef.current.querySelector<HTMLInputElement>(
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

        // mobile: rozwijanie/zwijanie po focusie
        const container = geocoderContainerRef.current;
        container.addEventListener("focusin", () => {
          container.classList.add("is-expanded");
        });
        container.addEventListener("focusout", (e) => {
          if (!container.contains(e.relatedTarget as Node | null)) {
            container.classList.remove("is-expanded");
          }
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
        <a href="/directory" className="map-directory-link" aria-label="Directory">
          <svg id="uuid-bfd78b79-5935-487e-a944-918afc209c0f" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 206.722462455251843 53.300730757633573">
            <defs>
              <style>{`
                .uuid-d2176016-16fb-4e21-9334-10aa9c1f1dbb{fill:aqua;}
                .uuid-95f983fc-8932-4da5-bd73-b27bd5c3531b{fill:#292529;}
                .uuid-2ee55964-42ae-4339-9094-53c3459cd20c{fill:none;stroke:#231f20;stroke-width:1.50242491050342px;}
              `}</style>
            </defs>
            <g id="uuid-8444b48c-26c7-4ef7-af1e-6b5ba253d6a2">
              <g id="uuid-47bbc16e-8204-4762-9e81-449ac577f535">
                <path className="uuid-d2176016-16fb-4e21-9334-10aa9c1f1dbb" d="M8.722462455251843,47.798072443680212h-3c-1-15,3-29,2-43,28-1,56,0,84,0,38,0,75,2,113,0,2,14,2,29,2,43,0,1-2,2-3,2-20,1-41,0-61,0-45,3-89-2-134-2h0Z"/>
                <path className="uuid-2ee55964-42ae-4339-9094-53c3459cd20c" d="M198.751212455251334,52.275118302382907c-65.339999999999236.979999999999563-130.679999999999382-.979999999999563-196.019999999999527-.979999999999563-.989999999999782,0-1.980000000000473-2.940000000000509-1.980000000000473-3.920000000000073V6.215118302383416c0-.979999999999563.990000000000691-3.920000000000073,1.980000000000473-3.920000000000073,60.390000000000327-3.920000000000073,120.779999999999745.979999999999563,181.170000000000073,0,4.949999999999818-.979999999999563,9.899999999999636-.979999999999563,14.849999999999454-.979999999999563,1.980000000000473,0,4.950000000000728,2.93999999999869,4.950000000000728,4.899999999999636.989999999999782,13.719999999999345.989999999999782,27.43999999999869,0,41.159999999999854,0,1.959999999999127-2.970000000000255,3.920000000000073-4.950000000000728,4.899999999999636h0Z"/>
              </g>
              <path className="uuid-95f983fc-8932-4da5-bd73-b27bd5c3531b" d="M59.148222489585351,18.910377131180212c5.8408203125,0,8.24267578125,3.1103515625,8.24267578125,7.7373046875,0,5.6630859375-3.08447265625,8.267578125-8.4951171875,8.267578125h-4.9306640625v-.7587890625l1.51708984375-.505859375v-13.5771484375l-1.49169921875-.1259765625v-1.037109375h5.15771484375ZM57.960234208335351,19.972877131180212v13.9560546875h.58154296875c4.24755859375,0,6.34619140625-2.275390625,6.34619140625-7.0283203125,0-4.171875-1.5927734375-6.927734375-6.19482421875-6.927734375h-.73291015625Z"/>
              <path className="uuid-95f983fc-8932-4da5-bd73-b27bd5c3531b" d="M72.826933427085351,23.031470881180212v10.8974609375h1.41552734375v.986328125h-4.98095703125v-.7587890625l1.2392578125-.505859375v-9.4814453125l-1.26416015625-.1005859375v-1.037109375h3.59033203125ZM71.537382645835351,18.480689631180212c.83447265625,0,1.5673828125.2783203125,1.5673828125,1.2138671875,0,.91015625-.73291015625,1.1630859375-1.5673828125,1.1630859375s-1.49169921875-.2529296875-1.49169921875-1.1630859375.6826171875-1.2138671875,1.49169921875-1.2138671875Z"/>
              <path className="uuid-95f983fc-8932-4da5-bd73-b27bd5c3531b" d="M82.636503739585351,22.779517756180212c2.0478515625,0,3.236328125.859375,3.236328125,2.4521484375,0,1.33984375-1.08740234375,2.0732421875-1.1884765625,2.0732421875l-1.1630859375-.2529296875c.15185546875-.3037109375.3037109375-.7587890625.3037109375-1.1884765625,0-1.1123046875-.7333984375-1.5673828125-1.56787109375-1.5673828125-.73291015625,0-2.42724609375,1.5419921875-2.42724609375,1.5419921875v8.0908203125h2.755859375v.986328125h-6.32080078125v-.7587890625l1.23876953125-.505859375v-9.4814453125l-1.2890625-.1005859375v-1.037109375h3.28662109375l.17724609375,1.7451171875h.12646484375c1.314453125-1.1630859375,2.65478515625-1.9970703125,2.83154296875-1.9970703125Z"/>
              <path className="uuid-95f983fc-8932-4da5-bd73-b27bd5c3531b" d="M92.825468583335351,22.728736506180212c3.33740234375,0,4.77880859375,2.1240234375,4.77880859375,5.107421875,0,.5048828125-.10107421875.91015625-.10107421875.91015625l-7.78759765625.328125c.15185546875,3.0341796875,1.28955078125,4.677734375,4.12109375,4.677734375,1.2138671875,0,2.376953125-.3291015625,3.0087890625-.7587890625l.2275390625-.1767578125.2529296875.986328125-.2275390625.2275390625c-.50537109375.37890625-1.99755859375,1.1884765625-4.12109375,1.1884765625-3.79248046875,0-5.587890625-2.1240234375-5.587890625-6.2451171875,0-4.171875,2.02294921875-6.2451171875,5.43603515625-6.2451171875ZM89.715605302085351,28.063697443680212l5.61279296875-.2529296875c-.07568359375-2.6806640625-.96044921875-4.0712890625-2.5283203125-4.0712890625-1.87109375,0-3.03369140625,1.2646484375-3.08447265625,4.32421875Z"/>
              <path className="uuid-95f983fc-8932-4da5-bd73-b27bd5c3531b" d="M104.809843583335351,22.728736506180212c3.3876953125,0,4.525390625,1.6181640625,4.525390625,2.9580078125,0,.859375-.353515625,1.44140625-1.0107421875,1.6181640625l-1.39111328125-.2021484375c.12646484375-.3291015625.17724609375-.7080078125.17724609375-1.2138671875,0-1.1376953125-.80908203125-2.0986328125-2.275390625-2.0986328125-1.97216796875,0-3.0849609375,1.44140625-3.0849609375,4.5263671875,0,3.2607421875,1.11279296875,5.3095703125,3.767578125,5.3095703125,1.49169921875,0,2.6044921875-.7587890625,3.083984375-1.517578125l.15234375-.2275390625.6826171875.505859375-.126953125.2529296875c-.5302734375,1.0869140625-2.07275390625,2.5791015625-4.67724609375,2.5791015625-3.4130859375,0-5.18310546875-2.2509765625-5.18310546875-6.2705078125,0-3.9697265625,1.99755859375-6.2197265625,5.3603515625-6.2197265625Z"/>
              <path className="uuid-95f983fc-8932-4da5-bd73-b27bd5c3531b" d="M112.848906083335351,23.031470881180212v-2.8564453125l1.7451171875-.7841796875h.5810546875v3.640625h3.0087890625v1.087890625h-3.0087890625v8.1162109375c0,1.0361328125.4296875,1.71875,1.5419921875,1.71875.8603515625,0,1.3154296875-.4296875,1.44140625-.6572265625l.3037109375.935546875c-.2275390625.3037109375-1.1376953125.986328125-2.6796875.986328125-1.7705078125,0-2.93359375-.8349609375-2.93359375-2.857421875v-8.1162109375l-2.1494140625-.2275390625v-.986328125h2.1494140625Z"/>
              <path className="uuid-95f983fc-8932-4da5-bd73-b27bd5c3531b" d="M125.769804520835351,22.728736506180212c3.58984375,0,5.3349609375,2.1484375,5.3349609375,5.966796875,0,4.12109375-1.8212890625,6.5234375-5.5625,6.5234375-3.388671875,0-5.4111328125-1.97265625-5.4111328125-6.1953125,0-4.2724609375,2.4775390625-6.294921875,5.638671875-6.294921875ZM125.617460770835351,23.790259943680212c-1.71875,0-3.083984375,1.5927734375-3.083984375,4.8037109375,0,3.287109375,1.0361328125,5.5625,3.3115234375,5.5625,1.87109375,0,2.93359375-1.6181640625,2.93359375-4.904296875,0-3.4892578125-.986328125-5.4619140625-3.1611328125-5.4619140625Z"/>
              <path className="uuid-95f983fc-8932-4da5-bd73-b27bd5c3531b" d="M139.423124833335351,22.779517756180212c2.0478515625,0,3.236328125.859375,3.236328125,2.4521484375,0,1.33984375-1.087890625,2.0732421875-1.1884765625,2.0732421875l-1.1630859375-.2529296875c.1513671875-.3037109375.302734375-.7587890625.302734375-1.1884765625,0-1.1123046875-.732421875-1.5673828125-1.5673828125-1.5673828125-.7333984375,0-2.4267578125,1.5419921875-2.4267578125,1.5419921875v8.0908203125h2.755859375v.986328125h-6.3212890625v-.7587890625l1.2392578125-.505859375v-9.4814453125l-1.2900390625-.1005859375v-1.037109375h3.287109375l.1767578125,1.7451171875h.126953125c1.314453125-1.1630859375,2.654296875-1.9970703125,2.83203125-1.9970703125Z"/>
              <path className="uuid-95f983fc-8932-4da5-bd73-b27bd5c3531b" d="M149.206327958335351,23.031470881180212v.986328125l-2.654296875.076171875,3.4638671875,9.279296875,3.16015625-8.875-2.0224609375-.48046875v-.986328125h4.22265625v1.01171875l-.935546875.6572265625-4.6015625,12.6416015625c-.7333984375,2.0234375-1.947265625,3.3125-3.79296875,3.3125-1.365234375,0-2.3515625-.7080078125-2.3515625-1.9462890625,0-.6826171875.48046875-1.1630859375.8095703125-1.3154296875l.5810546875-.0751953125c.2021484375.6064453125.7080078125,1.23828125,1.5927734375,1.23828125,1.1123046875,0,1.8203125-.91015625,2.2255859375-2.0224609375l.5048828125-1.416015625h-1.0361328125l-4.0703125-10.7958984375-1.01171875-.2783203125v-1.01171875h5.916015625Z"/>
            </g>
          </svg>
        </a>
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
