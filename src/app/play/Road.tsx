import { IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { ellipsisHorizontalCircleOutline, pause as pauseIcon, play as playIcon, volumeHigh } from 'ionicons/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cardById } from '@game/cards';
import { isRunning } from '@game/clock';
import {
  bank,
  canBank,
  canWarmUpInstead,
  isPaused,
  land,
  missingSuits,
  nextTurn,
  pause,
  resume,
  startRound,
  startWarmup,
  stopNumber,
  throwTwist,
  tick,
  totalStops,
} from '@game/trip';
import type { Round, Trip } from '@game/types';
import { chime, unlockAudio } from '@app/platform/chime';
import { useWakeLock } from '@app/platform/useWakeLock';
import { useTrips } from '@app/state/TripStore';
import { SceneView } from './SceneView';
import { TripSettingsSheet } from './TripSettingsSheet';
import { WarmupView } from './WarmupView';
import { destinationScript, sceneScript, warmupScript } from './script';
import { useAnnouncer } from './useAnnouncer';

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

function progress(trip: Trip): string {
  const total = totalStops(trip);
  const destination = cardById(trip.destinationId)?.title;
  const stop = total ? `Stop ${Math.min(stopNumber(trip), total)} of ${total}` : `Stop ${stopNumber(trip)}`;
  return destination ? `${stop} · ${destination}` : stop;
}

function primaryLabel(round: Round): string {
  if (round.kind === 'warmup') {
    if (round.phase === 'brief') return round.pass > 0 ? 'Go again' : 'Start the warm-up';
    return 'Bank the mile';
  }
  if (round.phase === 'brief') return round.arrival ? 'Start the arrival' : 'Start the scene';
  if (round.phase === 'live') return 'Land it';
  return round.arrival ? 'Finish the trip' : 'Bank the mile';
}

export function Road({ trip }: { readonly trip: Trip }) {
  const { update, close } = useTrips();
  const round = trip.round;
  const running = round?.phase === 'live' && isRunning(round.clock);
  const now = useNow(running);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [souvenir, setSouvenir] = useState('');
  const content = useRef<HTMLIonContentElement>(null);
  const { say, announce, stop, sayNow } = useAnnouncer(trip);

  useWakeLock(true);

  const act = useCallback(
    (step: (trip: Trip) => Trip) => {
      update(step);
    },
    [update],
  );

  // Let the clock move the round on: the twist at 60%, the landing chime, the last line.
  useEffect(() => {
    if (!running) return;
    const result = tick(trip, now);
    if (result.trip === trip) return;
    update((current) => (current === trip ? result.trip : current));
    announce(result.events, result.trip);
  }, [now, running, trip, update, announce]);

  // Read each new hand aloud once, and bring the top of the page back into view.
  const handKey =
    round?.phase === 'brief'
      ? round.kind === 'scene'
        ? `${round.whereId}|${round.whoId}|${round.howId ?? ''}`
        : `${round.cardId}|${round.pass}`
      : '';
  const viewKey = round ? `${round.kind}|${round.phase}|${handKey}` : '';
  useEffect(() => {
    void content.current?.scrollToTop(200);
  }, [viewKey]);
  useEffect(() => {
    const current = trip.round;
    if (!handKey || !current) return;
    if (current.kind === 'scene') say(sceneScript(trip, current));
    else if (current.pass === 0) {
      say(trip.log.length === 0 ? `${destinationScript(trip)} ${warmupScript(current)}` : warmupScript(current));
    }
    // Only a new hand should trigger reading, not every trip change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handKey]);

  let primary: (() => void) | null = null;
  if (round?.phase === 'brief') {
    primary = () => {
      stop();
      chime('start');
      act((t) => startRound(t, Date.now()));
    };
  } else if (round?.kind === 'scene' && round.phase === 'live') {
    primary = () => {
      chime('time-up');
      act((t) => land(t, Date.now()));
    };
  } else if (canBank(round)) {
    primary = () => {
      chime('mile');
      act((t) => bank(t, Date.now(), souvenir));
      setSouvenir('');
    };
  }

  const primaryRef = useRef(primary);
  useEffect(() => {
    primaryRef.current = primary;
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, ion-input, ion-modal')) return;
      if (event.code !== 'Space' || !primaryRef.current) return;
      event.preventDefault();
      unlockAudio();
      primaryRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const missing = missingSuits(trip);
  const paused = round ? isPaused(round) : false;
  const twistReady = round?.kind === 'scene' && round.phase === 'live' && round.twistId !== null && !round.twistShown;

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>
            <div style={{ lineHeight: 1.15 }}>{trip.name}</div>
            <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.6 }}>{progress(trip)}</div>
          </IonTitle>
          <IonButtons slot="end">
            <IonButton
              aria-label="Trip settings"
              onClick={() => {
                setSettingsOpen(true);
              }}
            >
              <IonIcon slot="icon-only" icon={ellipsisHorizontalCircleOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent
        ref={content}
        fullscreen
        color="light"
        onPointerDown={() => {
          unlockAudio();
        }}
      >
        <div className="wrap" style={{ paddingTop: 8 }}>
          {missing.length > 0 && (
            <p className="lede">No {missing.join(' or ')} cards fit these settings. Turn a filter off in trip settings.</p>
          )}
          {round?.kind === 'scene' && (
            <SceneView trip={trip} round={round} now={now} act={act} souvenir={souvenir} onSouvenir={setSouvenir} />
          )}
          {round?.kind === 'warmup' && <WarmupView trip={trip} round={round} now={now} />}
        </div>
      </IonContent>

      {round && (
        <IonFooter className="dock" translucent>
          <IonToolbar>
            <div className="wrap" style={{ display: 'grid', gap: 8 }}>
              {round.phase === 'live' && (
                <div className="button-row">
                  <IonButton
                    fill="outline"
                    expand="block"
                    className="big"
                    onClick={() => {
                      act((t) => (paused ? resume(t, Date.now()) : pause(t, Date.now())));
                    }}
                  >
                    <IonIcon slot="start" icon={paused ? playIcon : pauseIcon} />
                    {paused ? 'Resume' : 'Pause'}
                  </IonButton>
                  {twistReady && (
                    <IonButton
                      fill="outline"
                      expand="block"
                      className="big"
                      onClick={() => {
                        act(throwTwist);
                        announce(['twist'], { ...trip, round: { ...round, twistShown: true } });
                      }}
                    >
                      Throw the twist
                    </IonButton>
                  )}
                  {round.kind === 'warmup' && cardById(round.cardId)?.warmup?.turnCues && (
                    <IonButton
                      fill="outline"
                      expand="block"
                      className="big"
                      onClick={() => {
                        const cues = cardById(round.cardId)?.warmup?.turnCues ?? [];
                        const next = round.turn + 1;
                        act(nextTurn);
                        say(`${trip.players[next % trip.players.length]?.name ?? ''}: ${cues[next % cues.length] ?? ''}`);
                      }}
                    >
                      Next turn
                    </IonButton>
                  )}
                </div>
              )}
              {primary && (
                <IonButton expand="block" className="big" onClick={primary}>
                  {primaryLabel(round)}
                </IonButton>
              )}
              {round.phase === 'brief' && (
                <div className="button-row">
                  {canWarmUpInstead(trip) && (
                    <IonButton
                      fill="clear"
                      onClick={() => {
                        act((t) => startWarmup(t));
                      }}
                    >
                      Warm-up
                    </IonButton>
                  )}
                  {round.kind === 'warmup' && round.pass === 0 && (
                    <IonButton
                      fill="clear"
                      onClick={() => {
                        act((t) => startWarmup(t));
                      }}
                    >
                      Another warm-up
                    </IonButton>
                  )}
                  {round.kind === 'scene' && (
                    <IonButton
                      fill="clear"
                      onClick={() => {
                        unlockAudio();
                        sayNow(sceneScript(trip, round));
                      }}
                    >
                      <IonIcon slot="start" icon={volumeHigh} />
                      Read again
                    </IonButton>
                  )}
                </div>
              )}
            </div>
          </IonToolbar>
        </IonFooter>
      )}

      <TripSettingsSheet
        trip={trip}
        isOpen={settingsOpen}
        act={act}
        onClose={() => {
          setSettingsOpen(false);
        }}
        onEnd={() => {
          setSettingsOpen(false);
          close();
        }}
      />
    </IonPage>
  );
}
