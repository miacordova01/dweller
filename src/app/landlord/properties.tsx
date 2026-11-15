import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { api } from "../../../convex/_generated/api";
import { Wordmark } from "@/components/Wordmark";
import { BellButton, Chip, EmptyState, LandlordScreen, Loading, NoLandlord, formatDay } from "@/features/landlord/ui";
import { formatRent } from "@/lib/listings";
import { colors, fonts, radius, space, type, withAlpha } from "@/theme";

type Filter = "all" | "occupied" | "vacant";

function metaLine(bedrooms: number, bathrooms: number, squareFeet: number | null) {
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
  const shown = units.filter(
    (u) =>
      (filter === "all" || (filter === "occupied") === u.occupied) &&
      (needle === "" ||
        [u.title, u.address, u.neighborhood].some((field) => field.toLowerCase().includes(needle))),
  );

  const pills: { key: Filter; label: string }[] = [
    { key: "all", label: "All " + units.length },
    { key: "occupied", label: "Occupied " + occupiedCount },
    { key: "vacant", label: "Vacant " + (units.length - occupiedCount) },
  ];

  return (
    <LandlordScreen>
      <View style={styles.top}>
        <Wordmark fontSize={30} />
        <BellButton count={approvals?.length ?? 0} />
      </View>

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
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{pill.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {shown.length === 0 ? (
        <EmptyState
          title={units.length === 0 ? "No properties yet" : "No matches"}
          body={units.length === 0 ? "List a unit and it will show up here." : "Try a different search or filter."}
        />
      ) : (
        shown.map((unit) => (
          <View key={unit._id} style={styles.card}>
            <Image
              source={unit.photoUrl ? { uri: unit.photoUrl } : undefined}
              style={styles.photo}
              contentFit="cover"
              accessibilityLabel={unit.title}
            />
            <View style={styles.body}>
              <View style={styles.priceRow}>
                <Text style={type.price}>
                  {formatRent(unit.rentCents)}
                  <Text style={styles.per}>/mo</Text>
                </Text>
                <Text style={type.caption}>{unit.occupied ? "rent coming in" : "asking"}</Text>
              </View>
              <Text style={styles.meta}>{metaLine(unit.bedrooms, unit.bathrooms, unit.squareFeet)}</Text>
              <View style={styles.bottomRow}>
                <View style={styles.place}>
                  <SymbolView
                    name={{ ios: "mappin.and.ellipse", android: "location_on", web: "location_on" }}
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
                        ? "Vacant · " + unit.openInquiries + (unit.openInquiries === 1 ? " inquiry" : " inquiries")
                        : "Vacant"
                    }
                  />
                )}
              </View>
              {unit.occupied && unit.tenantName && (
                <Text style={type.caption}>
                  {unit.tenantName}
                  {unit.leaseEnd ? " · lease to " + formatDay(unit.leaseEnd) : ""}
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
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    minHeight: 48,
    boxShadow: "0px 4px 16px " + withAlpha(colors.ink, 0.07),
  },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, paddingVertical: space.md },
  pills: { flexDirection: "row", gap: space.sm },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.hairline,
  },
  pillActive: { backgroundColor: withAlpha(colors.sky, 0.35), borderColor: "transparent" },
  pillText: { fontFamily: fonts.medium, fontSize: 14, color: colors.inkMuted },
  pillTextActive: { color: colors.ink },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0px 4px 16px " + withAlpha(colors.ink, 0.07),
  },
  photo: { width: "100%", aspectRatio: 16 / 10, backgroundColor: colors.lavender },
  body: { padding: space.lg, gap: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  per: { fontFamily: fonts.medium, fontSize: 15, color: colors.inkMuted },
  meta: { ...type.body, fontSize: 15 },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm },
  place: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
});
