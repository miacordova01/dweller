import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type AnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { colors, withAlpha } from "@/theme";

type DoorMarkProps = {
  size: number;
  strokeRatio?: number;
  knobRatio?: number;
  surface?: string;
  leafColor?: string;
  openAngle?: number;
  lit?: boolean;
  hinge?: SharedValue<number>;
  knobScale?: SharedValue<number>;
  scene?: ReactNode;
  sceneStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
  frameStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
};

export function DoorMark({
  size,
  strokeRatio = 0.04,
  knobRatio = 0.075,
  surface = colors.white,
  leafColor = colors.lavender,
  openAngle = 78,
  lit = false,
  hinge,
  knobScale,
  scene,
  sceneStyle,
  frameStyle,
}: DoorMarkProps) {
  const height = size;
  const width = Math.round(size * 0.8);
  const stroke = Math.max(1.5, size * strokeRatio);
  const knob = Math.max(4, size * knobRatio);
  const innerHeight = height - stroke * 2;
  const innerWidth = width - stroke * 2;
  const thickness = size * 0.045;

  const leafStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${-(hinge?.get() ?? 0) * openAngle}deg` },
    ],
  }));

  const panelStyle = useAnimatedStyle(() => {
    const open = hinge?.get() ?? 0;
    return {
      backgroundColor: interpolateColor(
        interpolate(open, [0, 0.4], [0, 1], "clamp"),
        [0, 1],
        [surface, leafColor],
      ),
      shadowOpacity: lit ? interpolate(open, [0, 0.5], [0, 0.22], "clamp") : 0,
    };
  });

  const edgeStyle = useAnimatedStyle(() => {
    const angle = ((hinge?.get() ?? 0) * openAngle * Math.PI) / 180;
    return {
      opacity: angle > 0.02 ? 1 : 0,
      transform: [{ translateX: Math.min(thickness * Math.tan(angle), innerWidth * 0.5) }],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(hinge?.get() ?? 0, [0, 0.15, 1], [0, 0.6, 1], "clamp"),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ scale: knobScale?.get() ?? 1 }],
  }));

  const interior = {
    left: stroke,
    top: stroke,
    width: innerWidth,
    height: innerHeight,
    borderTopRightRadius: innerHeight / 2,
    borderBottomRightRadius: innerHeight / 2,
  };

  return (
    <View style={{ width, height }} pointerEvents="none">
      {lit && (
        <Animated.View
          style={[
            styles.absolute,
            interior,
            {
              backgroundColor: colors.glow,
              boxShadow: `0 0 ${size * 0.28}px ${size * 0.06}px ${withAlpha(colors.glow, 0.95)}`,
            },
            glowStyle,
          ]}
        />
      )}
      {scene && (
        <Animated.View style={[styles.absolute, interior, styles.clip, sceneStyle]}>
          {scene}
        </Animated.View>
      )}
      <Animated.View style={[StyleSheet.absoluteFill, frameStyle]}>
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderColor: colors.ink,
              borderWidth: stroke,
              borderLeftWidth: 0,
              borderTopRightRadius: height / 2,
              borderBottomRightRadius: height / 2,
            },
            lit && styles.frameShadow,
          ]}
        />
        <Animated.View
          style={[StyleSheet.absoluteFill, { transformOrigin: "left center" }, leafStyle]}
        >
          {lit && (
            <Animated.View
              style={[styles.absolute, interior, { backgroundColor: colors.leafEdge }, edgeStyle]}
            />
          )}
          <Animated.View
            style={[styles.absolute, interior, lit && styles.leafShadow, panelStyle]}
          >
            <Animated.View
              style={[
                styles.absolute,
                {
                  width: knob,
                  height: knob,
                  borderRadius: knob / 2,
                  backgroundColor: colors.primary,
                  left: innerWidth * 0.62 - knob / 2,
                  top: innerHeight / 2 - knob / 2,
                },
                knobStyle,
              ]}
            >
              {lit && (
                <View
                  style={[
                    styles.absolute,
                    {
                      width: knob * 0.36,
                      height: knob * 0.36,
                      borderRadius: knob,
                      left: knob * 0.18,
                      top: knob * 0.16,
                      backgroundColor: withAlpha(colors.white, 0.7),
                    },
                  ]}
                />
              )}
            </Animated.View>
          </Animated.View>
          <View
            style={[
              styles.absolute,
              { left: 0, top: 0, width: stroke, height, backgroundColor: colors.ink },
            ]}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: "absolute" },
  clip: { overflow: "hidden" },
  frameShadow: {
    shadowColor: colors.ink,
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 12 },
  },
  leafShadow: {
    shadowColor: colors.ink,
    shadowRadius: 18,
    shadowOffset: { width: 10, height: 14 },
  },
});
