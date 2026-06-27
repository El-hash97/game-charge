import { useState, useEffect, useRef, useCallback } from 'react'
import { playSound } from '../lib/audio.js'
import Confetti from '../components/Confetti.jsx'
import LineStopOverlay from '../components/LineStopOverlay.jsx'

const SHOW_SECONDS = 5

function generateNumbers(count = 7) {
  const nums = []
  for (let i = 0; i < count; i++) {
    nums.push((Math.floor(Math.random() * 30) + 1) * 10)
  }
  return nums
}

export default function CountingGameScreen({ config, onEnd, onQuit, showToast }) {
  const { minScrap = 7 } = config

  const [numbers] = useState(() => generateNumbers(minScrap))
  const total = numbers.reduce((a, b) => a + b, 0)

  // phase: 'watching' | 'inputting'
  const [phase, setPhase]           = useState('watching')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [countdown, setCountdown]   = useState(SHOW_SECONDS)
  const [animKey, setAnimKey]       = useState(0)

  const [ansVal, setAnsVal]             = useState('')
  const [shake, setShake]               = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showLS, setShowLS]             = useState(false)
  const [lsDetail, setLsDetail]         = useState('')

  // Calculator state
  const [showCalc, setShowCalc]   = useState(false)
  const [calcDisp, setCalcDisp]   = useState('0')
  const [calcPrev, setCalcPrev]   = useState(null)
  const [calcOp, setCalcOp]       = useState(null)
  const [calcFresh, setCalcFresh] = useState(true)

  function calcApply(a, b, op) {
    if (op === '+') return a + b
    if (op === '-') return a - b
    if (op === '×') return a * b
    if (op === '÷') return b !== 0 ? Math.round((a / b) * 1e8) / 1e8 : 0
    return b
  }
  function calcNum(n) {
    setCalcDisp(d => (calcFresh || d === '0') ? String(n) : d.length < 9 ? d + n : d)
    setCalcFresh(false)
  }
  function calcOper(op) {
    const curr = parseFloat(calcDisp) || 0
    if (calcOp && !calcFresh) {
      const res = calcApply(calcPrev, curr, calcOp)
      setCalcDisp(String(res))
      setCalcPrev(res)
    } else {
      setCalcPrev(curr)
    }
    setCalcOp(op)
    setCalcFresh(true)
  }
  function calcEquals() {
    if (!calcOp) return
    const res = calcApply(calcPrev ?? 0, parseFloat(calcDisp) || 0, calcOp)
    setCalcDisp(String(res))
    setCalcOp(null)
    setCalcPrev(null)
    setCalcFresh(true)
  }
  function calcClear() {
    setCalcDisp('0')
    setCalcOp(null)
    setCalcPrev(null)
    setCalcFresh(true)
  }
  function useCalcResult() {
    const v = Math.round(parseFloat(calcDisp))
    if (!isNaN(v)) setAnsVal(String(v))
  }

  const startTime = useRef(Date.now())

  useEffect(() => {
    if (phase !== 'watching') return

    setCountdown(SHOW_SECONDS)
    setAnimKey(k => k + 1)

    const tick = setInterval(() => {
      setCountdown(c => (c > 1 ? c - 1 : c))
    }, 1000)

    const advance = setTimeout(() => {
      if (currentIdx + 1 >= numbers.length) {
        setPhase('inputting')
      } else {
        setCurrentIdx(i => i + 1)
      }
    }, SHOW_SECONDS * 1000)

    return () => {
      clearInterval(tick)
      clearTimeout(advance)
    }
  }, [phase, currentIdx, numbers.length])

  const submit = useCallback(() => {
    const answer = parseInt(ansVal)
    if (isNaN(answer) || answer <= 0) { showToast('Masukkan angka!'); return }

    const duration = Math.round((Date.now() - startTime.current) / 1000)

    if (answer === total) {
      playSound('correct')
      setShowConfetti(true)
      setTimeout(() => {
        setShowConfetti(false)
        onEnd({
          mode:         'counting',
          target:       total,
          score:        100 + numbers.length * 5,
          maxStreak:    numbers.length,
          totalAnswers: 1,
          wrongAnswers: 0,
          lineStop:     false,
          duration,
        })
      }, 1800)
    } else {
      playSound('wrong')
      setShake(true)
      setTimeout(() => setShake(false), 380)
      const detail = `Jawaban kamu  : ${answer}\nJawaban benar : ${total}\nSelisih       : ${Math.abs(answer - total)}\n\nAngka yang muncul :\n${numbers.join(' + ')} = ${total}`
      setLsDetail(detail)
      setShowLS(true)
      playSound('linestop')
    }
  }, [ansVal, total, numbers, onEnd, showToast])

  function handleCloseLs() {
    setShowLS(false)
    onEnd({
      mode:         'counting',
      target:       total,
      score:        0,
      maxStreak:    0,
      totalAnswers: 1,
      wrongAnswers: 1,
      lineStop:     true,
      duration:     Math.round((Date.now() - startTime.current) / 1000),
    })
  }

  function npPress(n) { setAnsVal(v => v.length < 6 ? v + n : v) }
  function npDel()    { setAnsVal(v => v.slice(0, -1)) }

  const currentNum = numbers[currentIdx] ?? 0

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg2 border-b border-border-dark px-4 h-[52px] flex items-center gap-3 flex-shrink-0">
        <button onClick={onQuit} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-xl font-light active:bg-bg3 active:text-text transition-colors">‹</button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[13px] font-black leading-tight">🔢 Mode Hitung</h2>
          <p className="text-[10px] text-text2 mt-[1px]">
            {phase === 'watching' ? 'Hafal dan jumlahkan semua angka' : 'Masukkan total dari semua angka!'}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-bg3 border border-border-dark rounded-full px-2.5 py-1 text-[11px] font-bold text-text2 flex-shrink-0">
          {numbers.length}x angka
        </div>
      </div>

      {phase === 'watching' ? (
        <>
          {/* Progress bar */}
          <div className="h-1 bg-bg3 flex-shrink-0">
            <div
              className="h-full bg-red transition-all duration-500"
              style={{ width: `${((currentIdx + 1) / numbers.length) * 100}%` }}
            />
          </div>

          {/* Counter position */}
          <div className="flex items-center justify-between px-4 py-3 bg-bg2 border-b border-border-dark flex-shrink-0">
            <span className="text-[11px] font-bold text-text2 uppercase tracking-[1px]">
              Angka ke-{currentIdx + 1} dari {numbers.length}
            </span>
            <div className="flex gap-1.5">
              {numbers.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < currentIdx ? 'bg-green' : i === currentIdx ? 'bg-red animate-countPulse' : 'bg-bg3'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Main number display */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-hidden">
            <div className="text-[10px] font-bold text-text2 uppercase tracking-[2px] mb-6">
              Ingat angka ini!
            </div>

            {/* Scroll ticker */}
            <div className="relative w-full max-w-[280px] h-[180px] bg-bg2 border-2 border-border-dark rounded-2xl flex items-center justify-center overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-bg2 to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-bg2 to-transparent z-10 pointer-events-none" />
              <div key={animKey} className="animate-scrollIn text-center">
                <div className="text-[88px] font-black leading-none tabular-nums tracking-[-3px] text-text">
                  {currentNum}
                </div>
                <div className="text-[18px] text-text2 mt-1">kg</div>
              </div>
            </div>

            {/* Countdown */}
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className={`text-[42px] font-black tabular-nums leading-none ${countdown <= 2 ? 'text-red animate-countPulse' : 'text-text2'}`}>
                {countdown}
              </div>
              <div className="text-[10px] font-bold text-text3 uppercase tracking-[1.5px]">
                detik tersisa
              </div>
            </div>
          </div>

          {/* Hint strip */}
          <div className="px-4 py-3 bg-bg2 border-t border-border-dark text-center flex-shrink-0">
            <p className="text-[11px] text-text3">
              Hafal tiap angka — di akhir kamu harus masukkan <span className="text-text font-bold">total jumlahnya</span>
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Input phase header */}
          <div className="px-4 py-5 border-b border-border-dark bg-bg2 text-center flex-shrink-0">
            <div className="text-[11px] font-bold text-green uppercase tracking-[1.5px] mb-1">Semua angka sudah tampil!</div>
            <div className="text-[13px] text-text2">
              Berapa total dari <span className="text-text font-black">{numbers.length} angka</span> yang muncul tadi?
            </div>
          </div>

          {/* Number count pills */}
          <div className="flex items-center justify-center gap-1.5 px-4 py-3 border-b border-border-dark flex-shrink-0 flex-wrap">
            {numbers.map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-bg3 border border-border-dark flex items-center justify-center text-[10px] font-bold text-text2">
                {i + 1}
              </div>
            ))}
            <span className="text-[14px] font-black text-text ml-2">= ?</span>
          </div>

          {/* Calculator tool */}
          <div className="px-3 pb-1 flex-shrink-0">
            <button
              onClick={() => setShowCalc(v => !v)}
              className="w-full h-9 flex items-center justify-center gap-2 bg-bg2 border border-border-dark rounded-lg text-[12px] font-bold text-text2 active:bg-bg3 transition-colors"
            >
              <span>🧮</span>
              <span>{showCalc ? 'Tutup Kalkulator' : 'Buka Kalkulator'}</span>
              <span className="text-text3 text-[10px]">{showCalc ? '▲' : '▼'}</span>
            </button>

            {showCalc && (
              <div className="mt-2 bg-bg2 border border-border-dark rounded-xl overflow-hidden">
                {/* Display */}
                <div className="px-3 pt-3 pb-2">
                  <div className="text-[10px] font-bold text-text3 uppercase tracking-[1px] mb-1">
                    {calcOp ? `${calcPrev} ${calcOp}` : ' '}
                  </div>
                  <div className="text-right text-[32px] font-black tabular-nums text-text leading-none truncate">
                    {calcDisp}
                  </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-4 gap-[5px] p-2">
                  {/* Row 1 */}
                  <button onClick={calcClear}
                    className="col-span-2 h-11 bg-bg3 border border-border-dark rounded-lg text-[13px] font-bold text-red2 active:scale-[.91] active:bg-bg4 transition-transform">
                    C
                  </button>
                  <button onClick={() => calcOper('÷')}
                    className={`h-11 border rounded-lg text-[16px] font-bold active:scale-[.91] transition-transform ${calcOp==='÷' ? 'bg-red border-red text-white' : 'bg-bg3 border-border-dark text-text active:bg-bg4'}`}>
                    ÷
                  </button>
                  <button onClick={() => calcOper('×')}
                    className={`h-11 border rounded-lg text-[16px] font-bold active:scale-[.91] transition-transform ${calcOp==='×' ? 'bg-red border-red text-white' : 'bg-bg3 border-border-dark text-text active:bg-bg4'}`}>
                    ×
                  </button>

                  {/* Row 2 */}
                  {[7,8,9].map(n => (
                    <button key={n} onClick={() => calcNum(String(n))}
                      className="h-11 bg-bg3 border border-border-dark rounded-lg text-[17px] font-bold text-text active:scale-[.91] active:bg-bg4 transition-transform">
                      {n}
                    </button>
                  ))}
                  <button onClick={() => calcOper('-')}
                    className={`h-11 border rounded-lg text-[20px] font-bold active:scale-[.91] transition-transform ${calcOp==='-' ? 'bg-red border-red text-white' : 'bg-bg3 border-border-dark text-text active:bg-bg4'}`}>
                    −
                  </button>

                  {/* Row 3 */}
                  {[4,5,6].map(n => (
                    <button key={n} onClick={() => calcNum(String(n))}
                      className="h-11 bg-bg3 border border-border-dark rounded-lg text-[17px] font-bold text-text active:scale-[.91] active:bg-bg4 transition-transform">
                      {n}
                    </button>
                  ))}
                  <button onClick={() => calcOper('+')}
                    className={`h-11 border rounded-lg text-[20px] font-bold active:scale-[.91] transition-transform ${calcOp==='+' ? 'bg-red border-red text-white' : 'bg-bg3 border-border-dark text-text active:bg-bg4'}`}>
                    +
                  </button>

                  {/* Row 4 */}
                  {[1,2,3].map(n => (
                    <button key={n} onClick={() => calcNum(String(n))}
                      className="h-11 bg-bg3 border border-border-dark rounded-lg text-[17px] font-bold text-text active:scale-[.91] active:bg-bg4 transition-transform">
                      {n}
                    </button>
                  ))}
                  <button onClick={calcEquals}
                    className="row-span-2 h-[calc(88px+5px)] bg-red border border-red rounded-lg text-[20px] font-black text-white active:bg-red/70 transition-colors">
                    =
                  </button>

                  {/* Row 5 */}
                  <button onClick={() => calcNum('0')}
                    className="col-span-2 h-11 bg-bg3 border border-border-dark rounded-lg text-[17px] font-bold text-text active:scale-[.91] active:bg-bg4 transition-transform">
                    0
                  </button>
                  <button onClick={() => setCalcDisp(d => d.length > 1 ? d.slice(0,-1) : '0')}
                    className="h-11 bg-bg3 border border-border-dark rounded-lg text-[15px] text-text2 active:scale-[.91] active:bg-bg4 transition-transform">
                    ⌫
                  </button>
                </div>

                {/* Use result button */}
                <div className="px-2 pb-2">
                  <button onClick={useCalcResult}
                    className="w-full h-10 bg-green/20 border border-green/40 rounded-lg text-[12px] font-black text-green active:bg-green/30 transition-colors">
                    Gunakan Hasil → {calcDisp}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Numpad input */}
          <div className="p-3 flex-shrink-0">
            <div className="mb-2.5">
              <input
                type="number"
                value={ansVal}
                onChange={e => setAnsVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="—"
                inputMode="numeric"
                autoComplete="off"
                className={`w-full px-4 py-3 bg-bg2 border-2 rounded-lg text-text text-[34px] font-black text-center outline-none tabular-nums tracking-[1px] transition-colors
                  ${shake ? 'animate-shake border-red2' : 'border-border-dark focus:border-red'}`}
              />
            </div>
            <div className="grid grid-cols-3 gap-[7px]">
              {[7,8,9,4,5,6,1,2,3].map(n => (
                <button
                  key={n}
                  onClick={() => npPress(String(n))}
                  className="h-[60px] bg-bg3 border border-border-dark rounded-lg text-[22px] font-bold text-text active:scale-[.91] active:bg-bg4 transition-transform"
                >
                  {n}
                </button>
              ))}
              <button onClick={npDel}
                className="h-[60px] bg-bg3 border border-border-dark rounded-lg text-[19px] text-red2 active:scale-[.91] active:bg-bg4 transition-transform">
                ⌫
              </button>
              <button onClick={() => npPress('0')}
                className="h-[60px] bg-bg3 border border-border-dark rounded-lg text-[22px] font-bold text-text active:scale-[.91] active:bg-bg4 transition-transform">
                0
              </button>
              <button onClick={submit}
                className="h-[60px] bg-red border border-red rounded-lg text-[19px] font-black text-white active:bg-red/70 transition-colors">
                ✓
              </button>
            </div>
          </div>
        </>
      )}

      {showLS && <LineStopOverlay detail={lsDetail} onClose={handleCloseLs} />}
      {showConfetti && <Confetti />}
    </div>
  )
}
