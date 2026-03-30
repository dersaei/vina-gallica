import { createDirectus, rest, readItems } from "@directus/sdk";

interface WineRegion {
  id: number;
  region: string;
  slug: string;
  color: string;
}

interface Category {
  id: string;
  name: string;
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

interface Schema {
  wine_regions: WineRegion[];
  categories_vg: Category[];
  administrative_regions: AdministrativeRegion[];
  departments: Department[];
  towns: Town[];
  places_vg: Place[];
  articles_cards_vg: ArticleCard[];
  journal_vg: Article[];
}

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;

const directus = createDirectus<Schema>(DIRECTUS_URL).with(rest());

export default directus;
export { readItems };
export type { WineRegion, Category, AdministrativeRegion, Department, Town, Place, ArticleCard, Article };
