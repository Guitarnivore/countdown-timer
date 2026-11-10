# Design system

## Concept

A relaxed, approachable classroom timer. The design is friendly, warm, and legible from across a classroom, while remaining clean and focused. Curved, playful typography and Google Clock-inspired keypad entry create a calm, approachable tool for teachers and students. To maintain focus, there are no presets: users enter durations directly via a numeric keypad (seconds, then minutes, then hours), which disappears completely once the timer starts ("Go").

## Tokens (put in `styles/tokens.css`; components use only these)

Light ("Daylight") and dark ("Dusk") sets, switched by `data-theme` on `<html>`.

| Token         | Daylight  | Dusk      | Use                                 |
| ------------- | --------- | --------- | ----------------------------------- |
| `--bg`        | `#EEF1F5` | `#161C26` | window background                   |
| `--surface`   | `#FFFFFF` | `#1F2733` | buttons, panels                     |
| `--ink`       | `#1C2733` | `#E9EEF4` | digits, primary text                |
| `--ink-muted` | `#5B6878` | `#9AA7B8` | secondary text, idle/paused digits  |
| `--accent`    | `#138A8A` | `#4FC3C3` | running state, progress, focus ring |
| `--urgent`    | `#D9482B` | `#FF7A59` | last 10 seconds and finished        |
| `--line`      | `#D5DBE3` | `#2E394A` | subtle separators                   |

Check contrast: text and digits at least 4.5:1 against their background in both themes; adjust the hex values if a check fails, keep the names.

Spacing scale: 4, 8, 12, 16, 24, 32 px as `--space-1..6`. Radii: `--radius-control: 10px`, `--radius-window-inner: 14px` (only two). Shadows: none on controls; one soft shadow only for a floating settings panel.

## Typography

One family: Fredoka (variable, bundled via `@fontsource-variable/fredoka`). Fun, rounded, curvy letterforms suited for a friendly classroom environment. Sentence case everywhere.

- Digits: curvy rounded numerals, weight 400 to 600, `font-variant-numeric: tabular-nums`, `letter-spacing: -0.01em`. Size is fluid (see below).
- UI labels: weight 600, 12 to 14 px, normal case.
- Never let digits change width when numbers change (tabular figures + fixed character count per format).

## Fluid sizing (digits scale with the window)

The stage is a size container (`container-type: size`). React sets `--chars` to the number of characters displayed (5 for `MM:SS`, 8 for `HH:MM:SS` as needed).

```css
.stage {
  container-type: size;
}
.digits {
  font-size: min(calc(100cqw / (var(--chars) * 0.62)), 62cqh);
}
```

Tune the `0.62` ratio to Fredoka's tabular digit width. Show hours only when duration is an hour or more (or in full `00h 00m 00s` format during keypad input).

## Layout by size class (use container queries, not window-size media queries)

### Setup mode (Idle: Keypad visible, Google Clock style)

```
Tiny (< 220x110)                 Standard (default 360x220+)               Large (> 560x320)
+--------------------+           +-------------------------------+         +-----------------------------------+
| 00:50        [ Go ]|           | [pin]                  [gear] |         | [pin]                      [gear] |
| keypad on expand/  |           |          00m 50s              |         |            00h 05m 00s            |
| popover or typing  |           |    [1] [2] [3]                |         |       [ 1 ]  [ 2 ]  [ 3 ]         |
+--------------------+           |    [4] [5] [6]                |         |       [ 4 ]  [ 5 ]  [ 6 ]         |
                                 |    [7] [8] [9]                |         |       [ 7 ]  [ 8 ]  [ 9 ]         |
                                 |   [00] [0] [<X]               |         |      [ 00 ]  [ 0 ]  [ <X ]        |
                                 |          [ Go ]               |         |             [  Go  ]              |
                                 +-------------------------------+         +-----------------------------------+
```

### Active / Running mode (Keypad hidden after "Go")

```
Tiny (< 220x110)                 Standard (default 360x220+)               Large (> 560x320)
+--------------------+           +-------------------------------+         +-----------------------------------+
|       12:34        |           | [pin]                  [gear] |         | [pin]                      [gear] |
+--------------------+           |                               |         |                                   |
 digits only, thin progress      |        (  12:34  ) ring       |         |           12:34 (huge)            |
 line under; controls on hover   |                               |         |                                   |
                                 |      [reset]   [pause]        |         |        [reset]    [pause]         |
                                 +-------------------------------+         +-----------------------------------+
```

- Setup (Idle): Numeric keypad (1-9, 0, 00, Backspace/Clear) lets user enter duration starting with seconds, then minutes, then hours (e.g. typing `5-0` gives 50 seconds; `5-0-0` gives 5 minutes). No presets. The primary action is a prominent "Go" button.
- Running / Paused: The keypad completely hides upon pressing "Go", freeing the full stage for large, clean digits and the progress indicator.
- Reset / Edit: Pressing "Reset" from paused/finished returns to the Idle setup screen and brings back the keypad.
- Tiny mode: Displays digits and a compact "Go" or control strip; typing digits via physical keyboard shifts time directly.
- Progress: ring in Standard, full-width line in Tiny/Large. Colour = `--accent` while running.

## States

| State     | Digits colour | Keypad  | Primary Button | Notes                                                                   |
| --------- | ------------- | ------- | -------------- | ----------------------------------------------------------------------- |
| Idle      | `--ink`       | Visible | "Go"           | Google Clock keypad active; accepts 0-9; shifts seconds->minutes->hours |
| Running   | `--ink`       | Hidden  | "Pause"        | Full window dedicated to digits and progress ring/bar                   |
| Paused    | `--ink-muted` | Hidden  | "Resume"       | Secondary button: "Reset" (returns to Idle keypad)                      |
| Last 10 s | `--urgent`    | Hidden  | "Pause"        | Calm urgent indicator without abrupt flashing                           |
| Finished  | `--urgent`    | Hidden  | "Restart"      | Shows 00:00 and "Time's up"; secondary "Reset" restores keypad          |

## Motion

Only motion that answers an action (button press feedback about 120 ms, state colour change about 200 ms ease). No entrance animations, no looping decoration. Respect `prefers-reduced-motion`: remove pulses and transitions.

## Accessibility

- Visible `:focus-visible` ring in `--accent`, 2 px offset.
- Buttons at least 32x32 px (even in Tiny mode strip).
- Shortcuts: Space start/pause, R reset, P pin, S settings, Esc closes panels or leaves edit mode.
- Do not announce every second to screen readers. Use one polite live region that announces at start, each minute, at 10 seconds, and at finish.

## Copy

Plain verbs: "Go", "Pause", "Resume", "Reset", "Restart". Finished message: "Time's up". Settings labels: "Keep on top", "Float above full-screen apps (Mac)", "Play sound", "Theme", "Opacity".
