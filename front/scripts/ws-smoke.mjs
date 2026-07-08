// End-to-end: connect to the realtime gateway, trigger a replay, watch events.
import { io } from 'socket.io-client';

const API = 'http://localhost:3344';
const counts = { during: 0, after: 0, odds: 0 };
let lastScore = null;
let matchEnd = null;
const sample = [];

const socket = io(API, { transports: ['websocket'] });
socket.on('connect', () => console.log('WS connected', socket.id));
socket.on('tournament-state.sync', (s) => console.log('sync:', JSON.stringify(s).slice(0, 100)));
socket.on('match-event.during', (p) => {
  counts.during++;
  if (p.score) lastScore = p.score;
  if (sample.length < 10) sample.push(`D ${p.minute ?? '-'}' ${p.rawAction ?? p.action}${p.score ? ` (${p.score.home ?? 0}-${p.score.away ?? 0})` : ''}`);
});
socket.on('match-event.after', (p) => { counts.after++; if (p.score) lastScore = p.score; });
socket.on('odds.update', () => { counts.odds++; });
socket.on('match-end.after', (p) => { matchEnd = p; console.log('>>> match-end.after', JSON.stringify(p)); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(800);
const res = await fetch(`${API}/replay`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fixtureId: 18198205, epochDay: 20640, startHour: 19, hours: 3, speed: 500 }),
});
console.log('POST /replay ->', res.status, await res.text());

for (let i = 0; i < 11; i++) {
  await sleep(5000);
  console.log(`t+${(i + 1) * 5}s  during=${counts.during} after=${counts.after} odds=${counts.odds} score=${lastScore ? `${lastScore.home ?? 0}-${lastScore.away ?? 0}` : '—'}${matchEnd ? ' [ENDED]' : ''}`);
  if (matchEnd) break;
}
console.log('\nsample during events:', sample);
console.log('final:', counts, 'score', lastScore, 'matchEnd', matchEnd && `${matchEnd.homeScore}-${matchEnd.awayScore} ${matchEnd.outcome}`);
await fetch(`${API}/replay/stop`, { method: 'POST' }).catch(() => {});
socket.close();
process.exit(0);
