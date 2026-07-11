import { Suspense } from 'react';

import { FranceCompleteArena } from '@/components/txline-arena/france-complete-arena';

export default function FranceCompleteSandboxPage() {
  return (
    <Suspense>
      <FranceCompleteArena />
    </Suspense>
  );
}
