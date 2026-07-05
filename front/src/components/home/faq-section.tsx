'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { GlassPanel } from '@/components/common/glass-panel';
import { SectionLink } from './widgets/section-link';
import { Plus, Minus } from '@/components/common/icons';
import {
  faqItems,
  FAQ_CATEGORY_ORDER,
  FAQ_CATEGORY_ICON,
} from '@/config/faq.config';
import type { FaqCategory } from '@/enums/faq-category.enum';

interface FaqRowProps {
  question: string;
  answer: string;
}

/** Single plus/minus disclosure row — one local useState is intentional for this leaf. */
function FaqRow({ question, answer }: FaqRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <GlassPanel
      tone="dark"
      radius="lg"
      className={cn('overflow-hidden transition-colors', open && 'border-neon/40')}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span
          className={cn(
            'text-sm font-medium leading-snug transition-colors md:text-base',
            open ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground',
          )}
        >
          {question}
        </span>
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-full transition-all duration-300',
            open ? 'bg-neon text-background' : 'bg-surface-2 text-muted-foreground',
          )}
        >
          {open ? <Minus className="size-3" /> : <Plus className="size-3" />}
        </span>
      </button>

      {open && (
        <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{answer}</p>
      )}
    </GlassPanel>
  );
}

/** Landing FAQ block: category tabs + plus/minus accordion, fed by faq.config. */
export function FaqSection() {
  const [active, setActive] = useState<FaqCategory>(FAQ_CATEGORY_ORDER[0]);

  const items = useMemo(
    () => faqItems.filter((item) => item.category === active),
    [active],
  );

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-6 py-16 md:py-20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-eyebrow text-neon">Need help?</span>
          <h2 className="text-title">Frequently asked questions</h2>
          <p className="text-sm text-muted-foreground">
            Everything about Live Mode, Fantasy duels, wallets, and the TxLINE feed.
          </p>
        </div>
        <SectionLink href="/faq" label="Full help center" className="mt-2" />
      </div>

      <div className="scrollbar-hide flex w-fit max-w-full items-center gap-1.5 overflow-x-auto rounded-full bg-surface-1/95 p-1.5">
        {FAQ_CATEGORY_ORDER.map((category) => {
          const Icon = FAQ_CATEGORY_ICON[category];
          const isActive = active === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-neon text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {category}
            </button>
          );
        })}
      </div>

      <div className="grid gap-2.5 md:grid-cols-2">
        {items.map((item) => (
          <FaqRow key={item.q} question={item.q} answer={item.a} />
        ))}
      </div>
    </section>
  );
}
