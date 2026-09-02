---
tags:
  - domain/color-math
  - domain/presentation
  - status/draft
  - origin/external-research
---

# Colour Solid Visualisations

**2026-09-02.** Three reference pictures Taylor brought in while we were building the cube bench (`lab/cube.html`), as the vocabulary for how the RGB cube is usually *shown* turning into the cylinder models. The images themselves are not in the vault yet; drop them into `wiki/assets/` and link them here. Sources below are enough to find them again.

## 1. The HSL and HSV cylinders, cut open

**Source.** Wikipedia, *HSL and HSV*, the lead figure by Jacob Rus (Wikimedia Commons, CC BY-SA). Eight panels, a–h.

- **a / e.** Each model as a cylinder with a wedge cut out. Hue is the angle, saturation is the radius, and the vertical axis is lightness (HSL) or value (HSV). The cutaway is what makes the picture work: the outer wall shows hue, the cut faces show saturation against the vertical axis.
- **b / f.** The outer wall unrolled: hue across, L or V up, at S = 1. HSL's wall is white along the top; HSV's is the full-strength hue along the top. This is the picture of [[decision-brightness-axis-not-luminance]] — the top edge of the HSV wall is what our brightness bar reaches.
- **c / g.** A horizontal slice at L = ½ and V = ½. HSL's is the fully saturated hue wheel; HSV's is a dim wheel, because V = ½ caps every channel at half.
- **d / h.** A vertical cross-section through H = 0° and 180°, red on the left and cyan on the right. HSL's is a diamond (white at the top, black at the bottom, grey at the centre); HSV's is a square with white in the top centre. These two shapes are the whole difference between the models, and the reason [[constant-lightness-needs-the-hsl-family]] holds.

## 2. From the cube to the cylinders

**Source.** *Polar-Coördinate Representations of the RGB Color Space*, also Jacob Rus, Wikimedia Commons. The derivation as a flowchart.

1. **The RGB cube**, black at one corner, white at the opposite one.
2. **Tilt the cube and add seams** so black is at the bottom and white at the top. The six other corners now sit at two heights, and viewed from above they form the hexagon. This is [[hexagon-is-the-cube-down-its-diagonal]], drawn as a step.
3. From here three roads:
   - **Force R, G, B, C, M, Y into one plane** at the top, then **expand the horizontal slices** into circles: the HSV *hexcone*, then the HSV cylinder. The apex at black is stretched into a whole disc of identical black — which is the degeneracy in [[research/hsl-degenerate-states]] made visible.
   - Keep the six colours at mid-height, pull white and black to the poles, expand the slices: the HSL *double hexcone*, then the HSL cylinder. Both poles are stretched, so HSL degenerates at both ends.
   - **Set height from luma** instead of from max or from the mid-range, and embed the tilted cube in a hexagonal prism: the luma / chroma / hue model. The cube is not deformed at all; it is only re-measured. Its vertical cross-section is a parallelogram, where HSV's is a square and HSL's a diamond.

The last row shows the vertical cross-sections side by side. That row is the cleanest single argument for why the models disagree about "lightness": they are different cuts of the same solid, not different solids.

Worth remembering that the "hexcone" and "double hexcone" names are later designations, not Smith's own — see the *not confirmed* items in [[research/hsl-degenerate-states]] and [[hexagon-is-the-cube-down-its-diagonal]].

## 3. The 1987 Tektronix bicone

**Source.** US Patent 4,694,286, *Apparatus and method for modifying displayed color images*, Tektronix, issued 15 September 1987. Sheet 5 of 10, Fig. 5.

An HSL solid drawn as a bicone sliced at five lightness levels, from a point at 0 % to a point at 100 %, with hue as sectors round each slice. Two things stand out:

- **It is the double hexcone with the hexagon already rounded off**, a decade before the Wikipedia pictures. The slices grow to a full circle at 50 % lightness and shrink again, which is the HSL diamond of section 1(d) swept round the axis.
- **Hue starts at blue.** The 0° mark is blue, magenta is at 60°, red at 120°, yellow at 180°, green at 240°, cyan at 300° — and the axis is labelled "HEW". Ours starts at red, as the HSV/HSL convention now does. Hue origin is a convention, not a fact of the solid, and the intro should not present red-at-zero as inevitable.

## Why this matters for the intro

[[plan-teaching-rgb-to-hsb]] wants to get from RGB to the hexagon picker without hand-waving. Picture 2 is that ladder drawn out: cube, tilt, hexagon, and only then the choice of how to measure height. The cube bench exists to try what those steps look like live, with the app's own Color Editor driving the colour:

- The **slabs** and **box** modes show a colour as its three channel contributions, and the **channel path** walks the vector sum out to the point — a more literal opening than a whole cube.
- The **brightness cut** is the horizontal slice of picture 2 before the slices are expanded — a hexagon, not a circle, which is the app's own shape.
- The **Hexagon** camera preset is the "tilt cube" step seen from directly above.

Open: whether the intro shows the expansion to a circle at all, given the picker keeps the hexagon. [[rgb-stems-must-curve-in-circle-space]] is the cost of that expansion, measured.
