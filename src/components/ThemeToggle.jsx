import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <Button
      variant="outline"
      size="icon-sm"
      className="fixed top-4 right-4 z-50"
      onClick={() => setDark((d) => !d)}
      aria-label="Toggle theme"
    >
      {dark ? <Sun className="!size-4" /> : <Moon className="!size-4" />}
    </Button>
  );
}
