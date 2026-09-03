# The Picker Demo: Script and Timing

The self-running demo behind the `?` button, beat by beat, as it actually runs.
Five steps and a sign-off, **49.2 seconds** end to end.

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
| `dragTip` | 2200 | The hexagon's tip handle |
| `dragBox` | 2800 | The colour box |
| `dragHue` | 2600 | The colour editor's hue strip |
| `dragBar` | 2600 | Each of the hexagon's two bars |
| `dragSlider` | 4200 | The H slider in the bank |
| `blendHold` | 1300 | How long each blend state is held up for inspection |

Four more live beside them, and are named in the beats below:

| Name | ms | Where |
|---|---:|---|
| `CLICK_MS` | 110 | `src/demo/drive.ts` — how long a press is held before it becomes a click |
| `RESTORE_WATCH_MS` | 900 | `steps.ts` — watching the colour tween home |
| `EXIT_MS` | 900 | `steps.ts` — the ghost's walk off the screen |
| `SIGN_OFF_MS` | 5000 | `steps.ts` — how long "Have fun!" stands before the panel leaves |

---

## Step 1 — The chain · 10.1s

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
| `dragTip` | 2200 | A short arc. The sliders, bars and hue badge light as it moves; the chain stays quiet, because the chain is what is being held. |
| `afterAction` | 1300 | Let go and watch the highlights fade. |

## Step 2 — The colour editor · 8.9s

> **Work with the tools that feel most familiar to you.**

Narration: `public/demo/02-color-box.mp3`

The box first, then the hue strip beside it — saturation and brightness alone
never leave the one hue, and the pair is what makes it a picker.

| Beat | ms | What happens |
|---|---:|---|
| `moveFar` | 680 | Across to the colour box. |
| `beforeAction` | 600 | A moment to read the caption. |
| `dragBox` | 2800 | A curve through the box, inset so it never clamps on an edge. |
| `betweenSteps` | 400 | |
| `move` | 520 | To the **hue strip**, at the marker's own height so nothing jumps. |
| `dragHue` | 2600 | Up and back down. |
| `afterAction` | 1300 | |

## Step 3 — A slider · 6.8s

> **Keep an eye open for how your changes impact other parts of the tool.**

Narration: `public/demo/03-impact.mp3`

| Beat | ms | What happens |
|---|---:|---|
| `moveFar` | 680 | To the **H slider** in the bank. |
| `beforeAction` | 600 | |
| `dragSlider` | 4200 | Out and back, about 120° each way. The longest single gesture in the demo, because it is the one with the most to watch. |
| `afterAction` | 1300 | |

## Step 4 — What one value moves · 8.7s

> **Move one value and everything it changes lights up with it.**

Narration: `public/demo/04-bars.mp3`

Step 3 asks them to watch; this is the demonstration. The bars belong to the
hexagon rather than the bank, so the sliders lighting up are unmistakably
somewhere else — nothing on screen is the control being held.

| Beat | ms | What happens |
|---|---:|---|
| `moveFar` | 680 | To the hexagon's **Saturation bar**. |
| `beforeAction` | 600 | |
| `dragBar` | 2600 | A slow sweep. Most of the RGB and HSL readouts light at once. |
| `betweenSteps` | 400 | |
| `move` | 520 | To the **Brightness bar**. |
| `dragBar` | 2600 | The same, vertically. |
| `afterAction` | 1300 | |

## Step 5 — Source and mixed · 6.9s

> **Press this button to toggle between Source and Mixed color sliders.**

Narration: `public/demo/05-blend.mp3`

| Beat | ms | What happens |
|---|---:|---|
| `moveFar` | 680 | To the **blend button**. |
| `beforeAction` | 600 | |
| 4 × (`CLICK_MS` + `blendHold`) | 4 × 110 + 3 × 1300 + 1300 | Four presses, each leaving a ring, ending where it started. |

## Sign-off · 7.8s

> **Have fun!**

| Beat | ms | What happens |
|---|---:|---|
| `moveFar` | 680 | Home to the hexagon. |
| — | — | The colour, the slider groups and blend all go back to what the demo found. |
| `RESTORE_WATCH_MS` | 900 | Standing there while the colour tweens back underneath. |
| `EXIT_MS` | 900 | Walks off the bottom of the screen, fading as it goes. |
| `SIGN_OFF_MS` | 5000 | "Have fun!" stands, the last tick running down as a timer. |
| `SIGN_OFF_FADE_MS` | 350 | The panel fades out. |

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
| 1 | `01-handles.mp3` | ~10.1s |
| 2 | `02-color-box.mp3` | ~8.9s |
| 3 | `03-impact.mp3` | ~6.8s |
| 4 | `04-bars.mp3` | ~8.7s |
| 5 | `05-blend.mp3` | ~6.9s |

## Things the timings cannot predict

- **Scrolling.** Any step whose target is off screen scrolls it into view first
  and spends about 500ms extra doing so. On a desktop window big enough for the
  whole tool this never happens; on a phone it happens most steps.
- **Back and Next.** A step interrupted part way is abandoned at its next
  pause, so its remaining beats are simply not spent.
- **Reduced motion.** `prefers-reduced-motion` removes the arcs and the cursor's
  lean; moves become near-instant, which takes roughly 3.5s off the total.
