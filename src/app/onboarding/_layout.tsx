import { Stack } from "expo-router";

import { colors } from "@/theme";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.white } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" />
      <Stack.Screen name="home" options={{ animation: "fade", gestureEnabled: false }} />
    </Stack>
  );
}
