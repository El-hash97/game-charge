export const TAKT_TIME = 60

export function generateMaterials(target) {
  const w = []
  let rem = target
  while (rem > 200) {
    const max = Math.min(rem - 100, 600)
    w.push(Math.round((Math.random() * (max - 150) + 150) / 10) * 10)
    rem -= w[w.length - 1]
  }
  if (rem > 0) w.push(rem)
  return w
}

export function fmtTime(s) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

export function calcScore(streak, mode, timeLeft) {
  return 10 + (streak > 1 ? (streak - 1) * 2 : 0) + (mode === 'challenge' ? 5 + Math.floor(timeLeft / 10) : 0)
}
