import { useEffect, useRef } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { Button } from "@/components/Button";
import { DoorMark } from "@/components/DoorMark";
import { useOnboarding } from "@/features/onboarding/OnboardingProvider";
import { colors, radius, space, type } from "@/theme";

const MARK_SIZE = 96;

export default function WelcomeHomeScreen() {
  const { role, renter, landlord, complete } = useOnboarding();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const leaving = useRef(false);

  const hinge = useSharedValue(0);
  const doorway = useSharedValue(0);

  useEffect(() => {
    hinge.set(withDelay(350, withSpring(0.55, { duration: 900, dampingRatio: 0.8 })));
  }, [hinge]);

  const location = (role === "renter" ? renter.location : landlord.location).trim();
  const line =
    role === "landlord"
      ? `Let's get your ${landlord.propertyCount === "1" ? "property" : "properties"}${location ? ` in ${location}` : ""} set up.`
      : `Let's find your place${location ? ` in ${location}` : ""}.`;

  function finish() {
    if (leaving.current) return;
    leaving.current = true;
    if (reduceMotion) {
      complete();
      return;
    }
    hinge.set(withSpring(1, { duration: 500, dampingRatio: 0.9 }));
    doorway.set(
      withTiming(1, { duration: 650, easing: Easing.bezier(0.65, 0, 0.35, 1) }, (finished) => {
        if (finished) scheduleOnRN(complete);
      }),
    );
  }

  const coverScale = (Math.hypot(width, height) / MARK_SIZE) * 2.2;
  const doorwayStyle = useAnimatedStyle(() => ({
    opacity: doorway.get() === 0 ? 0 : 1,
    transform: [{ scaleX: 0.15 + doorway.get() * coverScale }, { scaleY: 1 + doorway.get() * coverScale }],
  }));

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + space.lg }]}>
      <View style={styles.middle}>
        <View style={styles.markSlot}>
          <Animated.View pointerEvents="none" style={[styles.doorway, doorwayStyle]} />
          <DoorMark
            size={MARK_SIZE}
            hinge={hinge}
            scene={<View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky }]} />}
          />
        </View>
        <Animated.Text entering={FadeInUp.delay(150).duration(450)} style={[type.display, styles.center]}>
          Welcome home.
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(260).duration(450)} style={[type.bodyMuted, styles.center]}>
          {line}
        </Animated.Text>
      </View>
      <Animated.View entering={FadeInUp.delay(420).duration(420)} style={styles.footer}>
        <Button testID="onboarding-finish" label="Take me home" onPress={finish} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  middle: { zIndex: 1, flex: 1, alignItems: "center", justifyContent: "center", gap: space.md, paddingHorizontal: space.xl },
  markSlot: { zIndex: 1, marginBottom: space.xl, alignItems: "center", justifyContent: "center" },
  doorway: {
    position: "absolute",
    width: MARK_SIZE * 0.7,
    height: MARK_SIZE,
    borderRadius: radius.lg,
    backgroundColor: colors.sky,
  },
  center: { textAlign: "center" },
  footer: { paddingHorizontal: space.xl },
});
