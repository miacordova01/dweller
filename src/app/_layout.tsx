import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useFonts } from "@expo-google-fonts/manrope";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { OnboardingProvider, useOnboarding } from "@/features/onboarding/OnboardingProvider";
import { colors, fontAssets, fonts } from "@/theme";

SplashScreen.preventAutoHideAsync();

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

function RootStack() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const { completed } = useOnboarding();

  const ready = (fontsLoaded || !!fontError) && completed !== null;

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerTitleStyle: { fontFamily: fonts.semibold, color: colors.ink },
        contentStyle: { backgroundColor: colors.white },
      }}
    >
      <Stack.Protected guard={!completed}>
        <Stack.Screen name="door" options={{ headerShown: false, animation: "none" }} />
        <Stack.Screen name="welcome" options={{ headerShown: false, animation: "fade", gestureEnabled: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={completed}>
        <Stack.Screen name="index" options={{ title: "Dweller", animation: "fade" }} />
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
