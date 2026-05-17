import { useState, useRef, useEffect } from 'react';
import { Volume, Volume1, Volume2, VolumeOff } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface Props {
  muted: boolean;
  onToggleMute: () => void;
  masterGain: number;
  onMasterGainChange: (v: number) => void;
}

export function VolumeControl({ muted, onToggleMute, masterGain, onMasterGainChange }: Props) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => () => { if (closeTimer.current !== null) clearTimeout(closeTimer.current); }, []);

  const onEnter = () => {
    if (closeTimer.current !== null) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    setOpen(true);
  };
  const onLeave = () => {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  const Icon = muted || masterGain <= 0.01
    ? VolumeOff
    : masterGain < 0.66
      ? Volume
      : masterGain < 1.33
        ? Volume1
        : Volume2;

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className="inline-flex items-center justify-center size-8 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer select-none"
              onClick={onToggleMute}
              aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
              aria-expanded={open}
            >
              <Icon className="size-4" />
            </button>
          }
        />
        <TooltipContent>{muted ? 'Muted' : `Volume: ${Math.round(masterGain * 100)}%`}</TooltipContent>
      </Tooltip>
      {open && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-background border border-input rounded-md shadow-lg px-3 py-2 flex flex-col items-center gap-1.5"
          style={{ minWidth: 64 }}
        >
          <div className="h-44 w-6 flex items-center justify-center">
            <Slider
              orientation="vertical"
              value={[masterGain]}
              min={0}
              max={2}
              step={0.05}
              onValueChange={(v) => {
                const next = Array.isArray(v) ? v[0] : v;
                if (typeof next === 'number') onMasterGainChange(next);
              }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {Math.round(masterGain * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
