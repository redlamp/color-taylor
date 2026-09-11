# The Picker Demo: Script and Timing

The self-running demo behind the `?` button, beat by beat, as it actually runs.
Five steps and a sign-off, **41.4 seconds** of budgeted beats — a little more
measured end to end, the difference being the opening pose and frame
boundaries.

Everything here is generated from the code, not written alongside it. If you
change a number in this document, change it in the file named beside it — the
timings are not read from here.

- Choreography and all pacing: `src/demo/steps.ts`
- The hands (moves, drags, clicks, hover): `src/demo/drive.ts`
- The panel, cursor and player: `src/demo/DemoRunner.tsx`

To watch it faster while editing, add `?demospeed=N` to the URL (1–20). It
divides every duration below **except** the sign-off's four-second hold, which
is reading time and stays as it is.

---

## The lines

All of it side by side, for reading the copy against the clock without chasing
it down the page. "Room" is roughly how many words fit at a conversational
150 wpm — the gap between that and the line's own length is how much air the
step has, and where a longer line could go without changing a single timing.

| # | Line | Runs | Words | Room |
|---|---|---:|---:|---:|
| 1 | Start with the sliders and controls you already know. | 8.3s | 9 | ~21 |
| 2 | Moving one slider will highlight every other slider it affects. | 8.1s | 10 | ~20 |
| 3 | Click the ⟨droplet⟩ to switch between ⏎ Source or Mixed colored sliders. | 5.5s | 11 | ~14 |
| 4 | Click the ⟨tags⟩ to show HTML colors on the hex. | 5.3s | 9 | ~13 |
| 5 | Drag a handle on the hex and watch the RGB and HSB sliders follow. | 9.9s | 14 | ~25 |
| — | Have fun! | 4.4s | 2 | — |
| | **Total** | **41.4s** | | |

⟨droplet⟩ and ⟨tags⟩ are the controls' own glyphs, drawn inline as the pills
they are on the toolbar, so the line points at the thing the ghost presses.
"Click" reads "Tap" on a touch device - the same test that picks the ghost's
touch disc over its arrow. The narration reads the glyphs as "the droplet" and
"the tags".

Four things worth knowing before you rewrite any of them:

- **The line does not set the timing.** Each step runs for as long as its
  choreography takes, and the caption sits there for all of it. Making a line
  shorter does not make its step shorter; it just leaves the panel quieter for
  longer. To change a step's length, change its beats — the tables below say
  which.
- **Every line has to fit two rendered lines.** The panel lays all of them out
  in one cell and holds the height of the tallest, so a caption that wraps to
  three makes the panel taller for the whole demo, not just its own step. At the
  header's width that is about 70 characters, which all four are inside. A
  phone is narrower and takes the two longest to three lines regardless; the
  panel is 90px on a desktop and 161px there.
- **Step 3 is the tightest, and it is now tight enough to matter.** Eleven
  words in 5.5s leaves about three words of headroom, and its line break is
  written in (⏎ above) rather than left to the wrap. If a recorded line runs
  long the step stretches to fit it rather than clipping, but the choreography
  stops being what sets its length — put `blendHold` back to 1100 if that
  bothers you.
- **The sign-off's 4.4s is not reading time at all.** The walk home, the colour
  tweening back and the exit all happen *inside* the hold rather than before
  it, and together they take 2.7s of it. Two words never needed four seconds;
  the goodbye is what sets this.

## The landing colour

Steps 1 and 2 both finish on **h216, s69** — and step 2 on **b100** as well,
which together are the app's own default colour. Step 3's gestures are all
sweeps that hand the colour back where they found it, so the demo sits on that
colour from the end of step 2 until the sign-off puts the user's own back.

It is `LANDING` in `src/demo/steps.ts`, and it is one constant because the three
surfaces reach it from different directions: the colour box by saturation and
brightness, the hue strip by height, the hexagon by angle and radius. A demo
that stops wherever its last gesture happened to end reads as a recording of
somebody fiddling.

**The order is load-bearing.** The colour box is the only one of the three whose
mapping cannot degenerate — x and y are saturation and brightness directly, with
no cross-section to collapse and no angle that is undefined at the centre. The
hexagon's field is a hexagon of radius `b/100`, which at `b=0` is a point: every
position maps to the middle, and step 2's lap would happen inside no pixels at
all. Opening on the colour editor means the hexagon is always handed a colour at
full brightness. From a black start the lap's radius measures 109–171px; it
would be zero the other way round.

Landing on a *chosen* colour is why `DemoHost` has a `field()` reader. A gesture
on the hexagon or the box is a position rather than a delta, so a step that
means to end somewhere has to know where it is starting from. It is the only
thing the demo reads rather than works.

## What the demo takes over, and what it leaves alone

The rule is that the user's tool comes back exactly as they left it, so the demo
borrows as little as it can.

