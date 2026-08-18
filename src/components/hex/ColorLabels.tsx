import { useEffect, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { CENTER_X, CENTER_Y, RADIUS, PI, SIZE, HEX_SIZE } from './hexConstants';

const COLORS = [
  { label: 'R', name: 'Red', deg: 0, color: '#ff0000', lightColor: '#e00000' },
  { label: 'Y', name: 'Yellow', deg: 60, color: '#ffff00', lightColor: '#cca800' },
  { label: 'G', name: 'Green', deg: 120, color: '#00ff00', lightColor: '#00b300' },
  { label: 'C', name: 'Cyan', deg: 180, color: '#00ffff', lightColor: '#00a3a3' },
  // Pure blue is the one letter that cannot carry itself on a dark panel -
  // 1.63:1 against Figma's default, where every other letter clears 3.4. HSB
  // 240/80/100 keeps it unmistakably blue while roughly doubling that. The
  // stems stay pure; this is the label only.
  { label: 'B', name: 'Blue', deg: 240, color: '#3333ff', lightColor: '#0000e0' },
  { label: 'M', name: 'Magenta', deg: 300, color: '#ff00ff', lightColor: '#d000d0' },
];

/**
 * Dark theme, from the class on <html> as well as the provider.
 *
 * useTheme's context default is isDark:false, and a host that renders this
 * without a ThemeProvider - the Figma plugin - therefore always got the
 * light-theme letters, on a dark panel. The class is what ThemeProvider itself
 * writes, and what the plugin mirrors from Figma, so it is the reliable signal.
 */
function useDarkClass(): boolean {
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const html = document.documentElement;
    const sync = () => setDark(html.classList.contains('dark'));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export default function ColorLabels({
  onColorClick,
  extent = SIZE,
}: {
  onColorClick: (deg: number) => void;
  /** Horizontal extent of the coordinate space; narrows when the BL bar is off. */
  extent?: number;
}) {
  const { isDark: providerDark } = useTheme();
  const classDark = useDarkClass();
  const isDark = providerDark || classDark;

  return COLORS.map(({ label, name, deg, color, lightColor }) => {
    const displayColor = isDark ? color : lightColor;
    const rad = (deg * PI) / 180;
    const offset = RADIUS + 20;
    const x = CENTER_X + offset * Math.cos(rad);
    const y = CENTER_Y - offset * Math.sin(rad);
    return (
      <div
        key={label}
        className="absolute -translate-x-1/2 -translate-y-1/2 z-[8]"
        style={{ left: `${(x / extent) * 100}%`, top: `${(y / HEX_SIZE) * 100}%` }}
      >
        {/* No tooltip: the letter is coloured as the thing it names, sits at
            that hue's vertex, and one of these is under the pointer most of the
            time you are working the wheel. The name survives as the accessible
            label, where "R" on its own said nothing. */}
        {/* text-sm, not text-xs: at 12px these read as annotation rather than
            as the labels for the six vertices the whole wheel is built on. The
            plugin is unaffected - figma.css flattens text-xs/sm/base to its own
            11px chrome size, so a semantic step here does not leak into the
            panel the way a text-[[Npx]] literal would. */}
        <button
          className="flex items-center justify-center w-8 h-6 text-sm font-bold select-none cursor-pointer rounded-full"
          style={{ color: displayColor }}
          aria-label={name}
          onClick={() => onColorClick(deg)}
        >
          {label}
        </button>
      </div>
    );
  });
}
