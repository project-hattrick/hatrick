import { MatchAction } from '@/enums/match-action.enum';

/** Live-match snapshot handed to message templates (team = the event's protagonist side). */
export interface ReactionContext {
  teamCode: string;
  teamName: string;
  otherCode: string;
  otherName: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  /** "ARG 2-1 FRA" */
  scoreline: string;
  playerLabel?: string;
  /** Shot/penalty/VAR result qualifier when present (`Woodwork`, `Missed`, `Overturned`…). */
  outcome?: string;
  /** VAR review subject when the event is a VAR call (`Goal`, `Penalty`, `RedCard`…). */
  varType?: string;
}

export type CrowdTemplate = (ctx: ReactionContext) => string;

/** Fan reactions per event: the protagonist's fans celebrate, the other side laments. */
export interface ReactionSet {
  celebrate: CrowdTemplate[];
  lament: CrowdTemplate[];
  neutral: CrowdTemplate[];
}

export const crowdReactions: Partial<Record<MatchAction, ReactionSet>> = {
  [MatchAction.Goal]: {
    celebrate: [
      (c) => `GOOOOAL ${c.teamCode}!!! ⚽🔥`,
      (c) => `${c.playerLabel ?? c.teamName} YOU BEAUTY 😍`,
      (c) => `${c.scoreline} — we are cooking 🍳🔥`,
      (c) => `That finish at ${c.minute}'... cinema 🎬`,
      () => `I TOLD YOU. I CALLED IT 🗣️`,
    ],
    lament: [
      (c) => `No way... ${c.otherCode} defense was SLEEPING 😴`,
      () => `Check the VAR please 🙏 that's offside`,
      (c) => `${c.scoreline}... still time, keep the faith 💔`,
      () => `Keeper had no chance tbf 🧤`,
    ],
    neutral: [(c) => `What a game. ${c.scoreline} at ${c.minute}' 🍿`],
  },
  [MatchAction.Penalty]: {
    celebrate: [
      (c) => `PENALTY FOR ${c.teamCode}!! 🎯`,
      () => `Stone cold pen. No debate ⚖️`,
      (c) => `${c.minute}' and it all changes 😱`,
    ],
    lament: [
      () => `NEVER a penalty 😡 referee is blind`,
      (c) => `${c.otherCode} got robbed there 🤬`,
    ],
    neutral: [
      (c) =>
        c.outcome === 'Missed'
          ? `PENALTY MISSED!! 😱 you cannot write this`
          : c.outcome === 'Saved'
            ? `SAVED!! 🧤🔥 the keeper is a WALL`
            : c.outcome === 'Retake'
              ? `RETAKE ordered 😵 nerves of absolute steel now`
              : `Penalty drama incoming... hold your breath ⏳`,
    ],
  },
  [MatchAction.Shot]: {
    celebrate: [
      (c) => (c.outcome === 'Woodwork' ? `OFF THE WOODWORK!! ${c.teamCode} inches away 😩🪵` : `OOOH ${c.teamCode} force a big save 🧤`),
      (c) => `${c.playerLabel ?? c.teamName} testing the keeper 🔥`,
    ],
    lament: [(c) => (c.outcome === 'Woodwork' ? `Heart in my mouth 😰 saved by the frame` : `Get that cleared 🙏`)],
    neutral: [
      (c) => (c.outcome === 'Woodwork' ? `THE POST!! whole stadium gasps 😱` : `Chance at ${c.minute}' — end to end stuff 🍿`),
    ],
  },
  [MatchAction.RedCard]: {
    celebrate: [
      (c) => `RED! ${c.otherCode} down to ten 🟥`,
      () => `Deserved. Reckless challenge 😤`,
    ],
    lament: [
      () => `That's harsh, yellow at most 🟨`,
      (c) => `Down a man at ${c.minute}'... nightmare 💀`,
    ],
    neutral: [() => `Red card!! Game flipped upside down 🟥😱`],
  },
  [MatchAction.YellowCard]: {
    celebrate: [(c) => `Book him ref! ${c.playerLabel ?? 'He'} knew it 🟨`],
    lament: [() => `Soft yellow, ref is card happy today 🙄`],
    neutral: [(c) => `Yellow at ${c.minute}' — walking a tightrope now 🟨`],
  },
  [MatchAction.Corner]: {
    celebrate: [
      (c) => `Corner ${c.teamCode} — big heads in the box 🎯`,
      () => `Pressure building... something's coming 👀`,
    ],
    lament: [() => `Clear it PLEASE 😬`],
    neutral: [(c) => `Corner count rising for ${c.teamCode} 📈`],
  },
  [MatchAction.FreeKick]: {
    celebrate: [(c) => `Free kick in range for ${c.teamCode}... 👀`],
    lament: [() => `Dangerous spot, wall better be perfect 😬`],
    neutral: [() => `Set piece specialists, time to shine ✨`],
  },
  [MatchAction.Var]: {
    celebrate: [],
    lament: [],
    neutral: [
      (c) =>
        c.outcome === 'Overturned'
          ? `VAR OVERTURNS IT 🤯 ${c.varType ?? 'the call'} reversed!`
          : c.outcome === 'Stands'
            ? `VAR says it STANDS ✅ decision confirmed`
            : `VAR check... here we go ⏳`,
      () => `Stadium holding its breath 😶`,
      () => `VAR again?? Just play football 🙃`,
    ],
  },
  [MatchAction.Substitution]: {
    celebrate: [(c) => `Fresh legs for ${c.teamCode} 🔁`],
    lament: [() => `Why take HIM off?? 🤯`],
    neutral: [(c) => `Sub at ${c.minute}' — tactical chess ♟️`],
  },
};

/** Ambient chatter templates — contextual filler between events (mixed with the generic pool). */
export const ambientTemplates: CrowdTemplate[] = [
  (c) => `${c.scoreline} at ${c.minute}'... every minute hurts 😅`,
  (c) => `${c.teamName} need to wake up before it's too late ⏰`,
  (c) => `This ${c.teamCode} vs ${c.otherCode} game is living up to the hype 🍿`,
  (c) => `${c.minute} minutes in and my heart can't take it 💓`,
  () => `Midfield battle is unreal right now ⚔️`,
  (c) => `Somebody create something!! ${c.scoreline} won't hold 🔮`,
];
