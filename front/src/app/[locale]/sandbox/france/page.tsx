import { FranceArena } from '@/components/txline-arena/france-arena';

/** Supported values for the sandbox's `?control=` query param. Defined here (a server module) —
 *  it must NOT live in the 'use client' arena module, or importing it into this Server Component
 *  yields a client-reference proxy whose members read `undefined` and invert the comparison. */
enum FranceControlMode {
  GkPlayerV2 = 'gk-player-v2',
}

export default async function FranceSandboxPage({ searchParams }: { searchParams: Promise<{ control?: string }> }) {
  const { control } = await searchParams;
  return <FranceArena keeperControl={control === FranceControlMode.GkPlayerV2} />;
}
