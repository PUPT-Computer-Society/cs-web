import { useEffect, useState } from "react";

/**
 * Lightweight hook to preserve DOM presence during CSS exit animations.
 * Prevents abrupt unmounting so animate-out has time to gracefully finish.
 */
export function usePresence(isOpen: boolean, exitDurationMs = 150) {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, exitDurationMs);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendered, exitDurationMs]);

  return { isRendered, isClosing };
}
