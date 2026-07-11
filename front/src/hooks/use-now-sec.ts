'use client';

import { useSyncExternalStore } from 'react';

// A 1-second wall-clock external store — the sanctioned way to read time during render
// (react-hooks/purity forbids Date.now() in render and setState-in-effect ticking).
const subscribeSecond = (onTick: () => void) => {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
};
const getNowSec = () => Math.floor(Date.now() / 1000);
const getServerNowSec = () => 0; // SSR never renders live clocks (store has no match yet).

/** Current epoch seconds, re-rendering every second. */
export function useNowSec(): number {
  return useSyncExternalStore(subscribeSecond, getNowSec, getServerNowSec);
}
