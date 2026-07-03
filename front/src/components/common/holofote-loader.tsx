import Image from 'next/image';

/** Spotlight (holofote) over a pulsing logo — the single loading visual for the app. */
export function HolofoteLoader() {
  return (
    <>
      <div className="fixed inset-0 z-[70] grid place-items-center bg-black">
        <Image
          src="/logo.png"
          alt="Hat-trick"
          width={472}
          height={481}
          priority
          className="holofote-logo h-auto w-[min(46vw,340px)]"
        />
      </div>
      <div className="holofote-spot pointer-events-none fixed inset-0 z-[71]" aria-hidden />
    </>
  );
}
