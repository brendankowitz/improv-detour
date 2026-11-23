import {
  IonButton,
  IonContent,
  IonFooter,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useState } from 'react';
import { DEFAULT_SETTINGS, MIN_PLAYERS } from '@game/trip';
import type { Settings } from '@game/types';
import { PlayerFields } from '@app/components/PlayerFields';
import { SettingsFields } from '@app/components/SettingsFields';
import { useTrips } from '@app/state/TripStore';

export function Setup() {
  const { trips, start } = useTrips();
  const last = trips[0];
  const [name, setName] = useState('Sunday drive');
  const [players, setPlayers] = useState<string[]>(last ? last.players.map((player) => player.name) : ['', '', '', '']);
  // Read-aloud starts off for every new trip, even if the last one used it; it's one toggle away.
  const [settings, setSettings] = useState<Settings>(() => (last ? { ...last.settings, voice: DEFAULT_SETTINGS.voice } : DEFAULT_SETTINGS));
  const [driverIndex, setDriverIndex] = useState<number | null>(null);

  const named = players.map((player, index) => ({ name: player.trim(), index })).filter((player) => player.name);
  const ready = named.length >= MIN_PLAYERS;
  // Ids match the ones newTrip will assign, so the driver picker can refer to them before the trip exists.
  const pickerPlayers = named.map((player, position) => ({ id: `p${position + 1}`, name: player.name }));
  const driverPosition = driverIndex === null ? -1 : named.findIndex((player) => player.index === driverIndex);

  const begin = () => {
    if (!ready) return;
    start({
      name,
      players: named.map((player) => player.name),
      driverIndex: settings.filters.voiceOnly && driverPosition >= 0 ? driverPosition : null,
      settings,
    });
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>New trip</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen color="light">
        <IonHeader collapse="condense">
          <IonToolbar color="light">
            <IonTitle size="large">Detour</IonTitle>
          </IonToolbar>
        </IonHeader>
        <form
          className="wrap"
          onSubmit={(event) => {
            event.preventDefault();
            begin();
          }}
        >
          <p className="lede">
            An improv game for wherever you are. Two of you play a one-minute scene, the rest jump in, and the last line
            lands it.
          </p>

          <IonListHeader>
            <IonLabel>Players</IonLabel>
          </IonListHeader>
          <PlayerFields
            players={players}
            onChange={setPlayers}
            onRemove={(index) => {
              if (driverIndex === index) setDriverIndex(null);
            }}
          />
          <p className="section-note">In seating order. Everyone gets cast; roles rotate every scene.</p>

          <SettingsFields
            settings={settings}
            onChange={setSettings}
            players={pickerPlayers}
            driverId={driverPosition >= 0 ? `p${driverPosition + 1}` : null}
            onDriverChange={(id) => {
              const position = id ? Number(id.slice(1)) - 1 : -1;
              setDriverIndex(named[position]?.index ?? null);
            }}
          />

          <IonList inset>
            <IonItem>
              <IonInput
                label="Trip name"
                value={name}
                maxlength={40}
                onIonInput={(event) => {
                  setName(event.detail.value ?? '');
                }}
              />
            </IonItem>
          </IonList>
          <div style={{ height: 24 }} />
        </form>
      </IonContent>
      <IonFooter className="dock" translucent>
        <IonToolbar>
          <div className="wrap">
            <IonButton expand="block" className="big" disabled={!ready} onClick={begin}>
              {ready ? 'Start the trip' : `Add ${MIN_PLAYERS - named.length} more ${MIN_PLAYERS - named.length === 1 ? 'name' : 'names'}`}
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
}
