import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export interface TourStep {
  id: string;
  target: string;
  title: string;
  description: string;
}

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "dashboard-hero",
    target: '[data-tour="dashboard-hero"]',
    title: "Executive Central Command",
    description:
      "Your high-level command console. Track active term dates, " +
      "governance status, and central council directives.",
  },
  {
    id: "dashboard-gpoa",
    target: '[data-tour="dashboard-gpoa"]',
    title: "Council GPOA Operations",
    description:
      "Direct access to your General Plan of Activities. Coordinate " +
      "deadlines, venues, and semester deliverables.",
  },
  {
    id: "dashboard-tasks",
    target: '[data-tour="dashboard-tasks"]',
    title: "Action Items & Kanban Board",
    description:
      "Manage council task boards, delegate deliverables, and track " +
      "real-time completion states across committees.",
  },
  {
    id: "dashboard-drive",
    target: '[data-tour="dashboard-drive"]',
    title: "Google Drive Cloud Vault",
    description:
      "Store and sync official documents. Automated folder provisioning " +
      "and SOP naming for council resolutions and receipts.",
  },
  {
    id: "header-user",
    target: '[data-tour="header-user"]',
    title: "Officer Capsule & Preferences",
    description:
      "Manage your avatar, access RBAC controls, switch dark mode, or " +
      "relaunch this product tour at any time.",
  },
];

interface TourContextType {
  isTourOpen: boolean;
  currentStepIndex: number;
  currentStep: TourStep;
  totalSteps: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
}

const TourContext = createContext<TourContextType>({
  isTourOpen: false,
  currentStepIndex: 0,
  currentStep: TOUR_STEPS[0],
  totalSteps: TOUR_STEPS.length,
  startTour: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTour: () => {},
});

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const getStorageKey = useCallback(() => {
    return `cs_tour_completed_${user?.id || "guest"}`;
  }, [user?.id]);

  // Auto-launch tour on first-ever dashboard visit after login
  useEffect(() => {
    if (!isAuthenticated || !user || location.pathname !== "/dashboard") {
      return;
    }

    try {
      const isCompleted = localStorage.getItem(getStorageKey());
      if (!isCompleted) {
        const timer = setTimeout(() => {
          setCurrentStepIndex(0);
          setIsTourOpen(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage access restricted; suppress
    }
  }, [isAuthenticated, user, location.pathname, getStorageKey]);

  const startTour = useCallback(() => {
    setCurrentStepIndex(0);
    setIsTourOpen(true);
  }, []);

  const skipTour = useCallback(() => {
    setIsTourOpen(false);
    try {
      localStorage.setItem(getStorageKey(), "true");
    } catch {
      // Ignore
    }
  }, [getStorageKey]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      skipTour();
    }
  }, [currentStepIndex, skipTour]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  return (
    <TourContext.Provider
      value={{
        isTourOpen,
        currentStepIndex,
        currentStep: TOUR_STEPS[currentStepIndex],
        totalSteps: TOUR_STEPS.length,
        startTour,
        nextStep,
        prevStep,
        skipTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => useContext(TourContext);
