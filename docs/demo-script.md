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
| **The colour** | Borrowed. Snapshotted at the start and tweened back at the end or on a skip, including the exact RGB where it differs from what HSB would derive — `hsbToRgb(rgbToHsb(rgb))` changes 86.4% of 8-bit colours, so a value typed as `R=137` would not survive the round trip. **Not given back while a script is driving** (round 5 of cut 04): the walk home and the colour tweening under it are the demo's own ending and read right on their own, but under a recording they are a second colour move nobody cued — beat 10.6 is Taylor saying "having fun is the goal of the tool" over a colour the ghost put there, and the restore took it somewhere no cursor had been. So with a `ScriptRunner` mounted the demo skips the walk home, still restores the sections, the banks and the blend, and hands the colour it is leaving to the runner (`handover.holdColour`), which writes it straight back through the app's own setter in the same tick. The gate is `scriptRunnerPresent()` rather than whether the script claimed the moment: whether it claimed it came down to which side of `OVER_DEMO_GRACE_MS` its gesture landed on, so the ending differed run to run. |
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
| **A drag that carries something** | The camera panel's trip off the edge and back: a cubic bezier of its own, and the panel is written from the cursor's position every frame rather than run along a track, so both fly it. Nothing else the ghost drags moves on screen — a slider handle goes where its control puts it — so this is the one gesture that has a line of its own to draw. See `pip`. |
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

**Where a video script is pointing at this caption, there is no goodbye at all.**
An `over: "demo"` gesture takes the cursor off this demo for the rest of its run
(see the runner section below), so the walk home, the colour riding the tip and
the walk off are all skipped: they would be a hidden cursor travelling, and the
exit would hold the panel up for its own length while the script's hand waited.
What still happens is the restore — the colour, the groups, the blend, the
sections — and the return to the top of the page. The wait itself ends with the
tick that is visibly running down rather than when the script lets go, because
the script does not let go until this panel is gone.

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
- **The ghost has a speed limit**: 700 px per second of a move's own average
  (`MAX_MOVE_PX_PER_S` in `ScriptRunner.tsx`, enforced by
  `DriverOptions.maxSpeed` in `drive.ts`). A move asked to cover more ground
  than its `ms` allows is given the time it needs instead, so a long trip takes
  longer rather than going faster; nothing ever teleports. It was 1200, which
  only bound on the accidents. Cut 04 took it to 700, because Taylor wanted a
  stated maximum for the fast moves to be dialed against, and at 700 it binds on
  the choreography too — a hand crossing the tool takes about a second, and the
  letter clicks in beat 3.4 are visibly deliberate. Every stretched move is
  named in the console (`[script] t=Ns <do> <target>: move stretched by the
  speed cap - Npx asked for in Nms, given Nms`), which is how the plan finds the
  cues whose `ms` is too tight for the ground they cover. The built-in demo is
  deliberately left uncapped: its steps declare
  their durations as the sum of their own dwells, and a move allowed to overrun
  its `ms` would slide the caption that beat 2's audio is lined up against.
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
  it runs and due actions are held until it exits.
- An action marked `"over": "demo"` runs anyway, and **from the moment it
  starts this runner's cursor has the screen for the rest of the demo**: the
  demo's own cursor is hidden until it closes, its sign-off choreography — the
  walk home, the color tweening back, the walk off — is left out, and the cues
  behind the gesture stop being held, so the hand leaves on the word it is cued
  to rather than when the panel goes (`src/demo/handover.ts`). The demo's state
  changes still happen underneath: it hands the sections, the banks, the blend
  and the color back exactly as before. Taylor, round 7: "there should be one
  cursor and its motion should feel natural and match what I might be doing
  with my cursor." Handing the screen back for the goodbye meant two cursors in
  a second and a half, the second of them walking off the bottom of the window
  and this one then re-appearing from wherever it had left. One gesture, one
  hand, and the demo closes on its own countdown either way.
- **The two cursors are one hand.** `src/demo/handover.ts` is the single place
  that knows which cursor is live and where each one last stood: both report
  their position every frame, and whichever is arriving is put down on top of
  the one leaving, with no travel. A cut that uses `over: "demo"` changes hands
  twice — the script's ghost presses `?` and the demo's picks up there (whether
  the `demo` action opened it or, as in cut 02, the cut pressed the button for
  real and the app opened it itself), and the script's ghost comes back out on
  the demo's cursor for the `over: "demo"` gesture and keeps the screen from
  there. There is no third change: the demo's close finds the ghost already
  on screen, so it is left standing where it is rather than being put down on a
  point the demo walked out through. Where a cut has no such gesture, the exit
  still seeds the ghost, and from the last point the demo's hand was *seen* at
  — on the inside of the edge it left by, not the hundred pixels past it where
  it stopped — so the next gesture is a move across the screen rather than a
  flight in from below the fold. A position outlives the component that had it,
  which is what makes that possible.
- Under `?script=` and `?present=` the app also mounts the camera panel
  (`src/demo/WebcamPip.tsx`): a fixed **400x400** box in the bottom-right
  corner with a 12 px radius, matching the OBS picture-in-picture, at a 20 px
  bottom margin. It is square, and the footage is cut square to match — a
  1080x1080 window out of the 1920x1080 take. Its home `left` is computed at
  mount and on resize so the gap between the app frame's right edge
  (`#color-editor-group`) and the panel equals the gap between the panel and
  the display's right edge, falling back to the old 20 px right margin when the
  viewport leaves less than 8 px of gap on each side. It shows the webcam where
  `getUserMedia` is allowed and a dark plate with a camera glyph where it is
  not. The `pip` action drags it off screen and back, reading the panel's live
  box rather than its size constants, so a change of geometry needs nothing
  here.
- Under `?present=<cut>` it plays the cut's own footage instead: **one
  continuous file for the whole cut** (`scripts/pip/<cut>/full.mp4`, cut by
  redlamp-videos `tools/takes/cut-pip-clips.mjs`), the take where the panel is
  on screen and black frames for the middle, where it has been dragged off the
  edge. One file means the `<video>`'s `src` is written once and never again,
  which is what the pop at a span change used to be. `scripts/<cut>-pip.json`
  is the manifest and the rule is
  `video.currentTime = t - cutStart + clipOffset`, read every frame off
  presentation mode's `<audio>`. While it plays, drift past 40 ms is taken out
  by running the file at 0.98 or 1.02 until it is inside 20 ms — a `currentTime`
  write mid-play restarts the decoder and shows as a stutter — and a pause or a
  scrub still lands on the exact frame.
