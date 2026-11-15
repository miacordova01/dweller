import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { colors, radius, space, type, withAlpha } from "@/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = "primary" | "secondary" | "plain";

type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: Variant;
  icon?: ReactNode;
};

export function Button({ label, variant = "primary", icon, onPressIn, onPressOut, disabled, ...rest }: ButtonProps) {
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
      {icon && (
        <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {icon}
        </View>
      )}
      <Text style={[type.button, { color: variant === "primary" ? colors.white : colors.ink }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: withAlpha(colors.inkMuted, 0.25),
  },
  plain: { minHeight: 44 },
  icon: { width: 22, alignItems: "center" },
});
