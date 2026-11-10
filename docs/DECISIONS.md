# Decisions

Evaluation done 10 Nov 2026. Free tiers and prices change often. Re-check each tool's pricing page before relying on any figure here.

## ADR-001: Framework, Electron

**Requirements that decide it:** Windows + macOS, always on top, fully resizable, modern UI, accurate timer, built with AI help on free tiers.

| Option                            | Always on top                                                                             | Modern UI                                                                                            | AI-assist friendliness                                                                                             | Main risks                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| **Electron** (chosen)             | Built in; `setAlwaysOnTop` levels, plus an option for full-screen spaces on macOS         | Full web stack; same Chromium rendering on both OSes                                                 | Best: one language (TypeScript), huge amount of public examples                                                    | Large install size (hundreds of MB), more RAM; irrelevant for this app                        |
| Tauri 2                           | Supported; macOS over-full-screen needed a third-party plugin in one 2026 overlay project | Web stack, but Windows uses WebView2 (Chromium) and macOS uses WKWebView (WebKit), so CSS can differ | Good for UI, but backend is Rust: needs Rust toolchain, longer compile loops, and Rust errors burn free-tier quota | Platform webview differences, macOS window quirks reported in 2026; smaller community answers |
| Flutter desktop                   | Via a package (e.g. window_manager)                                                       | Excellent custom UI, consistent                                                                      | Dart is less represented in AI training data than TypeScript                                                       | Window-management packages add native-code risk                                               |
| .NET MAUI                         | macOS only through Mac Catalyst; always-on-top needs per-OS native code                   | Fine                                                                                                 | Weaker for macOS                                                                                                   | Not a good fit for a Mac-first-class app                                                      |
| Two native apps (WinUI + SwiftUI) | Best native behaviour                                                                     | Best native look                                                                                     | Two codebases, two languages                                                                                       | Double the work                                                                               |

**Why Electron:** it removes the biggest risks for a first AI-assisted build: one language, one rendering engine, fewer toolchains to install, and built-in window APIs that map exactly to the requirements. Bundle size is the usual objection (a 2026 census of desktop apps found the median Electron app on macOS is roughly 15 times the size of the median Tauri app), but for a utility timer it does not affect the requirements.

**Timer accuracy is independent of the framework:** it comes from the end-timestamp design in ARCHITECTURE.md, plus `backgroundThrottling: false`.

**Reconsider if:** install size or idle RAM become real goals (then try Tauri 2 as a second evaluation, reusing this PRD and the engine, which is plain TypeScript), or you want a Mac App Store release.

## ADR-002: Styling and state

Plain CSS custom properties + React `useReducer`/hooks. No Tailwind, no UI kit, no state library. Fewer dependencies means fewer version-mismatch errors from AI-generated code, and the design is small enough that tokens cover it.

## ADR-003: Tooling (IDE and models) on free tiers

State as read from vendors' pricing pages by a third-party roundup on 2 Nov 2026 (the roundup's publisher also sells an app builder; verify directly):

| Tool                                              | What the free tier gives                                                                                                    | Notes                                                                                            |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Google Antigravity (agent app/IDE, VS Code-based) | Unlimited tab completions; agent models within weekly rate limits                                                           | Reads `AGENTS.md` (since v1.20.3, March 2026). Best free option for agent-style multi-file work. |
| VS Code + GitHub Copilot Free                     | 2,000 completions/month; chat and agent mode from a credit allowance whose size isn't published; model chosen automatically | Easiest setup; good overflow when Antigravity's weekly limit is hit.                             |
| OpenCode (terminal/desktop, open source)          | Free models included; can also sign in with an existing Copilot or ChatGPT account                                          | Zero-cost fallback; free models are smaller. Reads `AGENTS.md`.                                  |
| Kilo Code (VS Code/JetBrains extension)           | Free models, local models, or your own key                                                                                  | Alternative to OpenCode inside the editor.                                                       |
| Cursor Free                                       | Limited agent and chat requests                                                                                             | Runs out quickly in daily use; fine for a trial.                                                 |
| Claude (free chat)                                | Chat, files, limits every 5 hours and weekly                                                                                | No Claude Code on the free plan. Good for planning and reviewing designs by pasting docs.        |
| Cline                                             | Free extension, but no free AI (you pay a model provider)                                                                   | Skip for a $0 setup.                                                                             |

**Recommended free setup**

1. **Main:** Google Antigravity (IDE + agent). Install Node and Git first.
2. **Overflow:** VS Code with Copilot Free, same repo folder.
3. **Zero-cost fallback:** OpenCode with a free model when both limits are used up.
4. **Planning and review:** a free chat (Claude or Gemini). Paste a phase prompt plus the relevant doc and ask for a critique _before_ spending agent requests.

**Model choice:** free tiers mostly pick or restrict the model for you. Where you can choose, use the strongest model available for Phases 1 and 2 (engine, window and IPC: correctness matters most) and a faster/cheaper one for CSS tweaks and polish. Log which model you used in EVAL_LOG.md.

**Making free limits last**

- Keep `AGENTS.md` short (it's sent with every request); detail lives in `docs/` and is read only when needed.
- One phase per chat; paste error text, not summaries; point to file paths instead of pasting whole files.
- Use tab completion for small edits; save agent requests for multi-file changes.
- Commit after every green phase so a bad AI edit costs one `git restore`.
- Don't ask the AI to "fix everything"; ask for one acceptance criterion at a time.
