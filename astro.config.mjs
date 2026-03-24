// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { loadEnv } from "vite";

const { ADOBE_FONTS_ID = "" } = loadEnv(
  process.env.NODE_ENV ?? "development",
  process.cwd(),
  "",
);

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare({
    imageService: {
      build: "compile",
      runtime: "cloudflare-binding",
    },
  }),
  integrations: [react()],
  fonts: [
    {
      provider: fontProviders.adobe({ id: ADOBE_FONTS_ID }),
      name: "Roca",
      cssVariable: "--font-heading",
      weights: [300, 400, 700],
      styles: ["normal"],
      fallbacks: ["sans-serif"],
    },
    {
      provider: fontProviders.adobe({ id: ADOBE_FONTS_ID }),
      name: "Adobe Caslon Pro",
      cssVariable: "--font-label",
      weights: [600],
      styles: ["normal"],
      fallbacks: ["serif"],
    },
    {
      provider: fontProviders.adobe({ id: ADOBE_FONTS_ID }),
      name: "Futura 100 Latin Ext",
      cssVariable: "--font-hero",
      weights: [400],
      styles: ["normal"],
      fallbacks: ["sans-serif"],
    },
    {
      provider: fontProviders.adobe({ id: ADOBE_FONTS_ID }),
      name: "New Zen",
      cssVariable: "--font-extra",
      weights: [400, 500],
      styles: ["normal"],
      fallbacks: ["sans-serif"],
    },
  ],
});
