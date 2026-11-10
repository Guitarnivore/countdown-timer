# Design system

## Concept

A calm instrument. The digits are the one memorable element; everything around them stays quiet. The window will often be tiny and glanced at from a distance, so legibility beats decoration. Avoid generic template looks: no gradient washes, no identical rounded-card grids, no all-caps labels, no decorative eyebrows.

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

One family: Manrope (variable, bundled). Sentence case everywhere.

- Digits: weight 300 to 400, `font-variant-numeric: tabular-nums`, `letter-spacing: -0.02em`. Size is fluid (see below).
- UI labels: weight 600, 12 to 14 px, normal case.
- Never let digits change width when numbers change (tabular figures + fixed character count per format).

## Fluid sizing (digits scale with the window)

The stage is a size container (`container-type: size`). React sets `--chars` to the number of characters displayed (5 for `MM:SS`, 8 for `H:MM:SS`/`HH:MM:SS` as needed).

```css
.stage {
  container-type: size;
}
.digits {
  font-size: min(calc(100cqw / (var(--chars) * 0.6)), 62cqh);
}
```

Tune the `0.6` ratio to Manrope's tabular digit width. Show hours only when duration is an hour or more.

## Layout by size class (use container queries, not window-size media queries)

```
Tiny   (width < 220 or height < 110)     Standard (default 360x220)        Large (width > 560 and height > 320)
+--------------------+                  +---------------------------+      +-------------------------------+
|       12:34        |                  | [pin]              [gear] |      | [pin]                   [gear] |
+--------------------+                  |                           |      |                               |
 digits only, thin progress               |   (  12:34  )  ring       |      |        12:34 (huge)           |
 line under; controls on hover            |  [reset] [start/pause]    |      |   presets row                 |
                                          |  presets: 1 5 10 15 25 60 |      |   [reset] [start/pause]       |
                                          +---------------------------+      +-------------------------------+
```

- Content is centred. Controls are anchored at the bottom, pin/settings at the top corners, away from the OS title-bar buttons (leave safe space for Windows caption buttons and macOS traffic lights).
- Tiny: hide everything except digits and a thin progress line; reveal a compact control strip on hover or keyboard focus.
- Progress: ring in Standard, full-width line in Tiny/Large. Colour = `--accent` while running.

## States

| State     | Digits colour | Notes                                                                                               |
| --------- | ------------- | --------------------------------------------------------------------------------------------------- |
| Idle      | `--ink`       | digits editable; shows the configured duration                                                      |
| Running   | `--ink`       | progress in `--accent`                                                                              |
| Paused    | `--ink-muted` | primary button reads "Resume"                                                                       |
| Last 10 s | `--urgent`    | no flashing                                                                                         |
| Finished  | `--urgent`    | shows 00:00 and "Time's up"; the primary button becomes "Restart"; subtle single pulse, not looping |

## Motion

Only motion that answers an action (button press feedback about 120 ms, state colour change about 200 ms ease). No entrance animations, no looping decoration. Respect `prefers-reduced-motion`: remove pulses and transitions.

## Accessibility

- Visible `:focus-visible` ring in `--accent`, 2 px offset.
- Buttons at least 32x32 px (even in Tiny mode strip).
- Shortcuts: Space start/pause, R reset, P pin, S settings, Esc closes panels or leaves edit mode.
- Do not announce every second to screen readers. Use one polite live region that announces at start, each minute, at 10 seconds, and at finish.

## Copy

Plain verbs: "Start", "Pause", "Resume", "Reset", "Restart". Finished message: "Time's up". Settings labels: "Keep on top", "Float above full-screen apps (Mac)", "Play sound", "Theme", "Opacity".
