import { useQuery } from "convex/react";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { api } from "../../convex/_generated/api";
import { C, Glyph, Screen, T } from "@/components/DwellerUI";
import { EmptyState } from "@/components/EmptyState";
import { ListingCard } from "@/components/ListingCard";
import { useSavedListings } from "@/lib/saved";
import { fonts } from "@/theme";

function FilterPill({
  icon,
  label,
  location = false,
}: {
  icon: string;
  label: string;
  location?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.pill, location && styles.pillLocation, pressed && styles.pressed]}
    >
      <Glyph name={icon} size={15} color={location ? C.ink : C.ink} />
      <Text style={styles.pillLabel}>{label}</Text>
      {location && <Glyph name="chevron.down" size={11} color={C.ink} />}
    </Pressable>
  );
}

export default function Discover() {
  const listings = useQuery(api.listings.discover);
  const { isSaved, toggle } = useSavedListings();
  const [query, setQuery] = useState("");
  const [now] = useState(() => Date.now());

  return (
    <Screen tab="Discover">
      <View style={styles.search}>
        <Glyph name="magnifyingglass" size={18} color={C.muted} />
        <TextInput
          testID="discover-search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search homes, neighborhoods..."
          placeholderTextColor={C.muted}
          style={styles.searchInput}
          returnKeyType="search"
          accessibilityLabel="Search homes and neighborhoods"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroller} contentContainerStyle={styles.pills}>
        <FilterPill location icon="mappin.and.ellipse" label="San Francisco" />
        <FilterPill icon="slider.horizontal.3" label="Filters" />
        <FilterPill icon="person.2" label="Any" />
        <FilterPill icon="dollarsign.circle" label="Price" />
        <FilterPill icon="calendar" label="Move-in" />
      </ScrollView>

      {listings === undefined ? (
        <ActivityIndicator color={C.muted} style={styles.loading} />
      ) : listings.length === 0 ? (
        <EmptyState title="No homes yet" body="New listings in San Francisco will show up here as soon as they go live." />
      ) : (
        <View style={styles.feed}>
          {listings.map((listing) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              now={now}
              saved={isSaved(listing._id)}
              onToggleSave={() => toggle(listing._id)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: C.searchFill,
  },
  searchInput: { flex: 1, ...fonts.regular, fontSize: 15, color: C.ink, paddingVertical: 12 },
  pillScroller: { marginHorizontal: -20, marginTop: -4 },
  pills: { gap: 8, paddingHorizontal: 20 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
  },
  pillLocation: { backgroundColor: C.skySoft, borderColor: C.skySoft },
  pillLabel: { ...T.body, fontSize: 14 },
  pressed: { opacity: 0.7 },
  loading: { marginTop: 32 },
  feed: { gap: 16 },
});
