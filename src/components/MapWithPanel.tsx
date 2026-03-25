import { useState, useCallback } from "react";
import Map, { type CategoryData } from "./Map";
import PlacePanel from "./PlacePanel";
import "./MapWithPanel.css";

interface Props {
  geojsonData: string;
  categories: CategoryData[];
}

export default function MapWithPanel({ geojsonData, categories }: Props) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  const handleOpenPanel = useCallback((slug: string) => {
    setOpenSlug(slug);
  }, []);

  const handleClosePanel = useCallback(() => {
    setOpenSlug(null);
  }, []);

  return (
    <div className="map-with-panel">
      <Map
        geojsonData={geojsonData}
        categories={categories}
        onOpenPanel={handleOpenPanel}
      />
      <PlacePanel slug={openSlug} onClose={handleClosePanel} />
    </div>
  );
}
