import { Pressable, StyleSheet, View } from "react-native";

import { Icon } from "@/components/Icon";
import { colors } from "@/theme";

export function BellButton({
  unread,
  onPress,
  accessibilityLabel,
}: {
  unread: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      testID="notifications"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => [styles.bell, pressed && styles.pressed]}
    >
      <Icon name={{ ios: "bell", android: "notifications", web: "notifications" }} size={24} />
      {unread && <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bell: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  pressed: { opacity: 0.6 },
  dot: {
    position: "absolute",
    top: 3,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.canvas,
  },
});