| | |
|---|---|
| **The colour** | Borrowed. Snapshotted at the start and tweened back at the end or on a skip, including the exact RGB where it differs from what HSB would derive — `hsbToRgb(rgbToHsb(rgb))` changes 86.4% of 8-bit colours, so a value typed as `R=137` would not survive the round trip. |
| **Collapsed sections** | Opened, if closed, and closed again afterwards. It has to ask rather than notice: a collapsed section keeps its children mounted so its height can animate, so it looks exactly like an open one to a `querySelector`. Left alone, the script drove controls inside a clipped zero-height row — the colour landed correctly and the ghost traced a careful pattern over a closed panel. `utils/demoSections.ts`, two window events, the same shape as `color-taylor:reset-all`. |
| **Slider banks** | Left alone. It used to force RGB + HSB and hand the arrangement back, which flickered HSL off and on again for anyone showing all three. Nothing in the script targets a particular bank any more. The one exception is a user with every bank closed, where the step about what lights up would have nothing to light. |
| **Blend** | Left alone. Step 3 presses the toggle an even number of times, so it demonstrates the same thing from either state and gives it back either way. Still restored, because a skip part way through would leave it flipped. |
| **HTML colours on the hex** | The same: step 4 presses it twice, and it is restored for the same reason. |
| **The wheel** | Off. Nothing in any host lets the wheel over the field change brightness any more: it is a scroll gesture on a trackpad and in device emulation, so the one place on the page you most want to look at while scrolling past was the one place that ate the scroll. Turning it off also gives the browser its scrolling fast path back over the hexagon. |
| **Scroll position** | Not restored, but the last beat returns to the top of the page rather than leaving you wherever the script finished. On a desktop window that fits the tool it is a no-op; on a phone it is the difference between ending on the app and ending on six sliders. |

"Default Settings" goes further than the demo does: it also returns every
section to open or closed as a first visit finds it, which the demo deliberately
does not touch beyond the two it needs.

## How the ghost moves

Three shapes, and they are not the same shape:

| | |
|---|---|
| **The line a move takes** | A quadratic bezier bowing to one side, then the other: never a straight line, in `drive.ts`. The bow is 10% of the travel, so a hop to the next button over is very nearly straight and a trip across the tool visibly curves, capped at 140 px so a full-width move does not swing out of the window. A leg with an end off screen — the entrance, the exit, the reach out past the right edge for the camera panel — bows 22%, because most of its length is off screen and at the on-screen fraction 10% is the straight line it is trying not to be. |
| **Travel** between one target and the next | Smootherstep, in `drive.ts`. It was easeInOutQuad, which lands from twice its average speed and does the whole deceleration in the last quarter — across the tool that is 44px per frame arriving in under a fifth of a second, and it reads as the hand being stopped rather than stopping. The quintic has zero acceleration as well as zero velocity at both ends. |
| **Gestures** — every drag | Written as a function of `smooth(t)`, the plain cubic, with a linear clock so the shaping applies once. `sin(pi * t)` is at its fastest as it lands; `sin(pi * smooth(t))` traces the identical path at the same peak speed but starts and stops at rest. Not the quintic, whose steeper middle would speed up the turn as well as softening the ends. |
| **Arriving and leaving** | The ghost starts parked below the bottom of the screen and travels up into its first target, fading in over `EXIT_MS` as it comes — the mirror of the fade it leaves on. The fade starts on the first frame it actually moves, not on mount: the opening pose waits before anything travels, and a fade spent while the thing is still off screen is a fade nobody sees. Measured at speed 1, full strength at 864ms, which is about when it arrives. |
| **The lean** | A heavily damped spring on four frames of smoothed velocity, in `DemoRunner.tsx`. Sway, not spring: it follows the direction of travel and settles without ringing. Vertical travel counts for half of horizontal — the arrow's body runs from its point at (1,1) down to about (5,12), and a body trailing its point swings by the cross product of those two, which is about 0.36; half because it is meant to be fun. It used to count for nothing, so the brightness bar and the hue strip moved a perfectly rigid arrow down a track. |

## The pacing dial

Every duration in the script is one of these, in the `DWELL` block at the top of
`src/demo/steps.ts`. Change one and every beat that uses it moves together.

| Name | ms | What it covers |
|---|---:|---|
| `move` | 520 | Travel between two targets inside one panel |
| `moveFar` | 680 | Travel across the width of the tool |
| `hoverStem` | 900 | Standing on a stem, long enough to read its tooltip |
| `hoverJoint` | 1100 | Standing on a joint, which shows more than one tooltip |
| `beforeAction` | 400 | After arriving, before the hand starts working |
| `afterAction` | 950 | After a drag lets go, while the highlights are still lit |
| `betweenSteps` | 300 | Between two actions inside one step |
| `dragTip` | 3800 | The hexagon's tip handle, once round the field |
| `dragBox` | 2800 | The colour box |
| `dragHue` | 2600 | The colour editor's hue strip |
| `dragBar` | 2600 | Each of the hexagon's two bars (unused by the current script) |
| `dragSlider` | 2600 | Each of the two sliders in step 2 |
| `blendHold` | 1000 | How long each blend state is held up for inspection |

