import type { ReactNode } from 'react';
import type { Card, Suit } from '@game/types';

export const SUIT_LABEL: Record<Suit, string> = {
  where: 'Where',
  who: 'Who',
  how: 'How',
  twist: 'Twist',
  warmup: 'Warm-up',
};

function traits(card: Card): string[] {
  const list: string[] = [];
  if (card.volume === 'quiet') list.push('Quiet');
  if (card.volume === 'loud') list.push('Loud');
  if (!card.handsFree) list.push('Needs hands');
  if (!card.seated) list.push('Up and moving');
  if (card.level === 'stretch') list.push('Stretch');
  if (card.minPlayers > 2) list.push(`${card.minPlayers}+ players`);
  return list;
}

interface SignCardProps {
  readonly card: Card;
  readonly compact?: boolean;
  readonly showTip?: boolean;
  readonly showTraits?: boolean;
  readonly action?: ReactNode;
  readonly className?: string;
}

/** A card drawn as a road sign: suit colour, inset border stripe, short bold title. */
export function SignCard({ card, compact = false, showTip = true, showTraits = false, action, className }: SignCardProps) {
  const marks = showTraits ? traits(card) : [];
  return (
    <article
      className={['sign', compact ? 'sign-compact' : '', className ?? ''].join(' ').trim()}
      data-suit={card.suit}
      aria-label={`${SUIT_LABEL[card.suit]}: ${card.title}`}
    >
      <div className="sign-inner">
        <div className="sign-head">
          <span className="sign-suit">{SUIT_LABEL[card.suit]}</span>
          {action}
        </div>
        <h3 className="sign-title">{card.title}</h3>
        <p className="sign-prompt">{card.prompt}</p>
        {showTip && card.tip && <p className="sign-tip">{card.tip}</p>}
        {marks.length > 0 && (
          <p className="sign-foot">
            {marks.map((mark) => (
              <span key={mark}>{mark}</span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}
