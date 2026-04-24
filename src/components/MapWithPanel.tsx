import { useState, useCallback } from "react";
import Map, { type CategoryData, type PlaceData } from "./Map";
import PlacePanel from "./PlacePanel";
import "./MapWithPanel.css";

interface Props {
  geojsonData: string;
  categories: CategoryData[];
  lang?: "en" | "fr";
}

export default function MapWithPanel({ geojsonData, categories, lang }: Props) {
  const [openPlace, setOpenPlace] = useState<PlaceData | null>(null);

  const handleOpenPanel = useCallback((place: PlaceData) => {
    setOpenPlace(place);
  }, []);

  const handleClosePanel = useCallback(() => {
    setOpenPlace(null);
  }, []);

  return (
    <div className="map-with-panel">
      <Map
        geojsonData={geojsonData}
        categories={categories}
        onOpenPanel={handleOpenPanel}
        lang={lang}
      />
      <PlacePanel place={openPlace} onClose={handleClosePanel} />
    </div>
  );
}
