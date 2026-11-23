import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { chevronBack, pause as pauseIcon, play as playIcon, volumeHigh } from 'ionicons/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cardById } from '@game/cards';
import { isRunning } from '@game/clock';
import { dealAgain, isSingleCard, newQuickPlay, QUICK_KINDS, type QuickKind, type QuickPlay } from '@game/quick';
import { canBank, DEFAULT_SETTINGS, isPaused, land, missingSuits, nextTurn, pause, resume, startRound, throwTwist, tick } from '@game/trip';
import type { Settings, Trip } from '@game/types';
import { PlayerFields } from '@app/components/PlayerFields';
import { SettingsFields } from '@app/components/SettingsFields';
import { SignCard } from '@app/components/SignCard';
import { chime, unlockAudio } from '@app/platform/chime';
import { useWakeLock } from '@app/platform/useWakeLock';
import { SceneView } from '@app/play/SceneView';
import { sceneScript, warmupScript } from '@app/play/script';
import { useAnnouncer } from '@app/play/useAnnouncer';
import { useNow } from '@app/play/useNow';
import { WarmupView } from '@app/play/WarmupView';
import { useTrips } from '@app/state/TripStore';

const KIND: Record<QuickKind, { readonly label: string; readonly note: string; readonly suit: string }> = {
  scene: { label: 'Scene', note: 'A place, a character and a rule, on the clock.', suit: 'scene' },
  warmup: { label: 'Warm-up', note: 'A quick group game to get everyone talking.', suit: 'warmup' },
  who: { label: 'Character', note: 'One Who card: someone who wants something.', suit: 'who' },
  where: { label: 'Place', note: 'One Where card to set a scene in.', suit: 'where' },
  how: { label: 'Rule', note: 'One How card to play any scene by.', suit: 'how' },
  twist: { label: 'Twist', note: 'One Twist to throw into whatever you’re doing.', suit: 'twist' },
};

/** Reads the clock and a random seed, so it belongs in an event handler, never in render. */
function startQuickPlay(kind: QuickKind, players: readonly string[], settings: Settings): QuickPlay {
  return newQuickPlay({ kind, players, settings, now: Date.now(), seed: Math.floor(Math.random() * 2 ** 31) });
}

const QUICK_DEFAULTS: Settings = { ...DEFAULT_SETTINGS, length: 'open', director: false };

