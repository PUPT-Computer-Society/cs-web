import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

    const variants = {
      default:
        'bg-primary text-primary-foreground shadow hover:bg-primary/90',
      outline:
        'border border-border bg-background hover:bg-secondary hover:text-secondary-foreground',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-secondary hover:text-secondary-foreground',
      destructive:
        'bg-red-950/20 text-red-600 dark:text-red-400 border border-red-900/30 hover:bg-red-950/40',
    };

    const sizes = {
      sm: 'h-8 px-3 text-[11px]',
      default: 'h-9 px-4 py-2',
      lg: 'h-10 px-6 text-sm',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
