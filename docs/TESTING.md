# Testing

## 1. Engine unit tests (Vitest, injectable clock)
Write these before the implementation (Phase 1):
- `start` sets `endAtMs = now + remainingMs`; status becomes running.
- `getRemainingMs` decreases exactly with the injected clock; never negative.
- `pause` freezes remaining; time passing while paused changes nothing; `resume` continues from the frozen value.
- Pause/resume repeated 100 times does not accumulate drift.
- A large clock jump forward (simulated sleep of 1 hour) while running ends the timer as finished and remaining = 0.
- `isFinished`/`onFinish` fires exactly once, even when the tick is evaluated twice at the end.
- `reset` restores `durationMs` and idle status; works from every status.
- Display rounding: remaining 1 ms shows `00:01`; 0 ms shows `00:00`; 59 999 ms shows `01:00`.
- `formatRemaining`: `MM:SS` under one hour, `H:MM:SS` above; 99:59:59 is the max.
- `parseDigits`: typing 1,2,0,0 gives 12:00; 1,0,0,0,0 gives 1:00:00; more than 6 digits ignored; leading zeros handled; overflow clamps to 99:59:59.
- Rejects zero, negative, NaN and non-integer durations.

## 2. Accuracy test (manual, both OSes)
Reference: a phone stopwatch or time.is.
1. Start a 10-minute timer and a reference stopwatch together. Compare at the end: difference must be under 0.5 s.
2. Repeat with the window minimised for the whole run.
3. Repeat while a CPU-heavy task is running (for example a video render or a stress tool).
4. Put the machine to sleep for 2 minutes mid-run. On wake the remaining time must reflect real elapsed time (wall-clock behaviour).
5. Change the system clock by a few minutes while running. Note what happens and record it in EVAL_LOG.md (it is acceptable as long as it is documented).

## 3. Manual QA checklist (run on Windows AND macOS)
Window
- [ ] Opens above other windows; stays above when you click another app.
- [ ] Pin toggle turns always-on-top off and on; state survives restart.
- [ ] Resize by every edge and corner; smallest size 120x72 is legible; largest (fullscreen) looks intentional.
- [ ] Size and position are restored on restart. Disconnect/move a second monitor, then restart: the window appears on-screen.
- [ ] Windows: snap layouts and maximise work. macOS: traffic lights work; green button / fullscreen behaves sensibly.
- [ ] Closing the window quits the app on both OSes.

Timer
- [ ] Start, pause, resume, reset all work with mouse and keyboard.
- [ ] Digit entry works; presets work; invalid input can't produce a broken state.
- [ ] Digits never jitter horizontally as numbers change.
- [ ] Last 10 seconds turns urgent; finish shows the finished state.

Alerts
- [ ] Chime plays (and stops after the limit); mute works; volume works.
- [ ] Native notification appears (allow notifications in OS settings if needed).
- [ ] Windows taskbar flash; macOS Dock bounce; both stop or are harmless after focus.

Look and feel
- [ ] Light, dark and system themes; switching the OS theme updates the app in system mode.
- [ ] Text contrast is fine in both themes; focus ring visible with the keyboard.
- [ ] Reduced-motion OS setting removes pulses and transitions.
- [ ] Display scaling at 100%, 150%/200% (Windows) and Retina (Mac) renders crisply.

Packaging
- [ ] Installer/DMG installs, launches, and uninstalls cleanly.
- [ ] No console errors in normal use.

## 4. Automated checks (every phase)
`npm run typecheck && npm test && npm run lint`
Optional later: Playwright with Electron for a launch smoke test.
