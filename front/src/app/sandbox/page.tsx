import { GameStage } from '@/components/game/game-stage';
import { HeadsOnlyStage } from '@/components/game/heads-only/heads-only-stage';
import { RealGkStage } from '@/components/game/real-gk/real-gk-stage';
import { DEFAULT_CHECKPOINT, RuntimeKind, getCheckpointMeta, isCheckpointId } from '@/game/checkpoints/registry';

export const metadata = {
  title: 'Sandbox — Hat-trick',
};

/** Dev playground: runs a checkpoint of the 2.5D engine. `?cp=<id>` selects the version + runtime. */
export default async function SandboxPage({ searchParams }: { searchParams: Promise<{ cp?: string }> }) {
  const { cp } = await searchParams;
  const checkpoint = cp && isCheckpointId(cp) ? cp : DEFAULT_CHECKPOINT;
  const { runtime } = getCheckpointMeta(checkpoint);

  if (runtime === RuntimeKind.HeadsOnly) return <HeadsOnlyStage />;
  if (runtime === RuntimeKind.RealGk) return <RealGkStage checkpoint={checkpoint} />;
  return <GameStage checkpoint={checkpoint} />;
}
