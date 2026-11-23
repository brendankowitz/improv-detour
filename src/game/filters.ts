import type { Card, Filters } from './types';

export const NO_FILTERS: Filters = { quiet: false, handsFree: false, seated: false, stretch: true };

/** One-tap starting points. They only set filters; the player can change any of them after. */
export const PRESETS = {
  car: { label: 'Car', filters: { quiet: false, handsFree: true, seated: true, stretch: true } },
  out: { label: 'Out and about', filters: { quiet: true, handsFree: false, seated: true, stretch: true } },
  home: { label: 'Home', filters: NO_FILTERS },
} as const satisfies Record<string, { label: string; filters: Filters }>;

export type PresetId = keyof typeof PRESETS;

export function fits(card: Card, filters: Filters, players: number): boolean {
  if (filters.quiet && card.volume === 'loud') return false;
  if (filters.handsFree && !card.handsFree) return false;
  if (filters.seated && !card.seated) return false;
  if (!filters.stretch && card.level === 'stretch') return false;
  return card.minPlayers <= players;
}

export function matchingPreset(filters: Filters): PresetId | null {
  const match = (Object.keys(PRESETS) as PresetId[]).find((id) => {
    const preset = PRESETS[id].filters;
    return (
      preset.quiet === filters.quiet &&
      preset.handsFree === filters.handsFree &&
      preset.seated === filters.seated
    );
  });
  return match ?? null;
}
