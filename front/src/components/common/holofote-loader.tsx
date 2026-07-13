import Image from 'next/image';

/** Small, dry pulsing mark on black — the single loading visual for the app. */
export function HolofoteLoader() {
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black"
      role="status"
      aria-label="Loading"
    >
      <Image
        src="/logo.png"
        alt="Hatrick"
        width={472}
        height={481}
        priority
        className="holofote-logo h-auto w-[64px]"
      />
      <p className="absolute bottom-8 text-[10px] font-medium uppercase tracking-[0.2em] text-white/25">
        Powered by <span className="text-white/40">TxLINE</span>
      </p>
    </div>
  );
}
