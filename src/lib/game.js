export const DEFAULT_TAKT_TIME = 60
export const DEFAULT_MIN_SCRAP = 7

export function generateMaterials(target, minCount = DEFAULT_MIN_SCRAP) {
  const count = Math.max(minCount, Math.ceil(target / 300))
  const pieces = []
  let rem = target

  for (let i = 0; i < count - 1; i++) {
    const remaining = count - i
    const avg = rem / remaining
    const minW = Math.max(10, Math.round(avg * 0.4 / 10) * 10)
    const maxW = Math.round(Math.min(avg * 1.6, rem - (remaining - 1) * 10) / 10) * 10
    const lo = Math.min(minW, maxW)
    const hi = Math.max(lo, maxW)
    pieces.push(lo === hi ? lo : Math.round((Math.random() * (hi - lo) + lo) / 10) * 10)
    rem -= pieces[pieces.length - 1]
  }
  pieces.push(Math.max(10, rem))
  return pieces
}

export function fmtTime(s) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`
}

export function calcScore(streak, mode, timeLeft) {
  return 10 + (streak > 1 ? (streak - 1) * 2 : 0) + (mode === 'challenge' ? 5 + Math.floor(timeLeft / 10) : 0)
}
