import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="h-8 w-8 p-0"
      title="Toggle Dark Mode"
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5 text-foreground" />
      ) : (
        <Moon className="h-3.5 w-3.5 text-foreground" />
      )}
    </Button>
  );
};
