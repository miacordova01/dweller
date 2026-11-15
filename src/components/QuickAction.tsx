import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon, type IconName } from "@/components/Icon";
import { colors, fonts, radius, shadow, space } from "@/theme";

export function QuickAction({
  icon,
  label,
  onPress,
  ai = false,
  badge,
  testID,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  ai?: boolean;
  badge?: number;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} waiting` : label}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <View style={[styles.tile, ai && styles.aiTile]}>
        <Icon name={icon} size={24} color={ai ? colors.primary : colors.ink} />
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
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
    borderRadius: radius.card,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    boxShadow: shadow.card,
  },
  aiTile: { backgroundColor: colors.lavender },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { ...fonts.bold, fontSize: 11, color: colors.white, fontVariant: ["tabular-nums"] },
  label: { ...fonts.bold, fontSize: 12, lineHeight: 16, color: colors.ink, textAlign: "center" },
});
