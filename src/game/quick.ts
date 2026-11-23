import { DEFAULT_SETTINGS, dealFreeScene, draw, MAX_PLAYERS, MIN_PLAYERS, record, startWarmup } from './trip';
import type { Card, Settings, Trip } from './types';

/** What quick play can deal: a whole scene, a warm-up, or one card on its own. */
export const QUICK_KINDS = ['scene', 'warmup', 'who', 'where', 'how', 'twist'] as const;
export type QuickKind = (typeof QUICK_KINDS)[number];
export type SingleSuit = 'who' | 'where' | 'how' | 'twist';

export function isSingleCard(kind: QuickKind): kind is SingleSuit {
  return kind !== 'scene' && kind !== 'warmup';
}

export interface QuickPlay {
  readonly kind: QuickKind;
  /** A throwaway trip: it carries the players, settings, no-repeat draws and cast rotation. Never saved. */
  readonly trip: Trip;
  /** The card on show for a single-card kind. */
  readonly card: Card | null;
}

export interface NewQuickPlayInput {
  readonly kind: QuickKind;
  readonly players: readonly string[];
  readonly settings: Settings;
  readonly now: number;
  readonly seed: number;
}

/** Quick play needs at least two names to cast a scene; these stand in until someone types theirs. */
export function quickPlayers(names: readonly string[]): string[] {
  const named = names.map((name) => name.trim()).filter(Boolean).slice(0, MAX_PLAYERS);
  const fill = Array.from({ length: Math.max(0, MIN_PLAYERS - named.length) }, (_, i) => `Player ${named.length + i + 1}`);
  return [...named, ...fill];
}

export function newQuickPlay(input: NewQuickPlayInput): QuickPlay {
  const trip: Trip = {
    id: `quick-${input.now.toString(36)}`,
    name: 'Quick play',
    createdAt: input.now,
    players: quickPlayers(input.players).map((name, index) => ({ id: `p${index + 1}`, name })),
    driverId: null,
    // No arc: a quick play has no length, director or destination.
    settings: { ...DEFAULT_SETTINGS, ...input.settings, length: 'open', director: false },
    destinationId: '',
    miles: 0,
    log: [],
    seen: { where: [], who: [], how: [], twist: [], warmup: [], destination: [] },
    rngState: input.seed | 0,
    round: null,
    finishedAt: null,
  };
  return dealAgain({ kind: input.kind, trip, card: null }, input.now);
}

/**
 * Deals the next of the same kind. A finished scene or warm-up is logged first, so the cast keeps rotating and
 * the same card doesn't come straight back.
 */
export function dealAgain(play: QuickPlay, now: number): QuickPlay {
  const trip = play.trip.round ? record(play.trip, now) : play.trip;
  if (play.kind === 'scene') return { ...play, trip: dealFreeScene(trip), card: null };
  if (play.kind === 'warmup') return { ...play, trip: startWarmup(trip), card: null };
  const drawn = draw(trip, play.kind, { avoid: play.card ? [play.card.id] : [] });
  return drawn ? { ...play, trip: drawn.trip, card: drawn.card } : { ...play, trip, card: null };
}
