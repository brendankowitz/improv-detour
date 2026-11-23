import { describe, expect, it } from 'vitest';
import { pickCast, type Cast, type PastCast } from './casting';

const players = ['Ana', 'Ben', 'Cy', 'Di'].map((name, i) => ({ id: `p${i + 1}`, name }));

function run(scenes: number, driverId: string | null, director = false, cast = players): Cast[] {
  const past: PastCast[] = [];
  const casts: Cast[] = [];
  for (let i = 0; i < scenes; i++) {
    const pick = pickCast(cast, driverId, past, director);
    if (!pick) throw new Error('no cast');
    casts.push(pick);
    past.push([pick.openerId, pick.partnerId]);
  }
  return casts;
}

describe('pickCast', () => {
  it('never casts the same player twice in one scene', () => {
    for (const cast of run(24, null)) expect(cast.openerId).not.toBe(cast.partnerId);
  });

  it.each([null, 'p4', 'p1'])('never leaves anyone out for more than two scenes running (driver %s)', (driverId) => {
    const casts = run(24, driverId);
    for (const player of players) {
      let out = 0;
      for (const cast of casts) {
        out = cast.openerId === player.id || cast.partnerId === player.id ? 0 : out + 1;
        expect(out, `${player.name} sat out too long`).toBeLessThanOrEqual(2);
      }
    }
  });

  it('brings up every pairing', () => {
    const pairs = new Set(run(12, null).map((c) => [c.openerId, c.partnerId].sort().join('+')));
    expect(pairs.size).toBe(6);
  });

  it('shares the Opener role evenly', () => {
    const counts = new Map<string, number>();
    for (const cast of run(12, null)) counts.set(cast.openerId, (counts.get(cast.openerId) ?? 0) + 1);
    expect([...counts.values()]).toEqual([3, 3, 3, 3]);
  });

  it('never makes the driver the Opener, but does cast them as Partner', () => {
    const casts = run(9, 'p2');
    expect(casts.some((c) => c.openerId === 'p2')).toBe(false);
    expect(casts.some((c) => c.partnerId === 'p2')).toBe(true);
  });

  it('picks an on-deck Director who is never the driver', () => {
    for (const cast of run(9, 'p4', true)) {
      expect(cast.directorId).not.toBeNull();
      expect([cast.openerId, cast.partnerId, 'p4']).not.toContain(cast.directorId);
    }
  });

  it('works for two players with one driving', () => {
    expect(run(3, 'p1', true, players.slice(0, 2))).toEqual(
      Array(3).fill({ openerId: 'p2', partnerId: 'p1', directorId: null }),
    );
  });
});
