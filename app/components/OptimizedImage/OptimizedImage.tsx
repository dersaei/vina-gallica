"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  className?: string;
  fill?: boolean;
  sizes?: string;
  fallbackSrc?: string;
}

// Sprawdza czy to UUID z Directus
const isDirectusUUID = (src: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(src);
};

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 100,
  priority = true,
  className,
  fill = false,
  sizes,
  fallbackSrc = "",
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    setHasError(true);
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
    }
  };

  // Generuj URL dla obrazu - BEZPOŚREDNIO przez Directus transformacje
  const getImageSrc = (originalSrc: string): string => {
    // Lokalne pliki (w public/) - używaj bezpośrednio
    if (!isDirectusUUID(originalSrc)) {
      return originalSrc;
    }

    // Directus UUID - BEZPOŚREDNIO z transformacjami
    const baseUrl = `https://admin.vinagallica.com/assets/${originalSrc}`;
    const url = new URL(baseUrl);

    // Dodaj parametry transformacji jak w dokumentacji Directus
    if (width) url.searchParams.set("width", width.toString());
    if (height) url.searchParams.set("height", height.toString());
    if (quality && quality !== 100)
      url.searchParams.set("quality", quality.toString());

    // Directus automatycznie wybierze WebP/AVIF jeśli przeglądarka obsługuje
    url.searchParams.set("format", "auto");
    url.searchParams.set("fit", "cover");
    url.searchParams.set("withoutEnlargement", "true");

    return url.toString();
  };

  const optimizedSrc = getImageSrc(imageSrc);

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      className={`${className || ""} ${hasError ? "opacity-50 grayscale" : ""}`}
      onError={handleError}
      priority={priority}
      unoptimized={isDirectusUUID(imageSrc)}
      {...(fill ? { fill: true } : { width, height })}
      {...(sizes && { sizes })}
    />
  );
}
