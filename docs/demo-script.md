# The Picker Demo: Script and Timing

The self-running demo behind the `?` button, beat by beat, as it actually runs.
Four steps and a sign-off, **36.1 seconds** of budgeted beats — about 37
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
| 1 | Work with the tools that feel most familiar to you. | 8.3s | 10 | ~21 |
| 2 | Play with the handles to see how each one maps to a color channel. | 9.9s | 14 | ~25 |
| 3 | Move one value and everything it affects lights up across the app. | 8.1s | 12 | ~20 |
| 4 | Press this button to toggle between Source and Mixed color sliders. | 5.5s | 11 | ~14 |
| — | Have fun! | 4.4s | 2 | — |
| | **Total** | **36.1s** | | |

Four things worth knowing before you rewrite any of them:

- **The line does not set the timing.** Each step runs for as long as its
  choreography takes, and the caption sits there for all of it. Making a line
  shorter does not make its step shorter; it just leaves the panel quieter for
  longer. To change a step's length, change its beats — the tables below say
  which.
- **Every line has to fit two rendered lines.** The panel lays all of them out
  in one cell and holds the height of the tallest, so a caption that wraps to
  three makes the panel taller for the whole demo, not just its own step. At the
  header's width that is about 66 characters; all four are 51–67 today.
- **Step 4 is the tightest, and it is now tight enough to matter.** Eleven
  words in 5.5s leaves about three words of headroom. If a recorded line runs
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
| **Blend** | Left alone. Step 4 presses the toggle an even number of times, so it demonstrates the same thing from either state and gives it back either way. Still restored, because a skip part way through would leave it flipped. |
| **Scroll position** | Not restored. Each step scrolls its target clear of the panel, and the page is left wherever the last one put it. |

"Default Settings" goes further than the demo does: it also returns every
section to open or closed as a first visit finds it, which the demo deliberately
does not touch beyond the two it needs.

## How the ghost moves

Three shapes, and they are not the same shape:

| | |
|---|---|
| **Travel** between one target and the next | Smootherstep, in `drive.ts`. It was easeInOutQuad, which lands from twice its average speed and does the whole deceleration in the last quarter — across the tool that is 44px per frame arriving in under a fifth of a second, and it reads as the hand being stopped rather than stopping. The quintic has zero acceleration as well as zero velocity at both ends. |
| **Gestures** — every drag | Written as a function of `smooth(t)`, the plain cubic, with a linear clock so the shaping applies once. `sin(pi * t)` is at its fastest as it lands; `sin(pi * smooth(t))` traces the identical path at the same peak speed but starts and stops at rest. Not the quintic, whose steeper middle would speed up the turn as well as softening the ends. |
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
| `dragBar` | 2600 | Each of the hexagon's two bars |
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

> **Work with the tools that feel most familiar to you.**

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

## Step 2 — The chain · 9.9s

> **Play with the handles to see how each one maps to a color channel.**

Narration: `public/demo/02-handles.mp3`

It comes second because it is the unfamiliar one, and because step 1 hands it a
colour at full brightness — the hexagon's cross-section is a hexagon of radius
`b/100`, so a dark starting colour would collapse the whole field toward a point
and the lap below would happen inside a few pixels.

Three stops rather than all six. Visiting every stem and joint in order made the
same point three times; a tooltip names its channel whether or not you have seen
its neighbour, and by the third stop the pattern is established rather than
still being demonstrated.

| Beat | ms | What happens |
|---|---:|---|
| move + `hoverStem` | 520 + 900 | To the **red stem**. Its RED pill fades in. |
| move + `hoverJoint` | 520 + 1100 | To the **green joint**. RED and GREEN, since it drives both. |
| move + `hoverJoint` | 520 + 1100 | To the **tip**. All three. |
| move | 520 | Back onto the tip to take hold of it. |
| `dragTip` | 3800 | **Once round the field**, plus however far the landing hue is from where it started — so it arrives on h216, s69 whatever colour the user was on. |
| `afterAction` | 950 | Let go and watch the highlights fade. |

