import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type IconButtonProps = React.ComponentProps<typeof Button> & { label: string };

/** Ghost icon control with a required accessible label. */
function IconButton({ label, className, size = 'icon', variant = 'ghost', ...props }: IconButtonProps) {
  return (
    <Button
      aria-label={label}
      size={size}
      variant={variant}
      className={cn('text-muted-foreground hover:text-foreground', className)}
      {...props}
    />
  );
}

export { IconButton };
