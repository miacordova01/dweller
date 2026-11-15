import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Wordmark } from "@/components/Wordmark";

export function TopBar({ right }: { right: ReactNode }) {
  return (
    <View style={styles.row}>
      <Wordmark fontSize={30} />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
});
