/** Reads a value from a config map, falling back when the key is unknown at runtime. */
export function lookup<K extends string, V>(map: Record<K, V>, key: K, fallback: V): V {
  const value = map[key];
  return value === undefined ? fallback : value;
}
