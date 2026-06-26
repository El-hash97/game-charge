import { useState, useEffect, useRef, useCallback } from 'react'
import { DEFAULT_TAKT_TIME, DEFAULT_MIN_SCRAP, generateMaterials, fmtTime, calcScore } from '../lib/game.js'
import { playSound } from '../lib/audio.js'
import Confetti from '../components/Confetti.jsx'
import LineStopOverlay from '../components/LineStopOverlay.jsx'

export default function GameScreen({ config, onEnd, onQuit, showToast }) {
  const { mode, target, timerSeconds = DEFAULT_TAKT_TIME, minScrap = DEFAULT_MIN_SCRAP } = config

  const [gs, setGs] = useState(() => ({
    materials:    generateMaterials(target, minScrap),
    idx:          0,
    accumulated:  0,
    score:        0,
    streak:       0,
    maxStreak:    0,
    totalAnswers: 0,
    wrongAnswers: 0,
    lineStop:     false,
    done:         false,
    startTime:    Date.now(),
    timeLeft:     timerSeconds,
  }))

  const [ansVal, setAnsVal]             = useState('')
  const [feedback, setFeedback]         = useState(null)
  const [shake, setShake]               = useState(false)
  const [showLS, setShowLS]             = useState(false)
  const [lsDetail, setLsDetail]         = useState('')
  const [showConfetti, setShowConfetti] = useState(false)

  const timerRef = useRef(null)
  const gsRef    = useRef(gs)
  gsRef.current  = gs

  useEffect(() => {
    if (mode !== 'challenge') return
    timerRef.current = setInterval(() => {
      const s = gsRef.current
      if (s.done) { clearInterval(timerRef.current); return }
      const next = s.timeLeft - 1
      if (next <= 0) {
        clearInterval(timerRef.current)
        const detail = `Waktu habis sebelum target tercapai!\nAkumulasi : ${s.accumulated} kg\nTarget    : ${target} kg\nKurang    : ${target - s.accumulated} kg`
        setGs(prev => ({ ...prev, timeLeft: 0, lineStop: true, done: true }))
        setLsDetail(detail)
        setShowLS(true)
        playSound('linestop')
      } else {
        setGs(prev => ({ ...prev, timeLeft: next }))
      }
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [mode, target])

  const submit = useCallback(() => {
    const s = gsRef.current
    if (s.done) return
    const answer = parseInt(ansVal)
    if (isNaN(answer) || answer <= 0) { showToast('Masukkan angka!'); return }

    const mat     = s.materials[s.idx]
    const correct = s.accumulated + mat

    if (answer === correct) {
      const newStreak    = s.streak + 1
      const newMaxStreak = Math.max(s.maxStreak, newStreak)
      const pts          = calcScore(newStreak, mode, s.timeLeft)
      const newAcc       = s.accumulated + mat
      const newIdx       = s.idx + 1
      playSound('correct')

      if (newIdx >= s.materials.length) {
        clearInterval(timerRef.current)
        const finalScore = s.score + pts + 50
        setShowConfetti(true)
        setTimeout(() => {
          setShowConfetti(false)
          onEnd({
            mode, target,
            score:        finalScore,
            maxStreak:    newMaxStreak,
            totalAnswers: s.totalAnswers + 1,
            wrongAnswers: s.wrongAnswers,
            lineStop:     false,
            duration:     Math.round((Date.now() - s.startTime) / 1000),
          })
        }, 1800)
        setGs(prev => ({ ...prev, accumulated: newAcc, idx: newIdx, streak: newStreak, maxStreak: newMaxStreak, score: finalScore, totalAnswers: prev.totalAnswers + 1, done: true }))
      } else {
        setAnsVal('')
        setFeedback({ ok: true, prev: s.accumulated, add: mat, res: correct, streak: newStreak })
        setGs(prev => ({
          ...prev,
          accumulated:  newAcc,
          idx:          newIdx,
          streak:       newStreak,
          maxStreak:    newMaxStreak,
          score:        prev.score + pts,
          totalAnswers: prev.totalAnswers + 1,
        }))
      }
    } else {
      playSound('wrong')
      setShake(true)
      setTimeout(() => setShake(false), 380)
      setFeedback({ ok: false, prev: s.accumulated, add: mat, res: correct, wrong: answer })

      if (mode === 'challenge') {
        clearInterval(timerRef.current)
        const detail = `Input kamu   : ${answer} kg\nJawaban benar: ${correct} kg\nAkumulasi    : ${s.accumulated} kg\nScrap #${s.idx + 1}     : ${mat} kg\nSelisih      : ${Math.abs(answer - correct)} kg`
        setLsDetail(detail)
        setShowLS(true)
        setGs(prev => ({ ...prev, lineStop: true, done: true, wrongAnswers: prev.wrongAnswers + 1, totalAnswers: prev.totalAnswers + 1, streak: 0 }))
        playSound('linestop')
      } else {
        setAnsVal('')
        setGs(prev => ({ ...prev, wrongAnswers: prev.wrongAnswers + 1, totalAnswers: prev.totalAnswers + 1, streak: 0 }))
      }
    }
  }, [ansVal, mode, target, onEnd, showToast])

  function npPress(n) { setAnsVal(v => v.length < 6 ? v + n : v); setFeedback(null) }
  function npDel()    { setAnsVal(v => v.slice(0, -1)) }

  function handleCloseLs() {
    setShowLS(false)
    const s = gsRef.current
    onEnd({
      mode, target,
      score:        s.score,
      maxStreak:    s.maxStreak,
      totalAnswers: s.totalAnswers,
      wrongAnswers: s.wrongAnswers,
      lineStop:     true,
      duration:     Math.round((Date.now() - s.startTime) / 1000),
    })
  }

  const mat  = gs.materials[gs.idx] ?? 0
  const pct  = Math.min(100, Math.round((gs.accumulated / target) * 100))
  const rem  = target - gs.accumulated
  const bCls = pct >= 85 ? 'bg-red' : pct >= 50 ? 'bg-yellow' : 'bg-green'

  return (
    <div className="min-h-[100dvh] bg-bg flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg2 border-b border-border-dark px-4 h-[52px] flex items-center gap-3 flex-shrink-0">
        <button onClick={onQuit} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-xl font-light active:bg-bg3 active:text-text transition-colors">‹</button>
        <div className="flex-1 min-w-0">
          <h2 className="text-[13px] font-black leading-tight">{mode === 'training' ? '📚 Mode Latihan' : '⚡ Takt Time'}</h2>
          <p className="text-[10px] text-text2 mt-[1px]">Target Scrap: {target} kg</p>
        </div>
        {gs.streak > 0 && (
          <div className="flex items-center gap-1 bg-red/10 border border-red/30 rounded-full px-2.5 py-1 text-[12px] font-black text-red flex-shrink-0">
            🔥 {gs.streak}
          </div>
        )}
      </div>

      {/* HUD */}
      <div className="grid grid-cols-3 bg-bg2 border-b border-border-dark px-4 py-2.5 flex-shrink-0">
        <div className="flex flex-col">
          <div className="text-[9px] font-bold text-text2 uppercase tracking-[1.5px] mb-0.5">Akumulasi</div>
          <div className="text-[30px] font-black leading-none tabular-nums">{gs.accumulated}</div>
          <div className="text-[11px] text-text2 mt-0.5">kg</div>
        </div>
        <div className="flex flex-col items-center justify-center px-3">
          <div className="text-[11px] font-bold text-text2 mb-1">{pct}%</div>
          <div className="w-[72px] h-1 bg-bg3 rounded-full overflow-hidden mb-1">
            <div className={`h-full rounded-full transition-all ${bCls}`} style={{ width: `${pct}%` }} />
          </div>
          {mode === 'challenge' ? (
            <div className={`text-[20px] font-black tabular-nums leading-none ${gs.timeLeft <= 15 ? 'text-red2 animate-blink' : 'text-yellow'}`}>
              {fmtTime(gs.timeLeft)}
            </div>
          ) : (
            <div className="text-[10px] text-text3 tabular-nums tracking-[0.5px]">
              Scrap {gs.idx + 1} / {gs.materials.length}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end">
          <div className="text-[9px] font-bold text-text2 uppercase tracking-[1.5px] mb-0.5">Sisa</div>
          <div className="text-[30px] font-black leading-none tabular-nums">{rem}</div>
          <div className="text-[11px] text-text2 mt-0.5">kg</div>
        </div>
      </div>

      {/* Material panel */}
      <div className="text-center px-4 py-5 border-b border-border-dark flex-shrink-0">
        <div className="text-[10px] font-bold text-red uppercase tracking-[1.5px] mb-2">Scrap #{gs.idx + 1} — Diangkat Crane</div>
        <div className="text-[72px] font-black leading-none tabular-nums tracking-[-2px]">{mat}</div>
        <div className="text-[22px] text-text2 mt-0.5">kg</div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`mx-4 mt-3 rounded-lg px-3 py-3 animate-fbIn flex-shrink-0 ${feedback.ok ? 'bg-green/10 border border-green/25' : 'bg-red/10 border border-red/25'}`}>
          <div className={`text-[12px] font-black mb-1.5 ${feedback.ok ? 'text-green' : 'text-red2'}`}>
            {feedback.ok
              ? `Benar!${feedback.streak > 1 ? ' 🔥 Streak x' + feedback.streak : ''}`
              : `Salah — kamu: ${feedback.wrong} kg`}
          </div>
          <div className="text-[12px] text-text2 leading-loose tabular-nums">
            <strong className="text-text">{feedback.prev}</strong>
            {' + '}
            <strong className="text-text">{feedback.add}</strong>
            {' = '}
            <span className={`font-black text-sm ${feedback.ok ? 'text-green' : 'text-red'}`}>{feedback.res} kg</span>
          </div>
        </div>
      )}

      {/* Question bar */}
      <div className="flex items-center justify-center gap-2 px-4 py-2.5 border-t border-b border-border-dark bg-bg2 mt-3 flex-shrink-0">
        <span className="text-[13px] text-text2">Akumulasi + scrap ini</span>
        <span className="text-[14px] font-black text-red tabular-nums">{gs.accumulated} + {mat} = ?</span>
      </div>

      {/* Input + Numpad */}
      <div className="p-3 flex-shrink-0">
        <div className="mb-2.5">
          <input
            type="number"
            value={ansVal}
            onChange={e => { setAnsVal(e.target.value); setFeedback(null) }}
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

      {showLS && <LineStopOverlay detail={lsDetail} onClose={handleCloseLs} />}
      {showConfetti && <Confetti />}
    </div>
  )
}
