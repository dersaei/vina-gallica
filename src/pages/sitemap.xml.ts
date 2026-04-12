export const prerender = false;
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ site }) => {
  const base = site!.origin;

  const allPages = [
    { url: "/", priority: "1.0", changefreq: "monthly" },
    { url: "/about", priority: "0.6", changefreq: "monthly" },
    { url: "/directory", priority: "0.8", changefreq: "weekly" },
    { url: "/map", priority: "0.8", changefreq: "weekly" },
    { url: "/privacy-policy", priority: "0.2", changefreq: "monthly" },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPages
    .map(
      (p) => `<url>
    <loc>${base}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`,
    )
    .join("\n  ")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
};
