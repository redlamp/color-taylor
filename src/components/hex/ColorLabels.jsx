import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useTheme } from '../../hooks/useTheme';
import { CENTER, RADIUS, PI } from './hexConstants';

const COLORS = [
  { label: 'R', name: 'Red', deg: 0, color: '#ff0000', lightColor: '#e00000' },
  { label: 'Y', name: 'Yellow', deg: 60, color: '#ffff00', lightColor: '#cca800' },
  { label: 'G', name: 'Green', deg: 120, color: '#00ff00', lightColor: '#00b300' },
  { label: 'C', name: 'Cyan', deg: 180, color: '#00ffff', lightColor: '#00a3a3' },
  { label: 'B', name: 'Blue', deg: 240, color: '#0000ff', lightColor: '#0000e0' },
  { label: 'M', name: 'Magenta', deg: 300, color: '#ff00ff', lightColor: '#d000d0' },
];

export default function ColorLabels({ onColorClick }) {
  const { isDark } = useTheme();

  return COLORS.map(({ label, name, deg, color, lightColor }) => {
    const displayColor = isDark ? color : lightColor;
    const rad = (deg * PI) / 180;
    const offset = RADIUS + 20;
    const x = CENTER + offset * Math.cos(rad);
    const y = CENTER - offset * Math.sin(rad);
    const textColor = (deg > 30 && deg < 200) ? '#000' : '#fff';
    return (
      <div
        key={label}
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: x, top: y }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="flex items-center justify-center w-8 h-6 text-xs font-bold select-none cursor-pointer rounded-full"
              style={{
                color: displayColor,
                backgroundColor: 'var(--background)',
              }}
              onClick={() => onColorClick(deg)}
            >
              {label}
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="text-xs font-semibold border-0"
            style={{
              '--tooltip-bg': displayColor,
              backgroundColor: displayColor,
              color: textColor,
            }}
          >
            {name}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  });
}
