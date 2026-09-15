import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

type VisualizerMode = "donut" | "matrix" | "cube";

const DEFAULT_ANIMATION_SPEED = 0.2;
const VISUALIZER_STORAGE_KEY = "cs_visualizer_mode";
const VALID_MODES: readonly VisualizerMode[] = ["donut", "matrix", "cube"];

const getInitialMode = (): VisualizerMode => {
  if (typeof window === "undefined") return "donut";
  try {
    const saved = localStorage.getItem(VISUALIZER_STORAGE_KEY);
    if (saved && VALID_MODES.includes(saved as VisualizerMode)) {
      return saved as VisualizerMode;
    }
  } catch {
    // Return fallback if localStorage is restricted
  }
  return "donut";
};

export const CyberVisualizer: React.FC = () => {
  const [mode, setMode] = useState<VisualizerMode>(getInitialMode);
  const [isRunning, setIsRunning] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fpsRef = useRef<HTMLSpanElement | null>(null);
  const [speed, setSpeed] = useState<number>(DEFAULT_ANIMATION_SPEED);
  const speedRef = useRef<number>(DEFAULT_ANIMATION_SPEED);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);

  // Sync speedRef whenever speed state changes
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Pause when offscreen or tab hidden to prevent mobile/laptop lag
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setIsVisible(false);
      } else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        setIsVisible(inView);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Pre-allocated typed buffers to prevent 60fps GC nursery pressure
  const animStateRef = useRef({
    A: 0,
    B: 0,
    cubeRotX: 0,
    cubeRotY: 0,
    cubeRotZ: 0,
    matrixDrops: [] as number[],
    lastFrameTime: performance.now(),
    frameCount: 0,
    bBuffer: new Array(46 * 22).fill(" "),
    zBuffer: new Float32Array(46 * 22),
  });

  // Mode Switcher Handler
  const toggleMode = (newMode: VisualizerMode) => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setMode(newMode);
    try {
      localStorage.setItem(VISUALIZER_STORAGE_KEY, newMode);
    } catch {
      // Ignore if localStorage quota is exceeded
    }
  };

  useEffect(() => {
    let animId: number;
    const isMobile =
      typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        Boolean(
          navigator.hardwareConcurrency &&
            navigator.hardwareConcurrency <= 4,
        ));

    // Throttled frame interval: 20 FPS mobile, 30 FPS desktop
    const targetFps = isMobile ? 20 : 30;
    const frameInterval = 1000 / targetFps;
    let lastRenderTime = 0;

    // Initialize Matrix drops
    const numCols = 36;
    animStateRef.current.matrixDrops = Array.from({ length: numCols }, () =>
      Math.floor(Math.random() * -30),
    );

    const render = (time: number) => {
      if (!isRunning || !isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      const elapsed = time - lastRenderTime;
      if (elapsed < frameInterval) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastRenderTime = time - (elapsed % frameInterval);

      animStateRef.current.frameCount++;
      if (time - animStateRef.current.lastFrameTime >= 1000) {
        if (fpsRef.current) {
          fpsRef.current.textContent =
            `FPS: ${animStateRef.current.frameCount}`;
        }
        animStateRef.current.frameCount = 0;
        animStateRef.current.lastFrameTime = time;
      }

      if (mode === "donut") {
        renderDonut(isMobile);
      } else if (mode === "cube") {
        renderCube(isMobile);
      } else if (mode === "matrix") {
        renderMatrix();
      }

      animId = requestAnimationFrame(render);
    };

    // 1. LEGENDARY ANDY SLOANE DONUT.C ALGORITHM
    const renderDonut = (isLowPower: boolean) => {
      const state = animStateRef.current;
      const spd = speedRef.current;
      state.A += 0.04 * spd;
      state.B += 0.02 * spd;

      const screenWidth = 46;
      const screenHeight = 22;
      const b = state.bBuffer;
      const z = state.zBuffer;

      b.fill(" ");
      z.fill(0);

      const cosA = Math.cos(state.A);
      const sinA = Math.sin(state.A);
      const cosB = Math.cos(state.B);
      const sinB = Math.sin(state.B);

      const jStep = isLowPower ? 0.12 : 0.08;
      const iStep = isLowPower ? 0.055 : 0.035;

      // Theta: circle angle, Phi: torus revolution angle
      for (let j = 0; j < 6.28; j += jStep) {
        const cosJ = Math.cos(j);
        const sinJ = Math.sin(j);

        for (let i = 0; i < 6.28; i += iStep) {
          const sinI = Math.sin(i);
          const cosI = Math.cos(i);

          const h = cosJ + 2; // R1 + R2 * cos(theta)
          // 1 / z (perspective)
          const D = 1 / (sinI * h * sinA + sinJ * cosA + 5);
          const t = sinI * h * cosA - sinJ * sinA;

          const x = Math.floor(
            screenWidth / 2 + 24 * D * (cosI * h * cosB - t * sinB),
          );
          const y = Math.floor(
            screenHeight / 2 + 12 * D * (cosI * h * sinB + t * cosB),
          );

          const o = x + screenWidth * y;
          const N = Math.floor(
            8 *
              ((sinJ * sinA - sinI * cosJ * cosA) * cosB -
                sinI * cosJ * sinA -
                sinJ * cosA -
                cosI * cosJ * sinB),
          );

          if (
            y >= 0 &&
            y < screenHeight &&
            x >= 0 &&
            x < screenWidth &&
            D > (z[o] || 0)
          ) {
            z[o] = D;
            const luminanceChars = ".,-~:;=!*#$@";
            b[o] = luminanceChars[N > 0 ? N : 0];
          }
        }
      }

      if (preRef.current) {
        let asciiStr = "";
        for (let k = 0; k < screenWidth * screenHeight; k++) {
          asciiStr +=
            k % screenWidth === screenWidth - 1 ? b[k] + "\n" : b[k];
        }
        preRef.current.textContent = asciiStr;
      }
    };

    // 2. 3D VECTOR WIREFRAME ROTATING CUBE
    const renderCube = (isLowPower: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const state = animStateRef.current;
      const spd = speedRef.current;
      state.cubeRotX += 0.015 * spd;
      state.cubeRotY += 0.02 * spd;
      state.cubeRotZ += 0.01 * spd;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // 8 Vertices of a cube
      const size = 52;
      const vertices = [
        [-size, -size, -size],
        [size, -size, -size],
        [size, size, -size],
        [-size, size, -size],
        [-size, -size, size],
        [size, -size, size],
        [size, size, size],
        [-size, size, size],
      ];

      // 12 Edges connecting vertices
      const edges = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0], // back face
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4], // front face
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7], // connecting struts
      ];

      // 3D Matrix Rotation & Projection
      const projected: [number, number, number][] = [];
      const cx = Math.cos(state.cubeRotX),
        sx = Math.sin(state.cubeRotX);
      const cy = Math.cos(state.cubeRotY),
        sy = Math.sin(state.cubeRotY);
      const cz = Math.cos(state.cubeRotZ),
        sz = Math.sin(state.cubeRotZ);

      for (const [x, y, z] of vertices) {
        // Rotate Y
        const x1 = x * cy + z * sy;
        const y1 = y;
        const z1 = -x * sy + z * cy;

        // Rotate X
        const x2 = x1;
        const y2 = y1 * cx - z1 * sx;
        const z2 = y1 * sx + z1 * cx;

        // Rotate Z
        const x3 = x2 * cz - y2 * sz;
        const y3 = x2 * sz + y2 * cz;
        const z3 = z2;

        // Perspective Projection
        const distance = 240;
        const scale = distance / (distance + z3);
        const px = w / 2 + x3 * scale;
        const py = h / 2 + y3 * scale;

        projected.push([px, py, z3]);
      }

      // Draw Glowing Edges (Skip shadowBlur on low-power)
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = "rgba(59, 130, 246, 0.85)"; // Neon Blue
      if (!isLowPower) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(59, 130, 246, 0.5)";
      } else {
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      }

      for (const [start, end] of edges) {
        ctx.beginPath();
        ctx.moveTo(projected[start][0], projected[start][1]);
        ctx.lineTo(projected[end][0], projected[end][1]);
        ctx.stroke();
      }

      // Draw Inner Cross Wireframe (Tesseract Accent)
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "rgba(236, 72, 153, 0.4)"; // Accent Pink Glow
      ctx.beginPath();
      ctx.moveTo(projected[0][0], projected[0][1]);
      ctx.lineTo(projected[6][0], projected[6][1]);
      ctx.moveTo(projected[1][0], projected[1][1]);
      ctx.lineTo(projected[7][0], projected[7][1]);
      ctx.stroke();

      // Draw Vertices Nodes
      if (!isLowPower) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(99, 102, 241, 0.9)";
      } else {
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      }
      for (const [px, py] of projected) {
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // 3. DIGITAL MATRIX CODE RAIN (100% Transparent Background)
    const renderMatrix = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const spd = speedRef.current;

      // 1. Reset shadow blur to ensure no glow leaks into composite operations
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      // 2. FADE EXISTING PIXELS TO TRANSPARENT
      // destination-out multiplies existing alpha by (1 - fadeAlpha) each frame
      const fadeAlpha = Math.min(0.35, Math.max(0.08, 0.16 * Math.sqrt(spd)));
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha.toFixed(2)})`;
      ctx.fillRect(0, 0, w, h);

      // 3. Return to standard drawing mode
      ctx.globalCompositeOperation = "source-over";

      ctx.font = "bold 11px monospace";
      const characters = "01ABCDEFCS2026{}[]<>/\\*+=~!@#$%^&|:;λπθΩαβγ";
      const colWidth = 14;

      const isDark = document.documentElement.classList.contains("dark");
      const headColor = isDark ? "#ffffff" : "#065f46";
      const trailColor = isDark ? "#10b981" : "#059669";
      const glowColor = isDark ? "#34d399" : "#10b981";

      animStateRef.current.matrixDrops.forEach((y, i) => {
        const char = characters[Math.floor(Math.random() * characters.length)];
        const x = i * colWidth;

        // Head of drop is bright white/emerald with glow
        if (Math.random() > 0.88) {
          ctx.fillStyle = headColor;
          ctx.shadowBlur = 6;
          ctx.shadowColor = glowColor;
        } else {
          ctx.fillStyle = trailColor;
          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
        }

        ctx.fillText(char, x, y * 13);

        if (y * 13 > h && Math.random() > 0.975) {
          animStateRef.current.matrixDrops[i] = 0;
        } else {
          animStateRef.current.matrixDrops[i] = y + Math.max(0.1, spd);
        }
      });

      // Explicitly reset shadow after loop so canvas state never leaks
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [mode, isRunning, isVisible]);

  return (
    <div
      ref={containerRef}
      className={
        "flex flex-col h-full min-h-[313px] rounded-xl border " +
        "border-border/80 bg-card shadow-xs overflow-hidden " +
        "transition-[border-color] duration-150 hover:border-primary/50"
      }
    >
      {/* Terminal Header Bar */}
      <div
        className={
          "flex items-center justify-between px-3.5 py-2 border-b " +
          "border-border bg-secondary/50 select-none"
        }
      >
        <div className="flex items-center gap-2">
          {/* Linux/Mac Terminal Window Controls */}
          <div className="flex items-center gap-1.5">
            <span
              className={
                "w-2.5 h-2.5 rounded-full bg-rose-500/80 shadow-xs " +
                "inline-block hover:bg-rose-700/80 hover:cursor-pointer " +
                "transition-colors duration-300"
              }
            />
            <span
              className={
                "w-2.5 h-2.5 rounded-full bg-amber-500/80 shadow-xs " +
                "inline-block hover:bg-amber-700/80 hover:cursor-pointer " +
                "transition-colors duration-300"
              }
            />
            <span
              className={
                "w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-xs " +
                "inline-block hover:bg-emerald-700/80 hover:cursor-pointer " +
                "transition-colors duration-300"
              }
            />
          </div>
          <span
            className={
              "text-[11px] font-mono font-bold text-foreground/90 ml-1.5 " +
              "flex items-center gap-1"
            }
          >
            <Terminal className="w-3 h-3 text-primary" />
            <span>cs_terminal</span>
          </span>
        </div>

        {/* Interactive Mode Switcher Pills */}
        <div className="flex items-center gap-1">
          {(
            [
              { id: "donut", label: "Donut.c" },
              { id: "matrix", label: "Matrix" },
              { id: "cube", label: "3D Cube" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleMode(item.id)}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-mono transition-all",
                mode === item.id
                  ? "bg-primary text-primary-foreground font-semibold " +
                      "shadow-xs"
                  : "text-muted-foreground hover:text-foreground " +
                      "hover:bg-secondary",
              )}
            >
              {item.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={
              "p-1 rounded text-muted-foreground hover:text-foreground " +
              "hover:bg-secondary ml-1"
            }
            title={isRunning ? "Pause Rendering" : "Resume Rendering"}
          >
            {isRunning ? (
              <Pause className="w-3 h-3" />
            ) : (
              <Play className="w-3 h-3 text-emerald-500" />
            )}
          </button>
        </div>
      </div>

      {/* Visualizer Display Body */}
      <div
        className={
          "relative flex-1 flex items-center justify-center p-3 " +
          "bg-black min-h-[220px] overflow-hidden select-none"
        }
      >
        {/* Subtle decorative grid background */}
        <div
          aria-hidden="true"
          className={
            "absolute inset-0 bg-[linear-gradient(to_right," +
            "rgba(120,120,120,0.08)_1px,transparent_1px)," +
            "linear-gradient(to_bottom,rgba(120,120,120,0.08)_1px," +
            "transparent_1px)] bg-[size:14px_14px] pointer-events-none"
          }
        />
        {mode === "donut" ? (
          <pre
            ref={preRef}
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, " +
                "'Liberation Mono', 'Courier New', monospace",
              letterSpacing: "0px",
            }}
            className={
              "text-[10px] leading-[10px] text-emerald-600 " +
              "dark:text-emerald-400 font-normal text-center " +
              "drop-shadow-[0_0_8px_rgba(16,185,129,0.35)] select-none " +
              "pointer-events-none whitespace-pre"
            }
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={450}
            height={200}
            className="w-full h-full max-h-[210px] object-contain rounded-md"
          />
        )}
      </div>

      {/* Cyber Telemetry Footer */}
      <div
        className={
          "px-3.5 py-1.5 border-t border-border bg-secondary/30 " +
          "flex items-center justify-between gap-2 text-[10px] " +
          "font-mono text-muted-foreground select-none"
        }
      >
        <div className="flex items-center gap-2">
          <span
            className={
              "inline-flex items-center gap-1 text-emerald-600 " +
              "dark:text-emerald-400 font-semibold"
            }
          >
            <span
              className={
                "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
              }
            />
            ONLINE
          </span>
        </div>

        {/* Speed Slider Control */}
        <div className="flex items-center gap-1.5">
          <span
            className={
              "text-[10px] text-muted-foreground font-semibold " +
              "tracking-tight whitespace-nowrap"
            }
          >
            SPD {speed.toFixed(1)}x
          </span>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            value={speed}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setSpeed(val);
              speedRef.current = val;
            }}
            className={
              "w-14 sm:w-20 h-1 bg-border/80 rounded-lg appearance-none " +
              "cursor-pointer accent-primary focus:outline-none"
            }
            title={`Speed: ${speed.toFixed(1)}x`}
          />
        </div>

        <div className="flex items-center gap-2">
          <span ref={fpsRef}>FPS: 60</span>
        </div>
      </div>
    </div>
  );
};
