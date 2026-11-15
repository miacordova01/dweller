import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { space, type } from "@/theme";

export function ScreenTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <Text style={type.title} accessibilityRole="header">
          {title}
        </Text>
        {right}
      </View>
      {subtitle ? <Text style={type.bodyMuted}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.xs },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md },
});
