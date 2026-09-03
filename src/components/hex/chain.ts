import type { RGB } from '../../utils/colorConversions';
import { CENTER_X, CENTER_Y, RADIUS, PI, DIRS, shapeEdgeDist, type Channel } from './hexConstants';

/**
 * The RGB vector chain: origin, then one leg per channel laid tip to tail.
 *
 * Pure, so it can be tested without a component and so the three hosts that
 * draw it - the app, the plugin, the deck - cannot each carry a copy. The
 * geometry is what makes the chain true rather than illustrative: the hexagon
 * is a linear projection of the RGB cube, so adding three channel vectors in
 * the plane lands exactly on the colour. See
 * hexagon-is-the-cube-down-its-diagonal.md.
 */
export interface ChainPoint { x: number; y: number }

export interface Chain {
  /** `points[0]` is the origin; the last point is the colour. */
  points: ChainPoint[];
  /** Parallel to `points`: 'origin', then 'red' | 'green' | 'blue' in `order`. */
  dotNames: string[];
}

export interface ChainOptions {
  hue: number;
  saturation: number;
  /** 1 the hexagon, 0 the circle. Only the tip is affected below 1. */
  shapeMix?: number;
}

const NAME: Record<Channel, string> = { r: 'red', g: 'green', b: 'blue' };

export function buildChain(rgb: RGB, order: Channel[], { hue, saturation, shapeMix = 1 }: ChainOptions): Chain {
  const scale = RADIUS / 255;
  const p0: ChainPoint = { x: CENTER_X, y: CENTER_Y };
  const points: ChainPoint[] = [p0];
  const dotNames = ['origin'];
  let current = p0;
  for (const ch of order) {
    const dir = DIRS[ch];
    const value = rgb[ch];
    current = { x: current.x + value * scale * dir.x, y: current.y + value * scale * dir.y };
    points.push(current);
    dotNames.push(NAME[ch]);
  }

  /*
   * On a wheel the radius is saturation; on the hexagon it is chroma.
   *
   * The chain lands at chroma by construction - saturation times brightness -
   * because that is the edge of the cube's cross-section, which is what the
   * hexagon draws and what a drag has to agree with. A wheel draws no
   * cross-section, so brightness has nowhere to show and the classic mapping
   * is angle for hue, distance for saturation, nothing for brightness. Both
   * are right about their own shape.
   *
   * Same ray either way - the chain ends in the hue direction - so lerping
   * the tip in x/y slides it along that ray, and the last stem follows it
   * rather than detaching. Untouched at shapeMix 1, so the picker and the
   * plugin get the chain's own tip and not a recomputation of it.
   */
  if (shapeMix < 1) {
    const rad = (hue * PI) / 180;
    const d = (saturation / 100) * shapeEdgeDist(rad, RADIUS, shapeMix);
    const wheel = { x: CENTER_X + d * Math.cos(rad), y: CENTER_Y - d * Math.sin(rad) };
    const tip = points[points.length - 1];
    points[points.length - 1] = {
      x: wheel.x + (tip.x - wheel.x) * shapeMix,
      y: wheel.y + (tip.y - wheel.y) * shapeMix,
    };
  }
  return { points, dotNames };
}
