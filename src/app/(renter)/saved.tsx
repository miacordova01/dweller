import { useQuery } from "convex/react";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../../convex/_generated/api";
import { AiMark } from "@/components/discovery/AiMark";
import { ImportSheet } from "@/components/discovery/ImportSheet";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icon";
import { InAppButton } from "@/components/InAppButton";
import { ListingCard } from "@/components/ListingCard";
import { ScreenTitle } from "@/components/ScreenTitle";
import { colors, radius, shadow, space, type } from "@/theme";

function ImportEntry({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      testID="open-import"
      accessibilityRole="button"
      accessibilityLabel="Add from link or screenshot"
      style={({ pressed }) => [styles.importEntry, pressed && styles.pressed]}
      onPress={onPress}
    >
      <AiMark size="large" />
      <View style={styles.importText}>
        <Text style={type.label}>Add from link or screenshot</Text>
        <Text style={type.caption}>Turn an Instagram, TikTok or Craigslist post into a listing card</Text>
      </View>
      <Icon name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={14} color={colors.inkMuted} />
    </Pressable>
  );
}

export default function Saved() {
  const insets = useSafeAreaInsets();
  const finds = useQuery(api.listings.myFinds);
  const [importOpen, setImportOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const openImport = () => setImportOpen(true);

  return (
    <View style={styles.screen}>
      <FlatList
        testID="saved-feed"
        data={finds ?? []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ListingCard listing={item} now={now} saved />}
        ListHeaderComponent={
          <View style={styles.header}>
            <ScreenTitle title="Saved" subtitle="Homes you found anywhere, side by side with Dweller listings." />
            {finds?.length ? <ImportEntry onPress={openImport} /> : null}
          </View>
        }
        ListEmptyComponent={
          finds === undefined ? (
            <ActivityIndicator color={colors.inkMuted} style={styles.loading} />
          ) : (
            <View>
              <EmptyState
                title="Nothing saved yet"
                body="Bring in a listing from Instagram, TikTok or a link and Dweller turns it into a card you can compare."
              />
              <View style={styles.emptyAction}>
                <InAppButton testID="empty-import" label="Import a listing" onPress={openImport} />
              </View>
            </View>
          )
        }
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md }]}
        showsVerticalScrollIndicator={false}
      />
      <ImportSheet visible={importOpen} onClose={() => setImportOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, paddingBottom: space.xxl, gap: space.xl },
  header: { gap: space.lg },
  importEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    boxShadow: shadow.card,
  },
  pressed: { opacity: 0.85 },
  importText: { flex: 1, gap: 2 },
  loading: { marginTop: space.xxl },
  emptyAction: { flexDirection: "row", paddingHorizontal: space.xl },
});
