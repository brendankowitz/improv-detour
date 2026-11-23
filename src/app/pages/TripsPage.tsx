import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/react';
import { cardById } from '@game/cards';
import { useTrips } from '@app/state/TripStore';

const dateFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export function TripsPage() {
  const { trips, current, open, close, forget } = useTrips();
  const router = useIonRouter();
  const totalMiles = trips.reduce((sum, trip) => sum + trip.miles, 0);

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Trips</IonTitle>
          {current && (
            <IonButtons slot="end">
              <IonButton
                onClick={() => {
                  close();
                  router.push('/play', 'root');
                }}
              >
                New trip
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen color="light">
        <IonHeader collapse="condense">
          <IonToolbar color="light">
            <IonTitle size="large">Trips</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="wrap">
          {trips.length === 0 ? (
            <p className="lede">Your trips show up here once you’ve played one. Start from Play.</p>
          ) : (
            <>
              <p className="section-note" style={{ paddingTop: 4 }}>
                {totalMiles} {totalMiles === 1 ? 'mile' : 'miles'} together. Swipe left to forget a trip.
              </p>
              <IonList inset>
                {trips.map((trip) => {
                  const destination = cardById(trip.destinationId)?.title;
                  const status = trip.finishedAt ? 'Arrived' : trip.id === current?.id ? 'Playing' : 'Paused';
                  return (
                    <IonItemSliding key={trip.id}>
                      <IonItem
                        button
                        onClick={() => {
                          open(trip.id);
                          router.push('/play', 'root');
                        }}
                      >
                        <IonLabel>
                          <h2 style={{ fontWeight: 600 }}>{trip.name}</h2>
                          <p>
                            {destination ? `To ${destination}` : 'The long way'} · {trip.miles}{' '}
                            {trip.miles === 1 ? 'mile' : 'miles'}
                          </p>
                          <p>{trip.players.map((player) => player.name).join(', ')}</p>
                        </IonLabel>
                        <IonNote slot="end" style={{ textAlign: 'right', fontSize: 13 }}>
                          {dateFormat.format(trip.createdAt)}
                          <br />
                          {status}
                        </IonNote>
                      </IonItem>
                      <IonItemOptions side="end">
                        <IonItemOption
                          color="danger"
                          onClick={() => {
                            forget(trip.id);
                          }}
                        >
                          Forget
                        </IonItemOption>
                      </IonItemOptions>
                    </IonItemSliding>
                  );
                })}
              </IonList>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
