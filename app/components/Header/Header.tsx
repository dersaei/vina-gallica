"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import OptimizedImage from "../OptimizedImage/OptimizedImage";
import styles from "./Header.module.css";

// Regiony francuskie
const regions = [
  { id: "champagne", name: "Champagne" },
  { id: "bordeaux", name: "Bordeaux" },
  { id: "burgundy", name: "Burgundy" },
  { id: "loire-valley", name: "Loire Valley" },
  { id: "rhone-valley", name: "Rhône Valley" },
  { id: "alsace", name: "Alsace" },
  { id: "provence", name: "Provence" },
  { id: "languedoc", name: "Languedoc" },
];

// Języki - BEZ angielskiego
const languages = [
  { code: "de", countryCode: "DE", name: "Deutsch" },
  { code: "fr", countryCode: "FR", name: "Français" },
  { code: "nl", countryCode: "NL", name: "Nederlands" },
  { code: "it", countryCode: "IT", name: "Italiano" },
  { code: "pl", countryCode: "PL", name: "Polski" },
  { code: "zh", countryCode: "CN", name: "中文" },
];

// Image IDs z Directus
const HEADER_IMAGES = {
  logo: "dcc32917-e4f5-46c5-b1a3-e4d01c03404d",
  journal: "c19af3f4-ccbd-4ccd-92ef-18d37b8ba186",
  about: "a030d140-18e9-41f7-b329-2e570223abe7",
  exploreTitle: "29a4a22a-6011-4c2c-a1d9-a128d697a4fa",
};

export default function Header() {
  const pathname = usePathname();

  // Aktualny region
  const currentRegionId = pathname.includes("/region/")
    ? pathname.split("/region/")[1]
    : null;

  return (
    <header className={styles.header}>
      {/* Górna sekcja - czerwona */}
      <div className={styles.topSection}>
        <div className={styles.container}>
          <div className={styles.topContent}>
            {/* Logo - link do głównej strony BEZ /en */}
            <div className={styles.logoSection}>
              <Link href="/" className={styles.logoLink}>
                <OptimizedImage
                  src={HEADER_IMAGES.logo}
                  alt="Vina Gallica - French Wine Directory"
                  width={471}
                  height={106}
                  priority
                  quality={100}
                  className={styles.logo}
                />
              </Link>
            </div>

            {/* Journal i About */}
            <div className={styles.middleSection}>
              <Link href="/journal" className={styles.navSvgLink}>
                <OptimizedImage
                  src={HEADER_IMAGES.journal}
                  alt="Journal"
                  width={330}
                  height={58}
                  className={styles.navSvg}
                />
              </Link>

              <Link href="/about" className={styles.navSvgLink}>
                <OptimizedImage
                  src={HEADER_IMAGES.about}
                  alt="About"
                  width={330}
                  height={58}
                  className={styles.navSvg}
                />
              </Link>
            </div>

            {/* Przełącznik języków - TYLKO inne języki */}
            <div className={styles.languageSection}>
              {languages.map((lang, index) => (
                <Link
                  key={lang.code}
                  href={`/${lang.code}`}
                  className={`${styles.languageButton} ${
                    index % 2 === 0 ? styles.blackSquare : styles.goldSquare
                  }`}
                  title={lang.name}
                >
                  {lang.countryCode}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dolna sekcja - ciemnoszara */}
      <div className={styles.bottomSection}>
        <div className={styles.container}>
          <div className={styles.bottomContent}>
            {/* Tytuł */}
            <div className={styles.titleSection}>
              <OptimizedImage
                src={HEADER_IMAGES.exploreTitle}
                alt="Explore French Wineries by Wine Region"
                width={325}
                height={22}
                className={styles.titleSvg}
              />
            </div>

            {/* Nawigacja regionów */}
            <nav className={styles.regionNav}>
              <ul className={styles.regionList}>
                {regions.map((region) => (
                  <li key={region.id} className={styles.regionItem}>
                    <Link
                      href={`/region/${region.id}`}
                      className={`${styles.regionLink} ${
                        currentRegionId === region.id ? styles.activeRegion : ""
                      }`}
                    >
                      {region.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
