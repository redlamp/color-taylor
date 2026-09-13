import { memo, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { rgbToHex, hexDigits, normalizedChannel, type RGB, type HSL } from '../utils/colorConversions';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTheme } from '../hooks/useTheme';

interface EquationsPanelProps {
  rgb: RGB;
  hue: number;
  saturation: number;
  brightness: number;
  hsl: HSL;
  blMode: 'brightness' | 'lightness';
}

function textOnColor(cssColor: string) {
  const m = cssColor.match(/(\d+)/g);
  if (m && m.length >= 3) {
    const [r, g, b] = m.map(Number);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#000' : '#fff';
  }
  const hex = cssColor.replace('#', '');
  if (hex.length >= 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#000' : '#fff';
  }
  return '#fff';
}

/**
 * The answer at the end of each equation, underlined. In the theme's
 * foreground, not white: white was invisible on the light theme's panel, and
 * the underline follows the text colour for the same reason.
 */
const RESULT_CLASS = 'text-foreground underline';
const RESULT_STYLE: CSSProperties = { textDecorationColor: 'currentColor', textUnderlineOffset: '2px', textDecorationThickness: '2px' };

function T({ color, title, bold, children }: { color: string; title: string; bold?: boolean; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span style={{ color }} className={`cursor-default ${bold ? 'font-bold' : ''}`}>{children}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs font-semibold border-0" style={{ '--tooltip-bg': color, backgroundColor: color, color: textOnColor(color) } as CSSProperties}>
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The Hex and Normalized cells' underlined result doubles as a copy button —
 * everywhere else in this panel the result is inert, but the final value is
 * the one thing worth grabbing straight from the equation. "Copied" swaps in
 * for the text rather than appearing beside it, so the row never reflows.
 */
/**
 * A result worn as a chip of the colour itself, the way the Variables cell's
 * "Color" label is, so the two derived spellings read as the same thing as
 * the swatch. The chip carries the affordance, so no underline.
 */
function CopyableResult({ text, color }: { text: string; color: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleClick = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1200);
    }).catch(() => { /* clipboard blocked or unavailable: leave the text as is, no error UI */ });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title="Copy"
        aria-label={`Copy ${text}`}
        className="inline cursor-pointer border-0 m-0 rounded px-1.5 py-0.5 font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        style={{ backgroundColor: color, color: textOnColor(color) }}
      >
        {copied ? 'Copied' : text}
      </button>
      {copied && <span aria-live="polite" className="sr-only">Copied</span>}
    </>
  );
}

function Row({ left, right }: { left: ReactNode; right: ReactNode }) {
  // flex-wrap so a title-row value too wide for a narrow card (the Hex and
  // Normalized cells' copy buttons) drops under the title instead of
  // overflowing; the short °/%  values the other cells pass never trigger it.
  return (
    <div className="flex flex-wrap justify-between items-baseline gap-x-2 gap-y-0.5">
      <span>{left}</span>
      <span className="text-foreground font-semibold">{right}</span>
    </div>
  );
}

