import { Redirect, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { DoorMark } from "@/components/DoorMark";
import { colors, space, type, withAlpha } from "@/theme";

const SKIP_DELAY_MS = 600;
const EXPAND_DELAY_MS = 900;
const EXPAND_DURATION_MS = 1200;

function SkyScene({ size }: { size: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky }]}>
      <View
        style={{
          position: "absolute",
          width: size * 0.34,
          height: size * 0.34,
          borderRadius: size,
          left: size * 0.38,
          top: size * 0.16,
          backgroundColor: withAlpha(colors.white, 0.85),
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 1.4,
          height: size * 0.6,
          borderRadius: size,
          left: -size * 0.5,
          top: size * 0.7,
          backgroundColor: withAlpha(colors.white, 0.55),
        }}
      />
      <View
        style={{
          position: "absolute",
          width: size * 1.2,
          height: size * 0.6,
          borderRadius: size,
          left: size * 0.2,
          top: size * 0.78,
          backgroundColor: withAlpha(colors.lavender, 0.9),
        }}
      />
    </View>
  );
}

export default function DoorScreen() {
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const doorSize = Math.min(width * 0.5, 240);
  const coverScale = (Math.hypot(width, height) / doorSize) * 2.4;

  const [showSkip, setShowSkip] = useState(false);
  const playing = useRef(false);
  const left = useRef(false);

  const knob = useSharedValue(1);
  const hinge = useSharedValue(0);
  const reveal = useSharedValue(0);
  const expand = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), SKIP_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function goToWelcome() {
    if (left.current) return;
    left.current = true;
    router.replace("/welcome");
  }

  function open() {
    if (playing.current) return;
    playing.current = true;
    knob.set(
      withSequence(
        withTiming(0.7, { duration: 110 }),
        withSpring(1, { damping: 9, stiffness: 260 }),
      ),
    );
    reveal.set(withDelay(140, withTiming(1, { duration: 160 })));
    hinge.set(withDelay(150, withSpring(1, { duration: 800, dampingRatio: 0.72 })));
    expand.set(
      withDelay(
        EXPAND_DELAY_MS,
        withTiming(
          1,
          { duration: EXPAND_DURATION_MS, easing: Easing.bezier(0.65, 0, 0.35, 1) },
          (finished) => {
            if (finished) scheduleOnRN(goToWelcome);
          },
        ),
      ),
    );
  }

  const sceneStyle = useAnimatedStyle(() => ({
    opacity: reveal.get(),
    transform: [{ scale: interpolate(expand.get(), [0, 1], [1, coverScale]) }],
  }));

  const frameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expand.get(), [0, 0.55], [1, 0], "clamp"),
    transform: [{ scale: interpolate(expand.get(), [0, 1], [1, 4]) }],
  }));

  const washStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expand.get(), [0.45, 0.95], [0, 1], "clamp"),
  }));

  if (reduceMotion) return <Redirect href="/welcome" />;

  return (
    <Pressable
      testID="door"
      style={styles.screen}
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel="Open the door"
    >
      <View style={styles.center}>
        <DoorMark
          size={doorSize}
          hinge={hinge}
          knobScale={knob}
          scene={<SkyScene size={doorSize} />}
          sceneStyle={sceneStyle}
          frameStyle={frameStyle}
        />
      </View>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.sky }, washStyle]}
      />
      {showSkip && (
        <Animated.View
          entering={FadeIn.duration(250)}
          style={[styles.skip, { top: insets.top + space.sm }]}
        >
          <Pressable
            testID="door-skip"
            onPress={goToWelcome}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip intro"
          >
            <Text style={type.caption}>Skip</Text>
          </Pressable>
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  skip: { position: "absolute", right: space.xl, padding: space.sm },
});
