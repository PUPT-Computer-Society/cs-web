import { useEffect, useState } from "react";
import { lockScroll, unlockScroll } from "@/lib/scrollLock";

/**
 * Lightweight hook to preserve DOM presence during CSS exit animations.
 * Prevents abrupt unmounting so animate-out has time to gracefully finish.
 * Also manages ref-counted body scroll lock when backdrops are active.
 */
export function usePresence(
  isOpen: boolean,
  exitDurationMs = 150,
  lockScrollEnabled = true,
) {
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

  useEffect(() => {
    if (!lockScrollEnabled || !isRendered) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isRendered, lockScrollEnabled]);

  return { isRendered, isClosing };
}
