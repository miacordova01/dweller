import { StyleSheet, Text, View } from "react-native";

import { Icon, type IconName } from "@/components/Icon";
import { colors, fonts, radius, space } from "@/theme";

export function StatTile({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.tile} accessible accessibilityLabel={label}>
      <Icon name={icon} size={18} />
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    minHeight: 48,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
  },
  label: { ...fonts.bold, fontSize: 14, color: colors.ink, fontVariant: ["tabular-nums"] },
});
