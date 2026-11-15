import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../../convex/_generated/api";
import { Icon, type IconName } from "@/components/Icon";
import { InAppButton } from "@/components/InAppButton";
import { StatTile } from "@/components/StatTile";
import { formatRent } from "@/lib/listings";
import { colors, fonts, radius, space, type, withAlpha } from "@/theme";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/home");
}

function FloatingButton({
  icon,
  label,
  onPress,
  color = colors.ink,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.floating, pressed && { opacity: 0.8 }]}
    >
      <Icon name={icon} size={18} color={color} />
    </Pressable>
  );
}

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = useQuery(api.detail.getListing, { id });
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const [saved, setSaved] = useState(false);

  if (listing === undefined) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color={colors.inkMuted} />
      </View>
    );
  }

  if (listing === null) {
    return (
      <View style={[styles.centered, { padding: space.xl }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={type.heading}>This home isn’t available</Text>
        <Text style={[type.bodyMuted, styles.centerText]}>It may have been leased or taken down.</Text>
        <View style={styles.missingAction}>
          <InAppButton label="Go back" variant="secondary" onPress={goBack} />
        </View>
      </View>
    );
  }

  const galleryHeight = Math.round(width * 0.92);
  const missing = new Set(listing.missingFields);
  const rent = missing.has("rentMonthlyCents") ? "Rent unknown" : `${formatRent(listing.rentMonthlyCents)}/mo`;
  const beds = missing.has("bedrooms") ? null : listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} bd`;
  const baths = missing.has("bathrooms") ? null : `${listing.bathrooms} ba`;
  const sqft = listing.squareFeet ? `${listing.squareFeet.toLocaleString("en-US")} sq ft` : null;
  const city = listing.city === "San Francisco" ? "SF" : listing.city;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 104 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={{ height: galleryHeight }}>
          {listing.photos.length > 0 ? (
            <FlatList
              testID="listing-gallery"
              data={listing.photos}
              keyExtractor={(uri, index) => `${index}-${uri}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
              renderItem={({ item, index }) => (
                <Image
                  source={{ uri: item }}
                  style={{ width, height: galleryHeight }}
                  contentFit="cover"
                  transition={200}
                  accessibilityLabel={`Photo ${index + 1} of ${listing.photos.length}`}
                />
              )}
            />
          ) : (
            <View style={[styles.noPhoto, { height: galleryHeight }]}>
              <Icon name={{ ios: "photo", android: "image", web: "image" }} size={32} color={colors.inkMuted} />
            </View>
          )}
          {listing.photos.length > 1 && (
            <View style={styles.dots} accessibilityLabel={`Photo ${page + 1} of ${listing.photos.length}`}>
              {listing.photos.map((uri, index) => (
                <View key={`${index}-${uri}`} style={[styles.dot, index === page && styles.dotActive]} />
              ))}
            </View>
          )}
          <View style={[styles.floatingRow, { top: insets.top + space.sm }]}>
            <FloatingButton
              icon={{ ios: "arrow.left", android: "arrow_back", web: "arrow_back" }}
              label="Back"
              onPress={goBack}
            />
            <View style={styles.floatingGroup}>
              <FloatingButton
                icon={{ ios: "square.and.arrow.up", android: "share", web: "share" }}
                label="Share"
                onPress={() => Share.share({ message: `${listing.title} · ${rent} · ${listing.address}, ${listing.city}` })}
              />
              <FloatingButton
                icon={
                  saved
                    ? { ios: "heart.fill", android: "favorite", web: "favorite" }
                    : { ios: "heart", android: "favorite_border", web: "favorite_border" }
                }
                label={saved ? "Remove from saved" : "Save"}
                color={saved ? colors.primary : colors.ink}
                onPress={() => setSaved((value) => !value)}
              />
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.price}>{rent}</Text>
          <Text style={styles.meta}>{[beds, baths, sqft].filter(Boolean).join(" · ")}</Text>
          <View style={styles.place}>
            <Icon name={{ ios: "mappin", android: "location_on", web: "location_on" }} size={14} color={colors.inkMuted} />
            <Text style={type.caption}>
              {listing.neighborhood}, {city}
            </Text>
          </View>

          <Pressable
            testID="ask-dweller-ai"
            onPress={() => router.push("/assistant")}
            accessibilityRole="button"
            accessibilityLabel="Ask Dweller AI about this home"
            style={({ pressed }) => [styles.askRow, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.sparkle}>✦</Text>
            <Text style={styles.askLabel}>Ask Dweller AI</Text>
            <Icon name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={14} color={colors.inkMuted} />
          </Pressable>

          <View style={styles.stats}>
            <StatTile icon={{ ios: "bed.double", android: "bed", web: "bed" }} label={beds ?? "— bd"} />
            <StatTile icon={{ ios: "bathtub", android: "bathtub", web: "bathtub" }} label={baths ?? "— ba"} />
            <StatTile icon={{ ios: "square.dashed", android: "square_foot", web: "square_foot" }} label={sqft ?? "— sq ft"} />
          </View>

          <Text style={[type.heading, styles.sectionTitle]}>About this home</Text>
          <Text style={styles.about}>{listing.description ?? listing.title}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
        <InAppButton
          testID="schedule-tour"
          label="Schedule tour"
          variant="secondary"
          onPress={() => Alert.alert("Schedule tour", "Tour booking is coming soon.")}
        />
        <InAppButton
          testID="apply-now"
          label="Apply now"
          onPress={() => Alert.alert("Apply now", "Applications are coming soon.")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: space.sm, backgroundColor: colors.white },
  centerText: { textAlign: "center" },
  missingAction: { flexDirection: "row", width: 200, marginTop: space.lg },
  noPhoto: { backgroundColor: colors.canvas, alignItems: "center", justifyContent: "center" },
  dots: {
    position: "absolute",
    bottom: space.md,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: withAlpha(colors.white, 0.55) },
  dotActive: { backgroundColor: colors.white },
  floatingRow: {
    position: "absolute",
    left: space.lg,
    right: space.lg,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  floatingGroup: { flexDirection: "row", gap: space.sm },
  floating: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0 2px 8px ${withAlpha(colors.ink, 0.12)}`,
  },
  body: { padding: 20, gap: space.xs },
  price: { fontFamily: fonts.semibold, fontSize: 28, lineHeight: 34, letterSpacing: -0.4, color: colors.ink, fontVariant: ["tabular-nums"] },
  meta: { ...type.body, fontVariant: ["tabular-nums"] },
  place: { flexDirection: "row", alignItems: "center", gap: space.xs },
  askRow: {
    marginTop: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 52,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.lavender,
  },
  sparkle: { fontFamily: fonts.regular, fontSize: 18, color: colors.primary },
  askLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  stats: { flexDirection: "row", gap: space.sm, marginTop: space.lg },
  sectionTitle: { marginTop: space.xl },
  about: { ...type.bodyMuted, marginTop: space.xs },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: space.md,
    paddingTop: space.md,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
});
