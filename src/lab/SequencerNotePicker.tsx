/**
 * The drawn note pickers, one per mode - notes -> colour through the inverse
 * mappings in sequencer.ts, so a click lands on the centre of its note.
 *
 *   Hue Melody       a hue ring cut into one segment per note of the range
 *   Hue Chords       the circle of fifths, 12 slices, each its hue
 *   RGB Instruments  three ladders, one rung per note of that channel, rest at the foot
 *
 * Fills are the colours the notes are; ink (labels, the ring round the current
 * note) is the theme's foreground, so both themes read.
 */
import { hexToRgb, hsbToRgb, rgbToHex, rgbToHsb } from '../utils/colorConversions';
import { midiToName } from '../utils/synthConfig';
import {
  CHANNELS, NOTE_NAMES, MINOR_SATURATION, channelChoices, channelNoteToHex, channelNotes, chordRootToHex,
  instrumentName, melodyChoices, melodyNoteToHex, noteIndices,
  type Channel, type MapConfig,
} from './sequencer';

const CHANNEL_INK: Record<Channel, string> = { r: '#e74c4c', g: '#2fa84f', b: '#3385ff' };

const hsbHex = (h: number, s: number, b: number) => {
  const c = hsbToRgb(h, s, b);
  return rgbToHex(c.r, c.g, c.b);
};

