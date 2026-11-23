import { CARDS, cardById } from './cards';
import * as clock from './clock';
import { fits } from './filters';
import { nextRandom, pickIndex } from './rng';
import type {
  Card,
  Cue,
  LogEntry,
  Round,
  SceneRound,
  Settings,
  Suit,
  Trip,
  WarmupRound,
} from './types';

export const MAX_PLAYERS = 6;
export const TWIST_CHANCE = 1 / 3;
/** Half-Life replays the same story at these fractions of the warm-up's length. */
export const HALF_LIFE = [1, 0.5, 0.25] as const;

export const DEFAULT_SETTINGS: Settings = {
  filters: { quiet: false, handsFree: false, seated: true, stretch: true },
  sceneSeconds: 60,
  useHow: true,
  useTwists: true,
  callTurns: false,
  voice: true,
};

/** Something the UI should announce: a chime, a spoken line, a vibration. */
export type TripEvent = 'twist' | 'time-up' | 'half-life-pass' | 'warmup-done';

const EMPTY_SEEN: Record<Suit, readonly string[]> = { where: [], who: [], how: [], twist: [], warmup: [] };

export interface NewTripInput {
  readonly id: string;
  readonly name: string;
  readonly players: readonly string[];
  readonly settings: Settings;
  readonly now: number;
  readonly seed: number;
}

export function newTrip(input: NewTripInput): Trip {
  const names = input.players.map((name) => name.trim()).filter(Boolean).slice(0, MAX_PLAYERS);
  if (names.length === 0) throw new Error('A trip needs at least one player name.');
  const trip: Trip = {
    id: input.id,
    name: input.name.trim() || 'The long way',
    createdAt: input.now,
    players: names.map((name, index) => ({ id: `p${index + 1}`, name })),
    settings: input.settings,
    miles: 0,
    log: [],
    seen: EMPTY_SEEN,
    opener: 0,
    rngState: input.seed | 0,
    round: null,
  };
  return dealScene(trip);
}

export function poolFor(trip: Pick<Trip, 'settings' | 'players'>, suit: Suit): readonly Card[] {
  return CARDS.filter(
    (card) => card.suit === suit && fits(card, trip.settings.filters, trip.players.length),
  );
}

/** The suits a scene needs that the current filters leave empty. */
export function missingSuits(trip: Pick<Trip, 'settings' | 'players'>): readonly Suit[] {
  const needed: Suit[] = ['where', 'who'];
  if (trip.settings.useHow) needed.push('how');
  return needed.filter((suit) => poolFor(trip, suit).length === 0);
}

interface Drawn {
  readonly card: Card;
  readonly trip: Trip;
}

/** Draws without repeats until the suit's pool is used up, then reshuffles it. */
export function draw(trip: Trip, suit: Suit, avoid: readonly string[] = []): Drawn | null {
  const pool = poolFor(trip, suit).filter((card) => !avoid.includes(card.id));
  if (pool.length === 0) return null;
  let seen = trip.seen[suit];
  let fresh = pool.filter((card) => !seen.includes(card.id));
  if (fresh.length === 0) {
    seen = seen.filter((id) => avoid.includes(id));
    fresh = pool;
  }
  const [index, rngState] = pickIndex(trip.rngState, fresh.length);
  const card = fresh[index];
  if (!card) return null;
  return {
    card,
    trip: { ...trip, rngState, seen: { ...trip.seen, [suit]: [...seen, card.id] } },
  };
}

function sceneMs(trip: Trip): number {
  return trip.settings.sceneSeconds * 1000;
}

/** Deals a fresh scene hand in the brief phase. Leaves `round` null if the filters leave a suit empty. */
export function dealScene(trip: Trip): Trip {
  const where = draw(trip, 'where');
  if (!where) return { ...trip, round: null };
  const who = draw(where.trip, 'who');
  if (!who) return { ...trip, round: null };
  let next = who.trip;

  let howId: string | null = null;
  if (next.settings.useHow) {
    const how = draw(next, 'how');
    if (!how) return { ...trip, round: null };
    howId = how.card.id;
    next = how.trip;
  }

  let twistId: string | null = null;
  if (next.settings.useTwists) {
    const [roll, rngState] = nextRandom(next.rngState);
    next = { ...next, rngState };
    if (roll < TWIST_CHANCE) {
      const twist = draw(next, 'twist');
      if (twist) {
        twistId = twist.card.id;
        next = twist.trip;
      }
    }
  }

  const round: SceneRound = {
    kind: 'scene',
    whereId: where.card.id,
    whoId: who.card.id,
    howId,
    twistId,
    twistShown: false,
    phase: 'brief',
    clock: clock.createClock(sceneMs(next)),
    line: 0,
  };
  return { ...next, round };
}

