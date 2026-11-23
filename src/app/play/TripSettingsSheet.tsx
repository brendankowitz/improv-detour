import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonList, IonListHeader, IonModal, IonTitle, IonToolbar } from '@ionic/react';
import { headForDestination, renamePlayer, setDriver, updateSettings } from '@game/trip';
import type { Trip } from '@game/types';
import { SettingsFields } from '@app/components/SettingsFields';

interface TripSettingsSheetProps {
  readonly trip: Trip;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly act: (step: (trip: Trip) => Trip) => void;
  readonly onEnd: () => void;
}

export function TripSettingsSheet({ trip, isOpen, onClose, act, onEnd }: TripSettingsSheetProps) {
  const arriving = trip.round?.kind === 'scene' && trip.round.arrival;
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} initialBreakpoint={1} breakpoints={[0, 1]}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Trip settings</IonTitle>
          <IonButtons slot="end">
            <IonButton strong onClick={onClose}>
              Done
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent color="light">
        <SettingsFields
          settings={trip.settings}
          onChange={(settings) => {
            act((t) => updateSettings(t, settings));
          }}
          players={trip.players}
          driverId={trip.driverId}
          onDriverChange={(driverId) => {
            act((t) => setDriver(t, driverId));
          }}
        />
        <IonListHeader>
          <IonLabel>Names</IonLabel>
        </IonListHeader>
        <IonList inset>
          {trip.players.map((player, index) => (
            <IonItem key={player.id}>
              <IonInput
                aria-label={`Player ${index + 1} name`}
                value={player.name}
                maxlength={24}
                onIonChange={(event) => {
                  const name = event.detail.value ?? '';
                  act((t) => renamePlayer(t, player.id, name));
                }}
              />
            </IonItem>
          ))}
        </IonList>
        <IonList inset>
          {trip.settings.length === 'open' && !arriving && (
            <IonItem
              button
              detail={false}
              onClick={() => {
                act(headForDestination);
                onClose();
              }}
            >
              <IonLabel color="primary">Head for the destination</IonLabel>
            </IonItem>
          )}
          <IonItem button detail={false} onClick={onEnd}>
            <IonLabel color="danger">End trip</IonLabel>
          </IonItem>
        </IonList>
        <p className="section-note">Ended trips stay in Trips, and you can pick them up again.</p>
      </IonContent>
    </IonModal>
  );
}
