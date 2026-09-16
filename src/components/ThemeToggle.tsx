import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            className="ctl-quiet-icon"
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        }
      />
      <TooltipContent>{isDark ? 'Dark Mode' : 'Light Mode'}</TooltipContent>
    </Tooltip>
  );
}
