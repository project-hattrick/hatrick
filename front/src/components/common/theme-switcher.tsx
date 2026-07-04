'use client';

import { useEffect, useState } from 'react';
import { Palette, CaretDown } from '@/components/common/icons';
import { GlassPanel } from '@/components/common/glass-panel';
import { Theme, parseTheme } from '@/enums/theme.enum';
import { themeCategories, themeConfig } from '@/config/theme.config';
import { useUiStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

/** Write the palette to <html data-theme> — every theme is applied explicitly (default included). */
function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

/**
 * Floating palette switcher (home-only dev tool). Seeds from the `?theme=` query param,
 * then mirrors the Zustand `theme` onto <html data-theme> so every token-driven surface
 * re-skins live. Built on the store so it can be promoted to a real user setting later.
 */
export function ThemeSwitcher() {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const [open, setOpen] = useState(false);

  // Seed once from the URL (?theme=obsidian). Client-only read avoids a Suspense boundary.
  useEffect(() => {
    const fromUrl = parseTheme(new URLSearchParams(window.location.search).get('theme'));
    if (fromUrl) setTheme(fromUrl);
  }, [setTheme]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const active = themeConfig[theme];

  return (
    <div className="pointer-events-auto fixed right-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 flex flex-col items-end gap-2">
      {open ? (
        <GlassPanel tone="dark" radius="lg" className="flex max-h-[72vh] flex-col gap-1 overflow-y-auto p-1.5">
          {themeCategories.map((cat) => (
            <div key={cat.label} className="flex flex-col gap-0.5">
              <span className="px-2 pt-1.5 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{cat.label}</span>
              {cat.themes.map((key) => {
                const meta = themeConfig[key];
                const selected = key === theme;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTheme(key)}
                    aria-pressed={selected}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-xs font-semibold transition',
                      selected ? 'bg-surface-3 text-foreground' : 'text-muted-foreground hover:bg-surface-3/60 hover:text-foreground',
                    )}
                  >
                    <span
                      className="size-4 shrink-0 rounded-full border border-white/15"
                      style={{ background: meta.surface, boxShadow: `inset 0 0 0 2px ${meta.accent}` }}
                    />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          ))}
        </GlassPanel>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch palette"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border/70 bg-surface-1/95 px-3 py-2 text-xs font-bold shadow-2xl backdrop-blur-md transition hover:bg-surface-3"
      >
        <Palette className="size-4 text-neon" />
        <span className="hidden sm:inline">{active.label}</span>
        <CaretDown className={cn('size-3 transition', open && 'rotate-180')} />
      </button>
    </div>
  );
}
