import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { HEX_HIGHLIGHT_COLOR, HIGHLIGHT_IN, HIGHLIGHT_OUT } from '../../utils/highlight';
import {
  BAR_ARROW, BAR_LABEL_INSET_H, BAR_LABEL_SPACE, BAR_TICK, BAR_TITLE_LIFT, BAR_TRACK,
  type PointerDownState,
} from './hexConstants';

/**
 * Half-height of the value arrow, across the bar. The arrowhead is
 * BAR_ARROW deep and this wide either side of the value.
 */
const ARROW_HALF = 5;
/** The tick row's other dimension - a 4x1 mark widened into a real target. */
const TICK_BAND = 14;
/** How far a horizontal bar's tick band reaches below the track. */
const TICK_BAND_DEPTH = 24;
/** Gap between the ticks and the numbers beside them. The horizontal one is
 *  shared with the stage, which budgets the room the row needs below it. */
const LABEL_INSET = { vertical: 8, horizontal: BAR_LABEL_INSET_H };
/**
 * The vertical title's right edge, measured back from the track's far side:
 * clear of the value arrow, not just of the track. The arrow rides to the top
 * of the bar at high values and a title set against the track alone has its
 * chip eat half the arrowhead.
 */
const TITLE_CLEARANCE = BAR_TRACK + BAR_ARROW + 2;

/** A press has to travel this far before it counts as a drag and not a tap. */
const DRAG_TRIGGER_DISTANCE = 4;
const CLICK_MAX_DURATION = 200;

const MARKS = [0, 50, 100];

/**
 * The axis title's treatment, and the value readout's where the number joins
 * the title's row - they are one line and have to be the same thing twice.
 *
 * bg-card, because a label over a rule should break the rule: the hue ray and
 * the field's corners run behind this strip.
 *
 * px-1, not py-1, for the padding at the two ends of the word: Tailwind v4 maps
 * px/py to padding-inline/padding-block, which are logical, and the vertical
 * writing mode the standing title wears swaps which is which. The -4px at the
 * callsites then cancels that padding so the glyphs, not the invisible chip,
 * line up with the end of the bar.
 *
 * text-sm rather than the text-base this project defaults to: it is the size
 * every other piece of furniture on these bars is set at - the 0/50/100 row,
 * the hue caption - and the row has to fit across a 140px track at a 240px
 * card with "Saturation" at one end of it.
 */
const TITLE_CLASS = 'absolute z-[6] select-none whitespace-nowrap bg-card px-1 text-sm leading-none text-muted-foreground pointer-events-none';

export type HexBarOrientation = 'vertical' | 'horizontal';

interface HexBarProps {
  /** Vertical runs 100 at the top; horizontal runs 100 at the right. */
  orientation: HexBarOrientation;
  /**
   * Which control this is. It is the id prefix (`bl-bar`, `bl-handle`) and the
   * `data-hold` key useImpact reads, so the two bars stay distinguishable
   * without the host restating either.
   */
  axis: 'bl' | 'sat';
  /** 0-100, what the arrow and the pill show. */
  value: number;
  /** The axis title beside the bar, and the noun in the markers' aria-labels. */
  title: string;
  /**
   * The track's paint, as CSS gradient stops running 0 to 100.
   *
   * Stops and not a finished gradient: the direction is a fact about which way
   * the bar points, which is this component's business, and a host that wrote
   * the whole string had to know. It did not - the brightness ramp was written
   * down a standing bar and stayed that way once the bar lay down, so at
   * narrow widths brightness ran dark-to-light one way and saturation the
   * other on two tracks an inch apart.
   */
  stops: string;
  /** The pill's fill - the colour itself - and the colour its arrow takes. */
  swatch: string;
  swatchText: string;
  /**
   * One layout unit, as a CSS length.
   *
   * The bar is drawn in its own units and scales as a whole, the way the
   * hexagon beside it does; the host says how big a unit is. A `cqw` against
   * the stage's inline-size container is what keeps the two in step at every
   * card width without a resize observer on either.
   */
  unit: string;
  /** The track's box within the stage. The rest hangs off it. */
  style: CSSProperties;
  /**
   * Another control is moving this bar's value. Draws the shared keyline round
   * the track; the host decides when, from useImpact.
   */
  lit?: boolean;
  /**
   * The furniture - axis title, 0/50/100 targets and value pill. Off leaves the
   * track and its arrow, which is the plain slider the intro deck's wheel had.
   * Both stay draggable without the pill.
   */
  markers?: boolean;
  /**
   * Where the value is written: on a pill riding the track, or at the right-hand
   * end of the title row.
   *
   * Stacked, both bars lie horizontal a short way apart and two pills hanging
   * under two tracks is more furniture than the card has room for - so the
   * number joins the word that names it and the arrow is left as the only
   * handle. 'pill' everywhere else, unchanged.
   */
  readout?: 'pill' | 'title';
  /**
   * Room the pill has past the track's far edge before it must slide back over
   * it, as a CSS length. The pill is fixed-size HTML on a bar that scales, so
   * past this it outruns the card. Omit where nothing bounds it.
   *
   * The standing brightness bar's, and only its. A lying bar centres its pill
   * on an anchor that runs along the track, so it needed a bound at each end -
   * but the only lying bar that still has a pill is the saturation bar in the
   * standing layout, whose narrowest card is now HEX_STACKED_BARS_MAX and where
   * neither bound comes anywhere near biting.
   */
  pillGutter?: string;
  /** The pill was grabbed - a hold that has not moved yet is still a hold. */
  onGrab?: () => void;
  /** A drag has begun, from the pill, the arrow, or the track past the threshold. */
  onDragStart: () => void;
  onDrag: (value: number) => void;
  /** A press and release on the track that never became a drag. */
  onTap: (value: number) => void;
  /** A click on one of the 0/50/100 targets, or the tick beside it. */
  onPick: (value: number) => void;
  onRelease?: () => void;
}

