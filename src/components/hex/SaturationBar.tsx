import { CALLOUT_LINE, HIGHLIGHT_IN, HIGHLIGHT_OUT } from '../../utils/highlight';
import { hsbToDisplay, type ColorSpace } from '../../utils/sliderGradients';
import { hslToRgb, linearToSrgb } from '../../utils/colorConversions';
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

/** The HSL twin, for when the bar is driving HSL's S at a held lightness. */
function displayHslHex(h: number, s: number, l: number, colorSpace: ColorSpace) {
  const c = hslToRgb(h, s, l);
  if (colorSpace === 'linear') {
    return rgbToHex(linearToSrgb(c.r / 255), linearToSrgb(c.g / 255), linearToSrgb(c.b / 255));
  }
  return rgbToHex(c.r, c.g, c.b);
}

interface SaturationBarProps {
  hue: number;
  saturation: number;
  brightness: number;
  /** Which model the bar is showing - HSL's S ramps at a held L, not a held b. */
  blMode: 'brightness' | 'lightness';
  lightness: number;
  satPointerDownRef: MutableRefObject<PointerDownState | null>;
  /** Grabbing the arrow drags immediately, with no tap-vs-drag threshold. */
  onArrowDragStart: () => void;
  animateSatToValue: (v: number) => void;
  colorSpace: ColorSpace;
  /**
   * Another control is moving this bar's value. Draws the hexagon's keyline
   * round the track; the host decides when from useImpact.
   */
  lit?: boolean;
}

/**
 * The horizontal mirror of BrightnessBar: same 22-unit track, same arrow, same
 * clickable ticks, rotated a quarter turn and hung under the hexagon.
 *
 * The two ends are the same two colors the color editor's saturation slider
 * runs between - grey at the current brightness, and full chroma at the current
 * hue - so the two controls agree by construction rather than by eye.
 */
export default function SaturationBar({ hue, saturation, brightness, blMode, lightness, satPointerDownRef, onArrowDragStart, animateSatToValue, colorSpace, lit = false }: SaturationBarProps) {
  const arrowX = SAT_BAR_LEFT + (saturation / 100) * SAT_BAR_WIDTH;

  return (
    <>
      <defs>
        <linearGradient id="sat-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={blMode === 'brightness'
            ? displayHex(hue, 0, brightness, colorSpace)
            : displayHslHex(hue, 0, lightness, colorSpace)} />
          <stop offset="100%" stopColor={blMode === 'brightness'
            ? displayHex(hue, 100, brightness, colorSpace)
            : displayHslHex(hue, 100, lightness, colorSpace)} />
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
        data-hold="sat"
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
      {/* The impact keyline, on the track's edge, always mounted for the fade. */}
      <rect
        x={SAT_BAR_LEFT} y={SAT_BAR_TOP} width={SAT_BAR_WIDTH} height={SAT_BAR_HEIGHT}
        fill="none" {...CALLOUT_LINE} strokeWidth={2.5}
        opacity={lit ? 1 : 0}
        className={`pointer-events-none ${lit ? HIGHLIGHT_IN : HIGHLIGHT_OUT}`}
      />
      <polygon
        id="sat-bar-arrow"
        data-hold="sat"
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
