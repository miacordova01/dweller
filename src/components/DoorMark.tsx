import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type AnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { colors } from "@/theme";

type DoorMarkProps = {
  size: number;
  strokeRatio?: number;
  knobRatio?: number;
  surface?: string;
  openAngle?: number;
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
  openAngle = 78,
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

  const leafStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${-(hinge?.get() ?? 0) * openAngle}deg` },
    ],
  }));

  const panelStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      interpolate(hinge?.get() ?? 0, [0, 0.4], [0, 1], "clamp"),
      [0, 1],
      [surface, colors.lavender],
    ),
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
          ]}
        />
        <Animated.View
          style={[StyleSheet.absoluteFill, { transformOrigin: "left center" }, leafStyle]}
        >
          <Animated.View style={[styles.absolute, interior, panelStyle]}>
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
            />
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
});
