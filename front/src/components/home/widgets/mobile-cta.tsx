'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Scan, DeviceMobile } from '@/components/common/icons';
import { buttonVariants } from '@/components/ui/button';

const MOBILE_URL = 'https://hat-trick.app';

/** Closing banner: scan a QR code (or tap) to continue the experience on mobile. */
export function MobileCta() {
  return (
    <div className="flex flex-col items-center gap-8 rounded-2xl border border-neon/20 bg-surface-deep px-8 py-10 text-center md:flex-row md:justify-between md:text-left">
      <div className="flex flex-col items-center gap-3 md:items-start">
        <span className="text-[10px] font-bold tracking-widest text-neon uppercase">Continue no seu celular</span>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          O jogo não espera. <span className="text-neon">Leve ele com você.</span>
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Aponte a câmera pro código e sua sessão ao vivo abre no navegador do celular. Sem baixar nada.
        </p>
        <a
          href={MOBILE_URL}
          className={buttonVariants({ size: 'lg', className: 'mt-1 h-11 gap-2 px-6 text-base font-semibold' })}
        >
          <DeviceMobile className="size-5" />
          Continuar no celular
        </a>
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2">
        <div className="rounded-xl bg-foreground p-2.5">
          <QRCodeSVG value={MOBILE_URL} size={132} marginSize={1} level="M" bgColor="transparent" className="block" />
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Scan className="size-3.5" />
          Escaneia pra abrir
        </span>
      </div>
    </div>
  );
}
