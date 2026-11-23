import { useCallback, useEffect, useMemo, useState } from 'react';
import { cardById } from '@game/cards';
import { formatClock, isRunning, remaining } from '@game/clock';
import {
  bank,
  canBank,
  isPaused,
  land,
  lineCue,
  missingSuits,
  nextLine,
  pause,
  renamePlayer,
  ruleReminder,
  resume,
  scrap,
  speakerIndex,
  startRound,
  startWarmup,
  swap,
  tick,
  updateSettings,
  type SwappableSuit,
  type TripEvent,
} from '@game/trip';
import type { SceneRound, Trip, WarmupRound } from '@game/types';
import { MilePost } from '@app/components/MilePost';
import { SettingsFields } from '@app/components/SettingsFields';
import { SignCard } from '@app/components/SignCard';
import { chime, isAudioUnlocked, unlockAudio } from '@app/platform/chime';
import { createBrowserVoice } from '@app/platform/speech';
import { useWakeLock } from '@app/platform/useWakeLock';
import { useTrips } from '@app/state/TripStore';
import { sceneScript, warmupScript } from './script';

const voice = createBrowserVoice();

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 200);
    return () => {
      window.clearInterval(id);
    };
  }, [active]);
  return now;
}

export function Road({ trip, onNewView }: { readonly trip: Trip; readonly onNewView: () => void }) {
  const { update, close } = useTrips();
  const round = trip.round;
  const running = round?.phase === 'live' && isRunning(round.clock);
  const now = useNow(running);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [banked, setBanked] = useState(false);

  useWakeLock(true);

  const say = useCallback(
    (text: string) => {
      if (trip.settings.voice && isAudioUnlocked()) voice.say(text);
    },
    [trip.settings.voice],
  );

  const announce = useCallback(
    (events: readonly TripEvent[], next: Trip) => {
      for (const event of events) {
        if (event === 'twist' && next.round?.kind === 'scene') {
          chime('twist');
          const twist = cardById(next.round.twistId);
          if (twist) say(`Twist. ${twist.prompt}`);
        }
        if (event === 'time-up') {
          chime('time-up');
          if ('vibrate' in navigator) navigator.vibrate(200);
          say('Time. One last line lands it.');
        }
        if (event === 'half-life-pass') {
          chime('time-up');
          say('Again. Same story, half the time.');
        }
        if (event === 'warmup-done') chime('time-up');
      }
    },
    [say],
  );

  // Let the clock move the round on: twists at halfway, the button at zero.
  useEffect(() => {
    if (!running) return;
    const result = tick(trip, now);
    if (result.trip === trip) return;
    update((current) => (current === trip ? result.trip : current));
    announce(result.events, result.trip);
  }, [now, running, trip, update, announce]);

  // Read each new hand aloud once, if a tap has already unlocked audio.
  const handKey =
    round?.phase === 'brief'
      ? round.kind === 'scene'
        ? `${round.whereId}|${round.whoId}|${round.howId ?? ''}`
        : `${round.cardId}|${round.pass}`
      : '';
  useEffect(() => {
    if (!handKey || !trip.round) return;
    if (trip.round.kind === 'scene') say(sceneScript(trip, trip.round));
    else if (trip.round.pass === 0) say(warmupScript(trip.round));
    // Only a new hand should trigger reading, not every trip change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handKey]);

  // Each new step of a round starts at the top, so the timer or the hand is what you see.
  const viewKey = round ? `${round.kind}|${round.phase}|${handKey}` : '';
  useEffect(() => {
    if (viewKey) onNewView();
  }, [viewKey, onNewView]);

  useEffect(() => () => {
    voice.stop();
  }, []);

  const act = useCallback(
    (step: (trip: Trip) => Trip) => {
      update(step);
    },
    [update],
  );

  const primary = useMemo<(() => void) | null>(() => {
    if (!round) return null;
    if (round.phase === 'brief') {
      return () => {
        voice.stop();
        chime('start');
        setBanked(false);
        act((t) => startRound(t, Date.now()));
      };
    }
    if (round.kind === 'scene' && round.phase === 'live') {
      return () => {
        act((t) => land(t, Date.now()));
        chime('time-up');
        say('One last line lands it.');
      };
    }
    if (canBank(round)) {
      return () => {
        chime('mile');
        act((t) => bank(t, Date.now(), note));
        setNote('');
        setBanked(true);
      };
    }
    return null;
  }, [round, act, note, say]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (event.code !== 'Space' || !primary) return;
      event.preventDefault();
      unlockAudio();
      primary();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [primary]);

  const missing = missingSuits(trip);

  return (
    <div
      className="stack"
      style={{ gap: 'var(--space-3)' }}
      onPointerDown={() => {
        unlockAudio();
      }}
    >
      <header className="trip-bar">
        <div>
          <p className="trip-name">{trip.name}</p>
          <MilePost miles={trip.miles} />
        </div>
        <button
          type="button"
          className="btn"
          aria-expanded={settingsOpen}
          onClick={() => {
            setSettingsOpen((open) => !open);
          }}
        >
          {settingsOpen ? 'Done' : 'Settings'}
        </button>
      </header>

      {settingsOpen && (
        <section className="stack" style={{ gap: 'var(--space-4)' }} aria-label="Trip settings">
          <SettingsFields
            settings={trip.settings}
            onChange={(settings) => {
              act((t) => updateSettings(t, settings));
            }}
          />
          <fieldset>
            <legend>Players</legend>
            {trip.players.map((player, index) => (
              <input
                key={player.id}
                className="field"
                defaultValue={player.name}
                maxLength={24}
                aria-label={`Player ${index + 1} name`}
                onBlur={(event) => {
                  act((t) => renamePlayer(t, player.id, event.target.value));
                }}
              />
            ))}
          </fieldset>
          <button type="button" className="btn btn-block" onClick={close}>
            End this trip
          </button>
        </section>
      )}

      {!settingsOpen && missing.length > 0 && (
        <p className="notice">
          No {missing.join(' or ')} cards fit these settings. Turn off a filter in Settings to keep playing.
        </p>
      )}

      {!settingsOpen && banked && round?.phase === 'brief' && (
        <p className="notice" role="status">
          Mile banked. That’s {trip.miles} together.
        </p>
      )}

      {!settingsOpen && round?.kind === 'scene' && (
        <Scene trip={trip} round={round} now={now} act={act} />
      )}
      {!settingsOpen && round?.kind === 'warmup' && (
        <Warmup trip={trip} round={round} now={now} act={act} />
      )}

      {!settingsOpen && round && (
        <div className="dock">
          {round.phase === 'button' && (
            <label className="label small muted">
              A line for the journal, if you want
              <input
                className="field"
                value={note}
                maxLength={140}
                placeholder="Dad was the GPS"
                onChange={(event) => {
                  setNote(event.target.value);
                }}
              />
            </label>
          )}
          {primary && (
            <button type="button" className="btn btn-primary btn-big btn-block" onClick={primary}>
              {primaryLabel(round)}
            </button>
          )}
          <SecondaryActions trip={trip} act={act} />
        </div>
      )}
    </div>
  );
}

function primaryLabel(round: SceneRound | WarmupRound): string {
  if (round.phase === 'brief') {
    if (round.kind === 'warmup') return round.pass > 0 ? 'Go again' : 'Start the warm-up';
    return 'Start the scene';
  }
  if (round.kind === 'scene') return round.phase === 'live' ? 'Land it' : 'Bank the mile';
  return 'Bank the mile';
}

interface PartProps<R> {
  readonly trip: Trip;
  readonly round: R;
  readonly now: number;
  readonly act: (step: (trip: Trip) => Trip) => void;
}

function Scene({ trip, round, now, act }: PartProps<SceneRound>) {
  const where = cardById(round.whereId);
  const who = cardById(round.whoId);
  const how = cardById(round.howId);
  const twist = cardById(round.twistId);
  const opener = trip.players[trip.opener]?.name ?? 'Someone';
  const hand = [where, who, how].filter((card) => card !== null);
  const left = remaining(round.clock, now);
  const paused = isPaused(round);

  if (round.phase === 'brief') {
    return (
      <section className="stack" aria-label="This scene">
        <p className="opener">{opener} opens.</p>
        <div className="stack" key={`${round.whereId}${round.whoId}`}>
          {hand.map((card) => (
            <SignCard
              key={card.id}
              card={card}
              compact
              showTip={false}
              className="deal-in"
              action={
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Swap the ${card.suit} card`}
                  title="Swap this card"
                  onClick={() => {
                    act((t) => swap(t, card.suit as SwappableSuit));
                  }}
                >
                  ↻
                </button>
              }
            />
          ))}
        </div>
      </section>
    );
  }

  const speaker = trip.players[speakerIndex(trip)]?.name;
  const cue = trip.settings.callTurns ? lineCue(how?.cue, round.line) : ruleReminder(how?.cue);

  return (
    <section className="stack" aria-label="Scene in progress">
      <div className="stage" aria-live="polite">
        {round.phase === 'live' ? (
          <>
            <p className="stage-state">{paused ? 'Paused' : `${opener} opened`}</p>
            <p className="timer" data-urgent={left <= 10_000 && !paused} role="timer">
              {formatClock(left)}
            </p>
            {trip.settings.callTurns && speaker && <p className="speaker">{speaker}</p>}
            {cue && <p className="cue">{cue}</p>}
          </>
        ) : (
          <>
            <p className="button-call">Land it.</p>
            <p className="muted">Whoever has the turn says one last line that ends the scene.</p>
          </>
        )}
      </div>

      {round.twistShown && twist && <SignCard card={twist} compact showTip={false} />}

      {round.phase === 'live' && (
        <div className="row">
          <button
            type="button"
            className="btn"
            onClick={() => {
              act((t) => (paused ? resume(t, Date.now()) : pause(t, Date.now())));
            }}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          {trip.settings.callTurns && (
            <button
              type="button"
              className="btn btn-light"
              onClick={() => {
                act(nextLine);
              }}
            >
              Next: {trip.players[(speakerIndex(trip) + 1) % trip.players.length]?.name}
            </button>
          )}
        </div>
      )}

      <details className="peek">
        <summary>The cards</summary>
        <div className="stack">
          {hand.map((card) => (
            <SignCard key={card.id} card={card} compact />
          ))}
        </div>
      </details>
    </section>
  );
}

function Warmup({ trip, round, now, act }: PartProps<WarmupRound>) {
  const card = cardById(round.cardId);
  if (!card?.warmup) return null;
  const left = remaining(round.clock, now);
  const paused = isPaused(round);
  const cues = card.warmup.turnCues;
  const cue = cues ? cues[round.turn % cues.length] : null;
  const passLabel = card.warmup.halfLife ? ['Full story', 'Half the time', 'Half again'][round.pass] : null;

  return (
    <section className="stack" aria-label="Warm-up">
      <SignCard card={card} />
      {round.seed && (
        <p className="subtitle">
          <span className="muted">Start with: </span>
          {round.seed}
        </p>
      )}
      {round.phase !== 'brief' || round.pass > 0 ? (
        <div className="stage" aria-live="polite">
          {passLabel && <p className="stage-state">{passLabel}</p>}
          {round.phase === 'done' ? (
            <p className="button-call">That’s it.</p>
          ) : (
            <p className="timer" data-urgent={left <= 10_000 && !paused} role="timer">
              {formatClock(left)}
            </p>
          )}
          {round.phase === 'live' && cue && (
            <>
              <p className="speaker">{trip.players[speakerIndex(trip)]?.name}</p>
              <p className="cue">{cue}</p>
            </>
          )}
        </div>
      ) : null}
      {round.phase === 'live' && (
        <div className="row">
          <button
            type="button"
            className="btn"
            onClick={() => {
              act((t) => (paused ? resume(t, Date.now()) : pause(t, Date.now())));
            }}
          >
            {paused ? 'Resume' : 'Pause'}
          </button>
          {cues && (
            <button
              type="button"
              className="btn btn-light"
              onClick={() => {
                act(nextLine);
              }}
            >
              Next turn
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function SecondaryActions({ trip, act }: { readonly trip: Trip; readonly act: (step: (trip: Trip) => Trip) => void }) {
  const round = trip.round;
  if (!round) return null;
  const isBrief = round.phase === 'brief';
  return (
    <div className="row">
      {round.kind === 'scene' && isBrief && (
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => {
            act((t) => startWarmup(t));
          }}
        >
          Warm-up instead
        </button>
      )}
      {round.kind === 'warmup' && (
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => {
            act((t) => (isBrief && round.pass === 0 ? startWarmup(t) : scrap(t)));
          }}
        >
          {isBrief && round.pass === 0 ? 'Different warm-up' : 'Back to scenes'}
        </button>
      )}
      {round.kind === 'scene' && !isBrief && (
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => {
            voice.stop();
            act(scrap);
          }}
        >
          Scrap it, no mile
        </button>
      )}
      {round.kind === 'scene' && isBrief && (
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => {
            voice.say(sceneScript(trip, round));
          }}
        >
          Read it again
        </button>
      )}
    </div>
  );
}
