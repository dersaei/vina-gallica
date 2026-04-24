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
  lang?: "en" | "fr";
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
        deptName: string;
        deptColor: string;
        adminRegionName: string;
        adminRegionColor: string;
      };

      const openSvg = lang === "fr"
        ? `<svg id="uuid-71072ad0-2005-4cca-b99a-997095b2f4ed" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 93.747285463982735 47.864105015520181"><g id="uuid-4345c26f-3a53-4339-81d0-116538402214"><path d="M92.363475226480659,20.912683005053623c-2.8575439453125-5.972900390625-10.073486328125-9.4599609375-15.761962890625-12.11669921875C62.169932746011909,2.055505270678623,44.063792609293159-1.207678323071377,28.195201300699409.407800192553623,14.060435675699409,1.847009176928623-.939625359456841,11.030847067553623.046092413980659,26.956384176928623c.33282470703125,5.37744140625,2.38897705078125,11.071044921875,6.4368896484375,14.75634765625,5.9150390625,5.38525390625,14.5126953125,5.862548828125,22.09747314453125,5.8681640625.50048828125.00048828125-.10015869140625-4.373291015625-1.2542724609375-4.374267578125-6.96759033203125-.005126953125-14.8284912109375-.3349609375-20.56866455078125-4.8017578125-9.62353515625-7.488525390625-3.89520263671875-20.781494140625,4.0230712890625-26.83349609375C22.948375128824409,2.271325583178623,40.218516730386909,3.793298239428623,54.416942023355659,6.180993551928623c7.94268798828125,1.335693359375,15.7813720703125,3.5048828125,23.09210205078125,6.919677734375,3.27459716796875,1.529296875,6.480224609375,3.28271484375,9.4422607421875,5.361083984375,3.24676513671875,2.2783203125,6.18634033203125,4.26611328125,4.33013916015625,9.306884765625-.53271484375,1.446533203125-1.71661376953125,2.9443359375-2.71282958984375,4.091796875-11.259521484375,12.96826171875-31.26788330078125,12.04443359375-46.715087890625,11.22119140625-.4285888671875-.02294921875.0579833984375,4.310302734375,1.2542724609375,4.374267578125,15.6737060546875.83544921875,35.593505859375,1.66796875,46.97235107421875-11.464111328125,3.79107666015625-4.375244140625,4.80133056640625-9.816162109375,2.2833251953125-15.0791015625Z"/><path d="M13.788585089761909,20.069421286303623c-2.2412109375.16015625-2.609375.49609375-2.9453125,1.7607421875l-2.44921875,8.9794921875c-.31982421875,1.2001953125-.0478515625,1.537109375,1.1845703125,1.47265625l.46435546875-.0322265625c1.61669921875-.1123046875,1.6806640625-.3681640625,1.90478515625-1.6484375l.17578125-.9765625,3.08935546875-.1123046875.35205078125,1.376953125c.3203125,1.2646484375.38427734375,1.5849609375,2.0009765625,1.48828125l.5283203125-.03125c1.232421875-.048828125,1.48828125-.400390625,1.072265625-1.5693359375l-3.24951171875-9.3310546875c-.43212890625-1.2333984375-.81591796875-1.47265625-2.12841796875-1.376953125ZM12.555674933511909,27.400475973803623l.91259765625-3.77734375,1.1845703125,3.77734375h-2.09716796875Z"/><path d="M39.377940558511909,20.309655661303623h-.5283203125c-1.29638671875,0-1.6005859375.3359375-1.6328125,1.6328125l-.19189453125,9.283203125c-.0322265625,1.2802734375.2880859375,1.5849609375,1.568359375,1.537109375l.49658203125-.0166015625c1.29638671875-.0478515625,1.6005859375-.3681640625,1.63232421875-1.6640625l.22412109375-9.2041015625c.0322265625-1.2802734375-.2880859375-1.568359375-1.568359375-1.568359375Z"/><path d="M26.588878058511909,23.335046286303623c1.13623046875.03125,1.37646484375-.240234375,1.37646484375-1.392578125,0-1.1845703125-.3203125-1.47265625-1.48876953125-1.5048828125l-4.36962890625-.1279296875c-1.28076171875-.0322265625-1.61669921875.271484375-1.64892578125,1.552734375l-.22412109375,9.3955078125c-.03173828125,1.2802734375.2724609375,1.5849609375,1.552734375,1.48828125,1.3125-.095703125,1.61669921875-.431640625,1.66455078125-1.728515625l.1123046875-3.0732421875,1.98486328125.1123046875c1.0244140625.0634765625,1.29638671875-.17578125,1.34423828125-1.232421875.0322265625-1.041015625-.2080078125-1.3125-1.24853515625-1.3447265625l-1.95263671875-.064453125.09619140625-2.1767578125,2.80126953125.0966796875Z"/><path d="M34.815928839761909,20.437585348803623l-4.36962890625-.1279296875c-1.28076171875-.0322265625-1.61669921875.271484375-1.64892578125,1.552734375l-.22412109375,9.3955078125c-.03173828125,1.2802734375.2724609375,1.5849609375,1.552734375,1.48828125,1.3125-.095703125,1.61669921875-.431640625,1.66455078125-1.728515625l.1123046875-3.0732421875,1.98486328125.1123046875c1.0244140625.0634765625,1.29638671875-.17578125,1.34423828125-1.232421875.0322265625-1.041015625-.2080078125-1.3125-1.24853515625-1.3447265625l-1.95263671875-.064453125.09619140625-2.1767578125,2.80126953125.0966796875c1.13623046875.03125,1.37646484375-.240234375,1.37646484375-1.392578125,0-1.1845703125-.3203125-1.47265625-1.48876953125-1.5048828125Z"/><path d="M47.804210089761909,24.615319723803623c1.392578125-.416015625,1.552734375-.640625,1.44091796875-2.0810546875l-.14404296875-1.80859375c-.0322265625-.3203125-.1123046875-.416015625-.4482421875-.4326171875-.14404296875-.015625-.30419921875-.015625-.4482421875-.015625-3.9697265625,0-6.2587890625,3.44140625-6.2587890625,6.70703125,0,2.9609375,1.88916015625,5.7783203125,6.11474609375,5.7783203125.22412109375,0,.4482421875,0,.68798828125-.0166015625.49658203125-.03125.640625-.17578125.640625-.6875l.015625-3.2021484375c0-.5595703125-.11181640625-.6396484375-.65625-.5439453125-.22412109375.0478515625-.4638671875.064453125-.72021484375.064453125-1.08837890625,0-2.24072265625-.4326171875-2.24072265625-1.5205078125,0-.9765625.7041015625-1.857421875,2.0166015625-2.2412109375Z"/><path d="M57.661143683511909,32.314538473803623l.416015625.0322265625c1.2802734375.095703125,1.61669921875-.2568359375,1.6484375-1.537109375l.240234375-8.8037109375c.0322265625-1.2958984375-.255859375-1.6162109375-1.552734375-1.6962890625l-.14404296875-.0166015625c-1.2802734375-.080078125-1.61669921875.224609375-1.6806640625,1.5048828125l-.16015625,3.10546875-2.60888671875.080078125-.080078125-2.9453125c-.03173828125-1.2646484375-.35205078125-1.6005859375-1.61669921875-1.408203125l-.416015625.0634765625c-1.28076171875.1923828125-1.552734375.49609375-1.45654296875,1.79296875l.6240234375,8.3876953125c.09619140625,1.2001953125.400390625,1.50390625,1.61669921875,1.552734375,1.216796875.0478515625,1.5205078125-.240234375,1.48876953125-1.44140625l-.080078125-2.9130859375,2.40087890625-.5283203125-.16015625,3.10546875c-.06396484375,1.2802734375.240234375,1.568359375,1.52099609375,1.6650390625Z"/><path d="M68.717296027261909,22.294030661303623v-.671875c0-1.2802734375-.35205078125-1.568359375-1.6328125-1.4404296875l-4.52978515625.431640625c-1.29638671875.1279296875-1.58447265625.46484375-1.5205078125,1.7607421875l.46435546875,8.931640625c.06396484375,1.2646484375.39990234375,1.552734375,1.66455078125,1.3447265625l4.49755859375-.7041015625c1.07275390625-.16015625,1.28076171875-.46484375,1.216796875-1.568359375-.06396484375-1.0732421875-.38427734375-1.3134765625-1.44091796875-1.1845703125l-3.23291015625.3994140625-.064453125-1.6005859375,2.83349609375-.3037109375c.89599609375-.095703125,1.0400390625-.3203125,1.0400390625-1.216796875,0-.912109375-.3037109375-1.1201171875-1.18408203125-1.0400390625l-2.84912109375.255859375-.064453125-1.4248046875,3.2333984375-.240234375c1.296875-.095703125,1.56884765625-.431640625,1.56884765625-1.728515625Z"/><path d="M79.101573371011909,24.119225973803623c0-2.0009765625-2.00048828125-3.9541015625-6.0341796875-3.9541015625-.48046875,0-1.08837890625.0478515625-1.66455078125.0966796875-1.20068359375.111328125-1.56884765625.5283203125-1.56884765625,1.728515625l-.0322265625,9.01171875c0,1.2802734375.3203125,1.6005859375,1.60107421875,1.6005859375h.17578125c1.28076171875,0,1.5849609375-.3203125,1.5205078125-1.6005859375l-.14404296875-2.6416015625.96044921875-.1279296875,1.216796875,2.865234375c.51220703125,1.2001953125.912109375,1.4248046875,2.20849609375,1.232421875l.17626953125-.0322265625c1.21630859375-.17578125,1.40869140625-.576171875.80029296875-1.6318359375l-1.7607421875-3.08984375c1.69677734375-.81640625,2.544921875-2.14453125,2.544921875-3.45703125ZM72.859385871011909,26.135827536303623l-.16015625-3.025390625c.17578125-.0322265625.3681640625-.0322265625.5439453125-.0322265625,1.392578125,0,2.0810546875.705078125,2.0810546875,1.4248046875,0,.80078125-.83251953125,1.6171875-2.46484375,1.6328125Z"/></g></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 93.74728546 47.86400883" aria-hidden="true" focusable="true"><path d="M92.36347523 20.91257029c-2.85754395-5.97277832-10.07348633-9.45983887-15.7619629-12.11669922C62.16993276 2.05539255 44.06379262-1.20766897 28.1952013.40780955 14.06043568 1.84689646-.93962536 11.03073435.04609241 26.95627146c.33282471 5.3774414 2.38897705 11.07104492 6.43688965 14.75634766 5.91503906 5.38537597 14.51269531 5.86254882 22.09747315 5.86828613.50048828.00036621-.1001587-4.37341309-1.25427246-4.37426758-6.96759034-.00524902-14.82849121-.335083-20.56866455-4.80187988-9.62353516-7.4885254-3.89520264-20.78149414 4.02307128-26.8334961 12.16778565-9.30004882 29.43792725-7.7779541 43.63635254-5.39038085 7.942688 1.33569335 15.78137207 3.50500488 23.09210205 6.91967773 3.27459717 1.52929687 6.48022461 3.28271484 9.44226075 5.36108398 3.24676513 2.27832032 6.18634033 4.26611329 4.33013916 9.30688477-.53271485 1.44665527-1.71661377 2.94433594-2.7128296 4.09179687C77.3090929 44.82858591 57.30073109 43.9047578 41.8535265 43.0815156c-.42858887-.02294922.0579834 4.3104248 1.25427246 4.37426758C58.781505 48.2912324 78.70130482 49.123874 90.08015003 35.99167185c3.79107666-4.37524414 4.80133057-9.8161621 2.2833252-15.07910156"/><path d="M30.68484133 25.43008608c0 4.30859375-3.45410157 7.00097656-7.31689453 7.00097656-3.7138672 0-6.8334961-2.93359375-6.8334961-6.87109375 0-4.04785156 2.61816406-7.40917969 7.07519531-7.40917969 4.54931641 0 7.07519532 3.50976563 7.07519532 7.27929688m-4.30859375.16699219c0-1.4482422-.94677735-2.98925782-2.72949219-2.98925782-1.80126953 0-2.9711914 1.31835938-2.9711914 3.25 0 1.55957032.94677734 3.08203125 2.98974609 3.08203125 1.65283203 0 2.7109375-1.37402343 2.7109375-3.34277343M35.68435305 30.89004702c.03710937 1.48535156-.31591797 1.83789062-1.8569336 1.83789062-1.50439453 0-1.87597656-.35253906-1.91308594-1.85644531l-.25976562-10.12109375c-.03710938-1.39257813.38964844-1.91210938 1.74560547-2.15429688.8725586-.16699218 1.78271484-.22265625 2.7109375-.22265625 3.6772461 0 6.3696289 1.5234375 6.3696289 4.3828125 0 3.32421875-2.32128906 5.64550782-6.87109375 5.84960938zm3.49072265-7.4091797c0-.78027343-.7241211-1.48632812-2.3022461-1.48632812-.50146484 0-1.02148437.07421875-1.44873046.22363282l.09277344 3.32324218c.16748047.0185547.33447265.0185547.48291015.0185547 2.02441407 0 3.17529297-1.09570313 3.17529297-2.07910157M50.54323976 31.8929767l-5.21826171.81640625c-1.46679688.2421875-1.8569336-.09277343-1.93115235-1.5595703l-.53857422-10.3623047c-.07421875-1.50390625.25976563-1.89355468 1.76416016-2.04199218l5.2553711-.50195313c1.48535156-.1484375 1.89404296.18554688 1.89404296 1.671875v.77929688c0 1.5048828-.31591797 1.89453125-1.81982422 2.00585937l-3.75146484.27832031.07470703 1.65332032 3.30517578-.29785157c1.02148438-.09277343 1.37402344.1484375 1.37402344 1.20703125 0 1.04003907-.16699219 1.2998047-1.20703125 1.41210938l-3.2866211.35253906.07421876 1.85644531 3.75097656-.46386718c1.22558594-.1484375 1.59716797.1298828 1.67138672 1.37402343.07421875 1.28125-.16699219 1.63476563-1.41113282 1.8203125M64.47292726 31.39102358c.03759766.91015625-.18554687 1.15136719-1.13232421 1.24414062-.92871094.09277344-1.24462891-.05566406-1.74560547-.85351562l-4.27148438-6.61132813.81738281 5.58984375c.22265625 1.46679688-.09277343 1.875-1.56005859 2.0419922l-1.39257812.16796874c-1.46728516.16699219-1.83837891-.16796875-1.87548829-1.65332031l-.22314453-11.41992188c-.01855468-1.24414062.2788086-1.5048828 1.54150391-1.5048828s1.72705078.29785155 2.46972656 1.29980468l3.15673828 4.30859375-.57568359-4.234375c-.20410156-1.4296875.14892578-1.80078125 1.57861328-1.63378906l.89160156.11132812c1.48535157.16699219 1.8569336.55761719 1.91259766 2.06152344z"/></svg>`;

      function buildSinglePopupHtml(p: {
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
        deptName: string;
        deptColor: string;
        adminRegionName: string;
        adminRegionColor: string;
      }) {
        const locationTags = [
          p.deptName
            ? { name: p.deptName, color: p.deptColor || "#888" }
            : null,
          p.adminRegionName
            ? { name: p.adminRegionName, color: p.adminRegionColor || "#888" }
            : null,
        ].filter(Boolean) as { name: string; color: string }[];
        return `
          <div class="map-popup">
            ${p.wineRegionName ? `<div class="map-popup__region" style="background-color:${p.wineRegionColor || "#888"}">${p.wineRegionName}</div>` : ""}
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
            ${p.wineRegionName ? `<div class="map-popup__multi-region" style="--region-color:${p.wineRegionColor || "#888"}" title="${p.wineRegionName}"></div>` : ""}
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
