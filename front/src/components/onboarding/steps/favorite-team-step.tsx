'use client';

import { Button } from '@/components/ui/button';
import { Check } from '@/components/common/icons';
import { cn } from '@/lib/utils';
import { NATIONS } from '@/config/pack-pool.config';

/** Second step — pick a nation to root for. Personalises the profile and the packs to come. */
export function FavoriteTeamStep({
  selected,
  onSelect,
  onNext,
}: {
  selected?: string;
  onSelect: (code: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-micro text-center text-muted-foreground">
        Pick the nation you&apos;ll fly. You can change it later on your profile.
      </p>

      <div className="grid max-h-[46vh] grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
        {NATIONS.map((nation) => {
          const active = selected === nation.code;
          return (
            <button
              key={nation.code}
              type="button"
              onClick={() => onSelect(nation.code)}
              className={cn(
                'relative flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition',
                active
                  ? 'border-neon bg-neon/10 text-foreground'
                  : 'border-border bg-surface-2/60 text-muted-foreground hover:border-neon/40 hover:text-foreground',
              )}
            >
              {active && (
                <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-full bg-neon text-primary-foreground">
                  <Check className="size-3" weight="bold" />
                </span>
              )}
              <span className="text-2xl leading-none">{nation.flag}</span>
              <span className="max-w-full truncate text-micro font-bold">{nation.name}</span>
            </button>
          );
        })}
      </div>

      <Button size="lg" shape="pill" className="w-full" disabled={!selected} onClick={onNext}>
        {selected ? 'Continue' : 'Pick a nation'}
      </Button>
    </div>
  );
}
