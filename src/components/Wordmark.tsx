import { StyleSheet, Text, View } from "react-native";

import { colors, type } from "@/theme";

export function Wordmark({ fontSize = type.wordmark.fontSize }: { fontSize?: number }) {
  const text = [type.wordmark, { fontSize, lineHeight: fontSize * 1.2, letterSpacing: fontSize * -0.02, color: colors.ink }];
  const knob = fontSize * 0.13;
  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel="Dweller">
      <View>
        <Text style={text}>D</Text>
        <View
          style={[
            styles.knob,
            {
              width: knob,
              height: knob,
              borderRadius: knob / 2,
              left: fontSize * 0.33 - knob / 2,
              top: fontSize * 0.6 - knob / 2,
            },
          ]}
        />
      </View>
      <Text style={text}>weller</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  knob: { position: "absolute", backgroundColor: colors.primary },
});
