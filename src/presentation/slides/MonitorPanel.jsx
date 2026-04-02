import { hsbToRgb, rgbToHex } from '../../utils/colorConversions';

// --- Palette data matching the Mac Monitors screenshots ---

// B&W: left half black, right half white
// 16: Mac System 7 CLUT4 — 2 rows of 8, black top-left, green bottom-right
const MAC_16 = [
  // Row 1: Black, Dark Gray, Gray, Light Gray, Tan, Brown, Dark Green, Green
  ['#000000', '#404040', '#808080', '#C0C0C0', '#90713A', '#562C05', '#006412', '#1FB714'],
  // Row 2: Cyan, Blue, Purple, Magenta, Red, Orange, Yellow, White
  ['#02ABEA', '#0000D4', '#4600A5', '#F20884', '#DD0907', '#FF6403', '#FBF305', '#FFFFFF'],
];

// 256: Mac CLUT8 — 6x6x6 RGB cube (R desc, G desc, B desc) + 40 grays
// Arranged as 8 rows of 32, tiles wider than tall
function generate256Grid() {
  const hex = (r, g, b) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  const colors = [];
  const steps = [0xFF, 0xCC, 0x99, 0x66, 0x33, 0x00];
  // 6x6x6 cube: 216 entries
  for (const r of steps) {
    for (const g of steps) {
      for (const b of steps) {
        colors.push(hex(r, g, b));
      }
    }
  }
  // 40 grays (bright to dark, filling indices 216-255)
  for (let i = 0; i < 40; i++) {
    const v = Math.round(255 - (i / 39) * 255);
    colors.push(hex(v, v, v));
  }
  // Arrange as 8 rows of 32
  const grid = [];
  for (let r = 0; r < 8; r++) {
    grid.push(colors.slice(r * 32, (r + 1) * 32));
  }
  return grid;
}

const GRID_256 = generate256Grid();

// Thousands: 4 gradient rows — R, G, B channels + grayscale
// Each row: 64 steps from black to full channel brightness
function generateThousandsRows(count = 64) {
  const rows = [];
  // Red
  rows.push(Array.from({ length: count }, (_, i) => {
    const v = Math.round((i / (count - 1)) * 255);
    return rgbToHex(v, 0, 0);
  }));
  // Green
  rows.push(Array.from({ length: count }, (_, i) => {
    const v = Math.round((i / (count - 1)) * 255);
    return rgbToHex(0, v, 0);
  }));
  // Blue
  rows.push(Array.from({ length: count }, (_, i) => {
    const v = Math.round((i / (count - 1)) * 255);
    return rgbToHex(0, 0, v);
  }));
  // Grayscale
  rows.push(Array.from({ length: count }, (_, i) => {
    const v = Math.round((i / (count - 1)) * 255);
    return rgbToHex(v, v, v);
  }));
  return rows;
}

const THOUSANDS_ROWS = generateThousandsRows(64);

// --- Components ---

export default function MonitorPanel({ mode }) {
  return (
    <div className="flex flex-col items-center w-full max-w-[700px] mx-auto">
      {mode === 'bw' && <BWLayout />}
      {mode === 'c16' && <SixteenLayout />}
      {mode === 'c256' && <Grid256Layout />}
      {mode === 'thousands' && <ThousandsLayout />}
    </div>
  );
}

function BWLayout() {
  return (
    <div className="w-full" style={{ display: 'flex', height: 320, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ flex: 1, background: '#000' }} />
      <div style={{ flex: 1, background: '#fff' }} />
    </div>
  );
}

function SixteenLayout() {
  return (
    <div className="w-full" style={{ borderRadius: 6, overflow: 'hidden' }}>
      {MAC_16.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', height: 160 }}>
          {row.map((color, ci) => (
            <div key={ci} style={{ flex: 1, background: color }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Grid256Layout() {
  return (
    <div className="w-full" style={{ borderRadius: 6, overflow: 'hidden' }}>
      {GRID_256.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', height: 40 }}>
          {row.map((color, ci) => (
            <div key={ci} style={{ flex: 1, background: color }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ThousandsLayout() {
  return (
    <div className="w-full flex flex-col gap-1" style={{ borderRadius: 6, overflow: 'hidden' }}>
      {THOUSANDS_ROWS.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', height: 72 }}>
          {row.map((color, ci) => (
            <div key={ci} style={{ flex: 1, background: color }} />
          ))}
        </div>
      ))}
    </div>
  );
}