const SWAP_FIELD = { where: 'whereId', who: 'whoId', how: 'howId', twist: 'twistId' } as const;
export type SwappableSuit = keyof typeof SWAP_FIELD;

export function swap(trip: Trip, suit: SwappableSuit): Trip {
  const round = trip.round;
  if (round?.kind !== 'scene' || round.phase !== 'brief') return trip;
  const field = SWAP_FIELD[suit];
  const current = round[field];
  if (current === null) return trip;
  const drawn = draw(trip, suit, [current]);
  if (!drawn) return trip;
  return { ...drawn.trip, round: { ...round, [field]: drawn.card.id } };
}

export function startRound(trip: Trip, now: number): Trip {
  const round = trip.round;
  if (!round || round.phase !== 'brief') return trip;
  if (round.kind === 'scene') {
    return { ...trip, round: { ...round, phase: 'live', clock: clock.start(round.clock, now) } };
  }
  return { ...trip, round: { ...round, phase: 'live', clock: clock.start(round.clock, now) } };
}

function withClock(round: Round, next: Round['clock']): Round {
  return { ...round, clock: next };
}

export function pause(trip: Trip, now: number): Trip {
  const round = trip.round;
  if (round?.phase !== 'live') return trip;
  return { ...trip, round: withClock(round, clock.stop(round.clock, now)) };
}

export function resume(trip: Trip, now: number): Trip {
  const round = trip.round;
  if (round?.phase !== 'live') return trip;
  return { ...trip, round: withClock(round, clock.start(round.clock, now)) };
}

export function isPaused(round: Round): boolean {
  return round.phase === 'live' && !clock.isRunning(round.clock);
}

/** Moves the round along by the clock. Returns what happened so the UI can announce it. */
export function tick(trip: Trip, now: number): { trip: Trip; events: TripEvent[] } {
  const round = trip.round;
  if (round?.phase !== 'live' || !clock.isRunning(round.clock)) return { trip, events: [] };
  const events: TripEvent[] = [];

  if (round.kind === 'scene') {
    let next: SceneRound = round;
    const half = round.clock.durationMs / 2;
    if (round.twistId && !round.twistShown && clock.elapsed(round.clock, now) >= half) {
      next = { ...next, twistShown: true };
      events.push('twist');
    }
    if (clock.isExpired(round.clock, now)) {
      next = { ...next, phase: 'button', clock: clock.stop(next.clock, now) };
      events.push('time-up');
    }
    return { trip: next === round ? trip : { ...trip, round: next }, events };
  }

  if (!clock.isExpired(round.clock, now)) return { trip, events };
  const card = cardById(round.cardId);
  const nextPass = round.pass + 1;
  const factor = HALF_LIFE[nextPass];
  if (card?.warmup?.halfLife && factor !== undefined) {
    const next: WarmupRound = {
      ...round,
      phase: 'brief',
      pass: nextPass,
      turn: 0,
      clock: clock.createClock(card.warmup.seconds * 1000 * factor),
    };
    return { trip: { ...trip, round: next }, events: ['half-life-pass'] };
  }
  const done: WarmupRound = { ...round, phase: 'done', clock: clock.stop(round.clock, now) };
  return { trip: { ...trip, round: done }, events: ['warmup-done'] };
}

/** Ends the scene early: whoever has the turn says the button line. */
export function land(trip: Trip, now: number): Trip {
  const round = trip.round;
  if (round?.kind !== 'scene' || round.phase !== 'live') return trip;
  return { ...trip, round: { ...round, phase: 'button', clock: clock.stop(round.clock, now) } };
}

/** With called turns, moves the spotlight to the next player. */
export function nextLine(trip: Trip): Trip {
  const round = trip.round;
  if (!round || round.phase !== 'live') return trip;
  if (round.kind === 'scene') return { ...trip, round: { ...round, line: round.line + 1 } };
  return { ...trip, round: { ...round, turn: round.turn + 1 } };
}

export function speakerIndex(trip: Trip): number {
  const count = Math.max(trip.players.length, 1);
  const round = trip.round;
  const offset = round?.kind === 'scene' ? round.line : round?.kind === 'warmup' ? round.turn : 0;
  return (trip.opener + offset) % count;
}

