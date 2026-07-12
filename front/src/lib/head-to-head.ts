import type { DuelHistoryDto } from '@/services/fantasy.service';
import type { PlayerProfile } from '@/config/duelists.config';
import type { HeadToHead } from '@/config/profile-mock';

const FINISHED = 'Finished';
const WIN = 'Win';
const LOSS = 'Loss';

/**
 * Real head-to-head record vs one opponent, from the signed-in user's duel
 * history. Duels store the opponent as a display name, so we match against the
 * profile's name/username (case-insensitive). Draws count for neither side.
 */
export function realHeadToHead(duels: DuelHistoryDto[], profile: PlayerProfile): HeadToHead {
  const names = new Set(
    [profile.name, profile.username].filter(Boolean).map((n) => n.toLowerCase()),
  );
  let mine = 0;
  let theirs = 0;
  for (const duel of duels) {
    if (duel.status !== FINISHED || !duel.opponentName) continue;
    if (!names.has(duel.opponentName.toLowerCase())) continue;
    if (duel.hostResult === WIN) mine += 1;
    else if (duel.hostResult === LOSS) theirs += 1;
  }
  return { mine, theirs };
}
