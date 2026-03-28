import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon-sm"
      className="fixed top-4 right-4 z-50"
      onClick={toggle}
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="!size-4" /> : <Moon className="!size-4" />}
    </Button>
  );
}
