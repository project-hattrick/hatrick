import { Suspense } from 'react';

import { FranceVsNlArena } from '@/components/txline-arena/france-vs-nl-arena';

export default function FranceVsNetherlandsSandboxPage() {
  return (
    <Suspense>
      <FranceVsNlArena />
    </Suspense>
  );
}
