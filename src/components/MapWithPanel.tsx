import { useState, useCallback } from "react";
import Map, { type CategoryData, type PlaceData } from "./Map";
import PlacePanel from "./PlacePanel";
import "./MapWithPanel.css";

interface Props {
  geojsonData: string;
  categories: CategoryData[];
}

export default function MapWithPanel({ geojsonData, categories }: Props) {
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
      />
      <PlacePanel place={openPlace} onClose={handleClosePanel} />
    </div>
  );
}
