import { CARDS, cardById } from './cards';
import { pickCast, type Cast } from './casting';
import * as clock from './clock';
import { fits } from './filters';
import { pickIndex } from './rng';
import type {
  Card,
  LogEntry,
  Round,
  SceneRound,
  Settings,
  Souvenir,
  Suit,
  Trip,
  TripLength,
  WarmupRound,
} from './types';

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const STOPS: Record<TripLength, number | null> = { short: 4, standard: 6, open: null };
/** The twist lands at this fraction of the scene. */
export const TWIST_AT = 0.6;
/** The landing chime sounds this long before time is up. */
export const LANDING_MS = 10_000;
/** Easy Hows only until this many scenes with a How have been banked. */
export const EASY_HOW_SCENES = 2;
/** Half-Life replays the same story at these fractions of the warm-up's length. */
export const HALF_LIFE = [1, 0.5, 0.25] as const;

export const DEFAULT_SETTINGS: Settings = {
  filters: { voiceOnly: false, quiet: true, moving: false, stretch: true },
  sceneSeconds: 60,
  length: 'standard',
  useHow: true,
  useTwists: true,
  director: false,
  voice: true,
};

/** Something the UI should announce: a chime, a spoken line, a vibration. */
export type TripEvent = 'twist' | 'landing' | 'time-up' | 'half-life-pass' | 'warmup-done';

const EMPTY_SEEN: Record<Suit, readonly string[]> = {
  where: [], who: [], how: [], twist: [], warmup: [], destination: [],
};

export interface NewTripInput {
  readonly id: string;
  readonly name: string;
  readonly players: readonly string[];
  /** Index into `players` of whoever is driving, if anyone. */
  readonly driverIndex: number | null;
  readonly settings: Settings;
  readonly now: number;
  readonly seed: number;
}

// ---------------------------------------------------------------- drawing

export function poolFor(trip: Pick<Trip, 'settings'>, suit: Suit): readonly Card[] {
  return CARDS.filter((card) => card.suit === suit && fits(card, trip.settings.filters));
}

/** The suits a trip needs that the current filters leave empty. */
export function missingSuits(trip: Pick<Trip, 'settings'>): readonly Suit[] {
  const needed: Suit[] = ['where', 'who', 'warmup', 'destination'];
  if (trip.settings.useHow) needed.push('how');
  return needed.filter((suit) => poolFor(trip, suit).length === 0);
}

interface Drawn {
  readonly card: Card;
  readonly trip: Trip;
}

/** Draws without repeats until the suit's pool is used up, then reshuffles it. */
export function draw(
  trip: Trip,
  suit: Suit,
  options: { readonly avoid?: readonly string[]; readonly allow?: (card: Card) => boolean } = {},
): Drawn | null {
  const avoid = options.avoid ?? [];
  const allow = options.allow ?? (() => true);
  const pool = poolFor(trip, suit).filter((card) => !avoid.includes(card.id) && allow(card));
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
  return { card, trip: { ...trip, rngState, seen: { ...trip.seen, [suit]: [...seen, card.id] } } };
}

// ---------------------------------------------------------------- trip shape

/** The number of the stop now being played, from 1. */
export function stopNumber(trip: Trip): number {
  return trip.log.length + 1;
}

export function totalStops(trip: Trip): number | null {
  return STOPS[trip.settings.length];
}

function scenesBanked(trip: Trip): number {
  return trip.log.filter((entry) => entry.kind !== 'warmup').length;
}

function howScenesBanked(trip: Trip): number {
  return trip.log.filter((entry) => entry.cardIds.some((id) => cardById(id)?.suit === 'how')).length;
}

export function souvenirs(trip: Trip): readonly Souvenir[] {
  return trip.log.flatMap((entry) => (entry.souvenir ? [entry.souvenir] : [])).reverse();
}

function isLastStop(trip: Trip): boolean {
  const total = totalStops(trip);
  return total !== null && stopNumber(trip) >= total;
}

// ---------------------------------------------------------------- starting

