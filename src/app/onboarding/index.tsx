import { router } from "expo-router";

import { ChoiceCard, StepScaffold } from "@/features/onboarding/components";
import { useOnboarding, type Role } from "@/features/onboarding/OnboardingProvider";

export default function IntentScreen() {
  const { setRole } = useOnboarding();

  function choose(role: Role) {
    setRole(role);
    router.push("/onboarding/details");
  }

  return (
    <StepScaffold
      step={1}
      title="What brings you here?"
      subtitle="Pick one to start. You can add the other role later."
    >
      <ChoiceCard
        testID="role-renter"
        title="Find a home"
        description="Discover rentals, schedule tours, and manage your next move"
        symbol={{ ios: "house", android: "home", web: "home" }}
        onPress={() => choose("renter")}
      />
      <ChoiceCard
        testID="role-landlord"
        title="Manage my properties"
        description="List rentals, manage tenants, and automate everyday tasks"
        symbol={{ ios: "building.2", android: "apartment", web: "apartment" }}
        onPress={() => choose("landlord")}
      />
    </StepScaffold>
  );
}
