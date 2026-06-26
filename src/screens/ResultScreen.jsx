export default function ResultScreen({ result, onPlayAgain, onDashboard }) {
  const { mode, score, target, maxStreak, totalAnswers, wrongAnswers, lineStop } = result
  const acc = totalAnswers > 0 ? Math.round(((totalAnswers - wrongAnswers) / totalAnswers) * 100) : 100

  const icon  = lineStop ? '🚨' : acc === 100 ? '🏆' : '🎉'
  const title = lineStop ? 'LINE STOP Terpicu!' : 'Sesi Selesai!'
  const sub   = lineStop
    ? 'Kalkulasi salah memicu line stop. Terus berlatih sampai zero error!'
    : acc === 100 ? 'Sempurna! Akurasi 100% — Zero Line Stop.' : 'Bagus! Terus latihan untuk mencapai 100%.'

  const accColor = acc === 100 ? 'text-green' : acc >= 80 ? 'text-yellow' : 'text-red2'

  const rows = [
    { l: 'Mode',             v: mode === 'training' ? '📚 Latihan' : '⚡ Takt Time', vc: '' },
    { l: 'Skor',             v: score + ' pts',     vc: 'text-red' },
    { l: 'Target Scrap',     v: target + ' kg',     vc: ''         },
    { l: 'Akurasi',          v: acc + '%',          vc: accColor   },
    { l: 'Streak Tertinggi', v: '🔥 ' + maxStreak,  vc: ''        },
    { l: 'Salah Hitung',     v: wrongAnswers + 'x', vc: wrongAnswers === 0 ? 'text-green' : 'text-red2' },
    { l: 'Line Stop',        v: lineStop ? 'Ya' : 'Tidak', vc: lineStop ? 'text-red2' : 'text-green' },
  ]

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">
      <div className="sticky top-0 z-20 bg-bg2 border-b border-border-dark px-4 h-[52px] flex items-center gap-3 flex-shrink-0">
        <button onClick={onDashboard} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-xl font-light active:bg-bg3 active:text-text transition-colors">‹</button>
        <div className="flex-1">
          <h2 className="text-[13px] font-black leading-tight">Charging Simulator</h2>
          <p className="text-[10px] text-text2 mt-[1px]">Hasil Sesi Latihan</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-[72px] mb-4">{icon}</div>
          <div className="text-[22px] font-black mb-2">{title}</div>
          <div className="text-[13px] text-text2 mb-5 leading-relaxed">{sub}</div>

          <div className="bg-bg2 border border-border-dark rounded-xl px-4 py-1 mb-5 text-left">
            {rows.map(({ l, v, vc }) => (
              <div key={l} className="flex justify-between items-center py-2.5 border-b border-border-dark last:border-b-0">
                <span className="text-[12px] text-text2">{l}</span>
                <span className={`text-[14px] font-bold tabular-nums ${vc}`}>{v}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={onPlayAgain}
              className="w-full py-4 bg-red text-white font-black text-sm uppercase tracking-widest rounded-lg active:scale-[.98] active:bg-red/70 transition-all">
              MAIN LAGI
            </button>
            <button onClick={onDashboard}
              className="w-full py-4 bg-bg3 text-text border border-border-dark font-black text-sm rounded-lg active:scale-[.98] transition-all">
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
