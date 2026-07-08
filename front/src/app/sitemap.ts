import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';
import { getAllPosts } from '@/lib/blog';
import { locales } from '@/i18n/locales';
import { localizePath } from '@/i18n/path';

/** Public, indexable routes (duel/sandbox are private and excluded). */
const STATIC_PATHS = [
  '/',
  '/live',
  '/fantasy',
  '/duelists',
  '/store',
  '/fixtures',
  '/blog',
  '/about',
  '/faq',
  '/contact',
  '/legal/terms',
  '/legal/privacy',
  '/legal/responsible-gaming',
  '/legal/cookies',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, SITE.url).toString();

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    STATIC_PATHS.map((path) => ({
      url: url(localizePath(path, locale)),
      changeFrequency: path === '/' ? 'daily' : 'weekly',
      priority: path === '/' ? 1 : 0.7,
    })),
  );

  const postEntries: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    getAllPosts().map((post) => ({
      url: url(localizePath(`/blog/${post.slug}`, locale)),
      lastModified: new Date(post.meta.date),
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
  );

  return [...staticEntries, ...postEntries];
}
