import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon, type IconName } from "@/components/Icon";
import { colors, fonts, radius, space, withAlpha } from "@/theme";

export function QuickAction({
  icon,
  label,
  onPress,
  ai = false,
  testID,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  ai?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <View style={[styles.tile, ai && styles.aiTile]}>
        <Icon name={icon} size={24} color={ai ? colors.primary : colors.ink} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  action: { flex: 1, alignItems: "center", gap: space.sm },
  pressed: { opacity: 0.7 },
  tile: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.md + 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    boxShadow: `0 4px 16px ${withAlpha(colors.ink, 0.06)}, 0 1px 2px ${withAlpha(colors.ink, 0.04)}`,
  },
  aiTile: { backgroundColor: colors.lavender },
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.ink, textAlign: "center" },
});
