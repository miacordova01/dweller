import { Redirect, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
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
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";

import { DoorScene } from "@/components/DoorScene";
import { Wordmark } from "@/components/Wordmark";
import { useOnboarding } from "@/features/onboarding/OnboardingProvider";
import { colors, space, type } from "@/theme";

const SKIP_DELAY_MS = 600;
const PEEK_DELAY_MS = 950;
const EXPAND_DELAY_MS = 1350;
const EXPAND_DURATION_MS = 1100;

function Backdrop({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="backdrop" cx="50%" cy="42%" rx="75%" ry="60%">
          <Stop offset="0" stopColor="#F8F6FF" />
          <Stop offset="1" stopColor="#ECE8FB" />
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#backdrop)" />
    </Svg>
  );
}

export default function DoorScreen() {
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const doorSize = Math.round(height * 0.31);
  const bloomSize = Math.hypot(width, height);

  const { completed, enter } = useOnboarding();
  const [showSkip, setShowSkip] = useState(false);
  const playing = useRef(false);
  const left = useRef(false);

  const knob = useSharedValue(1);
  const hinge = useSharedValue(0);
  const peek = useSharedValue(0);
  const expand = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion && completed) enter();
  }, [reduceMotion, completed, enter]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), SKIP_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function goToWelcome() {
    if (left.current) return;
    left.current = true;
    if (completed) enter();
    else router.replace("/welcome");
  }

  function open() {
    if (playing.current) return;
    playing.current = true;
    knob.set(
      withSequence(
        withTiming(0.75, { duration: 110 }),
        withSpring(1, { damping: 9, stiffness: 260 }),
      ),
    );
    hinge.set(
      withDelay(150, withSpring(1, { duration: 800, dampingRatio: 0.85 })),
    );
    peek.set(
      withDelay(
        PEEK_DELAY_MS,
        withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) }),
      ),
    );
    expand.set(
      withDelay(
        EXPAND_DELAY_MS,
        withTiming(
          1,
          {
            duration: EXPAND_DURATION_MS,
            easing: Easing.bezier(0.65, 0, 0.35, 1),
          },
          (finished) => {
            if (finished) scheduleOnRN(goToWelcome);
          },
        ),
      ),
    );
  }

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expand.get(), [0.05, 0.45], [1, 0], "clamp"),
    transform: [
      { translateY: interpolate(expand.get(), [0, 0.45], [0, 16], "clamp") },
    ],
  }));
  const bloomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expand.get(), [0.35, 0.75], [0, 1], "clamp"),
    transform: [
      { scale: interpolate(expand.get(), [0.35, 1], [0.35, 2.2], "clamp") },
    ],
  }));
  const whiteoutStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expand.get(), [0.7, 1], [0, 1], "clamp"),
  }));

  if (reduceMotion) return completed ? null : <Redirect href="/welcome" />;

  return (
    <View style={styles.screen}>
      <Backdrop width={width} height={height} />
      <Pressable
        testID="door"
        style={styles.center}
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel="Open the door"
      >
        <DoorScene
          size={doorSize}
          hinge={hinge}
          peek={peek}
          knobScale={knob}
          expand={expand}
        />
        <Animated.View style={[{ marginTop: doorSize * 0.24 }, wordmarkStyle]}>
          <Wordmark fontSize={Math.round(width * 0.135)} />
        </Animated.View>
      </Pressable>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.abs,
          {
            width: bloomSize,
            height: bloomSize,
            left: (width - bloomSize) / 2,
            top: (height - bloomSize) / 2,
          },
          bloomStyle,
        ]}
      >
        <Svg width={bloomSize} height={bloomSize}>
          <Defs>
            <RadialGradient id="bloom" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor={colors.glow} stopOpacity={1} />
              <Stop offset="0.45" stopColor={colors.glow} stopOpacity={0.45} />
              <Stop offset="1" stopColor={colors.glow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={bloomSize} height={bloomSize} fill="url(#bloom)" />
        </Svg>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.white },
          whiteoutStyle,
        ]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F1EEFD" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: space.xl,
  },
  abs: { position: "absolute" },
  skip: { position: "absolute", right: space.xl, padding: space.sm },
});
