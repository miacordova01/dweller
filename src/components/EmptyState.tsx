import { StyleSheet, Text, View } from "react-native";

import { DoorMark } from "@/components/DoorMark";
import { space, type } from "@/theme";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <DoorMark size={56} strokeRatio={0.07} knobRatio={0.12} surface="transparent" />
      <Text style={[type.heading, styles.title]}>{title}</Text>
      <Text style={[type.bodyMuted, styles.body]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", paddingVertical: space.xxxl, paddingHorizontal: space.xl, gap: space.sm },
  title: { marginTop: space.md, textAlign: "center" },
  body: { textAlign: "center" },
});
