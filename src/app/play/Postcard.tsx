import { IonButton, IonContent, IonFooter, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { cardById } from '@game/cards';
import { keepDriving, souvenirs } from '@game/trip';
import type { Trip } from '@game/types';
import { useTrips } from '@app/state/TripStore';

export function Postcard({ trip }: { readonly trip: Trip }) {
  const { update, close } = useTrips();
  const destination = cardById(trip.destinationId);
  const kept = souvenirs(trip);
  const scenes = trip.log.filter((entry) => entry.kind !== 'warmup').length;

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>{trip.name}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen color="light">
        <IonHeader collapse="condense">
          <IonToolbar color="light">
            <IonTitle size="large">Arrived</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="wrap">
          <article className="postcard" aria-label="Postcard">
            <div className="postcard-front">
              <p>Greetings from</p>
              <h2>{destination?.title ?? 'the long way'}</h2>
            </div>
            <div className="postcard-back">
              <h3>Cast</h3>
              <p style={{ margin: 0, fontSize: 17 }}>{trip.players.map((player) => player.name).join(', ')}</p>
              <h3>Souvenirs</h3>
              {kept.length > 0 ? (
                <ul>
                  {kept.map((souvenir) => (
                    <li key={`${souvenir.from}-${souvenir.text}`}>{souvenir.text}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: 17 }}>None kept this time.</p>
              )}
              <h3>The road</h3>
              <p style={{ margin: 0, fontSize: 17 }}>
                {scenes} {scenes === 1 ? 'scene' : 'scenes'}, {trip.miles} {trip.miles === 1 ? 'mile' : 'miles'}.
              </p>
            </div>
          </article>
        </div>
      </IonContent>
      <IonFooter className="dock" translucent>
        <IonToolbar>
          <div className="button-row">
            <IonButton
              fill="outline"
              expand="block"
              className="big"
              onClick={() => {
                update(keepDriving);
              }}
            >
              Keep driving
            </IonButton>
            <IonButton expand="block" className="big" onClick={close}>
              New trip
            </IonButton>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
}
