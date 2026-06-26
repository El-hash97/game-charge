export const getLogs  = () => JSON.parse(localStorage.getItem('fcs_logs')  || '[]')
export const saveLogs = l  => localStorage.setItem('fcs_logs',  JSON.stringify(l))
export const getUsers = () => JSON.parse(localStorage.getItem('fcs_users') || '{}')
export const saveUsers= u  => localStorage.setItem('fcs_users', JSON.stringify(u))

export function getUserStats(noreg) {
  const logs  = getLogs().filter(l => l.noreg === noreg)
  const total = logs.reduce((a, l) => a + l.totalAnswers, 0)
  const wrong = logs.reduce((a, l) => a + l.wrongAnswers, 0)
  return {
    sessions:  logs.length,
    bestScore: logs.reduce((m, l) => Math.max(m, l.score), 0),
    accuracy:  total > 0 ? Math.round(((total - wrong) / total) * 100) : null,
    lineStops: logs.filter(l => l.lineStop).length,
    streak: (() => {
      let s = 0
      for (const l of [...logs].sort((a, b) => b.ts - a.ts)) {
        if (!l.lineStop) s++; else break
      }
      return s
    })()
  }
}

export function getLeaderboard() {
  const users = getUsers()
  const map   = {}
  for (const l of getLogs()) {
    if (!map[l.noreg]) map[l.noreg] = { noreg: l.noreg, name: users[l.noreg]?.name || l.noreg, bestScore: 0, sessions: 0 }
    map[l.noreg].bestScore = Math.max(map[l.noreg].bestScore, l.score)
    map[l.noreg].sessions++
  }
  return Object.values(map).sort((a, b) => b.bestScore - a.bestScore)
}

export function hashColor(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return ['#7c3aed','#0369a1','#0f766e','#b45309','#6d28d9','#1d4ed8','#9f1239'][Math.abs(h) % 7]
}
