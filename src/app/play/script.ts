import { cardById } from '@game/cards';
import { playerName, souvenirs } from '@game/trip';
import type { SceneRound, Trip, WarmupRound } from '@game/types';

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * Who cards are written to the Partner ("…who needs you to sign the slip"). Read aloud to the Opener, that "you"
 * would mean two people, so the Partner is named instead: "Ana, you're a librarian who needs Ben to…".
 */
export function whoForVoice(prompt: string, partner: string): string {
  // The Partner is named once; after that "your" becomes "their", so it never reads "lift Ben's feet".
  let named = false;
  return prompt.replace(/\bneeds? you to\b|\byour\b/gi, (match) => {
    const isYour = /^your$/i.test(match);
    if (isYour && named) return 'their';
    named = true;
    return isYour ? `${partner}’s` : match.replace(/you/i, partner);
  });
}

/** Twists name "the Opener" or "the Partner"; read aloud, they get real names. */
export function twistForVoice(prompt: string, opener: string, partner: string): string {
  return prompt.replace(/\bthe Opener’s\b/g, `${opener}’s`).replace(/\bthe Partner’s\b/g, `${partner}’s`)
    .replace(/\bthe Opener\b/gi, opener).replace(/\bthe Partner\b/gi, partner);
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
    who ? `${opener}, you’re ${lowerFirst(whoForVoice(who.prompt, partner))}` : '',
    `${partner}, say who you are to them.`,
    round.arrival && kept.length > 0 ? `${opener}, bring back something from today.` : '',
  ];
  return lines.filter(Boolean).join(' ');
}

export function twistScript(trip: Trip, round: SceneRound): string {
  const twist = cardById(round.twistId);
  if (!twist) return '';
  return twistForVoice(twist.prompt, playerName(trip, round.openerId), playerName(trip, round.partnerId));
}

export function warmupScript(round: WarmupRound): string {
  const card = cardById(round.cardId);
  if (!card) return '';
  return [`${card.title}.`, card.prompt, round.seed ? `Start with: ${round.seed}` : ''].filter(Boolean).join(' ');
}

/** At the start of a trip only the destination's name is read; its arrival prompt is saved for the end. */
export function destinationScript(trip: Trip): string {
  const destination = cardById(trip.destinationId);
  return destination ? `Today’s destination: ${destination.title}. First, a warm-up.` : '';
}
