import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { api } from "../../../convex/_generated/api";
import { TopBar } from "@/components/TopBar";
import {
  BellButton,
  Chip,
  EmptyState,
  LandlordScreen,
  Loading,
  NoLandlord,
} from "@/features/landlord/ui";
import { formatDate, formatRent } from "@/lib/listings";
import { colors, fonts, radius, shadow, space, type } from "@/theme";

type Filter = "all" | "occupied" | "vacant";

function metaLine(
  bedrooms: number,
  bathrooms: number,
  squareFeet: number | null,
) {
  return [
    bedrooms === 0 ? "Studio" : bedrooms + " bd",
    bathrooms + " ba",
    squareFeet ? squareFeet.toLocaleString("en-US") + " sq ft" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function LandlordProperties() {
  const units = useQuery(api.landlord.properties);
  const approvals = useQuery(api.landlord.approvals);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  if (units === undefined) {
    return (
      <LandlordScreen>
        <Loading />
      </LandlordScreen>
    );
  }
  if (units === null) {
    return (
      <LandlordScreen>
        <NoLandlord />
      </LandlordScreen>
    );
  }

  const occupiedCount = units.filter((u) => u.occupied).length;
  const needle = search.trim().toLowerCase();
  const shown = [...units]
    .sort(
      (a, b) =>
        Number(b.occupied) - Number(a.occupied) ||
        Number(!!b.photoUrl) - Number(!!a.photoUrl),
    )
    .filter(
      (u) =>
        (filter === "all" || (filter === "occupied") === u.occupied) &&
        (needle === "" ||
          [u.title, u.address, u.neighborhood].some((field) =>
            field.toLowerCase().includes(needle),
          )),
    );

  const pills: { key: Filter; label: string }[] = [
    { key: "all", label: "All " + units.length },
    { key: "occupied", label: "Occupied " + occupiedCount },
    { key: "vacant", label: "Vacant " + (units.length - occupiedCount) },
  ];

  return (
    <LandlordScreen>
      <TopBar right={<BellButton count={approvals?.length ?? 0} />} />

      <View style={styles.search}>
        <SymbolView
          name={{ ios: "magnifyingglass", android: "search", web: "search" }}
          size={18}
          tintColor={colors.inkMuted}
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search your properties…"
          placeholderTextColor={colors.inkMuted}
          style={styles.searchInput}
          accessibilityLabel="Search your properties"
          returnKeyType="search"
        />
      </View>

      <View style={styles.pills}>
        {pills.map((pill) => {
          const active = pill.key === filter;
          return (
            <Pressable
              key={pill.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(pill.key)}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {pill.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {shown.length === 0 ? (
        <EmptyState
          title={units.length === 0 ? "No properties yet" : "No matches"}
          body={
            units.length === 0
              ? "List a unit and it will show up here."
              : "Try a different search or filter."
          }
        />
      ) : (
        shown.map((unit) => (
          <View key={unit._id} style={styles.card}>
            {unit.photoUrl ? (
              <Image
                source={{ uri: unit.photoUrl }}
                style={styles.photo}
                contentFit="cover"
                accessibilityLabel={unit.title}
              />
            ) : (
              <View style={[styles.photo, styles.noPhoto]}>
                <SymbolView
                  name={{ ios: "house", android: "home", web: "home" }}
                  size={22}
                  tintColor={colors.primary}
                />
                <Text style={type.caption}>
                  No photos yet · add some to fill it faster
                </Text>
              </View>
            )}
            <View style={styles.body}>
              <View style={styles.priceRow}>
                <Text style={type.price}>
                  {formatRent(unit.rentCents)}
                  <Text style={styles.per}>/mo</Text>
                </Text>
                <Text style={type.caption}>
                  {unit.occupied ? "rent coming in" : "asking"}
                </Text>
              </View>
              <Text style={styles.meta}>
                {metaLine(unit.bedrooms, unit.bathrooms, unit.squareFeet)}
              </Text>
              <View style={styles.bottomRow}>
                <View style={styles.place}>
                  <SymbolView
                    name={{
                      ios: "mappin",
                      android: "location_on",
                      web: "location_on",
                    }}
                    size={14}
                    tintColor={colors.inkMuted}
                  />
                  <Text style={type.caption} numberOfLines={1}>
                    {unit.address}, {unit.neighborhood}
                  </Text>
                </View>
                {unit.occupied ? (
                  <Chip tone="mint" label="Occupied" />
                ) : (
                  <Chip
                    label={
                      unit.openInquiries > 0
                        ? "Vacant · " +
                          unit.openInquiries +
                          (unit.openInquiries === 1 ? " inquiry" : " inquiries")
                        : "Vacant"
                    }
                  />
                )}
              </View>
              {unit.occupied && unit.tenantName && (
                <Text style={type.caption}>
                  {unit.tenantName}
                  {unit.leaseEnd
                    ? " · lease to " + formatDate(unit.leaseEnd)
                    : ""}
                </Text>
              )}
            </View>
          </View>
        ))
      )}
    </LandlordScreen>
  );
}

const styles = StyleSheet.create({
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    paddingHorizontal: space.lg,
    minHeight: 52,
    boxShadow: shadow.card,
  },
  searchInput: {
    flex: 1,
    ...fonts.regular,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: space.md,
  },
  pills: { flexDirection: "row", gap: space.sm },
  pill: {
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    boxShadow: shadow.card,
  },
  pillActive: { backgroundColor: colors.lavender, boxShadow: "none" },
  pillText: { ...fonts.bold, fontSize: 14, color: colors.inkMuted },
  pillTextActive: { color: colors.ink },
  card: {
    padding: space.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    boxShadow: shadow.card,
  },
  noPhoto: { alignItems: "center", justifyContent: "center", gap: 8 },
  photo: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radius.md - 2,
    backgroundColor: colors.lavender,
  },
  body: {
    paddingHorizontal: space.sm,
    paddingTop: space.md,
    paddingBottom: space.sm,
    gap: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  per: { ...fonts.bold, fontSize: 15, color: colors.inkMuted },
  meta: { ...type.body, fontSize: 15 },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  place: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
});
