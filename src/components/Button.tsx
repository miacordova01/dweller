import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { colors, radius, space, type } from "@/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = "primary" | "secondary";

type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: Variant;
};

export function Button({ label, variant = "primary", onPressIn, onPressOut, disabled, ...rest }: ButtonProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.get() * 0.03 }],
    opacity: (disabled ? 0.4 : 1) * (1 - pressed.get() * 0.12),
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
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
      <Text style={[type.button, styles.label, { color: variant === "primary" ? colors.white : colors.ink }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  label: { flexShrink: 1, textAlign: "center" },
});
