import { IonContent, IonHeader, IonLabel, IonPage, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/react';
import { useMemo, useState } from 'react';
import { CARDS } from '@game/cards';
import { SUITS, type Suit } from '@game/types';
import { SUIT_LABEL, SignCard } from '@app/components/SignCard';

type Filter = Suit | 'all';

export function CardsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const cards = useMemo(() => CARDS.filter((card) => filter === 'all' || card.suit === filter), [filter]);

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Cards</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            scrollable
            value={filter}
            onIonChange={(event) => {
              setFilter((event.detail.value as Filter | undefined) ?? 'all');
            }}
          >
            {(['all', ...SUITS] as const).map((suit) => (
              <IonSegmentButton key={suit} value={suit}>
                <IonLabel>{suit === 'all' ? 'All' : SUIT_LABEL[suit]}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen color="light">
        <p className="section-note" style={{ paddingTop: 12 }}>
          {cards.length} {cards.length === 1 ? 'card' : 'cards'}. The color tells you a card’s job, the way road signs
          do.
        </p>
        <div className="deck-grid">
          {cards.map((card) => (
            <SignCard key={card.id} card={card} compact showMarks />
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
}
