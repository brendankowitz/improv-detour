import type { Clock } from './types';

export function createClock(durationMs: number): Clock {
  return { durationMs, elapsedBeforeMs: 0, startedAt: null };
}

export function isRunning(clock: Clock): boolean {
  return clock.startedAt !== null;
}

export function elapsed(clock: Clock, now: number): number {
  const running = clock.startedAt === null ? 0 : Math.max(0, now - clock.startedAt);
  return Math.min(clock.durationMs, clock.elapsedBeforeMs + running);
}

export function remaining(clock: Clock, now: number): number {
  return clock.durationMs - elapsed(clock, now);
}

export function isExpired(clock: Clock, now: number): boolean {
  return remaining(clock, now) <= 0;
}

export function start(clock: Clock, now: number): Clock {
  return clock.startedAt === null ? { ...clock, startedAt: now } : clock;
}

export function stop(clock: Clock, now: number): Clock {
  if (clock.startedAt === null) return clock;
  return { ...clock, elapsedBeforeMs: elapsed(clock, now), startedAt: null };
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
