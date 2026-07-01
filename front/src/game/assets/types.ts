import type { GoalkeeperAnim, OutfieldAnim, Team } from '../enums';

/** Authoring-time description of one animation (data in the manifest). */
export interface AnimationSpec {
  frames: number;
  fps: number;
  scale: number;
  loop: boolean;
}

/** Runtime animation: resolved images + the derived frame step (ticks/frame). */
export interface Animation {
  images: HTMLImageElement[];
  step: number;
  scale: number;
  loop: boolean;
}

export type OutfieldSet = Record<OutfieldAnim, Animation>;
export type GoalkeeperSet = Record<GoalkeeperAnim, Animation>;

/** Everything one checkpoint needs to draw a match. */
export interface SpriteSets {
  stadium: HTMLImageElement;
  ball: HTMLImageElement[];
  outfield: Record<Team, OutfieldSet>;
  goalkeeper: GoalkeeperSet;
}

/** Pointers a checkpoint passes to the loader to resolve a SpriteSets bundle. */
export interface AssetManifest {
  stadium: string;
}
