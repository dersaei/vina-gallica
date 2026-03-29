export const prerender = false;
import type { APIRoute } from "astro";
import directus, { readItems } from "../lib/directus.ts";

export const GET: APIRoute = async ({ site }) => {
  const base = site!.origin;

  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "monthly" },
    { url: "/directory", priority: "0.8", changefreq: "weekly" },
    { url: "/map", priority: "0.8", changefreq: "weekly" },
    { url: "/journal", priority: "0.8", changefreq: "weekly" },
    { url: "/privacy-policy", priority: "0.2", changefreq: "monthly" },
  ];

  const articles = await directus.request(
    readItems("journal_vg", {
      fields: ["slug"],
      filter: { status: { _eq: "published" } },
      limit: -1,
    })
  ) as { slug: string }[];

  const articleUrls = articles.map((a) => ({
    url: `/journal/${a.slug}`,
    priority: "0.7",
    changefreq: "monthly",
  }));

  const allPages = [...staticPages, ...articleUrls];

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
