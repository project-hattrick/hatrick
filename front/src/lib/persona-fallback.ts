/** Persona portraits shipped in public/personas (p01–p11). */
const PERSONA_COUNT = 11;

/**
 * Deterministic persona portrait for a user that hasn't set a photo — hashes the
 * seed (user id) to a stable `/personas/pNN.png` so members look distinct, not
 * identical. Real photos should be preferred; this is only the fallback.
 */
export function personaFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = (Math.abs(hash) % PERSONA_COUNT) + 1;
  return `/personas/p${String(index).padStart(2, '0')}.png`;
}
