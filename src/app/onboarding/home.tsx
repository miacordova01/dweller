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
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { Button } from "@/components/Button";
import { DoorScene } from "@/components/DoorScene";
import { useOnboarding } from "@/features/onboarding/OnboardingProvider";
import { colors, space, type } from "@/theme";

export default function WelcomeHomeScreen() {
  const { role, renter, landlord, complete } = useOnboarding();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const leaving = useRef(false);
  const doorSize = Math.round(height * 0.26);

  const knob = useSharedValue(1);
  const hinge = useSharedValue(0);
  const peek = useSharedValue(0);
  const expand = useSharedValue(0);

  useEffect(() => {
    if (!reduceMotion) hinge.set(withDelay(350, withSpring(1, { duration: 900, dampingRatio: 0.85 })));
  }, [hinge, reduceMotion]);

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
    peek.set(withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }));
    expand.set(
      withDelay(
        300,
        withTiming(1, { duration: 900, easing: Easing.bezier(0.65, 0, 0.35, 1) }, (finished) => {
          if (finished) scheduleOnRN(complete);
        }),
      ),
    );
  }

  const fadeStyle = useAnimatedStyle(() => ({ opacity: interpolate(expand.get(), [0, 0.4], [1, 0], "clamp") }));
  const whiteoutStyle = useAnimatedStyle(() => ({ opacity: interpolate(expand.get(), [0.6, 1], [0, 1], "clamp") }));

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + space.lg }]}>
      <View style={styles.middle}>
        <View style={styles.markSlot}>
          <DoorScene size={doorSize} hinge={hinge} peek={peek} knobScale={knob} expand={expand} />
        </View>
        <Animated.View style={fadeStyle}>
          <Animated.Text entering={FadeInUp.delay(150).duration(450)} style={[type.display, styles.center]}>
            Welcome home.
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(260).duration(450)} style={[type.bodyMuted, styles.center, styles.line]}>
            {line}
          </Animated.Text>
        </Animated.View>
      </View>
      <Animated.View entering={FadeInUp.delay(420).duration(420)} style={[styles.footer, fadeStyle]}>
        <Button testID="onboarding-finish" label="Take me home" onPress={finish} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.whiteout, whiteoutStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F1EEFD" },
  middle: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.md, paddingHorizontal: space.xl },
  markSlot: { zIndex: 1, marginBottom: space.xxl, alignItems: "center", justifyContent: "center" },
  center: { textAlign: "center" },
  line: { marginTop: space.sm },
  footer: { paddingHorizontal: space.xl },
  whiteout: { backgroundColor: colors.canvas },
});
