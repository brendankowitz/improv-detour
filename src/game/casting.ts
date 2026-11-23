import type { Player } from './types';

export interface Cast {
  readonly openerId: string;
  readonly partnerId: string;
  readonly directorId: string | null;
}

/** An earlier scene's Opener and Partner, oldest first. */
export type PastCast = readonly [openerId: string, partnerId: string];

/** Anyone who has sat out this many scenes running must be cast next. */
export const MAX_SIT_OUT = 2;

/**
 * Who plays the next scene, worked out from the scenes already played so nothing extra needs saving:
 * - anyone who has sat out two scenes running is cast;
 * - the Opener is whoever has opened least (never the driver);
 * - the Partner is whoever has played least with that Opener.
 * Ties go to whoever has waited longest, then to seating order. This shares the Opener role evenly and varies the
 * pairs; a plain "least recently cast" rule locks four players into the same two pairs.
 */
export function pickCast(
  players: readonly Player[],
  driverId: string | null,
  past: readonly PastCast[],
  withDirector: boolean,
): Cast | null {
  if (players.length < 2) return null;
  const waited = (id: string) => {
    const last = past.findLastIndex(([opener, partner]) => opener === id || partner === id);
    return past.length - 1 - last;
  };
  const opened = (id: string) => past.filter(([opener]) => opener === id).length;
  const together = (a: string, b: string) =>
    past.filter(([x, y]) => (x === a && y === b) || (x === b && y === a)).length;
  const due = (id: string) => waited(id) >= MAX_SIT_OUT;

  const best = (candidates: readonly Player[], score: (player: Player) => readonly number[]) =>
    candidates.reduce<Player | null>((winner, player) => {
      if (!winner) return player;
      const a = score(player);
      const b = score(winner);
      const i = a.findIndex((value, index) => value !== b[index]);
      return i !== -1 && (a[i] ?? 0) < (b[i] ?? 0) ? player : winner;
    }, null);

  const openers = players.filter((player) => player.id !== driverId);
  const opener = best(openers, (p) => [due(p.id) ? 0 : 1, opened(p.id), -waited(p.id)]);
  if (!opener) return null;
  const partner = best(
    players.filter((player) => player !== opener),
    (p) => [due(p.id) ? 0 : 1, together(opener.id, p.id), -waited(p.id)],
  );
  if (!partner) return null;

  const onDeck = players.filter((player) => player !== opener && player !== partner && player.id !== driverId);
  const director = withDirector && onDeck.length > 0 ? onDeck[past.length % onDeck.length] : undefined;
  return { openerId: opener.id, partnerId: partner.id, directorId: director?.id ?? null };
}
