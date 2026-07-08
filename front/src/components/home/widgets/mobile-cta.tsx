'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Scan, DeviceMobile } from '@/components/common/icons';
import { buttonVariants } from '@/components/ui/button';

const MOBILE_URL = 'https://hat-trick.app';

/** Closing banner: scan a QR code (or tap) to continue the experience on mobile. */
export function MobileCta() {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-neon/20 bg-surface-deep px-5 py-8 text-center sm:px-8 sm:py-10 md:flex-row md:justify-between md:gap-8 md:text-left">
      <div className="flex flex-col items-center gap-3 md:items-start">
        <span className="text-eyebrow text-neon">Continue on your phone</span>
        <h2 className="text-display">
          The game won&apos;t wait. <span className="text-neon">Take it with you.</span>
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Point your camera at the code and your live session opens in the phone browser. No download needed.
        </p>
        <a
          href={MOBILE_URL}
          className={buttonVariants({ size: 'lg', className: 'mt-1 h-11 gap-2 px-6 text-base font-semibold' })}
        >
          <DeviceMobile className="size-5" />
          Continue on phone
        </a>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2">
        <div className="rounded-xl bg-foreground p-2.5">
          <QRCodeSVG value={MOBILE_URL} size={132} marginSize={1} level="M" bgColor="transparent" className="block" />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Scan className="size-3.5" />
          Scan to open
        </span>
      </div>
    </div>
  );
}
