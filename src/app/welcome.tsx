import { Image } from "expo-image";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { Button } from "@/components/Button";
import { Wordmark } from "@/components/Wordmark";
import { colors, radius, space, type } from "@/theme";

const SHEET_OVERLAP = 28;

const rise = (index: number) => FadeInUp.delay(420 + index * 60).duration(420);

function ProviderButton({ label, children }: { label: string; children: ReactNode }) {
  const pressed = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 - pressed.get() * 0.04 }] }));
  return (
    <Animated.View style={[styles.providerSlot, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Coming soon"
        onPressIn={() => pressed.set(withTiming(1, { duration: 90 }))}
        onPressOut={() => pressed.set(withTiming(0, { duration: 160 }))}
        style={({ pressed: isPressed }) => [styles.provider, isPressed && styles.providerPressed]}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

function PhotoArc({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={styles.arc} pointerEvents="none">
      <Path
        d={`M0 0 H${width} V0 C${width * 0.42} 0 0 ${height * 0.3} 0 ${height} Z`}
        fill={colors.white}
      />
    </Svg>
  );
}

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <View style={styles.screen}>
      <View style={{ paddingTop: insets.top + space.lg }}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.wordmark}>
          <Wordmark fontSize={40} />
        </Animated.View>

        <View style={styles.headline}>
          <Animated.Text entering={FadeInUp.delay(140).duration(450)} style={styles.display}>
            Find home.
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(230).duration(450)} style={styles.display}>
            Feel at home.
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(320).duration(450)} style={[type.bodyMuted, styles.support]}>
            Your next place, and everything after.
          </Animated.Text>
        </View>
      </View>

      <Animated.View entering={FadeIn.delay(260).duration(600)} style={styles.photo}>
        <Image
          source={require("@/assets/images/welcome-victorians.jpg")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="top"
          transition={0}
          accessible={false}
        />
        <PhotoArc width={width} height={width * 0.32} />
      </Animated.View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
        <Animated.View entering={rise(0)}>
          <Button testID="get-started" label="Get started" onPress={() => router.push("/onboarding")} />
        </Animated.View>
        <Animated.View entering={rise(1)}>
          <Button
            testID="have-account"
            label="I already have an account"
            variant="secondary"
            accessibilityHint="Sign in is coming soon"
          />
        </Animated.View>
        <Animated.View entering={rise(2)} style={styles.providers}>
          <ProviderButton label="Continue with Apple">
            <Image source={require("@/assets/images/apple-logo.png")} style={styles.appleMark} />
          </ProviderButton>
          <ProviderButton label="Continue with Google">
            <Image source={require("@/assets/images/google-logo.png")} style={styles.googleMark} />
          </ProviderButton>
          <ProviderButton label="Continue with email">
            <SymbolView name={{ ios: "envelope", android: "mail", web: "mail" }} size={22} tintColor={colors.ink} />
          </ProviderButton>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  wordmark: { alignItems: "center" },
  headline: { paddingHorizontal: space.xl, marginTop: space.xxl },
  display: { ...type.display, fontSize: 40, lineHeight: 44, letterSpacing: 40 * -0.02 },
  support: { marginTop: space.md, fontSize: 18, lineHeight: 26 },
  photo: { flex: 1, marginTop: space.lg, marginBottom: -SHEET_OVERLAP, overflow: "hidden" },
  arc: { position: "absolute", top: -1, left: 0 },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg + 4,
    borderTopRightRadius: radius.lg + 4,
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    gap: space.md,
  },
  providers: { flexDirection: "row", gap: space.md },
  providerSlot: { flex: 1 },
  provider: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  providerPressed: { backgroundColor: colors.lavender },
  appleMark: { width: 18, height: 22 },
  googleMark: { width: 22, height: 22 },
});
