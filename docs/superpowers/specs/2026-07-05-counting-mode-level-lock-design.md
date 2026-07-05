# Counting Mode Level Lock — Design

**Date:** 2026-07-05
**Status:** Approved

## Problem

Mode Hitung (`CountingGameScreen.jsx`) currently shows all 5 levels unlocked from the start. We want players to clear a level (correct answer, no line stop) before the next one becomes available, with an admin/instructor override via a hardcoded password for cases where a level needs to be force-opened.

## Scope

All changes are contained to `src/screens/CountingGameScreen.jsx`. No changes to `storage.js`, `App.jsx`, or other screens. `CountingGameScreen` already receives a `currentUser` prop from `App.jsx` — it just needs to be destructured (currently unused).

## Progress Derivation

No new persistent storage. Unlock state is derived each render from existing log data (`getLogs()` from `lib/storage.js`):

- Level 1 is always unlocked.
- Level N (N > 1) is unlocked if there exists a log entry with `noreg === currentUser.noreg`, `mode === 'counting'`, `level === N - 1`, and `lineStop === false` (a win, since counting mode only ever logs `lineStop: false` on a correct answer or `lineStop: true` on a wrong one).

## Locked Level UI

On the level-select screen, a locked level's card:
- Renders dimmed (reduced opacity / grayscale accents).
- Shows a 🔒 icon in place of the level-number badge.
- Subtitle text changes to "Selesaikan Level {N-1} dulu".
- Tapping the card body does **not** start the level.
- Card includes a secondary small button: "🔒 Buka dengan password".

## Force Unlock via Password

Tapping "Buka dengan password" opens a small inline modal (rendered within `CountingGameScreen.jsx`, consistent with the existing `LineStopOverlay`/`Confetti` overlay pattern) with:
- A password input field.
- "Buka" (submit) and "Batal" (cancel) buttons.

The correct password is a hardcoded constant, `FORCE_UNLOCK_PASSWORD = 'El123'`, defined at the top of the file alongside `MIN_SUM`.

- **Correct password:** modal closes and the selected level starts immediately (calls the existing `selectLevel(cfg)`). This is a single-session override only — it does not persist anywhere. If the player leaves the level (quits or finishes, win or lose) without having actually cleared the prerequisite level, the level shows locked again next time they return to level-select.
- **Incorrect password:** inline error message under the input, plus `showToast('Password salah!')`. No rate limiting or lockout — this is a trusted local-device use case, not a security boundary.

## Out of Scope

- No changes to scoring, level configs, or the watching/inputting game flow.
- No new persisted "unlocked levels" list — everything is derived from existing logs to avoid a second source of truth.
- No password hashing/config UI — it's a single hardcoded constant.

## Verification

No test runner exists in this project (`package.json` has only `dev`/`build`/`preview`). Verification is manual in the browser:
1. Fresh user → levels 2–5 show locked.
2. Win level 1 → level 2 unlocks; levels 3–5 remain locked.
3. On a locked level, wrong password shows error and does not start the game.
4. On a locked level, correct password (`El123`) starts that level immediately; after finishing, returning to level-select shows it locked again (since the prerequisite still isn't cleared).
