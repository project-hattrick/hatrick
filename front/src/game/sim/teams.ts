import { FIELD } from '../core/constants';
import { Team } from '../enums';

/** Attacking direction along X: Blue attacks +x, Red attacks -x. */
export const dirOf = (t: Team): number => (t === Team.Blue ? 1 : -1);

/** X of the goal a team attacks. */
export const goalX = (t: Team): number => (t === Team.Blue ? FIELD.width : 0);

/** X of the goal a team defends. */
export const ownX = (t: Team): number => (t === Team.Blue ? 0 : FIELD.width);

export const oppTeam = (t: Team): Team => (t === Team.Blue ? Team.Red : Team.Blue);
