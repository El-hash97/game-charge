# Mobile Game Feel Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Charging Simulator feel like a mobile game (tap feedback, screen transitions, celebration effects, progress/reward visuals, haptics) across all 8 screens, per `docs/superpowers/specs/2026-07-01-mobile-game-feel-design.md`.

**Architecture:** Three new shared modules (`haptics.js`, `Btn.jsx`, `ScreenTransition.jsx`) plus incremental per-screen retrofits of existing buttons and progress bars. Pure vanilla CSS keyframes + React state, no new dependencies.

**Tech Stack:** React 18, Vite, Tailwind CSS 3. No test runner exists in this project (`package.json` has no test script) — verification is manual via `npm run dev` and browser/devtools mobile emulation, as specified in the spec's Testing section.

## Global Constraints

- No new npm dependencies (no Framer Motion, no animation libs) — spec Non-goals.
- No color palette change — stays dark/industrial (`bg`, `bg2`, `bg3`, `red`, `red2`, `green`, `yellow`, `blue` tokens from `tailwind.config.js`).
- No changes to scoring/level/timer logic in `src/lib/game.js` or any `src/lib/storage.js` data shape.
- Every button's existing `onClick` behavior must be preserved exactly — only the visual/haptic wrapper changes.
- Haptics use `navigator.vibrate()`, no-op safely when unsupported (desktop browsers, most iOS Safari).

---

### Task 1: Haptics utility + new CSS keyframes

**Files:**
- Create: `src/lib/haptics.js`
- Modify: `src/index.css` (append new keyframes after line 71)

**Interfaces:**
- Produces: `vibrate(type)` from `src/lib/haptics.js`, `type` is one of `'tap' | 'correct' | 'wrong' | 'linestop' | 'levelup'`. Used by `Btn.jsx` (Task 2) and directly in gameplay screens (Tasks 5, 6).
- Produces: CSS classes `.animate-screenIn`, `.animate-shakeSm`, `.animate-flashG`, `.animate-shine`, `.animate-glowPulse`, `.animate-shimmer`. Used by Tasks 3–8.

- [ ] **Step 1: Create `src/lib/haptics.js`**

```js
const PATTERNS = {
  tap:      10,
  correct:  15,
  wrong:    [20, 40, 20],
  linestop: [40, 60, 40, 60, 80],
  levelup:  [15, 30, 15, 30, 40],
}

export function vibrate(type) {
  try {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return
    const pattern = PATTERNS[type]
    if (!pattern) return
    navigator.vibrate(pattern)
  } catch (e) {}
}
```

- [ ] **Step 2: Append new keyframes to `src/index.css`**

Add after the existing `.animate-countPulse` line (end of file):

```css
@keyframes screenIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: none; }
}
@keyframes shakeSm {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-3px); }
  50%      { transform: translateX(3px); }
  75%      { transform: translateX(-2px); }
}
@keyframes flashG {
  0%   { background: rgba(34,197,94,.35); }
  100% { background: rgba(0,0,0,0); }
}
@keyframes shine {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
}
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 0 rgba(224,32,32,0); }
  50%      { box-shadow: 0 0 14px rgba(224,32,32,.25); }
}
@keyframes shimmer {
  0%   { background-position: -60px 0; }
  100% { background-position: 60px 0; }
}

.animate-screenIn  { animation: screenIn 0.28s ease-out both; }
.animate-shakeSm   { animation: shakeSm 0.3s ease; }
.animate-flashG    { animation: flashG 0.5s ease; }
.animate-shine      { animation: shine 1.1s ease-in-out; }
.animate-glowPulse  { animation: glowPulse 3s ease-in-out infinite; }
.animate-shimmer {
  background-image: linear-gradient(110deg, transparent 40%, rgba(255,255,255,.5) 50%, transparent 60%);
  background-size: 200% 100%;
  animation: shimmer 2.2s linear infinite;
}
```

- [ ] **Step 3: Verify no build errors**

Run: `npm run dev`
Expected: Vite dev server starts with no CSS parse errors in terminal output.

- [ ] **Step 4: Commit**

```bash
git add src/lib/haptics.js src/index.css
git commit -m "feat: add haptics utility and juicy-feel CSS keyframes"
```

---

### Task 2: `Btn` reusable button component

**Files:**
- Create: `src/components/Btn.jsx`

**Interfaces:**
- Consumes: `vibrate(type)` from `src/lib/haptics.js` (Task 1).
- Produces: `<Btn variant="primary"|"secondary"|"ghost"|"numpad" haptic="tap"|...|null onClick className children ...rest />` — a drop-in replacement for `<button>`. Used by every retrofit task (3–8).

