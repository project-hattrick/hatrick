import { Team } from '../enums';

interface Note {
  title: string;
  text: string;
}

/** English status-ticker copy (the prototype's PT strings, translated; content centralized). */
export const Status = {
  kickoff: (): Note => ({
    title: 'Kickoff',
    text: 'Both teams share one base doll, driven by AI, possession, pressing, passing and finishing to feel like a real match.',
  }),
  kick: (name: string, lob: boolean): Note =>
    lob
      ? { title: 'Long ball', text: `${name} lifted it forward.` }
      : { title: 'Pass / shot', text: `${name} sped up the play.` },
  gkOutlet: (name: string): Note => ({ title: 'Goalkeeper restart', text: `${name} started the play.` }),
  shot: (name: string): Note => ({ title: 'Shot', text: `${name} went for goal.` }),
  through: (name: string, mate: string): Note => ({ title: 'Through ball', text: `${name} finds ${mate}.` }),
  switchPlay: (name: string): Note => ({ title: 'Switch of play', text: `${name} lifted the ball.` }),
  save: (name: string): Note => ({ title: 'Save', text: `${name} held the ball.` }),
  goal: (team: Team): Note => ({
    title: `Goal — ${team === Team.Blue ? 'Blue' : 'Red'}`,
    text: 'The move ended in the net. Restart at center.',
  }),
  restart: (): Note => ({ title: 'Restart', text: 'Everything is set for the ball to roll again.' }),
  refereeCalled: (): Note => ({ title: 'Referee called', text: 'The referee left the patrol, turned and ran to the center.' }),
  redCard: (): Note => ({ title: 'Red card', text: 'The referee stopped and raised the card.' }),
  refereePatrol: (): Note => ({ title: 'Referee on patrol', text: 'The referee went back to slowly patrolling the touchline.' }),
};

export const BallText = {
  loose: 'ball loose',
  goal: 'goal',
  wins: (name: string): string => `${name} wins it`,
  onBall: (name: string): string => `${name} on the ball`,
};
