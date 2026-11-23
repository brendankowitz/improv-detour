import { cardById } from '@game/cards';
import { formatClock, remaining } from '@game/clock';
import { isPaused, turnPlayerIndex } from '@game/trip';
import type { Trip, WarmupRound } from '@game/types';
import { SignCard } from '@app/components/SignCard';

const PASS_LABEL = ['', 'Same story, half the time', 'Half again'];

interface WarmupViewProps {
  readonly trip: Trip;
  readonly round: WarmupRound;
  readonly now: number;
  /** The trip's opening stop, which gets a line of introduction. */
  readonly firstStop?: boolean;
}

export function WarmupView({ trip, round, now, firstStop = false }: WarmupViewProps) {
  const card = cardById(round.cardId);
  if (!card?.warmup) return null;
  const cues = card.warmup.turnCues;
  const cue = cues ? cues[round.turn % cues.length] : null;
  const started = round.phase !== 'brief' || round.pass > 0;

  return (
    <>
      {firstStop && <p className="lede">First stop: a warm-up to get everyone talking.</p>}
      <div className="hand">
        <SignCard card={card} className="deal-in" />
      </div>
      {round.seed && (
        <p className="lede">
          Start with: <strong>{round.seed}</strong>
        </p>
      )}
      {started && (
        <div className="stage" style={{ minHeight: '30vh' }} aria-live="polite">
          {round.pass > 0 && <p className="stage-label">{PASS_LABEL[round.pass]}</p>}
          {round.phase === 'done' ? (
            <p className="landing">That’s it.</p>
          ) : (
            <p className="clock" role="timer" data-urgent={!isPaused(round) && remaining(round.clock, now) <= 10_000}>
              {formatClock(remaining(round.clock, now))}
            </p>
          )}
          {round.phase === 'live' && cue && (
            <>
              <p className="stage-names">{trip.players[turnPlayerIndex(trip)]?.name}</p>
              <p className="stage-cue">{cue}</p>
            </>
          )}
        </div>
      )}
    </>
  );
}