Sweeps that are only meant to show a range go out and back along their track,
toward whichever end has the room. They used to swing symmetrically about the
handle and clamp to the smaller side, which collapses to nothing at an end of a
track — exactly where the brightness handle sits at the landing colour, so that
gesture moved a few pixels and looked broken. `sweepFrom` in `steps.ts` is the
shared version.

The gestures that have to *arrive* somewhere — the tip, the box, the hue strip —
are written in their control's own units instead, with every wobble term
multiplied by something that vanishes at t=1. That is what makes the landing
exact rather than approximate.

Four more live beside them, and are named in the beats below:

| Name | ms | Where |
|---|---:|---|
| `CLICK_MS` | 110 | `src/demo/drive.ts` — how long a press is held before it becomes a click |
| `HSB_TWEEN_MS` | 1000 | `utils/colorTween.ts` — the colour's own tween, which the ghost rides home |
| `EXIT_MS` | 900 | `steps.ts` — the ghost's walk off the screen |
| `SIGN_OFF_MS` | 4000 | `steps.ts` — how long "Have fun!" stands, the goodbye included |

---

## Step 1 — The colour editor · 8.3s

> **Start with the sliders and controls you already know.**

Narration: `public/demo/01-color-box.mp3`

The demo opens here on purpose. This is the control every other tool has, so
the first thing that moves is a thing the user already knows — and it is the one
gesture that works identically from *any* starting colour, which is what makes
black and white ordinary rather than a special case. See below.

The box first, then the hue strip beside it — saturation and brightness alone
never leave the one hue, and the pair is what makes it a picker.

| Beat | ms | What happens |
|---|---:|---|
| `moveFar` | 680 | Across to the colour box, pressing exactly where the handle already is. |
| `beforeAction` | 400 | A moment to read the caption. |
| `dragBox` | 2800 | Out through the dark and back up to the top edge, landing on **s69, b100**. |
| `betweenSteps` | 400 | |
| `move` | 520 | To the **hue strip**, at the marker's own height so nothing jumps. |
| `dragHue` | 2600 | Out to whichever end of the strip has the room, then back to **h216**. |
| `afterAction` | 950 | |

The strip loops; the ghost must not. This was a sine about the starting hue,
wrapped into 0–360 to find a height — right for the value and wrong for the
hand, because the frame the sweep crossed an end the cursor jumped the whole
length of the control. The path stays on the strip instead, and turns once
rather than twice: both ends only fit when the start and the target are both
near the middle, and a sweep that reverses twice in two and a half seconds
reads as fidgeting rather than as showing a range.

## Step 2 — What one value moves · 8.1s

> **Moving one slider will highlight every other slider it affects.**

Narration: `public/demo/02-impact.mp3`

This was two steps — "keep an eye open for the impact", then "here it is" — and
they read as the same point made twice, with a pause in the middle of one idea.

| Beat | ms | What happens |
|---|---:|---|
| `moveFar` | 680 | To a slider in the **first visible bank** — G by default. The bank block is centred in the band first, so every slider is in the shot. |
| `beforeAction` | 400 | |
| `dragSlider` | 2600 | Out and back along the track. Everything except the slider being held lights up. |
| `betweenSteps` | 300 | |
| `move` | 520 | To a slider in the **second bank** — HSB's S by default. |
| `dragSlider` | 2600 | The same, the other way round: now this bank is the one that stays dark. |
| `afterAction` | 950 | |

This was made on the hexagon's two bars, and the reasoning for that looked
sound: the bars are not in the slider bank, so the bank lighting up is
unmistakably somewhere else.

On a phone that reasoning inverts. The hexagon and the bank cannot be on screen
at once, so a gesture on the hexagon makes a claim about readouts the user
cannot see — the one step whose whole subject is what happens elsewhere,
demonstrated off screen. Two sliders from two different banks says the same
thing inside one card: neither lights itself, each lights the other, and the
hexagon's chain and bars light too for anyone with the room to see them.

Which sliders depends on what is showing, because the demo runs against the
user's own arrangement rather than setting it. It takes one from each of the
first two banks it finds.

Both gestures are sweeps that hand the colour back where they found it, which
is what lets the landing colour survive the step.

## Step 3 — Source and mixed · 5.5s

> **Click the ⟨droplet⟩ to switch between ⏎ Source or Mixed colored sliders.**

Narration: `public/demo/03-blend.mp3`

| Beat | ms | What happens |
|---|---:|---|
| `moveFar` | 680 | To the **blend button**. |
| `beforeAction` | 400 | |
| 4 × (`CLICK_MS` + `blendHold`) | 4 × 110 + 3 × 1000 + 950 | Four presses, each leaving a ring, ending where it started. |

## Step 4 — HTML colours on the hex · 5.3s

> **Click the ⟨tags⟩ to show HTML colors on the hex.**

Narration: `public/demo/04-html-colors.mp3`

