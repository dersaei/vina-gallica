export const prerender = false;
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  const base = site!.origin;

  const pages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/directory', priority: '0.9', changefreq: 'daily' },
    { url: '/map', priority: '0.8', changefreq: 'weekly' },
    { url: '/journal', priority: '0.7', changefreq: 'weekly' },
  ];

  // Phase 3: extend with /places/[slug] and /journal/[slug] fetched from Directus

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(p => `<url>
    <loc>${base}${p.url}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n  ')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
};
