import { createDirectus, rest, authentication, readItems, registerUser } from "@directus/sdk";

interface WineRegion {
  id: number;
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

interface Town {
  id: string;
  name: string;
  slug: string;
  department: string | Department;
}

interface PlaceTranslation {
  id: number;
  places_vg_id: string;
  languages_code: string;
  description: string | null;
  extended_description: string | null;
}

interface Place {
  id: string;
  Name: string;
  slug: string;
  status: string;
  location: { type: 'Point'; coordinates: [number, number] } | null;
  address: string;
  postal_code: string;
  website: string | null;
  phone: string | null;
  logo: string | null;
  category: string | Category;
  wine_region: number | WineRegion | null;
  town: string | Town;
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
  towns: Town[];
  places_vg: Place[];
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
export { readItems, registerUser };
export type { WineRegion, Category, AdministrativeRegion, Department, Town, Place, PlaceTranslation, ArticleCard, Article, FAQ, FAQTranslation };
