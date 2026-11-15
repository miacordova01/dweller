import type { FunctionReturnType } from "convex/server";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

import { api } from "../../convex/_generated/api";
import { AiMark } from "@/components/discovery/AiMark";
import { C, Glyph, Pill, T } from "@/components/DwellerUI";
import { availability, listingMeta, listingPlace, listingRent, sourceName } from "@/lib/listings";

export type FeedListing = FunctionReturnType<typeof api.listings.discover>[number];

export function SaveHeart({ saved, onToggle, size = 34 }: { saved: boolean; onToggle: () => void; size?: number }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return (
    <Pressable
      testID="save-heart"
      onPress={() => {
        onToggle();
        scale.set(withSequence(withTiming(1.22, { duration: 100 }), withSpring(1, { dampingRatio: 0.55, duration: 300 })));
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={saved ? "Remove from saved" : "Save"}
      accessibilityState={{ selected: saved }}
      style={[styles.heart, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Animated.View style={style}>
        <Glyph name={saved ? "heart.fill" : "heart"} size={size * 0.5} color={saved ? C.purple : C.ink} />
      </Animated.View>
    </Pressable>
  );
}

export function ListingCard({
  listing,
  now,
  saved,
  onToggleSave,
}: {
  listing: FeedListing;
  now: number;
  saved: boolean;
  onToggleSave: () => void;
}) {
  const rent = listingRent(listing);
  const meta = listingMeta(listing);
  const place = listingPlace(listing) || "Location unknown";
  const available = availability(listing.availableFrom, now);
  const missingCount = listing.missingFields.length;

  return (
    <Pressable
      testID={`listing-card-${listing._id}`}
      onPress={() => router.push({ pathname: "/listing/[id]", params: { id: listing._id } })}
      accessibilityRole="button"
      accessibilityLabel={[rent, meta, place].filter(Boolean).join(", ")}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.photo}>
        {listing.photoUrl ? (
          <Image source={{ uri: listing.photoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <Glyph name="photo" size={28} color={C.muted} />
        )}
        <View style={styles.heartSlot}>
          <SaveHeart saved={saved} onToggle={onToggleSave} />
        </View>
      </View>
      <View style={styles.body}>
        <Text style={[styles.price, rent === "Rent unknown" && styles.unknown]}>{rent}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        <View style={styles.bottomRow}>
          <View style={styles.place}>
            <Glyph name="mappin" size={13} color={C.muted} />
            <Text style={T.muted} numberOfLines={1}>
              {place}
            </Text>
          </View>
          {available && <Pill tone="mint" label={available} />}
        </View>
        {listing.source !== "dweller" && (
          <View style={styles.source}>
            <AiMark label={`Imported from ${sourceName(listing.source)}`} />
            {missingCount > 0 && (
              <Text style={T.muted}>
                {missingCount} detail{missingCount === 1 ? "" : "s"} missing
              </Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    overflow: "hidden",
    shadowColor: C.ink,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  pressed: { opacity: 0.92 },
  photo: { aspectRatio: 1.62, backgroundColor: C.lavender, alignItems: "center", justifyContent: "center" },
  heartSlot: { position: "absolute", top: 12, right: 12 },
  heart: {
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.ink,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  body: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 3 },
  price: { ...T.price, fontSize: 22, lineHeight: 28, fontVariant: ["tabular-nums"] },
  unknown: { color: C.muted },
  meta: { ...T.body, fontSize: 15, lineHeight: 21, fontVariant: ["tabular-nums"] },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 2 },
  place: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 1 },
  source: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
});