- [ ] **Step 1: Create `src/components/Btn.jsx`**

```jsx
import { vibrate } from '../lib/haptics.js'

const VARIANT_BASE = {
  primary:   'shadow-[0_3px_0_rgba(0,0,0,.4)] active:shadow-none active:translate-y-[1px]',
  secondary: 'shadow-[0_2px_0_rgba(0,0,0,.35)] active:shadow-none active:translate-y-[1px]',
  ghost:     '',
  numpad:    'shadow-[0_2px_0_rgba(0,0,0,.35)] active:shadow-none active:translate-y-[1px] active:brightness-125',
}

export default function Btn({
  variant = 'secondary',
  haptic = 'tap',
  onClick,
  className = '',
  children,
  ...rest
}) {
  function handleClick(e) {
    if (haptic) vibrate(haptic)
    onClick?.(e)
  }

  return (
    <button
      onClick={handleClick}
      className={`active:scale-[.96] transition-all duration-100 ease-out ${VARIANT_BASE[variant] ?? ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Verify no build errors**

Run: `npm run dev`
Expected: no import errors; app still loads to login screen.

- [ ] **Step 3: Commit**

```bash
git add src/components/Btn.jsx
git commit -m "feat: add reusable Btn component with tap feedback and haptics"
```

---

### Task 3: `ScreenTransition` wrapper + wire into `App.jsx`

**Files:**
- Create: `src/components/ScreenTransition.jsx`
- Modify: `src/App.jsx:108-179`

**Interfaces:**
- Consumes: nothing external.
- Produces: `<ScreenTransition screenKey={string}>{children}</ScreenTransition>` wrapping the active screen's subtree so it replays `.animate-screenIn` on every `screenKey` change.

- [ ] **Step 1: Create `src/components/ScreenTransition.jsx`**

```jsx
export default function ScreenTransition({ screenKey, children }) {
  return (
    <div key={screenKey} className="animate-screenIn">
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Wire into `src/App.jsx`**

Import at top (after existing imports, before the `App` function):

```js
import ScreenTransition from './components/ScreenTransition.jsx'
```

Replace the return block (`App.jsx:108-179`) — wrap only the screen-switch content, not the modal/toast overlays (they must not replay the entrance animation when the underlying screen re-renders):

```jsx
  return (
    <div className="min-h-[100dvh] bg-bg font-sans text-text antialiased">
      <ScreenTransition screenKey={screen}>
        {screen === 'login'       && <LoginScreen onLogin={doLogin} />}
        {screen === 'dashboard'   && (
          <DashboardScreen
            currentUser={currentUser}
            onMode={openTargetModal}
            onLogout={doLogout}
            onLeaderboard={() => setScreen('leaderboard')}
            onSettings={() => setScreen('settings')}
            onPerformance={() => setScreen('performance')}
            showToast={showToast}
          />
        )}
        {screen === 'game' && gameConfig?.mode !== 'counting' && (
          <GameScreen
            config={gameConfig}
            currentUser={currentUser}
            onEnd={handleGameEnd}
            onQuit={goToDashboard}
            showToast={showToast}
          />
        )}
        {screen === 'game' && gameConfig?.mode === 'counting' && (
          <CountingGameScreen
            config={gameConfig}
            currentUser={currentUser}
            onEnd={handleGameEnd}
            onQuit={goToDashboard}
            showToast={showToast}
          />
        )}
        {screen === 'result' && (
          <ResultScreen
            result={gameResult}
            onPlayAgain={playAgain}
            onDashboard={goToDashboard}
          />
        )}
        {screen === 'leaderboard' && (
          <LeaderboardScreen
            currentUser={currentUser}
            onBack={goToDashboard}
            showToast={showToast}
          />
        )}
        {screen === 'settings' && (
          <SettingsScreen
            onBack={goToDashboard}
            showToast={showToast}
          />
        )}
        {screen === 'performance' && (
          <PerformanceScreen
            currentUser={currentUser}
            onBack={goToDashboard}
          />
        )}
      </ScreenTransition>

      {showModal && (
        <TargetModal
          mode={pendingMode}
          onConfirm={confirmTarget}
          onClose={() => setShowModal(false)}
          showToast={showToast}
        />
      )}

      {toast && <Toast msg={toast} />}
    </div>
  )
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open in browser.
Expected: navigating login → dashboard → any mode → back shows a fade+slide-up entrance on each screen change; no flash-of-unstyled-content or double-animation on re-renders within the same screen (e.g. typing in an input should NOT retrigger the animation — confirm by typing in TargetModal or an input field and observing no visual "jump").

- [ ] **Step 4: Commit**

```bash
git add src/components/ScreenTransition.jsx src/App.jsx
git commit -m "feat: add screen transition animation on navigation"
```

---

### Task 4: Retrofit Login + Dashboard screens

**Files:**
- Modify: `src/screens/LoginScreen.jsx:54-59`
- Modify: `src/screens/DashboardScreen.jsx:26-29, 66-98`

**Interfaces:**
- Consumes: `Btn` from `../components/Btn.jsx` (Task 2).

- [ ] **Step 1: Retrofit `LoginScreen.jsx` submit button**

Add import at top: `import Btn from '../components/Btn.jsx'`

Replace lines 54-59:
```jsx
        <Btn
          variant="primary"
          onClick={() => onLogin(name.trim(), noreg.trim())}
          className="w-full py-4 bg-red text-white font-black text-sm uppercase tracking-widest rounded-lg"
        >
          MASUK &amp; MULAI LATIHAN
        </Btn>
```

- [ ] **Step 2: Retrofit `DashboardScreen.jsx` header icon buttons and mode cards**

Add import at top: `import Btn from '../components/Btn.jsx'`

Replace lines 26-29 (header icons — `variant="ghost"`, no shadow needed for small icon buttons):
```jsx
        <Btn variant="ghost" onClick={onPerformance} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-base active:bg-bg3 active:text-text">📊</Btn>
        <Btn variant="ghost" onClick={onLeaderboard} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-base active:bg-bg3 active:text-text">🏆</Btn>
        <Btn variant="ghost" onClick={onSettings}   className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-base active:bg-bg3 active:text-text">⚙️</Btn>
        <Btn variant="ghost" onClick={onLogout}     className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-sm   active:bg-bg3 active:text-text">⏏</Btn>
```

Replace the three mode-card buttons (lines 66-98) — add `animate-glowPulse` and swap to `Btn variant="secondary"`, keeping each card's existing layout/content untouched, only the outer element and haptic change:
```jsx
          <Btn
            variant="secondary"
            onClick={() => onMode('training')}
            className="flex items-center gap-4 bg-bg2 border border-border-dark rounded-xl p-4 text-left w-full active:border-red animate-glowPulse"
          >
            <div className="w-12 h-12 rounded-xl bg-blue/10 flex items-center justify-center text-2xl flex-shrink-0">📚</div>
            <div className="flex-1">
              <div className="text-sm font-black mb-1">Mode Latihan</div>
              <div className="text-[12px] text-text2 leading-snug">Tanpa timer. Fokus akurasi kalkulasi. Feedback detail tiap langkah.</div>
            </div>
            <span className="text-text3 text-lg">›</span>
          </Btn>
          <Btn
            variant="secondary"
            onClick={() => onMode('challenge')}
            className="flex items-center gap-4 bg-bg2 border border-border-dark rounded-xl p-4 text-left w-full active:border-red animate-glowPulse"
          >
            <div className="w-12 h-12 rounded-xl bg-red/10 flex items-center justify-center text-2xl flex-shrink-0">⚡</div>
            <div className="flex-1">
              <div className="text-sm font-black mb-1">Takt Time Challenge</div>
              <div className="text-[12px] text-text2 leading-snug">Timer {settings.timerSeconds} detik · Min {settings.minScrap}x scrap. Simulasi tekanan produksi nyata. Awas LINE STOP!</div>
            </div>
            <span className="text-text3 text-lg">›</span>
          </Btn>
          <Btn
            variant="secondary"
            onClick={() => onMode('counting')}
            className="flex items-center gap-4 bg-bg2 border border-border-dark rounded-xl p-4 text-left w-full active:border-red animate-glowPulse"
          >
            <div className="w-12 h-12 rounded-xl bg-yellow/10 flex items-center justify-center text-2xl flex-shrink-0">🔢</div>
            <div className="flex-1">
              <div className="text-sm font-black mb-1">Mode Hitung</div>
              <div className="text-[12px] text-text2 leading-snug">Level 1–5 · Makin sulit, makin banyak angka & makin cepat. Hafal lalu jumlahkan!</div>
            </div>
            <span className="text-text3 text-lg">›</span>
          </Btn>
```

- [ ] **Step 3: Streak badge on Dashboard is static, no pop needed here**

The streak badge (line 42-44) reflects `stats.streak` on page load — no live increment happens on this screen (streak only changes during gameplay). No pop-trigger logic is needed here; leave as-is. (Streak pop-on-increment is implemented on `GameScreen`, Task 5.)

- [ ] **Step 4: Manual verification**

Run: `npm run dev`. On Login, tap submit — button should visibly depress (shadow disappears, moves down 1px) then release. On Dashboard, tap each header icon and each mode card — same depress feedback; mode cards should show a slow, subtle red glow pulse when idle.

- [ ] **Step 5: Commit**

```bash
git add src/screens/LoginScreen.jsx src/screens/DashboardScreen.jsx
git commit -m "feat: retrofit Login and Dashboard buttons with Btn tap feedback"
```

---

### Task 5: Retrofit `GameScreen` — numpad, streak shake/flash, progress shine, haptics

**Files:**
- Modify: `src/screens/GameScreen.jsx`

**Interfaces:**
- Consumes: `Btn` (Task 2), `vibrate` from `../lib/haptics.js` (Task 1).
- Produces: local state `streakFx` (bool) — not consumed elsewhere, purely visual.

- [ ] **Step 1: Add imports**

At top of `GameScreen.jsx`, add:
```js
import Btn from '../components/Btn.jsx'
import { vibrate } from '../lib/haptics.js'
```

- [ ] **Step 2: Add streak-flash local state**

After the existing `const [showConfetti, setShowConfetti] = useState(false)` line (line 30), add:
```js
  const [streakFx, setStreakFx] = useState(false)
```

- [ ] **Step 3: Trigger flash/shake + haptics in `submit()`**

In the correct-answer branch of `submit` (around line 65-102), after `playSound('correct')` (line 71), add:
```js
      vibrate('correct')
      if (newStreak >= 3) {
        setStreakFx(true)
        setTimeout(() => setStreakFx(false), 500)
      }
```

In the wrong-answer branch (around line 103-120), after `playSound('wrong')` (line 104), add:
```js
      vibrate('wrong')
```

At the two places `playSound('linestop')` is called (line 48 in the timer-expiry effect, line 115 in the wrong-answer/challenge branch), add `vibrate('linestop')` immediately after each.

- [ ] **Step 4: Render the flash/shake effect**

Change the root `<div>` (line 146) className to conditionally include the new classes:
```jsx
    <div className={`min-h-[100dvh] bg-bg flex flex-col ${streakFx ? 'animate-flashG animate-shakeSm' : ''}`}>
```

- [ ] **Step 5: Add shine sweep to accumulation progress bar**

The progress bar is at lines 170-172:
```jsx
          <div className="w-[72px] h-1 bg-bg3 rounded-full overflow-hidden mb-1">
            <div className={`h-full rounded-full transition-all ${bCls}`} style={{ width: `${pct}%` }} />
          </div>
```
Replace with (adds a relatively-positioned shine overlay that replays via `key={pct}` whenever percentage changes):
```jsx
          <div className="w-[72px] h-1 bg-bg3 rounded-full overflow-hidden mb-1 relative">
            <div className={`h-full rounded-full transition-all duration-500 ease-out ${bCls}`} style={{ width: `${pct}%` }} />
            <div key={pct} className="absolute inset-0 animate-shine pointer-events-none" />
          </div>
```

- [ ] **Step 6: Retrofit numpad, submit, and header back button**

Replace the numpad block (lines 236-258):
```jsx
        <div className="grid grid-cols-3 gap-[7px]">
          {[7,8,9,4,5,6,1,2,3].map(n => (
            <Btn
              key={n}
              variant="numpad"
              onClick={() => npPress(String(n))}
              className="h-[60px] bg-bg3 border border-border-dark rounded-lg text-[22px] font-bold text-text"
            >
              {n}
            </Btn>
          ))}
          <Btn variant="numpad" onClick={npDel}
            className="h-[60px] bg-bg3 border border-border-dark rounded-lg text-[19px] text-red2">
            ⌫
          </Btn>
          <Btn variant="numpad" onClick={() => npPress('0')}
            className="h-[60px] bg-bg3 border border-border-dark rounded-lg text-[22px] font-bold text-text">
            0
          </Btn>
          <Btn variant="primary" haptic={null} onClick={submit}
            className="h-[60px] bg-red border border-red rounded-lg text-[19px] font-black text-white">
            ✓
          </Btn>
        </div>
```
(The submit `✓` button uses `haptic={null}` because `submit()` already calls `vibrate('correct'|'wrong')` itself per Step 3 — avoids a double-vibrate on every submit.)

Also retrofit the header back button (line 149):
```jsx
        <Btn variant="ghost" onClick={onQuit} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-xl font-light active:bg-bg3 active:text-text">‹</Btn>
```

- [ ] **Step 7: Manual verification**

Run: `npm run dev`, play Mode Latihan. Confirm: numpad taps show brightness flash + depress; getting 3+ correct answers in a row triggers a brief green screen flash + shake; progress bar shows a diagonal shine sweep each time it grows; wrong answer still shakes the input field as before (unchanged pre-existing behavior).

- [ ] **Step 8: Commit**

```bash
git add src/screens/GameScreen.jsx
git commit -m "feat: retrofit GameScreen with tap feedback, streak celebration, and haptics"
```

---

### Task 6: Retrofit `CountingGameScreen` — level select, numpad, calculator, level-up haptic

**Files:**
- Modify: `src/screens/CountingGameScreen.jsx`

**Interfaces:**
- Consumes: `Btn` (Task 2), `vibrate` from `../lib/haptics.js` (Task 1).

- [ ] **Step 1: Add imports**

At top, add:
```js
import Btn from '../components/Btn.jsx'
import { vibrate } from '../lib/haptics.js'
```

- [ ] **Step 2: Level-select button retrofit + level-up haptic on selection**

Replace `selectLevel` (lines 115-125) to fire the haptic when a level is picked:
```js
  function selectLevel(cfg) {
    vibrate('levelup')
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
```

Replace the level card button (lines 274-294), keeping content identical, swapping `<button>` for `<Btn haptic={null} ...>` (haptic is skipped here since `selectLevel` already vibrates):
```jsx
            <Btn
              key={cfg.level}
              variant="secondary"
              haptic={null}
              onClick={() => selectLevel(cfg)}
              className={`flex items-start gap-4 ${cfg.colorBg} border ${cfg.colorBorder} rounded-xl p-4 text-left w-full`}
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
            </Btn>
```

- [ ] **Step 3: Add correct/wrong/linestop haptics in `submit()`**

In `submit` (lines 204-236), after `playSound('correct')` (line 211), add `vibrate('correct')`. After `playSound('wrong')` (line 228), add `vibrate('wrong')`. After `playSound('linestop')` (line 234), add `vibrate('linestop')`.

- [ ] **Step 4: Shine sweep on watching-phase progress bar**

Replace lines 326-331:
```jsx
          <div className="h-1 bg-bg3 flex-shrink-0 relative overflow-hidden">
            <div
              className="h-full bg-red transition-all duration-500 ease-out"
              style={{ width: `${((currentIdx + 1) / numbers.length) * 100}%` }}
            />
            <div key={currentIdx} className="absolute inset-0 animate-shine pointer-events-none" />
          </div>
```

- [ ] **Step 5: Retrofit back buttons, numpad, calculator buttons, submit**

Replace both header back buttons (lines 263 and 311) with:
```jsx
          <Btn variant="ghost" onClick={onQuit} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-xl font-light active:bg-bg3 active:text-text">‹</Btn>
```

Replace the numpad block (lines 529-551) — identical pattern to Task 5 Step 6:
```jsx
            <div className="grid grid-cols-3 gap-[7px]">
              {[7,8,9,4,5,6,1,2,3].map(n => (
                <Btn
                  key={n}
                  variant="numpad"
                  onClick={() => npPress(String(n))}
                  className="h-[60px] bg-bg3 border border-border-dark rounded-lg text-[22px] font-bold text-text"
                >
                  {n}
                </Btn>
              ))}
              <Btn variant="numpad" onClick={npDel}
                className="h-[60px] bg-bg3 border border-border-dark rounded-lg text-[19px] text-red2">
                ⌫
              </Btn>
              <Btn variant="numpad" onClick={() => npPress('0')}
                className="h-[60px] bg-bg3 border border-border-dark rounded-lg text-[22px] font-bold text-text">
                0
              </Btn>
              <Btn variant="primary" haptic={null} onClick={submit}
                className="h-[60px] bg-red border border-red rounded-lg text-[19px] font-black text-white">
                ✓
              </Btn>
            </div>
```

Calculator digit/operator buttons (lines 461-497), the clear/equals buttons (lines 448-451, 489-492), the backspace (line 498-501), and the "Buka/Tutup Kalkulator" toggle (lines 425-432) plus "Gunakan Hasil" button (lines 505-508) all get the same mechanical `<button ...>` → `<Btn variant="numpad" ...>` (digits/ops) or `<Btn variant="secondary" ...>` (toggle, clear, equals, use-result) swap, preserving every existing className/content/onClick — only the element type changes.

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, play Mode Hitung end to end at Level 1. Confirm: selecting a level triggers the level-up vibration pattern (trust the try/catch no-op on desktop where `navigator.vibrate` is absent), progress bar during "watching" phase shows a shine sweep as numbers advance, numpad/calculator buttons show tap feedback, submitting correct/wrong answer behaves exactly as before functionally.

- [ ] **Step 7: Commit**

```bash
git add src/screens/CountingGameScreen.jsx
git commit -m "feat: retrofit CountingGameScreen with tap feedback, shine progress, and haptics"
```

---

### Task 7: Retrofit `ResultScreen`, `Confetti`, `LineStopOverlay` — count-up score, confetti duration, haptics

**Files:**
- Modify: `src/screens/ResultScreen.jsx`
- Modify: `src/components/Confetti.jsx`
- Modify: `src/components/LineStopOverlay.jsx`

**Interfaces:**
- Consumes: `Btn` (Task 2), `vibrate` (Task 1).
- Produces: `<Confetti perfect={boolean} />` — new optional prop, defaults `false` (existing call sites in `GameScreen.jsx`/`CountingGameScreen.jsx` remain `<Confetti />` unchanged, giving `perfect=false`).

- [ ] **Step 1: Add `perfect` prop to `Confetti.jsx`**

Replace line 5:
```jsx
export default function Confetti({ perfect = false }) {
```
Replace the frame-count check at line 38:
```js
      if (++f < (perfect ? 180 : 120)) raf = requestAnimationFrame(draw)
```
(Leave everything else in `Confetti.jsx` unchanged — particle count, colors, physics all stay as-is.)

- [ ] **Step 2: Count-up score + perfect confetti in `ResultScreen.jsx`**

Add imports at top:
```js
import { useState, useEffect } from 'react'
import Btn from '../components/Btn.jsx'
import Confetti from '../components/Confetti.jsx'
```

After the existing `acc`/`accColor` calculation (lines 3, 11), add count-up state and effect:
```js
  const [displayScore, setDisplayScore] = useState(0)
  const isPerfect = acc === 100 && !lineStop

  useEffect(() => {
    const duration = 800
    const start = performance.now()
    let raf
    function tick(now) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayScore(Math.round(score * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [score])
```

In the `rows` array (line 13-21), change the score row's value to use `displayScore` instead of `score`:
```js
    { l: 'Skor',             v: displayScore + ' pts',     vc: 'text-red' },
```

Render `<Confetti perfect />` as a sibling right before the final closing `</div>` at the end of the file (line 58-60 currently reads `</div>\n      </div>\n    </div>`; insert between the second and third):
```jsx
      </div>
      {isPerfect && <Confetti perfect />}
    </div>
```

- [ ] **Step 3: Retrofit ResultScreen buttons**

Replace lines 49-56:
```jsx
            <Btn variant="primary" onClick={onPlayAgain}
              className="w-full py-4 bg-red text-white font-black text-sm uppercase tracking-widest rounded-lg">
              MAIN LAGI
            </Btn>
            <Btn variant="secondary" onClick={onDashboard}
              className="w-full py-4 bg-bg3 text-text border border-border-dark font-black text-sm rounded-lg">
              Kembali ke Dashboard
            </Btn>
```

Replace back button line 26:
```jsx
        <Btn variant="ghost" onClick={onDashboard} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-xl font-light active:bg-bg3 active:text-text">‹</Btn>
```

- [ ] **Step 4: Haptic + retrofit `LineStopOverlay.jsx`**

Add imports at top:
```js
import { useEffect } from 'react'
import Btn from './Btn.jsx'
import { vibrate } from '../lib/haptics.js'
```

Add a mount-effect right after the function signature (line 1) to fire the haptic once when the overlay appears:
```js
export default function LineStopOverlay({ detail, onClose }) {
  useEffect(() => { vibrate('linestop') }, [])
```

Replace the close button (lines 18-23):
```jsx
        <Btn
          variant="secondary"
          onClick={onClose}
          className="max-w-[260px] w-full mx-auto py-4 bg-bg3 text-text border border-border-dark font-black text-sm rounded-lg block"
        >
          Tutup &amp; Lihat Hasil
        </Btn>
```

- [ ] **Step 5: Manual verification**

Run: `npm run dev`. Finish a training session with 100% accuracy — confetti should run noticeably longer than a mid-game confetti burst, and the score number should visibly count up from 0 rather than appearing instantly. Trigger a line stop — overlay still shakes/flashes red as before, close button has tap feedback.

- [ ] **Step 6: Commit**

```bash
git add src/screens/ResultScreen.jsx src/components/Confetti.jsx src/components/LineStopOverlay.jsx
git commit -m "feat: add score count-up, extended perfect-result confetti, and overlay haptics"
```

---

### Task 8: Retrofit `Leaderboard`, `Settings`, `Performance`, `TargetModal`

**Files:**
- Modify: `src/screens/LeaderboardScreen.jsx`
- Modify: `src/screens/SettingsScreen.jsx`
- Modify: `src/screens/PerformanceScreen.jsx`
- Modify: `src/components/TargetModal.jsx`

**Interfaces:**
- Consumes: `Btn` (Task 2).

- [ ] **Step 1: `LeaderboardScreen.jsx` — shimmer on #1 podium, button retrofit**

Add import: `import Btn from '../components/Btn.jsx'`

Replace back button (line 23):
```jsx
        <Btn variant="ghost" onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-xl font-light active:bg-bg3 active:text-text">‹</Btn>
```

Replace the podium rank block (lines 43-46) to add shimmer on the #1 spot only (`i === 1`, since `top3 = [lb[1], lb[0], lb[2]]` places rank-1 in the middle):
```jsx
                  <div className={`rounded-t-md flex items-center justify-center text-lg font-black text-white ${i === 1 ? 'animate-shimmer' : ''}`}
                    style={{ height: podH[i], background: podCol[i] }}>
                    {podRank[i]}
                  </div>
```

Replace reset button (lines 79-82):
```jsx
          <Btn onClick={clearLb}
            className="w-full py-2.5 bg-bg3 text-text border border-border-dark text-[11px] font-bold rounded-lg">
            Reset Leaderboard
          </Btn>
```

- [ ] **Step 2: `SettingsScreen.jsx` — button retrofit**

Add import: `import Btn from '../components/Btn.jsx'`

Replace back button (lines 31-36):
```jsx
        <Btn variant="ghost" onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-xl font-light active:bg-bg3 active:text-text">‹</Btn>
```

Replace each timer option button (lines 52-66), keeping the loop and conditional className logic identical, only swapping the element:
```jsx
            {TIMER_OPTIONS.map(opt => (
              <Btn
                key={opt.value}
                onClick={() => setTimer(opt.value)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border
                  ${cfg.timerSeconds === opt.value
                    ? 'bg-red/10 border-red/50 text-red'
                    : 'bg-bg3 border-border-dark text-text active:bg-bg4'}`}
              >
                <span className="text-[13px] font-semibold">{opt.label}</span>
                {cfg.timerSeconds === opt.value && (
                  <span className="text-[12px] font-black">✓</span>
                )}
              </Btn>
            ))}
