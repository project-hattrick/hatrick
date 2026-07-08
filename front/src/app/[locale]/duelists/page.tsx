import { buildMetadata } from '@/lib/seo';
import { PageShell } from '@/components/common/page-shell';
import { DuelistsDirectory } from '@/components/duelists/duelists-directory';

export const metadata = buildMetadata({
  title: 'Duelists',
  description: 'Browse players, add friends and challenge anyone to a 1v1 duel.',
  path: '/duelists',
});

/** Server component — exports metadata, delegates interactive grid to DuelistsDirectory ('use client'). */
export default function DuelistsPage() {
  return (
    <PageShell>
      <DuelistsDirectory />
    </PageShell>
  );
}
