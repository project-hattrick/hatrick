'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Robot, X, WhatsappLogo } from '@/components/common/icons';
import { CrowdActionKind } from '@/enums/crowd-action-kind.enum';
import { useBetsStore } from '@/store/bets.store';
import { useUiStore } from '@/store/ui.store';
import { buildXIntentUrl, buildWhatsAppUrl, openShareUrl } from '@/lib/share';
import type { CrowdMessage, CrowdMessageAction } from '@/types/crowd';

// CTA click handlers per action kind — config record over switch.
const actionHandlers: Record<CrowdActionKind, (action: CrowdMessageAction) => void> = {
  [CrowdActionKind.OpenBetSlip]: (action) => {
    if (action.selection) useBetsStore.getState().select(action.selection);
  },
  [CrowdActionKind.OpenLogin]: () => useUiStore.getState().openLogin(),
  [CrowdActionKind.ShareMoment]: () => undefined, // rendered as share icon buttons instead
};

function ActionRow({ action }: { action: CrowdMessageAction }) {
  if (action.kind === CrowdActionKind.ShareMoment) {
    const text = action.shareText ?? '';
    return (
      <div className="mt-2 flex items-center gap-1.5">
        <span className="text-micro font-medium text-muted-foreground">Share this moment</span>
        <Button
          variant="outline"
          size="icon-xs"
          aria-label="Share on X"
          onClick={() => openShareUrl(buildXIntentUrl(text))}
        >
          <X weight="bold" />
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          aria-label="Share on WhatsApp"
          onClick={() => openShareUrl(buildWhatsAppUrl(text))}
        >
          <WhatsappLogo weight="bold" />
        </Button>
      </div>
    );
  }
  return (
    <Button size="xs" shape="pill" className="mt-2 self-start" onClick={() => actionHandlers[action.kind](action)}>
      {action.label ?? 'Open'}
    </Button>
  );
}

/** A HatBot system message — neon-accented card with an optional inline CTA. */
export function HatBotMessage({ message }: { message: CrowdMessage }) {
  return (
    <div className="animate-in rounded-lg border border-neon/25 bg-neon/5 p-3 fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="grid size-[18px] shrink-0 place-items-center rounded bg-neon text-black">
            <Robot weight="fill" className="size-3" />
          </span>
          <span className="truncate text-xs font-bold text-neon">HatBot</span>
          <span className="rounded bg-surface-3 px-1.5 py-0.5 text-micro font-bold tracking-wide text-muted-foreground uppercase">
            Bot
          </span>
        </div>
        <span className="shrink-0 text-micro font-medium text-muted-foreground">{message.ageLabel}</span>
      </div>
      <div className="mt-1 flex flex-col">
        <span className="text-sm text-foreground/90">{message.text}</span>
        {message.action ? <ActionRow action={message.action} /> : null}
      </div>
    </div>
  );
}
