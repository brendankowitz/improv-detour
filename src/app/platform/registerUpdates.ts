import { registerSW } from 'virtual:pwa-register';

const HOURLY = 60 * 60 * 1000;

/**
 * Keeps an installed copy current. The service worker makes the game work offline, but on its own it keeps
 * serving the copy it first cached. This checks for a new version whenever the app is opened or brought back to
 * the front (and hourly while open), and the auto-update worker then reloads into it. A trip in progress survives
 * the reload because it lives in local storage.
 */
export function registerUpdates(): void {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) void registration.update();
      };
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      window.setInterval(check, HOURLY);
    },
  });
}
