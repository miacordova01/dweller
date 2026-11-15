import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../convex/_generated/api";
import { BellButton } from "@/components/BellButton";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { Icon } from "@/components/Icon";
import { QuickAction } from "@/components/QuickAction";
import { TopBar } from "@/components/TopBar";
import { formatRent } from "@/lib/listings";
import { demoLease, demoRenter, longDate, nextTourAt, shortDate, tourLabel } from "@/lib/renter";
import { colors, fonts, radius, space, type } from "@/theme";

export default function Home() {
  const insets = useSafeAreaInsets();
  const listings = useQuery(api.listings.discover, {});
  const [now] = useState(() => Date.now());

  const homes = (listings ?? []).filter((listing) => listing.photoUrl);
  const tourListing = homes[0];
  const leaseListing = homes[1];

  const tourAt = nextTourAt(now);
  const lease = demoLease(now, leaseListing?.leaseTermMonths);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md }]}
        showsVerticalScrollIndicator={false}
      >
        <TopBar
          right={
            <BellButton unread accessibilityLabel="Notifications, unread" onPress={() => router.navigate("/activity")} />
          }
        />

        <View style={styles.greeting}>
          <Text style={type.display}>Hi {demoRenter.name},</Text>
          <Text style={type.bodyMuted}>Here’s what’s happening at home.</Text>
        </View>

        <View style={styles.actions}>
          <QuickAction
            testID="quick-ai"
            ai
            icon={{ ios: "sparkles", android: "auto_awesome", web: "auto_awesome" }}
            label="AI Assist"
            onPress={() => router.push("/assistant")}
          />
          <QuickAction
            testID="quick-discover"
            icon={{ ios: "magnifyingglass", android: "search", web: "search" }}
            label="Discover"
            onPress={() => router.navigate("/")}
          />
          <QuickAction
            testID="quick-repair"
            icon={{ ios: "wrench.adjustable", android: "build", web: "build" }}
            label="Request Repair"
            onPress={() => router.push("/maintenance")}
          />
          <QuickAction
            testID="quick-rent"
            icon={{ ios: "creditcard", android: "credit_card", web: "credit_card" }}
            label="Pay Rent"
            onPress={() => Alert.alert("Pay rent", "Rent payments are coming soon.")}
          />
        </View>

        {listings === undefined ? (
          <ActivityIndicator color={colors.inkMuted} style={styles.loading} />
        ) : (
          <>
            <Text style={[type.section, styles.sectionTitle]}>Upcoming</Text>
            {tourListing ? (
              <Card
                testID="upcoming-tour"
                accessibilityLabel={`Tour at ${tourListing.address}`}
                onPress={() => router.push({ pathname: "/listing/[id]", params: { id: tourListing._id } })}
                style={styles.tourCard}
              >
                <Image source={{ uri: tourListing.photoUrl! }} style={styles.thumb} contentFit="cover" />
                <View style={styles.tourText}>
                  <Chip label="Tour" tone="lavender" icon={{ ios: "calendar", android: "calendar_today", web: "calendar_today" }} />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    Tour at {tourListing.address}
                  </Text>
                  <Text style={type.caption}>{tourLabel(tourAt)}</Text>
                </View>
                <Icon name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={14} color={colors.inkMuted} />
              </Card>
            ) : (
              <Text style={type.bodyMuted}>No tours booked yet.</Text>
            )}

            <View style={[styles.sectionHeader, styles.sectionTitle]}>
              <Text style={type.section}>My Lease</Text>
              {leaseListing && <Chip label="Active" tone="mint" />}
            </View>
            {leaseListing ? (
              <Card testID="my-lease" style={styles.leaseCard}>
                <View style={styles.leaseRow}>
                  <Icon name={{ ios: "doc.text", android: "description", web: "description" }} size={20} color={colors.inkMuted} />
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle}>{leaseListing.address}</Text>
                    <Text style={type.caption}>
                      {longDate(lease.start)} – {longDate(lease.end)}
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.rentRow}>
                  <View>
                    <Text style={type.caption}>Next rent</Text>
                    <Text style={styles.rent}>{formatRent(leaseListing.rentMonthlyCents)}</Text>
                  </View>
                  <Text style={type.caption}>Due {shortDate(lease.rentDue)}</Text>
                </View>
              </Card>
            ) : (
              <Text style={type.bodyMuted}>No active lease yet.</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, paddingBottom: space.xxl },
  greeting: { marginTop: space.xl, gap: space.xs },
  actions: { flexDirection: "row", gap: space.md, marginTop: space.xl },
  loading: { marginTop: space.xxl },
  sectionTitle: { marginTop: space.xl, marginBottom: space.md },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tourCard: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md },
  thumb: { width: 76, height: 76, borderRadius: radius.sm },
  tourText: { flex: 1, gap: 6 },
  cardTitle: { ...fonts.bold, fontSize: 15, lineHeight: 20, color: colors.ink },
  leaseCard: { padding: 0 },
  leaseRow: { flexDirection: "row", gap: space.md, padding: space.lg },
  flex: { flex: 1, gap: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline },
  rentRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", padding: space.lg },
  rent: { ...fonts.bold, fontSize: 24, lineHeight: 30, color: colors.ink, fontVariant: ["tabular-nums"] },
});
