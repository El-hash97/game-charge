# Mobile Game Feel Polish — Design

**Date:** 2026-07-01
**Status:** Approved for planning

## Goal

Make Charging Simulator *feel* like a mobile game through visual/interaction polish — tap feedback, screen transitions, celebration effects, progress/reward visuals, and haptics — while keeping the existing dark-industrial (black/red) theme, game logic, and data model unchanged. Applies to all screens: Login, Dashboard, Game, Counting, Result, Leaderboard, Settings, Performance.

## Non-goals

- No new game mechanics (no XP system, no unlockable content, no currency).
- No color palette change — stays dark/industrial, just "juicier."
- No new npm dependencies (no Framer Motion, no animation libraries). Everything is vanilla CSS keyframes + React, consistent with the existing hand-rolled `audio.js` / `Confetti.jsx` style.
- No changes to scoring, level, or timer logic in `src/lib/game.js`.

## Architecture

Three new shared modules, plus incremental retrofits of existing screens/components.

### 1. `src/lib/haptics.js`

Thin wrapper around `navigator.vibrate()`. No-ops silently if unsupported (mirrors the try/catch pattern in `audio.js`).

```js
export function vibrate(type) // type: 'tap' | 'correct' | 'wrong' | 'linestop' | 'levelup'
```

Patterns (ms, on-off-on...):
- `tap`: `10`
- `correct`: `15`
- `wrong`: `[20, 40, 20]`
- `linestop`: `[40, 60, 40, 60, 80]`
- `levelup`: `[15, 30, 15, 30, 40]`

### 2. `src/components/Btn.jsx`

Reusable button component to consolidate tap-feedback styling and haptics. Props: `variant` (`primary` | `secondary` | `ghost` | `numpad`), `onClick`, `haptic` (default `'tap'`, can be overridden or set to `null` to skip), plus standard button props (`className`, `disabled`, `children`).

Behavior:
- Calls `vibrate(haptic)` on click (before the passed `onClick`), unless `haptic` is `null`.
- Base classes provide the "physical button" feel: rest state has a subtle bottom shadow (`shadow-[0_3px_0_...]` using a darker shade of the button's own color), pressed state (`active:`) drops `translate-y-[1px]`, removes the shadow, and scales to `.96`, transition ~100ms ease-out (faster than the current 150-200ms `transition-all` default, for snappier response).
- `variant="numpad"` adds `active:brightness-125` for the "lit up" tap effect used by GameScreen/CountingGameScreen keypads.
- Retrofit is incremental: existing raw `<button>` elements across screens get swapped to `<Btn>` one screen at a time, preserving each screen's current color/size classes via `className` passthrough. This is NOT a full rewrite — layout/structure of each screen stays the same, only the button element changes.

### 3. `src/components/ScreenTransition.jsx`

Wrapper used in `App.jsx` around the screen switch. Keyed by `screen` state so React remounts the active screen's subtree on change, triggering a CSS entrance animation.

```js
<ScreenTransition screenKey={screen}>
  {/* existing screen === '...' && <Screen /> block */}
</ScreenTransition>
```

New keyframe in `index.css`:
```css
@keyframes screenIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: none; }
}
.animate-screenIn { animation: screenIn 0.28s ease-out both; }
```

Modals (`TargetModal`, `LineStopOverlay`) are NOT wrapped by `ScreenTransition` (they have their own overlay/bottom-sheet entrance already) — only their existing animation durations are aligned to match the new easing curve where it doesn't conflict with their dramatic intent (LineStopOverlay's flash/shake stays as-is).

## Detail by category

### Button & tap feedback
- All primary/secondary action buttons across every screen migrate to `<Btn>`.
- Numpad buttons (GameScreen, CountingGameScreen) use `variant="numpad"` for the brightness-flash-on-tap effect.
- Destructive/neutral icon buttons (header icons: settings, leaderboard, logout, back) also migrate to `<Btn variant="ghost">` for consistent haptic tap, but keep their existing icon-only sizing.

