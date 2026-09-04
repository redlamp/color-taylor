# The Picker Demo: Script and Timing

The self-running demo behind the `?` button, beat by beat, as it actually runs.
Four steps and a sign-off, **45.7 seconds** end to end.

Everything here is generated from the code, not written alongside it. If you
change a number in this document, change it in the file named beside it — the
timings are not read from here.

- Choreography and all pacing: `src/demo/steps.ts`
- The hands (moves, drags, clicks, hover): `src/demo/drive.ts`
- The panel, cursor and player: `src/demo/DemoRunner.tsx`

To watch it faster while editing, add `?demospeed=N` to the URL (1–20). It
divides every duration below **except** the sign-off's five-second hold, which
is reading time and stays as it is.

---

## The lines

All of it side by side, for reading the copy against the clock without chasing
it down the page. "Room" is roughly how many words fit at a conversational
150 wpm — the gap between that and the line's own length is how much air the
step has, and where a longer line could go without changing a single timing.

| # | Line | Runs | Words | Room |
|---|---|---:|---:|---:|
| 1 | Play with the handles to see how each one maps to a color channel. | 11.7s | 14 | ~29 |
| 2 | Work with the tools that feel most familiar to you. | 8.9s | 10 | ~22 |
| 3 | Move one value and everything it affects lights up across the app. | 12.8s | 12 | ~32 |
| 4 | Press this button to toggle between Source and Mixed color sliders. | 6.9s | 11 | ~17 |
| — | Have fun! | 5.4s | 2 | — |
| | **Total** | **45.7s** | | |

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
- **Step 4 is the tightest.** Eleven words in 6.9s. Step 3 is the loosest, at
  twelve words across three separate gestures.
- **The sign-off's 5.4s is not all reading time.** The walk home, the colour
  tweening back and the exit all happen *inside* the five-second hold rather
  than before it, so "Have fun!" is on screen for the whole of it.

## The landing colour

Steps 1 and 2 both finish on **h216, s69** — and step 2 on **b100** as well,
which together are the app's own default colour. Step 3's gestures are all
sweeps that hand the colour back where they found it, so the demo sits on that
colour from the end of step 2 until the sign-off puts the user's own back.

It is `LANDING` in `src/demo/steps.ts`, and it is one constant because the three
surfaces reach it from different directions: the hexagon by angle and radius,
the colour box by saturation and brightness, the hue strip by height. A demo
that stops wherever its last gesture happened to end reads as a recording of
somebody fiddling.

Landing on a *chosen* colour is why `DemoHost` has a `field()` reader. A gesture
on the hexagon or the box is a position rather than a delta, so a step that
means to end somewhere has to know where it is starting from. It is the only
thing the demo reads rather than works.

## The pacing dial

Every duration in the script is one of these, in the `DWELL` block at the top of
`src/demo/steps.ts`. Change one and every beat that uses it moves together.

| Name | ms | What it covers |
|---|---:|---|
| `move` | 520 | Travel between two targets inside one panel |
| `moveFar` | 680 | Travel across the width of the tool |
| `hoverStem` | 900 | Standing on a stem, long enough to read its tooltip |
| `hoverJoint` | 1100 | Standing on a joint, which shows more than one tooltip |
| `beforeAction` | 600 | After arriving, before the hand starts working |
| `afterAction` | 1300 | After a drag lets go, while the highlights are still lit |
| `betweenSteps` | 400 | Between two actions inside one step |
| `dragTip` | 3800 | The hexagon's tip handle, once round the field |
| `dragBox` | 2800 | The colour box |
| `dragHue` | 2600 | The colour editor's hue strip |
| `dragBar` | 2600 | Each of the hexagon's two bars |
| `dragSlider` | 3000 | The H slider in the bank |
| `blendHold` | 1300 | How long each blend state is held up for inspection |

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
| `SIGN_OFF_MS` | 5000 | `steps.ts` — how long "Have fun!" stands, the goodbye included |

---

## Step 1 — The chain · 11.7s

> **Play with the handles to see how each one maps to a color channel.**

Narration: `public/demo/01-handles.mp3`

Four stops rather than all six. Visiting every stem and joint in order made the
same point three times; a tooltip names its channel whether or not you have seen
its neighbour.

| Beat | ms | What happens |
|---|---:|---|
| move + `hoverStem` | 520 + 900 | To the **red stem**. Its RED pill fades in. |
| move + `hoverJoint` | 520 + 1100 | To the **green joint**. RED and GREEN, since it drives both. |
| move + `hoverStem` | 520 + 900 | To the **blue stem**. BLUE. |
| move + `hoverJoint` | 520 + 1100 | To the **tip**. All three. |
| move | 520 | Back onto the tip to take hold of it. |
| `dragTip` | 3800 | **Once round the field**, plus however far the landing hue is from where it started — so it arrives on h216, s69 whatever colour the user was on. |
| `afterAction` | 1300 | Let go and watch the highlights fade. |

