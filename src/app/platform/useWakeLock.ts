import { useEffect } from 'react';

/**
 * Keeps the screen on while `active`, so the timer keeps running with the phone in a cupholder.
 * The browser drops the lock whenever the page is hidden, so it is re-requested on return.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) void sentinel.release();
      } catch (error) {
        // Refused (battery saver, unsupported context). The game still works; the screen may sleep.
        console.info('Detour: screen wake lock unavailable.', error);
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire();
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release();
    };
  }, [active]);
}
