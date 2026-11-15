import type { FunctionReturnType } from "convex/server";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";

import { api } from "../../convex/_generated/api";
import { Chip } from "@/components/Chip";
import { AiMark } from "@/components/discovery/AiMark";
import { Icon } from "@/components/Icon";
import { availability, listingMeta, listingPlace, listingRent, sourceName } from "@/lib/listings";
import { colors, fonts, radius, shadow, space, type } from "@/theme";

export type FeedListing = FunctionReturnType<typeof api.listings.discover>[number];

function SaveButton({ initiallySaved }: { initiallySaved: boolean }) {
  const [saved, setSaved] = useState(initiallySaved);
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Pressable
      onPress={() => {
        setSaved((value) => !value);
        scale.set(withSequence(withTiming(1.2, { duration: 90 }), withSpring(1, { dampingRatio: 0.5, duration: 350 })));
      }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={saved ? "Remove from saved" : "Save"}
      accessibilityState={{ selected: saved }}
      style={styles.heart}
    >
      <Animated.View style={style}>
        <Icon
          name={
            saved
              ? { ios: "heart.fill", android: "favorite", web: "favorite" }
              : { ios: "heart", android: "favorite_border", web: "favorite_border" }
          }
          size={18}
          color={saved ? colors.primary : colors.ink}
        />
      </Animated.View>
    </Pressable>
  );
}

export function ListingCard({
  listing,
  now,
  saved = false,
}: {
  listing: FeedListing;
  now: number;
  saved?: boolean;
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
          <Icon name={{ ios: "photo", android: "image", web: "image" }} size={28} color={colors.inkMuted} />
        )}
        <SaveButton initiallySaved={saved} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.price, rent === "Rent unknown" && styles.unknown]}>{rent}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        <View style={styles.bottomRow}>
          <View style={styles.place}>
            <Icon name={{ ios: "mappin.and.ellipse", android: "location_on", web: "location_on" }} size={14} color={colors.inkMuted} />
            <Text style={type.caption} numberOfLines={1}>
              {place}
            </Text>
          </View>
          {available && <Chip tone="mint" label={available} />}
        </View>
        {listing.source !== "dweller" && (
          <View style={styles.source}>
            <AiMark label={`Imported from ${sourceName(listing.source)}`} />
            {missingCount > 0 && (
              <Text style={type.caption}>
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
    padding: space.sm,
    backgroundColor: colors.white,
    borderRadius: radius.card,
    boxShadow: shadow.card,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  photo: {
    aspectRatio: 4 / 3,
    borderRadius: radius.md - 2,
    overflow: "hidden",
    backgroundColor: colors.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  heart: {
    position: "absolute",
    top: space.md,
    right: space.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: shadow.float,
  },
  body: { paddingHorizontal: space.sm, paddingTop: space.md, paddingBottom: space.sm, gap: 4 },
  price: { ...type.price, fontSize: 20, lineHeight: 26 },
  unknown: { ...fonts.bold, color: colors.inkMuted },
  meta: { ...type.body, fontSize: 15, lineHeight: 21, fontVariant: ["tabular-nums"] },
  bottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm },
  place: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
  source: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space.sm },
});
