import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../convex/_generated/api";
import { BellButton } from "@/components/BellButton";
import { EmptyState } from "@/components/EmptyState";
import { Icon, type IconName } from "@/components/Icon";
import { ListingCard } from "@/components/ListingCard";
import { TopBar } from "@/components/TopBar";
import { colors, fonts, radius, shadow, space } from "@/theme";

function FilterPill({
  icon,
  label,
  active = false,
  chevron = false,
  accessibilityLabel,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  chevron?: boolean;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.pill, active && styles.pillActive, pressed && styles.pressed]}
    >
      <Icon name={icon} size={16} color={colors.ink} />
      <Text style={styles.pillLabel}>{label}</Text>
      {chevron && <Icon name={{ ios: "chevron.down", android: "expand_more", web: "expand_more" }} size={12} color={colors.ink} />}
    </Pressable>
  );
}

function Header() {
  const [query, setQuery] = useState("");
  return (
    <View style={styles.header}>
      <TopBar
        right={
          <BellButton unread accessibilityLabel="Notifications, unread" onPress={() => router.navigate("/activity")} />
        }
      />
      <View style={styles.search}>
        <Icon name={{ ios: "magnifyingglass", android: "search", web: "search" }} size={18} color={colors.inkMuted} />
        <TextInput
          testID="discover-search"
          value={query}
          onChangeText={setQuery}
          placeholder="Search homes, neighborhoods..."
          placeholderTextColor={colors.inkMuted}
          style={styles.searchInput}
          returnKeyType="search"
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
          active
          chevron
          icon={{ ios: "mappin.and.ellipse", android: "location_on", web: "location_on" }}
          label="San Francisco"
          accessibilityLabel="Location, San Francisco"
        />
        <FilterPill
          icon={{ ios: "slider.horizontal.3", android: "tune", web: "tune" }}
          label="Filters"
          accessibilityLabel="Filters"
        />
        <FilterPill
          icon={{ ios: "person.2", android: "group", web: "group" }}
          label="Any"
          accessibilityLabel="People, any number"
        />
      </ScrollView>
    </View>
  );
}

export default function Discover() {
  const insets = useSafeAreaInsets();
  const listings = useQuery(api.listings.discover);
  const [now] = useState(() => Date.now());

  return (
    <FlatList
      testID="discover-feed"
      data={listings ?? []}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => <ListingCard listing={item} now={now} />}
      ListHeaderComponent={<Header />}
      ListEmptyComponent={
        listings === undefined ? (
          <ActivityIndicator color={colors.inkMuted} style={styles.loading} />
        ) : (
          <EmptyState title="No homes yet" body="New listings in San Francisco will show up here as soon as they go live." />
        )
      }
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md }]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, paddingBottom: space.xxl, gap: space.xl },
  header: { gap: space.lg },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 52,
    paddingHorizontal: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    boxShadow: shadow.card,
  },
  searchInput: { flex: 1, ...fonts.regular, fontSize: 16, color: colors.ink, paddingVertical: space.md },
  pillScroller: { marginHorizontal: -20 },
  pills: { gap: space.sm, paddingHorizontal: 20, paddingVertical: 4 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    boxShadow: shadow.card,
  },
  pillActive: { backgroundColor: colors.lavender, boxShadow: "none" },
  pressed: { opacity: 0.7 },
  pillLabel: { ...fonts.bold, fontSize: 14, lineHeight: 18, color: colors.ink },
  loading: { marginTop: space.xxl },
});
