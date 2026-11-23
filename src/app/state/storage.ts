import { cardById } from '@game/cards';
import { dealScene } from '@game/trip';
import type { Round, Trip } from '@game/types';

export const STORAGE_KEY = 'detour.v1';
export const STORAGE_VERSION = 1;
export const MAX_TRIPS = 20;

export interface Saved {
  readonly version: typeof STORAGE_VERSION;
  readonly trips: readonly Trip[];
  readonly currentId: string | null;
}

export const EMPTY: Saved = { version: STORAGE_VERSION, trips: [], currentId: null };

function roundCardsExist(round: Round): boolean {
  if (round.kind === 'warmup') return cardById(round.cardId) !== null;
  const ids = [round.whereId, round.whoId, round.howId, round.twistId].filter((id) => id !== null);
  return ids.every((id) => cardById(id) !== null);
}

/**
 * A saved trip can outlive the deck it was dealt from: cards get rewritten and removed between
 * releases. A hand that refers to a missing card is re-dealt rather than left to render nothing.
 */
export function repairTrip(trip: Trip): Trip {
  if (!trip.round || roundCardsExist(trip.round)) return trip;
  return dealScene({ ...trip, round: null });
}

function isTrip(value: unknown): value is Trip {
  if (typeof value !== 'object' || value === null) return false;
  const t = value as Partial<Trip>;
  return typeof t.id === 'string' && Array.isArray(t.players) && t.players.length > 0 && typeof t.settings === 'object';
}

/** Reads what is saved on this device. Anything unreadable starts fresh rather than crashing the app. */
export function load(storage: Pick<Storage, 'getItem'>): Saved {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return EMPTY;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.warn('Detour: saved trips were unreadable and have been reset.', error);
    return EMPTY;
  }
  const saved = parsed as Partial<Saved>;
  if (saved.version !== STORAGE_VERSION || !Array.isArray(saved.trips)) return EMPTY;
  const trips = saved.trips.filter(isTrip).map(repairTrip);
  const currentId = trips.some((trip) => trip.id === saved.currentId) ? (saved.currentId ?? null) : null;
  return { version: STORAGE_VERSION, trips, currentId };
}

export function save(storage: Pick<Storage, 'setItem'>, saved: Saved): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(saved));
}
