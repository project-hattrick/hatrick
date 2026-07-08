'use client';

import Image from 'next/image';
import { avatarImageProps, isUploadedPhoto } from '@/lib/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src: string;
  alt?: string;
  /** Rendered box size in px (square). */
  size: number;
  /** Extra classes for the frame (rounding, ring, border). */
  className?: string;
}

/**
 * A user portrait rendered correctly for both pixel-art personas (bottom-anchored,
 * pixelated) and uploaded photos (cover-crop). Shared by the navbar avatar, account
 * dropdown and duel VS surfaces so the treatment stays consistent.
 */
export function UserAvatar({ src, alt = '', size, className }: UserAvatarProps) {
  const { className: imgClass, style } = avatarImageProps(src);
  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-end overflow-hidden bg-gradient-to-b from-surface-3 to-surface-deep',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={imgClass}
        style={style}
        unoptimized={isUploadedPhoto(src)}
      />
    </span>
  );
}
