import { IonChip, IonInput, IonItem, IonLabel, IonList, IonListHeader } from '@ionic/react';
import { cardById } from '@game/cards';
import { formatClock, remaining } from '@game/clock';
import { isPaused, playerName, souvenirs, swap, type SwappableSuit } from '@game/trip';
import type { Card, SceneRound, Trip } from '@game/types';
import { SignCard } from '@app/components/SignCard';

interface SceneViewProps {
  readonly trip: Trip;
  readonly round: SceneRound;
  readonly now: number;
  readonly act: (step: (trip: Trip) => Trip) => void;
  readonly souvenir: string;
  readonly onSouvenir: (text: string) => void;
}

export function SceneView({ trip, round, now, act, souvenir, onSouvenir }: SceneViewProps) {
  const where = cardById(round.whereId);
  const who = cardById(round.whoId);
  const how = cardById(round.howId);
  const twist = cardById(round.twistId);
  const opener = playerName(trip, round.openerId);
  const partner = playerName(trip, round.partnerId);

  if (round.phase === 'brief') return <Brief trip={trip} round={round} act={act} where={where} who={who} how={how} />;

  if (round.phase === 'live') {
    const left = remaining(round.clock, now);
    const paused = isPaused(round);
    return (
      <>
        <div className="stage" aria-live="polite">
          <p className="stage-label">{paused ? 'Paused' : round.landingCalled ? `${opener} lands it next` : `${opener} and ${partner}`}</p>
          <p className="clock" role="timer" data-urgent={round.landingCalled && !paused}>
            {formatClock(left)}
          </p>
          {how?.cue && <p className="stage-cue">{how.cue}</p>}
        </div>
        {round.twistShown && twist && (
          <div className="twist-in">
            <SignCard card={twist} compact showTip={false} />
          </div>
        )}
        <details className="peek wrap" style={{ padding: '0 16px 16px' }}>
          <summary className="section-note" style={{ padding: 0, cursor: 'pointer' }}>
            Show the cards
          </summary>
          <div className="hand" style={{ padding: '12px 0 0' }}>
            {[where, how, who].filter((card) => card !== null).map((card) => (
              <SignCard key={card.id} card={card} compact showTip={false} />
            ))}
          </div>
        </details>
      </>
    );
  }

  const choices = [where, who, round.twistShown ? twist : null].filter((card) => card !== null);
  return (
    <>
      <div className="stage" style={{ minHeight: '34vh' }} aria-live="polite">
        <p className="landing">{opener}, last line.</p>
        <p className="landing-sub">Get the want or lose it, in one sentence. Then everyone: “Scene!”</p>
      </div>
      {!round.arrival && (
        <>
          <IonListHeader>
            <IonLabel>Keep a souvenir?</IonLabel>
          </IonListHeader>
          <div style={{ padding: '0 12px 4px' }}>
            {choices.map((card) => (
              <IonChip
                key={card.id}
                outline={souvenir !== card.title}
                {...(souvenir === card.title && { color: 'primary' })}
                onClick={() => {
                  onSouvenir(souvenir === card.title ? '' : card.title);
                }}
              >
                <IonLabel>{card.title}</IonLabel>
              </IonChip>
            ))}
          </div>
          <IonList inset>
            <IonItem>
              <IonInput
                aria-label="Souvenir"
                placeholder="Or name it: the pie-contest grandma"
                value={choices.some((card) => card.title === souvenir) ? '' : souvenir}
                maxlength={60}
                onIonInput={(event) => {
                  onSouvenir(event.detail.value ?? '');
                }}
              />
            </IonItem>
          </IonList>
          <p className="section-note">Souvenirs come back at the destination.</p>
        </>
      )}
    </>
  );
}

interface BriefProps {
  readonly trip: Trip;
  readonly round: SceneRound;
  readonly act: (step: (trip: Trip) => Trip) => void;
  readonly where: Card | null;
  readonly who: Card | null;
  readonly how: Card | null;
}

function Brief({ trip, round, act, where, who, how }: BriefProps) {
  const opener = playerName(trip, round.openerId);
  const partner = playerName(trip, round.partnerId);
  const onDeck = trip.players.filter((player) => player.id !== round.openerId && player.id !== round.partnerId);
  const kept = souvenirs(trip);
  const swapper = (suit: SwappableSuit) => () => {
    act((t) => swap(t, suit));
  };

  return (
    <>
      {round.arrival && (
        <p className="lede">
          {kept.length > 0
            ? `${opener} must bring back one souvenir: ${kept.map((s) => s.text).join(', ')}.`
            : `${opener}, bring back anything from today.`}
        </p>
      )}
      <div className="cast" aria-label={`${opener} opens, ${partner} partners`}>
        <div>
          <div className="cast-role">Opens</div>
          <div className="cast-name">{opener}</div>
        </div>
        <div className="cast-swap" aria-hidden="true">⇄</div>
        <div>
          <div className="cast-role">Partner</div>
          <div className="cast-name">{partner}</div>
        </div>
      </div>
      {onDeck.length > 0 && (
        <p className="on-deck">
          On deck: {onDeck.map((player) => player.name + (player.id === round.directorId ? ' (directing)' : '')).join(', ')}
        </p>
      )}
      {round.twistId && <p className="on-deck">A twist is coming.</p>}
      <div className="hand" key={`${round.whereId}${round.whoId}`}>
        {where && (
          <SignCard card={where} compact showTip={false} className="deal-in" {...(!round.arrival && { onSwap: swapper('where') })} />
        )}
        {how && <SignCard card={how} compact showTip={false} className="deal-in" onSwap={swapper('how')} />}
        {who && (
          <SignCard card={who} compact showTip={false} className="deal-in" label={`Who · ${opener}`} onSwap={swapper('who')} />
        )}
      </div>
    </>
  );
}
