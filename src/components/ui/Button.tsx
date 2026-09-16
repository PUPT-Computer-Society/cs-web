import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-semibold ' +
      'transition-all focus-visible:outline-none focus-visible:ring-1 ' +
      'focus-visible:ring-ring disabled:pointer-events-none ' +
      'disabled:opacity-50 active:scale-[0.98] select-none cursor-pointer';

    const variants = {
      default:
        'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
      outline:
        'border border-border bg-background hover:bg-secondary ' +
        'hover:text-secondary-foreground text-foreground',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost:
        'hover:bg-secondary hover:text-secondary-foreground text-foreground',
      destructive:
        'bg-destructive/15 text-destructive border border-destructive/30 ' +
        'hover:bg-destructive/25',
    };

    const sizes = {
      sm:
        'min-h-[36px] sm:min-h-[32px] h-9 sm:h-8 px-2.5 sm:px-3 ' +
        'text-xs sm:text-[11px]',
      default:
        'min-h-[44px] sm:min-h-[36px] h-11 sm:h-9 px-4 py-2 text-sm sm:text-xs',
      lg:
        'min-h-[48px] sm:min-h-[40px] h-12 sm:h-10 px-6 text-base sm:text-sm',
      icon: 'min-h-[36px] min-w-[36px] h-9 w-9 p-0',
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
