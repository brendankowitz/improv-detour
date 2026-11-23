import { IonButton, IonIcon, IonInput, IonItem, IonLabel, IonList } from '@ionic/react';
import { addCircle, removeCircle } from 'ionicons/icons';
import { MAX_PLAYERS, MIN_PLAYERS } from '@game/trip';

interface PlayerFieldsProps {
  readonly players: readonly string[];
  readonly onChange: (players: string[]) => void;
  /** Called with the removed seat's index, after `onChange`. */
  readonly onRemove?: (index: number) => void;
}

/** One row per seat, in seating order, with add and remove. */
export function PlayerFields({ players, onChange, onRemove }: PlayerFieldsProps) {
  return (
    <IonList inset>
      {players.map((player, index) => (
        <IonItem key={index}>
          {players.length > MIN_PLAYERS && (
            <IonButton
              slot="start"
              fill="clear"
              color="danger"
              aria-label={`Remove player ${index + 1}`}
              onClick={() => {
                onChange(players.filter((_, i) => i !== index));
                onRemove?.(index);
              }}
            >
              <IonIcon slot="icon-only" icon={removeCircle} />
            </IonButton>
          )}
          <IonInput
            aria-label={`Player ${index + 1}`}
            placeholder={index === 0 ? 'Name' : 'Next seat'}
            value={player}
            maxlength={24}
            autocapitalize="words"
            onIonInput={(event) => {
              const next = [...players];
              next[index] = event.detail.value ?? '';
              onChange(next);
            }}
          />
        </IonItem>
      ))}
      {players.length < MAX_PLAYERS && (
        <IonItem
          button
          detail={false}
          onClick={() => {
            onChange([...players, '']);
          }}
        >
          <IonIcon slot="start" icon={addCircle} color="success" />
          <IonLabel color="primary">Add a player</IonLabel>
        </IonItem>
      )}
    </IonList>
  );
}
