import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

/** PWA manifest — dark stage + neon accent, matches the design tokens. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: SITE.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0d0a',
    theme_color: '#0a0d0a',
    icons: [
      { src: '/logo.png', sizes: 'any', type: 'image/png', purpose: 'any' },
    ],
  };
}
