import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

interface Props {
  center?: [number, number];
  zoom?: number;
}

export default function Map({ center = [2.35, 46.6], zoom = 9 }: Props) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = import.meta.env.PUBLIC_MAPBOX_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center,
      zoom,
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return <div ref={mapContainerRef} className="map-container" />;
}
