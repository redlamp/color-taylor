/**
 * Named camera positions for the xyY solid, and the one of them that has to be
 * exactly right.
 *
 * Four fixed views and a free one. The fixed four are orbit angles, not
 * matrices: `cubeRenderer`'s camera is built from an azimuth and an elevation
 * about the neutral axis, so a named view is a pair of numbers and the tween
 * between two of them is a tween between two pairs.
 *
 * `top` IS THE FLAT DIAGRAM, AND THAT IS A CLAIM THAT CAN BE WRONG. Looking
 * straight down the neutral axis, the solid's silhouette is its own floor, and
 * the floor is the CIE 1931 chromaticity diagram the flat panel draws. That only
 * reads as the *same* picture if it arrives the same way up: x increasing to
 * the right, y increasing upward, no mirror. Screen-right in this camera is
 * `east` rotated by the azimuth, so the elevation alone does not decide it -
 * `top` has to pin theta as well as phi, or "straight down" lands at whatever
 * azimuth the last drag left behind and the collapse reads as a coincidence
 * that did not quite happen.
 *
 * At `theta = PI/2` the basis comes out exactly right: screen-right is E1 and
 * screen-up is E2, the same two directions `xyYToWorld` lays the floor on. So
 * a chromaticity (x, y) lands at ((x - xw) * XYY_SCALE, (y - yw) * XYY_SCALE)
 * on screen, which is the flat diagram up to one positive scale factor.
 * cieSolid.test.ts asserts that against the flat diagram's own projection.
 */

/** Which named view the camera is at. `camera` is free orbit. */
export type CieView = 'front' | 'right' | 'top' | 'iso' | 'camera';

export interface ViewAngles {
  /** Azimuth about the neutral axis, radians. */
  theta: number;
  /** Elevation, radians. PI/2 is straight down. */
  phi: number;
}

/**
 * `iso` IS A TILTED FRONT VIEW, NOT A TRUE ISOMETRIC, AND THAT IS DELIBERATE.
 *
 * A textbook isometric swings the camera 45 degrees round in azimuth as well
 * as 35.26 degrees down. The swing is the problem: it puts the solid at an
 * angle to the chromaticity diagram beside it and breaks the correspondence
 * the page is built on. So `iso` keeps the azimuth every other view but
 * `right` uses and only changes the elevation. The camera stands off the low-y
 * edge of the diagram looking across it, chromaticity x runs the same way
 * across the screen as it does on the flat panel, chromaticity y recedes into
 * the scene, and luminance is vertical - which is the axis the panel exists
 * for.
 *
 * `top`, `front` and `iso` therefore differ only in elevation, and the toggle
 * strip reads as one camera being lowered rather than five unrelated places to
 * stand. `right` is the only quarter turn.
 *
 * 30 degrees is the tilt. It has to clear two tests at once, and they pull
 * opposite ways: too shallow and the roof flattens into the floor, so the ten-
 * to-one gap between green's luminance and blue's stops being visible; too
 * steep and the view approaches `top`, which has no height in it at all.
 * 30 shows blue's corner lying almost on the floor and the green-to-yellow
 * ridge towering over it, which is the panel's whole argument. It is also the
 * tilt `CubeBench` uses for the same job next door.
 *
 * The name stays `iso` because that is what it is called on the page.
 */
export const ISO_PHI = Math.PI / 6;

/**
 * The azimuth that puts the chromaticity x axis along screen-right. Every
 * fixed view but `right` uses it, because a view that shares the flat
 * diagram's left-to-right reading is a view you can compare with the flat one.
 */
export const X_EAST_THETA = Math.PI / 2;

export const VIEW_ANGLES: Record<Exclude<CieView, 'camera'>, ViewAngles> = {
  /** Elevation from the front: chromaticity x across, luminance up. */
  front: { theta: X_EAST_THETA, phi: 0 },
  /** A quarter turn round: chromaticity y across, luminance up. */
  right: { theta: 0, phi: 0 },
  /** Straight down. The silhouette is the flat diagram, the same way up. */
  top: { theta: X_EAST_THETA, phi: Math.PI / 2 },
  /** Front, tilted down. Same azimuth as `front` and `top` - see ISO_PHI. */
  iso: { theta: X_EAST_THETA, phi: ISO_PHI },
};

export const VIEW_LABELS: Record<CieView, string> = {
  front: 'Front',
  right: 'Right',
  top: 'Top',
  iso: 'Iso',
  camera: 'Camera',
};
