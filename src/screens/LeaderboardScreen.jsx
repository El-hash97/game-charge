import { useState } from 'react'
import { getLeaderboard, saveLogs, hashColor } from '../lib/storage.js'

export default function LeaderboardScreen({ currentUser, onBack, showToast }) {
  const [lb, setLb] = useState(() => getLeaderboard())

  function clearLb() {
    if (!confirm('Reset semua data leaderboard?')) return
    saveLogs([])
    setLb([])
    showToast('Leaderboard direset')
  }

  const top3     = [lb[1], lb[0], lb[2]]
  const podH     = [46, 64, 34]
  const podRank  = ['2', '1', '3']
  const podCol   = ['#64748b', '#d97706', '#92400e']
  const scoreCol = ['#94a3b8', '#fbbf24', '#d97706']

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">
      <div className="sticky top-0 z-20 bg-bg2 border-b border-border-dark px-4 h-[52px] flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-xl font-light active:bg-bg3 active:text-text transition-colors">‹</button>
        <div className="flex-1">
          <h2 className="text-[13px] font-black leading-tight">Leaderboard Tim</h2>
          <p className="text-[10px] text-text2 mt-[1px]">Kompetisi Kalkulasi Internal</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {lb.length > 0 && (
          <div className="flex justify-center items-end gap-1.5 mb-5">
            {top3.map((p, i) => {
              if (!p) return <div key={i} className="flex-1 max-w-[108px]" />
              return (
                <div key={p.noreg} className="flex-1 max-w-[108px] text-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-black text-white mx-auto mb-1"
                    style={{ background: podCol[i] }}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="text-[11px] font-semibold mb-1 overflow-hidden text-ellipsis whitespace-nowrap px-1">{p.name}</div>
                  <div className="text-[12px] font-black mb-1 tabular-nums" style={{ color: scoreCol[i] }}>{p.bestScore}</div>
                  <div className="rounded-t-md flex items-center justify-center text-lg font-black text-white"
                    style={{ height: podH[i], background: podCol[i] }}>
                    {podRank[i]}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="bg-bg2 border border-border-dark rounded-xl overflow-hidden">
          {lb.length === 0 ? (
            <div className="p-5 text-center text-[12px] text-text3">Belum ada data.</div>
          ) : (
            lb.map((p, i) => {
              const me = currentUser && p.noreg === currentUser.noreg
              return (
                <div key={p.noreg}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-border-dark last:border-b-0 ${me ? 'bg-red/5' : ''}`}>
                  <div className="w-7 text-[13px] font-black text-text3">{i + 1}</div>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-black text-white flex-shrink-0"
                    style={{ background: hashColor(p.noreg) }}>
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{p.name}{me ? ' 👈' : ''}</div>
                    <div className="text-[10px] text-text3 mt-0.5">{p.sessions} sesi</div>
                  </div>
                  <div className="text-[15px] font-black text-red tabular-nums flex-shrink-0">{p.bestScore}</div>
                </div>
              )
            })
          )}
        </div>

        <div className="mt-4">
          <button onClick={clearLb}
            className="w-full py-2.5 bg-bg3 text-text border border-border-dark text-[11px] font-bold rounded-lg active:bg-border-dark transition-colors">
            Reset Leaderboard
          </button>
        </div>
      </div>
    </div>
  )
}
