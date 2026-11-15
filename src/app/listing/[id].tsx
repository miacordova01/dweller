import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
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
import { Action, C, Glyph, Screen, T } from "@/components/DwellerUI";
import { listingMeta, listingPlace, listingRent } from "@/lib/listings";
import { useSavedListings } from "@/lib/saved";
import { fonts } from "@/theme";

const SHEET_OVERLAP = 28;

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

function at(daysAhead: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

function tourSlots() {
  const today = new Date().getDay();
  const toSaturday = (6 - today + 7) % 7 || 7;
  return [at(1, 10), at(2, 17, 30), at(toSaturday, 11)];
}

function formatSlot(ms: number) {
  return new Date(ms).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function FloatingButton({
  icon,
  label,
  onPress,
  color = C.ink,
}: {
  icon: string;
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
      style={({ pressed }) => [styles.floating, pressed && styles.pressed]}
    >
      <Glyph name={icon} size={18} color={color} />
    </Pressable>
  );
}

function Stat({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Glyph name={icon} size={17} color={C.ink} />
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const listing = useQuery(api.detail.getListing, { id });
  const propose = useMutation(api.tours.propose);
  const { isSaved, toggle } = useSavedListings();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const [booking, setBooking] = useState(false);
  const [requested, setRequested] = useState<number | null>(null);

  if (listing === undefined) {
    return (
      <Screen bare pushed tab="Discover">
        <View style={styles.centered}>
          <ActivityIndicator color={C.muted} />
        </View>
      </Screen>
    );
  }

  if (listing === null) {
    return (
      <Screen bare pushed tab="Discover">
        <View style={[styles.centered, styles.missing]}>
          <Text style={T.h2}>This home isn’t available</Text>
          <Text style={[T.muted, styles.centerText]}>
            It may have been leased or taken down.
          </Text>
          <View style={styles.missingAction}>
            <Action label="Go back" secondary onPress={goBack} />
          </View>
        </View>
      </Screen>
    );
  }

  const listingId = listing._id;
  const saved = isSaved(listingId);
  const galleryHeight = Math.round(width * 0.98);
  const missing = new Set(listing.missingFields);
  const rent = listingRent(listing);
  const beds = missing.has("bedrooms")
    ? "— bd"
    : listing.bedrooms === 0
      ? "Studio"
      : `${listing.bedrooms} bd`;
  const baths = missing.has("bathrooms") ? "— ba" : `${listing.bathrooms} ba`;
  const sqft = listing.squareFeet
    ? `${listing.squareFeet.toLocaleString("en-US")} sq ft`
    : "— sq ft";

  async function book(scheduledFor: number) {
    setBooking(true);
    try {
      await propose({ listingId, scheduledFor });
      setRequested(scheduledFor);
    } catch (error) {
      Alert.alert(
        "Couldn’t request a tour",
        error instanceof ConvexError
          ? String(error.data)
          : "Something went wrong. Try again.",
      );
    } finally {
      setBooking(false);
    }
  }

  function scheduleTour() {
    Alert.alert(
      "Schedule a tour",
      "Pick a time. The owner confirms it before it’s booked.",
      [
        ...tourSlots().map((slot) => ({
          text: formatSlot(slot),
          onPress: () => book(slot),
        })),
        { text: "Cancel", style: "cancel" as const },
      ],
    );
  }

  return (
    <Screen
      bare
      pushed
      tab="Discover"
      footer={
        <View style={styles.footer}>
          <Action
            testID="schedule-tour"
            label={
              booking
                ? "Requesting…"
                : requested !== null
                  ? "Tour requested"
                  : "Schedule tour"
            }
            secondary
            disabled={booking || requested !== null}
            onPress={scheduleTour}
          />
          <Action
            testID="apply-now"
            blue
            label="Apply now"
            onPress={() => Alert.alert("Apply now", "Applications open soon.")}
          />
        </View>
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: galleryHeight }}>
          {listing.photos.length > 0 ? (
            <FlatList
              testID="listing-gallery"
              data={listing.photos}
              keyExtractor={(uri, index) => `${index}-${uri}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setPage(Math.round(e.nativeEvent.contentOffset.x / width))
              }
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
              <Glyph name="photo" size={32} color={C.muted} />
            </View>
          )}
          {listing.photos.length > 1 && (
            <View
              style={[styles.dots, { bottom: SHEET_OVERLAP + 14 }]}
              accessibilityLabel={`Photo ${page + 1} of ${listing.photos.length}`}
            >
              {listing.photos.map((uri, index) => (
                <View
                  key={`${index}-${uri}`}
                  style={[styles.dot, index === page && styles.dotActive]}
                />
              ))}
            </View>
          )}
          <View style={[styles.floatingRow, { top: insets.top + 8 }]}>
            <FloatingButton icon="arrow.left" label="Back" onPress={goBack} />
            <View style={styles.floatingGroup}>
              <FloatingButton
                icon="square.and.arrow.up"
                label="Share"
                onPress={() =>
                  Share.share({
                    message: `${listing.title} · ${rent} · ${listing.address}, ${listing.city}`,
                  })
                }
              />
              <FloatingButton
                icon={saved ? "heart.fill" : "heart"}
                label={saved ? "Remove from saved" : "Save"}
                color={saved ? C.purple : C.ink}
                onPress={() => toggle(listingId)}
              />
            </View>
          </View>
        </View>

        <View style={styles.sheet}>
          <Text style={styles.price}>{rent}</Text>
          <Text style={styles.meta}>{listingMeta(listing)}</Text>
          <View style={styles.place}>
            <Glyph name="mappin" size={14} color={C.muted} />
            <Text style={T.muted}>{listingPlace(listing)}</Text>
          </View>

          <Pressable
            testID="ask-dweller-ai"
            onPress={() =>
              router.push({ pathname: "/assistant", params: { listingId } })
            }
            accessibilityRole="button"
            accessibilityLabel="Ask Dweller AI about this home"
            style={({ pressed }) => [styles.askRow, pressed && styles.pressed]}
          >
            <Glyph name="sparkles" size={20} color={C.purple} />
            <Text style={styles.askLabel}>Ask Dweller AI</Text>
            <Glyph name="chevron.right" size={14} color={C.muted} />
          </Pressable>

          <View style={styles.stats}>
            <Stat icon="bed.double" label={beds} />
            <Stat icon="bathtub" label={baths} />
            <Stat icon="square.dashed" label={sqft} />
          </View>

          {requested !== null && (
            <View style={styles.requested}>
              <Glyph name="clock" size={16} color={C.purple} />
              <Text style={[T.body, styles.requestedText]}>
                Tour requested for {formatSlot(requested)}. Waiting on the owner
                to confirm.
              </Text>
            </View>
          )}

          <Text style={styles.section}>About this home</Text>
          <Text style={[T.body, styles.about]}>
            {listing.description ?? listing.title}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.white,
  },
  missing: { padding: 24 },
  centerText: { textAlign: "center" },
  missingAction: { flexDirection: "row", width: 200, marginTop: 16 },
  pressed: { opacity: 0.8 },
  noPhoto: {
    backgroundColor: C.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  dotActive: { backgroundColor: C.white },
  floatingRow: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  floatingGroup: { flexDirection: "row", gap: 8 },
  floating: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.ink,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  sheet: {
    marginTop: -SHEET_OVERLAP,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 4,
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  price: {
    ...T.price,
    fontSize: 28,
    lineHeight: 34,
    fontVariant: ["tabular-nums"],
  },
  meta: {
    ...T.body,
    fontSize: 17,
    lineHeight: 24,
    fontVariant: ["tabular-nums"],
  },
  place: { flexDirection: "row", alignItems: "center", gap: 5 },
  stats: { flexDirection: "row", gap: 10, marginTop: 14 },
  stat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.lineSoft,
    shadowColor: C.ink,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  statLabel: { ...T.body, fontSize: 13, fontVariant: ["tabular-nums"] },
  askRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: C.lavender,
  },
  askLabel: { ...fonts.bold, flex: 1, fontSize: 17, color: C.ink },
  requested: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: C.skySoft,
  },
  requestedText: { flex: 1 },
  section: { ...fonts.bold, fontSize: 18, color: C.ink, marginTop: 22 },
  about: { color: C.muted, marginTop: 4 },
  scroll: { flex: 1, backgroundColor: C.white },
  scrollContent: { paddingBottom: 28 },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 20,
    backgroundColor: C.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
});
