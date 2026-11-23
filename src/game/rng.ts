/**
 * mulberry32: a tiny seeded PRNG. The state is a plain number so it can live in a saved trip,
 * which makes every deal reproducible from the trip alone.
 */
export function nextRandom(state: number): readonly [value: number, state: number] {
  const next = (state + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return [value, next];
}

export function pickIndex(state: number, length: number): readonly [index: number, state: number] {
  if (length <= 0) throw new RangeError(`Cannot pick from an empty list (length ${length}).`);
  const [value, next] = nextRandom(state);
  return [Math.floor(value * length), next];
}
