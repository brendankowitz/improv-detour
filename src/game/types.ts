export const SUITS = ['where', 'who', 'how', 'twist', 'warmup', 'destination'] as const;
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

export type Level = 'easy' | 'stretch';

export interface WarmupConfig {
  readonly seconds: number;
  /** One is picked at random and shown as the starting line or topic. */
  readonly seeds?: readonly string[];
  /** Shown in rotation, one per turn, when the turn is advanced. */
  readonly turnCues?: readonly string[];
  /** Replays the same story at shrinking lengths: full, half, quarter. */
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
  /** Playable entirely by ear: nobody needs to see, point, mime, hold or read. */
  readonly voiceOnly: boolean;
  /** Works at an indoor-table voice. */
  readonly quiet: boolean;
  /** Needs someone to stand or move. */
  readonly physical: boolean;
  /** How cards: a short standing reminder shown during the scene. */
  readonly cue?: string;
  readonly warmup?: WarmupConfig;
}

export interface Filters {
  /** Only cards playable entirely by ear. */
  readonly voiceOnly: boolean;
  /** Only cards that work at an indoor-table voice. */
  readonly quiet: boolean;
  /** Allow cards that need someone to stand or move. */
  readonly moving: boolean;
  /** Allow stretch cards as well as easy ones. */
  readonly stretch: boolean;
}

export type SceneSeconds = 45 | 60 | 75;
export type TripLength = 'short' | 'standard' | 'open';

export interface Settings {
  readonly filters: Filters;
  readonly sceneSeconds: SceneSeconds;
  readonly length: TripLength;
  readonly useHow: boolean;
  readonly useTwists: boolean;
  /** One on-deck player per scene may swap a card, throw the twist and call the scene. */
  readonly director: boolean;
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
  /** The final scene of a trip, set at its destination. */
  readonly arrival: boolean;
  /** A Where card, or the trip's Destination card on arrival. */
  readonly whereId: string;
  readonly whoId: string;
  readonly howId: string | null;
  readonly twistId: string | null;
  readonly twistShown: boolean;
  readonly openerId: string;
  readonly partnerId: string;
  readonly directorId: string | null;
  /** Set once the ten-seconds-left chime has sounded. */
  readonly landingCalled: boolean;
  readonly phase: ScenePhase;
  readonly clock: Clock;
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

export interface Souvenir {
  readonly text: string;
  /** The title of the scene it came from. */
  readonly from: string;
}

export interface LogEntry {
  readonly id: string;
  readonly at: number;
  readonly kind: 'scene' | 'warmup' | 'arrival';
  readonly title: string;
  readonly cardIds: readonly string[];
  readonly castIds: readonly string[];
  readonly souvenir: Souvenir | null;
}

export interface Trip {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly players: readonly Player[];
  /** Never cast as Opener, never lands a scene, never the Director. */
  readonly driverId: string | null;
  readonly settings: Settings;
  readonly destinationId: string;
  readonly miles: number;
  /** Newest first. One entry per completed stop. */
  readonly log: readonly LogEntry[];
  readonly seen: Readonly<Record<Suit, readonly string[]>>;
  readonly rngState: number;
  readonly round: Round | null;
  /** Set when the Arrival is banked; the trip then shows its postcard. */
  readonly finishedAt: number | null;
}
