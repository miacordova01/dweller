import { Image } from "expo-image";
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
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, Ellipse, RadialGradient, Rect, Stop } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";

import { DoorMark } from "@/components/DoorMark";
import { Wordmark } from "@/components/Wordmark";
import { colors, space, type } from "@/theme";

const SKIP_DELAY_MS = 600;
const EXPAND_DELAY_MS = 900;
const EXPAND_DURATION_MS = 1200;
const BLOOM_START = 0.35;
const REST = 0.58;

function opened(hinge: number) {
  "worklet";
  return interpolate(hinge, [REST, 1], [0, 1], "clamp");
}

function Interior({ hinge, expand }: { hinge: SharedValue<number>; expand: SharedValue<number> }) {
  const washStyle = useAnimatedStyle(() => ({
    opacity: Math.max(
      1 - opened(hinge.get()) * 0.92,
      interpolate(expand.get(), [BLOOM_START, 0.8], [0, 1], "clamp"),
    ),
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Image
        source={require("@/assets/images/door-interior.jpg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition={{ left: "40%", top: "35%" }}
        transition={0}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glow }, washStyle]} />
    </View>
  );
}

function RadialLight({
  id,
  width,
  height,
  color,
  opacity,
}: {
  id: string;
  width: number;
  height: number;
  color: string;
  opacity: number;
}) {
  return (
    <Svg width={width} height={height}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0" stopColor={color} stopOpacity={opacity} />
          <Stop offset="0.45" stopColor={color} stopOpacity={opacity * 0.45} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {id !== "bloom" ? (
        <Ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} fill={`url(#${id})`} />
      ) : (
        <Rect width={width} height={height} fill={`url(#${id})`} />
      )}
    </Svg>
  );
}

export default function DoorScreen() {
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const doorSize = Math.min(width * 0.5, 240);
  const coverScale = (Math.hypot(width, height) / doorSize) * 2.4;
  const bloomSize = Math.hypot(width, height);

  const [showSkip, setShowSkip] = useState(false);
  const playing = useRef(false);
  const left = useRef(false);

  const knob = useSharedValue(1);
  const hinge = useSharedValue(REST);
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
    transform: [{ scale: interpolate(expand.get(), [0, 1], [1, coverScale]) }],
  }));

  const frameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expand.get(), [0, 0.55], [1, 0], "clamp"),
    transform: [{ scale: interpolate(expand.get(), [0, 1], [1, 4]) }],
  }));

  const poolStyle = useAnimatedStyle(() => {
    const open = Math.min(hinge.get(), 1.05);
    return {
      opacity: interpolate(open, [0, 1], [0, 1], "clamp") *
        interpolate(expand.get(), [0, 0.5], [1, 0], "clamp"),
      transform: [{ scaleX: interpolate(open, [0, 1], [0.4, 1.15]) }, { scaleY: interpolate(open, [0, 1], [0.5, 1]) }],
    };
  });

  const haloStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expand.get(), [0, 0.4], [1, 0], "clamp"),
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: 1 - opened(hinge.get()) * 1.6,
    transform: [{ translateY: opened(hinge.get()) * 12 }],
  }));

  const bloomStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expand.get(), [BLOOM_START, 0.75], [0, 1], "clamp"),
    transform: [{ scale: interpolate(expand.get(), [BLOOM_START, 1], [0.35, 2.2], "clamp") }],
  }));

  const whiteoutStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expand.get(), [0.7, 1], [0, 1], "clamp"),
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
        <View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pool,
              {
                width: doorSize * 1.9,
                height: doorSize * 1.9,
                top: doorSize * 0.5 - doorSize * 0.95,
                left: Math.round(doorSize * 0.8) / 2 - doorSize * 0.95 + doorSize * 0.08,
              },
              haloStyle,
            ]}
          >
            <RadialLight id="halo" width={doorSize * 1.9} height={doorSize * 1.9} color={colors.primary} opacity={0.3} />
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pool,
              {
                width: doorSize * 2.2,
                height: doorSize * 0.7,
                top: doorSize * 0.68,
                left: Math.round(doorSize * 0.8) / 2 - doorSize * 1.1 + doorSize * 0.15,
              },
              poolStyle,
            ]}
          >
            <RadialLight id="pool" width={doorSize * 2.2} height={doorSize * 0.7} color={colors.primary} opacity={0.32} />
          </Animated.View>
          <DoorMark
          size={doorSize}
          strokeRatio={0.07}
          surface={colors.mist}
          leafColor={colors.white}
          lit
          hinge={hinge}
          knobScale={knob}
          scene={<Interior hinge={hinge} expand={expand} />}
          sceneStyle={sceneStyle}
          frameStyle={frameStyle}
          />
        </View>
        <Animated.View style={[styles.wordmark, wordmarkStyle]}>
          <Wordmark fontSize={46} />
        </Animated.View>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.bloom,
          { width: bloomSize, height: bloomSize, left: (width - bloomSize) / 2, top: (height - bloomSize) / 2 },
          bloomStyle,
        ]}
      >
        <RadialLight id="bloom" width={bloomSize} height={bloomSize} color={colors.glow} opacity={1} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.white }, whiteoutStyle]}
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
  screen: { flex: 1, backgroundColor: colors.mist },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  pool: { position: "absolute" },
  bloom: { position: "absolute" },
  wordmark: { marginTop: space.xxxl },
  skip: { position: "absolute", right: space.xl, padding: space.sm },
});
