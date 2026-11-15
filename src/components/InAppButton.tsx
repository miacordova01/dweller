import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { colors, radius, space, type } from "@/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function InAppButton({
  label,
  variant = "primary",
  onPressIn,
  onPressOut,
  ...rest
}: Omit<PressableProps, "children" | "style"> & { label: string; variant?: "primary" | "secondary" }) {
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.get() * 0.03 }],
    opacity: 1 - pressed.get() * 0.12,
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPressIn={(e) => {
        pressed.set(withTiming(1, { duration: 90 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.set(withTiming(0, { duration: 160 }));
        onPressOut?.(e);
      }}
      style={[styles.base, styles[variant], animatedStyle]}
      {...rest}
    >
      <Text style={[type.button, { color: variant === "primary" ? colors.white : colors.ink }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.blue },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.hairline,
  },
});