function MCT({ children, title, gradStyle, bgColor }: { children: ReactNode; title: string; gradStyle: CSSProperties; bgColor: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span style={gradStyle} className="font-bold cursor-default">{children}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs font-semibold border-0" style={{ '--tooltip-bg': bgColor, background: gradStyle.background, color: '#000' } as CSSProperties}>
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

function EquationsPanel({ rgb, hue, saturation, brightness, hsl, blMode }: EquationsPanelProps) {
  const { isDark } = useTheme();
  const maxVal = Math.max(rgb.r, rgb.g, rgb.b);
  const minVal = Math.min(rgb.r, rgb.g, rgb.b);
  const delta = maxVal - minVal;
  const maxChKey = maxVal === rgb.r ? 'r' : maxVal === rgb.g ? 'g' : 'b';
  const minChKey = minVal === rgb.r ? 'r' : minVal === rgb.g ? 'g' : 'b';
  const l = (maxVal + minVal) / 2;
  const rc = isDark ? '#ff4444' : '#dd0000';
  const gc = isDark ? '#44ee44' : '#009900';
  const bc = 'rgb(96, 96, 255)';
  const mc = isDark ? '#ff44ff' : '#dd00dd';
  const cc = isDark ? '#44ffff' : '#009999';
  const oc = isDark ? '#eebb22' : '#bb8800';
  const chColor = (key: 'r' | 'g' | 'b') => key === 'r' ? rc : key === 'g' ? gc : bc;

  const pad = (v: number | string) => String(v).padStart(3, '\u2007');
  // A hex digit is never wider than 15, so the hex rows get their own width and
  // the arrows still line up under one another.
  const pad2 = (v: number | string) => String(v).padStart(2, '\u2007');
  const R = <T color={rc} title="Red channel">R</T>;
  const G = <T color={gc} title="Green channel">G</T>;
  const B_ = <T color={bc} title="Blue channel">B</T>;
  const rv = <T color={rc} title={`Red = ${rgb.r}`}>{pad(rgb.r)}</T>;
  const gv = <T color={gc} title={`Green = ${rgb.g}`}>{pad(rgb.g)}</T>;
  const bv = <T color={bc} title={`Blue = ${rgb.b}`}>{pad(rgb.b)}</T>;
  const chr = <T color={oc} title={`Chroma = ${delta}`}>chroma</T>;
  const H = <span className="text-foreground">H</span>;
  const Hr = <T color={rc} title="Hue (red dominant)">H</T>;
  const Hg = <T color={gc} title="Hue (green dominant)">H</T>;
  const Hb = <T color={bc} title="Hue (blue dominant)">H</T>;
  const S = <span className="text-foreground">S</span>;
  const Bv = <span className="text-foreground">B</span>;
  const Lv = <span className="text-foreground">L</span>;
  const maxT = (v: ReactNode) => <T color={mc} title={`Max = ${maxVal}`} bold>{v}</T>;
  const minT = (v: ReactNode) => <T color={cc} title={`Min = ${minVal}`} bold>{v}</T>;
  const chrT = (v: ReactNode) => <T color={oc} title={`Chroma = ${delta}`}>{v}</T>;
  const mcGradStyle: CSSProperties = { background: `linear-gradient(105deg, ${mc}, ${oc})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' };
  const mcVal = Math.round((1 - Math.abs(2 * l / 255 - 1)) * 255);

  // The underline takes the channel's own colour - white vanished on the light theme.
  const ulStyle = { textDecorationColor: 'currentColor', textUnderlineOffset: '2px', textDecorationThickness: '2px' };

  // Through the shared conversion helpers so neither answer can drift from
  // what the rest of the app shows. CSS Color 4 syntax for the normalized
  // form - space-separated, no commas - so what is shown is also valid CSS
  // once copied.
  const hexValue = rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase();
  const normalizedValue = `color(srgb ${normalizedChannel(rgb.r)} ${normalizedChannel(rgb.g)} ${normalizedChannel(rgb.b)})`;

  const maxMinList = (isMaxMode: boolean) => (['r', 'g', 'b'] as const).map((k, i) => {
    const raw = String(rgb[k]);
    const spaces = '\u2007'.repeat(3 - raw.length);
    const highlight = isMaxMode ? k === maxChKey : k === minChKey;
    return (
      <span key={k}>
        {i > 0 && ', '}{spaces}
        <span style={{ color: chColor(k), ...(highlight ? ulStyle : {}) }} className={highlight ? 'underline font-bold' : ''}>
          {raw}
        </span>
      </span>
    );
  });

  /*
   * The cells stack wherever the picker is one column, and share a row only
   * where it is two - so the row rule is the same `min-[800px]` the top row and
   * the two col-span-2 panels below it use, not a breakpoint of its own.
   *
   * It used to be `sm:`, a 640px viewport. That put four cells across a panel
   * that is 552px wide at a 640px window and every one of them wrapped, and it
   * left a 160px stretch (640-799) where the picker had already gone to one
   * column but the equations had not.
   */
  return (
    <div className="grid grid-cols-1 min-[800px]:grid-cols-[1.1fr_1.2fr_1fr_0.75fr] gap-2 w-full text-sm font-mono text-muted-foreground">
      <div className="flex flex-col gap-1 border border-border rounded-lg p-1.5 min-w-0">
        <span className="text-sm font-semibold font-sans text-foreground">Variables</span>
        <hr className="border-border" />
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span><span
              className="rounded px-1.5 py-0.5"
              style={{
                backgroundColor: rgbToHex(rgb.r, rgb.g, rgb.b),
                color: (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) > 150 ? '#000' : '#fff',
              }}
            >Color</span>:</span>
            <span>rgb({rv}, {gv}, {bv})</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span><T color={mc} title="Maximum RGB value">max</T>:</span>
            <span>max({maxMinList(true)})</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span><T color={cc} title="Minimum RGB value">min</T>:</span>
            <span>min({maxMinList(false)})</span>
          </div>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span>{chr}:</span>
            <span>{maxT(pad(maxVal))}-{minT(pad(minVal))} = {chrT(pad(delta))}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 border border-border rounded-lg p-1.5 min-w-0">
        <Row
          left={<span className="text-sm font-semibold font-sans text-foreground">Hue</span>}
          right={`${hue}°`}
        />
        <hr className="border-border" />
        <span className="text-sm font-sans text-muted-foreground">Based on max RGB channel</span>
        <span className={maxChKey === 'r' ? '' : 'opacity-30'}>{Hr}: 60(({gv}-{bv})/{chrT(pad(delta))}%6){maxChKey === 'r' && <> = <span className={RESULT_CLASS} style={RESULT_STYLE}>{hue}°</span></>}</span>
        <span className={maxChKey === 'g' ? '' : 'opacity-30'}>{Hg}: 60(({bv}-{rv})/{chrT(pad(delta))}+2){maxChKey === 'g' && <> = <span className={RESULT_CLASS} style={RESULT_STYLE}>{hue}°</span></>}</span>
        <span className={maxChKey === 'b' ? '' : 'opacity-30'}>{Hb}: 60(({rv}-{gv})/{chrT(pad(delta))}+4){maxChKey === 'b' && <> = <span className={RESULT_CLASS} style={RESULT_STYLE}>{hue}°</span></>}</span>
      </div>
      <div className="flex flex-col gap-1 border border-border rounded-lg p-1.5 min-w-0">
        <Row
          left={<span className="text-sm font-semibold font-sans text-foreground">Saturation</span>}
          right={blMode === 'brightness' ? `${saturation}%` : `${hsl?.s ?? 0}%`}
        />
        <hr className="border-border" />
        {blMode === 'brightness' ? (
          <span>{S}: {chrT(pad(delta))}/{maxT(pad(maxVal))} = <span className={RESULT_CLASS} style={RESULT_STYLE}>{saturation}%</span></span>
        ) : (
          <>
            <span>{Lv}:{'\u2007'}({maxT(pad(maxVal))}+{minT(pad(minVal))})/2 = {pad(Math.round(l))}</span>
            <span><MCT gradStyle={mcGradStyle} bgColor={mc} title="Max Chroma">MC</MCT>: 1-|2·<span className="text-foreground font-bold">{pad(Math.round(l))}</span>/255-1| = <MCT gradStyle={mcGradStyle} bgColor={mc} title={`Max Chroma = ${mcVal}`}>{pad(mcVal)}</MCT></span>
            <span>{S}:{'\u2007'}{chrT(pad(delta))}/<MCT gradStyle={mcGradStyle} bgColor={mc} title={`Max Chroma = ${mcVal}`}>{pad(mcVal)}</MCT> = <span className={RESULT_CLASS} style={RESULT_STYLE}>{hsl?.s ?? 0}%</span></span>
          </>
        )}
      </div>
      <div className="flex flex-col gap-1 border border-border rounded-lg p-1.5">
        {blMode === 'brightness' ? (
          <>
            <Row
              left={<span className="text-sm font-semibold font-sans text-foreground">Brightness</span>}
              right={`${brightness}%`}
            />
            <hr className="border-border" />
            <span>{Bv}: {maxT(pad(maxVal))}/255 = <span className={RESULT_CLASS} style={RESULT_STYLE}>{brightness}%</span></span>
          </>
        ) : (
          <>
            <Row
              left={<span className="text-sm font-semibold font-sans text-foreground">Lightness</span>}
              right={`${hsl?.l ?? 0}%`}
            />
            <hr className="border-border" />
            <span>{Lv}: <span className="text-foreground font-bold">{pad(Math.round(l))}</span>/255 = <span className={RESULT_CLASS} style={RESULT_STYLE}>{hsl?.l ?? 0}%</span></span>
          </>
        )}
      </div>
      {/*
       * Two equal cells, not two of the four columns: the top row's track sizes
       * are 1.1/1.2/1/0.75, so a pair of col-span-2 cells would come out 2.3fr
       * against 1.75fr. A nested grid spanning the whole row splits it evenly
       * and, because it carries the same gap-2, the gutter between these two is
       * the one between the four above. Below 800 both grids are one column, so
       * the six cells stack as one list with that same gap.
       */}
      <div className="col-span-full grid grid-cols-1 min-[800px]:grid-cols-2 gap-2">
        {/* The id is a target for the walkthrough's cursor, which highlights
            this block while it hovers the editor's hex field. */}
        <div id="equations-hex" className="flex flex-col gap-1 border border-border rounded-lg p-1.5 min-w-0">
          <Row
            left={<span className="text-sm font-semibold font-sans text-foreground" title="Hexadecimal: each channel written as two base-16 digits">Hex</span>}
            right={<CopyableResult text={hexValue} color={hexValue} />}
          />
          <hr className="border-border" />
          {/*
           * The hex digit leads, its decimal in parentheses right behind it -
           * F (15·16), not 15·16 - so the line reads digit-first the way the
           * result does, with the arithmetic that justifies it kept alongside
           * rather than out front.
           */}
          {(['r', 'g', 'b'] as const).map((k) => {
            const letter = k === 'r' ? R : k === 'g' ? G : B_;
            const { high, low, hex } = hexDigits(rgb[k]);
            const highHex = hex[0].toUpperCase();
            const lowHex = hex[1].toUpperCase();
            return (
              <span key={k}>
                {letter}: {pad(rgb[k])} = {highHex} (<b>{pad2(high)}</b>·16) + {lowHex} (<b>{pad2(low)}</b>) → <span className="text-foreground font-semibold">{hex.toUpperCase()}</span>
              </span>
            );
          })}
        </div>
        <div className="flex flex-col gap-1 border border-border rounded-lg p-1.5 min-w-0">
          <Row
            left={<span className="text-sm font-semibold font-sans text-foreground" title="Normalized RGB: each channel over 255, 0 to 1 - copied as CSS color(srgb …)">Normalized</span>}
            right={<CopyableResult text={normalizedValue} color={hexValue} />}
          />
          <hr className="border-border" />
          <span>{R}: {pad(rgb.r)}/255 = <span className="text-foreground font-semibold">{normalizedChannel(rgb.r)}</span></span>
          <span>{G}: {pad(rgb.g)}/255 = <span className="text-foreground font-semibold">{normalizedChannel(rgb.g)}</span></span>
          <span>{B_}: {pad(rgb.b)}/255 = <span className="text-foreground font-semibold">{normalizedChannel(rgb.b)}</span></span>
        </div>
      </div>
    </div>
  );
}

export default memo(EquationsPanel);
