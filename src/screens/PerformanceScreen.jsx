import { useState } from 'react'
import { getLogs, getUserStats, getPersonalTargets, savePersonalTargets, getWeeklyStats } from '../lib/storage.js'

const MODE_LABEL = { training: '📚 Latihan', challenge: '⚡ Takt Time', counting: '🔢 Mode Hitung' }
const MODE_FILTER = ['all', 'training', 'challenge', 'counting']
const MODE_FILTER_LABEL = { all: 'Semua', training: 'Latihan', challenge: 'Challenge', counting: 'Hitung' }

function ProgressBar({ value, max, color = 'bg-red' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-2 bg-bg3 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function TrendBars({ scores }) {
  if (scores.length === 0) return <div className="text-[11px] text-text3 text-center py-3">Belum ada data</div>
  const max = Math.max(...scores, 1)
  return (
    <div className="flex items-end gap-1 h-12">
      {scores.map((s, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full bg-red/70 rounded-t-sm"
            style={{ height: `${Math.max(4, Math.round((s / max) * 44))}px` }}
          />
        </div>
      ))}
    </div>
  )
}

function EditTargetModal({ targets, onSave, onClose }) {
  const [vals, setVals] = useState({ ...targets })

  function Row({ label, unit, fieldKey, min, max, step = 1 }) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-border-dark last:border-b-0">
        <div>
          <div className="text-[13px] font-bold">{label}</div>
          <div className="text-[10px] text-text3">{unit}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVals(v => ({ ...v, [fieldKey]: Math.max(min, v[fieldKey] - step) }))}
            className="w-8 h-8 rounded-lg bg-bg3 border border-border-dark text-lg font-bold flex items-center justify-center active:bg-bg4"
          >−</button>
          <span className="w-14 text-center text-[15px] font-black tabular-nums">{vals[fieldKey]}</span>
          <button
            onClick={() => setVals(v => ({ ...v, [fieldKey]: Math.min(max, v[fieldKey] + step) }))}
            className="w-8 h-8 rounded-lg bg-bg3 border border-border-dark text-lg font-bold flex items-center justify-center active:bg-bg4"
          >+</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-bg2 border-t border-border-dark rounded-t-2xl p-4 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-black">Edit Target Pribadi</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-bg3 text-text2 flex items-center justify-center text-lg active:bg-bg4">✕</button>
        </div>
        <div className="bg-bg border border-border-dark rounded-xl px-3 mb-4">
          <Row label="🎯 Target Akurasi"      unit="% benar dari total jawaban"     fieldKey="accuracy"        min={50}  max={100}  step={5}  />
          <Row label="🏆 Target Skor Terbaik" unit="poin tertinggi yang harus dicapai" fieldKey="bestScore"    min={50}  max={2000} step={50} />
          <Row label="🔥 Target Streak"       unit="sesi berturut tanpa line stop"  fieldKey="streak"          min={1}   max={30}   step={1}  />
          <Row label="📅 Target Sesi/Minggu"  unit="jumlah bermain per 7 hari"      fieldKey="sessionsPerWeek" min={1}   max={30}   step={1}  />
        </div>
        <button
          onClick={() => { onSave(vals); onClose() }}
          className="w-full py-3.5 bg-red text-white font-black text-sm rounded-lg active:bg-red/70"
        >
          Simpan Target
        </button>
      </div>
    </div>
  )
}

