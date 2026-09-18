---
tags:
  - domain/presentation
  - status/open
  - origin/user-call
---

# Handoff: The Detailed Presentation Editor

**2026-09-18.** For a future session in this repo that picks up the presentation's authoring tools. The walkthrough shipped as v1.0.0 and its YouTube cut is uploaded, so the visitor side is done. What is left is the "tools pass" that the video project's `plan-presentation-design-pass` deferred: turning the dev-only editing surfaces into one deliberate editor. Written from a read of `origin/main` at `731bfce`.

Read first: [[presentation-system]] (what the presentation is made of), `docs/demo-script.md` sections "Presentation mode", "Frames" and "The editor (dev only)", and [[handoff-presentation-2026-09-16]] (what shipped).

## Running it

1. In the app checkout, create `.env.development.local` (gitignored) with the video pipeline's cues folder, **with forward slashes**:

       PRESENTATION_NOTES_DIR=C:/workspace/redlamp-videos/videos/color-taylor-demo-test/cues

   Backslashes were mangled in the `color-taylor-prez` worktree: `\r` vanished and `\v` became a vertical tab, so every middleware pointed at a folder that does not exist. It was fixed on 2026-09-18, and a backup of the broken file sits beside it.
2. `bun dev`, then open `http://localhost:5173/?present=cut-05`. Add `&frames=16:9` for the framing layer, `&clock=plan` to play the plan instead of the audio.
3. All three middlewares return 404 with `PRESENTATION_NOTES_DIR is not set` when the variable is missing. That is the first thing to check if an editor does nothing.

## What exists today

Everything below is dev-only (`mode === 'dev'`). A build ignores `?present=`.

| Surface | Open with | Edits | Writes to |
|---|---|---|---|
| Timeline (`PresentationMode.tsx`) | `?present=<cut>` | nothing; scrub, line spans, cue ticks, beat band, sections, readout | none |
| Notes | **N** or the Note button | timestamped notes keyed to the nearest line; copy as markdown; two-click clear | `POST /__notes/<cut>` into the video repo |
| Clip editor (`ClipEditor.tsx`) | double-click a line on the timeline (not under `&clock=plan`) | a line's in/out trim, gap before, internal cuts; three waveforms at one scale; `[` `]` walk lines; follow-timeline toggle | `POST /__clip/<cut>/<id>`, which rejoins, retimes and copies |
| Frames (`Frames.tsx`, `frameState.ts`) | `?frames=16:9` (or `1:1`, `9:16`, `4:5`), then **F** | draw, move, resize, nudge and reset regions; delete a keyframe; `ms` and `hold` fields | `POST /__frames/<cut>`, both repos at once |

## Keys

| Key | Where | Does |
|---|---|---|
| Space | timeline | play and pause |
| Left, Right | timeline | seek 5 s; under a frame layer, jump to the previous or next keyframe |
| Shift+Left, Right | under a frame layer | the 5 s seek |
| N | timeline | add a note |
| C | timeline | collapse the bar |
| T | frame layer or capture | show the bar over the picture, for editing only |
| F | frame layer | full-page view with outlines |
| R | full-page view only | write a `reset` keyframe at the playhead, **to disk at once** |
| Arrows, Shift+arrows | full-page view with a region in force | nudge the region; claimed before the timeline's arrows |
| Escape, `[`, `]` | clip editor | close; previous and next line |
| Left, Right on a handle | clip editor | nudge that handle 10 ms |

Every handler ignores Ctrl, Meta and Alt chords. `docs/demo-script.md` also lists **x** to delete a keyframe, but no such binding exists; deleting is the Delete button only. Fix the doc or add the key.

## Where edits land

The middlewares live in `vite.config.js` and derive the video repo from the one variable: `VIDEO_DIR` is the cues folder's parent, `VIDEO_REPO` two levels above that.

- **Notes** are only ever in the video repo (`<cues>/<cut>-notes.json`). An empty write is refused with 409 unless `clear: true`.
- **Frames** write the video repo's copy and `public/scripts/<cut>-frames.json` together, with the same empty-write guard.
- **Clip Apply** rewrites `<cut>-placement.json`, runs `tools/takes/place-lines.mjs join` (with `--plan` when a plan exists) and `tools/script-table/retime-actions.mjs`, and copies the actions, lines and `.m4a` into `public/scripts/`. It then re-cuts the camera clip in the background (poll `/__clip/<cut>/status`), and records the edit as a `clip x.y:` note, re-anchoring the other notes. One rebuild at a time; a second Apply gets 409.
- Nothing edits `<cut>.json` (the cues), `-sections.json`, `-words.json` or `-plan.json`. Those come from the video pipeline or from hand-editing.

## Sharp edges, each learned the hard way

- **R writes at once.** Three times on 2026-09-16 a stray R turned the opening 130% into `reset` and a take went out at 100%. It is now gated to the full-page view. Any new destructive key needs the same care, or an undo.
- **Ctrl+R used to save a keyframe on every reload**, seven times before it was found. Hence the chord guard on every handler.
- **Setting `audio.currentTime` directly fires every cue in between** on the next frame. Always seek through the runner's `seek()`, as `PresentationMode`'s own seek does.
- **Probing while an agent edits the runner** sees hot reloads mid-run. Re-probe once the edits stop.
- **`public/scripts/` is unwatched by Vite** on purpose: the pipeline replaces those files while the server runs, and the watcher used to crash it.
- **Node is spawned through a shell** from the dev server; spawning it directly dies on Windows with `0xC0000142` and no output.
- **The editors are static imports** in the presentation chunk (`PresentationMode.tsx` lines 92 and 93), so visitors download them. The design pass listed a lazy import as a small fix.
- **No tests** touch the clip editor, frames or the three middlewares. The `presentation-*.spec.ts` files test the unrelated intro deck.

## What a detailed editor would add

Today these are JSON-only:

- **Cues** (`<cut>.json`): timing offsets, targets, values, gestures and callouts. No UI edits a single cue. This is the biggest gap, and it is where most of cut 05's rounds of notes were spent.
- **Sections**: labels and anchor lines in `<cut>-sections.json`.
- **Captions**: chunk boundaries, forced breaks, corrected words. The video project's `srt-from-cut.mjs --breaks` file (one caption per line, `|` wraps) is a working model for the break editing.
- **Frame regions by number**: x, y, width, height, `zoom`, a target's `pad`, and `ease`. Only `ms` and `hold` have fields.
- **Placement flags**: `noAutoTrim` and `note` are shown in the clip editor but cannot be set.
- **The plan** (`-plan.json`): read-only, with no write route.

## Open questions for Taylor

From the design pass's tools section, still unanswered:

- Which surfaces a fresh author needs on day one.
- Whether notes and the clip editor become one panel.
- Whether the frames group stays hidden until `?frames=` names a ratio, or gets a switch.
- Whether the status line of shortcuts becomes a help overlay.
- Captions on the shipped bar, deferred at v1.0.0.

## Ground rules that carry over

- Taylor verifies in the browser. Agents run tsc, eslint and seek checks, headless and muted; no audio in the browser pane.
- Cues are data, not code. Every value change on screen is cursor-driven, and there is one cursor.
- Frames are capture-only and never ship.
- The clip editor's Apply rejoins on the plan and retimes from the extras only.
- `src/demo/` and `public/scripts/` are the presentation side's; `src/components` and the About panel are the app side's.

Related: [[presentation-system]], [[handoff-presentation-2026-09-16]], `docs/demo-script.md`. In the video repo's wiki: `plan-presentation-design-pass`, `decision-clip-editor-apply-rejoins-on-the-plan`, `decision-frames-are-capture-only`.
