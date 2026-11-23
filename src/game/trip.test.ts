import { describe, expect, it } from 'vitest';
import { cardById } from './cards';
import { formatClock, remaining } from './clock';
import {
  DEFAULT_SETTINGS,
  bank,
  canBank,
  draw,
  land,
  lineCue,
  missingSuits,
  newTrip,
  nextLine,
  pause,
  resume,
  scrap,
  speakerIndex,
  startRound,
  startWarmup,
  swap,
  tick,
  updateSettings,
} from './trip';
import type { SceneRound, Settings, Trip, WarmupRound } from './types';

const T0 = 1_000_000;

function trip(settings: Partial<Settings> = {}, seed = 42): Trip {
  return newTrip({
    id: 'trip-1',
    name: 'Test',
    players: ['Ana', 'Ben', 'Cy', 'Di'],
    settings: { ...DEFAULT_SETTINGS, ...settings },
    now: T0,
    seed,
  });
}

function scene(t: Trip): SceneRound {
  if (t.round?.kind !== 'scene') throw new Error('expected a scene round');
  return t.round;
}

function warmup(t: Trip): WarmupRound {
  if (t.round?.kind !== 'warmup') throw new Error('expected a warm-up round');
  return t.round;
}

describe('newTrip', () => {
  it('deals the first hand immediately', () => {
    const round = scene(trip());
    expect(round.phase).toBe('brief');
    expect(cardById(round.whereId)?.suit).toBe('where');
    expect(cardById(round.whoId)?.suit).toBe('who');
    expect(cardById(round.howId)?.suit).toBe('how');
  });

  it('drops blank names and caps at six players', () => {
    const t = newTrip({
      id: 'x', name: ' ', players: ['a', ' ', 'b', 'c', 'd', 'e', 'f', 'g'],
      settings: DEFAULT_SETTINGS, now: T0, seed: 1,
    });
    expect(t.players.map((p) => p.name)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    expect(t.name).toBe('The long way');
  });

  it('rejects a trip with nobody in it', () => {
    expect(() => newTrip({ id: 'x', name: 'n', players: [' '], settings: DEFAULT_SETTINGS, now: T0, seed: 1 }))
      .toThrow(/at least one player/);
  });

  it('is reproducible from the seed', () => {
    expect(trip({}, 7).round).toEqual(trip({}, 7).round);
  });

  it('leaves out the How card when How is off', () => {
    expect(scene(trip({ useHow: false })).howId).toBeNull();
  });
});

describe('draw', () => {
  it('does not repeat a card until the suit is used up', () => {
    let t = trip();
    const ids: string[] = [];
    const poolSize = 8;
    for (let i = 0; i < poolSize; i++) {
      const drawn = draw(t, 'where');
      if (!drawn) throw new Error('draw failed');
      ids.push(drawn.card.id);
      t = drawn.trip;
    }
    // The first hand already used one Where, so after the pool is exhausted it reshuffles.
    expect(new Set(ids.slice(0, poolSize - 1)).size).toBe(poolSize - 1);
  });

  it('honours the hands-free and quiet filters', () => {
    const t = trip({ filters: { quiet: true, handsFree: true, seated: true, stretch: true } });
    for (let i = 0; i < 30; i++) {
      const drawn = draw(t, 'how', []);
      const card = drawn?.card;
      expect(card?.handsFree).toBe(true);
      expect(card?.volume).not.toBe('loud');
    }
  });

  it('reports suits the filters leave empty', () => {
    const t = trip();
    expect(missingSuits(t)).toEqual([]);
  });
});

describe('a scene', () => {
  it('runs brief → live → button → banked, then deals the next hand', () => {
    let t = trip();
    t = startRound(t, T0);
    expect(scene(t).phase).toBe('live');

    const result = tick(t, T0 + 60_000);
    expect(result.events).toContain('time-up');
    t = result.trip;
    expect(scene(t).phase).toBe('button');
    expect(canBank(t.round)).toBe(true);

    const opener = t.opener;
    t = bank(t, T0 + 70_000, '  Dad was the GPS ');
    expect(t.miles).toBe(1);
    expect(t.log[0]?.note).toBe('Dad was the GPS');
    expect(t.opener).toBe((opener + 1) % 4);
    expect(scene(t).phase).toBe('brief');
  });

  it('cannot bank before the button', () => {
    const t = startRound(trip(), T0);
    expect(bank(t, T0 + 1000)).toBe(t);
  });

  it('lands early and keeps the time left', () => {
    let t = startRound(trip(), T0);
    t = land(t, T0 + 20_000);
    const round = scene(t);
    expect(round.phase).toBe('button');
    expect(remaining(round.clock, T0 + 99_000)).toBe(40_000);
  });

  it('pauses and resumes without losing time', () => {
    let t = startRound(trip(), T0);
    t = pause(t, T0 + 10_000);
    t = resume(t, T0 + 500_000);
    expect(formatClock(remaining(scene(t).clock, T0 + 510_000))).toBe('0:40');
    expect(tick(t, T0 + 540_000).events).toEqual([]);
  });

  it('fires the twist once, at the halfway point', () => {
    // Find a seed whose first hand has a twist.
    let t: Trip | null = null;
    for (let seed = 1; seed < 200 && !t; seed++) {
      const candidate = trip({}, seed);
      if (scene(candidate).twistId) t = candidate;
    }
    if (!t) throw new Error('no seed produced a twist');
    t = startRound(t, T0);
    expect(tick(t, T0 + 29_000).events).toEqual([]);
    const half = tick(t, T0 + 30_000);
    expect(half.events).toEqual(['twist']);
    expect(tick(half.trip, T0 + 31_000).events).toEqual([]);
  });

  it('never deals a twist when twists are off', () => {
    for (let seed = 1; seed < 50; seed++) {
      expect(scene(trip({ useTwists: false }, seed)).twistId).toBeNull();
    }
  });

  it('swaps a card only before the scene starts', () => {
    const t = trip();
    const swapped = swap(t, 'where');
    expect(scene(swapped).whereId).not.toBe(scene(t).whereId);
    const live = startRound(t, T0);
    expect(swap(live, 'where')).toBe(live);
  });

  it('scraps with no mile and keeps the opener', () => {
    const t = startRound(trip(), T0);
    const scrapped = scrap(t);
    expect(scrapped.miles).toBe(0);
    expect(scrapped.opener).toBe(t.opener);
    expect(scene(scrapped).phase).toBe('brief');
  });

  it('calls turns around the group from the opener', () => {
    let t = startRound(trip(), T0);
    expect(speakerIndex(t)).toBe(0);
    t = nextLine(nextLine(t));
    expect(speakerIndex(t)).toBe(2);
  });
});

describe('warm-ups', () => {
  it('banks a mile and returns to scenes', () => {
    let t = startWarmup(trip(), 'U-01');
    expect(warmup(t).seed).not.toBeNull();
    t = startRound(t, T0);
    t = bank(t, T0 + 30_000);
    expect(t.miles).toBe(1);
    expect(t.log[0]?.kind).toBe('warmup');
    expect(t.round?.kind).toBe('scene');
  });

  it('runs Half-Life at 60, 30 then 15 seconds', () => {
    let t = startRound(startWarmup(trip(), 'U-04'), T0);
    let result = tick(t, T0 + 60_000);
    expect(result.events).toEqual(['half-life-pass']);
    t = startRound(result.trip, T0 + 70_000);
    expect(warmup(t).clock.durationMs).toBe(30_000);
    result = tick(t, T0 + 100_000);
    t = startRound(result.trip, T0 + 110_000);
    expect(warmup(t).clock.durationMs).toBe(15_000);
    result = tick(t, T0 + 125_000);
    expect(result.events).toEqual(['warmup-done']);
  });
});

describe('settings', () => {
  it('re-deals an unstarted hand when How is switched off', () => {
    const t = trip();
    const next = updateSettings(t, { ...t.settings, useHow: false });
    expect(scene(next).howId).toBeNull();
  });

  it('keeps a live scene when the voice is toggled', () => {
    const t = startRound(trip(), T0);
    expect(updateSettings(t, { ...t.settings, voice: false }).round).toBe(t.round);
  });
});

describe('lineCue', () => {
  it('alternates Fortunately and Unfortunately', () => {
    expect(lineCue('fortunately', 0)).toBe('Fortunately…');
    expect(lineCue('fortunately', 1)).toBe('Unfortunately…');
  });

  it('walks the alphabet', () => {
    expect(lineCue('alphabet', 2)).toBe('Start with C.');
  });
});
