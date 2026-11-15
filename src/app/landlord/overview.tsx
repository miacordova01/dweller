import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useRef } from "react";
import { StyleSheet, Text, View, type ScrollViewInstance } from "react-native";

import { api } from "../../../convex/_generated/api";
import { Wordmark } from "@/components/Wordmark";
import {
  AgentChip,
  BellButton,
  Card,
  Chevron,
  Chip,
  EmptyState,
  LandlordScreen,
  Loading,
  NoLandlord,
  QuickAction,
  SectionHeading,
  Thumb,
  timeAgo,
} from "@/features/landlord/ui";
import { formatRent } from "@/lib/listings";
import { colors, fonts, space, type } from "@/theme";

function monthName(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1, 15)).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
}

export default function LandlordOverview() {
  const data = useQuery(api.landlord.overview);
  const scrollRef = useRef<ScrollViewInstance>(null);

  if (data === undefined) {
    return (
      <LandlordScreen>
        <Loading />
      </LandlordScreen>
    );
  }
  if (data === null) {
    return (
      <LandlordScreen>
        <NoLandlord />
      </LandlordScreen>
    );
  }

  const { rent } = data;
  const allPaid = rent.leaseCount > 0 && rent.paidCount === rent.leaseCount;

  return (
    <LandlordScreen scrollRef={scrollRef}>
      <View style={styles.top}>
        <Wordmark fontSize={30} />
        <BellButton count={data.approvalCount} />
      </View>

      <View style={styles.greeting}>
        <Text style={type.display}>Hi {data.name},</Text>
        <Text style={type.bodyMuted}>Here&apos;s what needs you.</Text>
      </View>

      <View style={styles.quickRow}>
        <QuickAction
          label="AI Assist"
          ai
          symbol={{ ios: "sparkles", android: "auto_awesome", web: "auto_awesome" }}
          onPress={() => router.push("/assistant")}
        />
        <QuickAction
          label="Add listing"
          symbol={{ ios: "plus.square", android: "add_home", web: "add_home" }}
          onPress={() => router.push("/")}
        />
        <QuickAction
          label="Approvals"
          badge={data.approvalCount}
          symbol={{ ios: "checkmark.seal", android: "fact_check", web: "fact_check" }}
          onPress={() => router.push("/landlord/approvals")}
        />
        <QuickAction
          label="Rent"
          symbol={{ ios: "creditcard", android: "credit_card", web: "credit_card" }}
          onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
        />
      </View>

      <SectionHeading title="Waiting on you" />
      {data.waiting.length === 0 ? (
        <Card>
          <EmptyState title="Nothing waiting on you" body="Your agents are handling everything else." />
        </Card>
      ) : (
        data.waiting.map((item) =>
          item.kind === "application" ? (
            <Card
              key={item.id}
              accessibilityLabel={item.renterName + " applied"}
              onPress={() => router.push("/landlord/inbox")}
            >
              <View style={styles.row}>
                <Thumb uri={item.listing?.photoUrl} />
                <View style={styles.rowText}>
                  <Chip label="Application" tone="lavender" icon={{ ios: "doc.text", android: "description", web: "description" }} />
                  <Text style={styles.rowTitle}>{item.renterName} applied</Text>
                  <Text style={type.caption}>
                    {item.listing?.address} · {timeAgo(item.at)}
                  </Text>
                </View>
                <Chevron />
              </View>
              {item.summary && (
                <View style={styles.summary}>
                  <Text style={styles.sparkle}>✦</Text>
                  <Text style={styles.summaryText}>{item.summary}</Text>
                </View>
              )}
            </Card>
          ) : (
            <Card
              key={item.id}
              accessibilityLabel={"Repair quote from " + item.vendorName}
              onPress={() => router.push("/landlord/approvals")}
            >
              <View style={styles.row}>
                <Thumb uri={item.listing?.photoUrl} />
                <View style={styles.rowText}>
                  <AgentChip label="Repair quote" />
                  <Text style={styles.rowTitle}>
                    {item.vendorName} · {formatRent(item.amountCents)}
                  </Text>
                  <Text style={type.caption} numberOfLines={1}>
                    {item.ticketTitle} · {item.listing?.address}
                  </Text>
                </View>
                <Chevron />
              </View>
            </Card>
          ),
        )
      )}

      <SectionHeading
        title={"Rent · " + monthName(rent.month)}
        right={
          rent.leaseCount > 0 ? (
            <Chip tone={allPaid ? "mint" : "neutral"} label={allPaid ? "All collected" : rent.paidCount + " of " + rent.leaseCount + " paid"} />
          ) : undefined
        }
      />
      <Card>
        <Text style={type.caption}>Collected</Text>
        <View style={styles.rentRow}>
          <Text style={styles.rentAmount}>{formatRent(rent.collectedCents)}</Text>
          <Text style={type.caption}>
            of {formatRent(rent.expectedCents)} · {rent.leaseCount} {rent.leaseCount === 1 ? "lease" : "leases"}
          </Text>
        </View>
      </Card>
    </LandlordScreen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  greeting: { gap: space.xs, marginTop: space.md },
  quickRow: { flexDirection: "row", gap: space.md, marginTop: space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  rowText: { flex: 1, gap: 4 },
  rowTitle: { ...type.label, fontSize: 16, lineHeight: 22 },
  summary: {
    flexDirection: "row",
    gap: space.sm,
    backgroundColor: colors.lavender,
    borderRadius: 12,
    padding: space.md,
  },
  sparkle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.primary },
  summaryText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.ink },
  rentRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  rentAmount: { ...type.price, fontSize: 28, lineHeight: 34 },
});
