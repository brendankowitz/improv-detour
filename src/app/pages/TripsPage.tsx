import { IonContent, IonPage, useIonRouter } from '@ionic/react';
import { useState } from 'react';
import { useTrips } from '@app/state/TripStore';

const dateFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

export function TripsPage() {
  const { trips, current, open, close, forget } = useTrips();
  const router = useIonRouter();
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <IonPage>
      <IonContent className="page">
        <main className="page-inner">
          <h1 className="title">Trips</h1>
          {trips.length === 0 && <p className="muted">No trips yet. Start one from Play and it will show up here.</p>}
          {current && (
            <button
              type="button"
              className="btn btn-block"
              onClick={() => {
                close();
                router.push('/play', 'root');
              }}
            >
              Start a new trip
            </button>
          )}
          <div className="list">
            {trips.map((trip) => (
              <article key={trip.id} className="list-item">
                <h3>{trip.name}</h3>
                <p className="muted small">
                  {dateFormat.format(trip.createdAt)} · {trip.players.map((p) => p.name).join(', ')} · {trip.miles}{' '}
                  {trip.miles === 1 ? 'mile' : 'miles'}
                </p>
                {trip.log.some((entry) => entry.note) && (
                  <ul className="muted small" style={{ margin: 0, paddingLeft: '1.1rem' }}>
                    {trip.log
                      .filter((entry) => entry.note)
                      .slice(0, 5)
                      .map((entry) => (
                        <li key={entry.id}>
                          {entry.note} <span style={{ opacity: 0.7 }}>({entry.title})</span>
                        </li>
                      ))}
                  </ul>
                )}
                <div className="row" style={{ marginTop: 'var(--space-1)' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      open(trip.id);
                      router.push('/play', 'root');
                    }}
                  >
                    {trip.id === current?.id ? 'Back to it' : 'Continue'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => {
                      if (confirming === trip.id) {
                        forget(trip.id);
                        setConfirming(null);
                      } else {
                        setConfirming(trip.id);
                      }
                    }}
                  >
                    {confirming === trip.id ? 'Tap again to forget' : 'Forget'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </main>
      </IonContent>
    </IonPage>
  );
}
