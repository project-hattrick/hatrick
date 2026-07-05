'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
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
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border/60 bg-surface-deep/60 transition-all duration-300',
        open ? 'border-neon/40' : 'hover:border-border',
      )}
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
            open ? 'bg-neon text-background' : 'bg-muted text-muted-foreground',
          )}
        >
          {open ? <Minus className="size-3" /> : <Plus className="size-3" />}
        </span>
      </button>

      {open && (
        <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{answer}</p>
      )}
    </div>
  );
}

/** Landing FAQ block (faq-2 style): category tabs + plus/minus accordion, fed by faq.config. */
export function FaqSection() {
  const [active, setActive] = useState<FaqCategory>(FAQ_CATEGORY_ORDER[0]);

  const items = useMemo(
    () => faqItems.filter((item) => item.category === active),
    [active],
  );

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-16 md:py-20">
      <div className="mb-10 max-w-xl text-center md:mb-12">
        <span className="text-eyebrow text-neon">Need help?</span>
        <h2 className="text-display mt-3 text-foreground">Frequently asked questions</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Everything you need to know about Live Mode, Fantasy duels, wallets, and the TxLINE feed.
        </p>
      </div>

      <div className="mb-8 w-full">
        <div className="scrollbar-hide mx-auto flex w-fit max-w-full items-center gap-1.5 overflow-x-auto rounded-full bg-muted px-1 py-1.5">
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
      </div>

      <div className="flex w-full flex-col gap-2.5">
        {items.map((item) => (
          <FaqRow key={item.q} question={item.q} answer={item.a} />
        ))}
      </div>
    </section>
  );
}
