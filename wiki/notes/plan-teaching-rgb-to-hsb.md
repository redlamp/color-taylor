---
tags:
  - domain/presentation
  - status/draft
---

# Plan: Teaching RGB → HSB

**2026-08-13.** How to teach the tool and the subject, and what to change in the intro deck. Draft — the script rewrites are proposed, not applied.

The spine is [[hexagon-is-the-cube-down-its-diagonal]]. Everything below assumes that idea lands first.

## The gap this fixes

The deck currently *asserts* its own payoff. Slide `12-hexagon` says:

> This is where it all clicks. The hexagon shows you how colors come together.

Nothing in the narration ever answers *why the shape is a hexagon*, and the slide before it frames the wheel as a preference ("felt more natural to me") rather than as the thing the hexagon corrects. The deck shows the geometry and never says it.

## The ladder

Six rungs, in order; each is visible in the tool, so nothing is taken on trust.

1. **A colour is three numbers** — so it is a point in a cube, and R/G/B are the edges you travel along.
2. **Look down the cube's diagonal** — black nearest, white furthest, and they line up. The outline is a hexagon.
3. **Angle is hue, distance is saturation** — grey is the axis you are looking along, so it sits at the centre.
4. **Brightness is the axis you can't see** — black and white both land on the centre, which is why it needs its own control.
5. **The three channels, tip to tail** — drag one leg of the vector chain and watch hue and saturation both move. Same point, different address.
6. **The arithmetic measures those three things** — `max` is brightness, `max − min` is distance off the grey axis, the sector arithmetic picks the edge.

## Proposed script changes

Only the slides worth changing. The Macintosh Plus opening earns its place, and "you didn't describe the color, you referenced it" on `03-256` is the best line in the deck — it sets up the shift from index to coordinate that everything after depends on.

| Slide | Now | Proposed |
|---|---|---|
| `09-hex` | "Hexadecimal values are used to describe colors as 6 character values…" | Demote to a clause on the previous slide. It is notation, not an idea, and it interrupts the argument at the exact moment the deck is building tension. |
| `10-hsb-circle` | "The HSB color wheel felt more natural to me, and matched lessons from color theory." | "Every colour picker shows you a wheel. But a wheel is a guess at the shape — watch what the actual shape is." Reframes the next slide as a correction. |
| *new* | — | The cube reveal, between the wheel and the hexagon. "Three numbers, so a cube. Now look down the line from black to white." |
| `12-hexagon` | "This is where it all clicks…" | "Six corners, because a cube has six edges around its silhouette — red, yellow, green, cyan, blue, magenta. Hue is which way round you're pointing. Saturation is how far out." |
| `13-equations` | keep | Add one line: the 60 in the hue formula is one sixth of the way round the hexagon. Turns the equations from something to admire into something to read. |
| `15-app` | "Now give the app a try yourself." | Add the payoff: pick a hue, move only saturation and brightness, and you have a palette that holds together — which is close to impossible by eye in RGB. |

## Misconceptions worth defusing on camera

Each is a live demo in the tool, and each is the kind of thing someone remembers where they learned.

- **"Brightness is how bright it looks."** B is `max(R,G,B)`, unweighted. Pure blue and pure yellow both sit at B = 100 and differ about thirteenfold in relative luminance. See [[decision-brightness-axis-not-luminance]].
- **"HSL's L is lightness as I mean it."** `(max + min) / 2`, not CIELAB L*.
- **"Saturation means the same in HSB and HSL."** Different denominators; switch the tool to Both and drag, and the two disagree on screen.
- **"Hue is a colour."** Hue is an angle. Once that lands, complements and triads stop being recipes.

## Video beats

Open with the payoff, not the history — the history is what keeps people watching once they already care.

| | |
|---|---|
| 0:00 | The cube becomes a hexagon. No preamble. |
| 0:30 | Who you are and why you built it. The Macintosh Plus, kept short. |
| 1:30 | Run the intro deck — bit depth, channels, then the wheel-to-hexagon correction. |
| 5:00 | Drag things: the vector chain first, then the limit hexagon shrinking, then blue against yellow at equal brightness. |
| 8:00 | Build a palette live in HSB, then try the same by typing RGB and let it be visibly harder. |
| 10:00 | The deep end: why `#808080` is not half of white (gamma), why WCAG contrast uses weighted luminance and the brightness slider doesn't, and where OkLab picks up. End on HSB being a useful lie. |

## Build candidates

- The cube reveal as a deck slide, from `docs/prototypes/rgb-cube/`. Constraint: the deck panel is 726×320, very wide and short, and a cube turning into a hexagon wants vertical room.
- **A toggle in the app that draws the cube wireframe behind the hexagon.** Higher value than the slide: available whenever someone is using the tool rather than once during an intro, which is the difference between something learned and something watched.
- Blue / yellow side by side as one click, since the luminance point is the most surprising thing in the tool and currently takes a minute to set up.
- A shareable permalink for a colour, so a video description can point at exactly what was on screen.