export function newTrip(input: NewTripInput): Trip {
  const names = input.players.map((name) => name.trim()).filter(Boolean).slice(0, MAX_PLAYERS);
  if (names.length < MIN_PLAYERS) throw new Error(`A trip needs at least ${MIN_PLAYERS} players.`);
  const players = names.map((name, index) => ({ id: `p${index + 1}`, name }));
  const driver = input.driverIndex === null ? null : players[input.driverIndex];
  let trip: Trip = {
    id: input.id,
    name: input.name.trim() || 'The long way',
    createdAt: input.now,
    players,
    driverId: driver?.id ?? null,
    settings: input.settings,
    destinationId: '',
    miles: 0,
    log: [],
    seen: EMPTY_SEEN,
    rngState: input.seed | 0,
    round: null,
    finishedAt: null,
  };
  const destination = draw(trip, 'destination');
  if (destination) trip = { ...destination.trip, destinationId: destination.card.id };
  return startWarmup(trip);
}

export function swapDestination(trip: Trip): Trip {
  if (trip.log.length > 0) return trip;
  const drawn = draw(trip, 'destination', { avoid: [trip.destinationId] });
  return drawn ? { ...drawn.trip, destinationId: drawn.card.id } : trip;
}

// ---------------------------------------------------------------- dealing

function castFor(trip: Trip, restDriver: boolean): Cast | null {
  const past = trip.log
    .filter((entry) => entry.castIds.length === 2)
    .map((entry) => [entry.castIds[0] ?? '', entry.castIds[1] ?? ''] as const)
    .reverse();
  return pickCast(trip.players, trip.driverId, past, trip.settings.director, restDriver);
}

/** Deals the next stop: the Arrival on the last stop, otherwise an ordinary scene. */
export function dealNext(trip: Trip): Trip {
  return isLastStop(trip) ? dealArrival(trip) : dealScene(trip);
}

/** Deals a scene hand in the brief phase. Leaves `round` null if the filters leave a suit empty. */
export function dealScene(trip: Trip): Trip {
  return deal(trip, false, 'staged');
}

/**
 * Deals a stand-alone scene for quick play: no trip arc, so the How may be any card the filters allow from the
 * first hand, and a twist comes with every hand whose How is easy.
 */
export function dealFreeScene(trip: Trip): Trip {
  return deal(trip, false, 'free');
}

/** Deals the final scene, set at the trip's destination. */
export function dealArrival(trip: Trip): Trip {
  return deal(trip, true, 'staged');
}

/** Staged hands build up over a trip; free hands stand alone. */
type Staging = 'staged' | 'free';

function deal(trip: Trip, arrival: boolean, staging: Staging): Trip {
  const sceneNumber = scenesBanked(trip) + 1;
  let next = trip;

  let whereId = trip.destinationId;
  if (!arrival || !cardById(trip.destinationId)) {
    const where = draw(next, 'where');
    if (!where) return { ...trip, round: null };
    whereId = where.card.id;
    next = where.trip;
  }

  const who = draw(next, 'who');
  if (!who) return { ...trip, round: null };
  next = who.trip;

  const howId = staging === 'free' ? (next.settings.useHow ? draw(next, 'how') : null) : dealHow(next, sceneNumber);
  let howCard: Card | null = null;
  if (howId) {
    howCard = howId.card;
    next = howId.trip;
  }

  let twistId: string | null = null;
  const twistOnSchedule = staging === 'free' || (sceneNumber >= 2 && sceneNumber % 2 === 0);
  const twistDue = !arrival && twistOnSchedule && howCard?.level !== 'stretch';
  if (next.settings.useTwists && twistDue) {
    const twist = draw(next, 'twist');
    if (twist) {
      twistId = twist.card.id;
      next = twist.trip;
    }
  }

  // Cast after the How is known: a stretch rule is too much for someone who is driving.
  const cast = castFor(next, howCard?.level === 'stretch');
  if (!cast) return { ...trip, round: null };

  const round: SceneRound = {
    kind: 'scene',
    arrival,
    whereId,
    whoId: who.card.id,
    howId: howCard?.id ?? null,
    twistId,
    twistShown: false,
    ...cast,
    landingCalled: false,
    phase: 'brief',
    clock: clock.createClock(next.settings.sceneSeconds * 1000),
  };
  return { ...next, round };
}

/** The first scene has no How; easy Hows only until a couple of How scenes are banked. */
function dealHow(trip: Trip, sceneNumber: number): Drawn | null {
  if (!trip.settings.useHow || sceneNumber === 1) return null;
  const easyOnly = howScenesBanked(trip) < EASY_HOW_SCENES;
  return draw(trip, 'how', { allow: (card) => !easyOnly || card.level === 'easy' });
}

