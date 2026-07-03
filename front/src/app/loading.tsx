import { HolofoteLoader } from '@/components/common/holofote-loader';

/** Route transition fallback — the same pulsing holofote used by the landing intro. */
export default function Loading() {
  return <HolofoteLoader />;
}
