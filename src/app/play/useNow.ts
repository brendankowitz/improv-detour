import { useEffect, useState } from 'react';

/** The wall clock, refreshed five times a second while `active`, so a countdown can render from it. */
export function useNow(active: boolean): number {
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
