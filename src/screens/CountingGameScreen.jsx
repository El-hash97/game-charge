import { useState, useEffect, useRef, useCallback } from 'react'
import { playSound } from '../lib/audio.js'
import Confetti from '../components/Confetti.jsx'
import LineStopOverlay from '../components/LineStopOverlay.jsx'
import { getLogs } from '../lib/storage.js'

const MIN_SUM = 1300
const FORCE_UNLOCK_PASSWORD = 'El123'

const LEVELS = [
  {
    level: 1,
    title: 'Pemula',
    desc: '8 angka · 5 dtk/angka · kelipatan 100',
    hint: 'Angka bulat ratusan, waktu santai. Cocok buat pemanasan.',
    count: 8,
    seconds: 5,
    // 100, 200, 300, 400 — avg 250, total avg 2000
    generate: () => (Math.floor(Math.random() * 4) + 1) * 100,
    colorTxt: 'text-green',
    colorBg: 'bg-green/10',
    colorBorder: 'border-green/30',
    scoreBonus: 0,
  },
  {
    level: 2,
    title: 'Mudah',
    desc: '10 angka · 4 dtk/angka · kelipatan 50',
    hint: 'Kelipatan 50, lebih banyak angka. Mulai fokus.',
    count: 10,
    seconds: 4,
    // 50–300 kelipatan 50 — avg 175, total avg 1750
    generate: () => (Math.floor(Math.random() * 6) + 1) * 50,
    colorTxt: 'text-blue',
    colorBg: 'bg-blue/10',
    colorBorder: 'border-blue/30',
    scoreBonus: 30,
  },
  {
    level: 3,
    title: 'Sedang',
    desc: '12 angka · 3 dtk/angka · kelipatan 10',
    hint: 'Kelipatan 10, makin banyak & cepat. Perlu konsentrasi.',
    count: 12,
    seconds: 3,
    // 50–200 kelipatan 10 — avg 125, total avg 1500
    generate: () => (Math.floor(Math.random() * 16) + 5) * 10,
    colorTxt: 'text-yellow',
    colorBg: 'bg-yellow/10',
    colorBorder: 'border-yellow/30',
    scoreBonus: 70,
  },
  {
    level: 4,
    title: 'Sulit',
    desc: '14 angka · 2 dtk/angka · kelipatan 5',
    hint: 'Kelipatan 5, flash kilat. Butuh strategi & memori kuat.',
    count: 14,
    seconds: 2,
    // 50–150 kelipatan 5 — avg 100, total avg 1400
    generate: () => (Math.floor(Math.random() * 21) + 10) * 5,
    colorTxt: 'text-red2',
    colorBg: 'bg-red/10',
    colorBorder: 'border-red/30',
    scoreBonus: 150,
  },
  {
    level: 5,
    title: 'Ekstrem',
    desc: '16 angka · 1.5 dtk/angka · sembarang',
    hint: 'Angka bebas 50–150, 16 flash kilat. Batas kemampuan!',
    count: 16,
    seconds: 1.5,
    // 50–150 sembarang — avg 100, total avg 1600
    generate: () => Math.floor(Math.random() * 101) + 50,
    colorTxt: 'text-red',
    colorBg: 'bg-red/10',
    colorBorder: 'border-red/30',
    scoreBonus: 300,
  },
]

function generateNumbers(levelCfg) {
  let nums
  do {
    nums = Array.from({ length: levelCfg.count }, () => levelCfg.generate())
  } while (nums.reduce((a, b) => a + b, 0) < MIN_SUM)
  return nums
}

function isLevelUnlocked(level, noreg) {
  if (level <= 1) return true
  return getLogs().some(l =>
    l.noreg === noreg && l.mode === 'counting' && l.level === level - 1 && l.lineStop === false
  )
}

