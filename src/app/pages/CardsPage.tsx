import { IonContent, IonPage } from '@ionic/react';
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
      <IonContent className="page">
        <main className="page-inner" style={{ maxWidth: '64rem' }}>
          <h1 className="title">The deck</h1>
          <p className="muted">
            Every card in the game. The colour tells you its job, the same way road signs do.
          </p>
          <div className="chips" role="group" aria-label="Show cards from">
            {(['all', ...SUITS] as const).map((suit) => (
              <button
                key={suit}
                type="button"
                className="chip"
                aria-pressed={filter === suit}
                onClick={() => {
                  setFilter(suit);
                }}
              >
                {suit === 'all' ? 'All' : SUIT_LABEL[suit]} {suit === 'all' ? CARDS.length : CARDS.filter((c) => c.suit === suit).length}
              </button>
            ))}
          </div>
          <div className="deck-grid">
            {cards.map((card) => (
              <SignCard key={card.id} card={card} showTraits />
            ))}
          </div>
        </main>
      </IonContent>
    </IonPage>
  );
}
