import type { CSSProperties } from 'react';

/** Default self avatar when the user hasn't set a portrait yet (P01 persona). */
export const DEFAULT_SELF_PORTRAIT = '/personas/p01.png';

/** Uploaded photos are stored as data URLs; presets are `/personas/*` or `/cards/*` art paths. */
export const isUploadedPhoto = (src: string): boolean => src.startsWith('data:');

/** Avatar image props differ for real photos (cover-crop, smooth) vs pixel-art personas. */
export function avatarImageProps(src: string): { className: string; style?: CSSProperties } {
  return isUploadedPhoto(src)
    ? { className: 'size-full object-cover' }
    : {
        className: 'translate-y-[6%] scale-110 object-contain object-bottom',
        style: { imageRendering: 'pixelated' },
      };
}
