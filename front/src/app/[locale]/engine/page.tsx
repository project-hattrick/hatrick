import { notFound } from 'next/navigation';

import { HeroEngineSurface } from '@/components/engine/hero-engine-surface';

export const metadata = {
  title: 'Engine — Hatrick',
};

/**
 * Dev-only fullscreen engine surface: the home hero's mock match with team-swap + live court editing.
 * Gated to development so it never ships — a production build returns 404 (the check runs at request time
 * and the route is unlinked). It lives under `[locale]` (only that layout renders <html>/<body>), so the
 * URL is `/en/engine`; `fixed inset-0` covers the layout's (navbar-less) chrome for a true fullscreen view.
 */
export default function EnginePage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <HeroEngineSurface />
    </div>
  );
}
