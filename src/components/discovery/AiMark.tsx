import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../theme";

// DESIGN.md: AI is marked by a sparkle on a lavender surface, never by
// purple alone.
export function AiMark({
  label,
  size = "small",
}: {
  label?: string;
  size?: "small" | "large";
}) {
  return (
    <View style={[styles.pill, size === "large" && styles.pillLarge]}>
      <Text style={[styles.sparkle, size === "large" && styles.sparkleLarge]}>
        ✦
      </Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: colors.lavender,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillLarge: {
    width: 36,
    height: 36,
    justifyContent: "center",
    paddingHorizontal: 0,
  },
  sparkle: { color: colors.primary, fontSize: 11 },
  sparkleLarge: { fontSize: 18 },
  label: { color: colors.ink, fontSize: 12, fontWeight: "500" },
});
