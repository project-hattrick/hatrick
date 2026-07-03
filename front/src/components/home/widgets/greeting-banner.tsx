import Link from 'next/link';
import { Play } from '@/components/common/icons';
import { buttonVariants } from '@/components/ui/button';
import { AppMode } from '@/enums/app-mode.enum';

/** Welcome-back header right below the hero: greeting plus the main CTA. */
export function GreetingBanner() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Good to see you again 👋</h1>
      <Link
        href={`/${AppMode.Live}`}
        className={buttonVariants({ size: 'lg', className: 'h-11 shrink-0 gap-2 px-6 text-base font-semibold' })}
      >
        <Play className="size-5" />
        Jump into a match
      </Link>
    </div>
  );
}