```

Replace the scrap +/- buttons (lines 93-110):
```jsx
              <Btn
                onClick={() => setScrap(cfg.minScrap - 1)}
                disabled={cfg.minScrap <= 7}
                className="w-12 h-12 rounded-lg bg-bg3 border border-border-dark text-[22px] font-bold text-text disabled:opacity-30 flex-shrink-0"
              >
                −
              </Btn>
              <div className="flex-1 text-center">
                <div className="text-[44px] font-black leading-none tabular-nums text-red">{cfg.minScrap}</div>
                <div className="text-[11px] text-text2 mt-1">kali scrap</div>
              </div>
              <Btn
                onClick={() => setScrap(cfg.minScrap + 1)}
                disabled={cfg.minScrap >= 30}
                className="w-12 h-12 rounded-lg bg-bg3 border border-border-dark text-[22px] font-bold text-text disabled:opacity-30 flex-shrink-0"
              >
                +
              </Btn>
```

Replace the save button (lines 154-159):
```jsx
        <Btn
          variant="primary"
          onClick={handleSave}
          className="w-full h-[52px] bg-red border border-red rounded-xl text-white text-[15px] font-black"
        >
          Simpan Pengaturan
        </Btn>
```

- [ ] **Step 3: `PerformanceScreen.jsx` — button retrofit**

Add import: `import Btn from '../components/Btn.jsx'`

Replace back button (line 148):
```jsx
        <Btn variant="ghost" onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-md text-text2 text-xl font-light active:bg-bg3 active:text-text">‹</Btn>