/**
 * The brightness/lightness and saturation bars: one control, drawn twice.
 *
 * They used to be SVG fragments inside the hexagon's viewBox, which made them
 * look like parts of the hexagon rather than the separate controls they are -
 * and tied their geometry to a coordinate space they have no business in. The
 * lines that once connected them to the chain are gone, so nothing needs that
 * space any more. Here they are ordinary HTML laid out by the stage, which is
 * also what lets the vertical one flip horizontal at narrow widths.
 */
export default function HexBar({
  orientation, axis, value, title, stops, swatch, swatchText, unit, style,
  lit = false, markers = true, readout = 'pill', pillGutter,
  onGrab, onDragStart, onDrag, onTap, onPick, onRelease,
}: HexBarProps) {
  const vertical = orientation === 'vertical';
  const pill = readout === 'pill';
  /** n layout units, as a CSS length. */
  const u = (n: number) => `calc(${unit} * ${n})`;
  /** Where a value sits along the track, as a percentage of it. */
  const along = (v: number) => `${vertical ? 100 - v : v}%`;

  const trackRef = useRef<HTMLDivElement | null>(null);
  const press = useRef<PointerDownState | null>(null);
  const dragging = useRef(false);

  const valueAt = useCallback((e: { clientX: number; clientY: number }) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return null;
    if (vertical) {
      const y = Math.max(0, Math.min(e.clientY - r.top, r.height));
      return Math.round((1 - y / r.height) * 100);
    }
    const x = Math.max(0, Math.min(e.clientX - r.left, r.width));
    return Math.round((x / r.width) * 100);
  }, [vertical]);

  /*
   * The gesture lives here rather than in the host: a bar knows where its own
   * track is, and the host only ever wanted the number. What the host still
   * owns is what that number means - HSB's b and HSL's l are not the same
   * axis, and only it can say which is live.
   */
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const pd = press.current;
      if (pd && !pd.isDragging) {
        const dx = e.clientX - pd.clientX;
        const dy = e.clientY - pd.clientY;
        if (Math.sqrt(dx * dx + dy * dy) < DRAG_TRIGGER_DISTANCE) return;
        pd.isDragging = true;
        dragging.current = true;
        onDragStart();
      }
      if (!dragging.current) return;
      const v = valueAt(e);
      if (v !== null) onDrag(v);
    };
    const onPointerUp = (e: PointerEvent) => {
      const pd = press.current;
      const held = pd !== null || dragging.current;
      if (pd && !pd.isDragging && Date.now() - pd.time <= CLICK_MAX_DURATION) {
        const v = valueAt(e);
        if (v !== null) onTap(v);
      }
      press.current = null;
      dragging.current = false;
      if (held) onRelease?.();
    };
    /*
     * Every way a press can end without a pointerup. `pointercancel` fires when
     * the browser takes the pointer away - a touch that becomes a scroll, a
     * stylus leaving range, the OS claiming the gesture - and `blur` covers the
     * drag still held when the window goes away, where the release lands in
     * another application and never reaches us. Without both, the press stays
     * latched and the handle keeps following the cursor with no button down.
     */
    const abandon = () => {
      const held = press.current !== null || dragging.current;
      press.current = null;
      dragging.current = false;
      if (held) onRelease?.();
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', abandon);
    window.addEventListener('blur', abandon);
    document.documentElement.addEventListener('pointerleave', abandon);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', abandon);
      window.removeEventListener('blur', abandon);
      document.documentElement.removeEventListener('pointerleave', abandon);
    };
  }, [valueAt, onDragStart, onDrag, onTap, onRelease]);

  /** Grabbing the arrow or the pill drags at once, with no threshold to clear. */
  const grab = (e: ReactPointerEvent, notify?: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    press.current = null;
    onDragStart();
    notify?.();
  };

  const pos = along(value);
  const labelInset = LABEL_INSET[orientation];
  /** The band above a lying bar's track, shared by its title and its readout. */
  const titleTop = `calc(0px - ${u(BAR_ARROW + 2)} - ${BAR_TITLE_LIFT}px)`;

  // The arrow points inboard at its own track: right at a vertical bar's left
  // edge, down at a horizontal bar's top one. A CSS triangle rather than a
  // polygon, so it scales with `unit` like everything else here.
  const arrowStyle: CSSProperties = vertical
    ? {
        left: `calc(0px - ${u(BAR_ARROW + 2)})`,
        top: pos,
        translate: '0 -50%',
        borderTop: `${u(ARROW_HALF)} solid transparent`,
        borderBottom: `${u(ARROW_HALF)} solid transparent`,
        borderLeft: `${u(BAR_ARROW)} solid var(--foreground)`,
      }
    : {
        left: pos,
        top: `calc(0px - ${u(BAR_ARROW + 2)})`,
        translate: '-50% 0',
        borderLeft: `${u(ARROW_HALF)} solid transparent`,
        borderRight: `${u(ARROW_HALF)} solid transparent`,
        borderTop: `${u(BAR_ARROW)} solid var(--foreground)`,
      };

  return (
    /* The track is the component's own box; everything else hangs off it, so
       the host places one rectangle and the furniture follows. */
    <div
      id={`${axis}-bar`}
      ref={trackRef}
      data-hold={axis}
      className="absolute z-[6] cursor-pointer select-none touch-none"
      style={{
        ...style,
        // 0 at the bottom of a standing bar and at the left edge of a lying
        // one, which is where its own value arrow and its drag both put it.
        background: `linear-gradient(${vertical ? 'to top' : 'to right'}, ${stops})`,
        // The SVG rect wore a 1-unit stroke, which straddles the edge. Two
        // shadows rather than a border, so the box stays the track's own.
        boxShadow: `inset 0 0 0 ${u(0.5)} rgba(255,255,255,0.1), 0 0 0 ${u(0.5)} rgba(255,255,255,0.1)`,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        press.current = { clientX: e.clientX, clientY: e.clientY, time: Date.now(), isDragging: false };
      }}
    >
      {/* The impact keyline, on the track's edge, always mounted for the fade. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${lit ? HIGHLIGHT_IN : HIGHLIGHT_OUT}`}
        style={{
          boxShadow: `inset 0 0 0 ${u(1.25)} ${HEX_HIGHLIGHT_COLOR}, 0 0 0 ${u(1.25)} ${HEX_HIGHLIGHT_COLOR}`,
          filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9))',
          opacity: lit ? 1 : 0,
        }}
      />

      <div
        id={`${axis}-bar-arrow`}
        data-hold={axis}
        className="absolute h-0 w-0 cursor-pointer"
        style={arrowStyle}
        // With no pill the arrow is the only handle, so it takes over the hold
        // the pill was reporting - a press that has not moved yet still sounds.
        onPointerDown={(e) => grab(e, pill ? undefined : onGrab)}
      />

      {/* Ticks. The mark itself is 4x1 units - a target in name only - so a
          transparent band widens each one to the whole gutter beside it, and
          the mark and the number act as one row. */}
      {MARKS.map((v) => (
        <div key={v}>
          <div
            className="absolute cursor-pointer"
            style={vertical
              ? { left: '100%', top: along(v), translate: '0 -50%', width: u(BAR_ARROW + BAR_LABEL_SPACE), height: u(TICK_BAND) }
              : { left: along(v), top: '100%', translate: '-50% 0', width: u(TICK_BAND), height: u(TICK_BAND_DEPTH) }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onPick(v); }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bg-[var(--foreground)] opacity-50"
            style={vertical
              ? { left: '100%', top: along(v), translate: '0 -50%', width: u(BAR_TICK), height: u(1) }
              : { left: along(v), top: '100%', translate: '-50% 0', width: u(1), height: u(BAR_TICK) }}
          />
        </div>
      ))}

      {markers && (
        <>
          {/*
            Names what the bar drives, and which of the two models is live.
            The vertical form is set down the bar's inboard side, top-aligned
            with the track and reading bottom-to-top, so the word ends where
            the bar begins; horizontally that lane becomes a strip above it,
            shared with the readout where there is one.

            vertical-rl + rotate-180 rather than a plain rotate(-90deg): it
            gives the element a layout box that is already narrow and tall, so
            `right` and `top` place it directly. Rotating a horizontal box
            about its centre leaves the footprint offset by half the
            difference between its width and its height - by however long the
            word is.
          */}
          <div
            id={`${axis}-title`}
            className={`${TITLE_CLASS} ${vertical ? 'rotate-180 [writing-mode:vertical-rl]' : ''}`}
            style={vertical
              ? { right: `calc(${u(TITLE_CLEARANCE)} + 4px)`, top: '-4px' }
              : { left: '-4px', top: titleTop }}
          >
            {title}
          </div>

          {/*
            The value, at the other end of the title's row.

            It is the pill's job where there is no pill: the same number, over
            the track's east end - the end the value counts up to - so the row
            reads "Brightness ... 40%" across the control it belongs to. Exactly
            the title's treatment, down to the chip behind it, because the two
            are one line; a heavier or larger number here would read as a second
            control beside the word rather than as its readout. What is lost
            with the pill is the colour, and that is the point: on two tracks an
            inch apart the two coloured pills were the loudest thing in the card
            and said nothing the swatch above does not.
          */}
          {!pill && (
            <div
              id={`${axis}-value`}
              className={`${TITLE_CLASS} tabular-nums`}
              style={{ right: '-4px', top: titleTop }}
            >
              {Math.round(value)}%
            </div>
          )}

          {MARKS.map((v) => (
            <button
              key={v}
              type="button"
              // z-[6] clears #hex-svg's z-[5]: a root <svg> takes the hit over
              // its whole box, and the field's box reaches under this gutter.
              // Below the value pill's z-10 deliberately - the pill is the one
              // thing that should stay on top of the row.
              //
              // No `font-mono`: this project's CSS groups `.font-mono` with
              // `code, pre` and gives it `font-size: 1em`, which lands after
              // the text-size utilities and silently overrides them.
              // tabular-nums gets the digit alignment without the trap.
              className={`absolute z-[6] cursor-pointer select-none px-1 py-1 text-sm leading-none tabular-nums text-muted-foreground hover:text-foreground ${vertical ? '-translate-y-1/2 text-left' : '-translate-x-1/2 text-center'}`}
              // px-1/py-1 turn a 5x10px target into a 13x18px one; the -4px
              // pulls the padding back off so the digits stay put.
              style={vertical
                ? { left: `calc(100% + ${u(labelInset)} - 4px)`, top: along(v) }
                : { left: along(v), top: `calc(100% + ${u(labelInset)} - 4px)` }}
              aria-label={`Set ${title.toLowerCase()} to ${v}`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onPick(v); }}
            >
              {v}
            </button>
          ))}

          {/*
            The value pill, on the track's outboard edge with its arrow
            pointing back at it.

            Fixed-size HTML at a percentage offset, so on a narrowing standing
            bar its far edge outruns the card. `pillGutter` is the room it has;
            past that the whole handle slides back over the track rather than
            off the screen. Written in CSS rather than measured, because in
            `translate` a percentage is the element's own width - which the
            readout changes between "0%" and "100%" - and this tracks it
            without a resize observer.

            A lying bar's pill had a matching clamp at each end, for the card
            widths where the two bars stack. There are no pills there any more,
            and the one bar that still lies down with a pill - saturation, in
            the standing layout - is only ever drawn on a card wider than
            HEX_STACKED_BARS_MAX, where neither bound is within 17px of biting.
            So it centres, and nothing computes bounds for it.
          */}
          {pill && <div
            id={`${axis}-handle`}
            data-hold={axis}
            className={`absolute z-10 flex cursor-pointer select-none touch-none ${vertical ? 'items-center' : 'flex-col items-center'}`}
            style={vertical
              ? {
                  left: '100%',
                  top: pos,
                  translate: pillGutter ? `min(0px, calc(${pillGutter} - 100%)) -50%` : '0 -50%',
                }
              : { left: pos, top: '100%', translate: '-50% 0' }}
            onPointerDown={(e) => grab(e, onGrab)}
          >
            <div
              className={`h-0 w-0 relative z-10 ${vertical ? '-mr-1' : '-mb-1'}`}
              style={vertical
                ? {
                    borderTop: '6px solid transparent',
                    borderBottom: '6px solid transparent',
                    borderRight: `6px solid ${swatch}`,
                  }
                : {
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: `6px solid ${swatch}`,
                  }}
            />
            <div
              className="flex items-center justify-center h-7 px-2 rounded-full shadow-md"
              style={{ backgroundColor: swatch, border: '2px solid var(--background)' }}
            >
              <span
                className="text-sm font-mono font-normal pointer-events-none whitespace-nowrap"
                style={{ color: swatchText }}
              >
                {Math.round(value)}%
              </span>
            </div>
          </div>}
        </>
      )}
    </div>
  );
}
