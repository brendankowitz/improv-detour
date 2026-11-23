import { cardById } from '@game/cards';
import type { SceneRound, Trip, WarmupRound } from '@game/types';

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** What the phone says when a hand is dealt. Short enough to hear in one go. */
export function sceneScript(trip: Trip, round: SceneRound): string {
  const opener = trip.players[trip.opener]?.name ?? 'Someone';
  const where = cardById(round.whereId);
  const who = cardById(round.whoId);
  const how = cardById(round.howId);
  const lines = [
    where ? where.prompt : '',
    who ? `${opener}, you're ${lowerFirst(who.prompt)}` : '',
    how ? `The rule: ${how.prompt}` : '',
  ];
  return lines.filter(Boolean).join(' ');
}

export function warmupScript(round: WarmupRound): string {
  const card = cardById(round.cardId);
  if (!card) return '';
  return [card.title + '.', card.prompt, round.seed ? `Start with: ${round.seed}` : ''].filter(Boolean).join(' ');
}