The same shape as step 3, made about the hexagon instead of the sliders: the
tags button on the HTML colour row pins the named colours on the field, and a
second press takes them off again so the picker is left as it was found. It
sits before the chain step so the field the tip walks round is the user's own.
The button is on the same row as the blend toggle the step before ended on, so
the move is a near one.

| Beat | ms | What happens |
|---|---:|---|
| `move` | 520 | To the **tags button**. |
| `beforeAction` | 400 | |
| 4 × (`CLICK_MS` + `blendHold`) | 4 × 110 + 3 × 1000 + 950 | Four presses, the blend step's pattern: the named colours appear on the hexagon, go, appear, go. |

## Step 5 — The chain · 9.9s

> **Drag a handle on the hex and watch the RGB and HSB sliders follow.**

Narration: `public/demo/05-handles.mp3`

It comes last because it is the unfamiliar one, and because everything before it
fits in the colour editor — on a phone the demo does its first three steps in one
card and only scrolls once, at the end, to the thing worth scrolling to.

Going after the colour editor also hands it a colour at full brightness, which
matters more than it sounds: the hexagon's cross-section is a hexagon of radius
`b/100`, so a dark starting colour would collapse the whole field toward a point
and the lap below would happen inside a few pixels.

Three stops rather than all six, one per channel in chain order: a handle, a
stem, a handle. Visiting every stem and joint in order made the same point three
times; a tooltip names its channel whether or not you have seen its neighbour,
and by the third stop the pattern is established rather than still being
demonstrated. The stops are found by channel, through the `data-hold` the
hexagon marks each piece with, not by position along the chain.

| Beat | ms | What happens |
|---|---:|---|
| move + `hoverJoint` | 520 + 1100 | To the **red handle**. Its RED pill fades in. |
| move + `hoverStem` | 520 + 900 | To the **green stem**. GREEN. |
| move + `hoverJoint` | 520 + 1100 | To the **tip**, the blue handle. All three. |
| move | 520 | Back onto the tip to take hold of it. |
| `dragTip` | 3800 | **Once round the field**, plus however far the landing hue is from where it started — so it arrives on h216, s69 whatever colour the user was on. |
| `afterAction` | 950 | Let go and watch the highlights fade. |

The tour used to be a 56px nudge and back. That moved the readouts without ever
saying what the field *is*: a short arc near one hue looks like a colour being
adjusted, and a full turn looks like a hue wheel, which is what it is.
Brightness is untouched for the whole gesture — the mapping freezes its bound at
pointer-down and every point on the path stays inside it — so hue and saturation
are the only things moving.

## Sign-off · 4.4s

> **Have fun!**

The caption reads the step index, so "Have fun!" goes up the moment the last
step ends. The four seconds start there too, and the goodbye happens inside them
rather than before them — it used to run the walk home first, which left the
last tick sitting empty for nearly three seconds under a finished line.

| Beat | ms | What happens |
|---|---:|---|
| `SIGN_OFF_MS` | 4000 | "Have fun!" stands, the last tick running down as a timer. Everything below happens inside it. |
| ↳ `moveFar` | 680 | Home to the hexagon's tip — **only if the colour is going to move**. The demo lands on the app's default, so for a visitor who had not changed theirs the restore is a no-op and the walk is a cursor crossing the tool to watch nothing happen. `DemoHost.restoreMovesColour` is asked before the trip rather than after it. |
| ↳ — | — | The colour, the slider groups, blend and any section it opened all go back to what the demo found. |
| ↳ `HSB_TWEEN_MS` + 120 | 1120 | Skipped with the walk. Otherwise the ghost **rides the tip** while the colour tweens home, so the ending reads as the cursor putting the colour back rather than the colour leaving on its own. |
| ↳ — | — | The page rises to the top, so the last thing on screen is the tool — its title and its menu — rather than whatever the script was last working. |
| ↳ `EXIT_MS` | 900 | Walks off through whichever edge the panel is not on, fading as it goes. |
| `SIGN_OFF_FADE_MS` | 350 | The panel fades out and the demo takes itself down. |

The goodbye adds up to 2.7s where there is a colour to take home, so the panel
stands still and quiet for the last 1.3 of the four; where there is not, it is
just the 900ms walk off. Taking `SIGN_OFF_MS` any lower would start cutting into
the goodbye rather than into the pause.

---

## Narration

**The demo is silent on purpose.** The voice goes into a video instead, where
there is room to explain rather than to narrate 41 seconds of choreography over
the top of it. `NARRATION_READY` in `src/demo/steps.ts` stays `false` and the
speaker button stays hidden.

The plumbing below stays anyway. It costs nothing while the flag is off, the
lines are written and budgeted, and a demo that can speak is a decision away
rather than a rebuild away.

Each step names an audio file under `public/demo/`. Nothing goes looking for
them until that flag is `true`.

When it is on, **a step waits for both its choreography and its line** before
moving on. So a recording longer than the timing above simply extends that
step — the voice sets the pace, and these numbers become the floor rather than
the length. A recording shorter than the step changes nothing.

