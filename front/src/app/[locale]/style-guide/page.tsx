import { StyleGuide } from '@/components/design-system/style-guide';

export const metadata = {
  title: 'Design System — Hat-trick',
  robots: { index: false, follow: false },
};

/** Living style guide — the visible source of truth for the Neon Turf design system. */
export default function StyleGuidePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <StyleGuide />
    </main>
  );
}
