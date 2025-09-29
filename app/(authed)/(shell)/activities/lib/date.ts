export function startOfYearUtcEpoch(year: number) {
  return Math.floor(Date.UTC(year, 0, 1, 0, 0, 0) / 1000);
}

export function startOfNextYearUtcEpoch(year: number) {
  return Math.floor(Date.UTC(year + 1, 0, 1, 0, 0, 0) / 1000);
}

// --- helpers (UTC month math) ---------------------------------------------
export function toEpochSeconds(d: Date) {
  return Math.floor(d.getTime() / 1000);
}
export function startOfMonthUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
export function startOfNextMonthUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
}

/** Yields contiguous [after, beforeExclusive] month windows inside [after, beforeExclusive). */
export function* monthWindowsUTC(afterEpoch: number, beforeExclusive: number) {
  let cursor = afterEpoch;
  while (cursor < beforeExclusive) {
    const cd = new Date(cursor * 1000);
    const monthStart = toEpochSeconds(startOfMonthUTC(cd));
    const nextMonthStart = toEpochSeconds(startOfNextMonthUTC(cd));
    const winAfter = Math.max(cursor, monthStart);
    const winBeforeExcl = Math.min(beforeExclusive, nextMonthStart);
    yield [winAfter, winBeforeExcl] as const;
    cursor = winBeforeExcl;
  }
}