| Step | File | Words to fill the current timing |
|---|---|---:|
| 1 | `01-color-box.mp3` | ~8.3s |
| 2 | `02-impact.mp3` | ~8.1s |
| 3 | `03-blend.mp3` | ~5.5s |
| 4 | `04-html-colors.mp3` | ~5.3s |
| 5 | `05-handles.mp3` | ~9.9s |

## Things the timings cannot predict

- **Scrolling.** Any step whose target is not already clear of the demo panel
  scrolls it there first, and waits for the scroll to actually arrive rather
  than for a fixed time. On a desktop window big enough for the whole tool this
  never happens; on a phone it happens most steps, and adds roughly half a
  second each.

  Steps 2 and 3 ask for it whether or not they need it — `bring(el, true)` —
  and they ask for the *same* shot. Both are about the slider tracks, so both
  centre the bank block rather than framing the card: framing from the card's
  top pushes the last slider under the panel on a phone, and having the two
  steps disagree moved the page 112px between them, right as the first press
  landed.

  `scrollReaches` also settles when the page stops moving, not only when it
  arrives. A destination can become unreachable mid-flight — the page clamps at
  its own end, or the document grows or shrinks under a smooth scroll already in
  progress — and waiting out the full deadline for that costs the step two
  seconds and then starts it against a page that stopped moving long ago. The
  guard against the old bug is a "has it moved yet" flag: the frames before the
  animation begins look exactly like the frames after it ends.
- **Back and Next.** A step interrupted part way is abandoned at its next
  pause, so its remaining beats are simply not spent.
- **Reduced motion.** `prefers-reduced-motion` removes the arcs and the cursor's
  lean; moves become near-instant, which takes roughly 2.5s off the total.

---

## Video script runner (`?script=`)

A second player, for recording the app against a cut of the video rather than
for visitors: `src/demo/ScriptRunner.tsx`. It reuses the demo's `Driver` and
ghost cursor, so every gesture goes through the real controls. Dev builds only
(`bun dev`), like presentation mode; the production bundle never mounts it.

- The ghost is parked off screen through the bottom-right corner until the
  first action asks for it, and arcs in from there.
- `?script=<name>` loads `public/scripts/<name>.json` (for example
  `?script=cut-01`) and waits. The app opens exactly as on a first visit,
  welcome panel included; the script closes it itself (see `about-close`).
- Press **Space** to start, or add `&go=<seconds>` to start on a timer.
- The recording is silent. Add `&audio=1` to also play the voice track
  (`public/scripts/<name>.m4a`) from the same instant, for checking a take by
  ear; the clock is still the page's own, not the audio's.
- On start the page shows one white frame (~100 ms) for lining the recording
  up against the cut, then every action starts when the clock reaches its `at`
  (seconds). Actions are independent: a late one never delays the next, and a
  new action interrupts whatever the hands were still doing.
- The `demo` action starts the built-in demo; the runner's cursor hides while
  it runs and due actions are held until it exits. The demo's own ghost starts
  from exactly where this one stopped, so the two read as one cursor changing
  hands.
- An action marked `"over": "demo"` runs anyway, and for as long as it does
  this runner's cursor is on screen and the demo's is hidden. The demo's
  sign-off choreography — the walk home and the color tweening back — waits
  for it, so the gesture is the only thing moving (`src/demo/handover.ts`).
- Under `?script=` and `?present=` the app also mounts the camera panel
  (`src/demo/CameraPip.tsx`): a fixed 399x362 box in the bottom-right corner
  at a 20 px margin with a 12 px radius, matching the OBS picture-in-picture.
  It shows the webcam where `getUserMedia` is allowed and a dark plate with a
  camera glyph where it is not. The `pip` action drags it off screen and back.

The JSON is `{ "actions": [ { "at": 9.1, "do": "rest", "target": "help-button" }, ... ] }`.

