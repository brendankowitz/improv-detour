import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { newTrip, type NewTripInput } from '@game/trip';
import type { Trip } from '@game/types';
import { EMPTY, MAX_TRIPS, load, save, type Saved } from './storage';

interface Snapshot {
  readonly saved: Saved;
  /** True when the browser refused the last save (private mode, full storage). */
  readonly saveError: boolean;
}

export interface TripStore {
  readonly trips: readonly Trip[];
  readonly current: Trip | null;
  readonly saveError: boolean;
  readonly start: (input: Omit<NewTripInput, 'id' | 'now' | 'seed'>) => void;
  /** Applies an engine step to the current trip. */
  readonly update: (step: (trip: Trip) => Trip) => void;
  readonly open: (id: string) => void;
  /** Puts the current trip away. It stays in Trips and can be continued. */
  readonly close: () => void;
  readonly forget: (id: string) => void;
}

/** Holds the saved trips outside React and writes every change straight to local storage. */
export function createTripStore(storage: Pick<Storage, 'getItem' | 'setItem'> | null) {
  let snapshot: Snapshot = { saved: storage ? load(storage) : EMPTY, saveError: storage === null };
  const listeners = new Set<() => void>();

  const set = (next: Saved) => {
    if (next === snapshot.saved) return;
    let saveError = false;
    try {
      if (storage) save(storage, next);
      else saveError = true;
    } catch (error) {
      console.warn('Detour: could not save trips.', error);
      saveError = true;
    }
    snapshot = { saved: next, saveError };
    for (const listener of listeners) listener();
  };

  const actions = {
    start(input: Omit<NewTripInput, 'id' | 'now' | 'seed'>) {
      const now = Date.now();
      const trip = newTrip({ ...input, id: `trip-${now.toString(36)}`, now, seed: Math.floor(Math.random() * 2 ** 31) });
      const { saved } = snapshot;
      set({ ...saved, trips: [trip, ...saved.trips].slice(0, MAX_TRIPS), currentId: trip.id });
    },
    update(step: (trip: Trip) => Trip) {
      const { saved } = snapshot;
      const index = saved.trips.findIndex((trip) => trip.id === saved.currentId);
      const trip = saved.trips[index];
      if (!trip) return;
      const next = step(trip);
      if (next === trip) return;
      const trips = [...saved.trips];
      trips[index] = next;
      set({ ...saved, trips });
    },
    open(id: string) {
      const { saved } = snapshot;
      if (saved.trips.some((trip) => trip.id === id)) set({ ...saved, currentId: id });
    },
    close() {
      set({ ...snapshot.saved, currentId: null });
    },
    forget(id: string) {
      const { saved } = snapshot;
      set({
        ...saved,
        trips: saved.trips.filter((trip) => trip.id !== id),
        currentId: saved.currentId === id ? null : saved.currentId,
      });
    },
  };

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => snapshot,
    actions,
  };
}

type Store = ReturnType<typeof createTripStore>;

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch (error) {
    console.warn('Detour: local storage is unavailable; trips will not be kept.', error);
    return null;
  }
}

const Context = createContext<Store | null>(null);

export function TripProvider({ children, store }: { readonly children: ReactNode; readonly store?: Store }) {
  const value = useMemo(() => store ?? createTripStore(browserStorage()), [store]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTrips(): TripStore {
  const store = useContext(Context);
  if (!store) throw new Error('useTrips must be used inside <TripProvider>.');
  const { saved, saveError } = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return useMemo(
    () => ({
      trips: saved.trips,
      current: saved.trips.find((trip) => trip.id === saved.currentId) ?? null,
      saveError,
      ...store.actions,
    }),
    [saved, saveError, store],
  );
}
