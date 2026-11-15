import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { LogBox } from "react-native";

import {
  OnboardingProvider,
  useOnboarding,
} from "@/features/onboarding/OnboardingProvider";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync();
LogBox.ignoreLogs(["ConvexError"]);

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

function RootStack() {
  const { completed, entered, role } = useOnboarding();

  const ready = completed !== null;

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return null;

  const landlord = role === "landlord";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Protected guard={!completed || !entered}>
        <Stack.Screen
          name="door"
          options={{
            animation: "none",
            contentStyle: { backgroundColor: colors.white },
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!completed}>
        <Stack.Screen
          name="welcome"
          options={{
            animation: "fade",
            gestureEnabled: false,
            contentStyle: { backgroundColor: colors.white },
          }}
        />
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!!completed && entered}>
        <Stack.Protected guard={!landlord}>
          <Stack.Screen name="index" options={{ animation: "fade" }} />
          <Stack.Screen name="saved" options={{ animation: "none" }} />
          <Stack.Screen name="activity" options={{ animation: "none" }} />
          <Stack.Screen name="home" options={{ animation: "none" }} />
        </Stack.Protected>
        <Stack.Protected guard={landlord}>
          <Stack.Screen
            name="landlord/overview"
            options={{ animation: "fade" }}
          />
          <Stack.Screen
            name="landlord/properties"
            options={{ animation: "none" }}
          />
          <Stack.Screen name="landlord/inbox" options={{ animation: "none" }} />
          <Stack.Screen
            name="landlord/activity"
            options={{ animation: "none" }}
          />
          <Stack.Screen name="landlord/approvals" />
        </Stack.Protected>
        <Stack.Screen name="profile" options={{ animation: "none" }} />
        <Stack.Screen name="payments" />
        <Stack.Screen name="payment-success" />
        <Stack.Screen name="listing/[id]" />
        <Stack.Screen name="assistant" />
        <Stack.Screen name="maintenance" />
        <Stack.Screen name="list-your-place" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <OnboardingProvider>
        <RootStack />
      </OnboardingProvider>
    </ConvexProvider>
  );
}