export default function CountingGameScreen({ config, currentUser, onEnd, onQuit, showToast }) {
  // phase: 'select' | 'watching' | 'inputting'
  const [phase, setPhase]           = useState('select')
  const [levelCfg, setLevelCfg]     = useState(null)
  const [numbers, setNumbers]       = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [countdown, setCountdown]   = useState(0)
  const [animKey, setAnimKey]       = useState(0)
  const [prevNum, setPrevNum]       = useState(null)

  // Level lock state
  const [unlockTarget, setUnlockTarget] = useState(null) // level cfg pending password entry
  const [pwInput, setPwInput]           = useState('')
  const [pwError, setPwError]           = useState(false)

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

  const startTime    = useRef(Date.now())
  const exitTimerRef = useRef(null)

  function selectLevel(cfg) {
    const nums = generateNumbers(cfg)
    setLevelCfg(cfg)
    setNumbers(nums)
    setCurrentIdx(0)
    setPrevNum(null)
    setCountdown(Math.ceil(cfg.seconds))
    setAnimKey(0)
    startTime.current = Date.now()
    setPhase('watching')
  }

  function openUnlockModal(cfg) {
    setUnlockTarget(cfg)
    setPwInput('')
    setPwError(false)
  }

  function closeUnlockModal() {
    setUnlockTarget(null)
    setPwInput('')
    setPwError(false)
  }

  function submitUnlock() {
    if (pwInput === FORCE_UNLOCK_PASSWORD) {
      const cfg = unlockTarget
      closeUnlockModal()
      selectLevel(cfg)
    } else {
      setPwError(true)
      showToast('Password salah!')
    }
  }

  useEffect(() => {
    if (phase !== 'watching' || !levelCfg) return

    // Show previous number exiting upward for 360ms
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    if (currentIdx > 0) {
      setPrevNum(numbers[currentIdx - 1])
      exitTimerRef.current = setTimeout(() => setPrevNum(null), 620)
    } else {
      setPrevNum(null)
    }

    setCountdown(Math.ceil(levelCfg.seconds))
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
    }, levelCfg.seconds * 1000)

    return () => {
      clearInterval(tick)
      clearTimeout(advance)
    }
  }, [phase, currentIdx, numbers.length, levelCfg])

  const total = numbers.reduce((a, b) => a + b, 0)

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
          score:        100 + (levelCfg?.scoreBonus ?? 0) + numbers.length * 10,
          maxStreak:    numbers.length,
          totalAnswers: 1,
          wrongAnswers: 0,
          lineStop:     false,
          duration,
          level:        levelCfg?.level ?? 1,
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
  }, [ansVal, total, numbers, onEnd, showToast, levelCfg])

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
      level:        levelCfg?.level ?? 1,
    })
  }

  function npPress(n) { setAnsVal(v => v.length < 6 ? v + n : v) }
  function npDel()    { setAnsVal(v => v.slice(0, -1)) }

  const currentNum = numbers[currentIdx] ?? 0

  // ─── Level Select ────────────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className="min-h-[100dvh] bg-bg flex flex-col">
        <div className="sticky top-0 z-20 bg-bg2 border-b border-border-dark px-4 h-[52px] flex items-center gap-3 flex-shrink-0">
          <button onClick={onQuit} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-xl font-light active:bg-bg3 active:text-text transition-colors">‹</button>
          <div className="flex-1 min-w-0">
            <h2 className="text-[13px] font-black leading-tight">🔢 Mode Hitung</h2>
            <p className="text-[10px] text-text2 mt-[1px]">Pilih tingkat kesulitan</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          <p className="text-[11px] font-bold text-text2 uppercase tracking-[1.2px] mb-1">Pilih Level</p>

          {LEVELS.map(cfg => {
            const unlocked = isLevelUnlocked(cfg.level, currentUser?.noreg)
            if (unlocked) {
              return (
                <button
                  key={cfg.level}
                  onClick={() => selectLevel(cfg)}
                  className={`flex items-start gap-4 ${cfg.colorBg} border ${cfg.colorBorder} rounded-xl p-4 text-left w-full active:scale-[.98] transition-all`}
                >
                  <div className={`w-11 h-11 rounded-xl bg-bg2 border ${cfg.colorBorder} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-[15px] font-black tabular-nums ${cfg.colorTxt}`}>{cfg.level}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[14px] font-black ${cfg.colorTxt}`}>{cfg.title}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.colorBg} border ${cfg.colorBorder} ${cfg.colorTxt}`}>
                        +{cfg.scoreBonus} bonus
                      </span>
                    </div>
                    <div className="text-[11px] font-semibold text-text mb-1">{cfg.desc}</div>
                    <div className="text-[10px] text-text2 leading-relaxed">{cfg.hint}</div>
                  </div>
                  <span className="text-text3 text-lg flex-shrink-0">›</span>
                </button>
              )
            }
            return (
              <div
                key={cfg.level}
                className="flex items-start gap-4 bg-bg2 border border-border-dark rounded-xl p-4 text-left w-full opacity-60"
              >
                <div className="w-11 h-11 rounded-xl bg-bg3 border border-border-dark flex items-center justify-center flex-shrink-0">
                  <span className="text-[15px] text-text3">🔒</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[14px] font-black text-text2">{cfg.title}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-text2 mb-1">{cfg.desc}</div>
                  <div className="text-[10px] text-text3 leading-relaxed mb-2">Selesaikan Level {cfg.level - 1} dulu</div>
                  <button
                    onClick={() => openUnlockModal(cfg)}
                    className="text-[10px] font-bold text-text2 underline underline-offset-2 active:text-text transition-colors"
                  >
                    🔒 Buka dengan password
                  </button>
                </div>
              </div>
            )
          })}

          <div className="mt-2 px-1">
            <p className="text-[10px] text-text3 text-center">
              Total target max ≈ 2000 · Skor lebih tinggi di level sulit
            </p>
          </div>
        </div>

        {unlockTarget && (
          <div className="fixed inset-0 z-30 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-bg2 border border-border-dark rounded-2xl p-5 w-full max-w-[300px]">
              <p className="text-[13px] font-black mb-1">Buka Paksa Level {unlockTarget.level}</p>
              <p className="text-[11px] text-text2 mb-3">Masukkan password untuk membuka level ini satu kali main.</p>
              <input
                type="password"
                value={pwInput}
                onChange={e => { setPwInput(e.target.value); setPwError(false) }}
                onKeyDown={e => e.key === 'Enter' && submitUnlock()}
                autoFocus
                className={`w-full px-3 py-2.5 bg-bg3 border-2 rounded-lg text-text text-[15px] font-bold text-center outline-none transition-colors
                  ${pwError ? 'border-red2' : 'border-border-dark focus:border-red'}`}
              />
              {pwError && <p className="text-[10px] text-red2 mt-1.5 text-center">Password salah!</p>}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={closeUnlockModal}
                  className="flex-1 h-11 bg-bg3 border border-border-dark rounded-lg text-[12px] font-bold text-text2 active:bg-bg4 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={submitUnlock}
                  className="flex-1 h-11 bg-red border border-red rounded-lg text-[12px] font-black text-white active:bg-red/70 transition-colors"
                >
                  Buka
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Watching / Inputting ────────────────────────────────────────
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
        <div className={`flex items-center gap-1 ${levelCfg?.colorBg} border ${levelCfg?.colorBorder} rounded-full px-2.5 py-1 text-[11px] font-bold ${levelCfg?.colorTxt} flex-shrink-0`}>
          Lv.{levelCfg?.level} {levelCfg?.title}
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
            <div className="flex gap-1.5 flex-wrap justify-end max-w-[60%]">
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
            <div className="relative w-full max-w-[280px] h-[180px] bg-bg2 border-2 border-border-dark rounded-2xl overflow-hidden">
              {/* Gradient overlays */}
              <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-bg2 to-transparent z-20 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-bg2 to-transparent z-20 pointer-events-none" />

              {/* Exiting number — slides out upward */}
              {prevNum !== null && (
                <div className="animate-scrollOutTop absolute inset-0 flex items-center justify-center z-10">
                  <div className="text-center">
                    <div className="text-[88px] font-black leading-none tabular-nums tracking-[-3px] text-text">
                      {prevNum}
                    </div>
                    <div className="text-[18px] text-text2 mt-1">kg</div>
                  </div>
                </div>
              )}

              {/* Entering number — slides in from below */}
              <div key={animKey} className="animate-scrollInBottom absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="text-[88px] font-black leading-none tabular-nums tracking-[-3px] text-text">
                    {currentNum}
                  </div>
                  <div className="text-[18px] text-text2 mt-1">kg</div>
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div className="mt-8 flex flex-col items-center gap-2">
              <div className={`text-[42px] font-black tabular-nums leading-none ${countdown <= 1 ? 'text-red animate-countPulse' : 'text-text2'}`}>
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
                    {calcOp ? `${calcPrev} ${calcOp}` : ' '}
                  </div>
                  <div className="text-right text-[32px] font-black tabular-nums text-text leading-none truncate">
                    {calcDisp}
                  </div>
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-4 gap-[5px] p-2">
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

                  <button onClick={() => calcNum('0')}
                    className="col-span-2 h-11 bg-bg3 border border-border-dark rounded-lg text-[17px] font-bold text-text active:scale-[.91] active:bg-bg4 transition-transform">
                    0
                  </button>
                  <button onClick={() => setCalcDisp(d => d.length > 1 ? d.slice(0,-1) : '0')}
                    className="h-11 bg-bg3 border border-border-dark rounded-lg text-[15px] text-text2 active:scale-[.91] active:bg-bg4 transition-transform">
                    ⌫
                  </button>
                </div>

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
