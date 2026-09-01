# Colour Models

The maths the picker is built on, what each model claims, and where each one
stops being true. Split out on 2026-09-01, when the Oklab research made this the
largest cluster in the wiki.

## The geometry

- [[hexagon-is-the-cube-down-its-diagonal]] — the hexagon is the literal
  silhouette of the RGB cube viewed along black→white. Every geometric constant
  in `ColorHexagon` follows from it. Interactive proof in
  `docs/prototypes/rgb-cube/`
- **Radius is chroma, not saturation.** At brightness `b` the reachable colours
  are the cube's cross-section, a hexagon of radius `b/100`, so the handle sits
  at `(s/100) × (b/100) × edge`. Not yet its own note; documented in the root
  `CLAUDE.md` and in `hexConstants.ts`

## Where the models give out

- [[research/hsl-degenerate-states]] — HSB loses resolution only toward black,
  HSL loses it at *both* ends; what CSS Color 4 calls the condition
- [[decision-hsb-canonical-rgb-override]] — colour state is one HSB and the
  exact RGB rides in a ref, because 86.4% of 8-bit colours change on the round
  trip. Implemented once, in `src/hooks/useColorState.ts`
- [[decision-hsl-gesture-origin]] — a gesture freezes the channels it is not
  touching, because HSB↔HSL round-trips lose information twice
- [[decision-brightness-axis-not-luminance]] — the bar names its own axis, and
  that name is not "luminance"

## Perceptual colour

- [[oklab-and-the-perceptual-color-spaces]] — CIELAB, what "Ok" means, the
  criticisms, and everything built since. The survey, with sources
- [[constant-lightness-needs-the-hsl-family]] — **the useful finding.** Holding
  perceived brightness flat across a hue rotation is an HSV-vs-HSL question, not
  an sRGB-vs-Oklab one. OkHSL does it exactly; OkHSV structurally cannot
- [[srgb-gamut-is-not-star-shaped-in-oklab]] — walking outward at fixed
  lightness, the gamut can go in, out, and back in. Invisible to a person, fatal
  to a naive search
- [[plan-perceptual-color-in-color-taylor]] — what to actually build, where the
  complexity cliff is, and the deck slide that does not exist yet

## Bringing the circle into the app

- [[rgb-stems-must-curve-in-circle-space]] — the hexagon is a linear projection
  and the circle is not, so the vector chain's legs are forced to bow. Playable:
  `docs/prototypes/rgb-stems-circle-space.html`

## Teaching it

- [[plan-teaching-rgb-to-hsb]] — the ladder and the deck's running order, which
  already ends on OkLab
- [[presentation]] — the deck MOC

## Open questions

- Should the app learn OkHSL, and does the hexagon survive it?
  [[plan-perceptual-color-in-color-taylor]] says yes and no respectively — not
  yet decided, no issue filed
- Helmholtz–Kohlrausch is modelled by nothing we use, so even "constant
  lightness" is approximate