- **`webcam`**, its one prop, is how the shipped walkthrough hands its own
  `<video>` in: playback needs the click that opened the walkthrough, so the
  host creates the element and calls `play()` on it synchronously there, and
  the panel adopts it — appended into the panel box, muted and `playsInline`
  re-asserted, taking the manifest's file only when the element has none, and
  never rewritten when it already points at it. The element it renders itself
  is not mounted then; the hidden double still is. Without `?present=` in the
  URL an adopted element means the shipping cut, `CURRENT_CUT`, so the manifest
  is found with no query parameter to read. With neither prop and
  `&clock=plan`, there is no manifest and no `<audio>` to read, and the webcam
  or the plate stands in as before.

The JSON is `{ "actions": [ { "at": 9.1, "do": "rest", "target": "help-button" }, ... ] }`.

| `do` | Fields | What it does |
|---|---|---|
| `rest` | `target`, `anchor`, `dx`, `dy` | Move to the target and stay. |
| `hover` | `target`, `ms`, `anchor`, `dx`, `dy` | Move, then wait `ms`. `anchor` stands the hand clear of the target's own box instead of on its middle — `below`, `above`, `left` or `right`, 12 px out — and `dx`/`dy` nudge from wherever the anchor put it. A cursor parked on the middle of a small thing covers it: beat 3.6 hovers the Y, C and M letters while a ring is drawn round each, and without `"anchor": "below"` the hand sat on the letter being named. (It is `anchor` rather than `at` because `at` is the cue's own time.) |
| `walk` | `targets[]`, `ms` | Visit each target in turn; `ms` is split evenly (400 ms travel, the rest dwell). |
| `click` | `target`, `anchor`, `dx`, `dy` | Move and click. Anchored like a `rest`, so the press can land somewhere other than the middle of its control — beat 9.3 presses the Watch Demo card 55 px right and 14 px down, because a cursor on the middle of the card sits on the word "Demo" as it is being spoken. `dx`/`dy` with no `anchor` stay inside the control, which is what a press needs; the click is dispatched on the element either way. Two targets carry the control's own protocol rather than making the cut spell it out: on `swatches:recent-clear` the click is the pair the button asks for — press, 400 ms with "Sure?" standing, press again — and on `swatches:recent` the hand travels to the header but presses only when the group reads as closed, so a scrub back into beat 7 (or a replay in the same session, since a section remembers what has been opened) does not shut the thing the next cues are about. |
| `loop` | `target`, `ms`, `turns`, `wobble` | A hand-drawn circuit around the target: `turns` full turns (default 1.3) over `ms`, hovering only. The radius is about 0.55 of the target's half-width (for `hex-field`, the hexagon's radius), modulated by a slow irregular wobble of `wobble` x radius (default 0.18) and squashed slightly on y, so it is never a perfect circle. Around a target with a box (`editor-top`) it is a flat ellipse the width of the box. Starts and ends at rest. |
| `circle` | `target`, `ms`, `turns`, `wobble`, `hold`, `color`, `live` | A ring that draws itself around the target over `ms` (default 1200): the same circuit at the target's own radius (`letter:*` rings the letter at 1.6x its half-size; an element without one uses half its width), a little over one lap (default 1.1 turns); around a target with a box (`slider:<c>`, `editor-top`, `editor-sb`, `editor-hue`) it is a flat ellipse the shape of the box. The cursor is not involved, so a `circle` can share its `at` with a `hover` and neither cuts the other short; no later action cuts it short either (only a seek clears it). The ring stands for `hold` ms (default 900) and fades out over 300 ms. `color` is any CSS color; the default is the layer's own red. **On a marker that moves the ring goes with it:** on `handle:<c>` and `hex-tip` the whole ring is re-measured and redrawn every frame, through the draw and for the whole of `hold`, so a ring round the R handle follows it as saturation or brightness is dragged — which is the claim those lines are making. Everything else is drawn once and stands, since a readout (`value:<bank>-<ch>`) and a vertex letter do not move. `"live": false` turns the following off on a moving target, `"live": true` turns it on for any other. `ring` is a radius in client px and wins over whatever the target carries, for a mark that has to read as naming one small thing rather than the control it sits on - beat 6.1's ring on the R handle is `"ring": 20`. |
| `rect` | `target`, `from`, `ms`, `hold`, `hands`, `pre`, `color`, `radius`, `live` | A selection marquee around a target that has a box (`sliders:rgb`, `sliders:hsb`, `values:rgb`, `value:<bank>-<ch>`, `slider:<c>`, `row:<c>`, `editor-top`, `editor-sb`, `editor-hue`, `swatches:recent-row`, `swatches:saved-row`), hovering only: the cursor travels to the corner `from` (`tl`, `tr`, `br`, `bl`) and drags to the opposite one, on a diagonal bowed a few pixels off straight, and a rectangle grows with it. The travel (up to 400 ms) is inside `ms` (default 1100); the diagonal gets the rest, never under 400 ms. If the next action takes the cursor before the diagonal is done, the box snaps to its full size rather than standing half drawn. The finished box stands for `hold` ms (default 900) and fades over 300 ms; the cursor stays where it landed unless the next action moves it. Total on screen is about `ms` + `hold` + 300. With `"hands": "free"` the box draws itself on the layer, like a `circle`: it grows from the corner `from` to the opposite one over the whole `ms`, the cursor is not involved, and it neither interrupts nor is interrupted, so it can run over a drag (the RGB values while the saturation bar is being lowered). No scrolling in that case: the target has to be on screen already. `color` is any CSS color; the default is the layer's own red. With `"live": true` the box measures its target every frame — while it is drawn and for the whole of `hold` — so it tracks a group whose size is the point (`range:rgb`, the span of the three RGB handles, which opens as saturation rises and closes to a sliver at gray). `live` is hands-free by definition; the cursor is busy elsewhere. `radius` rounds the drawn corners: a number in client px, or `"pill"` for ends fully rounded to the box's shorter side, read from the box as it is now so a growing marquee is pill-ended at every size rather than only when it is finished. A highlight is not a marquee — beat 3.4 lights the R, G and B rows as each letter is pressed, and hard corners there read as something being selected rather than as the row being named. With `"pre": true` the travel is skipped and the whole `ms` is the diagonal: cue a `rest` at `corner:<target>:<from>` half a second earlier and the box starts growing on its cue rather than a trip's worth of time after it, which is what a marquee that has to begin on a spoken word needs. Ignored when the hands are `free`, which never travel. |
| `ray` | `ch`, `ms`, `hold`, `color` | A bar along one channel's axis, from 24 px behind the middle of the hexagon out to 20 px past that channel's vertex letter, so it holds both of the things it is joining; 36 px thick, growing outward over `ms` (default 1200), then held for `hold` (default 900) and faded. The angle is read off where the letter actually sits, so the three rays are 120 degrees apart because the hexagon is. Self-drawn like a `circle`, so it neither takes the hands nor gives them up. `color` defaults to the channel's own: red `#ff3333`, green `#2ecc40`, blue `#3b82f6`. |
| `line` | `targets[]`, `ms`, `hold`, `color` | A straight bar between two targets, drawn out from the first over `ms` (default 1200), then held for `hold` (default 900) and faded. The same 8 px stroke every other callout wears. Self-drawn like a `circle`, so a drag can run underneath it, and nothing later cuts it short. Measured once: what a `line` marks is a place on a control rather than a control, and the control does not move while it stands. Beat 6.3 is what it is for — "Brightness scales off of zero" wants the zero end of the three RGB tracks marked (`"targets": ["zero:rgb-top", "zero:rgb-bottom"]`) while the handles scale away from it. It used to run between the R and B track centres; Taylor asked for the full height of the block, which is what those two names are for. |
| `arrow` | `targets[]`, `ms`, `hold`, `color` | A `line` with a head on it: from the first target to the second, the head landing on the second and stopping clear of it so it points at the thing rather than sitting on it. It grows over `ms` (default 1200) with the head riding the tip, so a partial arrow is an arrow and not a line that sprouts a point at the end; then held for `hold` (default 900) and faded. Same 8 px stroke; `color` is any CSS color, default the layer's red. Hands-free, so the cursor is free to be hovering whatever the arrows are aimed at. Beat 3.6 is what it is for: yellow is named as red and green combined, and a red arrow off the R letter and a green one off the G letter, both landing on the Y, say that in the picture. |
| `orbit` | `ms`, `turns`, `wobble` | Drag the hex tip round the field, so the stems follow: the hue sweeps `turns` laps (default 1) and lands back on the starting hue (whole laps go round; the fraction is an out-and-back bulge), while saturation wanders by about 3 x `wobble` (default 0.15) around where it started, held to 0.55-1.0, and returns to it. |
| `stem` | `ch`, `amount`, `to`, `ms` | Grab the `r`, `g` or `b` stem at its midpoint and drag it along its own axis by `amount` x its length (+ outward, - inward), then let go. The channel changes by that fraction of its value. With `to` instead of `amount` the drag lands on a channel *value*, 0-255: the stem's length is its channel's value, so a pixel is worth the same everywhere along it, and the app's own reading is checked and the grip nudged still-pressed until it agrees, the way the hue pill's absolute `to` is. `"to": "start"` is the color the app was showing when the cut began — read at t=0, because a visitor may have been playing with the color before pressing Presentation, so the cut cannot write the number down. Beat 11.3 hands the tool back the way it was found with three of these, one per channel; leave about 1.8 s between them, since a `stem` pays for its trip to the stem outside its own `ms`. With `waves` the pull becomes a snake: the handle runs `amount` out along its stem and back that many times while the hand also bows across the axis, every term zero at both ends, and there is no settle because there is no value to arrive at. The app projects the pointer onto the stem's **live** direction, which rotates with the colour it is changing, so the path is not quite reversible - keep `amount` small (beat 2.8 uses 0.2) or the hue drifts further than "back where it started". |
| `wander` | `target`, `targets[]`, `ms` | A playful curved move to the target: a cubic bezier whose two control points sit 25% of the trip off the line, one to each side, eased. With `targets` instead of `target` it is one Catmull-Rom spline from where the cursor is through every named place in turn (default `ms` 2400), eased over the whole run — a single S across the region rather than a chain of moves that stops dead at each waypoint. **A single `target` that has a box is a region rather than a place**: the hand meanders inside it on one spline through five fixed stops, 12 px in from the edges (default `ms` 2400), which is how beat 3.1 drifts over the whole `editor-card` instead of arriving at its middle. The stops are fixed rather than random, so every take is the same shot. Hover only. |
| `demo` | | Start the built-in demo, its ghost picking up from where this one stands. |
| `pip` | `to`, `ms` | Drag the camera panel off the right edge of the viewport (`"to": "off"`) or back to its home corner (`"to": "on"`) over `ms` (default 1200). The ghost travels to the panel's top-left corner, presses, and the panel moves with it; nothing listens, so the gesture is the whole effect. **The trip is an arc, and the panel flies it with the hand**: one cubic bezier from home to off screen, bowing 9% of the travel at the home end and 13% at the off-screen end — so the apex is past the middle — with the off-screen end sitting 80 px below home (its resting position there) plus a twentieth of the travel further, which reads as a modest rise, a sweep out to the right and a descent through the edge. `"on"` is the same curve read backwards, so it starts from that lower off-screen point too. The panel is not on a track of its own: its transform is the cursor's position less the grip, x and y, written every frame, so the two cannot come apart. `ms` is the whole drag either way — the arc is a few per cent longer than the straight line was, which is inside the pace either gesture was written at. After an `"off"` the hand curves away to the off-screen bottom-right corner it came in through, rather than being left at the lip of the edge it just crossed. A seek puts the panel wherever the last `pip` before that moment left it, square and without the gesture — 80 px below home when it is off. **A cut whose first `pip` is `"on"` opens with the panel off screen**: the schedule parks it there before a frame is drawn, and a seek back past that first cue puts it back there rather than at home. Without that the panel sat in the corner through the 400 ms the hand spends reaching off the right edge for it, which is a walkthrough opening on the thing it is about to drag in. |
| `drift` | `ms` | Stay where the hand already is for `ms` (default 1200), wandering about ten pixels back along the line it is on and home again, with a smaller ripple across it. For a span the cut has nothing for the hand to do but has to keep it on screen — the countdown under the demo's "Have fun!" — where a parked cursor reads as a frozen frame. Every term is zero at both ends, so it neither jumps in nor out. No target: it drifts around wherever the last action left the hand. |
| `sway` | `target`, `anchor`, `dx`, `dy`, `ms`, `waves`, `amp` | Go to the target (anchored like a `rest`, so `"anchor": "below"` stands the hand clear of it) and then sway left and right there for `ms` (default 2000): `waves` cycles (default 2) of `amp` px (default a third of the target's width, floored at 26), with a half-amplitude ripple at twice the rate so the path is a flattened figure of eight rather than a line being retraced. Both terms are zero at each end. `drift` is the same idea with no target and no travel; this one arrives first and stands under the thing the line is naming - beat 11.1 under the plugin banner's button for the whole line, 11.4 under "made by Taylor Wright". A seek restores it as a resting pose, the way `rest` and `hover` are. |
| `slider` | `target`, `from`, `to`, `ms` | Press the track at `from` and drag to `to` (0-100 along the track) with smoothstep. Targets: `hex-sat`, `hex-bri`, `slider:<c>`, `editor-hue` (the Color Editor's hue strip, 0-360 down it; `from` defaults to the current hue, so the press lands on the marker). The travel to the track comes before `ms`, except on `editor-hue`, where it is inside `ms` (up to 400 ms; the drag gets the rest, never under 400 ms) so the drag lands before the next action takes the cursor. |
| `box` | `target`, `from`, `to`, `ms` | Drag the Color Editor's saturation/brightness handle: press at `from` and drag to `to`, each an `[s, b]` pair (0-100), with smoothstep. `target` is `editor-sb`; `from` defaults to the current color. The travel is inside `ms`, as for `editor-hue`. |
| `tip` | `degrees`, `to`, `sat`, `ms`, `via` | Drag the hex tip so the hue turns by `degrees` at the current saturation; ends where the turn ends. Without a `via` it also takes an absolute `to` — a hue, the short way round, the way the pill's is — and a `sat`, 0-100, so one drag on the hexagon's own face lands both channels the face carries. That is what "on the hex" means in cut 04's notes: the handle the stems hang off, not the stems and not the hexagon card's saturation bar. Beats 2.5, 2.9 and 3.2 are dialed this way (round 5). Brightness is not on the face, so it stays on the card's brightness bar. With `"via": "hue-label"` the cursor takes the hexagon's hue pill (`hex-hue-label`) round the ring instead, and may be given `to` — an absolute hue, taken the short way round — in place of `degrees`, so a cue can say where the pill ends up without knowing where the last gesture left it (`degrees` wins if both are there). The grip is the pill's outer rim, on the ray from the hexagon's center, 2 px clear of it, and stays there as the pill moves with the hue. It cannot be a corner of the pill: the control reads hue as the pointer's angle from the center and draws the pill on that angle, so the pointer is always on the pill's own radial line and a pill held off to one side would swing under the cursor. With the tip on the rim the arrow's body trails away outside the pill, off the number for most of the ring (it crosses the pill for hues in the upper left, where outward is up-left and the body goes down-right). The pointer's angle is exactly the hue wanted at each frame, so pressing does not nudge the hue and a 360° turn lands back on the hue it started from. The travel to the pill scales with the distance and is nothing when the cursor is already there, so a turn cued 1.5 s before the next has its whole `ms`. **An absolute `to` lands on the number, not near it**: the app reads hue as the whole degree nearest the pointer's angle and the grip comes back about a tenth of a degree short of the ray it was computed for, which at 0 rounds the wrong way and shows 360. So when the drag ends the readout is checked, and while it disagrees the grip is nudged a third of a degree at a time — still pressed, about a pixel of movement — until it agrees; four tries, then a warning in the console. `degrees` is not settled: a relative turn is a distance travelled, and 4.1's own 359.8 means to stop a fifth of a degree short. |
| `zigzag` | `ms`, `legs`, `degrees`, `sat`, | A zig-zag across the hexagon's field, worked on the tip handle: press where the handle already is, then cut across the field in `legs` legs (default 5) over `ms` (default 2400). The corners are values rather than places on screen — the hue steps evenly from `degrees` below the starting hue to `degrees` above it (default 70) while the saturation alternates between the two ends of `sat` (default `[35, 95]`) — so the path is a W laid over the hexagon whatever colour it starts from, and the brightness never moves. Eased leg by leg, because the corners are the one place a hand slows down. It ends on the last corner rather than back where it began: what follows reads the current hue and saturation as its own starting point. Where the tip is not on the page — the joints collapse into the middle at low saturation — the hue pill carries it instead, and the gesture is the hue half alone. |
| `underline` | `target`, `ms` | Underline a link: travel to just under its bottom-left (4 px below the text), then sweep to just under its bottom-right over `ms`, bowing a couple of pixels down in the middle, and rest there. Hover only; nothing is pressed. The target is polled for up to 600 ms until it exists and its box stops moving, so a link in a panel that is still animating in is measured once it has landed. Targets: `about-author`, `figma-text`, `demo-caption`. |
| `color` | `h`, `s`, `b` | Tween the app color (the app's own tween length; `ms` is ignored). |
| `scroll` | `target` | Smooth-scroll the target to the center; `top` scrolls to the top of the page. It takes no cursor, so like a `circle` it neither interrupts what the hands are doing nor is cut short by what comes next — a cue can frame the thing a running drag is about to be measured against (beat 8 brings each equations block into shot as its own drag starts). |
| `leave` | | Walk the cursor off screen. |

Targets: `about-watch-demo` and `about-close` (the welcome panel's "Watch
Demo" and "Get Started" buttons; clicking `about-close` dismisses the panel
through its normal handler), `help-button`, `editor`, `editor-top` (the
Color Editor panel's header band, the top 60 px), `hex-field` /
`hex-center`, `between-panels`,
`hex-tip`, `hex-hue-label` (the hexagon's hue pill, `#hue-handle`; the point
is its outer rim, see `tip`), `hex-hue-handle-label` (new in round 4 of cut
04, for a `circle` that has to enclose both the pill and its "Hue" caption
above it, `#hue-label` — the caption is left out of the union when it is
`hidden`, which it is once the badge has moved somewhere there is no room for
it, see `HueHandle.tsx`. Its point is the middle of that union and its box is the
union grown by sqrt(2) about that middle — a `circle` draws the ellipse
*inscribed* in the box it is given, centred on the target's own point, so before
round 5 the ring came out pill-sized and hung off the edge of the badge, which is
what Taylor kept seeing), `stem:r|g|b`, `corner:r|y|g|c|b|m` (a vertex of
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
`editor-card` (the editor's whole working area as one padded box — `#sb-wrapper`
and `#slider-banks` together, which is the hex field, the S/B rect and the hue
strip, the card as a person sees it and without the section's own header chrome;
for a `wander` over the panel rather than at a control in it),
`zero:<c>` (the zero end of one channel's track, measured the way a drag's start
is, so the mark and the gesture agree about where nought is — for `line`),
`zero:rgb-top` and `zero:rgb-bottom` (the same x, at the top of the R row and the
foot of the B row, so a `line` can run the height of the whole RGB block),
`hue-at:<deg>` (a degree on the HSB bank's H slider as a place rather than a
control — `hue-at:120` is where 120 sits on `#slider-hsb-h-track`, read through
`trackPoint` so a ring and a drag on that row agree about where 120 is — with a
ring radius wide enough to stand clear of a track thinner than any ring that
would read as one; beat 3 rings the primaries and the combinations there at the
same moment it rings them on the hexagon, so the angle is shown as a direction
and as a position at once. Round 5 of cut 04 moved it off the Color Editor's top
hue strip: Taylor asked for the degrees on the slider that reads the number the
line says out loud, and the strip beside the saturation/brightness box carries no
number at all), `editor-hue-handle` (the marker on that same H row,
`#slider-hsb-h-handle`, ringed the way `handle:<c>` is — it was `#hue-bar-arrow`
until round 5, and moved for the same reason; `hex-hue-label` is the hexagon's
own, and beat 4.2 rings the two together),
`equations` (the section's toggle; a click opens and a second click closes),
`swatches` (the Swatches panel's own toggle, the same way — the app mounts it
closed), `swatches:recent` (the Recent group's toggle inside it; a `click`
there only ever opens, see the table above), `swatches:recent-clear` (Recent's
Clear action, which `click` arms and confirms as one gesture),
`swatches:recent-row` and `swatches:saved-row` (the two grids, as padded boxes
for a `rect` and as places to `scroll` to). A Recent row's box is the slots
that hold a color rather than the whole bank: Recent is 24 wide in the panel
and beat 7 fills a quarter of it, so a box round the grid would be mostly
empty squares. Saved's empty slots are clickable — that is how a color is
saved — so there the box is the whole grid. `swatches:recent-span:<n>` is the
*first n slots* of the Recent grid, filled or not: the space the next n picks
will take up, for a marquee that has to be standing before the colors arrive.
Beat 7.2 draws one round six on the first pick and holds it to the end of 7.3;
`swatches:recent-row` there had nothing to measure yet, so the box arrived late
and round whatever had accumulated by then.
`equations:hue|saturation|brightness` (one of the equations panel's channel
blocks, as a padded box for a `rect` and as a place to `scroll` to; the third
block is the Lightness block in HSL mode and keeps the same name),
`figma-banner`, `figma-button`, `editor-group:rgb|hsb|hsl` (the slider-bank
toggles; a click on one turns that bank on, another turns it off),
`settings-button` (opens the menu), `settings-about` (the menu's "About
Color Taylor"; only there while the menu is open, and looked up when the
action fires), `about-author` (the "Taylor Wright" link on the About panel,
for `underline`), `figma-text` (the plugin banner's own sentence, "Try Color
Taylor in Figma" — `#plugin-banner-text`, which is what an `underline` on the
banner has to be given, the pill's own box being the glyph, the sentence and
two buttons), `demo-caption` (the line the built-in demo is showing, as
the text's own span rather than the caption column's full width), `hsl-tab`,
`hsb-tab`, `hex-mode-toggle` (new in round 4 of cut 04, the union of
`hsb-tab` and `hsl-tab` as one box — for a `sway` that has to wave under both
buttons rather than bounce between them), `top`. A target that is not on the page
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
leaving notes: `src/demo/PresentationMode.tsx`. `?present=` is dev only — the
app mounts it from that query parameter in dev builds alone — but the component
itself has no dev guard: the same one is the shipped walkthrough, mounted by
the app's own entry with `mode="production"` (see "Shipping it" below).

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
- **On the reduced transport** the buttons and the clock sit in the same flex
  row as the labels+timeline column, bottom-aligned on the track's own bottom
  edge (`alignItems: 'flex-end'`) rather than centered on the whole row - a
  row whose height is the label row (when a sections file resolved one) plus
  the track, so centering put the buttons too high whenever labels were up.
  The full transport, whose buttons/clock/timeline row has never had a label
  row of its own to contend with, is unchanged.
- **Captions.** The same component on both transports: the current line's
  text (`captionAt` in `PresentationMode.tsx` - the line whose span contains
  the playhead, kept through a gap to the next line of 1.5s or less, blank
  through anything longer), centered above the label row, about 18px, capped
  to two lines and about 60% of the viewport wide, with a short crossfade
  between lines. On by default wherever `mode` is `'production'` - the
  shipped walkthrough's transport has no line/action readout to say the same
  thing - off by default under `'dev'`, which does, but reachable there too
  behind a **Captions** toggle in the authoring row.
- **Section labels.** `public/scripts/<name>-sections.json`, when present
  (`{ source, sections: [{ id, label, line }] }`), names a handful of
  sections of the cut, each anchored to a line id — `"11.2"` starts mid-beat,
  the way a section is free to. Loaded on both transports and both clocks
  (`src/demo/sections.ts`), and resolved against `<name>-lines.json` the same
  way a beat's start already is: a section whose `line` matches nothing in
  the lines file is dropped. On the reduced transport the section marks
  replace the beat markers outright — labels at least 12px, drawn in a
  single row above the timeline, each one rotated -15deg counterclockwise
  about its own bottom-left corner (like a spreadsheet column header) so its
  left end stays anchored at the section's start marker and the text reads
  upward to the right; no second row, no truncation, no hover tooltip — and
  the prev/next-beat buttons step by section instead. On the full
  transport the section marks and labels are drawn in addition to the beat
  band, line spans and cue ticks, which are unchanged, and the buttons still
  step by beat. Missing or empty sections file: both transports fall back to
  the beat markers exactly as before. The current section's label is drawn
  brighter while the playhead sits inside it; the tall light-blue playhead
  itself is unchanged.
- **Seeking** interrupts whatever the hands were doing, applies the latest
  `color` action at or before the new time, puts the ghost on the last
  `rest`/`hover` target before it, and resumes dispatching from the first
  action at or after it. Nothing earlier fires again unless you seek back.
  A seek does not start or stop the built-in demo: seeking into its span
  only notes it, and if it is on screen, due actions are held until it
  exits, as always.
- **The About panel.** The shipped walkthrough is entered from the About
  panel itself (its Presentation button), so it finds the panel open already.
  The `?present=` URL entry mounts the runner cold, and the panel is closed
  by default unless this browser has never dismissed it. For a cut whose
  opening cues are about the panel (an `about-*` target inside the first 20s
  — `opensAboutOpen` in `ScriptRunner.tsx`), the runner opens it itself before
  the first action, as a plain click on the app's own `?` button
  (`#demo-button`) with no ghost travel. Seeking (including back to 0)
  restores the same state: open if no `about-close` click has fired before
  the new time, closed if one has.
- **Notes.** Press **N** (or the Note button), type, Enter. Each note is
  `{ t, beat, line, text, created }`, beat and line from the line being
  spoken, listed under the transport in time order; the time seeks, `x`
  deletes. "Copy as markdown" puts them on the clipboard as
  `- [m:ss] beat.line — text`.
- **The plan clock** (`?present=<cut>&clock=plan`) runs the same cut on its
  planned times instead of on a voice track, so the choreography can be built
  and watched before a word of it is recorded. It loads
  `public/scripts/<cut>-plan.json` — the pacing plan written by redlamp-videos'
  `tools/prompter/plan.mjs`, which is also what the prompter's Paced mode
  scrolls on — and takes the lines, the beats and the duration from it. There is
  no `<audio>` element at all, so the cut plays with no `<cut>.m4a` present.
  - the clock is `performance.now()` from the moment **Space** (or Play) starts
    it, paused by subtracting, and moved by the same scrub and timeline;
  - **the sync flash is back.** Recording mode paints one white frame at t=0 and
    so does this, through `ScriptRunnerHandle.flash()`, so an OBS capture of a
    planned run has the same mark to cut on. It fires once, at the first start
    from zero: a second one mid-run would be a second mark;
  - the timeline gains a band of the plan's **beats** along its top, numbered,
    over the line spans, because a beat is the unit the planned pauses are built
    around. A plan line is one sentence, so there are more spans than there are
    rows in the cut's lines doc;
  - the clip editor does not open: there is no clip behind a planned line.
    Notes still work, and land in the same file.
- **Shipping it.** The component takes three more props, all optional, and all
  only for the app's own walkthrough entry:

  | prop | |
  |---|---|
  | `mode` | `'dev'` (the default) is the authoring tool as described above: notes, Note/Copy/Clear, the **N** and **C** keys, the clip editor and its double-click, the `/__notes` fetch (and any other `/__` request), and the collapse chrome. `'production'` mounts none of it, **regardless of `transport`**. |
  | `transport` | The separate, orthogonal knob for how much of the transport itself shows. `'full'` is the timeline with line spans and cue ticks, scrub, the time readout, the beat band on the plan clock, the line/action readout, and the keyboard transport (**Space** play/pause, arrow-left/right seek `±5s`). `'reduced'` is play/pause, a bare scrub bar and the time readout — nothing else — with **Space** still working. Defaults to `'full'` when `mode` is `'dev'` and `'reduced'` when `mode` is `'production'`, so the shipped walkthrough is reduced unless told otherwise; production with `transport="full"` still makes zero `/__` requests, since that gate is `mode` alone. |
  | `voice` | An `<audio>` the host created and played inside the click that started the walkthrough — playback needs that gesture, and only the host can call `play()` synchronously with it. The component adopts it as its clock instead of rendering its own: it is appended into the transport wearing the `present-audio` test id (which is what the camera panel reads the clock off), and its `src` is written only when it does not already point at the cut's voice, so an element that is already playing is taken over mid-flight rather than restarted. |

- **The opening starts together.** Three things on the shipped path used to
  drift apart, and all three are the same gap: the host starts the voice inside
  the click, and `PresentationMode`, `WebcamPip` and the cut's own JSON are a
  lazy chunk and a fetch behind it.
  - **The clock.** An adopted `voice` is wound back to `currentTime = 0` at the
    moment the runner's schedule comes up and the cut's opening state is
    applied - that is, when `ScriptRunner` hands its handle over. It keeps
    playing across the rewind (playback permission is the document's, and it is
    sticky), and the lead is silent, so there is nothing to hear in the fraction
    that plays twice. Without it the runner joined a clock a few hundred ms in,
    the t=0 cue fired late, and the drag landed after the first word.
  - **The panel.** Where the cut opens the camera panel is *stated* as well as
    applied: `setPipOpening` in `handover.ts`, which parks the panel if it is in
    the document and is read by `WebcamPip` as it mounts if it is not. The panel
    holds itself invisible - `visibility`, so the footage still decodes - until
    a runner has said, and shows itself at home after a grace if none ever does.
    Before that it painted in its corner for the moment before the hand reached
    off the right edge for it.
  - **The hand.** A cut that opens with the panel off screen seeds the ghost
    *beside* the parked panel - off the same edge, level with its grip - rather
    than in the off-screen bottom-right corner it parks in otherwise. The corner
    is 500-odd px from a panel that is itself off the right edge, which is over
    the speed cap for a 400 ms reach and came back stretched to 700-odd. The
    seed is also written into the cursor's first painted frame: the frame loop
    is an effect, and effects run after the paint, so the ghost was drawn once
    in the top-left corner of the window.
- **Play dispatches at once.** The transport's play button, on either clock,
  calls `ScriptRunnerHandle.step()` after starting it: `play()` clears `paused`
  in the same task, so a cue at the top of the cut belongs to that frame rather
  than the next one.

- **`src/demo/currentCut.ts`** is the one place the shipping cut is named
  (`CURRENT_CUT`). The walkthrough entry passes it as `name`, the camera panel
  falls back to it when there is no `?present=`, and only that cut's assets
  ship: everything under `public/scripts/` for an older cut is removed before a
  deploy.
- Notes persist through a dev-server middleware in `vite.config.js`:
  `GET`/`POST /__notes/<name>` reads and writes
  `<PRESENTATION_NOTES_DIR>/<name>-notes.json` as
  `{ "source": "<name>", "notes": [...] }`. The default directory is the
  cut's cue folder in the videos repo,
  `C:\workspace\redlamp-videos\videos\color-taylor-demo-test\cues`.
- **`public/scripts/` is not watched.** `server.watch.ignored` in
  `vite.config.js` keeps chokidar off it: the pipeline replaces those files
  while the dev server runs, and the unlink path took the server down with
  `ERR_CLOSED_SERVER`. They are fetched rather than imported, so there is
  nothing for HMR to do with them — a rebuilt cut is picked up by presentation
  mode's own re-fetch.

## Frames (`?frames=<ratio>`)

A capture-only layer that pushes in and pans around the app for the video
products. It is never part of the shipped walkthrough — the viewer owns their
window — so it mounts only when the URL carries `frames=`, and `mode:
'production'` mounts it under no circumstances. Without the parameter no
element of it is in the DOM and nothing about the page changes.

A **frame** is a region of the page, in CSS px, that fills the capture. It is
not "zoom" and it is not "focus": a pan is a frame that moves without changing
size, and focus is the keyboard's word.

`src/demo/Frames.tsx` is the layer; `src/demo/frameState.ts` is the two facts
the rest of `src/demo` reads off it.

### The file

`public/scripts/<cut>-frames.json`, copied from
`videos/color-taylor-demo-test/cues/<cut>-frames.json`. Separate from the
action cues on purpose: a re-time of the choreography must never touch the
frames, and the choreography itself stays ratio-agnostic.

It is a JSON **array of keyframes**:

```json
[
  { "t": 0, "regions": { "16:9": "reset" } },
  { "t": 83.9, "ms": 1200, "regions": { "16:9": { "target": "hexagon", "pad": 40 } } },
  { "t": 139.8, "ms": 1000, "regions": { "16:9": "reset" } }
]
```

| field | |
|---|---|
| `t` | when the frame comes into force, in the transport's seconds. The last keyframe begun is the frame. |
| `ms` | the transition into it. **800** when it is not said. |
| `ease` | a CSS timing function. Defaults to `cubic-bezier(0.5, 0, 0.5, 1)`, which is as near as a bezier gets to the smootherstep the ghost moves on. |
| `regions` | one region per ratio: `"16:9"` (YouTube, and the fallback the others fall back to), `"1:1"`, `"9:16"` (Reels/TikTok), `"4:5"`. Set together at the same `t`; capture picks one with `?frames=`, and the rest are ignored. |

A **region** is one of three things:

- `{ "target": "hexagon", "pad": 40 }` — the preferred form. The target's box,
  measured off the live layout at the moment the frame is applied, inflated by
  `pad` px on every side. It survives a layout change, which an absolute rect
  does not.
- `{ "x": 0, "y": 0, "w": 1376, "h": 774 }` — an absolute rect in the page's
  own CSS px, the fallback.
- `"reset"` — the default frame: the whole app root.

The target names are the runner's own (the table under "Video script runner"),
narrowed to the ones a shot is actually composed of — `FRAME_TARGETS` in
`ScriptRunner.tsx` — plus two the frame layer adds: **`app-root`**, the whole
app, and **`hexagon`**, the hexagon's whole panel (`#color-hexagon`) rather
than the runner's `hex-field`, which is the drawing inside it.

### How it is applied

The **capture box** is a box of the chosen ratio, as large as the viewport
allows, centred in it. At 1920x1080 with `frames=16:9` that is the whole
viewport; at another shape it letterboxes.

One CSS transform on the app root (`#root`), `transform-origin: 0 0`: the
region is scaled until it fits the capture box and translated into the middle
of it. **Fit, not fill** — a drawn region already wears the box's ratio, so the
two are the same thing for it, and for the ones that do not (the default frame
is the whole app, whatever shape the window is) fitting keeps the app whole
instead of cropping its edges out of the picture.

The transition is CSS's, so the layer costs nothing between keyframes.
Crossing a keyframe in playback eases over its `ms`; **a seek lands**, the same
rule the actions follow, so scrubbing shows the frame the cut says is in force
there rather than a run of animations.

Regions are stated in the page's own px, so every measurement the layer takes —
a target's box, a drawn rect, the app root — is taken with the transform
momentarily off (`withIdentity`).

**The cursor and the callouts follow for free.** Both are portalled to
`document.body`, outside the transformed subtree, so they stay in viewport
coordinates; and every target they point at is measured with
`getBoundingClientRect` off the live layout, which for an element inside the
transformed root reports where it is *on screen*. The hand goes where the
picture is without knowing the layer exists.

### The camera panel

`WebcamPip` stays in screen space. With a frame layer up its home corner is the
**capture box's** bottom-right corner, at the usual 20 px margin, rather than
being measured off the app's right edge — the page is being scaled and panned
underneath it, and a panel measured off the page would walk around with the
frame. Its size is unchanged, and the `pip` drag on and off still runs in
viewport coordinates, so both gestures are untouched.

Deferred: the drag's off-screen position is still the *window's* right edge
rather than the capture box's. They are the same thing at 16:9 in a 16:9
window, which is what cut 04 is captured at; a letterboxed ratio would push the
panel further than it needs to go.

**The live webcam is opt-in.** With no cut footage (no pip manifest, or the
manifest missing its clips) and no host-adopted `<video>`, the panel used to
fall back to `getUserMedia` on its own — a permission prompt every time a
rebuild left those files briefly missing. It now only reaches for the camera
when asked: `?webcam=live` in the URL, or the host handing its own `webcam`
element in (the shipped walkthrough's path, which already skipped
`getUserMedia`). Otherwise the panel shows its dark plate. See
`wantsLiveWebcam` in `WebcamPip.tsx`.

### The speed cap

`MAX_MOVE_PX_PER_S` (700) is stated in **page** px. A frame that scales the
page by `s` puts every cursor move on screen `s` times faster, so a push-in of
2x would have the hand crossing the capture at 1400 px/s — the jetting the cap
exists to stop. The runner therefore hands the driver a *thunk*
(`DriverOptions.maxSpeed` takes `number | (() => number)`) that divides the
constant by `frameScale()`, read per move. With no frame layer, and while the
layer is showing the whole app, the scale is 1 and the cap is the constant.

The stretch warning in the console names the effective cap, so a cue stretched
inside a push-in says so.

A stretched move is usually only slower than the cut asked for. A stretched
**click** is different: the press is at the end of the travel, so a move that
cannot finish before the next cue takes the hands loses the press as well, and
every beat after it plays against a screen that never changed. Beat 2.1 was
exactly that — the hand had just pushed the camera panel out through the right
edge and then curved on to the off-screen corner, which left the About panel's
Close 1055 px away with 0.95s before the first slider. The move was cut short
at 60% and the panel stayed up for the rest of the cut.

The cure is geometry, not a shortcut. A `pip` cue that pushes the panel *off*
now looks at what follows it: with a gesture on a control inside
`PIP_REST_GAP` (4s) the hand comes back in through the edge and stops
`PIP_REST_REACH` (220 px) short of that control, instead of curving out to the
corner. The corner is for when nothing follows — it is a fine place to park and
a bad place to be waiting. The press then lands on the button with travel in
front of it, which is what every value change in this cut is: cursor-driven.

Two smaller rules hold it together:

- A `click` asks for **at least** the time the cap will take anyway
  (`PATH_BOW` × the straight line ÷ the effective cap). A budget under that
  does not make the move quicker; it only has a reachable press reported as
  stretched.
- If a click's ground still cannot be covered in the gap, or the travel is cut
  short by something the test could not see coming, the press is made anyway —
  from the cue, or from wherever the hand got to, with the console saying so
  (`…ms of ground in a …ms gap`). That is the net, and a warning from it means
  the cut wants more room, not that the runner is fine. Not on a seek, where
  the state at the new `t` is the seek's to restore rather than this cue's to
  replay, and not on `swatches:recent-clear`, whose protocol is two presses and
  a wait.

### The transport bar, hidden

With `frames=` in the URL the capture is meant to show only the app, the
ghost cursor and the webcam panel - the transport bar is editing furniture,
not the picture, and that goes for everything drawn on it: the labels and the
caption too. So the bar starts hidden whenever the frame layer is active
(`hiddenForCapture` in `PresentationMode.tsx`, `display: none` rather than
unmounting it - the audio element and the adopted voice track stay put, so
playback and the schedule's clock are untouched by the toggle), and **T**
brings it back for editing. With the bar hidden its own box is zero height, so
the height it publishes to `frameState` (`setTransportHeight`) goes to 0 with
it, and the camera panel's home corner sits at the usual bottom margin as if
there were no bar at all - see "The camera panel" above. None of this touches
the About panel's Presentation entry or a plain `?present=` with no `frames=`:
`hiddenForCapture` is `false` whenever the frame layer is not active.

### The editor (dev only)

Alongside the notes and the clip editor, and only under `mode: 'dev'`.

- **F** toggles between the **full page** — the frame layer disabled, with the
  capture box drawn as an outline and everything outside it dimmed, so what
  will be captured is visible — and the **framed view**, which is what the
  capture will show.
- **T** toggles the transport bar back over the capture for editing — it
  starts hidden whenever `frames=` is on; see "The transport bar, hidden"
  above.
- The **ratio picker** in the transport row chooses which ratio a drawn region
  is for. It defaults to the one in the URL.
- **Frame** arms the tool (and switches to the full page, since a region is
  drawn in page px). Drag a rect over the app; on release it **snaps to the
  ratio**, growing about its middle so nothing drawn is lost, and then, if it
  mostly covers one known target — three quarters of the target inside the rect
  and half the rect spent on it — it **snaps to that target** with the single
  pad that reproduces the size it was drawn at. Otherwise it saves as an
  absolute rect. Either way it becomes the keyframe at the playhead: within
  0.2 s of an existing one it is merged into that keyframe's `regions`, so the
  ratios of one shot are set together.
- Every ratio of the keyframe at the playhead is drawn as an outline in its own
  color (16:9 cyan, 1:1 amber, 9:16 pink, 4:5 green) on the full page.
- Keyframes appear on the timeline as markers in the picked ratio's color, the
  active one solid; pressing one seeks exactly to it. **x** deletes the
  keyframe at the playhead.
- Saving goes through a dev-server middleware, `GET`/`POST /__frames/<name>`,
  which reads and writes `<PRESENTATION_NOTES_DIR>/<name>-frames.json` **and**
  the app's own copy under `public/scripts/`, so an edit is visible without a
  copy step. Over the wire it is `{ "source": "<name>", "frames": [...] }`; on
  disk it is the bare array. A list that arrives empty is refused unless the
  body says `clear: true`, the same rule the notes have.

**What the frame does not carry.** Anything portalled to `document.body` is
outside the transformed subtree by construction: the ghost and the callouts
(deliberately — that is what keeps them in viewport coordinates), the
transport, the camera panel, and also the app's own dialogs, which Radix
portals — the About panel sits unscaled over a pushed-in frame. The cut closes
it in beat 1, so it is only ever seen that way in a seeked run.
