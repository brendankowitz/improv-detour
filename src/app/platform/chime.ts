let context: AudioContext | null = null;
let unlocked = false;

/** True once someone has tapped or pressed a key, after which browsers allow sound and speech. */
export function isAudioUnlocked(): boolean {
  return unlocked;
}

/** Browsers only allow audio after a user gesture; call this from one. */
export function unlockAudio(): void {
  unlocked = true;
  if (typeof window === 'undefined' || !('AudioContext' in window)) return;
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
}

function tone(frequency: number, at: number, duration: number, gain: number): void {
  if (!context) return;
  const oscillator = context.createOscillator();
  const amp = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, at);
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(amp);
  amp.connect(context.destination);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.02);
}

export type Chime = 'start' | 'twist' | 'time-up' | 'mile';

const NOTES: Record<Chime, readonly (readonly [frequency: number, delay: number, duration: number])[]> = {
  start: [[523, 0, 0.12]],
  twist: [[660, 0, 0.1], [880, 0.1, 0.16]],
  'time-up': [[440, 0, 0.14], [660, 0.12, 0.22]],
  mile: [[523, 0, 0.1], [659, 0.09, 0.1], [784, 0.18, 0.24]],
};

export function chime(kind: Chime): void {
  unlockAudio();
  if (!context) return;
  const now = context.currentTime;
  for (const [frequency, delay, duration] of NOTES[kind]) tone(frequency, now + delay, duration, 0.07);
}
