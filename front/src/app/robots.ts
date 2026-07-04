import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

/** /robots.txt — allow everything, block private duel routes, point at the sitemap. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/duel/', '/sandbox/'] }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
