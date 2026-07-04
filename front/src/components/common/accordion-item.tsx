'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CaretDown } from '@/components/common/icons';

interface AccordionItemProps {
  question: string;
  answer: string;
  className?: string;
}

/** Controlled disclosure item — one local useState is intentional for this leaf component. */
export function AccordionItem({ question, answer, className }: AccordionItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('border-b border-border/50 last:border-0', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium text-foreground transition hover:text-neon"
      >
        <span>{question}</span>
        <CaretDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{answer}</p>
      )}
    </div>
  );
}
