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
  address: string;
  postal_code: string;
  website: string | null;
  phone: string | null;
  logo: string | null;
  category: string | Category;
  wine_region: number | WineRegion | null;
  town: string | Town;
}

interface Schema {
  wine_regions: WineRegion[];
  categories_vg: Category[];
  administrative_regions: AdministrativeRegion[];
  departments: Department[];
  towns: Town[];
  places_vg: Place[];
}

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;

const directus = createDirectus<Schema>(DIRECTUS_URL).with(rest());

export default directus;
export { readItems };
export type { WineRegion, Category, AdministrativeRegion, Department, Town, Place };
