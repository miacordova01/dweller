import { useQuery } from "convex/react";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "../../convex/_generated/api";
import { AiMark } from "@/components/discovery/AiMark";
import { ImportSheet } from "@/components/discovery/ImportSheet";
import { Action, C, Glyph, Screen, Section, T } from "@/components/DwellerUI";
import { ListingCard } from "@/components/ListingCard";
import { useSavedListings } from "@/lib/saved";
import { router } from "expo-router";

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
        <Text style={T.label}>Add from link or screenshot</Text>
        <Text style={T.muted}>Turn an Instagram, TikTok or Craigslist post into a listing card</Text>
      </View>
      <Glyph name="chevron.right" size={14} color={C.muted} />
    </Pressable>
  );
}

export default function Saved() {
  const saved = useQuery(api.saved.listings);
  const finds = useQuery(api.listings.myFinds);
  const [importOpen, setImportOpen] = useState(false);
  const { isSaved, toggle } = useSavedListings();
  const [now] = useState(() => Date.now());

  return (
    <Screen tab="Saved" title="Saved">
      <ImportEntry onPress={() => setImportOpen(true)} />

      <Section title="Saved homes" />
      {saved === undefined ? (
        <ActivityIndicator color={C.muted} />
      ) : saved.length === 0 ? (
        <View style={styles.empty}>
          <Glyph name="heart" size={24} color={C.purple} />
          <Text style={[T.muted, styles.center]}>Tap the heart on any home in Discover and it lands here.</Text>
          <View style={styles.emptyAction}>
            <Action label="Browse Discover" secondary onPress={() => router.replace("/")} />
          </View>
        </View>
      ) : (
        saved.map((listing) => (
          <ListingCard key={listing._id} listing={listing} now={now} saved={isSaved(listing._id)} onToggleSave={() => toggle(listing._id)} />
        ))
      )}

      {finds !== undefined && finds.length > 0 && (
        <>
          <Section title="Your finds" />
          {finds.map((listing) => (
            <ListingCard key={listing._id} listing={listing} now={now} saved={isSaved(listing._id)} onToggleSave={() => toggle(listing._id)} />
          ))}
        </>
      )}
      <ImportSheet visible={importOpen} onClose={() => setImportOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  importEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.lineSoft,
  },
  pressed: { opacity: 0.85 },
  importText: { flex: 1, gap: 2 },
  empty: { alignItems: "center", gap: 8, paddingVertical: 24 },
  center: { textAlign: "center" },
  emptyAction: { flexDirection: "row", width: 200, marginTop: 8 },
});
