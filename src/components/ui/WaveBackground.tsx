import React from "react";

export const WaveBackground: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className={
        "absolute inset-0 pointer-events-none overflow-hidden select-none " +
        "z-0 bg-gradient-to-br from-blue-50/70 via-background to-amber-50/50 " +
        "dark:from-transparent dark:via-transparent dark:to-transparent"
      }
    >
      {/* Lightweight tech dot matrix grid without maskImage */}
      <div
        className="absolute inset-0 opacity-25 dark:opacity-15"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--foreground) / 0.15) 1.2px, " +
            "transparent 1.2px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Static zero-cost ambient luminous glow - no blur-3xl GPU thrash */}
      <div
        aria-hidden="true"
        className={
          "absolute -top-12 left-1/2 -translate-x-1/2 w-[850px] " +
          "h-[320px] pointer-events-none"
        }
        style={{
          background:
            "radial-gradient(ellipse 50% 60% at 50% 0%, " +
            "hsl(var(--primary) / 0.18) 0%, transparent 75%)",
        }}
      />
      <div
        aria-hidden="true"
        className={
          "absolute -bottom-16 -right-16 w-[450px] h-[280px] " +
          "pointer-events-none hidden sm:block"
        }
        style={{
          background:
            "radial-gradient(circle at 80% 80%, " +
            "hsl(var(--accent) / 0.14) 0%, transparent 70%)",
        }}
      />

      {/* WAVE LAYER 1: Back Deep Wave (Always Active) */}
      <div
        className={
          "absolute bottom-0 left-0 w-full h-56 sm:h-72 overflow-hidden " +
          "pointer-events-none"
        }
      >
        <div className="flex w-[200%] h-full animate-wave-slow">
          <svg
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            className="w-1/2 h-full shrink-0"
          >
            <defs>
              <linearGradient id="wave1-grad-a" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.22"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.06"
                />
              </linearGradient>
            </defs>
            <path
              d={
                "M 0,100 C 150,170 450,30 600,100 C 750,170 1050,30 " +
                "1200,100 L 1200,200 L 0,200 Z"
              }
              fill="url(#wave1-grad-a)"
            />
          </svg>
          <svg
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            className="w-1/2 h-full shrink-0"
          >
            <defs>
              <linearGradient id="wave1-grad-b" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.22"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.06"
                />
              </linearGradient>
            </defs>
            <path
              d={
                "M 0,100 C 150,170 450,30 600,100 C 750,170 1050,30 " +
                "1200,100 L 1200,200 L 0,200 Z"
              }
              fill="url(#wave1-grad-b)"
            />
          </svg>
        </div>
      </div>

      {/* WAVE LAYER 2: Middle Accent Wave (Tablet & Desktop Only) */}
      <div
        className={
          "absolute bottom-0 left-0 w-full h-44 sm:h-60 overflow-hidden " +
          "pointer-events-none hidden sm:block"
        }
      >
        <div className="flex w-[200%] h-full animate-wave-medium">
          <svg
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            className="w-1/2 h-full shrink-0"
          >
            <defs>
              <linearGradient id="wave2-grad-a" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--accent))"
                  stopOpacity="0.26"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--accent))"
                  stopOpacity="0.08"
                />
              </linearGradient>
            </defs>
            <path
              d={
                "M 0,120 C 200,50 400,190 600,120 C 800,50 1000,190 " +
                "1200,120 L 1200,200 L 0,200 Z"
              }
              fill="url(#wave2-grad-a)"
            />
          </svg>
          <svg
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            className="w-1/2 h-full shrink-0"
          >
            <defs>
              <linearGradient id="wave2-grad-b" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--accent))"
                  stopOpacity="0.26"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--accent))"
                  stopOpacity="0.08"
                />
              </linearGradient>
            </defs>
            <path
              d={
                "M 0,120 C 200,50 400,190 600,120 C 800,50 1000,190 " +
                "1200,120 L 1200,200 L 0,200 Z"
              }
              fill="url(#wave2-grad-b)"
            />
          </svg>
        </div>
      </div>

      {/* WAVE LAYER 3: Foreground Crest Wave (Desktop Only) */}
      <div
        className={
          "absolute bottom-0 left-0 w-full h-36 sm:h-48 overflow-hidden " +
          "pointer-events-none hidden md:block"
        }
      >
        <div className="flex w-[200%] h-full animate-wave-fast">
          <svg
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            className="w-1/2 h-full shrink-0"
          >
            <defs>
              <linearGradient id="wave3-grad-a" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.32"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.12"
                />
              </linearGradient>
            </defs>
            <path
              d={
                "M 0,80 C 150,20 450,140 600,80 C 750,20 1050,140 " +
                "1200,80 L 1200,200 L 0,200 Z"
              }
              fill="url(#wave3-grad-a)"
            />
          </svg>
          <svg
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            className="w-1/2 h-full shrink-0"
          >
            <defs>
              <linearGradient id="wave3-grad-b" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.32"
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity="0.12"
                />
              </linearGradient>
            </defs>
            <path
              d={
                "M 0,80 C 150,20 450,140 600,80 C 750,20 1050,140 " +
                "1200,80 L 1200,200 L 0,200 Z"
              }
              fill="url(#wave3-grad-b)"
            />
          </svg>
        </div>
      </div>

      {/* Subtle baseline vignette */}
      <div
        className={
          "absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t " +
          "from-background/70 to-transparent"
        }
      />
    </div>
  );
};
