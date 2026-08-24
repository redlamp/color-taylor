import { hsbToDisplay, type ColorSpace } from '../../utils/sliderGradients';
import { rgbToHex } from '../../utils/colorConversions';
import {
  SAT_BAR_LEFT, SAT_BAR_TOP, SAT_BAR_WIDTH, SAT_BAR_HEIGHT, SAT_ARROW_SIZE,
} from './hexConstants';
import type { MutableRefObject } from 'react';
import type { PointerDownState } from './hexConstants';

function displayHex(h: number, s: number, b: number, colorSpace: ColorSpace) {
  const c = hsbToDisplay(h, s, b, colorSpace);
  return rgbToHex(c.r, c.g, c.b);
}

interface SaturationBarProps {
  hue: number;
  saturation: number;
  brightness: number;
  satPointerDownRef: MutableRefObject<PointerDownState | null>;
  /** Grabbing the arrow drags immediately, with no tap-vs-drag threshold. */
  onArrowDragStart: () => void;
  animateSatToValue: (v: number) => void;
  colorSpace: ColorSpace;
}

/**
 * The horizontal mirror of BrightnessBar: same 22-unit track, same arrow, same
 * clickable ticks, rotated a quarter turn and hung under the hexagon.
 *
 * The two ends are the same two colors the color editor's saturation slider
 * runs between - grey at the current brightness, and full chroma at the current
 * hue - so the two controls agree by construction rather than by eye.
 */
export default function SaturationBar({ hue, saturation, brightness, satPointerDownRef, onArrowDragStart, animateSatToValue, colorSpace }: SaturationBarProps) {
  const arrowX = SAT_BAR_LEFT + (saturation / 100) * SAT_BAR_WIDTH;

  return (
    <>
      <defs>
        <linearGradient id="sat-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={displayHex(hue, 0, brightness, colorSpace)} />
          <stop offset="100%" stopColor={displayHex(hue, 100, brightness, colorSpace)} />
        </linearGradient>
      </defs>
      <rect
        id="sat-bar"
        x={SAT_BAR_LEFT}
        y={SAT_BAR_TOP}
        width={SAT_BAR_WIDTH}
        height={SAT_BAR_HEIGHT}
        fill="url(#sat-gradient)"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={1}
        className="cursor-pointer touch-none"
        onPointerDown={(e) => {
          e.stopPropagation();
          satPointerDownRef.current = {
            clientX: e.clientX,
            clientY: e.clientY,
            time: Date.now(),
            isDragging: false,
          };
        }}
      />
      {/* Points down at the bar from the gap above it, where the connector to
          the vector chain's tip starts. BrightnessBar's arrow points inboard at
          its own bar for the same reason. */}
      <polygon
        id="sat-bar-arrow"
        points={`${arrowX},${SAT_BAR_TOP - 2} ${arrowX - 5},${SAT_BAR_TOP - SAT_ARROW_SIZE - 2} ${arrowX + 5},${SAT_BAR_TOP - SAT_ARROW_SIZE - 2}`}
        fill="var(--foreground)"
        className="cursor-pointer"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onArrowDragStart();
        }}
      />

      {/* Tick marks only. The labels are HTML in SaturationMarkers so they keep
          a fixed type size instead of scaling with the viewBox - same split
          BrightnessBar and BrightnessMarkers use. */}
      {[
        { value: 0, x: SAT_BAR_LEFT },
        { value: 50, x: SAT_BAR_LEFT + SAT_BAR_WIDTH / 2 },
        { value: 100, x: SAT_BAR_LEFT + SAT_BAR_WIDTH },
      ].map(({ value, x }) => (
        <g
          key={value}
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            animateSatToValue(value);
          }}
        >
          {/* Widens a 1x4 tick into a real target, the way the brightness ticks
              borrow their whole gutter row. */}
          <rect
            x={x - 7}
            y={SAT_BAR_TOP + SAT_BAR_HEIGHT}
            width={14}
            height={24}
            fill="transparent"
          />
          <line
            x1={x}
            y1={SAT_BAR_TOP + SAT_BAR_HEIGHT}
            x2={x}
            y2={SAT_BAR_TOP + SAT_BAR_HEIGHT + 4}
            stroke="var(--foreground)"
            strokeWidth={1}
            opacity={0.5}
          />
        </g>
      ))}
    </>
  );
}
