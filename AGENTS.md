# AGENTS.md: Countdown Timer

Cross-platform (Windows 10/11 + macOS) desktop countdown timer. Always on top, fully resizable, modern design, accurate.
This is a learning/evaluation project: keep it small, readable and correct.

## Stack (fixed; ask before changing)

- Electron (latest stable) + electron-vite, React, TypeScript (strict), plain CSS with custom properties, Vitest.
- Font: `@fontsource-variable/fredoka` (bundled; no CDN at runtime; friendly and curvy for relaxed classroom environment).
- Do NOT add: Tailwind, UI kits, state libraries, electron-store, moment/dayjs. Settings = small JSON file module. Ask before adding ANY dependency, and say why.

## Commands

- `npm run dev`: run app with hot reload
- `npm run typecheck`, `npm test`, `npm run lint`: run all three before saying a task is done
- `npm run build:win` / `npm run build:mac`: installers (mac installer can only be built on a Mac or GitHub's macOS runner)

## Layout

- `src/main/`: Electron main process (window, settings, IPC handlers, alerts)
- `src/preload/`: contextBridge API only
- `src/renderer/src/`: React UI; `timer/` holds the pure engine
- `docs/`: PRD, ARCHITECTURE, DESIGN, ROADMAP, TESTING. Read only the one you need.

## Non-negotiable requirements

1. Window is always on top by default; user can toggle it; the choice persists.
2. Window is fully resizable (min 120x72 px, no max). Digits scale smoothly with window size.
3. Timer is accurate: compute remaining time from a stored end timestamp, never by decrementing a counter on each tick. Drift must stay under 0.5 s per 10 minutes, including after minimise, sleep/wake and CPU load. See ARCHITECTURE.md.
4. Behaviour is identical on Windows and macOS unless a platform difference is documented in ARCHITECTURE.md.
5. Design follows DESIGN.md tokens. No hard-coded colours or sizes in components.

## Electron security rules

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` where possible.
- Renderer talks to main only through the typed API exposed in `src/preload`. Never expose `ipcRenderer` directly.
- Validate every IPC payload in main. No remote content, no `eval`.
- Set `webPreferences.backgroundThrottling: false` on the timer window.

## How you (the AI) should work

- Check `docs/ROADMAP.md` for the current phase. Do only that phase.
- Start with a plan of 10 lines or fewer and wait for approval when the task touches more than 3 files.
- Make small, focused edits. Do not rewrite whole files to change a few lines.
- Never invent APIs. If unsure how an Electron or React API behaves, say so and tell me which doc page to check.
- State platform differences explicitly. Do not claim something was verified on Windows or macOS unless you ran it there.
- Write or update tests for any logic outside the UI.
- Finish every task with: (1) what changed, (2) how I verify it manually, (3) what is left.
- If an error repeats twice, stop and explain your diagnosis instead of trying a third patch.

## Code style

- TypeScript strict, no `any`. Small functions, named exports, files under about 200 lines.
- Comments explain why, not what. Keep UI copy in sentence case and plain language.
- Time values are integer milliseconds everywhere internally; convert only at the display edge.
