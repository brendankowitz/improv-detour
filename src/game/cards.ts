import raw from '@content/cards.json';
import { SKILLS, SUITS, type Card, type Level, type Suit, type WarmupConfig } from './types';

const LEVELS: readonly Level[] = ['easy', 'stretch'];
export const ID_PREFIX: Record<Suit, string> = { where: 'W', who: 'C', how: 'H', twist: 'T', warmup: 'U', destination: 'D' };

export const LIMITS = { title: 24, promptWords: 14, whoPromptWords: 16, tipWords: 12, cueWords: 6 } as const;

function fail(id: string, message: string): never {
  throw new Error(`Card ${id}: ${message}`);
}

function oneOf<T extends string>(id: string, field: string, value: unknown, allowed: readonly T[]): T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return value as T;
  return fail(id, `${field} must be one of ${allowed.join(', ')} (got ${JSON.stringify(value)}).`);
}

function text(id: string, field: string, value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return fail(id, `${field} must be non-empty text.`);
  return value;
}

function bool(id: string, field: string, value: unknown): boolean {
  if (typeof value !== 'boolean') return fail(id, `${field} must be true or false.`);
  return value;
}

function strings(id: string, field: string, value: unknown): readonly string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length === 0 || !value.every((s) => typeof s === 'string')) {
    return fail(id, `${field} must be a non-empty list of text.`);
  }
  return value;
}

function parseWarmup(id: string, value: unknown): WarmupConfig {
  if (typeof value !== 'object' || value === null) return fail(id, 'warm-up cards need a warmup block.');
  const w = value as Record<string, unknown>;
  const seconds = w['seconds'];
  if (typeof seconds !== 'number' || seconds < 15 || seconds > 120) {
    return fail(id, 'warmup.seconds must be between 15 and 120 (rounds cap at two minutes).');
  }
  const seeds = strings(id, 'warmup.seeds', w['seeds']);
  const turnCues = strings(id, 'warmup.turnCues', w['turnCues']);
  const halfLife = w['halfLife'] === undefined ? undefined : bool(id, 'warmup.halfLife', w['halfLife']);
  return {
    seconds,
    ...(seeds && { seeds }),
    ...(turnCues && { turnCues }),
    ...(halfLife !== undefined && { halfLife }),
  };
}

function parseCard(value: unknown, index: number): Card {
  if (typeof value !== 'object' || value === null) return fail(`#${index}`, 'is not an object.');
  const c = value as Record<string, unknown>;
  const id = text(`#${index}`, 'id', c['id']);
  const suit = oneOf(id, 'suit', c['suit'], SUITS);
  if (!new RegExp(`^${ID_PREFIX[suit]}-\\d{2}$`).test(id)) fail(id, `id must look like ${ID_PREFIX[suit]}-01 for suit ${suit}.`);
  const tip = c['tip'] === undefined ? undefined : text(id, 'tip', c['tip']);
  const cue = c['cue'] === undefined ? undefined : text(id, 'cue', c['cue']);
  if (cue && suit !== 'how') fail(id, 'only How cards may have a cue.');
  if (suit === 'warmup' && c['warmup'] === undefined) fail(id, 'warm-up cards need a warmup block.');
  if (suit !== 'warmup' && c['warmup'] !== undefined) fail(id, 'only warm-up cards may have a warmup block.');
  const warmup = c['warmup'] === undefined ? undefined : parseWarmup(id, c['warmup']);

  return {
    id,
    suit,
    title: text(id, 'title', c['title']),
    prompt: text(id, 'prompt', c['prompt']),
    ...(tip !== undefined && { tip }),
    skill: oneOf(id, 'skill', c['skill'], SKILLS),
    level: oneOf(id, 'level', c['level'], LEVELS),
    voiceOnly: bool(id, 'voiceOnly', c['voiceOnly']),
    quiet: bool(id, 'quiet', c['quiet']),
    physical: bool(id, 'physical', c['physical']),
    ...(cue !== undefined && { cue }),
    ...(warmup !== undefined && { warmup }),
  };
}

/** Validates the content file at the boundary. Throws with the card id and what to fix. */
export function parseCards(value: unknown): readonly Card[] {
  if (typeof value !== 'object' || value === null || !Array.isArray((value as { cards?: unknown }).cards)) {
    throw new Error('Card content must be an object with a "cards" list.');
  }
  const cards = (value as { cards: unknown[] }).cards.map(parseCard);
  const ids = new Set<string>();
  for (const card of cards) {
    if (ids.has(card.id)) fail(card.id, 'id is used more than once.');
    ids.add(card.id);
  }
  return cards;
}

export const CARDS: readonly Card[] = parseCards(raw);

const BY_ID = new Map(CARDS.map((card) => [card.id, card]));

export function cardById(id: string | null | undefined): Card | null {
  return id ? (BY_ID.get(id) ?? null) : null;
}

export function wordCount(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}
