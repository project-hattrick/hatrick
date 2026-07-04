/**
 * Persona head sprites (P01–P11) — original pixel-art characters (transparent PNG busts)
 * used as user avatars across the app. See docs/personas.md for the casting system.
 * Country lives in the kit, not the face, so any persona can represent any player.
 */
export const personaAvatars = [
  '/personas/p01.png',
  '/personas/p02.png',
  '/personas/p03.png',
  '/personas/p04.png',
  '/personas/p05.png',
  '/personas/p06.png',
  '/personas/p07.png',
  '/personas/p08.png',
  '/personas/p09.png',
  '/personas/p10.png',
  '/personas/p11.png',
] as const;

export const PERSONA_COUNT = personaAvatars.length;

/** Pick a persona avatar by index, wrapping around the available heads. */
export const personaAvatar = (index: number): string =>
  personaAvatars[((index % PERSONA_COUNT) + PERSONA_COUNT) % PERSONA_COUNT];
