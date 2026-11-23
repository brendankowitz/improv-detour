import { describe, expect, it } from 'vitest';
import { CARDS, cardById } from './cards';
import { formatClock, remaining } from './clock';
import {
  DEFAULT_SETTINGS,
  bank,
  canBank,
  draw,
  headForDestination,
  keepDriving,
  land,
  missingSuits,
  newTrip,
  pause,
  resume,
  setDriver,
  souvenirs,
  startRound,
  startWarmup,
  stopNumber,
  swap,
  swapDestination,
  throwTwist,
  tick,
  updateSettings,
} from './trip';
import type { SceneRound, Settings, Trip, WarmupRound } from './types';

const T0 = 1_000_000;

function trip(settings: Partial<Settings> = {}, seed = 42, driverIndex: number | null = null): Trip {
  return newTrip({
    id: 'trip-1',
    name: 'Test',
    players: ['Ana', 'Ben', 'Cy', 'Di'],
    driverIndex,
    settings: { ...DEFAULT_SETTINGS, ...settings },
    now: T0,
    seed,
  });
}

function scene(t: Trip): SceneRound {
  if (t.round?.kind !== 'scene') throw new Error(`expected a scene, got ${t.round?.kind ?? 'nothing'}`);
  return t.round;
}

function warmup(t: Trip): WarmupRound {
  if (t.round?.kind !== 'warmup') throw new Error(`expected a warm-up, got ${t.round?.kind ?? 'nothing'}`);
  return t.round;
}

/** Plays the current stop to completion and banks it. */
function play(t: Trip, souvenir = ''): Trip {
  let next = startRound(t, T0);
  if (next.round?.kind === 'scene') next = land(next, T0 + 1000);
  return bank(next, T0 + 2000, souvenir);
}

describe('a new trip', () => {
  it('deals a destination and opens with a warm-up', () => {
    const t = trip();
    expect(cardById(t.destinationId)?.suit).toBe('destination');
    expect(warmup(t).phase).toBe('brief');
    expect(stopNumber(t)).toBe(1);
  });

  it('needs at least two players', () => {
    expect(() =>
      newTrip({ id: 'x', name: 'n', players: ['Solo', ' '], driverIndex: null, settings: DEFAULT_SETTINGS, now: T0, seed: 1 }),
    ).toThrow(/at least 2 players/);
  });

  it('is reproducible from the seed', () => {
    expect(trip({}, 7)).toEqual(trip({}, 7));
  });

  it('lets the destination be swapped before the first stop is banked', () => {
    const t = trip();
    expect(swapDestination(t).destinationId).not.toBe(t.destinationId);
    const later = play(t);
    expect(swapDestination(later)).toBe(later);
  });
});

describe('scenes', () => {
  it('casts an Opener and a different Partner', () => {
    const round = scene(play(trip()));
    expect(round.openerId).not.toBe(round.partnerId);
  });

  it('never casts the driver as Opener', () => {
    let t = trip({}, 3, 0);
    for (let i = 0; i < 5; i++) {
      t = play(t);
      if (t.round?.kind === 'scene') expect(t.round.openerId).not.toBe('p1');
    }
  });

  it('re-deals an unstarted hand when the Opener becomes the driver', () => {
    const t = play(trip());
    const opener = scene(t).openerId;
    expect(scene(setDriver(t, opener)).openerId).not.toBe(opener);
  });

  it('runs brief → live → landing chime → last line → banked', () => {
    let t = startRound(play(trip({ useTwists: false })), T0);
    expect(tick(t, T0 + 49_000).events).toEqual([]);
    const landing = tick(t, T0 + 50_000);
    expect(landing.events).toEqual(['landing']);
    const up = tick(landing.trip, T0 + 60_000);
    expect(up.events).toEqual(['time-up']);
    t = up.trip;
    expect(scene(t).phase).toBe('button');
    expect(canBank(t.round)).toBe(true);
    t = bank(t, T0 + 65_000, '  the pie-contest grandma ');
    expect(t.miles).toBe(2);
    expect(souvenirs(t)).toEqual([{ text: 'the pie-contest grandma', from: expect.any(String) as string }]);
  });

  it('cannot bank before the last line', () => {
    const t = startRound(play(trip()), T0);
    expect(bank(t, T0 + 1000)).toBe(t);
  });

  it('lands early and keeps the time that was left', () => {
    const t = land(startRound(play(trip()), T0), T0 + 20_000);
    expect(scene(t).phase).toBe('button');
    expect(remaining(scene(t).clock, T0 + 99_000)).toBe(40_000);
  });

  it('pauses and resumes without losing time', () => {
    let t = startRound(play(trip()), T0);
    t = pause(t, T0 + 10_000);
    t = resume(t, T0 + 500_000);
    expect(formatClock(remaining(scene(t).clock, T0 + 510_000))).toBe('0:40');
  });

  it('only swaps before the scene starts, and never the destination on arrival', () => {
    const t = play(trip());
    expect(scene(swap(t, 'where')).whereId).not.toBe(scene(t).whereId);
    const live = startRound(t, T0);
    expect(swap(live, 'where')).toBe(live);
  });
});

