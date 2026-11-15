import { useQuery } from "convex/react";
import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { api } from "../../convex/_generated/api";
import { ActivityRow } from "@/components/ActivityRow";
import { C, Screen, Section, T } from "@/components/DwellerUI";
import { sourceName } from "@/lib/listings";
import { timeAgo } from "@/lib/time";

const openListing = (id: string) => router.push({ pathname: "/listing/[id]", params: { id } });

function when(ms: number) {
  return new Date(ms).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const tourChip = {
  proposed: { label: "Awaiting approval", tone: "lavender" },
  confirmed: { label: "Confirmed", tone: "mint" },
  declined: { label: "Declined", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  completed: { label: "Done", tone: "neutral" },
} as const;

const ticketChip = (status: string) =>
  status === "resolved" || status === "closed"
    ? ({ label: "Done", tone: "mint" } as const)
    : status === "scheduled" || status === "in_progress"
      ? ({ label: "Scheduled", tone: "lavender" } as const)
      : ({ label: "Reviewing", tone: "lavender" } as const);

export default function RenterActivity() {
  const tours = useQuery(api.tours.mine);
  const tickets = useQuery(api.maintenance.mine);
  const finds = useQuery(api.listings.myFinds);

  if (tours === undefined || tickets === undefined || finds === undefined) {
    return (
      <Screen tab="Activity" title="Activity">
        <ActivityIndicator color={C.muted} />
      </Screen>
    );
  }

  return (
    <Screen tab="Activity" title="Activity">
      <Text style={[T.muted, styles.subtitle]}>Everything Dweller is handling for you.</Text>

      <Section title="Tours" />
      <View style={styles.list}>
        {tours.length === 0 ? (
          <Text style={T.muted}>No tours yet. Ask Dweller AI to book one from any listing.</Text>
        ) : (
          tours.map((tour) => (
            <ActivityRow
              key={tour._id}
              icon={{ ios: "calendar", android: "calendar_today", web: "calendar_today" }}
              ai={tour.proposedBy === "agent"}
              title={`Tour at ${tour.address}`}
              detail={when(tour.scheduledFor)}
              chip={tourChip[tour.status as keyof typeof tourChip] ?? { label: tour.status, tone: "neutral" }}
              onPress={() => openListing(tour.listingId)}
            />
          ))
        )}
      </View>

      <Section title="Repairs" />
      <View style={styles.list}>
        {tickets.length === 0 ? (
          <Text style={T.muted}>No repair requests.</Text>
        ) : (
          tickets.slice(0, 5).map((ticket) => (
            <ActivityRow
              key={ticket._id}
              icon={{ ios: "wrench", android: "build", web: "build" }}
              title={ticket.title}
              detail={timeAgo(ticket._creationTime)}
              chip={ticketChip(ticket.status)}
              onPress={() => router.push("/maintenance")}
            />
          ))
        )}
      </View>

      {finds.length > 0 && (
        <>
          <Section title="Imported" />
          <View style={styles.list}>
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
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subtitle: { marginTop: -10 },
  list: { gap: 12, marginTop: -6 },
});