function logEntry(trip: Trip, now: number, entry: Omit<LogEntry, 'id' | 'at'>): LogEntry {
  return { id: `${trip.id}-${trip.log.length + 1}`, at: now, ...entry };
}

function titles(ids: readonly (string | null)[]): string {
  return ids.map((id) => cardById(id)?.title).filter(Boolean).join(' · ');
}

export function canBank(round: Round | null): boolean {
  if (!round) return false;
  if (round.kind === 'scene') return round.phase === 'button';
  return round.phase === 'live' || round.phase === 'done' || round.pass > 0;
}

/** Banks a mile for the group, moves the opener on, and deals the next scene straight away. */
export function bank(trip: Trip, now: number, note = ''): Trip {
  const round = trip.round;
  if (!round || !canBank(round)) return trip;
  const entry =
    round.kind === 'scene'
      ? logEntry(trip, now, {
          kind: 'scene',
          title: cardById(round.whereId)?.title ?? 'A scene',
          detail: titles([round.whoId, round.howId, round.twistShown ? round.twistId : null]),
          note: note.trim(),
        })
      : logEntry(trip, now, {
          kind: 'warmup',
          title: cardById(round.cardId)?.title ?? 'A warm-up',
          detail: round.seed ?? '',
          note: note.trim(),
        });
  const banked: Trip = {
    ...trip,
    miles: trip.miles + 1,
    log: [entry, ...trip.log],
    opener: (trip.opener + 1) % Math.max(trip.players.length, 1),
  };
  return dealScene(banked);
}

/** Drops the current round with no mile and deals a fresh scene. The opener keeps their turn. */
export function scrap(trip: Trip): Trip {
  return dealScene({ ...trip, round: null });
}

export function startWarmup(trip: Trip, cardId?: string): Trip {
  let next = trip;
  let card = cardById(cardId);
  if (!card || card.suit !== 'warmup') {
    const drawn = draw(trip, 'warmup');
    if (!drawn) return trip;
    card = drawn.card;
    next = drawn.trip;
  }
  const config = card.warmup;
  if (!config) return trip;
  let seed: string | null = null;
  if (config.seeds) {
    const [index, rngState] = pickIndex(next.rngState, config.seeds.length);
    seed = config.seeds[index] ?? null;
    next = { ...next, rngState };
  }
  const round: WarmupRound = {
    kind: 'warmup',
    cardId: card.id,
    seed,
    phase: 'brief',
    clock: clock.createClock(config.seconds * 1000),
    turn: 0,
    pass: 0,
  };
  return { ...next, round };
}

/** Changes that alter what a hand contains are re-dealt if no scene is under way yet. */
export function updateSettings(trip: Trip, settings: Settings): Trip {
  const next = { ...trip, settings };
  const before = trip.settings;
  const changesHand =
    JSON.stringify(before.filters) !== JSON.stringify(settings.filters) ||
    before.useHow !== settings.useHow ||
    before.useTwists !== settings.useTwists ||
    before.sceneSeconds !== settings.sceneSeconds;
  const round = trip.round;
  const idle = !round || (round.kind === 'scene' && round.phase === 'brief');
  return changesHand && idle ? dealScene(next) : next;
}

export function renamePlayer(trip: Trip, playerId: string, name: string): Trip {
  const clean = name.trim().slice(0, 24);
  if (!clean) return trip;
  return {
    ...trip,
    players: trip.players.map((player) => (player.id === playerId ? { ...player, name: clean } : player)),
  };
}

/** The rule as a standing reminder, for when lines flow freely and nobody is counting them. */
export function ruleReminder(cue: Cue | undefined): string | null {
  switch (cue) {
    case 'fortunately':
      return 'Fortunately… Unfortunately…';
    case 'alphabet':
      return 'A, then B, then C…';
    default:
      return lineCue(cue, 0);
  }
}

export function lineCue(cue: Cue | undefined, line: number): string | null {
  switch (cue) {
    case 'yes-and':
      return 'Start with “Yes, and…”';
    case 'questions':
      return 'Only questions.';
    case 'fortunately':
      return line % 2 === 0 ? 'Fortunately…' : 'Unfortunately…';
    case 'alphabet':
      return `Start with ${String.fromCharCode(65 + (line % 26))}.`;
    case 'three-words':
      return 'Exactly three words.';
    case 'last-word':
      return 'Start with their last word.';
    case 'no-i':
      return 'No I, me or my.';
    case undefined:
      return null;
  }
}
