---
tags:
  - domain/color-math
  - domain/ui
  - status/adopted
  - origin/user-call
---

# Decision: The Brightness Bar Names Its Axis, And That Name Is Not "Luminance"

**2026-08-12.** The hexagon's vertical bar carries a label reading **Brightness** or **Lightness**, whichever model is live. The `Luminance` caption that sat under the HSB/HSL tabs is gone, because it named a quantity neither axis computes.

## The three letters

| Model | Letter | Means | Computed as |
|---|---|---|---|
| HSB | **B** | Brightness | `max(R,G,B)` — `colorConversions.ts:90` |
| HSV | **V** | Value | identical to B |
| HSL | **L** | Lightness | `(max + min) / 2` — `colorConversions.ts:111` |

**HSB and HSV are one model.** B and V are synonyms for the same axis, which is why the tabs are HSB / HSL and not a three-way. `rgbToHsb` says so already: it is titled "Convert RGB to HSB/HSV" and computes `const v = max * 100` before returning it as `b`.

## Why "Luminance" was wrong

Luminance (Y) is photometric: a weighted sum of **linear-light** RGB, Rec. 709 putting it at `0.2126R + 0.7152G + 0.0722B`. It is what WCAG contrast is built on. Neither `max` nor `(max+min)/2` weights the channels or linearises, so neither axis is luminance.

The falsification is one line: pure blue and pure yellow both sit at B = 100, L = 50 — the same point on this bar — while their relative luminances are 0.072 and 0.928. A 13× difference at an identical position on a control captioned "Luminance".

Two neighbours worth keeping straight, since the presentation deck talks about this:

- **Luma (Y′)** — the same weighted sum over *gamma-encoded* R′G′B′, as in Y′CbCr video. Not luminance.
- **L\*** — CIELAB perceptual lightness, a cube-root function of Y. HSL's L is **not** L\*; it is the crude midrange, which is why HSL is not perceptually uniform.

The tooltips on the tabs were already right ("HSB brightness", "HSL lightness"). Only the caption was wrong.

## Rejected

- **Keep both captions.** Leaves two muted captions stacked 16px apart in the same corner, the upper one wrong.
- **Replace it with "Model".** Accurate for what the tabs pick, but redundant once the bar names its own axis, and it keeps two captions in the corner.

## Where the label sits, and why it took three tries

Set vertically down the bar's left side, reading bottom-to-top, top-aligned with the bar, at `text-sm` to match the HSB/HSL tabs.

- **Above the bar, right-aligned to the coordinate space.** Collides with the value pill, which reaches `BL_BAR_TOP - 14px` once the value is near 100.
- **Centred on the bar's left side.** Overlaps the `R` channel letter, which sits at exactly the bar's mid-height.
- **Top-aligned, left of the bar.** Adopted. Clears both.

Two mechanics that are easy to get wrong:

**`writing-mode: vertical-rl` + `rotate-180`, not `rotate(-90deg)`.** The writing-mode gives the element a layout box that is already narrow and tall, so `right` and `top` place it directly. Rotating a horizontal box about its centre leaves the footprint offset by half the difference between its width and its height — which is to say, by however long the word is.

**`px-1`, not `py-1`, for the padding at the ends of the word.** Tailwind v4 maps `px`/`py` to `padding-inline`/`padding-block`, which are *logical*, and this element's inline axis runs vertically. `py-1` pads the sides instead and widens the chip.

The label carries `bg-card`, because the dashed limit-hex connector ends at the bar's arrow and therefore sweeps this strip as the value changes — it ran dead through the word. The chip breaks the line instead, which is what a label over a rule should do. Nothing else reaches that far out; the hexagon and its circumscribed circle both stop at `CENTER_X + RADIUS`.

## The bar's numbers were never clickable

Found while adding the label. `100` / `50` / `0` are HTML buttons over the SVG, and `#hex-svg` sits at `z-[5]`. A root `<svg>` is not a shape — it takes the hit over its whole box — so all three sat under it, never fired, and never even lit up on hover. Nothing threw, nothing logged, and the cursor still turned into a pointer. `z-[6]` fixes it; hit areas went from as small as 5×10px to 13–24×18px, and the tick marks got a transparent band across the gutter because 4×1 user units is a target in name only.

One dead zone is left and is inherent: the value pill is anchored to the bar's right edge and is wider than the gutter behind it, so it masks whichever marker it is parked on — measured at **±3 of that marker's own value**, which is exactly where clicking it is nearly a no-op. Closing it properly needs the pill and the numbers in separate columns, and `SIZE` has no room. Pinned in a test so the zone cannot quietly widen.

## Related

Removing the caption is what shortened the hexagon column and exposed the layout coupling in [[decision-both-columns-absorb-slack]]. It also pulled the stage up until `#hex-svg`'s overhang — its box is `HEX_SIZE` tall inside a `DISPLAY_HEIGHT` stage, so 40 user units of empty canvas stick out above it — started swallowing clicks on the HSB/HSL tabs. The header now carries `relative z-10`, which is the same fix `CollapsibleSection`'s trigger already applies for the same reason.
