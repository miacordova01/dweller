import { StyleSheet, Text, View } from "react-native";

import { DoorMark } from "@/components/DoorMark";
import { colors, type } from "@/theme";

export function Wordmark({ fontSize = type.wordmark.fontSize }: { fontSize?: number }) {
  const capHeight = Math.round(fontSize * 0.72);
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="header"
      accessibilityLabel="Dweller"
    >
      <View style={{ marginBottom: fontSize * 0.235, marginRight: fontSize * 0.04 }}>
        <DoorMark size={capHeight} strokeRatio={0.085} knobRatio={0.16} surface="transparent" />
      </View>
      <Text
        style={[
          type.wordmark,
          { fontSize, lineHeight: fontSize * 1.2, letterSpacing: fontSize * -0.02, color: colors.ink },
        ]}
      >
        weller
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end" },
});
