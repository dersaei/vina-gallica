type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
	interface Locals extends Runtime {}
}

interface ImportMetaEnv {
	readonly PUBLIC_MAPBOX_TOKEN: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
