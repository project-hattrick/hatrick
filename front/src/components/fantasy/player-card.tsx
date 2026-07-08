import { cn } from '@/lib/utils';
import { statOrder, type PlayerCardData } from '@/config/fantasy-cards.config';

/** Collectible FUT-style player card (fixed size, shared blue treatment). */
export function PlayerCard({ card, className }: { card: PlayerCardData; className?: string }) {
  return (
    <div
      className={cn(
        'relative flex h-[124px] w-[88px] shrink-0 flex-col items-center rounded-xl p-2 text-white shadow-e3 ring-1 ring-sky-300/40',
        'bg-gradient-to-b from-[#3b82f6] via-[#1e40af] to-[#0f1e4d]',
        className,
      )}
    >
      <div className="flex w-full items-start justify-between px-0.5">
        <div className="flex flex-col items-center leading-none">
          <span className="text-base font-black text-amber-300">{card.rating}</span>
          <span className="text-[8px] font-bold text-sky-200">{card.position}</span>
        </div>
        <span className="size-7 rounded-full bg-sky-300/25 ring-1 ring-sky-200/50" />
      </div>
      <span className="mt-0.5 w-full truncate text-center text-[9px] font-black tracking-tight uppercase">{card.name}</span>
      <div className="mt-auto grid w-full grid-cols-2 gap-x-2 gap-y-px px-1 text-[7px] font-semibold text-sky-100">
        {statOrder.map(([label, key]) => (
          <div key={key} className="flex items-center justify-between">
            <span>{card.stats[key]}</span>
            <span className="text-sky-300/80">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
