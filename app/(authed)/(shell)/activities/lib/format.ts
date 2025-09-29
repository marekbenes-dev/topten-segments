export function fmtKm(meters: number) {
  return meters ? (meters / 1000).toFixed(2) + " km" : "";
}

export function fmtPaceMinKm(pace: number) {
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")} min/km`;
}
