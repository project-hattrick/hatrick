/** Looping synthesized stadium ambience (brown noise + slow swells) for the live hero.
 *  Web Audio only — no assets. Autoplay-safe: if the context starts suspended,
 *  it resumes on the first user gesture while the ambience is wanted. */

const TARGET_VOLUME = 0.05;
const FADE_SECONDS = 1.2;

let context: AudioContext | null = null;
let masterGain: GainNode | null = null;
let wanted = false;

function buildGraph(): void {
  context = new AudioContext();

  // 2s brown-noise loop — reads as distant crowd rumble once lowpassed
  const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    last += (Math.random() * 2 - 1) * 0.02;
    last *= 0.998;
    data[i] = last * 3.5;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 700;

  masterGain = context.createGain();
  masterGain.gain.value = 0;

  // Slow swells so the crowd "breathes" instead of droning
  const lfo = context.createOscillator();
  lfo.frequency.value = 0.13;
  const lfoDepth = context.createGain();
  lfoDepth.gain.value = TARGET_VOLUME * 0.4;
  lfo.connect(lfoDepth).connect(masterGain.gain);

  source.connect(filter).connect(masterGain).connect(context.destination);
  source.start();
  lfo.start();

  // Browsers block AudioContext before a gesture — retry on the first one
  const resumeOnGesture = () => {
    if (wanted && context?.state === 'suspended') void context.resume();
  };
  window.addEventListener('pointerdown', resumeOnGesture);
  window.addEventListener('keydown', resumeOnGesture);
}

export function startCrowdAmbience(): void {
  wanted = true;
  if (!context) buildGraph();
  if (!context || !masterGain) return;
  if (context.state === 'suspended') void context.resume();
  masterGain.gain.cancelScheduledValues(context.currentTime);
  masterGain.gain.setTargetAtTime(TARGET_VOLUME, context.currentTime, FADE_SECONDS / 3);
}

export function stopCrowdAmbience(): void {
  wanted = false;
  if (!context || !masterGain) return;
  masterGain.gain.cancelScheduledValues(context.currentTime);
  masterGain.gain.setTargetAtTime(0, context.currentTime, FADE_SECONDS / 4);
}
