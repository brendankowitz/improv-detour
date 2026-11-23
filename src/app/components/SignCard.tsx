import { IonIcon } from '@ionic/react';
import { refreshOutline } from 'ionicons/icons';
import type { Card, Suit } from '@game/types';

export const SUIT_LABEL: Record<Suit, string> = {
  where: 'Where',
  who: 'Who',
  how: 'How',
  twist: 'Twist',
  warmup: 'Warm-up',
  destination: 'Destination',
};

function marks(card: Card): string[] {
  const list: string[] = [];
  if (!card.voiceOnly) list.push('Needs eyes');
  if (!card.quiet) list.push('Loud');
  if (card.physical) list.push('Moving');
  if (card.level === 'stretch') list.push('Stretch');
  return list;
}

interface SignCardProps {
  readonly card: Card;
  readonly compact?: boolean;
  readonly showTip?: boolean;
  readonly showMarks?: boolean;
  /** Replaces the suit label, e.g. "Who · Ana". */
  readonly label?: string;
  readonly onSwap?: () => void;
  readonly className?: string;
}

/** A card drawn as a road sign: suit color, inset border stripe, highway lettering. */
export function SignCard({ card, compact = false, showTip = true, showMarks = false, label, onSwap, className }: SignCardProps) {
  const traits = showMarks ? marks(card) : [];
  return (
    <article
      className={['sign', compact ? 'sign-compact' : '', className ?? ''].join(' ').trim()}
      data-suit={card.suit}
      aria-label={`${SUIT_LABEL[card.suit]}: ${card.title}`}
    >
      <div className="sign-inner">
        <div className="sign-head">
          <span className="sign-suit">{label ?? SUIT_LABEL[card.suit]}</span>
          {onSwap && (
            <button type="button" className="sign-swap" aria-label={`Swap the ${card.suit} card`} onClick={onSwap}>
              <IonIcon icon={refreshOutline} aria-hidden="true" />
            </button>
          )}
        </div>
        <h3 className="sign-title">{card.title}</h3>
        <p className="sign-prompt">{card.prompt}</p>
        {showTip && card.tip && <p className="sign-tip">{card.tip}</p>}
        {traits.length > 0 && (
          <p className="sign-foot">
            {traits.map((trait) => (
              <span key={trait} className="sign-mark">
                {trait}
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}
