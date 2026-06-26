import { useState } from 'react'

const PRESETS = [1300, 1400, 1500, 1600, 1800, 2000]

export default function TargetModal({ mode, onConfirm, onClose, showToast }) {
  const [selected, setSelected] = useState(null)
  const [custom, setCustom]     = useState('')

  function confirm() {
    const c = parseInt(custom)
    const target = selected || (isNaN(c) ? null : c)
    if (!target || target < 100 || target > 9999) {
      showToast('Pilih preset atau masukkan target 100-9999 kg')
      return
    }
    onConfirm(target)
  }

  function pickPreset(val) {
    setSelected(val)
    setCustom('')
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-[80] flex items-end justify-center"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-bg2 border-t border-border-r rounded-t-[18px] w-full max-w-lg px-[18px] pt-5 pb-9">
        <div className="w-9 h-1 bg-border-dark rounded-full mx-auto mb-5" />
        <div className="text-[15px] font-black mb-1">
          {mode === 'training' ? '📚 Mode Latihan' : '⚡ Takt Time Challenge'}
        </div>
        <div className="text-[12px] text-text2 mb-4">Tentukan target scrap sebelum mulai</div>

        <span className="text-[10px] font-bold text-text2 uppercase tracking-[0.8px] mb-2.5 block">Target Scrap (kg)</span>
        <div className="grid grid-cols-3 gap-[7px] mb-3">
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => pickPreset(p)}
              className={`py-3 px-1.5 rounded-lg text-[15px] font-black text-center transition-all border-2
                ${selected === p
                  ? 'border-red bg-red/10 text-red'
                  : 'border-border-dark bg-bg3 text-text'
                }`}
            >
              {p}
              <span className={`block text-[9px] font-normal mt-0.5 ${selected === p ? 'text-red/60' : 'text-text3'}`}>kg</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center mb-5">
          <input
            type="number"
            value={custom}
            onChange={e => { setCustom(e.target.value); setSelected(null) }}
            placeholder="Atau ketik angka..."
            inputMode="numeric"
            className="flex-1 px-4 py-3 bg-bg border-2 border-border-dark rounded-lg text-text text-[20px] font-black outline-none focus:border-red tabular-nums transition-colors"
          />
          <span className="text-[13px] text-text2 font-semibold">kg</span>
        </div>

        <button onClick={confirm}
          className="w-full py-4 bg-red text-white font-black text-sm uppercase tracking-widest rounded-lg active:scale-[.98] active:bg-red/70 transition-all mb-2">
          MULAI ›
        </button>
        <button onClick={onClose}
          className="w-full py-4 bg-bg3 text-text border border-border-dark font-black text-sm rounded-lg active:scale-[.98] transition-all">
          Batal
        </button>
      </div>
    </div>
  )
}
