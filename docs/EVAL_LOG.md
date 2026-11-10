# Evaluation log

Purpose: record how each AI tool and model actually performed so you can compare them. Fill one row per prompt session (usually one per phase attempt).

Score: 1 = unusable, 3 = needed several fixes, 5 = worked first time.

| Date | Phase | Tool and model | What I asked (short) | Score | Limit hit? (what, when) | Bugs the AI introduced | Time spent | Notes |
|---|---|---|---|---|---|---|---|---|
| | | | | | | | | |

## Per-OS results
| Check | Windows | macOS | Notes |
|---|---|---|---|
| App launches from dev and from installer | | | |
| Always on top works | | | |
| Resize 120x72 to fullscreen | | | |
| 10-min accuracy drift (seconds) | | | |
| Accuracy after sleep/wake | | | |
| Alerts (sound, notification, attention) | | | |
| Float above full-screen apps | | | |

## Final questions (fill in at the end)
1. Which tool and model gave the best results per unit of free quota? Why?
2. Where did the AI most often go wrong (APIs invented, platform differences, over-engineering, tests skipped)?
3. Which parts of AGENTS.md did the AI follow, and which did it ignore? What would you change?
4. Did the phase-by-phase prompts help, or did you need smaller steps?
5. How long did it take compared with your estimate? Would you do it differently next time?
6. Would you try Tauri 2 as a second build using the same PRD and engine? What would you compare?
