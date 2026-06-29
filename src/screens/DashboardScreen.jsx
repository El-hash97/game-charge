import { getUserStats, getLeaderboard, getLogs, getSettings } from '../lib/storage.js'

const MEDALS = ['🥇', '🥈', '🥉']

export default function DashboardScreen({ currentUser, onMode, onLogout, onLeaderboard, onSettings, onPerformance }) {
  const stats    = getUserStats(currentUser.noreg)
  const lb       = getLeaderboard().slice(0, 3)
  const settings = getSettings()
  const history  = getLogs()
    .filter(l => l.noreg === currentUser.noreg)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5)

  const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
  const initial = currentUser.name.charAt(0).toUpperCase()

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg2 border-b border-border-dark px-4 h-[52px] flex items-center gap-3 flex-shrink-0">
        <span className="text-lg">🏭</span>
        <div className="flex-1 min-w-0">
          <h2 className="text-[13px] font-black tracking-[0.3px] leading-tight">Charging Simulator</h2>
          <p className="text-[10px] text-text2 mt-[1px]">{dateStr}</p>
        </div>
        <button onClick={onPerformance} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-base active:bg-bg3 active:text-text transition-colors">📊</button>
        <button onClick={onLeaderboard} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-base active:bg-bg3 active:text-text transition-colors">🏆</button>
        <button onClick={onSettings}   className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-base active:bg-bg3 active:text-text transition-colors">⚙️</button>
        <button onClick={onLogout}     className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-sm   active:bg-bg3 active:text-text transition-colors">⏏</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Operator strip */}
        <div className="flex items-center gap-3 bg-bg2 border border-border-r rounded-xl p-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-red flex items-center justify-center text-white font-black text-lg flex-shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-black truncate">{currentUser.name}</div>
            <div className="text-[11px] text-text2 mt-[1px]">Noreg: {currentUser.noreg}</div>
          </div>
          <div className="flex items-center gap-1 bg-red/10 border border-red/30 rounded-full px-2.5 py-1.5 text-[13px] font-black text-red flex-shrink-0">
            🔥 {stats.streak}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { label: 'Total Sesi',  val: stats.sessions,                                      sub: 'permainan',      cls: 'text-green'  },
            { label: 'Best Skor',   val: stats.bestScore,                                     sub: 'poin tertinggi', cls: 'text-red'    },
            { label: 'Akurasi',     val: stats.accuracy !== null ? stats.accuracy + '%' : '-', sub: 'rata-rata',     cls: 'text-blue'   },
            { label: 'Line Stop',   val: stats.lineStops,                                     sub: 'kejadian',       cls: 'text-yellow' },
          ].map(({ label, val, sub, cls }) => (
            <div key={label} className="bg-bg2 border border-border-dark rounded-xl p-3">
              <div className="text-[10px] font-bold text-text2 uppercase tracking-[0.8px] mb-1">{label}</div>
              <div className={`text-[28px] font-black leading-none tabular-nums ${cls}`}>{val}</div>
              <div className="text-[10px] text-text3 mt-1">{sub}</div>
            </div>
          ))}
        </div>

        {/* Mode cards */}
        <p className="text-[10px] font-bold text-text2 uppercase tracking-[1.2px] mb-2">Pilih Mode Latihan</p>
        <div className="flex flex-col gap-2 mb-4">
          <button
            onClick={() => onMode('training')}
            className="flex items-center gap-4 bg-bg2 border border-border-dark rounded-xl p-4 text-left w-full active:bg-bg3 active:border-red transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue/10 flex items-center justify-center text-2xl flex-shrink-0">📚</div>
            <div className="flex-1">
              <div className="text-sm font-black mb-1">Mode Latihan</div>
              <div className="text-[12px] text-text2 leading-snug">Tanpa timer. Fokus akurasi kalkulasi. Feedback detail tiap langkah.</div>
            </div>
            <span className="text-text3 text-lg">›</span>
          </button>
          <button
            onClick={() => onMode('challenge')}
            className="flex items-center gap-4 bg-bg2 border border-border-dark rounded-xl p-4 text-left w-full active:bg-bg3 active:border-red transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center text-2xl flex-shrink-0">⚡</div>
            <div className="flex-1">
              <div className="text-sm font-black mb-1">Takt Time Challenge</div>
              <div className="text-[12px] text-text2 leading-snug">Timer {settings.timerSeconds} detik · Min {settings.minScrap}x scrap. Simulasi tekanan produksi nyata. Awas LINE STOP!</div>
            </div>
            <span className="text-text3 text-lg">›</span>
          </button>
          <button
            onClick={() => onMode('counting')}
            className="flex items-center gap-4 bg-bg2 border border-border-dark rounded-xl p-4 text-left w-full active:bg-bg3 active:border-red transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-yellow/10 flex items-center justify-center text-2xl flex-shrink-0">🔢</div>
            <div className="flex-1">
              <div className="text-sm font-black mb-1">Mode Hitung</div>
              <div className="text-[12px] text-text2 leading-snug">Level 1–5 · Makin sulit, makin banyak angka & makin cepat. Hafal lalu jumlahkan!</div>
            </div>
            <span className="text-text3 text-lg">›</span>
          </button>
        </div>

        {/* Leaderboard preview */}
        <p className="text-[10px] font-bold text-text2 uppercase tracking-[1.2px] mb-2">Leaderboard Tim</p>
        <div className="bg-bg2 border border-border-dark rounded-xl overflow-hidden mb-4">
          <div className="flex justify-between items-center px-4 py-2.5 border-b border-border-dark">
            <span className="text-[10px] font-bold text-text2 uppercase tracking-[1px]">Top Players</span>
            <button onClick={onLeaderboard} className="text-[12px] text-red">Lihat Semua ›</button>
          </div>
          {lb.length === 0 ? (
            <div className="px-4 py-5 text-center text-[12px] text-text3">Belum ada data. Mainkan game pertama!</div>
          ) : (
            lb.map((p, i) => (
              <div key={p.noreg} className="flex items-center gap-3 px-4 py-2.5 border-b border-border-dark last:border-b-0">
                <span className="w-6 text-sm">{MEDALS[i]}</span>
                <span className="flex-1 text-[13px] font-semibold">{p.name}</span>
                <span className="text-sm font-black text-red tabular-nums">{p.bestScore}</span>
              </div>
            ))
          )}
        </div>

        {/* History */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-text2 uppercase tracking-[1.2px]">Riwayat Latihan</p>
          <button onClick={onPerformance} className="text-[12px] text-red">Lihat Semua ›</button>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-7 text-text3 text-[12px]">
            <div className="text-4xl mb-2">📋</div>
            Belum ada riwayat latihan.
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {history.map(l => (
              <div key={l.ts} className="flex items-center gap-3 bg-bg2 border border-border-dark rounded-xl px-3 py-3">
                <span className="text-lg flex-shrink-0">{l.mode === 'training' ? '📚' : l.mode === 'counting' ? '🔢' : '⚡'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold">
                    {l.mode === 'training' ? 'Mode Latihan' : l.mode === 'counting' ? 'Mode Hitung' : 'Takt Time Challenge'} {l.lineStop ? '⛔' : '✅'}
                  </div>
                  <div className="text-[10px] text-text3 mt-0.5">
                    {new Date(l.ts).toLocaleString('id-ID')} · Target: {l.target} kg · {l.wrongAnswers} salah
                  </div>
                </div>
                <span className={`text-lg font-black tabular-nums flex-shrink-0 ${l.lineStop ? 'text-red2' : 'text-red'}`}>
                  {l.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
