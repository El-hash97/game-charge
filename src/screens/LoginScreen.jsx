import { useState } from 'react'

export default function LoginScreen({ onLogin }) {
  const [name, setName]   = useState('')
  const [noreg, setNoreg] = useState('')

  return (
    <div className="min-h-[100dvh] bg-bg flex items-center justify-center">
      <div className="w-full max-w-sm px-6 py-8 flex flex-col">

        {/* Brand */}
        <div className="text-center mb-9">
          <span className="text-5xl block mb-4">🏭</span>
          <div className="w-8 h-[3px] bg-red rounded-sm mx-auto mb-4" />
          <div className="text-3xl font-black text-red uppercase tracking-wide leading-tight mb-2">
            Charging<br />Simulator
          </div>
          <div className="text-[11px] text-text2 tracking-wide">Zero Line Stop Training System</div>
          <div className="text-[10px] font-bold text-text3 tracking-widest uppercase border-t border-border-dark pt-3 mt-3">
            Iron Casting Division
          </div>
        </div>

        {/* Form */}
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-text2 uppercase tracking-widest mb-2">
            Username / Nama Lengkap
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Masukkan nama lengkap"
            autoComplete="off"
            className="w-full px-4 py-3 bg-bg2 border border-border-dark rounded-lg text-text text-base outline-none focus:border-red transition-colors"
          />
        </div>

        <div className="mb-6">
          <label className="block text-[10px] font-bold text-text2 uppercase tracking-widest mb-2">
            Nomor Registrasi (Noreg)
          </label>
          <input
            type="text"
            value={noreg}
            onChange={e => setNoreg(e.target.value)}
            placeholder="Contoh: 24-0001"
            autoComplete="off"
            onKeyDown={e => e.key === 'Enter' && onLogin(name.trim(), noreg.trim())}
            className="w-full px-4 py-3 bg-bg2 border border-border-dark rounded-lg text-text text-base outline-none focus:border-red transition-colors"
          />
        </div>

        <button
          onClick={() => onLogin(name.trim(), noreg.trim())}
          className="w-full py-4 bg-red text-white font-black text-sm uppercase tracking-widest rounded-lg active:scale-[.98] active:bg-red/70 transition-all"
        >
          MASUK &amp; MULAI LATIHAN
        </button>

        <p className="text-center text-[11px] text-text3 mt-4">Data tersimpan di perangkat ini</p>
      </div>
    </div>
  )
}