| `do` | Fields | What it does |
|---|---|---|
| `rest` | `target` | Move to the target and stay. |
| `hover` | `target`, `ms` | Move, then wait `ms`. |
| `walk` | `targets[]`, `ms` | Visit each target in turn; `ms` is split evenly (400 ms travel, the rest dwell). |
| `click` | `target` | Move and click. |
| `loop` | `target`, `ms`, `turns`, `wobble` | A hand-drawn circuit around the target: `turns` full turns (default 1.3) over `ms`, hovering only. The radius is about 0.55 of the target's half-width (for `hex-field`, the hexagon's radius), modulated by a slow irregular wobble of `wobble` x radius (default 0.18) and squashed slightly on y, so it is never a perfect circle. Around a target with a box (`editor-top`) it is a flat ellipse the width of the box. Starts and ends at rest. |
| `circle` | `target`, `ms`, `turns`, `wobble`, `hold`, `color` | A ring that draws itself around the target over `ms` (default 1200): the same circuit at the target's own radius (`letter:*` rings the letter at 1.6x its half-size; an element without one uses half its width), a little over one lap (default 1.1 turns); around a target with a box (`slider:<c>`, `editor-top`, `editor-sb`, `editor-hue`) it is a flat ellipse the shape of the box. The cursor is not involved, so a `circle` can share its `at` with a `hover` and neither cuts the other short; no later action cuts it short either (only a seek clears it). The ring stands for `hold` ms (default 900) and fades out over 300 ms. `color` is any CSS color; the default is the layer's own red. |
| `rect` | `target`, `from`, `ms`, `hold`, `hands`, `pre`, `color` | A selection marquee around a target that has a box (`sliders:rgb`, `sliders:hsb`, `values:rgb`, `value:<bank>-<ch>`, `slider:<c>`, `row:<c>`, `editor-top`, `editor-sb`, `editor-hue`), hovering only: the cursor travels to the corner `from` (`tl`, `tr`, `br`, `bl`) and drags to the opposite one, on a diagonal bowed a few pixels off straight, and a rectangle grows with it. The travel (up to 400 ms) is inside `ms` (default 1100); the diagonal gets the rest, never under 400 ms. If the next action takes the cursor before the diagonal is done, the box snaps to its full size rather than standing half drawn. The finished box stands for `hold` ms (default 900) and fades over 300 ms; the cursor stays where it landed unless the next action moves it. Total on screen is about `ms` + `hold` + 300. With `"hands": "free"` the box draws itself on the layer, like a `circle`: it grows from the corner `from` to the opposite one over the whole `ms`, the cursor is not involved, and it neither interrupts nor is interrupted, so it can run over a drag (the RGB values while the saturation bar is being lowered). No scrolling in that case: the target has to be on screen already. `color` is any CSS color; the default is the layer's own red. With `"live": true` the box measures its target every frame — while it is drawn and for the whole of `hold` — so it tracks a group whose size is the point (`range:rgb`, the span of the three RGB handles, which opens as saturation rises and closes to a sliver at gray). `live` is hands-free by definition; the cursor is busy elsewhere. With `"pre": true` the travel is skipped and the whole `ms` is the diagonal: cue a `rest` at `corner:<target>:<from>` half a second earlier and the box starts growing on its cue rather than a trip's worth of time after it, which is what a marquee that has to begin on a spoken word needs. Ignored when the hands are `free`, which never travel. |
| `ray` | `ch`, `ms`, `hold`, `color` | A bar along one channel's axis, from 24 px behind the middle of the hexagon out to 20 px past that channel's vertex letter, so it holds both of the things it is joining; 36 px thick, growing outward over `ms` (default 1200), then held for `hold` (default 900) and faded. The angle is read off where the letter actually sits, so the three rays are 120 degrees apart because the hexagon is. Self-drawn like a `circle`, so it neither takes the hands nor gives them up. `color` defaults to the channel's own: red `#ff3333`, green `#2ecc40`, blue `#3b82f6`. |
| `orbit` | `ms`, `turns`, `wobble` | Drag the hex tip round the field, so the stems follow: the hue sweeps `turns` laps (default 1) and lands back on the starting hue (whole laps go round; the fraction is an out-and-back bulge), while saturation wanders by about 3 x `wobble` (default 0.15) around where it started, held to 0.55-1.0, and returns to it. |
| `stem` | `ch`, `amount`, `ms` | Grab the `r`, `g` or `b` stem at its midpoint and drag it along its own axis by `amount` x its length (+ outward, - inward), then let go. The channel changes by that fraction of its value. |
| `wander` | `target`, `targets[]`, `ms` | A playful curved move to the target: a cubic bezier whose two control points sit 25% of the trip off the line, one to each side, eased. With `targets` instead of `target` it is one Catmull-Rom spline from where the cursor is through every named place in turn (default `ms` 2400), eased over the whole run — a single S across the region rather than a chain of moves that stops dead at each waypoint. Hover only. |
| `demo` | | Start the built-in demo, its ghost picking up from where this one stands. |
| `pip` | `to`, `ms` | Drag the camera panel off the right edge of the viewport (`"to": "off"`) or back to its home corner (`"to": "on"`) over `ms` (default 1200). The ghost travels to the panel's top-left corner, presses, and the panel moves with it; nothing listens, so the gesture is the whole effect. After an `"off"` the hand curves away to the off-screen bottom-right corner it came in through, rather than being left at the lip of the edge it just crossed. A seek puts the panel wherever the last `pip` before that moment left it, without the gesture. |
| `slider` | `target`, `from`, `to`, `ms` | Press the track at `from` and drag to `to` (0-100 along the track) with smoothstep. Targets: `hex-sat`, `hex-bri`, `slider:<c>`, `editor-hue` (the Color Editor's hue strip, 0-360 down it; `from` defaults to the current hue, so the press lands on the marker). The travel to the track comes before `ms`, except on `editor-hue`, where it is inside `ms` (up to 400 ms; the drag gets the rest, never under 400 ms) so the drag lands before the next action takes the cursor. |
| `box` | `target`, `from`, `to`, `ms` | Drag the Color Editor's saturation/brightness handle: press at `from` and drag to `to`, each an `[s, b]` pair (0-100), with smoothstep. `target` is `editor-sb`; `from` defaults to the current color. The travel is inside `ms`, as for `editor-hue`. |
| `tip` | `degrees`, `to`, `ms`, `via` | Drag the hex tip so the hue turns by `degrees` at the current saturation; ends where the turn ends. With `"via": "hue-label"` the cursor takes the hexagon's hue pill (`hex-hue-label`) round the ring instead, and may be given `to` — an absolute hue, taken the short way round — in place of `degrees`, so a cue can say where the pill ends up without knowing where the last gesture left it (`degrees` wins if both are there). The grip is the pill's outer rim, on the ray from the hexagon's center, 2 px clear of it, and stays there as the pill moves with the hue. It cannot be a corner of the pill: the control reads hue as the pointer's angle from the center and draws the pill on that angle, so the pointer is always on the pill's own radial line and a pill held off to one side would swing under the cursor. With the tip on the rim the arrow's body trails away outside the pill, off the number for most of the ring (it crosses the pill for hues in the upper left, where outward is up-left and the body goes down-right). The pointer's angle is exactly the hue wanted at each frame, so pressing does not nudge the hue and a 360° turn lands back on the hue it started from. The travel to the pill scales with the distance and is nothing when the cursor is already there, so a turn cued 1.5 s before the next has its whole `ms`. |
| `underline` | `target`, `ms` | Underline a link: travel to just under its bottom-left (4 px below the text), then sweep to just under its bottom-right over `ms`, bowing a couple of pixels down in the middle, and rest there. Hover only; nothing is pressed. The target is polled for up to 600 ms until it exists and its box stops moving, so a link in a panel that is still animating in is measured once it has landed. Targets: `about-author`, `demo-caption`. |
| `color` | `h`, `s`, `b` | Tween the app color (the app's own tween length; `ms` is ignored). |
| `scroll` | `target` | Smooth-scroll the target to the center; `top` scrolls to the top of the page. |
| `leave` | | Walk the cursor off screen. |

Targets: `about-watch-demo` and `about-close` (the welcome panel's "Watch
Demo" and "Get Started" buttons; clicking `about-close` dismisses the panel
through its normal handler), `help-button`, `editor`, `editor-top` (the
Color Editor panel's header band, the top 60 px), `hex-field` /
`hex-center`, `between-panels`,
`hex-tip`, `hex-hue-label` (the hexagon's hue pill, `#hue-handle`; the point
is its outer rim, see `tip`), `stem:r|g|b`, `corner:r|y|g|c|b|m` (a vertex of
the hexagon), `corner:<target>:<tl|tr|bl|br>` (a corner of any target that has
a box — `corner:sliders:rgb:tl` — so a `rest` can put the hand where a `pre`
marquee is about to start),
`letter:r|g|b` (the vertex letters on the hexagon), `slider:<c>` for
`rgb-r|rgb-g|rgb-b|hsb-h|hsb-s|hsb-b|hsl-h|hsl-s|hsl-l` (a bare `r`, `g` or
`b` means the RGB bank's), `sliders:rgb` / `sliders:hsb` (a whole bank, for
`rect`), `values:rgb` (the RGB bank's three numeric fields, the steppers,
as one padded box for `rect`), `value:<bank>-<ch>` (one channel's stepper on
its own, for naming a single readout: `value:hsb-h` is the H number),
`handle:<c>` (one slider's marker — the ring handle, or the arrow under the
track on the banks that draw one — for a ring that means "this value" rather
than "this control"; the ring is 1.8x its half-size, floored at 18 px),
`row:<c>` (a channel's label, track and stepper together - the whole row,
including the letter to the left of the track, which `slider:<c>` leaves out,
its box being the track only), `range:rgb` (the span the three RGB handles
occupy: left and right edges on the outermost markers' own boxes, top and
bottom on the R and B tracks or the markers, whichever reach further, padded
14 px across and 10 px down — for a `live` `rect`),
`hex-sat`, `hex-bri`,
`editor-sb` (the Color Editor's saturation/brightness box, `#sb-area`) and
`editor-hue` (its hue strip, `#hue-bar`),
`equations` (the section's toggle; a click opens and a second click closes),
`figma-banner`, `figma-button`, `editor-group:rgb|hsb|hsl` (the slider-bank
toggles; a click on one turns that bank on, another turns it off),
`settings-button` (opens the menu), `settings-about` (the menu's "About
Color Taylor"; only there while the menu is open, and looked up when the
action fires), `about-author` (the "Taylor Wright" link on the About panel,
for `underline`), `demo-caption` (the line the built-in demo is showing, as
the text's own span rather than the caption column's full width), `hsl-tab`,
`hsb-tab`, `top`. A target that is not on the page
(a dismissed banner, a closed slider bank) logs a `[script]` warning to the
console and the action is skipped.

Layers. The runner's whole layer — cursor, callouts, flash — sits at z-index
70: above the built-in demo's own panel and caption (z-60), because the demo is
a subset of the presentation and the presentation's hand is the one in front
(the cut points at the demo's "Have fun!" with the ghost), and below the
presentation transport (z-80), which is the tool rather than the picture. The
camera panel is z-55, under the hand that drags it.

Drawn callouts. `rect`, `circle` and `ray` draw into a fixed,
pointer-events-none SVG layer the runner keeps under its cursor and over the
app: an 8 px solid stroke in bright red `#ff3333`, a marquee with a 5% fill of
the same. `color` on any of the three overrides that stroke, which is how the
three channels get boxes and rays in their own colors on beat 3.3. Each shape
runs its own hold and fade timers, so two can overlap (the RGB marquee is
still standing when the HSB one starts) and the next action taking the cursor
does not take a shape down early. A `circle`, a `ray`, and a `rect` with
`"hands": "free"`, is drawn on the layer's own frame loop rather than by the
cursor. A seek clears them all.

Over the built-in demo. While the demo is on screen the runner's cursor is
hidden and every due action waits in line for it to exit. One action at a time
can opt out with `"over": "demo"`: it fires on its cue, with the ghost on
screen for as long as it runs, and the queue behind it goes on waiting. It is
meant for a gesture aimed at the demo's own chrome - the cut underlines the
demo's "Have fun!" sign-off on beat 2.8 - and not for anything that touches
the app, which the demo is driving.

The `color` action and the app's own gestures. The tween `color` starts is
the app's (`animateToHsb` in `useColorState`, 1000 ms), and it is cancelled
by anything that counts as the user taking the color over: a hue or field
drag on the hexagon, a slider, a swatch. The runner's hover gestures never
press anything, so a `wander` or `hover` over the field does not cancel it;
only a `tip`, `orbit`, `stem`, `slider` or `box` started before the tween has
finished does.

Hover looks. The ghost moves no hardware pointer, so `:hover` never fires
under it. The driver sends `pointerover`/`pointerout` (which React turns
into enter/leave), `mouseover`/`mouseout`, and non-bubbling
`pointerenter`/`pointerleave`, and sets `data-ghost-hover` on the element
under the cursor and its ancestors; `src/index.css` mirrors the hover rules
onto that attribute for the quiet buttons (the plugin banner's CTA) and the
slider-group toggles. Hovering `hex-tip` or a `stem:*` raises the hexagon's
channel tooltips the same way a pointer would.

## Presentation mode (`?present=`)

The same script played against its voice track, for reviewing the cut and
leaving notes: `src/demo/PresentationMode.tsx`. Dev builds only (`bun dev`);
the production bundle never mounts it.

- `?present=<name>` (for example `?present=cut-01`) loads
  `public/scripts/<name>.json`, the voice track `<name>.m4a` (gitignored: the
  audio is not source) and, if present, `<name>-lines.json` - the script's
  spoken lines as `{ beat, line, text, start, end }` in seconds of that audio.
- **The clock is the audio.** The runner's schedule reads
  `audio.currentTime`, so the actions land where the voice track says, on
  every play and after every seek. There is no sync flash. The runner itself
  takes a `clock` (`now()` in seconds and `running()`) and a `script`; without
  them it is in recording mode, exactly as above.
- A transport sits at the foot of the page, styled as a tool rather than as
  the app: play/pause (**Space**, when focus is not in a text field), time
  over total, and a timeline to click or drag. On the timeline every action is
  a tick (red for `color`, green for `demo`) and every line a shaded span,
  the current one in orange. Above it: the line being spoken, and the action
  in hand and the one after (`do` + target). While the `demo` action's span
  runs - from its `at` to the next action's - the readout says "demo would
  be running".
- **Seeking** interrupts whatever the hands were doing, applies the latest
  `color` action at or before the new time, puts the ghost on the last
  `rest`/`hover` target before it, and resumes dispatching from the first
  action at or after it. Nothing earlier fires again unless you seek back.
  A seek does not start or stop the built-in demo: seeking into its span
  only notes it, and if it is on screen, due actions are held until it
  exits, as always.
- **Notes.** Press **N** (or the Note button), type, Enter. Each note is
  `{ t, beat, line, text, created }`, beat and line from the line being
  spoken, listed under the transport in time order; the time seeks, `x`
  deletes. "Copy as markdown" puts them on the clipboard as
  `- [m:ss] beat.line — text`.
- Notes persist through a dev-server middleware in `vite.config.js`:
  `GET`/`POST /__notes/<name>` reads and writes
  `<PRESENTATION_NOTES_DIR>/<name>-notes.json` as
  `{ "source": "<name>", "notes": [...] }`. The default directory is the
  cut's cue folder in the videos repo,
  `C:\workspace\redlamp-videos\videos\color-taylor-demo-test\cues`.
