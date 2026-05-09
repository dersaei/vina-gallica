export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface OpeningHour {
  day: DayOfWeek;
  open: string;   // "HH:MM"
  close: string;  // "HH:MM"
  closed: boolean;
}

export interface Listing {
  id: string;
  Name: string;
  status: string;
  date_created: string | null;
  date_updated: string | null;
  category: { id: string; name: string; name_fr: string | null } | null;
  terroir: { wine_regions_id: { id: string; region: string } }[];
  address: string | null;
  postal_code: string | null;
  place: string | null;
  phone: string | null;
  website: string | null;
  location: { type: "Point"; coordinates: [number, number] } | null;
  logo: string | null;
  description_en: string | null;
  description_fr: string | null;
  translate_to_en: boolean;
  translate_to_fr: boolean;
  gallery: string[] | null;
  certificates: string[] | null;
  video: string[] | null;
  opening_hours: OpeningHour[] | null;
  event_date_start: string | null;
  event_date_end: string | null;
  nearest_bus_station_name: string | null;
  nearest_bus_station_distance_m: number | null;
  nearest_train_station_name: string | null;
  nearest_train_station_distance_m: number | null;
}
