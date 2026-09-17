import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { queryClient, queryKeys } from "@/lib/queryClient";
import { API_BASE_URL } from "@/api/client";

export interface SSEMessagePayload {
  type: string;
  data: Record<string, any>;
  timestamp: number;
}

interface SSEContextType {
  isConnected: boolean;
  lastEvent: SSEMessagePayload | null;
}

const SSEContext = createContext<SSEContextType>({
  isConnected: false,
  lastEvent: null,
});

export const useSSE = () => useContext(SSEContext);

const RECONNECT_DELAY_MS = 3000;

export const SSEProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, isAuthenticated } = useAuth();
  const { info } = useToast();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<SSEMessagePayload | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let isMounted = true;

    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const sseUrl = `${API_BASE_URL}/events/stream`;
      const es = new EventSource(sseUrl, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isMounted) return;
        setIsConnected(true);
      };

      es.onerror = () => {
        if (!isMounted) return;
        setIsConnected(false);
        es.close();
        // Exponential/backoff reconnect
        if (!reconnectTimerRef.current) {
          reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            if (isMounted && isAuthenticated) {
              connectSSE();
            }
          }, RECONNECT_DELAY_MS);
        }
      };

      const handleChannelEvent = (
        channel: string,
        callback: (payload: SSEMessagePayload) => void,
      ) => {
        es.addEventListener(channel, (ev: MessageEvent) => {
          if (!isMounted) return;
          try {
            const parsed = JSON.parse(ev.data) as SSEMessagePayload;
            setLastEvent(parsed);
            callback(parsed);
          } catch {
            // Ignore malformed JSON chunks
          }
        });
      };

      // 1. Connection confirmation
      handleChannelEvent("connected", () => {
        setIsConnected(true);
      });

      // 2. Tasks live invalidation
      handleChannelEvent("tasks", () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      });

      // 3. GPOA live invalidation
      handleChannelEvent("gpoa", () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.gpoa });
      });

      // 4. Finance ledger live invalidation
      handleChannelEvent("finance", () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.finance });
        queryClient.invalidateQueries({
          queryKey: queryKeys.financeSummary,
        });
      });

      // 5. Inventory live invalidation
      handleChannelEvent("inventory", () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.inventory,
        });
      });

      // 6. Announcements live invalidation
      handleChannelEvent("announcements", () => {
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
      });

      // 7. Templates directory live invalidation
      handleChannelEvent("templates", () => {
        queryClient.invalidateQueries({ queryKey: ["templates"] });
      });

      // 8. Notifications live dispatch and toast
      handleChannelEvent("notifications", (payload) => {
        queryClient.invalidateQueries({
          queryKey: ["notifications"],
        });
        const title = payload.data.title || "New Notification";
        const message = payload.data.message || "";
        info(`${title}: ${message}`);
      });
    };

    connectSSE();

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      setIsConnected(false);
    };
  }, [token, isAuthenticated, info]);

  return (
    <SSEContext.Provider value={{ isConnected, lastEvent }}>
      {children}
    </SSEContext.Provider>
  );
};