export default function PerformanceScreen({ currentUser, onBack }) {
  const noreg = currentUser.noreg

  const [filter, setFilter]    = useState('all')
  const [showEdit, setShowEdit] = useState(false)
  const [targets, setTargets]  = useState(() => getPersonalTargets(noreg))

  const stats   = getUserStats(noreg)
  const weekly  = getWeeklyStats(noreg)
  const allLogs = getLogs()
    .filter(l => l.noreg === noreg)
    .sort((a, b) => b.ts - a.ts)

  const filtered = filter === 'all' ? allLogs : allLogs.filter(l => l.mode === filter)

  const trendScores = [...allLogs].reverse().slice(-10).map(l => l.score)

  function handleSave(newTargets) {
    savePersonalTargets(noreg, newTargets)
    setTargets(newTargets)
  }

  const targetDefs = [
    {
      key:     'accuracy',
      label:   '🎯 Akurasi',
      color:   'bg-blue',
      unit:    '% tercapai',
      current: stats.accuracy ?? 0,
      max:     targets.accuracy,
      fmt:     v => v + '%',
    },
    {
      key:     'bestScore',
      label:   '🏆 Skor Terbaik',
      color:   'bg-red',
      unit:    'pts tercapai',
      current: stats.bestScore,
      max:     targets.bestScore,
      fmt:     v => v,
    },
    {
      key:     'streak',
      label:   '🔥 Streak',
      color:   'bg-yellow',
      unit:    'sesi berturut',
      current: stats.streak,
      max:     targets.streak,
      fmt:     v => v + 'x',
    },
    {
      key:     'sessionsPerWeek',
      label:   '📅 Sesi Minggu Ini',
      color:   'bg-green',
      unit:    'sesi dalam 7 hari',
      current: weekly.sessions,
      max:     targets.sessionsPerWeek,
      fmt:     v => v + 'x',
    },
  ]

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg2 border-b border-border-dark px-4 h-[52px] flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-xl font-light active:bg-bg3 active:text-text transition-colors">‹</button>
        <div className="flex-1">
          <h2 className="text-[13px] font-black leading-tight">📊 Performa Saya</h2>
          <p className="text-[10px] text-text2 mt-[1px]">{currentUser.name}</p>
        </div>
        <button
          onClick={() => setShowEdit(true)}
          className="px-3 h-8 bg-bg3 border border-border-dark rounded-lg text-[11px] font-bold text-text2 active:bg-bg4 transition-colors"
        >
          Edit Target
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-8">

        {/* Target Progress */}
        <p className="text-[10px] font-bold text-text2 uppercase tracking-[1.2px] mb-2">Target Pribadi</p>
        <div className="bg-bg2 border border-border-dark rounded-xl px-4 py-1 mb-4">
          {targetDefs.map(({ key, label, color, unit, current, max, fmt }) => {
            const done = current >= max
            const pct  = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0
            return (
              <div key={key} className="py-3 border-b border-border-dark last:border-b-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-bold">{label}</span>
                  <span className={`text-[11px] font-black tabular-nums ${done ? 'text-green' : 'text-text2'}`}>
                    {fmt(current)} / {fmt(max)} {done ? '✓' : ''}
                  </span>
                </div>
                <ProgressBar value={current} max={max} color={done ? 'bg-green' : color} />
                <div className="text-[10px] text-text3 mt-1">{pct}% · {unit}</div>
              </div>
            )
          })}
        </div>

        {/* Trend */}
        <p className="text-[10px] font-bold text-text2 uppercase tracking-[1.2px] mb-2">Tren Skor (10 terakhir)</p>
        <div className="bg-bg2 border border-border-dark rounded-xl p-4 mb-4">
          <TrendBars scores={trendScores} />
          {trendScores.length > 0 && (
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-text3">Min: <span className="font-bold text-text">{Math.min(...trendScores)}</span></span>
              <span className="text-[10px] text-text3">Rata: <span className="font-bold text-text">{Math.round(trendScores.reduce((a, b) => a + b, 0) / trendScores.length)}</span></span>
              <span className="text-[10px] text-text3">Max: <span className="font-bold text-red">{Math.max(...trendScores)}</span></span>
            </div>
          )}
        </div>

        {/* History */}
        <p className="text-[10px] font-bold text-text2 uppercase tracking-[1.2px] mb-2">Riwayat Lengkap</p>
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
          {MODE_FILTER.map(m => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex-shrink-0 border transition-colors
                ${filter === m
                  ? 'bg-red border-red text-white'
                  : 'bg-bg2 border-border-dark text-text2 active:bg-bg3'}`}
            >
              {MODE_FILTER_LABEL[m]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10 text-text3 text-[12px]">
            <div className="text-4xl mb-2">📋</div>
            Belum ada riwayat untuk mode ini.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(l => {
              const acc = l.totalAnswers > 0
                ? Math.round(((l.totalAnswers - l.wrongAnswers) / l.totalAnswers) * 100)
                : 100
              return (
                <div key={l.ts} className="bg-bg2 border border-border-dark rounded-xl px-3 py-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0 mt-0.5">
                      {l.mode === 'training' ? '📚' : l.mode === 'counting' ? '🔢' : '⚡'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[12px] font-black">{MODE_LABEL[l.mode] ?? l.mode}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0
                          ${l.lineStop ? 'bg-red2/20 text-red2' : 'bg-green/20 text-green'}`}>
                          {l.lineStop ? '⛔ Line Stop' : '✅ Lolos'}
                        </span>
                      </div>
                      <div className="text-[10px] text-text3 mt-0.5">
                        {new Date(l.ts).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex gap-3 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-text2">
                          Akurasi <span className={`font-bold ${acc === 100 ? 'text-green' : acc >= 80 ? 'text-yellow' : 'text-red2'}`}>{acc}%</span>
                        </span>
                        {l.target > 0 && (
                          <span className="text-[10px] text-text2">Target <span className="font-bold text-text">{l.target} kg</span></span>
                        )}
                        {l.wrongAnswers > 0 && (
                          <span className="text-[10px] text-text2">Salah <span className="font-bold text-red2">{l.wrongAnswers}x</span></span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-[18px] font-black tabular-nums ${l.lineStop ? 'text-text3' : 'text-red'}`}>{l.score}</div>
                      <div className="text-[9px] text-text3">pts</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showEdit && (
        <EditTargetModal
          targets={targets}
          onSave={handleSave}
          onClose={() => setShowEdit(false)}
        />
      )}
    </div>
  )
}
