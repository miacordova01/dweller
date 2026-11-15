import { StyleSheet, Text, View } from "react-native";

import { Icon, type IconName } from "@/components/Icon";
import { colors, fonts, radius, space } from "@/theme";

const mintInk = "#137A4B";

const tones = {
  mint: { backgroundColor: colors.mint, color: mintInk },
  lavender: { backgroundColor: colors.lavender, color: colors.primary },
  neutral: { backgroundColor: colors.canvas, color: colors.inkMuted },
} as const;

export function Chip({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: keyof typeof tones;
  icon?: IconName;
}) {
  const { backgroundColor, color } = tones[tone];
  return (
    <View style={[styles.chip, { backgroundColor }]}>
      {icon && <Icon name={icon} size={12} color={color} />}
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: space.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
});
