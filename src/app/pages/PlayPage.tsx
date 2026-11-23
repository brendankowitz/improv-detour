import { IonContent, IonPage } from '@ionic/react';
import { useCallback, useRef } from 'react';
import { Road } from '@app/play/Road';
import { Setup } from '@app/play/Setup';
import { useTrips } from '@app/state/TripStore';

export function PlayPage() {
  const { current, saveError } = useTrips();
  const content = useRef<HTMLIonContentElement>(null);
  const toTop = useCallback(() => {
    void content.current?.scrollToTop(150);
  }, []);
  return (
    <IonPage>
      <IonContent className="page" ref={content}>
        <main className="page-inner">
          {saveError && (
            <p className="notice" role="alert">
              This browser isn’t saving trips (private mode or storage is full). You can play, but the trip won’t be
              kept.
            </p>
          )}
          {current ? <Road key={current.id} trip={current} onNewView={toTop} /> : <Setup />}
        </main>
      </IonContent>
    </IonPage>
  );
}
