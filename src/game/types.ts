export const SUITS = ['where', 'who', 'how', 'twist', 'warmup'] as const;
export type Suit = (typeof SUITS)[number];

export const SKILLS = [
  'listening',
  'accepting',
  'building',
  'specificity',
  'emotion',
  'status',
  'character',
  'storytelling',
] as const;
export type Skill = (typeof SKILLS)[number];

export type Volume = 'quiet' | 'normal' | 'loud';
export type Level = 'easy' | 'stretch';

/** A How card whose rule the app can prompt for on every line. */
export type Cue = 'yes-and' | 'questions' | 'fortunately' | 'alphabet' | 'three-words' | 'last-word' | 'no-i';

export interface WarmupConfig {
  readonly seconds: number;
  /** One is picked at random and shown as the starting line or topic. */
  readonly seeds?: readonly string[];
  /** Shown in rotation, one per turn, when the turn is advanced. */
  readonly turnCues?: readonly string[];
  /** Replays the same story at shrinking lengths, e.g. 60 → 30 → 15 seconds. */
  readonly halfLife?: boolean;
}

export interface Card {
  readonly id: string;
  readonly suit: Suit;
  readonly title: string;
  readonly prompt: string;
  readonly tip?: string;
  readonly skill: Skill;
  readonly level: Level;
  readonly volume: Volume;
  /** Playable by someone who can't use their eyes or hands, like a driver. */
  readonly handsFree: boolean;
  /** Playable without standing up or moving around. */
  readonly seated: boolean;
  readonly minPlayers: number;
  readonly cue?: Cue;
  readonly warmup?: WarmupConfig;
}

export interface Filters {
  /** Leave out cards that get loud. */
  readonly quiet: boolean;
  /** Only cards a voice-only player can join. */
  readonly handsFree: boolean;
  /** Only cards playable sitting down. */
  readonly seated: boolean;
  /** Include stretch cards as well as easy ones. */
  readonly stretch: boolean;
}

export type SceneSeconds = 45 | 60 | 90;

export interface Settings {
  readonly filters: Filters;
  readonly sceneSeconds: SceneSeconds;
  readonly useHow: boolean;
  readonly useTwists: boolean;
  /** The phone names each speaker and needs a tap per line. Off means lines flow freely. */
  readonly callTurns: boolean;
  readonly voice: boolean;
}

export interface Player {
  readonly id: string;
  readonly name: string;
}

/** A pausable countdown that never reads the clock itself. */
export interface Clock {
  readonly durationMs: number;
  readonly elapsedBeforeMs: number;
  /** Wall-clock start of the current running stretch, or null when stopped. */
  readonly startedAt: number | null;
}

export type ScenePhase = 'brief' | 'live' | 'button';

export interface SceneRound {
  readonly kind: 'scene';
  readonly whereId: string;
  readonly whoId: string;
  readonly howId: string | null;
  readonly twistId: string | null;
  readonly twistShown: boolean;
  readonly phase: ScenePhase;
  readonly clock: Clock;
  /** Lines called so far; only meaningful with callTurns. */
  readonly line: number;
}

export type WarmupPhase = 'brief' | 'live' | 'done';

export interface WarmupRound {
  readonly kind: 'warmup';
  readonly cardId: string;
  readonly seed: string | null;
  readonly phase: WarmupPhase;
  readonly clock: Clock;
  readonly turn: number;
  /** Index into the half-life lengths; 0 for ordinary warm-ups. */
  readonly pass: number;
}

export type Round = SceneRound | WarmupRound;

export interface LogEntry {
  readonly id: string;
  readonly at: number;
  readonly kind: 'scene' | 'warmup';
  readonly title: string;
  readonly detail: string;
  readonly note: string;
}

export interface Trip {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly players: readonly Player[];
  readonly settings: Settings;
  readonly miles: number;
  readonly log: readonly LogEntry[];
  readonly seen: Readonly<Record<Suit, readonly string[]>>;
  /** Index of the player who opens the next scene. */
  readonly opener: number;
  readonly rngState: number;
  readonly round: Round | null;
}
