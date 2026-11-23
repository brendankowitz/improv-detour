import { describe, expect, it } from 'vitest';
import { CARDS, LIMITS, parseCards, wordCount } from './cards';
import { PRESETS } from './filters';
import { SUITS, type Filters, type Suit } from './types';

/** Words that mean a card needs someone's eyes or hands. A voice-only card must avoid them. */
const NEEDS_EYES_OR_HANDS = /\b(point|pointing|mime|miming|hold up|raise a hand|wave|look at|show|see the)\b/i;

const count = (suit: Suit, filters?: Filters) =>
  CARDS.filter((card) => card.suit === suit && (!filters || passes(card, filters))).length;

function passes(card: (typeof CARDS)[number], filters: Filters): boolean {
  if (filters.voiceOnly && !card.voiceOnly) return false;
  if (filters.quiet && !card.quiet) return false;
  if (!filters.moving && card.physical) return false;
  return true;
}

describe('the deck', () => {
  it('has the agreed mix', () => {
    expect(Object.fromEntries(SUITS.map((suit) => [suit, count(suit)]))).toEqual({
      where: 26, who: 30, how: 16, twist: 12, warmup: 12, destination: 6,
    });
  });

  it.each(CARDS.map((card) => [card.id, card] as const))('%s fits the card budget', (_, card) => {
    expect(card.title.length).toBeLessThanOrEqual(LIMITS.title);
    const limit = card.suit === 'who' ? LIMITS.whoPromptWords : LIMITS.promptWords;
    expect(wordCount(card.prompt)).toBeLessThanOrEqual(limit);
    if (card.tip) expect(wordCount(card.tip)).toBeLessThanOrEqual(LIMITS.tipWords);
    if (card.cue) expect(wordCount(card.cue)).toBeLessThanOrEqual(LIMITS.cueWords);
  });

  it('keeps voice-only cards free of eyes-and-hands words', () => {
    const offenders = CARDS.filter(
      (card) => card.voiceOnly && NEEDS_EYES_OR_HANDS.test(`${card.prompt} ${card.tip ?? ''}`),
    ).map((card) => card.id);
    expect(offenders).toEqual([]);
  });

  it('gives every title one meaning', () => {
    const titles = CARDS.map((card) => card.title.toLowerCase());
    expect(titles.filter((title, index) => titles.indexOf(title) !== index)).toEqual([]);
  });

  it('gives every How a standing cue and splits them into an easy and a stretch ladder', () => {
    const hows = CARDS.filter((card) => card.suit === 'how');
    expect(hows.every((card) => card.cue)).toBe(true);
    expect(hows.filter((card) => card.level === 'easy')).toHaveLength(8);
  });

  it('writes Who cards as noun phrases the app can read as "you’re …"', () => {
    const bad = CARDS.filter((card) => card.suit === 'who' && !/^(a|an|the)\b/i.test(card.prompt)).map((c) => c.id);
    expect(bad).toEqual([]);
  });

  it('writes Who cards so the app can name the Partner: "you" only in "needs you to", no pronouns for the Opener', () => {
    const whos = CARDS.filter((card) => card.suit === 'who');
    const strayYou = whos.filter((card) => /\byou\b/i.test(card.prompt.replace(/\bneeds? you to\b/gi, ''))).map((c) => c.id);
    const opener = whos.filter((card) => /\b(they|them|their|they’re|they’ve)\b/i.test(card.prompt)).map((c) => c.id);
    expect({ strayYou, opener }).toEqual({ strayYou: [], opener: [] });
  });

  it('names a role, never "someone", when a Twist singles a player out', () => {
    const vague = CARDS.filter((card) => card.suit === 'twist' && /\b(someone|somebody|one of you)\b/i.test(card.prompt));
    expect(vague.map((c) => c.id)).toEqual([]);
  });

  it('gives warm-ups enough seeds to replay', () => {
    const thin = CARDS.filter((card) => card.suit === 'warmup' && (card.warmup?.seeds?.length ?? 0) < 6).map((c) => c.id);
    expect(thin).toEqual([]);
  });

  it.each(Object.entries(PRESETS))('leaves a full game under the %s preset', (_, preset) => {
    const filters = { ...preset.filters, stretch: true };
    expect(count('where', filters)).toBe(count('where'));
    expect(count('who', filters)).toBe(count('who'));
    expect(count('destination', filters)).toBe(count('destination'));
    expect(count('how', filters)).toBeGreaterThanOrEqual(12);
    expect(count('twist', filters)).toBeGreaterThanOrEqual(8);
    expect(count('warmup', filters)).toBeGreaterThanOrEqual(8);
  });
});

describe('parseCards', () => {
  const valid = {
    id: 'W-01', suit: 'where', title: 'A place', prompt: 'Somewhere.', skill: 'listening', level: 'easy',
    voiceOnly: true, quiet: true, physical: false,
  };

  it('accepts a valid card', () => {
    expect(parseCards({ cards: [valid] })).toHaveLength(1);
  });

  it('names the card and the field when something is wrong', () => {
    expect(() => parseCards({ cards: [{ ...valid, quiet: 'yes' }] })).toThrow(/W-01: quiet/);
    expect(() => parseCards({ cards: [{ ...valid, id: 'X-01' }] })).toThrow(/W-01 for suit where/);
    expect(() => parseCards({ cards: [valid, valid] })).toThrow(/more than once/);
    expect(() => parseCards({ cards: [{ ...valid, cue: 'Yes, and' }] })).toThrow(/only How cards/);
  });

  it('requires warm-ups to fit inside two minutes', () => {
    const card = { ...valid, id: 'U-01', suit: 'warmup', warmup: { seconds: 300 } };
    expect(() => parseCards({ cards: [card] })).toThrow(/between 15 and 120/);
  });
});
