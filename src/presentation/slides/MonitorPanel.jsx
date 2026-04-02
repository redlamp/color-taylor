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

// Mac CLUT8: exact 256-color palette from clut resource ID 8.
// Imported inline to avoid circular deps — same data as AnimatedGrid.
const MAC_CLUT8 = [
  '#FFFFFF','#FFFFCC','#FFFF99','#FFFF66','#FFFF33','#FFFF00','#FFCCFF','#FFCCCC',
  '#FFCC99','#FFCC66','#FFCC33','#FFCC00','#FF99FF','#FF99CC','#FF9999','#FF9966',
  '#FF9933','#FF9900','#FF66FF','#FF66CC','#FF6699','#FF6666','#FF6633','#FF6600',
  '#FF33FF','#FF33CC','#FF3399','#FF3366','#FF3333','#FF3300','#FF00FF','#FF00CC',
  '#FF0099','#FF0066','#FF0033','#FF0000','#CCFFFF','#CCFFCC','#CCFF99','#CCFF66',
  '#CCFF33','#CCFF00','#CCCCFF','#CCCCCC','#CCCC99','#CCCC66','#CCCC33','#CCCC00',
  '#CC99FF','#CC99CC','#CC9999','#CC9966','#CC9933','#CC9900','#CC66FF','#CC66CC',
  '#CC6699','#CC6666','#CC6633','#CC6600','#CC33FF','#CC33CC','#CC3399','#CC3366',
  '#CC3333','#CC3300','#CC00FF','#CC00CC','#CC0099','#CC0066','#CC0033','#CC0000',
  '#99FFFF','#99FFCC','#99FF99','#99FF66','#99FF33','#99FF00','#99CCFF','#99CCCC',
  '#99CC99','#99CC66','#99CC33','#99CC00','#9999FF','#9999CC','#999999','#999966',
  '#999933','#999900','#9966FF','#9966CC','#996699','#996666','#996633','#996600',
  '#9933FF','#9933CC','#993399','#993366','#993333','#993300','#9900FF','#9900CC',
  '#990099','#990066','#990033','#990000','#66FFFF','#66FFCC','#66FF99','#66FF66',
  '#66FF33','#66FF00','#66CCFF','#66CCCC','#66CC99','#66CC66','#66CC33','#66CC00',
  '#6699FF','#6699CC','#669999','#669966','#669933','#669900','#6666FF','#6666CC',
  '#666699','#666666','#666633','#666600','#6633FF','#6633CC','#663399','#663366',
  '#663333','#663300','#6600FF','#6600CC','#660099','#660066','#660033','#660000',
  '#33FFFF','#33FFCC','#33FF99','#33FF66','#33FF33','#33FF00','#33CCFF','#33CCCC',
  '#33CC99','#33CC66','#33CC33','#33CC00','#3399FF','#3399CC','#339999','#339966',
  '#339933','#339900','#3366FF','#3366CC','#336699','#336666','#336633','#336600',
  '#3333FF','#3333CC','#333399','#333366','#333333','#333300','#3300FF','#3300CC',
  '#330099','#330066','#330033','#330000','#00FFFF','#00FFCC','#00FF99','#00FF66',
  '#00FF33','#00FF00','#00CCFF','#00CCCC','#00CC99','#00CC66','#00CC33','#00CC00',
  '#0099FF','#0099CC','#009999','#009966','#009933','#009900','#0066FF','#0066CC',
  '#006699','#006666','#006633','#006600','#0033FF','#0033CC','#003399','#003366',
  '#003333','#003300','#0000FF','#0000CC','#000099','#000066','#000033','#EE0000',
  '#DD0000','#BB0000','#AA0000','#880000','#770000','#550000','#440000','#220000',
  '#110000','#00EE00','#00DD00','#00BB00','#00AA00','#008800','#007700','#005500',
  '#004400','#002200','#001100','#0000EE','#0000DD','#0000BB','#0000AA','#000088',
  '#000077','#000055','#000044','#000022','#000011','#EEEEEE','#DDDDDD','#BBBBBB',
  '#AAAAAA','#888888','#777777','#555555','#444444','#222222','#111111','#000000',
];

const GRID_256_REV = [...MAC_CLUT8].reverse();
const GRID_256 = [];
for (let r = 0; r < 8; r++) GRID_256.push(GRID_256_REV.slice(r * 32, (r + 1) * 32));

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

// Match the chex panel width (SIZE + 40 from hexConstants)
const PANEL_W = 726;
const PANEL_H = 320;

// Standalone wrapper (used by slideComponents registry)
export default function MonitorPanel({ mode }) {
  return (
    <div className="flex flex-col items-center">
      <div style={{ width: PANEL_W, height: PANEL_H, borderRadius: 6, overflow: 'hidden' }}>
        <MonitorPanelContent mode={mode} />
      </div>
    </div>
  );
}

// Grid content only — used by PresentationStage inside the persistent panel
export function MonitorPanelContent({ mode }) {
  if (mode === 'bw') return <BWLayout />;
  if (mode === 'c16') return <SixteenLayout />;
  if (mode === 'c256') return <Grid256Layout />;
  if (mode === 'thousands') return <ThousandsLayout />;
  return null;
}

export { PANEL_W, PANEL_H };

function BWLayout() {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div style={{ flex: 1, background: '#000' }} />
      <div style={{ flex: 1, background: '#fff' }} />
    </div>
  );
}

function SixteenLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {MAC_16.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', flex: 1 }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {GRID_256.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', flex: 1 }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {THOUSANDS_ROWS.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', flex: 1 }}>
          {row.map((color, ci) => (
            <div key={ci} style={{ flex: 1, background: color }} />
          ))}
        </div>
      ))}
    </div>
  );
}
