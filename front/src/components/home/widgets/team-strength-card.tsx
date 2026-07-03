import { GlassPanel } from '@/components/common/glass-panel';
import { Lightning } from '@/components/common/icons';
import { teamStrength } from '@/config/formation.config';

/** Squad rating breakdown — overall plus attack/mid/defense bars and chemistry. */
export function TeamStrengthCard() {
  return (
    <GlassPanel tone="dark" radius="xl" className="flex flex-col gap-4 p-5">
      <div className="flex items-end justify-between">
        <span className="text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
          Força do time
        </span>
        <span className="font-mono text-4xl leading-none font-bold text-neon tabular-nums">
          {teamStrength.overall}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {teamStrength.lines.map((line) => (
          <div key={line.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold tracking-wide uppercase">
              <span className="text-muted-foreground">{line.label}</span>
              <span className="text-foreground tabular-nums">{line.value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-neon" style={{ width: `${line.value}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-muted-foreground">
        <Lightning weight="fill" className="size-4 text-neon" />
        Química <span className="font-bold text-foreground">{teamStrength.chemistry}</span> · {teamStrength.chemistryNote}
      </div>
    </GlassPanel>
  );
}