### Screen transitions
- Every top-level screen swap in `App.jsx` (login → dashboard → game → result → etc.) fades+slides in via `ScreenTransition`.
- Bottom-sheet modal (`TargetModal`) and full-screen overlay (`LineStopOverlay`) keep their current entrance styles, unchanged.

### Celebration & feedback effects
- **Streak shake+flash**: in `GameScreen`/`CountingGameScreen`, when a correct answer lands with `streak >= 3`, trigger a brief low-amplitude screen shake (reuse `.animate-shake` at reduced translateX values via a new lighter variant `.animate-shakeSm`) plus a green background flash (new `.animate-flashG`, mirrors existing `.animate-flashR` but green, shorter duration). Intensity does not scale further past streak 3 (avoid excessive motion) — same effect fires each time streak stays >=3.
- **Count-up score** in `ResultScreen`: score value animates from 0 to final score over ~800ms (simple `requestAnimationFrame` easing, no library) instead of appearing instantly. Triggered once on mount.
- **Confetti duration**: extend `Confetti` particle lifetime slightly (from 120 frames to ~180 frames) specifically for the 100%-accuracy perfect-result case in `ResultScreen`; challenge/training mid-game confetti (on target-reached) stays at current duration.
- **Haptics added**: `correct` on right answer, `wrong` on wrong answer, `linestop` when LineStopOverlay shows, `levelup` when CountingGameScreen advances a level.

### Progress & reward visuals
- Accumulation progress bar (GameScreen) and level/score bars (CountingGameScreen): width changes already use `transition-all` — extend duration/easing slightly (`duration-500 ease-out`) and add a one-shot diagonal shine sweep (new `.animate-shine` keyframe, a `::after` gradient sweep) that plays each time the bar's percentage increases.
- Dashboard mode cards (Latihan/Challenge/Hitung): idle subtle border-glow pulse (new `.animate-glowPulse`, low-opacity box-shadow breathing, ~3s loop) to signal "tappable/alive." Kept subtle to avoid distraction on a screen users linger on.
- Streak badge (🔥 counter in Dashboard/GameScreen headers): scale-pop (`.animate-countPulse`-style, already exists) triggered specifically on streak increment, not continuously.
- Leaderboard top-3 rows: medal emoji gets a subtle shimmer via CSS `background-clip: text` gradient animation on a wrapping span (new `.animate-shimmer`).

## Testing / verification

Pure client-side visual/interaction change — no data model or scoring logic touched. Verification plan:
1. Run dev server, manually exercise each screen transition (login → dashboard → each mode → result → back).
2. Play through GameScreen and CountingGameScreen: verify tap feedback doesn't lag rapid numpad input, verify streak shake/flash triggers correctly and doesn't obscure the input field, verify haptics fire (best-effort — vibration only testable on real mobile hardware, not desktop browser).
3. Verify count-up score and confetti timing in ResultScreen for both perfect and imperfect results.
4. Check Dashboard card glow and Leaderboard shimmer don't cause layout shift or excessive CPU/battery (bounded animation-iteration-count where appropriate — e.g., glow pulse is fine as infinite low-cost transform/opacity, no JS-driven loops).
5. Spot-check on a real mobile viewport (browser devtools device emulation at minimum) since this app is mobile-first.

## Files touched (expected)

New:
- `src/lib/haptics.js`
- `src/components/Btn.jsx`
- `src/components/ScreenTransition.jsx`

Modified:
- `src/index.css` (new keyframes: `screenIn`, `shakeSm`, `flashG`, `shine`, `glowPulse`, `shimmer`)
- `src/App.jsx` (wrap screen switch with `ScreenTransition`)
- `src/screens/*.jsx` (all 8 screens — retrofit buttons to `<Btn>`, add haptics/effects per above)
- `src/components/TargetModal.jsx`, `src/components/LineStopOverlay.jsx`, `src/components/Toast.jsx`, `src/components/Confetti.jsx` (button retrofit + confetti duration tweak only)