describe('How staging', () => {
  it('deals no How in the first scene, then easy Hows until two How scenes are banked', () => {
    let t = play(trip({}, 11));
    expect(scene(t).howId).toBeNull();
    const levels: string[] = [];
    for (let i = 0; i < 4; i++) {
      t = play(t);
      const how = cardById(t.round?.kind === 'scene' ? t.round.howId : null);
      if (how) levels.push(how.level);
    }
    expect(levels.slice(0, 2)).toEqual(['easy', 'easy']);
  });

  it('deals no How when How cards are off', () => {
    let t = trip({ useHow: false, length: 'open' });
    for (let i = 0; i < 4; i++) {
      t = play(t);
      expect(scene(t).howId).toBeNull();
    }
  });
});

describe('twists', () => {
  it('come every other scene from the second, never beside a stretch How, and fire at 60%', () => {
    let t = play(trip({ length: 'open' }, 5));
    const twisted: boolean[] = [];
    for (let i = 0; i < 6; i++) {
      const round = scene(t);
      twisted.push(round.twistId !== null);
      if (round.twistId) expect(cardById(round.howId)?.level).not.toBe('stretch');
      t = play(t);
    }
    expect(twisted[0]).toBe(false);
    expect(twisted.filter(Boolean).length).toBeGreaterThanOrEqual(1);

    let withTwist: Trip | null = null;
    let probe = play(play(trip({ length: 'open', filters: { ...DEFAULT_SETTINGS.filters, stretch: false } }, 5)));
    for (let i = 0; i < 6 && !withTwist; i++) {
      if (scene(probe).twistId) withTwist = probe;
      else probe = play(probe);
    }
    if (!withTwist) throw new Error('no twist dealt');
    const live = startRound(withTwist, T0);
    expect(tick(live, T0 + 35_000).events).toEqual([]);
    expect(tick(live, T0 + 36_000).events).toEqual(['twist']);
    expect(scene(throwTwist(live)).twistShown).toBe(true);
  });
});

describe('the shape of a trip', () => {
  it('runs a short trip as warm-up, two scenes, then the Arrival at the destination', () => {
    let t = trip({ length: 'short' });
    expect(t.round?.kind).toBe('warmup');
    t = play(t);
    expect(scene(t).arrival).toBe(false);
    t = play(t, 'the soup');
    expect(scene(t).arrival).toBe(false);
    t = play(t);
    const arrival = scene(t);
    expect(arrival.arrival).toBe(true);
    expect(arrival.whereId).toBe(t.destinationId);
    expect(arrival.twistId).toBeNull();
    t = play(t);
    expect(t.finishedAt).not.toBeNull();
    expect(t.round).toBeNull();
    expect(t.miles).toBe(4);
    expect(souvenirs(t).map((s) => s.text)).toEqual(['the soup']);
  });

  it('lets an open road head for the destination, and keep driving after the postcard', () => {
    let t = play(trip({ length: 'open' }));
    t = headForDestination(t);
    expect(scene(t).arrival).toBe(true);
    t = play(t);
    expect(t.finishedAt).not.toBeNull();
    t = keepDriving(t);
    expect(t.finishedAt).toBeNull();
    expect(scene(t).arrival).toBe(false);
  });

  it('lets a warm-up stand in for a scene, and returns to scenes after', () => {
    let t = play(trip());
    t = startWarmup(t);
    expect(t.round?.kind).toBe('warmup');
    t = play(t);
    expect(t.round?.kind).toBe('scene');
  });

  it('runs Half-Life at 60, 30 then 15 seconds', () => {
    const halfLife = CARDS.find((card) => card.warmup?.halfLife)?.id;
    if (!halfLife) throw new Error('the deck has no Half-Life warm-up');
    let t = startRound(startWarmup(trip(), halfLife), T0);
    const seconds = cardById(halfLife)?.warmup?.seconds ?? 60;
    let result = tick(t, T0 + seconds * 1000);
    expect(result.events).toEqual(['half-life-pass']);
    t = startRound(result.trip, T0);
    expect(warmup(t).clock.durationMs).toBe(seconds * 500);
    result = tick(t, T0 + seconds * 500);
    t = startRound(result.trip, T0);
    expect(warmup(t).clock.durationMs).toBe(seconds * 250);
    expect(tick(t, T0 + seconds * 250).events).toEqual(['warmup-done']);
  });
});

describe('filters and settings', () => {
  it('only draws voice-only cards when voice-only is on', () => {
    const t = trip({ filters: { voiceOnly: true, quiet: false, moving: false, stretch: true } });
    for (const suit of ['how', 'twist', 'warmup'] as const) {
      for (let i = 0; i < 20; i++) expect(draw(t, suit)?.card.voiceOnly).toBe(true);
    }
    expect(missingSuits(t)).toEqual([]);
  });

  it('re-deals an unstarted hand when How is switched off', () => {
    let t = play(play(trip({}, 9)));
    while (!scene(t).howId) t = play(t);
    const next = updateSettings(t, { ...t.settings, useHow: false });
    expect(scene(next).howId).toBeNull();
  });

  it('keeps a live scene when the voice is toggled', () => {
    const t = startRound(play(trip()), T0);
    expect(updateSettings(t, { ...t.settings, voice: false }).round).toBe(t.round);
  });
});
