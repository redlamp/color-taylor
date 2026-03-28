import { rgbToHex } from '../utils/colorConversions';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTheme } from '../hooks/useTheme';

export default function EquationsPanel({ rgb, hue, saturation, brightness, hsl, blMode }) {
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
  const chColor = (key) => key === 'r' ? rc : key === 'g' ? gc : bc;

  const pad = (v) => String(v).padStart(3, '\u2007');
  const textOnColor = (cssColor) => {
    const m = cssColor.match(/(\d+)/g);
    if (m && m.length >= 3) {
      const [r, g, b] = m.map(Number);
      return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#000' : '#fff';
    }
    // hex
    const hex = cssColor.replace('#', '');
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#000' : '#fff';
    }
    return '#fff';
  };

  const T = ({ color, title, bold, children }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span style={{ color }} className={`cursor-default ${bold ? 'font-bold' : ''}`}>{children}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs font-semibold border-0" style={{ '--tooltip-bg': color, backgroundColor: color, color: textOnColor(color) }}>
        {title}
      </TooltipContent>
    </Tooltip>
  );
  const R = <T color={rc} title="Red channel">R</T>;
  const G = <T color={gc} title="Green channel">G</T>;
  const B_ = <T color={bc} title="Blue channel">B</T>;
  const rv = <T color={rc} title={`Red = ${rgb.r}`}>{pad(rgb.r)}</T>;
  const gv = <T color={gc} title={`Green = ${rgb.g}`}>{pad(rgb.g)}</T>;
  const bv = <T color={bc} title={`Blue = ${rgb.b}`}>{pad(rgb.b)}</T>;
  const maxChLabel = maxChKey === 'r' ? R : maxChKey === 'g' ? G : B_;
  const chr = <T color={oc} title={`Chroma = ${delta}`}>chroma</T>;
  const H = <span className="text-foreground">H</span>;
  const S = <span className="text-foreground">S</span>;
  const Bv = <span className="text-foreground">B</span>;
  const Lv = <span className="text-foreground">L</span>;
  const maxT = (v) => <T color={mc} title={`Max = ${maxVal}`} bold>{v}</T>;
  const minT = (v) => <T color={cc} title={`Min = ${minVal}`} bold>{v}</T>;
  const chrT = (v) => <T color={oc} title={`Chroma = ${delta}`}>{v}</T>;
  const mcGradStyle = { background: `linear-gradient(105deg, ${mc}, ${oc})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' };
  const mcVal = Math.round((1 - Math.abs(2 * l / 255 - 1)) * 255);
  const MCT = ({ children, title }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <span style={mcGradStyle} className="font-bold cursor-default">{children}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs font-semibold border-0" style={{ '--tooltip-bg': mc, background: `linear-gradient(105deg, ${mc}, ${oc})`, color: '#000' }}>
        {title}
      </TooltipContent>
    </Tooltip>
  );

  const ulStyle = { textDecorationColor: 'white', textUnderlineOffset: '2px', textDecorationThickness: '2px' };

  const maxMinList = (isMaxMode) => ['r', 'g', 'b'].map((k, i) => {
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

  const Row = ({ left, right }) => (
    <div className="flex justify-between items-baseline">
      <span>{left}</span>
      <span className="text-foreground font-semibold">{right}</span>
    </div>
  );

  return (
    <div className="grid gap-4 w-full text-sm font-mono text-muted-foreground" style={{ gridTemplateColumns: '1fr 1.35fr 1fr 0.8fr' }}>
      <div className="flex flex-col gap-1 border border-input rounded-lg p-2.5">
        <span className="text-sm font-semibold font-sans text-foreground">Variables</span>
        <hr className="border-input" />
        <span><span
          className="rounded px-1.5 py-0.5"
          style={{
            backgroundColor: rgbToHex(rgb.r, rgb.g, rgb.b),
            color: (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) > 150 ? '#000' : '#fff',
          }}
        >Color</span> = rgb({rv}, {gv}, {bv})</span>
        <span><T color={mc} title="Maximum RGB value">max</T> = max({maxMinList(true)})</span>
        <span><T color={cc} title="Minimum RGB value">min</T> = min({maxMinList(false)})</span>
        <span>{chr} = {maxT(pad(maxVal))} - {minT(pad(minVal))} = {chrT(pad(delta))}</span>
      </div>
      <div className="flex flex-col gap-1 border border-input rounded-lg p-2.5">
        <Row
          left={<span className="text-sm font-semibold font-sans text-foreground">Hue</span>}
          right={`${hue}°`}
        />
        <hr className="border-input" />
        <span className="text-sm font-sans text-muted-foreground">Based on max RGB channel</span>
        <span className={maxChKey === 'r' ? '' : 'opacity-30'}>{R}: {H} = 60(({gv}-{bv})/{chrT(pad(delta))} mod 6){maxChKey === 'r' && <> = <span className="text-foreground font-semibold">{hue}°</span></>}</span>
        <span className={maxChKey === 'g' ? '' : 'opacity-30'}>{G}: {H} = 60(({bv}-{rv})/{chrT(pad(delta))} + 2){maxChKey === 'g' && <> = <span className="text-foreground font-semibold">{hue}°</span></>}</span>
        <span className={maxChKey === 'b' ? '' : 'opacity-30'}>{B_}: {H} = 60(({rv}-{gv})/{chrT(pad(delta))} + 4){maxChKey === 'b' && <> = <span className="text-foreground font-semibold">{hue}°</span></>}</span>
      </div>
      <div className="flex flex-col gap-1 border border-input rounded-lg p-2.5">
        <Row
          left={<span className="text-sm font-semibold font-sans text-foreground">Saturation</span>}
          right={blMode === 'brightness' ? `${saturation}%` : `${hsl?.s ?? 0}%`}
        />
        <hr className="border-input" />
        {blMode === 'brightness' ? (
          <span>{S} = {chrT(pad(delta))} / {maxT(pad(maxVal))} = <span className="text-foreground font-semibold">{saturation}%</span></span>
        ) : (
          <>
            <span>{Lv} = ({maxT(pad(maxVal))} + {minT(pad(minVal))}) / 2 = <span className="text-foreground font-semibold">{pad(Math.round(l))}</span></span>
            <span><MCT title="Max Chroma">MC</MCT> = 1-|2·<span className="text-foreground font-bold">{pad(Math.round(l))}</span>/255-1| = <MCT title={`Max Chroma = ${mcVal}`}>{pad(mcVal)}</MCT></span>
            <span>{S} = {chrT(pad(delta))} / <MCT title={`Max Chroma = ${mcVal}`}>{pad(mcVal)}</MCT> = <span className="text-foreground font-semibold">{hsl?.s ?? 0}%</span></span>
          </>
        )}
      </div>
      <div className="flex flex-col gap-1 border border-input rounded-lg p-2.5">
        {blMode === 'brightness' ? (
          <>
            <Row
              left={<span className="text-sm font-semibold font-sans text-foreground">Brightness</span>}
              right={`${brightness}%`}
            />
            <hr className="border-input" />
            <span>{Bv} = {maxT(pad(maxVal))} / 255 = <span className="text-foreground font-semibold">{brightness}%</span></span>
          </>
        ) : (
          <>
            <Row
              left={<span className="text-sm font-semibold font-sans text-foreground">Lightness</span>}
              right={`${hsl?.l ?? 0}%`}
            />
            <hr className="border-input" />
            <span>{Lv} = <span className="text-foreground font-bold">{pad(Math.round(l))}</span> / 255 = <span className="text-foreground font-semibold">{hsl?.l ?? 0}%</span></span>
          </>
        )}
      </div>
    </div>
  );
}
