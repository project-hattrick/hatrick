import Image from 'next/image';

/** Spotlight (holofote) over a pulsing logo — the single loading visual for the app. */
export function HolofoteLoader() {
  return (
    <>
      <div className="fixed inset-0 z-[70] grid place-items-center bg-black px-8">
        <div className="flex flex-col items-center gap-6">
          <div className="relative grid place-items-center">
            {/* Soft neon halo so the mark reads warm, not flat, on black. */}
            <div
              aria-hidden
              className="pointer-events-none absolute size-[min(64vw,340px)] rounded-full bg-neon/10 blur-[70px]"
            />
            <Image
              src="/logo.png"
              alt="Hat-trick"
              width={472}
              height={481}
              priority
              className="holofote-logo relative h-auto w-[min(52vw,300px)]"
            />
          </div>
          <div className="holofote-bar" role="progressbar" aria-label="Loading" />
        </div>
      </div>
      <div className="holofote-spot pointer-events-none fixed inset-0 z-[71]" aria-hidden />
    </>
  );
}
