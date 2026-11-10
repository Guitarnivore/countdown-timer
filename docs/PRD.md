# PRD: Countdown Timer

## Purpose
A small, polished countdown timer that stays visible above other windows while the user works. It is also a trial project for building software with AI tools (see EVAL_LOG.md).

## Users and use cases
- Someone working or presenting who wants a timer always visible in a screen corner (talks, focus sessions, exams, cooking, meetings).
- Typical flow: open app, pick or type a duration, press start, put it in a corner, glance at it, hear and see an alert when time is up.

## Features

### Must have (MVP)
1. **Duration input**: hours, minutes, seconds (max 99:59:59), plus quick presets (1, 5, 10, 15, 25, 60 minutes). Typing digits fills from the right, like a microwave (typing 1 2 0 0 gives 12:00).
2. **Controls**: start, pause, resume, reset. Space starts/pauses; R resets.
3. **Large readable digits** that scale with the window, plus a progress indicator (ring or bar).
4. **Always on top**: on by default, toggle button and shortcut (P), remembered across launches.
5. **Fully resizable**: from 120x72 to fullscreen. Layout adapts at three size classes (see DESIGN.md). Window size and position are remembered, and restored on-screen even if a monitor was disconnected.
6. **Finish alert**: synthesised chime (sound can be turned off), native notification, taskbar/dock attention, clear visual "finished" state. Chime repeats a limited number of times, then stops.
7. **Theme**: light, dark, or follow system.
8. **Accuracy**: see AGENTS.md requirement 3. Survives minimise, sleep/wake and heavy CPU load.

### Should have
- Compact mode: digits only; controls appear on hover or focus.
- Window opacity setting (30-100%).
- Progress in the Windows taskbar and macOS Dock icon.
- Optional: float above full-screen apps on macOS (setting, default off).
- Remember the last used duration.

### Could have (post-MVP, not in the roadmap's core phases)
- Saved custom presets, global hotkey, menu-bar/tray icon, overtime count-up after zero.

## Non-goals
Accounts, cloud sync, mobile apps, Linux support (may work, untested), multiple simultaneous timers, auto-update, code signing.

## Acceptance criteria
- App launches on Windows 10/11 and a current macOS and passes the TESTING.md checklist on both.
- A 10-minute timer ends within 0.5 s of a reference clock on both OSes.
- Window can be resized from 120x72 up to a full screen with no clipped or overlapping UI.
- Always-on-top state, theme, window bounds and last duration survive a restart.
- Keyboard-only use works for start, pause, reset, pin, and editing the duration.
- No console errors in normal use; `npm run typecheck`, `npm test`, `npm run lint` all pass.

## Known platform limits (document in the app's README)
- Apps in exclusive full-screen mode (some games) can't be overlaid on Windows.
- On macOS, floating above full-screen apps needs extra window settings and is optional (see ARCHITECTURE.md).