```

Replace "Edit Target" button (lines 153-158):
```jsx
        <Btn
          onClick={() => setShowEdit(true)}
          className="px-3 h-8 bg-bg3 border border-border-dark rounded-lg text-[11px] font-bold text-text2"
        >
          Edit Target
        </Btn>
```

Inside `EditTargetModal`, replace the `Row` component's +/- buttons (lines 45-53) and the header close button (line 64) and save button (lines 72-77):
```jsx
          <Btn
            onClick={() => setVals(v => ({ ...v, [fieldKey]: Math.max(min, v[fieldKey] - step) }))}
            className="w-8 h-8 rounded-lg bg-bg3 border border-border-dark text-lg font-bold flex items-center justify-center"
          >−</Btn>
          <span className="w-14 text-center text-[15px] font-black tabular-nums">{vals[fieldKey]}</span>
          <Btn
            onClick={() => setVals(v => ({ ...v, [fieldKey]: Math.min(max, v[fieldKey] + step) }))}
            className="w-8 h-8 rounded-lg bg-bg3 border border-border-dark text-lg font-bold flex items-center justify-center"
          >+</Btn>
```
```jsx
          <Btn variant="ghost" onClick={onClose} className="w-8 h-8 rounded-lg bg-bg3 text-text2 flex items-center justify-center text-lg">✕</Btn>
