import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  src?: string;
  className?: string;
}

function fallbackSrc(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=222734&color=c1ff44`;
}

/** Small circular avatar with a generated initials fallback. */
function Avatar({ name, src, className }: AvatarProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ?? fallbackSrc(name)}
      alt={name}
      className={cn('rounded-full border border-border/60 object-cover', className)}
    />
  );
}

export { Avatar };
