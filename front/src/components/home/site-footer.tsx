import Link from 'next/link';
import { BrandMark } from '@/components/common/brand-mark';
import { footerColumns } from '@/config/home.config';

/** Landing footer with link columns and the devnet / compliance disclaimer. */
export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border/60 bg-background px-6 py-14">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 md:flex-row md:justify-between">
        <Link href="/" className="flex items-center gap-2 text-neon">
          <BrandMark className="size-8" />
          <span className="text-lg font-bold text-foreground">Hat-trick</span>
        </Link>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {footerColumns.map((column) => (
            <div key={column.title} className="flex flex-col gap-3">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{column.title}</span>
              {column.links.map((label) => (
                <Link key={label} href="#" className="text-sm text-foreground/80 transition hover:text-foreground">
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="mx-auto mt-10 w-full max-w-6xl text-xs text-muted-foreground">
        Devnet demo · play-money only · not affiliated with FIFA.
      </p>
    </footer>
  );
}
