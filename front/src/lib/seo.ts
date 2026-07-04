import type { Metadata } from 'next';

/** Canonical site origin — override per-deploy with NEXT_PUBLIC_SITE_URL. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hat-trick.app';

export const SITE = {
  name: 'Hat-trick',
  url: SITE_URL,
  title: 'Hat-trick — Live & Fantasy football, one platform',
  description:
    'One platform, two ways to live the World Cup: predict and bet on real matches in Live Mode, or build your XI and duel friends 1v1 in Fantasy — powered by the TxLINE real-time feed.',
  keywords: [
    'World Cup 2026',
    'live football betting',
    'football predictions',
    'fantasy football',
    '1v1 duels',
    'real-time odds',
    'TxLINE',
    'Hat-trick',
  ],
  twitter: '@hattrick',
  locale: 'en_US',
} as const;

interface BuildMetadataInput {
  title?: string;
  description?: string;
  /** Path starting with '/', used for the canonical URL. */
  path?: string;
  /** Absolute or root-relative OG image; defaults to the dynamic route image. */
  image?: string;
  /** Mark auxiliary pages (legal, etc.) noindex when true. */
  noindex?: boolean;
}

/** Single builder for per-route metadata — keeps title/OG/twitter/canonical consistent. */
export function buildMetadata({
  title,
  description = SITE.description,
  path = '/',
  image,
  noindex = false,
}: BuildMetadataInput = {}): Metadata {
  const url = new URL(path, SITE.url).toString();
  const fullTitle = title ? `${title} · ${SITE.name}` : SITE.title;
  const images = image ? [{ url: image }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'website',
      siteName: SITE.name,
      title: fullTitle,
      description,
      url,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      site: SITE.twitter,
      images: image ? [image] : undefined,
    },
  };
}
