import { createDirectus, rest, authentication, readItems, readSingleton, registerUser, createItem, updateItem, readItem } from "@directus/sdk";

interface WineRegion {
  id: string;
  region: string;
  slug: string;
  color: string;
}

interface Category {
  id: string;
  name: string;
  name_fr?: string | null;
  slug: string;
  color: string;
}

interface AdministrativeRegion {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface Department {
  id: string;
  name: string;
  slug: string;
  color: string;
  administrative_region: string | AdministrativeRegion;
}

interface PlaceTranslation {
  id: number;
  places_vg_id: string;
  languages_code: string;
  description: string | null;
  extended_description: string | null;
}

interface TerroirJunction {
  id: number;
  places_vg_id: string;
  wine_regions_id: string | WineRegion;
}

interface PlaceListing {
  id: string;
  Name: string;
  slug: string;
  status: 'draft' | 'pending_review' | 'published' | 'archived';
  date_created: string | null;
  date_updated: string | null;
  location: { type: 'Point'; coordinates: [number, number] } | null;
  address: string | null;
  postal_code: string | null;
  place: string | null;
  website: string | null;
  phone: string | null;
  logo: string | null;
  category: string | Category;
  terroir: TerroirJunction[];
  department: string | Department | null;
  translations?: PlaceTranslation[];
  user_id: string | null;
  description_en: string | null;
  description_fr: string | null;
  translate_to_en: boolean;
  translate_to_fr: boolean;
  gallery: string[] | null;
  certificates: string[] | null;
  video: string[] | null;
}

interface OpeningHour {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  open: string;
  close: string;
  closed: boolean;
}

interface Slogan {
  text: string;
}

interface Place {
  id: string;
  Name: string;
  slug: string;
  status: string;
  location: { type: 'Point'; coordinates: [number, number] } | null;
  address: string | null;
  postal_code: string | null;
  place: string | null;
  website: string | null;
  phone: string | null;
  logo: string | null;
  category: string | Category;
  terroir: TerroirJunction[];
  department: string | Department | null;
  translations?: PlaceTranslation[];
  event_date_start: string | null;
  event_date_end: string | null;
  // Premium fields (nullable — only filled on premium listings)
  description_en?: string | null;
  description_fr?: string | null;
  opening_hours?: OpeningHour[] | null;
  slogans_en?: Slogan[] | null;
  slogans_fr?: Slogan[] | null;
}

interface Article {
  id: string;
  status: string;
  name: string;
  slug: string;
  text: string | null;
  main_image: string | null;
  date_created: string;
  date_updated: string | null;
  seo_title: string | null;
  seo_description: string | null;
  headline: string | null;
}

interface ArticleCard {
  id: string;
  status: string;
  name: string;
  slug: string;
  image: string | null;
  preview: string | null;
  date_created: string;
}

interface FAQTranslation {
  id: number;
  faq_id: string;
  languages_code: string;
  question: string;
  answer: string;
}

interface FAQ {
  id: string;
  status: 'published' | 'draft' | 'archived';
  sort: number;
  question: string;
  answer: string;
  translations?: FAQTranslation[];
}

interface AboutPageTranslation {
  id: number;
  about_page_id: number;
  languages_code: string;
  heading: string | null;
  cta_text: string | null;
  intro_1: string | null;
  intro_2: string | null;
  subheading: string | null;
  regions_heading: string | null;
}

interface AboutPage {
  id: number;
  status: 'published' | 'draft' | 'archived';
  translations?: AboutPageTranslation[];
}

interface AboutRegionTranslation {
  id: number;
  about_regions_id: number;
  languages_code: string;
  name: string | null;
  description: string | null;
}

interface AboutRegion {
  id: number;
  status: 'published' | 'draft' | 'archived';
  sort: number | null;
  translations?: AboutRegionTranslation[];
}

interface Schema {
  wine_regions: WineRegion[];
  categories_vg: Category[];
  administrative_regions: AdministrativeRegion[];
  departments: Department[];
  places_vg: PlaceListing[];
  places_vg_wine_regions: TerroirJunction[];
  places_vg_translations: PlaceTranslation[];
  articles_cards_vg: ArticleCard[];
  journal_vg: Article[];
  faq: FAQ[];
  faq_translations: FAQTranslation[];
  about_page: AboutPage;
  about_page_translations: AboutPageTranslation[];
  about_regions: AboutRegion[];
  about_regions_translations: AboutRegionTranslation[];
  languages: { code: string; name: string; direction: string }[];
}

const EVENT_MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
} as const;

function formatEventDay(iso: string, lang: 'en' | 'fr'): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  const day = parseInt(m[3], 10);
  const month = EVENT_MONTHS[lang][parseInt(m[2], 10) - 1];
  return `${day} ${month} ${m[1]}`;
}

// Renders "15 Jun 2026 – 18 Jun 2026", or a single date, or null when no dates set.
function formatEventDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
  lang: 'en' | 'fr' = 'en',
): string | null {
  const s = start ? formatEventDay(start, lang) : null;
  const e = end ? formatEventDay(end, lang) : null;
  if (s && e) return s === e ? s : `${s} – ${e}`;
  return s ?? e ?? null;
}

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;

const directus = createDirectus<Schema>(DIRECTUS_URL)
  .with(authentication('cookie'))
  .with(rest());

export default directus;
export { readItems, readSingleton, registerUser, createItem, updateItem, readItem, formatEventDateRange };
export type { WineRegion, Category, AdministrativeRegion, Department, Place, PlaceListing, PlaceTranslation, TerroirJunction, OpeningHour, Slogan, ArticleCard, Article, FAQ, FAQTranslation, AboutPage, AboutPageTranslation, AboutRegion, AboutRegionTranslation };