The tour used to be a 56px nudge and back. That moved the readouts without ever
saying what the field *is*: a short arc near one hue looks like a colour being
adjusted, and a full turn looks like a hue wheel, which is what it is.
Brightness is untouched for the whole gesture — the mapping freezes its bound at
pointer-down and every point on the path stays inside it — so hue and saturation
are the only things moving.

## Step 3 — What one value moves · 8.1s

> **Move one value and everything it affects lights up across the app.**

Narration: `public/demo/03-impact.mp3`

This was two steps — "keep an eye open for the impact", then "here it is" — and
they read as the same point made twice, with a pause in the middle of one idea.

| Beat | ms | What happens |
|---|---:|---|
| `moveFar` | 680 | To the hexagon's **Saturation bar**. |
| `beforeAction` | 400 | |
| `dragBar` | 2600 | A slow sweep. Most of the RGB and HSL readouts light at once. |
| `betweenSteps` | 300 | |
| `move` | 520 | To the **Brightness bar**. |
| `dragBar` | 2600 | The same, vertically. |
| `afterAction` | 950 | |

It opened on the H slider in the bank, and that beat is gone. A slider is the
weakest of the three for this step's own argument: it sits among the readouts
that are supposed to be answering it, so "look at what lights up" competes with
the thing being held. The hexagon's bars are not in the bank at all, which is
what makes the answer unmistakably somewhere else.

The cost is that nothing in the demo now drives a slider directly. If that
turns out to matter, the cheap fix is to swap the Brightness bar for the H
slider rather than adding a fourth gesture — one in the bank and one on the
hexagon covers "across the app" better than two of either, for about 0.4s.

Both gestures are sweeps that hand the colour back where they found it, which
is what lets the landing colour survive the step.

## Step 4 — Source and mixed · 5.5s

> **Press this button to toggle between Source and Mixed color sliders.**

Narration: `public/demo/04-blend.mp3`

| Beat | ms | What happens |
|---|---:|---|
| `moveFar` | 680 | To the **blend button**. |
| `beforeAction` | 400 | |
| 4 × (`CLICK_MS` + `blendHold`) | 4 × 110 + 3 × 1000 + 950 | Four presses, each leaving a ring, ending where it started. |

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
| ↳ `EXIT_MS` | 900 | Walks off through whichever edge the panel is not on, fading as it goes. |
| `SIGN_OFF_FADE_MS` | 350 | The panel fades out and the demo takes itself down. |

The goodbye adds up to 2.7s where there is a colour to take home, so the panel
stands still and quiet for the last 1.3 of the four; where there is not, it is
just the 900ms walk off. Taking `SIGN_OFF_MS` any lower would start cutting into
the goodbye rather than into the pause.

---

## Narration

Each step names an audio file under `public/demo/`. Nothing goes looking for
them until `NARRATION_READY` in `src/demo/steps.ts` is set to `true`; until
then the speaker button is hidden and the demo is silent.

When it is on, **a step waits for both its choreography and its line** before
moving on. So a recording longer than the timing above simply extends that
step — the voice sets the pace, and these numbers become the floor rather than
the length. A recording shorter than the step changes nothing.

| Step | File | Words to fill the current timing |
|---|---|---:|
| 1 | `01-color-box.mp3` | ~8.3s |
| 2 | `02-handles.mp3` | ~9.9s |
| 3 | `03-impact.mp3` | ~8.1s |
| 4 | `04-blend.mp3` | ~5.5s |

## Things the timings cannot predict

- **Scrolling.** Any step whose target is not already clear of the demo panel
  scrolls it there first, and waits for the scroll to actually arrive rather
  than for a fixed time. On a desktop window big enough for the whole tool this
  never happens; on a phone it happens most steps, and adds roughly half a
  second each.
- **Back and Next.** A step interrupted part way is abandoned at its next
  pause, so its remaining beats are simply not spent.
- **Reduced motion.** `prefers-reduced-motion` removes the arcs and the cursor's
  lean; moves become near-instant, which takes roughly 2.5s off the total.
