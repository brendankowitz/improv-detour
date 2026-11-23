import { describe, expect, it } from 'vitest';
import { CARDS, LIMITS, parseCards, wordCount } from './cards';

/** Words that mean a card needs someone's eyes or hands. A hands-free card must avoid them. */
const NEEDS_EYES_OR_HANDS = /\b(point|pointing|mime|miming|hold up|raise a hand|wave|look at|show)\b/i;

describe('card content', () => {
  it.each(CARDS.map((card) => [card.id, card] as const))('%s fits the card budget', (_, card) => {
    expect(card.title.length).toBeLessThanOrEqual(LIMITS.title);
    expect(wordCount(card.prompt)).toBeLessThanOrEqual(LIMITS.promptWords);
    if (card.tip) expect(wordCount(card.tip)).toBeLessThanOrEqual(LIMITS.tipWords);
  });

  it('keeps hands-free cards free of eyes-and-hands words', () => {
    const offenders = CARDS.filter(
      (card) => card.handsFree && NEEDS_EYES_OR_HANDS.test(`${card.prompt} ${card.tip ?? ''}`),
    ).map((card) => card.id);
    expect(offenders).toEqual([]);
  });

  it('gives every title a single meaning across suits', () => {
    const byTitle = new Map<string, string[]>();
    for (const card of CARDS) byTitle.set(card.title, [...(byTitle.get(card.title) ?? []), card.suit]);
    const clashes = [...byTitle].filter(([, suits]) => new Set(suits).size > 1).map(([title]) => title);
    // The starter deck knowingly shares "Fortunately" between a How card and a warm-up.
    expect(clashes.filter((title) => title !== 'Fortunately')).toEqual([]);
  });
});

describe('parseCards', () => {
  const valid = {
    id: 'W-01', suit: 'where', title: 'A place', prompt: 'Somewhere.', skill: 'listening', level: 'easy',
    volume: 'quiet', handsFree: true, seated: true, minPlayers: 2,
  };

  it('accepts a valid card', () => {
    expect(parseCards({ cards: [valid] })).toHaveLength(1);
  });

  it('names the card and the field when something is wrong', () => {
    expect(() => parseCards({ cards: [{ ...valid, volume: 'shouty' }] })).toThrow(/W-01: volume/);
    expect(() => parseCards({ cards: [{ ...valid, id: 'X-01' }] })).toThrow(/W-01 for suit where/);
    expect(() => parseCards({ cards: [valid, valid] })).toThrow(/more than once/);
    expect(() => parseCards({ cards: [{ ...valid, cue: 'yes-and' }] })).toThrow(/only How cards/);
  });

  it('requires warm-ups to fit inside two minutes', () => {
    const card = { ...valid, id: 'U-01', suit: 'warmup', warmup: { seconds: 300 } };
    expect(() => parseCards({ cards: [card] })).toThrow(/between 15 and 120/);
  });
});
