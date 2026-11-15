import { useQuery } from "convex/react";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../convex/_generated/api";
import { BellButton } from "@/components/BellButton";
import { Card } from "@/components/Card";
import { Chip } from "@/components/Chip";
import { Icon } from "@/components/Icon";
import { QuickAction } from "@/components/QuickAction";
import { TopBar } from "@/components/TopBar";
import { formatRent } from "@/lib/listings";
import { Screen } from "@/components/DwellerUI";
import { demoRenter, longDate, shortDate } from "@/lib/renter";
import { colors, fonts, radius, space, type, withAlpha } from "@/theme";

export default function Home() {
  const insets = useSafeAreaInsets();
  const tours = useQuery(api.tours.mine);
  const lease = useQuery(api.people.currentLease);
  const [now] = useState(() => Date.now());

  const tour = tours?.find(
    (t) =>
      t.scheduledFor > now &&
      (t.status === "proposed" || t.status === "confirmed"),
  );
  const rentDue = lease ? nextDue(now, lease.dueDayOfMonth) : null;

  return (
    <Screen bare tab="Home">
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + space.md },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            pointerEvents="none"
            style={[
              styles.hero,
              { top: -(insets.top + space.md), height: insets.top + 300 },
            ]}
          >
            <Image
              source={require("@/assets/images/welcome-victorians.jpg")}
              style={styles.heroPhoto}
              contentFit="cover"
            />
            <View style={styles.heroFade} />
          </View>
          <TopBar
            right={
              <BellButton
                unread
                accessibilityLabel="Notifications, unread"
                onPress={() => router.navigate("/activity")}
              />
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
              icon={{
                ios: "sparkles",
                android: "auto_awesome",
                web: "auto_awesome",
              }}
              label="AI Assist"
              onPress={() => router.push("/assistant")}
            />
            <QuickAction
              testID="quick-discover"
              icon={{
                ios: "magnifyingglass",
                android: "search",
                web: "search",
              }}
              label="Discover"
              onPress={() => router.navigate("/")}
            />
            <QuickAction
              testID="quick-repair"
              icon={{
                ios: "wrench.adjustable",
                android: "build",
                web: "build",
              }}
              label="Request Repair"
              onPress={() => router.push("/maintenance")}
            />
            <QuickAction
              testID="quick-rent"
              icon={{
                ios: "creditcard",
                android: "credit_card",
                web: "credit_card",
              }}
              label="Pay Rent"
              onPress={() => router.push("/payments")}
            />
          </View>

          {tours === undefined || lease === undefined ? (
            <ActivityIndicator color={colors.inkMuted} style={styles.loading} />
          ) : (
            <>
              <Text style={[type.section, styles.sectionTitle]}>Upcoming</Text>
              {tour ? (
                <Card
                  testID="upcoming-tour"
                  accessibilityLabel={`Tour at ${tour.address}`}
                  onPress={() =>
                    router.push({
                      pathname: "/listing/[id]",
                      params: { id: tour.listingId },
                    })
                  }
                  style={styles.tourCard}
                >
                  {tour.photoUrl ? (
                    <Image
                      source={{ uri: tour.photoUrl }}
                      style={styles.thumb}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.thumb, styles.thumbEmpty]} />
                  )}
                  <View style={styles.tourText}>
                    <Chip
                      label={
                        tour.status === "confirmed"
                          ? "Tour"
                          : "Tour · awaiting approval"
                      }
                      tone="lavender"
                      icon={{
                        ios: "calendar",
                        android: "calendar_today",
                        web: "calendar_today",
                      }}
                    />
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      Tour at {tour.address}
                    </Text>
                    <Text style={type.caption}>
                      {new Date(tour.scheduledFor).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  <Icon
                    name={{
                      ios: "chevron.right",
                      android: "chevron_right",
                      web: "chevron_right",
                    }}
                    size={14}
                    color={colors.inkMuted}
                  />
                </Card>
              ) : (
                <Text style={type.bodyMuted}>No tours booked yet.</Text>
              )}

              <View style={[styles.sectionHeader, styles.sectionTitle]}>
                <Text style={type.section}>My Lease</Text>
                {lease && <Chip label="Active" tone="mint" />}
              </View>
              {lease && rentDue ? (
                <Card testID="my-lease" style={styles.leaseCard}>
                  <View style={styles.leaseRow}>
                    <Icon
                      name={{
                        ios: "doc.text",
                        android: "description",
                        web: "description",
                      }}
                      size={20}
                      color={colors.inkMuted}
                    />
                    <View style={styles.flex}>
                      <Text style={styles.cardTitle}>{lease.address}</Text>
                      <Text style={type.caption}>
                        {longDate(lease.startDate)} – {longDate(lease.endDate)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.rentRow}>
                    <View>
                      <Text style={type.caption}>Next rent</Text>
                      <Text style={styles.rent}>
                        {formatRent(lease.rentMonthlyCents)}
                      </Text>
                    </View>
                    <Text style={type.caption}>Due {shortDate(rentDue)}</Text>
                  </View>
                </Card>
              ) : (
                <Text style={type.bodyMuted}>No active lease yet.</Text>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

function nextDue(now: number, day: number) {
  const d = new Date(now);
  const today = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const due = new Date(d.getFullYear(), d.getMonth(), day);
  if (due < today) due.setMonth(due.getMonth() + 1);
  return due.getTime();
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, paddingBottom: space.xxl },
  hero: { position: "absolute", left: 0, right: 0 },
  heroPhoto: { ...StyleSheet.absoluteFill, opacity: 0.22 },
  heroFade: {
    ...StyleSheet.absoluteFill,
    experimental_backgroundImage: `linear-gradient(180deg, ${withAlpha(colors.canvas, 0.35)} 0%, ${withAlpha(colors.canvas, 0.75)} 55%, ${colors.canvas} 100%)`,
  },
  greeting: { marginTop: space.xl, gap: space.xs },
  actions: { flexDirection: "row", gap: space.md, marginTop: space.xl },
  loading: { marginTop: space.xxl },
  sectionTitle: { marginTop: space.xl, marginBottom: space.md },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tourCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
  },
  thumb: { width: 76, height: 76, borderRadius: radius.sm },
  thumbEmpty: { backgroundColor: colors.lavender },
  tourText: { flex: 1, gap: 6 },
  cardTitle: { ...fonts.bold, fontSize: 15, lineHeight: 20, color: colors.ink },
  leaseCard: { padding: 0 },
  leaseRow: { flexDirection: "row", gap: space.md, padding: space.lg },
  flex: { flex: 1, gap: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
  },
  rentRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: space.lg,
  },
  rent: {
    ...fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.ink,
    fontVariant: ["tabular-nums"],
  },
});
