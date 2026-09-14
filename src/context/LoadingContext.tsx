import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { WifiOff } from "lucide-react";
import { LiquidSphereLoader } from "@/components/ui/LiquidSphereLoader";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { BASE_SERVER_URL } from "@/api/client";

const COLD_START_POLL_INTERVAL_MS = 2500;
const MAX_COLD_START_TIMEOUT_MS = 55000;
const PING_DEBOUNCE_MS = 380;
const PING_PER_REQUEST_TIMEOUT_MS = 4500;
const HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000;
const MIN_DISPLAY_DURATION_MS = 750;
const LIQUID_FILL_TRANSITION_MS = 500;
const SUCCESS_HOLD_MS = 550;
const ERROR_HOLD_MS = 1400;
const ORGANIC_MAX_PROGRESS = 90;
const ORGANIC_TICK_MS = 120;
const ORGANIC_STEP_FACTOR = 0.08;
const MIN_ORGANIC_STEP = 0.5;
const DEFAULT_INITIAL_PROGRESS = 20;

interface LoadingContextType {
  showLoader: (message?: string, initialProgress?: number) => void;
  updateProgress: (
    progress: number,
    message?: string,
    isError?: boolean,
  ) => void;
  hideLoader: (success?: boolean, completionMsg?: string) => Promise<void>;
  wakeBackend: () => Promise<boolean>;
  showConnectionError: () => void;
  isLoading: boolean;
  message: string;
  progress: number;
  isError: boolean;
}

const LoadingContext = createContext<LoadingContextType>({
  showLoader: () => {},
  updateProgress: () => {},
  hideLoader: async () => {},
  wakeBackend: async () => false,
  showConnectionError: () => {},
  isLoading: false,
  message: "INITIALIZING...",
  progress: 0,
  isError: false,
});

