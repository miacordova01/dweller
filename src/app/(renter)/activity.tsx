import { useQuery } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../../convex/_generated/api";
import { ActivityRow } from "@/components/ActivityRow";
import { ScreenTitle } from "@/components/ScreenTitle";
import { formatRent, sourceName } from "@/lib/listings";
import { demoLease, longDate, nextTourAt, tourLabel } from "@/lib/renter";
import { timeAgo } from "@/lib/time";
import { colors, space, type } from "@/theme";

const openListing = (id: string) => router.push({ pathname: "/listing/[id]", params: { id } });

export default function RenterActivity() {
  const insets = useSafeAreaInsets();
  const listings = useQuery(api.listings.discover);
  const finds = useQuery(api.listings.myFinds);
  const [now] = useState(() => Date.now());

  const homes = (listings ?? []).filter((listing) => listing.photoUrl);
  const tourListing = homes[0];
  const leaseListing = homes[1];
  const lease = demoLease(now, leaseListing?.leaseTermMonths);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.md }]}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle title="Activity" subtitle="Everything Dweller is handling for you." />

      {listings === undefined || finds === undefined ? (
        <ActivityIndicator color={colors.inkMuted} style={styles.loading} />
      ) : (
        <>
          <Text style={[type.section, styles.section]}>In progress</Text>
          <View style={styles.list}>
            <ActivityRow
              testID="activity-repair"
              ai
              title="Dweller is getting a repair quote"
              detail="Kitchen sink is leaking · it will lock in a time once approved"
              chip={{ label: "Reviewing & scheduling", tone: "lavender" }}
              when="Today"
              onPress={() => router.push("/maintenance")}
            />
            {tourListing && (
              <ActivityRow
                icon={{ ios: "calendar", android: "calendar_today", web: "calendar_today" }}
                title={`Tour at ${tourListing.address}`}
                detail={tourLabel(nextTourAt(now))}
                chip={{ label: "Confirmed", tone: "mint" }}
                onPress={() => openListing(tourListing._id)}
              />
            )}
          </View>

          <Text style={[type.section, styles.section]}>Recent</Text>
          <View style={styles.list}>
            {leaseListing && (
              <ActivityRow
                icon={{ ios: "creditcard", android: "credit_card", web: "credit_card" }}
                title={`Rent paid · ${formatRent(leaseListing.rentMonthlyCents)}`}
                detail={`${leaseListing.address} · ${longDate(lease.lastPaid)}`}
                chip={{ label: "Paid", tone: "mint" }}
              />
            )}
            {finds.slice(0, 5).map((find) => (
              <ActivityRow
                key={find._id}
                ai
                title={`Imported from ${sourceName(find.source)}`}
                detail={find.title}
                when={timeAgo(find._creationTime)}
                onPress={() => openListing(find._id)}
              />
            ))}
            {!leaseListing && finds.length === 0 && (
              <Text style={type.bodyMuted}>Nothing yet. Saved homes, tours and payments will show up here.</Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, paddingBottom: space.xxl },
  loading: { marginTop: space.xxl },
  section: { marginTop: space.xl, marginBottom: space.md },
  list: { gap: space.md },
});
