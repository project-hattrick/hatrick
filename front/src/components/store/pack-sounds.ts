/** Synthesized UI sounds for the pack-opening flow — Web Audio, no assets.
 *  All entry points must be called from a user gesture (AudioContext policy). */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext {
  audioContext ??= new AudioContext();
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

function createNoise(context: AudioContext, duration: number): AudioBufferSourceNode {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  return source;
}

/** Foil tear: noise burst with a bandpass sweeping down. */
export function playTearSound(): void {
  const context = getContext();
  const now = context.currentTime;
  const noise = createNoise(context, 0.4);
  const filter = context.createBiquadFilter();
  filter.type = 'bandpass';
  filter.Q.value = 0.8;
  filter.frequency.setValueAtTime(3200, now);
  filter.frequency.exponentialRampToValueAtTime(900, now + 0.35);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  noise.connect(filter).connect(gain).connect(context.destination);
  noise.start(now);
}

/** Card swipe: short airy whoosh. */
export function playSwipeSound(): void {
  const context = getContext();
  const now = context.currentTime;
  const noise = createNoise(context, 0.22);
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(600, now);
  filter.frequency.exponentialRampToValueAtTime(2400, now + 0.18);
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  noise.connect(filter).connect(gain).connect(context.destination);
  noise.start(now);
}

/** Reveal chime: quick ascending triangle arpeggio. */
export function playRevealSound(): void {
  const context = getContext();
  const now = context.currentTime;
  [523.25, 659.25, 783.99].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    const gain = context.createGain();
    const start = now + index * 0.07;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.4);
  });
}
