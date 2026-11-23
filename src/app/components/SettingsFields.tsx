import { PRESETS, matchingPreset, type PresetId } from '@game/filters';
import type { SceneSeconds, Settings } from '@game/types';
import { Toggle } from './Toggle';

const LENGTHS: readonly SceneSeconds[] = [45, 60, 90];

interface SettingsFieldsProps {
  readonly settings: Settings;
  readonly onChange: (settings: Settings) => void;
}

/** Where you are and how you want to play. Shared by trip setup and the in-trip settings sheet. */
export function SettingsFields({ settings, onChange }: SettingsFieldsProps) {
  const { filters } = settings;
  const preset = matchingPreset(filters);
  const setFilters = (patch: Partial<Settings['filters']>) => {
    onChange({ ...settings, filters: { ...filters, ...patch } });
  };

  return (
    <>
      <fieldset>
        <legend>Where are you playing?</legend>
        <div className="chips">
          {(Object.keys(PRESETS) as PresetId[]).map((id) => (
            <button
              key={id}
              type="button"
              className="chip"
              aria-pressed={preset === id}
              onClick={() => {
                setFilters({ ...PRESETS[id].filters, stretch: filters.stretch });
              }}
            >
              {PRESETS[id].label}
            </button>
          ))}
        </div>
        <Toggle
          label="Hands-free"
          hint="Someone can only use their voice, like a driver."
          checked={filters.handsFree}
          onChange={(handsFree) => {
            setFilters({ handsFree });
          }}
        />
        <Toggle
          label="Seated"
          hint="Nobody needs to stand up or move around."
          checked={filters.seated}
          onChange={(seated) => {
            setFilters({ seated });
          }}
        />
        <Toggle
          label="Quiet"
          hint="Leave out cards that get loud."
          checked={filters.quiet}
          onChange={(quiet) => {
            setFilters({ quiet });
          }}
        />
      </fieldset>

      <fieldset>
        <legend>Scene length</legend>
        <div className="chips">
          {LENGTHS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              className="chip"
              aria-pressed={settings.sceneSeconds === seconds}
              onClick={() => {
                onChange({ ...settings, sceneSeconds: seconds });
              }}
            >
              {seconds} seconds
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>How you play</legend>
        <Toggle
          label="How cards"
          hint="A rule for each scene, like “questions only”."
          checked={settings.useHow}
          onChange={(useHow) => {
            onChange({ ...settings, useHow });
          }}
        />
        <Toggle
          label="Twists"
          hint="Sometimes a change lands halfway through."
          checked={settings.useTwists}
          onChange={(useTwists) => {
            onChange({ ...settings, useTwists });
          }}
        />
        <Toggle
          label="Stretch cards"
          hint="Harder, drier rules for confident players."
          checked={filters.stretch}
          onChange={(stretch) => {
            setFilters({ stretch });
          }}
        />
        <Toggle
          label="Call each turn"
          hint="The phone names who speaks next. Needs a tap per line."
          checked={settings.callTurns}
          onChange={(callTurns) => {
            onChange({ ...settings, callTurns });
          }}
        />
        <Toggle
          label="Read cards aloud"
          hint="The phone reads each hand, so nobody has to."
          checked={settings.voice}
          onChange={(voice) => {
            onChange({ ...settings, voice });
          }}
        />
      </fieldset>
    </>
  );
}
