import { LOOP_STEP, MAX_SUBSTEPS } from './constants';

export interface LoopHandle {
  start: () => void;
  stop: () => void;
  togglePause: () => boolean;
  cycleSpeed: () => number;
  isPaused: () => boolean;
  getSpeed: () => number;
}

/**
 * Fixed-timestep loop: accumulates real time, runs `update` at 60 ticks/s (× speed), renders every
 * animation frame even while paused so the frozen state stays visible.
 */
export function createLoop(update: () => void, render: () => void): LoopHandle {
  let paused = false;
  let speed = 1;
  let raf = 0;
  let acc = 0;
  let last = 0;
  let running = false;

  const frame = (now: number): void => {
    acc += now - last;
    last = now;
    if (acc > 250) acc = 250;
    if (!paused) {
      let n = 0;
      while (acc >= LOOP_STEP && n < MAX_SUBSTEPS) {
        for (let k = 0; k < speed; k++) update();
        acc -= LOOP_STEP;
        n++;
      }
    }
    render();
    raf = requestAnimationFrame(frame);
  };

  return {
    start: () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop: () => {
      running = false;
      cancelAnimationFrame(raf);
    },
    togglePause: () => {
      paused = !paused;
      return paused;
    },
    cycleSpeed: () => {
      speed = speed === 1 ? 2 : speed === 2 ? 3 : 1;
      return speed;
    },
    isPaused: () => paused,
    getSpeed: () => speed,
  };
}
