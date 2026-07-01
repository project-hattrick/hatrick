'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Scan, DeviceMobile } from '@/components/common/icons';
import { buttonVariants } from '@/components/ui/button';

const MOBILE_URL = 'https://hat-trick.app';

/** Closing banner: scan a QR code (or tap) to continue the experience on mobile. */
export function MobileCta() {
  return (
    <div className="flex flex-col items-center gap-8 rounded-2xl border border-neon/30 bg-gradient-to-r from-neon/15 via-neon/5 to-transparent px-8 py-10 text-center md:flex-row md:justify-between md:text-left">
      <div className="flex flex-col items-center gap-3 md:items-start">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Keep playing <span className="text-neon">on your phone</span>
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Scan the QR code to make predictions and follow every match live, wherever you are.
        </p>
        <a
          href={MOBILE_URL}
          className={buttonVariants({ size: 'lg', className: 'mt-1 h-11 gap-2 px-6 text-base font-semibold' })}
        >
          <DeviceMobile className="size-5" />
          Continue on mobile
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
