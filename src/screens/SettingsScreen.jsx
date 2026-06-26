import { useState } from 'react'
import { getSettings, saveSettings } from '../lib/storage.js'

const TIMER_OPTIONS = [
  { label: '30 detik', value: 30 },
  { label: '45 detik', value: 45 },
  { label: '60 detik', value: 60 },
  { label: '90 detik', value: 90 },
  { label: '120 detik', value: 120 },
]

export default function SettingsScreen({ onBack, showToast }) {
  const [cfg, setCfg] = useState(() => getSettings())

  function setTimer(v) { setCfg(c => ({ ...c, timerSeconds: v })) }
  function setScrap(v) {
    const n = Math.max(7, parseInt(v) || 7)
    setCfg(c => ({ ...c, minScrap: n }))
  }

  function handleSave() {
    saveSettings(cfg)
    showToast('Pengaturan disimpan!')
    onBack()
  }

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg2 border-b border-border-dark px-4 h-[52px] flex items-center gap-3 flex-shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-xl font-light active:bg-bg3 active:text-text transition-colors"
        >
          ‹
        </button>
        <div className="flex-1">
          <h2 className="text-[13px] font-black leading-tight">⚙️ Pengaturan</h2>
          <p className="text-[10px] text-text2 mt-[1px]">Konfigurasi permainan</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">

        {/* Timer Section */}
        <div className="bg-bg2 border border-border-dark rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border-dark">
            <p className="text-[10px] font-bold text-text2 uppercase tracking-[1.2px]">⏱ Timer Takt Time</p>
            <p className="text-[11px] text-text3 mt-1">Durasi countdown untuk mode Takt Time Challenge</p>
          </div>
          <div className="p-4 flex flex-col gap-2">
            {TIMER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setTimer(opt.value)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all
                  ${cfg.timerSeconds === opt.value
                    ? 'bg-red/10 border-red/50 text-red'
                    : 'bg-bg3 border-border-dark text-text active:bg-bg4'}`}
              >
                <span className="text-[13px] font-semibold">{opt.label}</span>
                {cfg.timerSeconds === opt.value && (
                  <span className="text-[12px] font-black">✓</span>
                )}
              </button>
            ))}
          </div>
          <div className="px-4 pb-4">
            <p className="text-[10px] text-text3 mb-1.5">Atau masukkan nilai custom (detik):</p>
            <input
              type="number"
              value={cfg.timerSeconds}
              min={10}
              max={600}
              onChange={e => {
                const v = Math.max(10, Math.min(600, parseInt(e.target.value) || 60))
                setTimer(v)
              }}
              className="w-full px-3 py-2 bg-bg3 border border-border-dark rounded-lg text-text text-[15px] font-bold text-center outline-none focus:border-red transition-colors"
              inputMode="numeric"
            />
          </div>
        </div>

        {/* Min Scrap Section */}
        <div className="bg-bg2 border border-border-dark rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border-dark">
            <p className="text-[10px] font-bold text-text2 uppercase tracking-[1.2px]">🏗 Jumlah Scrap Minimal</p>
            <p className="text-[11px] text-text3 mt-1">Berapa kali scrap diturunkan per sesi (min. 7x)</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setScrap(cfg.minScrap - 1)}
                disabled={cfg.minScrap <= 7}
                className="w-12 h-12 rounded-lg bg-bg3 border border-border-dark text-[22px] font-bold text-text active:bg-bg4 disabled:opacity-30 transition-all flex-shrink-0"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <div className="text-[44px] font-black leading-none tabular-nums text-red">{cfg.minScrap}</div>
                <div className="text-[11px] text-text2 mt-1">kali scrap</div>
              </div>
              <button
                onClick={() => setScrap(cfg.minScrap + 1)}
                disabled={cfg.minScrap >= 30}
                className="w-12 h-12 rounded-lg bg-bg3 border border-border-dark text-[22px] font-bold text-text active:bg-bg4 disabled:opacity-30 transition-all flex-shrink-0"
              >
                +
              </button>
            </div>

            <div className="mt-4">
              <input
                type="range"
                min={7}
                max={30}
                value={cfg.minScrap}
                onChange={e => setScrap(e.target.value)}
                className="w-full accent-red"
              />
              <div className="flex justify-between text-[10px] text-text3 mt-1">
                <span>7x (min)</span>
                <span>30x</span>
              </div>
            </div>

            <div className="mt-3 bg-yellow/10 border border-yellow/30 rounded-lg px-3 py-2.5">
              <p className="text-[11px] text-yellow leading-snug">
                ⚠ Jumlah aktual scrap bisa lebih banyak tergantung berat target. Nilai ini adalah <strong>minimum</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-bg2 border border-border-dark rounded-xl px-4 py-3">
          <p className="text-[10px] font-bold text-text2 uppercase tracking-[1.2px] mb-2.5">Preview Pengaturan</p>
          <div className="flex gap-3">
            <div className="flex-1 bg-bg3 rounded-lg px-3 py-2.5 text-center">
              <div className="text-[9px] font-bold text-text2 uppercase tracking-[1px] mb-1">Timer</div>
              <div className="text-[22px] font-black text-yellow tabular-nums">{cfg.timerSeconds}s</div>
            </div>
            <div className="flex-1 bg-bg3 rounded-lg px-3 py-2.5 text-center">
              <div className="text-[9px] font-bold text-text2 uppercase tracking-[1px] mb-1">Min Scrap</div>
              <div className="text-[22px] font-black text-red tabular-nums">{cfg.minScrap}x</div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-4 border-t border-border-dark bg-bg2 flex-shrink-0">
        <button
          onClick={handleSave}
          className="w-full h-[52px] bg-red border border-red rounded-xl text-white text-[15px] font-black active:bg-red/80 transition-colors"
        >
          Simpan Pengaturan
        </button>
      </div>
    </div>
  )
}
