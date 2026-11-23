import type { Card, Filters } from './types';

/** One-tap starting points. They only set filters; the player can change any of them after. */
export const PRESETS = {
  car: { label: 'Car', filters: { voiceOnly: true, quiet: false, moving: false } },
  out: { label: 'Out and about', filters: { voiceOnly: false, quiet: true, moving: false } },
  home: { label: 'Home', filters: { voiceOnly: false, quiet: false, moving: true } },
} as const satisfies Record<string, { label: string; filters: Omit<Filters, 'stretch'> }>;

export type PresetId = keyof typeof PRESETS;

export function fits(card: Card, filters: Filters): boolean {
  if (filters.voiceOnly && !card.voiceOnly) return false;
  if (filters.quiet && !card.quiet) return false;
  if (!filters.moving && card.physical) return false;
  if (!filters.stretch && card.level === 'stretch') return false;
  return true;
}

export function matchingPreset(filters: Filters): PresetId | null {
  const match = (Object.keys(PRESETS) as PresetId[]).find((id) => {
    const preset = PRESETS[id].filters;
    return preset.voiceOnly === filters.voiceOnly && preset.quiet === filters.quiet && preset.moving === filters.moving;
  });
  return match ?? null;
}
