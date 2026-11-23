import { IonItem, IonLabel, IonList, IonListHeader, IonNote, IonSegment, IonSegmentButton, IonSelect, IonSelectOption, IonToggle } from '@ionic/react';
import { PRESETS, matchingPreset, type PresetId } from '@game/filters';
import type { Player, SceneSeconds, Settings, TripLength } from '@game/types';

const LENGTHS: readonly SceneSeconds[] = [45, 60, 75];
const TRIP_LENGTHS: readonly { id: TripLength; label: string }[] = [
  { id: 'short', label: 'Short' },
  { id: 'standard', label: 'Standard' },
  { id: 'open', label: 'Open road' },
];
const TRIP_NOTE: Record<TripLength, string> = {
  short: 'Four stops: a warm-up, two scenes and the arrival. About eight minutes.',
  standard: 'Six stops: a warm-up, four scenes and the arrival. About twelve minutes.',
  open: 'Keep going as long as you like, then head for the destination.',
};

interface SettingsFieldsProps {
  readonly settings: Settings;
  readonly onChange: (settings: Settings) => void;
  readonly players: readonly Player[];
  /** The driver's player id, or null. */
  readonly driverId: string | null;
  readonly onDriverChange: (driverId: string | null) => void;
  /** Quick play has no trip to shape, no driver seat and no Director. */
  readonly variant?: 'trip' | 'quick';
}

/** Where you are and how you want to play: grouped iOS settings lists. */
export function SettingsFields({ settings, onChange, players, driverId, onDriverChange, variant = 'trip' }: SettingsFieldsProps) {
  const isTrip = variant === 'trip';
  const { filters } = settings;
  const preset = matchingPreset(filters);
  const setFilters = (patch: Partial<Settings['filters']>) => {
    onChange({ ...settings, filters: { ...filters, ...patch } });
  };
  const toggle = (label: string, checked: boolean, change: (value: boolean) => void, note?: string) => (
    <IonItem>
      <IonToggle
        checked={checked}
        onIonChange={(event) => {
          change(event.detail.checked);
        }}
      >
        <IonLabel>
          {label}
          {note && <IonNote className="ion-text-wrap" style={{ display: 'block', fontSize: 13 }}>{note}</IonNote>}
        </IonLabel>
      </IonToggle>
    </IonItem>
  );

  return (
    <>
      <IonListHeader>
        <IonLabel>Where are you?</IonLabel>
      </IonListHeader>
      <div style={{ padding: '4px 16px 10px' }}>
        <IonSegment
          value={preset ?? 'custom'}
          onIonChange={(event) => {
            const id = event.detail.value as PresetId | 'custom' | undefined;
            if (id && id !== 'custom') setFilters({ ...PRESETS[id].filters });
          }}
        >
          {(Object.keys(PRESETS) as PresetId[]).map((id) => (
            <IonSegmentButton key={id} value={id}>
              <IonLabel>{PRESETS[id].label}</IonLabel>
            </IonSegmentButton>
          ))}
        </IonSegment>
      </div>
      <IonList inset>
        {toggle('Voice only', filters.voiceOnly, (voiceOnly) => { setFilters({ voiceOnly }); }, 'Every card works by ear, so a driver can play.')}
        {isTrip && filters.voiceOnly && players.length > 0 && (
          <IonItem>
            <IonSelect
              label="Who’s driving?"
              interface="action-sheet"
              value={driverId ?? 'none'}
              onIonChange={(event) => {
                const value = event.detail.value as string;
                onDriverChange(value === 'none' ? null : value);
              }}
            >
              <IonSelectOption value="none">Nobody playing</IonSelectOption>
              {players.map((player) => (
                <IonSelectOption key={player.id} value={player.id}>
                  {player.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        )}
        {toggle('Quiet', filters.quiet, (quiet) => { setFilters({ quiet }); }, 'Nothing louder than a table voice.')}
        {toggle('Moving allowed', filters.moving, (moving) => { setFilters({ moving }); }, 'Adds cards where someone stands up.')}
      </IonList>
      {isTrip && filters.voiceOnly && (
        <p className="section-note">The driver never opens a scene and never lands one. They can say “driving” to drop out.</p>
      )}

      {isTrip && (
        <>
          <IonListHeader>
            <IonLabel>Trip</IonLabel>
          </IonListHeader>
          <div style={{ padding: '4px 16px 6px' }}>
            <IonSegment
              value={settings.length}
              onIonChange={(event) => {
                const length = event.detail.value as TripLength | undefined;
                if (length) onChange({ ...settings, length });
              }}
            >
              {TRIP_LENGTHS.map(({ id, label }) => (
                <IonSegmentButton key={id} value={id}>
                  <IonLabel>{label}</IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>
          </div>
          <p className="section-note">{TRIP_NOTE[settings.length]}</p>
        </>
      )}

      <IonListHeader>
        <IonLabel>Scene length</IonLabel>
      </IonListHeader>
      <div style={{ padding: '4px 16px 10px' }}>
        <IonSegment
          value={String(settings.sceneSeconds)}
          onIonChange={(event) => {
            const seconds = Number(event.detail.value) as SceneSeconds;
            if (LENGTHS.includes(seconds)) onChange({ ...settings, sceneSeconds: seconds });
          }}
        >
          {LENGTHS.map((seconds) => (
            <IonSegmentButton key={seconds} value={String(seconds)}>
              <IonLabel>{seconds} sec</IonLabel>
            </IonSegmentButton>
          ))}
        </IonSegment>
      </div>

      <IonListHeader>
        <IonLabel>Play</IonLabel>
      </IonListHeader>
      <IonList inset>
        {toggle('How cards', settings.useHow, (useHow) => { onChange({ ...settings, useHow }); }, isTrip ? 'A rule for the scene, from the second scene on.' : 'A rule for the whole scene.')}
        {toggle('Twists', settings.useTwists, (useTwists) => { onChange({ ...settings, useTwists }); }, isTrip ? 'Every other scene, something changes at the 60% mark.' : 'Something changes at the 60% mark.')}
        {toggle('Stretch cards', filters.stretch, (stretch) => { setFilters({ stretch }); }, 'Harder, drier rules once you’ve warmed up.')}
        {isTrip && toggle('Director', settings.director, (director) => { onChange({ ...settings, director }); }, 'Someone off-scene can swap a card, throw the twist and call “Scene!”')}
        {toggle('Read cards aloud', settings.voice, (voice) => { onChange({ ...settings, voice }); })}
      </IonList>
    </>
  );
}