/** Deal one thing and play it: a scene, a warm-up or a single card, with no trip around it and nothing saved. */
export function QuickPage() {
  const { trips } = useTrips();
  const last = trips[0];
  const [players, setPlayers] = useState<string[]>(() => (last ? last.players.map((p) => p.name) : ['', '']));
  const [settings, setSettings] = useState<Settings>(() => (last ? { ...last.settings, length: 'open', director: false } : QUICK_DEFAULTS));
  const [play, setPlay] = useState<QuickPlay | null>(null);

  if (play) {
    return (
      <QuickTable
        play={play}
        onChange={(update) => {
          setPlay((current) => current && update(current));
        }}
        onBack={() => {
          setPlay(null);
        }}
      />
    );
  }

  const begin = (kind: QuickKind) => {
    unlockAudio();
    setPlay(startQuickPlay(kind, players, settings));
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>Quick play</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen color="light">
        <IonHeader collapse="condense">
          <IonToolbar color="light">
            <IonTitle size="large">Quick play</IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="wrap">
          <p className="lede">Pick something to deal. No trip, no miles: play one, deal another, stop whenever.</p>
          <IonList inset>
            {QUICK_KINDS.map((kind) => (
              <IonItem
                key={kind}
                button
                onClick={() => {
                  begin(kind);
                }}
              >
                <span slot="start" className="kind-swatch" data-suit={KIND[kind].suit} aria-hidden="true" />
                <IonLabel>
                  {KIND[kind].label}
                  <IonNote className="ion-text-wrap" style={{ display: 'block', fontSize: 13 }}>
                    {KIND[kind].note}
                  </IonNote>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>

          <IonListHeader>
            <IonLabel>Players</IonLabel>
          </IonListHeader>
          <PlayerFields players={players} onChange={setPlayers} />
          <p className="section-note">For scenes and warm-ups, which call people by name. Blank seats play as “Player 1”.</p>

          <SettingsFields
            variant="quick"
            settings={settings}
            onChange={setSettings}
            players={[]}
            driverId={null}
            onDriverChange={() => undefined}
          />
          <div style={{ height: 24 }} />
        </div>
      </IonContent>
    </IonPage>
  );
}

interface QuickTableProps {
  readonly play: QuickPlay;
  readonly onChange: (update: (play: QuickPlay) => QuickPlay) => void;
  readonly onBack: () => void;
}

function QuickTable({ play, onChange, onBack }: QuickTableProps) {
  const { trip, card, kind } = play;
  const round = trip.round;
  const running = round?.phase === 'live' && isRunning(round.clock);
  const now = useNow(running);
  const content = useRef<HTMLIonContentElement>(null);
  const { say, announce, stop, sayNow } = useAnnouncer(trip);

  useWakeLock(true);

  const act = useCallback(
    (step: (trip: Trip) => Trip) => {
      onChange((current) => ({ ...current, trip: step(current.trip) }));
    },
    [onChange],
  );
  const deal = useCallback(() => {
    stop();
    onChange((current) => dealAgain(current, Date.now()));
  }, [onChange, stop]);

  // The clock moves the round on: the twist at 60%, the landing chime, the last line.
  useEffect(() => {
    if (!running) return;
    const result = tick(trip, now);
    if (result.trip === trip) return;
    onChange((current) => (current.trip === trip ? { ...current, trip: result.trip } : current));
    announce(result.events, result.trip);
  }, [now, running, trip, onChange, announce]);

  // Read each new hand or card aloud once, and bring the top of the page back into view.
  const handKey =
    round?.phase === 'brief'
      ? round.kind === 'scene'
        ? `${round.whereId}|${round.whoId}|${round.howId ?? ''}`
        : `${round.cardId}|${round.pass}`
      : (card?.id ?? '');
  const viewKey = `${round?.kind ?? kind}|${round?.phase ?? ''}|${handKey}`;
  useEffect(() => {
    void content.current?.scrollToTop(200);
  }, [viewKey]);
  useEffect(() => {
    if (!handKey) return;
    if (round?.kind === 'scene') say(sceneScript(trip, round));
    else if (round?.kind === 'warmup') {
      if (round.pass === 0) say(warmupScript(round));
    } else if (card) say(`${card.title}. ${card.prompt}`);
    // Only a new hand should trigger reading, not every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handKey]);

  let primary: { label: string; run: () => void } | null = null;
  if (isSingleCard(kind)) {
    primary = { label: 'Draw another', run: deal };
  } else if (round?.phase === 'brief') {
    const label = round.kind === 'warmup' ? (round.pass > 0 ? 'Go again' : 'Start the warm-up') : 'Start the scene';
    primary = {
      label,
      run: () => {
        stop();
        chime('start');
        act((t) => startRound(t, Date.now()));
      },
    };
  } else if (round?.kind === 'scene' && round.phase === 'live') {
    primary = {
      label: 'Land it',
      run: () => {
        chime('time-up');
        act((t) => land(t, Date.now()));
      },
    };
  } else if (round && canBank(round)) {
    primary = { label: round.kind === 'scene' ? 'Next scene' : 'Next warm-up', run: deal };
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
      primaryRef.current.run();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const missing = missingSuits(trip).filter((suit) => (kind === 'scene' ? suit !== 'warmup' : suit === kind));
  const paused = round ? isPaused(round) : false;
  const twistReady = round?.kind === 'scene' && round.phase === 'live' && round.twistId !== null && !round.twistShown;
  const cues = round?.kind === 'warmup' ? cardById(round.cardId)?.warmup?.turnCues : undefined;
  const nothingDealt = isSingleCard(kind) ? !card : !round;

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              onClick={() => {
                stop();
                onBack();
              }}
            >
              <IonIcon slot="start" icon={chevronBack} />
              Quick play
            </IonButton>
          </IonButtons>
          <IonTitle>{KIND[kind].label}</IonTitle>
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
          {nothingDealt && (
            <p className="lede">
              {missing.length > 0 ? `No ${missing.join(' or ')} cards fit these settings.` : 'Nothing fits these settings.'} Go
              back and turn a filter off.
            </p>
          )}
          {card && (
            <div className="hand" key={card.id}>
              <SignCard card={card} className="deal-in" />
            </div>
          )}
          {round?.kind === 'scene' && <SceneView trip={trip} round={round} now={now} act={act} />}
          {round?.kind === 'warmup' && <WarmupView trip={trip} round={round} now={now} />}
        </div>
      </IonContent>

      <IonFooter className="dock" translucent>
        <IonToolbar>
          <div className="wrap" style={{ display: 'grid', gap: 8 }}>
            {round?.phase === 'live' && (
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
                {round.kind === 'warmup' && cues && (
                  <IonButton
                    fill="outline"
                    expand="block"
                    className="big"
                    onClick={() => {
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
              <IonButton expand="block" className="big" onClick={primary.run}>
                {primary.label}
              </IonButton>
            )}
            {(round?.phase === 'brief' || card) && (
              <div className="button-row">
                {round?.phase === 'brief' && (
                  <IonButton fill="clear" onClick={deal}>
                    {round.kind === 'scene' ? 'New hand' : 'Another warm-up'}
                  </IonButton>
                )}
                <IonButton
                  fill="clear"
                  onClick={() => {
                    unlockAudio();
                    if (round?.kind === 'scene') sayNow(sceneScript(trip, round));
                    else if (round?.kind === 'warmup') sayNow(warmupScript(round));
                    else if (card) sayNow(`${card.title}. ${card.prompt}`);
                  }}
                >
                  <IonIcon slot="start" icon={volumeHigh} />
                  Read aloud
                </IonButton>
              </div>
            )}
          </div>
        </IonToolbar>
      </IonFooter>
    </IonPage>
  );
}
