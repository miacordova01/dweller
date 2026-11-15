import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, use, useEffect, useState, type ReactNode } from "react";

const COMPLETED_KEY = "dweller.onboarding.completed";
const PROFILE_KEY = "dweller.profile";

export type Role = "renter" | "landlord";

export type RenterAnswers = {
  location: string;
  budget: string | null;
  moveIn: string | null;
  space: string | null;
  bedrooms: string | null;
  amenities: string[];
};

export type LandlordAnswers = {
  propertyCount: string | null;
  location: string;
  occupied: string | null;
  listVacancies: string | null;
};

type Profile = {
  role: Role | null;
  renter: RenterAnswers;
  landlord: LandlordAnswers;
};

type OnboardingState = Profile & {
  completed: boolean | null;
  setRole: (role: Role) => void;
  updateRenter: (patch: Partial<RenterAnswers>) => void;
  updateLandlord: (patch: Partial<LandlordAnswers>) => void;
  complete: () => Promise<void>;
  startOver: () => Promise<void>;
};

const emptyProfile: Profile = {
  role: null,
  renter: { location: "", budget: null, moveIn: null, space: null, bedrooms: null, amenities: [] },
  landlord: { propertyCount: null, location: "", occupied: null, listVacancies: null },
};

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<Profile>(emptyProfile);

  useEffect(() => {
    AsyncStorage.multiGet([COMPLETED_KEY, PROFILE_KEY])
      .then(([[, done], [, saved]]) => {
        if (saved) {
          const stored = JSON.parse(saved) as Partial<Profile>;
          setProfile({
            ...emptyProfile,
            ...stored,
            renter: { ...emptyProfile.renter, ...stored.renter },
            landlord: { ...emptyProfile.landlord, ...stored.landlord },
          });
        }
        setCompleted(done === "true");
      })
      .catch(() => setCompleted(false));
  }, []);

  function update(next: (prev: Profile) => Profile) {
    setProfile((prev) => {
      const value = next(prev);
      AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(value)).catch(() => {});
      return value;
    });
  }

  async function complete() {
    try {
      await AsyncStorage.setItem(COMPLETED_KEY, "true");
    } finally {
      setCompleted(true);
    }
  }

  async function startOver() {
    try {
      await AsyncStorage.multiRemove([COMPLETED_KEY, PROFILE_KEY]);
    } finally {
      setProfile(emptyProfile);
      setCompleted(false);
    }
  }

  return (
    <OnboardingContext
      value={{
        completed,
        ...profile,
        setRole: (role) => update((prev) => ({ ...prev, role })),
        updateRenter: (patch) => update((prev) => ({ ...prev, renter: { ...prev.renter, ...patch } })),
        updateLandlord: (patch) => update((prev) => ({ ...prev, landlord: { ...prev.landlord, ...patch } })),
        complete,
        startOver,
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