```
```jsx
        <Btn
          variant="primary"
          onClick={() => { onSave(vals); onClose() }}
          className="w-full py-3.5 bg-red text-white font-black text-sm rounded-lg"
        >
          Simpan Target
        </Btn>
```

Replace the mode filter pills (lines 200-211):
```jsx
          {MODE_FILTER.map(m => (
            <Btn
              key={m}
              onClick={() => setFilter(m)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex-shrink-0 border
                ${filter === m
                  ? 'bg-red border-red text-white'
                  : 'bg-bg2 border-border-dark text-text2 active:bg-bg3'}`}
            >
              {MODE_FILTER_LABEL[m]}
            </Btn>
          ))}
```

- [ ] **Step 4: `TargetModal.jsx` — button retrofit**

Add import: `import Btn from './Btn.jsx'`

Replace the preset buttons (lines 37-49), the start button (lines 64-67), and the cancel button (lines 68-71):
```jsx
        <div className="grid grid-cols-3 gap-[7px] mb-3">
          {PRESETS.map(p => (
            <Btn
              key={p}
              variant="secondary"
              onClick={() => pickPreset(p)}
              className={`py-3 px-1.5 rounded-lg text-[15px] font-black text-center border-2
                ${selected === p
                  ? 'border-red bg-red/10 text-red'
                  : 'border-border-dark bg-bg3 text-text'
                }`}
            >
              {p}
              <span className={`block text-[9px] font-normal mt-0.5 ${selected === p ? 'text-red/60' : 'text-text3'}`}>kg</span>
            </Btn>
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

        <Btn variant="primary" onClick={confirm}
          className="w-full py-4 bg-red text-white font-black text-sm uppercase tracking-widest rounded-lg mb-2">
          MULAI ›
        </Btn>
        <Btn variant="secondary" onClick={onClose}
          className="w-full py-4 bg-bg3 text-text border border-border-dark font-black text-sm rounded-lg">
          Batal
        </Btn>
```

- [ ] **Step 5: Manual verification**

Run: `npm run dev`. Visit Leaderboard (rank-1 podium shows a shimmer sweep on the number), Settings (change timer/scrap, save — toast still shows, values persist), Performance (edit target modal opens/closes, filter pills switch), and open the TargetModal from a mode card (preset selection and custom input still work, MULAI navigates to game). All buttons show the new tap-depress feedback.

- [ ] **Step 6: Commit**

```bash
git add src/screens/LeaderboardScreen.jsx src/screens/SettingsScreen.jsx src/screens/PerformanceScreen.jsx src/components/TargetModal.jsx
git commit -m "feat: retrofit Leaderboard, Settings, Performance, and TargetModal with Btn and shimmer"
```

---

### Task 9: Full manual QA pass

**Files:** none (verification only)

- [ ] **Step 1: End-to-end walkthrough**

Run: `npm run dev`, open in a mobile-width browser viewport (devtools device emulation, e.g. iPhone 12 Pro, 390×844).

Walk through: Login → Dashboard → Mode Latihan (full session incl. a 3+ streak and a wrong answer) → Result (perfect and imperfect at least once each, verify count-up + confetti duration difference) → Dashboard → Takt Time Challenge (let timer expire once to see LineStopOverlay) → Dashboard → Mode Hitung (play at least Level 1 and Level 3, use the in-session calculator) → Leaderboard → Settings (change and save a value) → Performance (edit a personal target) → Logout → Login again.

Expected: no console errors, no layout shift/jank from the new animations, no broken button (every `onClick` still fires its original behavior), screen transition plays exactly once per navigation (not on every re-render).

- [ ] **Step 2: Check bundle builds cleanly**

Run: `npm run build`
Expected: build completes with no errors or warnings about unused/missing imports.

- [ ] **Step 3: Final commit (if any fixups were needed)**

```bash
git add -A
git commit -m "fix: address issues found in QA pass"
```
(Skip this step if QA found no issues — nothing to commit.)
