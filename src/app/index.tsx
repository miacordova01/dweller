import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api } from "../../convex/_generated/api";
import { Action, C, Glyph, Screen, T } from "@/components/DwellerUI";
import { EmptyState } from "@/components/EmptyState";
import { FilterSheet } from "@/components/FilterSheet";
import { ListingCard } from "@/components/ListingCard";
import {
  activeCount,
  bedroomLabel,
  moveInLabel,
  priceLabel,
  summary,
  type DiscoverFilters,
} from "@/lib/filters";
import { listingMeta, listingPlace, listingRent } from "@/lib/listings";
import { useSavedListings } from "@/lib/saved";
import { fonts } from "@/theme";

function clean(filters: DiscoverFilters): DiscoverFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined),
  ) as DiscoverFilters;
}

function FilterPill({
  icon,
  label,
  active = false,
  location = false,
  badge,
  onPress,
}: {
  icon: string;
  label: string;
  active?: boolean;
  location?: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.pill,
        location && styles.pillLocation,
        pressed && styles.pressed,
      ]}
    >
      <Glyph name={icon} size={15} color={C.ink} />
      <Text
        style={[styles.pillLabel, active && styles.pillLabelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {location && <Glyph name="chevron.down" size={11} color={C.ink} />}
    </Pressable>
  );
}

export default function Discover() {
  const preferences = useQuery(api.people.renterPreferences);
  const filters = clean(preferences?.filters ?? {});
  const listings = useQuery(
    api.listings.discover,
    preferences === undefined ? "skip" : filters,
  );
  const saveFilters = useMutation(
    api.people.saveDiscoverFilters,
  ).withOptimisticUpdate((store, { filters: next }) => {
    const current = store.getQuery(api.people.renterPreferences, {});
    if (current === undefined) return;
    store.setQuery(
      api.people.renterPreferences,
      {},
      { amenities: [], ...current, filters: next },
    );
  });
  const { isSaved, toggle } = useSavedListings();
  const [query, setQuery] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [now] = useState(() => Date.now());

  const applied = activeCount(filters);
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? listings?.filter((l) =>
        [listingPlace(l), listingMeta(l), listingRent(l), l.title]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : listings;
  const hoods = filters.neighborhoods ?? [];

  function apply(next: DiscoverFilters) {
    setSheetOpen(false);
    saveFilters({ filters: clean(next) }).catch(() => {});
  }

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
          clearButtonMode="while-editing"
          accessibilityLabel="Search homes and neighborhoods"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillScroller}
        contentContainerStyle={styles.pills}
      >
        <FilterPill
          location
          icon="mappin"
          label={
            hoods.length === 0
              ? "San Francisco"
              : hoods.length === 1
                ? hoods[0]
                : `${hoods[0]} +${hoods.length - 1}`
          }
          active={hoods.length > 0}
          onPress={() => setSheetOpen(true)}
        />
        <FilterPill
          icon="slider.horizontal.3"
          label="Filters"
          badge={applied}
          onPress={() => setSheetOpen(true)}
        />
        <FilterPill
          icon="person.2"
          label={
            bedroomLabel(filters)
              ? bedroomLabel(filters) === "Studio"
                ? "Studio"
                : `${bedroomLabel(filters)} bd`
              : "Any"
          }
          active={bedroomLabel(filters) !== undefined}
          onPress={() => setSheetOpen(true)}
        />
        <FilterPill
          icon="dollarsign.circle"
          label={priceLabel(filters) ?? "Price"}
          active={filters.maxRentCents !== undefined}
          onPress={() => setSheetOpen(true)}
        />
        <FilterPill
          icon="calendar"
          label={moveInLabel(filters) ?? "Move-in"}
          active={filters.availableBy !== undefined}
          onPress={() => setSheetOpen(true)}
        />
      </ScrollView>

      {applied > 0 && (
        <View style={styles.banner} testID="discover-filter-banner">
          <Glyph name="sparkles" size={15} color={C.purple} />
          <Text style={[T.body, styles.bannerText]} numberOfLines={2}>
            {listings === undefined
              ? "Matching"
              : `${listings.length} ${listings.length === 1 ? "home" : "homes"} matching`}{" "}
            your search: {summary(filters)}
          </Text>
          <Pressable
            onPress={() => apply({})}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear filters and show all homes"
          >
            <Text style={styles.clear}>Show all</Text>
          </Pressable>
        </View>
      )}

      {shown === undefined ? (
        <ActivityIndicator color={C.muted} style={styles.loading} />
      ) : shown.length === 0 ? (
        applied > 0 || needle ? (
          <View style={styles.empty} testID="discover-empty">
            <Glyph name="magnifyingglass" size={26} color={C.purple} />
            <Text style={T.h2}>No homes match</Text>
            <Text style={[T.muted, styles.emptyBody]}>
              {applied > 0
                ? `Nothing listed right now fits ${summary(filters)}${needle ? ` and “${query.trim()}”` : ""}.`
                : `Nothing matches “${query.trim()}”.`}
            </Text>
            <View style={styles.emptyActions}>
              {applied > 0 && (
                <Action label="Clear filters" onPress={() => apply({})} />
              )}
              {needle !== "" && (
                <Action
                  label="Clear search"
                  secondary
                  onPress={() => setQuery("")}
                />
              )}
            </View>
          </View>
        ) : (
          <EmptyState
            title="No homes yet"
            body="New listings in San Francisco will show up here as soon as they go live."
          />
        )
      ) : (
        <View style={styles.feed}>
          {shown.map((listing) => (
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

      <FilterSheet
        visible={sheetOpen}
        filters={filters}
        onClose={() => setSheetOpen(false)}
        onApply={apply}
      />
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
  searchInput: {
    flex: 1,
    ...fonts.regular,
    fontSize: 15,
    color: C.ink,
    paddingVertical: 12,
  },
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
  pillLabel: { ...T.body, fontSize: 14, maxWidth: 160 },
  pillLabelActive: { ...fonts.bold },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { ...fonts.bold, fontSize: 11, color: C.white },
  pressed: { opacity: 0.7 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: -4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: C.lavender,
  },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 18 },
  clear: { ...fonts.bold, fontSize: 14, color: C.purple },
  loading: { marginTop: 32 },
  feed: { gap: 16 },
  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 40,
    paddingHorizontal: 12,
  },
  emptyBody: { textAlign: "center" },
  emptyActions: {
    flexDirection: "row",
    gap: 10,
    alignSelf: "stretch",
    marginTop: 12,
  },
});
