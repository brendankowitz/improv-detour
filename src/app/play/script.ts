import { cardById } from '@game/cards';
import { playerName, souvenirs } from '@game/trip';
import type { SceneRound, Trip, WarmupRound } from '@game/types';

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** What the phone says when a hand is dealt: Where, then How, then the Who, addressed by name. */
export function sceneScript(trip: Trip, round: SceneRound): string {
  const opener = playerName(trip, round.openerId);
  const partner = playerName(trip, round.partnerId);
  const where = cardById(round.whereId);
  const who = cardById(round.whoId);
  const how = cardById(round.howId);
  const kept = souvenirs(trip);
  const lines = [
    round.arrival ? `You’ve arrived. ${where?.prompt ?? ''}` : (where?.prompt ?? ''),
    how ? `The rule: ${how.prompt}` : '',
    round.twistId ? 'A twist is coming.' : '',
    who ? `${opener}, you’re ${lowerFirst(who.prompt)}` : '',
    `${partner}, you’re with them.`,
    round.arrival && kept.length > 0 ? `${opener}, bring back something from today.` : '',
  ];
  return lines.filter(Boolean).join(' ');
}

export function warmupScript(round: WarmupRound): string {
  const card = cardById(round.cardId);
  if (!card) return '';
  return [`${card.title}.`, card.prompt, round.seed ? `Start with: ${round.seed}` : ''].filter(Boolean).join(' ');
}

export function destinationScript(trip: Trip): string {
  const destination = cardById(trip.destinationId);
  return destination ? `Today’s destination: ${destination.title}. First, a warm-up.` : '';
}
