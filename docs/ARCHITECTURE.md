# Architecture

## Process model (Electron)

- **Main** (`src/main`): creates the window, owns settings file, handles alerts (notification, taskbar/dock), exposes IPC handlers.
- **Preload** (`src/preload`): exposes a small typed `window.api` via `contextBridge`. Nothing else.
- **Renderer** (`src/renderer/src`): React UI and the timer engine. The timer runs in the renderer for the MVP.
- App quits when the window closes on both platforms (a timer has no reason to linger on macOS).

## Target file tree

```
src/
  main/
    index.ts            app lifecycle, quit-on-close
    window.ts           createTimerWindow(), bounds validation, always-on-top helpers
    settings.ts         load/save JSON in app.getPath('userData'), debounced writes, schemaVersion
    alerts.ts           notification, flashFrame / dock.bounce, setProgressBar
    ipc.ts              ipcMain.handle(...) + payload validation
  preload/
    index.ts            contextBridge.exposeInMainWorld('api', {...})
    api.d.ts            shared types for window.api
  renderer/src/
    timer/
      engine.ts         PURE functions, no React, no Electron
      engine.test.ts
      format.ts         formatRemaining(), parseDigits()
      useTimer.ts       React hook around the engine
    ui/                 components: Display, Controls, ProgressRing, Keypad, Settings
    styles/             tokens.css, base.css, components.css
    audio/chime.ts      Web Audio synthesised chime (no audio files)
    App.tsx, main.tsx
  shared/
    types.ts            Settings, IPC channel names and payloads
```

## Timer engine (accuracy is the point)

Never subtract 1 second per tick. Timers in JS fire late, get throttled and pause during sleep. Instead store _when it ends_ and recompute on every tick.

```ts
type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'
interface TimerState {
  status: TimerStatus
  durationMs: number      // configured duration
  remainingMs: number     // authoritative when not running
  endAtMs: number | null  // wall-clock end time, set while running
}
// All take `nowMs` as a parameter so tests never need real time.
start(state, nowMs): TimerState      // endAtMs = nowMs + remainingMs
pause(state, nowMs): TimerState      // remainingMs = max(0, endAtMs - nowMs)
resume(state, nowMs): TimerState
reset(state): TimerState             // remainingMs = durationMs, idle
getRemainingMs(state, nowMs): number // running ? max(0, endAtMs - nowMs) : remainingMs
isFinished(state, nowMs): boolean
```

- Clock: `Date.now()` (wall clock), so the timer keeps counting through sleep like a kitchen timer. Document this choice in a code comment. Inject `now` into `useTimer` for tests.
- Display: show `ceil(remainingMs / 1000)` seconds, so "00:01" stays until the very end, and "00:00" appears only at finish.
- Tick loop: after each tick, schedule the next with `setTimeout` aimed at the next displayed-second boundary (plus ~10 ms), not a fixed `setInterval(1000)`. Always recompute from `endAtMs`. Also resync on `visibilitychange` and window `focus`.
- Finish: fire `onFinish` exactly once per run (guard against double fire after resync).
- Limits: 0 < duration <= 99:59:59. Reject or clamp invalid input.

## IPC contract (typed, validated in main)

| Channel                 | Direction        | Payload                         | Notes                                  |
| ----------------------- | ---------------- | ------------------------------- | -------------------------------------- |
| `settings:get`          | invoke           | none, returns `Settings`        |                                        |
| `settings:set`          | invoke           | `Partial<Settings>`             | validate keys and ranges               |
| `window:setAlwaysOnTop` | invoke           | `boolean`                       | also persists                          |
| `window:setOpacity`     | invoke           | `number` 0.3 to 1               |                                        |
| `alert:finished`        | invoke           | none                            | notification + attention               |
| `progress:set`          | send             | `number` 0 to 1, or -1 to clear | taskbar/dock                           |
| `theme:changed`         | main to renderer | `'light'\|'dark'`               | from `nativeTheme` when theme = system |

## Settings schema (JSON file, `schemaVersion: 1`)

```
theme: 'system' | 'light' | 'dark'
alwaysOnTop: boolean (default true)
floatAboveFullscreen: boolean (default false, macOS-focused)
soundEnabled: boolean, volume: 0..1
opacity: 0.3..1
lastDurationMs: number
bounds: { x, y, width, height }
```

Read defensively: missing or corrupt file falls back to defaults; unknown keys are ignored; write atomically (write temp file, rename).

## Window behaviour

- Defaults: 360x450 with the keypad visible; `minWidth: 120`, `minHeight: 72` and no max while the keypad is hidden; `resizable: true`, `alwaysOnTop: true`, `show: false` then `ready-to-show`.
- While the keypad is visible, maintain a 4:5 window aspect ratio and a 360x450 minimum size; restore the normal minimum size and free resizing when it is hidden.
- Title bar: prefer `titleBarStyle: 'hidden'` (macOS keeps traffic lights; on Windows add `titleBarOverlay` for native caption buttons). Avoid `frame: false` unless needed, because native edge-resizing and snapping are more reliable with the hidden title bar. Provide a CSS drag region (`-webkit-app-region: drag`) and mark buttons `no-drag`.
- Persist bounds on `resize`/`move` (debounced ~300 ms). On launch, validate that the saved rectangle intersects a connected display (`screen.getAllDisplays()`); otherwise centre on the primary display.
- Opacity: `win.setOpacity()`.
- Taskbar/dock progress: `win.setProgressBar(fraction)`; `-1` clears it.
- Attention: Windows `win.flashFrame(true)` (stop on focus); macOS `app.dock?.bounce('critical')`.

### Always on top: platform notes

- Windows: `win.setAlwaysOnTop(true, 'screen-saver')` keeps it above normal windows and most full-screen apps. Exclusive full-screen games cannot be overlaid.
- macOS: the default level floats above normal windows only. To appear over full-screen apps use `setAlwaysOnTop(true, 'screen-saver')` plus `setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })`. That call can briefly hide the window and Dock icon while macOS changes the process type; so it is behind the optional `floatAboveFullscreen` setting, default off. Verify on a real Mac.

## Packaging

`electron-builder`: NSIS installer (Windows), DMG (macOS). Build per OS (or via GitHub Actions matrix). Unsigned for now.
