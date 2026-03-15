import { createDirectus, rest, readItems } from "@directus/sdk";

type WineRegion = {
  id: number;
  region: string;
  slug: string;
};

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Schema = {
  wine_regions: WineRegion[];
  categories_vg: Category[];
};

const DIRECTUS_URL = import.meta.env.DIRECTUS_URL;

const directus = createDirectus<Schema>(DIRECTUS_URL).with(rest());

export default directus;
export { readItems };
export type { WineRegion, Category };
