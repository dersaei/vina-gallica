import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Dodaj quality 90 żeby pozbyć się warning
    qualities: [75, 90, 100],
    // Dodaj remote patterns dla Directus
    remotePatterns: [
      {
        protocol: "https",
        hostname: "admin.vinagallica.com",
        port: "",
        pathname: "/assets/**",
      },
    ],
  },
};

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

export default nextConfig;
