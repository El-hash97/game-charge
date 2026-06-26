export default function LineStopOverlay({ detail, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center flex-col p-6 animate-flashR">
      <div className="w-full max-w-sm text-center">
        <div className="text-[72px] animate-shake">🚨</div>
        <div
          className="text-[24px] font-black text-red2 tracking-[3px] mt-4 mb-2"
          style={{ textShadow: '0 0 32px rgba(255,68,68,0.6)' }}
        >
          LINE STOP
        </div>
        <div className="text-[13px] text-text2 mb-4 leading-relaxed">
          Kalkulasi berat pengisian gagal!<br />Proses produksi terhenti.
        </div>
        <div className="text-[12px] text-text bg-bg2 border border-border-r rounded-lg p-3 mb-5 text-left leading-loose tabular-nums whitespace-pre-line">
          {detail}
        </div>
        <button
          onClick={onClose}
          className="max-w-[260px] w-full mx-auto py-4 bg-bg3 text-text border border-border-dark font-black text-sm rounded-lg active:scale-[.98] transition-all block"
        >
          Tutup &amp; Lihat Hasil
        </button>
      </div>
    </div>
  )
}