export const useGlobalLoader = () => useContext(LoadingContext);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("INITIALIZING...");
  const [progress, setProgress] = useState(0);
  const [isError, setIsError] = useState(false);
  const [isConnectionErrorOpen, setIsConnectionErrorOpen] = useState(false);

  const shownAtRef = useRef<number>(0);
  const progressRef = useRef(0);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const stopOrganicProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const startOrganicProgress = useCallback(
    (startFrom: number) => {
      stopOrganicProgress();
      setProgress(startFrom);

      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= ORGANIC_MAX_PROGRESS) {
            return prev;
          }
          const delta = (ORGANIC_MAX_PROGRESS - prev) * ORGANIC_STEP_FACTOR;
          const step = Math.max(MIN_ORGANIC_STEP, delta);
          return Math.min(ORGANIC_MAX_PROGRESS, prev + step);
        });
      }, ORGANIC_TICK_MS);
    },
    [stopOrganicProgress],
  );

  const showLoader = useCallback(
    (
      customMsg = "INITIALIZING...",
      initialProgress = DEFAULT_INITIAL_PROGRESS,
    ) => {
      shownAtRef.current = Date.now();
      setIsError(false);
      setMessage(customMsg);
      setIsLoading(true);
      startOrganicProgress(initialProgress);
    },
    [startOrganicProgress],
  );

  const updateProgress = useCallback(
    (newProgress: number, newMsg?: string, errorState = false) => {
      setProgress(newProgress);
      setIsError(errorState);
      if (newMsg) setMessage(newMsg);
    },
    [],
  );

  const hideLoader = useCallback(
    (success = true, completionMsg?: string): Promise<void> => {
      stopOrganicProgress();

      const elapsed = Date.now() - shownAtRef.current;
      const remainingMin = Math.max(0, MIN_DISPLAY_DURATION_MS - elapsed);

      if (success) {
        setProgress(100);
        if (completionMsg) setMessage(completionMsg);
      } else {
        setIsError(true);
        if (completionMsg) setMessage(completionMsg);
      }

      const holdDuration = success
        ? Math.max(LIQUID_FILL_TRANSITION_MS + SUCCESS_HOLD_MS, remainingMin)
        : Math.max(ERROR_HOLD_MS, remainingMin);

      return new Promise<void>((resolve) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
          setIsError(false);
          resolve();
        }, holdDuration);
      });
    },
    [stopOrganicProgress],
  );

  // Render cold-start wake poller & retry mechanism
  const wakeBackend = useCallback(async (): Promise<boolean> => {
    const startTime = Date.now();
    let hasShownLoader = false;

    const coldStartTimer = setTimeout(() => {
      hasShownLoader = true;
      showLoader("CONNECTING TO SERVER CORE...", DEFAULT_INITIAL_PROGRESS);
    }, PING_DEBOUNCE_MS);

    while (Date.now() - startTime < MAX_COLD_START_TIMEOUT_MS) {
      const elapsed = Date.now() - startTime;

      if (hasShownLoader) {
        let dynamicMsg = "CONNECTING TO BACKEND CLUSTER...";
        if (elapsed > 35000) {
          dynamicMsg = "ALMOST READY // FINALIZING SERVICE WAKEUP...";
        } else if (elapsed > 20000) {
          dynamicMsg = "SPINNING UP PYTHON RUNTIME & DATABASE...";
        } else if (elapsed > 8000) {
          dynamicMsg = "RENDER INSTANCE WAKING UP // COLD BOOT...";
        }
        updateProgress(progressRef.current, dynamicMsg);
      }

      try {
        const pingCtrl = new AbortController();
        const pingTimer = setTimeout(() => {
          pingCtrl.abort();
        }, PING_PER_REQUEST_TIMEOUT_MS);

        let res: Response | null = null;
        try {
          res = await fetch(`${BASE_SERVER_URL}/api/v1/healthz`, {
            signal: pingCtrl.signal,
          });
        } catch {
          res = await fetch(`${BASE_SERVER_URL}/healthz`, {
            signal: pingCtrl.signal,
          });
        } finally {
          clearTimeout(pingTimer);
        }

        if (res && res.ok) {
          clearTimeout(coldStartTimer);
          if (hasShownLoader) {
            await hideLoader(true, "SERVER ONLINE // READY");
          }
          return true;
        }
      } catch {
        // Render container is provisioning or 502 gateway; continue polling
      }

      await new Promise((resolve) => {
        setTimeout(resolve, COLD_START_POLL_INTERVAL_MS);
      });
    }

    clearTimeout(coldStartTimer);
    if (hasShownLoader) {
      await hideLoader(false, "SERVER WAKEUP TIMED OUT // TAP TO RETRY");
    }
    setIsConnectionErrorOpen(true);
    return false;
  }, [showLoader, hideLoader, updateProgress]);

  const showConnectionError = useCallback(() => {
    setIsConnectionErrorOpen(true);
  }, []);

  // Initial ping on site start or reload + anti-idle heartbeat
  useEffect(() => {
    wakeBackend();

    const heartbeatTimer = setInterval(() => {
      // Silent keepalive to prevent Render free instance 15-min idle sleep
      if (typeof document !== "undefined" && !document.hidden) {
        fetch(`${BASE_SERVER_URL}/healthz`).catch(() => {});
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Global listener for API network disconnects or 502/503 errors
    const handleOfflineEvent = () => {
      setIsConnectionErrorOpen(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("cs-server-offline", handleOfflineEvent);
    }

    return () => {
      clearInterval(heartbeatTimer);
      if (typeof window !== "undefined") {
        window.removeEventListener("cs-server-offline", handleOfflineEvent);
      }
      stopOrganicProgress();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [wakeBackend, stopOrganicProgress]);

  return (
    <LoadingContext.Provider
      value={{
        showLoader,
        updateProgress,
        hideLoader,
        wakeBackend,
        showConnectionError,
        isLoading,
        message,
        progress,
        isError,
      }}
    >
      {children}

      {/* Global Animated Full-Screen Overlay */}
      {isLoading && (
        <div
          className={
            "fixed inset-0 z-50 flex items-center justify-center " +
            "bg-background/85 backdrop-blur-md transition-opacity " +
            "duration-300 animate-in fade-in-0"
          }
          aria-live="assertive"
        >
          <LiquidSphereLoader
            progress={progress}
            message={message}
            isError={isError}
          />
        </div>
      )}

      {/* Server Offline / Connection Error Modal Dialog */}
      <Dialog
        open={isConnectionErrorOpen}
        onOpenChange={setIsConnectionErrorOpen}
        title="Server Connection Error"
        className="max-w-md"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={
                "w-10 h-10 rounded-full bg-destructive/10 " +
                "border border-destructive/20 flex items-center " +
                "justify-center text-destructive shrink-0"
              }
            >
              <WifiOff className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-foreground font-medium leading-relaxed">
                Your browser cannot connect to the server. Kindly check your
                network connection. If the issue persists, contact an
                administrator
              </p>
              <p className="text-[11px] text-muted-foreground font-mono">
                STATUS: UNREACHABLE
              </p>
            </div>
          </div>

          <div
            className={
              "flex justify-end gap-2 pt-3 border-t border-border mt-1"
            }
          >
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsConnectionErrorOpen(false)}
            >
              Dismiss
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setIsConnectionErrorOpen(false);
                wakeBackend();
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Retry Connection
            </Button>
          </div>
        </div>
      </Dialog>
    </LoadingContext.Provider>
  );
};
