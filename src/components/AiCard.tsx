import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, fonts, radius, space } from "@/theme";

export function AiCard({ children }: { children: ReactNode }) {
  return (
    <View style={styles.card} accessible accessibilityLabel={typeof children === "string" ? `Dweller AI: ${children}` : undefined}>
      <Text style={styles.sparkle}>✦</Text>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md + 2,
    backgroundColor: colors.lavender,
  },
  sparkle: { fontFamily: fonts.regular, fontSize: 20, lineHeight: 22, color: colors.primary },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, color: colors.ink },
});
