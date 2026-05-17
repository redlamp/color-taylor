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
            className="inline-flex items-center justify-center size-8 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer select-none"
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        }
      />
      <TooltipContent>{isDark ? 'Dark Mode' : 'Light Mode'}</TooltipContent>
    </Tooltip>
  );
}
