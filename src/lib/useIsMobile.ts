import { useEffect, useState } from "react";

const MOBILE_MEDIA_QUERY = "(max-width: 1023px)";

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const handler = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handler);

    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, []);

  return isMobile;
}
