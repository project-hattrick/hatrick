'use client';

/** Slider + typeable number (commit on Enter/blur, free of the slider's bounds) + "all" propagation. */
export function SliderRow({
  label,
  value,
  changed,
  min,
  max,
  step,
  onCommit,
  onAll,
}: {
  label: string;
  value: number;
  changed: boolean;
  min: number;
  max: number;
  step: number;
  onCommit: (v: number) => void;
  onAll: () => void;
}) {
  const commitText = (el: HTMLInputElement) => {
    const n = Number(el.value);
    if (Number.isFinite(n) && Math.abs(n - value) > 1e-6) onCommit(n);
  };
  return (
    <label className="flex items-center gap-2 text-[11px]">
      <span className={`w-20 ${changed ? 'font-bold text-amber-300' : 'text-white/60'}`} title={changed ? 'differs from the checked-in source' : undefined}>
        {label}
        {changed ? ' •' : ''}
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onCommit(Number(e.target.value))} className="flex-1 accent-emerald-400" />
      <input
        key={value}
        type="number"
        step={step}
        defaultValue={Number(value.toFixed(3))}
        onKeyDown={(e) => e.key === 'Enter' && commitText(e.target as HTMLInputElement)}
        onBlur={(e) => commitText(e.target)}
        className="w-16 rounded bg-slate-800 px-1 py-0.5 text-right font-mono text-white/80"
      />
      <button onClick={onAll} title="Apply this value to every frame of EVERY anim of this character" className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] hover:bg-sky-500 hover:text-black">
        all
      </button>
    </label>
  );
}