/** An annular sector from angle a0 to a1 (degrees, 0 at 12 o'clock, clockwise). */
function sector(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const pt = (r: number, a: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(rad)).toFixed(2)} ${(cy + r * Math.sin(rad)).toFixed(2)}`;
  };
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${pt(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${pt(r1, a1)} L ${pt(r0, a1)} A ${r0} ${r0} 0 ${large} 0 ${pt(r0, a0)} Z`;
}
function polar(cx: number, cy: number, r: number, a: number) {
  const rad = ((a - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

interface RingSlice { key: string; label: string; fill: string; current: boolean; onPick: () => void }

/**
 * The ring both hue pickers draw. Labels sit outside the ring in the
 * foreground colour; past 16 of them they alternate between two radii so a
 * three-octave chromatic range still reads at 16px.
 */
function HueRing({ slices, centreFill, centreLabel, ariaLabel }: {
  slices: RingSlice[]; centreFill: string | null; centreLabel: string; ariaLabel: string;
}) {
  const n = slices.length;
  const size = 340;
  const c = size / 2;
  const r0 = 62;
  const r1 = 104;
  const stagger = n > 16;
  const step = 360 / n;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full select-none" role="group" aria-label={ariaLabel} data-picker="ring">
      {slices.map((s, i) => {
        const a0 = i * step;
        const a1 = (i + 1) * step;
        const lr = stagger ? (i % 2 === 0 ? 122 : 146) : 126;
        const p = polar(c, c, lr, a0 + step / 2);
        return (
          <g key={s.key} role="button" aria-label={s.label} aria-pressed={s.current} data-note={s.label}
            className="cursor-pointer" onClick={s.onPick}>
            <path d={sector(c, c, r0, r1, a0, a1)} fill={s.fill} className="stroke-background" strokeWidth={1.5} />
            <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={16}
              className={s.current ? 'fill-foreground font-semibold' : 'fill-muted-foreground'}>
              {s.label}
            </text>
          </g>
        );
      })}
      {/* The current note, drawn last so its ring sits over both neighbours. */}
      {slices.map((s, i) => s.current && (
        <path key={`ring-${s.key}`} d={sector(c, c, r0 - 3, r1 + 3, i * step, (i + 1) * step)} fill="none"
          className="pointer-events-none stroke-foreground" strokeWidth={3} strokeLinejoin="round" />
      ))}
      <circle cx={c} cy={c} r={r0 - 12} fill={centreFill ?? 'transparent'} className="stroke-border" strokeWidth={1.5}
        strokeDasharray={centreFill ? undefined : '4 4'} />
      <text x={c} y={c} textAnchor="middle" dominantBaseline="central" fontSize={20} className="fill-foreground font-semibold"
        paintOrder="stroke" stroke="var(--background)" strokeWidth={4}>
        {centreLabel}
      </text>
    </svg>
  );
}

/** A usable S and B for the fills: the cell's own, lifted where a hue would vanish. */
function fillSB(hex: string, minS: number): { s: number; b: number } {
  const rgb = hexToRgb(hex) ?? { r: 255, g: 0, b: 0 };
  const { s, b } = rgbToHsb(rgb.r, rgb.g, rgb.b);
  return { s: Math.max(minS, s), b: Math.max(40, b) };
}

/**
 * `hex` is the cell's colour (the start point for a pick when the slot is
 * empty, too), `sounding` whether the cell plays at all. `onPick` gets the new
 * hex - the host keeps alpha.
 */
export default function SequencerNotePicker({ hex, sounding, cfg, onPick }: {
  hex: string; sounding: boolean; cfg: MapConfig; onPick: (hex: string) => void;
}) {
  const idx = sounding ? noteIndices(hex, cfg) : noteIndices('#000000', cfg).map(() => -1);

  if (cfg.mode === 'melody') {
    const choices = melodyChoices(cfg);
    const { s, b } = fillSB(hex, 40);
    const cur = idx[0];
    return (
      <HueRing
        ariaLabel="Note"
        centreFill={sounding ? hex : null}
        centreLabel={cur >= 0 ? midiToName(choices[cur]) : 'rest'}
        slices={choices.map((m, i) => ({
          key: String(m),
          label: midiToName(m),
          fill: hsbHex(((i + 0.5) / choices.length) * 360, s, b),
          current: i === cur,
          onPick: () => onPick(melodyNoteToHex(hex, m, cfg)),
        }))}
      />
    );
  }

  if (cfg.mode === 'chords') {
    const { s, b } = fillSB(hex, 15);
    const minor = s < MINOR_SATURATION;
    const cur = idx[0];
    return (
      <HueRing
        ariaLabel="Chord root"
        centreFill={sounding ? hex : null}
        centreLabel={cur >= 0 ? `${NOTE_NAMES[(cfg.root + 7 * cur) % 12]}${minor ? 'm' : ''}` : 'rest'}
        slices={Array.from({ length: 12 }, (_, i) => {
          const pc = (cfg.root + 7 * i) % 12;
          return {
            key: String(i),
            label: `${NOTE_NAMES[pc]}${minor ? 'm' : ''}`,
            fill: hsbHex(i * 30 + 15, s, b),
            current: i === cur,
            onPick: () => onPick(chordRootToHex(hex, pc, cfg)),
          };
        })}
      />
    );
  }

  return <RgbLadders hex={hex} sounding={sounding} cfg={cfg} onPick={onPick} />;
}

/** Three ladders, R G B. Rung fill is the channel alone at that note's value. */
function RgbLadders({ hex, sounding, cfg, onPick }: {
  hex: string; sounding: boolean; cfg: MapConfig; onPick: (hex: string) => void;
}) {
  const notes = sounding ? channelNotes(hex, cfg) : { r: null, g: null, b: null };
  const colW = 112;
  const height = 360;
  const top = 30;
  return (
    <svg viewBox={`0 0 ${colW * 3} ${height + top + 4}`} className="w-full select-none" data-picker="ladders">
      {CHANNELS.map((ch, k) => {
        const choices = channelChoices(ch, cfg);
        const rungs = choices.length + 1; // + rest at the foot
        const rungH = height / rungs;
        // Label every rung that has room for 16px text; always the current and rest.
        const every = Math.max(1, Math.ceil(18 / rungH));
        const x0 = k * colW + 4;
        const barW = 44;
        const current = notes[ch];
        const name = instrumentName(ch, cfg);
        // Top to bottom: the highest note first, rest at the foot.
        const rows: { midi: number | null; index: number }[] = [
          ...choices.map((m, i) => ({ midi: m as number | null, index: i })).reverse(),
          { midi: null, index: -1 },
        ];
        return (
          <g key={ch} role="group" aria-label={`${name} note`} data-ladder={ch}>
            <text x={x0} y={18} fontSize={16} fontWeight={600} fill={CHANNEL_INK[ch]}>{name}</text>
            {rows.map((r, i) => {
              const y = top + i * rungH;
              const isCur = r.midi === current;
              const rgb = { r: 0, g: 0, b: 0 };
              if (r.midi !== null) rgb[ch] = hexToRgb(channelNoteToHex('#000000', ch, r.midi, cfg))?.[ch] ?? 0;
              const label = r.midi === null ? 'rest' : midiToName(r.midi);
              const showLabel = isCur || r.midi === null || r.index % every === 0;
              return (
                <g key={label} role="button" aria-label={`${name} ${label}`} aria-pressed={isCur}
                  data-rung={label} className="cursor-pointer" onClick={() => onPick(channelNoteToHex(hex, ch, r.midi, cfg))}>
                  {/* Hit area across the whole row, label included. */}
                  <rect x={x0} y={y} width={colW - 8} height={rungH} fill="transparent" />
                  <rect x={x0 + 1} y={y + 1} width={barW} height={Math.max(2, rungH - 2)} rx={3}
                    fill={r.midi === null ? 'transparent' : rgbToHex(rgb.r, rgb.g, rgb.b)}
                    className="stroke-border" strokeWidth={1} strokeDasharray={r.midi === null ? '3 3' : undefined} />
                  {isCur && (
                    <rect x={x0 - 1} y={y - 1} width={barW + 4} height={rungH + 2} rx={4} fill="none"
                      className="stroke-foreground" strokeWidth={2.5} />
                  )}
                  {showLabel && (
                    <text x={x0 + barW + 8} y={y + rungH / 2} dominantBaseline="central" fontSize={16}
                      className={isCur ? 'fill-foreground font-semibold' : 'fill-muted-foreground'}>
                      {label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
