import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { colors, radius, space, withAlpha } from "@/theme";

export function Card({
  children,
  onPress,
  accessibilityLabel,
  testID,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  if (!onPress) return <View style={[styles.card, style]} testID={testID}>{children}</View>;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md + 2,
    padding: space.lg,
    boxShadow: `0 4px 16px ${withAlpha(colors.ink, 0.06)}, 0 1px 2px ${withAlpha(colors.ink, 0.04)}`,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
