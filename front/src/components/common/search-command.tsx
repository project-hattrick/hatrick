'use client';

import { useEffect, useState, useDeferredValue } from 'react';
import Image from 'next/image';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Flag } from '@/components/common/flag';
import { MagnifyingGlass, Sword, ArrowRight } from '@/components/common/icons';
import { fifaToIso } from '@/lib/country';
import { rankTierConfig } from '@/config/matchmaking.config';
import { useSearchDuelists } from '@/services/queries/use-search-duelists';
import { useUiStore } from '@/store/ui.store';
import { useLocalizedRouter } from '@/hooks/use-localized-path';
import { useT } from '@/i18n/i18n-provider';

/** Global ⌘K command palette to find players and jump to their profile. Mounted once app-wide. */
export function SearchCommand() {
  const open = useUiStore((s) => s.searchOpen);
  const setSearchOpen = useUiStore((s) => s.setSearchOpen);
  const toggleSearch = useUiStore((s) => s.toggleSearch);
  const localizedRouter = useLocalizedRouter();
  const t = useT();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const { data = [], isFetching } = useSearchDuelists(deferredQuery);

  // Global ⌘K / Ctrl-K hotkey — the one sanctioned effect here (UI plumbing, not data).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSearch]);

  const go = (username: string) => {
    setSearchOpen(false);
    setQuery('');
    localizedRouter.push(`/duelists/${username}`);
  };

  return (
    <Dialog open={open} onOpenChange={setSearchOpen}>
      <DialogContent showCloseButton={false} className="top-[12%] max-w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:top-[12%] sm:max-w-lg">
        <DialogTitle className="sr-only">{t('search.title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('search.description')}</DialogDescription>

        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <MagnifyingGlass className="size-5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full min-w-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-micro hidden rounded border border-border/60 px-1.5 py-0.5 text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>

        <div data-lenis-prevent className="custom-scrollbar max-h-80 overflow-y-auto overscroll-contain p-2">
          {query.trim().length === 0 ? (
            <p className="text-micro px-3 py-6 text-center text-muted-foreground">
              {t('search.empty')}
            </p>
          ) : data.length === 0 ? (
            <p className="text-micro px-3 py-6 text-center text-muted-foreground">
              {isFetching ? t('search.searching') : t('search.noResults', { query })}
            </p>
          ) : (
            data.map((d) => {
              const tier = rankTierConfig[d.tier];
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => go(d.username)}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-surface-2/70"
                >
                  <span className="relative grid size-9 shrink-0 place-items-end overflow-hidden rounded-full bg-gradient-to-b from-surface-3 to-surface-deep ring-1 ring-white/10">
                    <Image
                      src={d.portraitSrc}
                      alt={d.name}
                      width={36}
                      height={36}
                      className="translate-y-[6%] scale-110 object-contain object-bottom"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-1.5">
                      <Flag code={fifaToIso(d.country)} className="text-xs" />
                      <span className="truncate text-sm font-semibold">{d.name}</span>
                    </span>
                    <span className="text-micro text-muted-foreground">
                      {tier.label} {d.division} · {d.rating} MMR
                    </span>
                  </span>
                  <Sword className="size-4 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </button>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setSearchOpen(false);
            localizedRouter.push('/duelists');
          }}
          className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-left text-xs text-muted-foreground transition hover:text-foreground"
        >
          {t('search.browseAll')}
          <ArrowRight className="size-4" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
