import { Pressable, StyleSheet, Text, View } from "react-native";

import { Chip } from "@/components/Chip";
import { Icon, type IconName } from "@/components/Icon";
import { colors, fonts, radius, shadow, space, type } from "@/theme";

export function ActivityRow({
  icon,
  ai = false,
  title,
  detail,
  when,
  chip,
  onPress,
  testID,
}: {
  icon?: IconName;
  ai?: boolean;
  title: string;
  detail?: string | null;
  when?: string;
  chip?: { label: string; tone: "mint" | "lavender" | "neutral" };
  onPress?: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={[title, detail, chip?.label, when].filter(Boolean).join(", ")}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.tile, ai && styles.aiTile]}>
        {ai ? <Text style={styles.sparkle}>✦</Text> : icon && <Icon name={icon} size={20} />}
      </View>
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {when && <Text style={type.caption}>{when}</Text>}
        </View>
        {detail ? (
          <Text style={type.caption} numberOfLines={2}>
            {detail}
          </Text>
        ) : null}
        {chip && (
          <View style={styles.chip}>
            <Chip label={chip.label} tone={chip.tone} />
          </View>
        )}
      </View>
      {onPress && (
        <Icon name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={14} color={colors.inkMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    boxShadow: shadow.card,
  },
  pressed: { opacity: 0.85 },
  tile: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  aiTile: { backgroundColor: colors.lavender },
  sparkle: { ...fonts.regular, fontSize: 20, lineHeight: 24, color: colors.primary },
  text: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.sm },
  title: { ...type.label, fontSize: 15, flexShrink: 1 },
  chip: { marginTop: space.xs },
});
