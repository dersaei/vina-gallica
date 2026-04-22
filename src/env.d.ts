type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}

interface ImportMetaEnv {
	readonly PUBLIC_MAPBOX_TOKEN: string;
	readonly DIRECTUS_URL: string;
	readonly DIRECTUS_STATIC_TOKEN: string;
	readonly DIRECTUS_SERVICE_TOKEN: string;
	readonly PUBLIC_SITE_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
