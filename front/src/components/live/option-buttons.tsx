import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatPoints } from '@/lib/format';

export interface PredictionOption {
  label: string;
  points: number;
  kind: 'primary' | 'secondary';
}

interface OptionButtonsProps {
  options: PredictionOption[];
  picked?: string;
  disabled?: boolean;
  onPick?: (optionLabel: string) => void;
}

/** Right-side options. One primary (DS accent), the rest neutral; each shows its reward. */
function OptionButtons({ options, picked, disabled, onPick }: OptionButtonsProps) {
  return (
    <div role="group" className="flex shrink-0 gap-2">
      {options.map((option) => {
        const isPicked = picked === option.label;
        const dimmed = Boolean(picked) && !isPicked;
        return (
          <Button
            key={option.label}
            type="button"
            variant={option.kind === 'primary' ? 'default' : 'secondary'}
            aria-pressed={isPicked}
            aria-label={`${option.label}, ${formatPoints(option.points)} points`}
            disabled={disabled || dimmed}
            onClick={() => onPick?.(option.label)}
            className={cn(
              'h-auto flex-col gap-0.5 rounded-2xl px-4 py-2 transition-all duration-[var(--duration-base)] ease-soft',
              isPicked && 'ring-2 ring-primary',
            )}
          >
            <span className="text-sm leading-tight font-bold">{option.label}</span>
            <span className="text-xs font-semibold opacity-80">{formatPoints(option.points)} pts</span>
          </Button>
        );
      })}
    </div>
  );
}

export { OptionButtons };
