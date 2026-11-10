# Roadmap and paste-ready prompts

How to use: do one phase per chat. Paste the prompt, review the plan, approve, then run the checks. Commit when green. Log it in EVAL_LOG.md.
Every prompt assumes the AI has read `AGENTS.md` (most tools load it automatically; if yours doesn't, start with "Read AGENTS.md first.").

---

## Phase 0: Scaffold check and tooling

**Goal:** a clean base project with scripts and tokens, no features.
**Prompt**

```
Read AGENTS.md and docs/ARCHITECTURE.md. Phase 0 only.
The project was scaffolded with electron-vite (react-ts).
1) Inspect the structure and list how it differs from the target tree in ARCHITECTURE.md. Propose the minimum changes and wait for my approval.
2) After approval: remove demo content; add Vitest; make sure the scripts typecheck, test, lint exist; install @fontsource-variable/manrope; create styles/tokens.css from the tables in docs/DESIGN.md; set a placeholder app name and appId.
Do not build timer features yet. End with how I verify npm run dev works on my OS.
```

**Done when:** `npm run dev`, `typecheck`, `test`, `lint` all run.

---

## Phase 1: Timer engine (no UI)

**Goal:** a pure, tested engine. This is where accuracy is won.
**Prompt**

```
Phase 1. Read docs/ARCHITECTURE.md (Timer engine) and docs/TESTING.md section 1.
Implement src/renderer/src/timer/engine.ts and format.ts as pure TypeScript with an injectable clock. Write the Vitest tests first, using the cases in TESTING.md section 1, then make them pass. No React, no Electron, no UI. Show me the test output.
```

**Done when:** all engine tests pass, including pause/resume, sleep-gap and double-finish cases.

---

## Phase 2: Window shell

**Goal:** an always-on-top, resizable window with persistence and a safe IPC bridge.
**Prompt**

```
Phase 2. Read docs/ARCHITECTURE.md (Window behaviour, IPC contract, Settings schema).
Implement src/main/window.ts, settings.ts, ipc.ts and the typed preload API. Requirements: alwaysOnTop default true, resizable with min 120x72, hidden title bar approach per the doc, bounds saved (debounced) and validated against connected displays on launch, backgroundThrottling false, quit on window close, contextIsolation on. Show a placeholder page with one Pin toggle wired through IPC to prove the bridge works.
List exactly which behaviours differ between Windows and macOS and which you could not verify. Do not implement float-above-fullscreen yet.
```

**Done when:** the window stays above others, resizes freely, remembers size/position/pin after restart.

---

## Phase 3: Timer UI

**Goal:** a usable timer with scaling digits.
**Prompt**

```
Phase 3. Read docs/PRD.md (features 1-5) and docs/DESIGN.md.
Build useTimer (hook around the engine, per ARCHITECTURE.md tick-loop rules), Display, Controls, Presets and ProgressRing. Digits must scale with window size using the container-query approach in DESIGN.md, with the Tiny/Standard/Large layouts. Add the keyboard shortcuts. Use only tokens from tokens.css. No alerts or settings yet.
Give me a manual checklist for resizing from 120x72 up to full screen, and tell me what to look for.
```

**Done when:** you can set, run, pause and reset a timer; nothing clips at any size.

---

## Phase 4: Alerts and settings

**Prompt**

```
Phase 4. Read docs/PRD.md (features 6-7) and ARCHITECTURE.md (alerts, settings).
Implement: finish alert (Web Audio synthesised chime that repeats at most 3 times, native Notification, flashFrame on Windows / dock bounce on macOS, finished visual state per DESIGN.md), and a small settings panel: theme (system/light/dark), sound on/off + volume, keep on top, opacity. Persist everything through the existing settings module. Do not add float-above-fullscreen yet.
Add tests for any new logic. Explain Windows vs macOS differences.
```

**Done when:** a 5-second test timer chimes, notifies and shows the finished state on your OS; settings survive restart.

---

## Phase 5: Polish

**Prompt**

```
Phase 5. Read docs/DESIGN.md and PRD "Should have".
Implement: compact hover-reveal controls in Tiny mode, taskbar/dock progress via setProgressBar, last-duration memory, the optional macOS "Float above full-screen apps" setting (default off; follow the notes in ARCHITECTURE.md and warn me about side effects), reduced-motion support, accessibility pass (focus ring, live-region announcements), and an app icon placeholder.
Then review your own work against the Accessibility section of DESIGN.md and list anything that fails.
```

---

## Phase 6: Package and cross-platform QA

**Prompt**

```
Phase 6. Configure electron-builder for an NSIS installer (Windows) and DMG (macOS), plus build:win and build:mac scripts. Add a GitHub Actions workflow that builds both on windows-latest and macos-latest and uploads the installers as artifacts. Write a short app README with install steps, the unsigned-app warnings on each OS, and the known platform limits from docs/PRD.md.
Do not set up code signing.
```

Then run everything in `docs/TESTING.md` section 3 on both OSes and record results in EVAL_LOG.md.

---

## Phase 7 (optional)

Pick one: saved presets, global hotkey, tray/menu-bar icon, overtime count-up. Same pattern: plan first, tests for logic, update PRD.md before coding.

---

## Handy recovery prompts

- **Stuck in a loop:** "Stop. Don't change code. Explain in 5 lines what you think the root cause is and what evidence you have. Then propose one minimal fix."
- **Too much code:** "Revert to the smallest change that satisfies the acceptance criterion. Keep the diff under 40 lines."
- **Unsure the AI is right:** "Which part of this relies on an API or behaviour you are not certain about? Give me the doc page I should check."
- **Context bloat:** start a fresh chat and paste only: the phase prompt, the failing file, and the exact error.
