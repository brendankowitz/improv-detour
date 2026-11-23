import { describe, expect, it } from 'vitest';
import { cardById } from './cards';
import { dealAgain, newQuickPlay, quickPlayers, type QuickKind, type QuickPlay } from './quick';
import { DEFAULT_SETTINGS, land, startRound } from './trip';
import type { Settings } from './types';

const T0 = 1_000_000;

function quick(kind: QuickKind, settings: Partial<Settings> = {}, players = ['Ana', 'Ben', 'Cy', 'Di'], seed = 7): QuickPlay {
  return newQuickPlay({ kind, players, settings: { ...DEFAULT_SETTINGS, ...settings }, now: T0, seed });
}

/** Plays the dealt round through, then deals the next. */
function playAndDeal(play: QuickPlay, at: number): QuickPlay {
  let trip = startRound(play.trip, at);
  if (trip.round?.kind === 'scene') trip = land(trip, at + 1000);
  return dealAgain({ ...play, trip }, at + 2000);
}

describe('quick play', () => {
  it('fills in stand-in names so a scene can always be cast', () => {
    expect(quickPlayers([])).toEqual(['Player 1', 'Player 2']);
    expect(quickPlayers([' Ana ', ''])).toEqual(['Ana', 'Player 2']);
    expect(quickPlayers(['Ana', 'Ben', 'Cy'])).toEqual(['Ana', 'Ben', 'Cy']);
  });

  it('deals a full scene from the first hand: a How, and a twist when the How is easy', () => {
    const round = quick('scene').trip.round;
    expect(round?.kind).toBe('scene');
    if (round?.kind !== 'scene') return;
    const how = cardById(round.howId);
    expect(how?.suit).toBe('how');
    expect(round.twistId !== null).toBe(how?.level === 'easy');
  });

  it('leaves out Hows and twists when they are switched off', () => {
    const round = quick('scene', { useHow: false, useTwists: false }).trip.round;
    expect(round?.kind === 'scene' && round.howId === null && round.twistId === null).toBe(true);
  });

  it('never pairs a twist with a stretch How', () => {
    let play = quick('scene');
    for (let i = 0; i < 40; i++) {
      const round = play.trip.round;
      if (round?.kind === 'scene' && cardById(round.howId)?.level === 'stretch') expect(round.twistId).toBeNull();
      play = playAndDeal(play, T0 + i * 10_000);
    }
  });

  it('rotates the cast from one scene to the next, sharing the Opener evenly', () => {
    let play = quick('scene');
    const counts = new Map<string, number>();
    for (let i = 0; i < 12; i++) {
      const round = play.trip.round;
      if (round?.kind === 'scene') counts.set(round.openerId, (counts.get(round.openerId) ?? 0) + 1);
      play = playAndDeal(play, T0 + i * 10_000);
    }
    expect([...counts.values()]).toEqual([3, 3, 3, 3]);
  });

  it('deals warm-ups with a seed', () => {
    const round = quick('warmup').trip.round;
    expect(round?.kind).toBe('warmup');
    expect(round?.kind === 'warmup' && round.seed).toBeTruthy();
  });

  it.each(['who', 'where', 'how', 'twist'] as const)('draws single %s cards without repeating', (kind) => {
    let play = quick(kind);
    const seen: string[] = [];
    for (let i = 0; i < 10; i++) {
      expect(play.card?.suit).toBe(kind);
      seen.push(play.card?.id ?? '');
      play = dealAgain(play, T0 + i);
    }
    expect(new Set(seen).size).toBe(10);
    expect(play.trip.round).toBeNull();
  });

  it('respects the filters', () => {
    let play = quick('who', { filters: { ...DEFAULT_SETTINGS.filters, voiceOnly: true } });
    for (let i = 0; i < 20; i++) {
      expect(play.card?.voiceOnly).toBe(true);
      play = dealAgain(play, T0 + i);
    }
  });
});