const SWAP_FIELD = { where: 'whereId', who: 'whoId', how: 'howId', twist: 'twistId' } as const;
export type SwappableSuit = keyof typeof SWAP_FIELD;

export function swap(trip: Trip, suit: SwappableSuit): Trip {
  const round = trip.round;
  if (round?.kind !== 'scene' || round.phase !== 'brief') return trip;
  if (suit === 'where' && round.arrival) return trip;
  const field = SWAP_FIELD[suit];
  const current = round[field];
  if (current === null) return trip;
  const level = cardById(current)?.level;
  // A swapped How keeps the hand's difficulty, so staging and the twist rule still hold.
  const allow = suit === 'how' && level === 'easy' ? (card: Card) => card.level === 'easy' : undefined;
  const drawn = draw(trip, suit, { avoid: [current], ...(allow && { allow }) });
  if (!drawn) return trip;
  return { ...drawn.trip, round: { ...round, [field]: drawn.card.id } };
}

// ---------------------------------------------------------------- warm-ups

export function startWarmup(trip: Trip, cardId?: string): Trip {
  let next = trip;
  let card = cardById(cardId);
  if (card?.suit !== 'warmup') {
    const drawn = draw(trip, 'warmup', { avoid: trip.round?.kind === 'warmup' ? [trip.round.cardId] : [] });
    if (!drawn) return { ...trip, round: null };
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

/** A warm-up can stand in for any scene except the Arrival. */
export function canWarmUpInstead(trip: Trip): boolean {
  const round = trip.round;
  return round?.kind === 'scene' && round.phase === 'brief' && !round.arrival;
}

// ---------------------------------------------------------------- the clock

export function startRound(trip: Trip, now: number): Trip {
  const round = trip.round;
  if (round?.phase !== 'brief') return trip;
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
  return round.kind === 'scene' ? tickScene(trip, round, now) : tickWarmup(trip, round, now);
}

function tickScene(trip: Trip, round: SceneRound, now: number): { trip: Trip; events: TripEvent[] } {
  const events: TripEvent[] = [];
  let next = round;
  const elapsed = clock.elapsed(round.clock, now);
  if (round.twistId && !round.twistShown && elapsed >= round.clock.durationMs * TWIST_AT) {
    next = { ...next, twistShown: true };
    events.push('twist');
  }
  if (!round.landingCalled && clock.remaining(round.clock, now) <= LANDING_MS) {
    next = { ...next, landingCalled: true };
    events.push('landing');
  }
  if (clock.isExpired(round.clock, now)) {
    next = { ...next, phase: 'button', clock: clock.stop(next.clock, now) };
    events.push('time-up');
  }
  return { trip: next === round ? trip : { ...trip, round: next }, events };
}

function tickWarmup(trip: Trip, round: WarmupRound, now: number): { trip: Trip; events: TripEvent[] } {
  if (!clock.isExpired(round.clock, now)) return { trip, events: [] };
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

/** Ends the scene now: the Opener says the last line. */
export function land(trip: Trip, now: number): Trip {
  const round = trip.round;
  if (round?.kind !== 'scene' || round.phase !== 'live') return trip;
  return { ...trip, round: { ...round, phase: 'button', landingCalled: true, clock: clock.stop(round.clock, now) } };
}

/** The Director (or the phone-holder) throws the twist before it is due. */
export function throwTwist(trip: Trip): Trip {
  const round = trip.round;
  if (round?.kind !== 'scene' || round.phase !== 'live' || !round.twistId || round.twistShown) return trip;
  return { ...trip, round: { ...round, twistShown: true } };
}

/** Warm-ups with turn cues: moves to the next player's cue. */
export function nextTurn(trip: Trip): Trip {
  const round = trip.round;
  if (round?.kind !== 'warmup' || round.phase !== 'live') return trip;
  return { ...trip, round: { ...round, turn: round.turn + 1 } };
}

export function turnPlayerIndex(trip: Trip): number {
  const round = trip.round;
  const turn = round?.kind === 'warmup' ? round.turn : 0;
  return turn % Math.max(trip.players.length, 1);
}

// ---------------------------------------------------------------- banking

export function canBank(round: Round | null): boolean {
  if (!round) return false;
  if (round.kind === 'scene') return round.phase === 'button';
  return round.phase === 'live' || round.phase === 'done' || round.pass > 0;
}

function entryFor(trip: Trip, round: Round, now: number, souvenir: Souvenir | null): LogEntry {
  const base = { id: `${trip.id}-${trip.log.length + 1}`, at: now };
  if (round.kind === 'warmup') {
    return { ...base, kind: 'warmup', title: cardById(round.cardId)?.title ?? 'A warm-up', cardIds: [round.cardId], castIds: [], souvenir: null };
  }
  const cardIds = [round.whereId, round.whoId, round.howId, round.twistShown ? round.twistId : null].filter(
    (id): id is string => id !== null,
  );
  return {
    ...base,
    kind: round.arrival ? 'arrival' : 'scene',
    title: cardById(round.whereId)?.title ?? 'A scene',
    cardIds,
    castIds: [round.openerId, round.partnerId],
    souvenir,
  };
}

/**
 * Banks the stop: a mile for the group, the cast recorded so roles rotate, an optional souvenir kept for the
 * Arrival. Then deals the next stop, or finishes the trip if this was the Arrival.
 */
export function bank(trip: Trip, now: number, souvenirText = ''): Trip {
  const round = trip.round;
  if (!round || !canBank(round)) return trip;
  const banked = record(trip, now, souvenirText);
  if (round.kind === 'scene' && round.arrival) return { ...banked, finishedAt: now };
  return dealNext(banked);
}

/** Logs the finished round and adds its mile, leaving nothing dealt. */
export function record(trip: Trip, now: number, souvenirText = ''): Trip {
  const round = trip.round;
  if (!round || !canBank(round)) return trip;
  const text = souvenirText.trim().slice(0, 60);
  const souvenir = round.kind === 'scene' && !round.arrival && text ? { text, from: cardById(round.whereId)?.title ?? '' } : null;
  const entry = entryFor(trip, round, now, souvenir);
  return { ...trip, miles: trip.miles + 1, log: [entry, ...trip.log], round: null };
}

/** Open-road trips end when the family chooses: the next stop becomes the Arrival. */
export function headForDestination(trip: Trip): Trip {
  const round = trip.round;
  if (round && round.phase !== 'brief') return trip;
  if (round?.kind === 'scene' && round.arrival) return trip;
  return dealArrival(trip);
}

/** After the postcard, the trip can carry on as an open road. */
export function keepDriving(trip: Trip): Trip {
  if (trip.finishedAt === null) return trip;
  return dealScene({ ...trip, finishedAt: null, settings: { ...trip.settings, length: 'open' } });
}

// ---------------------------------------------------------------- settings

/** Changes that alter what a hand contains are re-dealt if the stop hasn't started yet. */
export function updateSettings(trip: Trip, settings: Settings): Trip {
  const next = { ...trip, settings };
  const before = trip.settings;
  const changesHand =
    JSON.stringify(before.filters) !== JSON.stringify(settings.filters) ||
    before.useHow !== settings.useHow ||
    before.useTwists !== settings.useTwists ||
    before.director !== settings.director ||
    before.sceneSeconds !== settings.sceneSeconds;
  const round = trip.round;
  if (!changesHand || round?.phase !== 'brief' || round.kind !== 'scene') return next;
  return round.arrival ? dealArrival(next) : dealScene(next);
}

export function setDriver(trip: Trip, driverId: string | null): Trip {
  if (driverId !== null && !trip.players.some((player) => player.id === driverId)) return trip;
  const next = { ...trip, driverId };
  const round = trip.round;
  const castClash =
    round?.kind === 'scene' && round.phase === 'brief' && (round.openerId === driverId || round.directorId === driverId);
  return castClash ? (round.arrival ? dealArrival(next) : dealScene(next)) : next;
}

export function renamePlayer(trip: Trip, playerId: string, name: string): Trip {
  const clean = name.trim().slice(0, 24);
  if (!clean) return trip;
  return { ...trip, players: trip.players.map((player) => (player.id === playerId ? { ...player, name: clean } : player)) };
}

export function playerName(trip: Trip, id: string | null): string {
  return trip.players.find((player) => player.id === id)?.name ?? 'Someone';
}
