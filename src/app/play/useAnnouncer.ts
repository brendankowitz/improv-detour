import { useCallback, useEffect } from 'react';
import { cardById } from '@game/cards';
import { playerName, type TripEvent } from '@game/trip';
import type { Trip } from '@game/types';
import { chime, isAudioUnlocked } from '@app/platform/chime';
import { createBrowserVoice } from '@app/platform/speech';

const voice = createBrowserVoice();
/** The voice waits this long after a chime so it never talks over the player mid-line. */
const AFTER_CHIME_MS = 900;

function vibrate(ms: number) {
  if ('vibrate' in navigator) navigator.vibrate(ms);
}

/** Turns engine events into chimes and speech, and reads hands aloud. */
export function useAnnouncer(trip: Trip) {
  const enabled = trip.settings.voice;

  const say = useCallback(
    (text: string, delayMs = 0) => {
      if (!enabled || !isAudioUnlocked() || !text) return;
      if (delayMs === 0) voice.say(text);
      else window.setTimeout(() => { voice.say(text); }, delayMs);
    },
    [enabled],
  );

  const announce = useCallback(
    (events: readonly TripEvent[], next: Trip) => {
      const round = next.round;
      for (const event of events) {
        if (event === 'twist' && round?.kind === 'scene') {
          chime('twist');
          const twist = cardById(round.twistId);
          if (twist) say(`Twist. ${twist.prompt}`, AFTER_CHIME_MS);
        }
        if (event === 'landing' && round?.kind === 'scene') {
          chime('start');
          vibrate(60);
        }
        if (event === 'time-up' && round?.kind === 'scene') {
          chime('time-up');
          vibrate(200);
          say(`${playerName(next, round.openerId)}, last line.`, AFTER_CHIME_MS);
        }
        if (event === 'half-life-pass') {
          chime('time-up');
          say('Again. Same story, half the time.', AFTER_CHIME_MS);
        }
        if (event === 'warmup-done') chime('time-up');
      }
    },
    [say],
  );

  useEffect(() => () => { voice.stop(); }, []);

  return { say, announce, stop: voice.stop, sayNow: voice.say };
}
