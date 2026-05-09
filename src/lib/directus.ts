import { createDirectus, rest, authentication, readItems, registerUser, createItem, updateItem, readItem } from "@directus/sdk";

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
  languages: { code: string; name: string; direction: string }[];
}

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;

const directus = createDirectus<Schema>(DIRECTUS_URL)
  .with(authentication('cookie'))
  .with(rest());

export default directus;
export { readItems, registerUser, createItem, updateItem, readItem };
export type { WineRegion, Category, AdministrativeRegion, Department, Place, PlaceListing, PlaceTranslation, TerroirJunction, ArticleCard, Article, FAQ, FAQTranslation };
