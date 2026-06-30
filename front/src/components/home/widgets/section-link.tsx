import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionLinkProps {
  href: string;
  label: string;
  className?: string;
}

/** Small "view all" action used in panel headers. */
function SectionLink({ href, label, className }: SectionLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition hover:text-neon',
        className,
      )}
    >
      {label}
      <ArrowRight className="size-3" />
    </Link>
  );
}

export { SectionLink };
