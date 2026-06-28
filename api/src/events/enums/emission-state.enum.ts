/**
 * The two-state emission contract (see docs/architecture.md).
 * Driven by the TxLINE score event `confirmed` boolean.
 */
export enum EmissionState {
  /** Optimistic / live — confirmed=false. Drives animation & instant UI. */
  During = 'during',
  /** Authoritative — confirmed=true. Drives settlement & attribute recalculation. */
  After = 'after',
}
