import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, use, useEffect, useState, type ReactNode } from "react";

const COMPLETED_KEY = "dweller.onboarding.completed";

export type Role = "renter" | "landlord";

export type RenterAnswers = {
  location: string;
  budget: string | null;
  moveIn: string | null;
  space: string | null;
  amenities: string[];
};

export type LandlordAnswers = {
  propertyCount: string | null;
  location: string;
  occupied: string | null;
  listVacancies: string | null;
};

type OnboardingState = {
  completed: boolean | null;
  role: Role | null;
  renter: RenterAnswers;
  landlord: LandlordAnswers;
  setRole: (role: Role) => void;
  updateRenter: (patch: Partial<RenterAnswers>) => void;
  updateLandlord: (patch: Partial<LandlordAnswers>) => void;
  complete: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [renter, setRenter] = useState<RenterAnswers>({
    location: "",
    budget: null,
    moveIn: null,
    space: null,
    amenities: [],
  });
  const [landlord, setLandlord] = useState<LandlordAnswers>({
    propertyCount: null,
    location: "",
    occupied: null,
    listVacancies: null,
  });

  useEffect(() => {
    AsyncStorage.getItem(COMPLETED_KEY)
      .then((value) => setCompleted(value === "true"))
      .catch(() => setCompleted(false));
  }, []);

  async function complete() {
    try {
      await AsyncStorage.setItem(COMPLETED_KEY, "true");
    } finally {
      setCompleted(true);
    }
  }

  return (
    <OnboardingContext
      value={{
        completed,
        role,
        renter,
        landlord,
        setRole,
        updateRenter: (patch) => setRenter((prev) => ({ ...prev, ...patch })),
        updateLandlord: (patch) => setLandlord((prev) => ({ ...prev, ...patch })),
        complete,
      }}
    >
      {children}
    </OnboardingContext>
  );
}

export function useOnboarding() {
  const value = use(OnboardingContext);
  if (!value) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return value;
}