The tour used to be a 56px nudge and back. That moved the readouts without ever
saying what the field *is*: a short arc near one hue looks like a colour being
adjusted, and a full turn looks like a hue wheel, which is what it is.
Brightness is untouched for the whole gesture — the mapping freezes its bound at
pointer-down and every point on the path stays inside it — so hue and saturation
are the only things moving.

## Step 2 — The colour editor · 8.9s

> **Work with the tools that feel most familiar to you.**

Narration: `public/demo/02-color-box.mp3`

The box first, then the hue strip beside it — saturation and brightness alone
never leave the one hue, and the pair is what makes it a picker.

| Beat | ms | What happens |
|---|---:|---|
| `moveFar` | 680 | Across to the colour box, pressing exactly where the handle already is. |
| `beforeAction` | 600 | A moment to read the caption. |
| `dragBox` | 2800 | Out through the dark and back up to the top edge, landing on **s69, b100**. |
| `betweenSteps` | 400 | |
| `move` | 520 | To the **hue strip**, at the marker's own height so nothing jumps. |
| `dragHue` | 2600 | A full period of a sine: 140° above the hue and 140° below it, ending on **h216**. |
| `afterAction` | 1300 | |

140 rather than 180 because the strip wraps: overshooting either end is harmless
to the value but walks the ghost off the control.

## Step 3 — What one value moves · 12.8s

> **Move one value and everything it affects lights up across the app.**

Narration: `public/demo/03-impact.mp3`

This was two steps — "keep an eye open for the impact", then "here it is" — and
they read as the same point made twice, with a pause in the middle of one idea.
Three controls in one breath instead, because the argument is that it happens
*wherever* you work, and one control cannot say that.

| Beat | ms | What happens |
|---|---:|---|
| `moveFar` | 680 | To the **H slider** in the bank. |
| `beforeAction` | 600 | |
| `dragSlider` | 3000 | Out and back, about 120° each way. |
| `betweenSteps` | 400 | |
| `moveFar` | 680 | To the hexagon's **Saturation bar** — not in the bank, so the sliders lighting up are unmistakably somewhere else. |
| `dragBar` | 2600 | A slow sweep. Most of the RGB and HSL readouts light at once. |
| `betweenSteps` | 400 | |
| `move` | 520 | To the **Brightness bar**. |
| `dragBar` | 2600 | The same, vertically. |
| `afterAction` | 1300 | |

Every gesture here returns the colour to where it found it, which is what lets
the landing colour survive the step.

## Step 4 — Source and mixed · 6.9s

> **Press this button to toggle between Source and Mixed color sliders.**

Narration: `public/demo/04-blend.mp3`

| Beat | ms | What happens |
|---|---:|---|
| `moveFar` | 680 | To the **blend button**. |
| `beforeAction` | 600 | |
| 4 × (`CLICK_MS` + `blendHold`) | 4 × 110 + 3 × 1300 + 1300 | Four presses, each leaving a ring, ending where it started. |

## Sign-off · 5.4s

> **Have fun!**

The caption reads the step index, so "Have fun!" goes up the moment the last
step ends. The five seconds start there too, and the goodbye happens inside them
rather than before them — it used to run the walk home first, which left the
last tick sitting empty for nearly three seconds under a finished line.

| Beat | ms | What happens |
|---|---:|---|
| `SIGN_OFF_MS` | 5000 | "Have fun!" stands, the last tick running down as a timer. Everything below happens inside it. |
| ↳ `moveFar` | 680 | Home to the hexagon's tip. |
| ↳ — | — | The colour, the slider groups and blend all go back to what the demo found. |
| ↳ `HSB_TWEEN_MS` + 120 | 1120 | The ghost **rides the tip** while the colour tweens home, so the ending reads as the cursor putting the colour back rather than the colour leaving on its own. |
| ↳ `EXIT_MS` | 900 | Walks off through whichever edge the panel is not on, fading as it goes. |
| `SIGN_OFF_FADE_MS` | 350 | The panel fades out and the demo takes itself down. |

The goodbye adds up to 2.7s, so the panel stands still and quiet for the last
2.3 of the five.

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
| 1 | `01-handles.mp3` | ~11.7s |
| 2 | `02-color-box.mp3` | ~8.9s |
| 3 | `03-impact.mp3` | ~12.8s |
| 4 | `04-blend.mp3` | ~6.9s |

## Things the timings cannot predict

- **Scrolling.** Any step whose target is not already clear of the demo panel
  scrolls it there first, and waits for the scroll to actually arrive rather
  than for a fixed time. On a desktop window big enough for the whole tool this
  never happens; on a phone it happens most steps, and adds roughly half a
  second each.
- **Back and Next.** A step interrupted part way is abandoned at its next
  pause, so its remaining beats are simply not spent.
- **Reduced motion.** `prefers-reduced-motion` removes the arcs and the cursor's
  lean; moves become near-instant, which takes roughly 3s off the total.
