import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ConvexError } from "convex/values";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeOut, LinearTransition } from "react-native-reanimated";

import { api } from "../../../convex/_generated/api";
import {
  ActionButton,
  AgentChip,
  Card,
  Chip,
  EmptyState,
  LandlordScreen,
  Loading,
  NoLandlord,
  ScreenHeader,
  Thumb,
  formatDay,
  formatWhen,
  timeAgo,
} from "@/features/landlord/ui";
import { formatRent } from "@/lib/listings";
import { colors, fonts, radius, space, type } from "@/theme";

type Approval = NonNullable<FunctionReturnType<typeof api.landlord.approvals>>[number];

const agentNames: Record<Approval["capability"], string> = {
  leasing: "Leasing agent",
  maintenance: "Maintenance agent",
  rent: "Rent agent",
  discovery: "Discovery agent",
};

function describe(item: Approval) {
  switch (item.kind) {
    case "bookTour":
      return {
        headline: "Book a tour with " + item.renterName,
        detail: formatWhen(item.scheduledFor) + " · " + item.durationMinutes + " min",
      };
    case "acceptVendorQuote":
      return {
        headline: "Accept " + item.vendorName + "'s " + formatRent(item.quoteCents) + " repair quote",
        detail: "Visit " + formatWhen(item.slot),
      };
    case "sendRentReminder":
      return {
        headline:
          "Remind " + item.tenantName + " that " + formatRent(item.amountCents) + " rent is due" +
          (item.dueDate ? " " + formatDay(item.dueDate) : ""),
        detail: "Sends " + formatWhen(item.sendAt),
      };
    default:
      return { headline: "Run " + item.tool, detail: null };
  }
}

function ApprovalCard({ item }: { item: Approval }) {
  const approve = useMutation(api.landlord.approve);
  const decline = useMutation(api.landlord.decline);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { headline, detail } = describe(item);

  async function decide(run: typeof approve) {
    setBusy(true);
    setError(null);
    try {
      await run({ actionId: item._id });
    } catch (e) {
      setError(e instanceof ConvexError ? String(e.data) : "Couldn't save that. Try again.");
      setBusy(false);
    }
  }

  const ticket = item.kind === "acceptVendorQuote" ? item.ticket : null;

  return (
    <Animated.View exiting={FadeOut.duration(220)} layout={LinearTransition}>
      <Card>
        <View style={styles.cardTop}>
          <AgentChip label={agentNames[item.capability]} />
          <Text style={type.caption}>{timeAgo(item.proposedAt)}</Text>
        </View>
        <Text style={styles.headline}>{headline}</Text>
        {detail && <Text style={styles.detail}>{detail}</Text>}

        {item.listing && (
          <View style={styles.context}>
            <Thumb uri={item.listing.photoUrl} size={52} />
            <View style={styles.contextText}>
              <Text style={styles.contextTitle} numberOfLines={1}>
                {ticket ? ticket.title : item.listing.address}
              </Text>
              <Text style={type.caption} numberOfLines={1}>
                {ticket ? item.listing.address + " · reported by " + ticket.tenantName : item.listing.neighborhood}
              </Text>
            </View>
            {ticket && (ticket.urgency === "high" || ticket.urgency === "emergency") && (
              <Chip label={ticket.urgency === "high" ? "High" : "Emergency"} />
            )}
          </View>
        )}

        {item.kind === "sendRentReminder" && item.message && (
          <View style={styles.quote}>
            <Text style={styles.quoteText}>“{item.message}”</Text>
          </View>
        )}

        {item.reason && (
          <View style={styles.reason}>
            <Text style={styles.sparkle}>✦</Text>
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.buttons}>
          <ActionButton label="Decline" variant="secondary" disabled={busy} onPress={() => decide(decline)} />
          <ActionButton label="Approve" variant="primary" disabled={busy} onPress={() => decide(approve)} />
        </View>
      </Card>
    </Animated.View>
  );
}

export default function LandlordApprovals() {
  const items = useQuery(api.landlord.approvals);

  if (items === undefined) {
    return (
      <LandlordScreen>
        <Loading />
      </LandlordScreen>
    );
  }
  if (items === null) {
    return (
      <LandlordScreen>
        <NoLandlord />
      </LandlordScreen>
    );
  }

  return (
    <LandlordScreen>
      <ScreenHeader
        title="Approvals"
        subtitle="Your agents prepared these. Nothing happens until you decide."
        right={items.length > 0 ? <Chip tone="lavender" label={items.length + " waiting"} /> : undefined}
      />
      {items.length === 0 ? (
        <Animated.View layout={LinearTransition}>
          <EmptyState
            title="You're all caught up"
            body="When an agent wants to book, spend or send something on your behalf, it will wait here for your OK."
          />
        </Animated.View>
      ) : (
        items.map((item) => <ApprovalCard key={item._id} item={item} />)
      )}
    </LandlordScreen>
  );
}

const styles = StyleSheet.create({
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headline: { ...type.heading, marginTop: space.xs },
  detail: { ...type.body, fontSize: 15, lineHeight: 20, color: colors.inkMuted },
  context: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: colors.canvas,
    borderRadius: radius.md,
    padding: space.sm,
    marginTop: space.xs,
  },
  contextText: { flex: 1, gap: 2 },
  contextTitle: { ...type.label },
  quote: {
    borderLeftWidth: 2,
    borderLeftColor: colors.hairline,
    paddingLeft: space.md,
    paddingVertical: 2,
  },
  quoteText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.ink },
  reason: {
    flexDirection: "row",
    gap: space.sm,
    backgroundColor: colors.lavender,
    borderRadius: 12,
    padding: space.md,
  },
  sparkle: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: colors.primary },
  reasonText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.ink },
  error: { fontFamily: fonts.regular, fontSize: 14, color: colors.error },
  buttons: { flexDirection: "row", gap: space.md, marginTop: space.sm },
});
