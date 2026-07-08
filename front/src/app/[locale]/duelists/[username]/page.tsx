import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { PageShell } from '@/components/common/page-shell';
import { DuelistProfile } from '@/components/duelists/duelist-profile';

interface PageParams {
  username: string;
}

/** Next 16: params is a Promise — always await before reading. */
export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { username } = await params;
  return buildMetadata({
    title: `@${username}`,
    description: `View ${username}'s public profile, dueling stats and collection on Hat-trick.`,
    path: `/duelists/${username}`,
  });
}

/** Server component — resolves the username param, hands it to the client profile shell. */
export default async function DuelistUserPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { username } = await params;

  return (
    <PageShell>
      <DuelistProfile username={username} />
    </PageShell>
  );
}
