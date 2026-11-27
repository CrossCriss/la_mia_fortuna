// Чисті функції для списків id (обране, нещодавно переглянуті).
// Вхідні масиви не мутуються: завжди повертається новий масив.

/** Є id - прибрати; немає - додати на початок. Довжина не більше max (зайві з кінця відкидаються). */
export function toggleId(ids: string[], id: string, max: number): string[] {
  const limit = Math.max(0, max);
  if (ids.includes(id)) {
    return ids.filter((x) => x !== id);
  }
  return [id, ...ids].slice(0, limit);
}

/** Прибирає дубль id, ставить його на початок і обрізає список до max. */
export function pushRecentId(ids: string[], id: string, max: number): string[] {
  const limit = Math.max(0, max);
  return [id, ...ids.filter((x) => x !== id)].slice(0, limit);
}

/** Залишає лише дозволені id, порядок зберігається. */
export function keepIds(ids: string[], allowed: Set<string>): string[] {
  return ids.filter((id) => allowed.has(id));
}
