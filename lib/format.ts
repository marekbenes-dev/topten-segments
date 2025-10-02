export function fmtDuration(sec: number, noSeconds = false) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h ? `${h}h` : null, m ? `${m}m` : null, noSeconds ? "" : `${s}s`]
    .filter(Boolean)
    .join(" ");
}
