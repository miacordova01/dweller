import { useMutation, useQuery } from "convex/react";
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
  timeAgo,
} from "@/features/landlord/ui";
import { agentNames, describe, type Approval } from "@/features/landlord/describe";
import { colors, fonts, radius, space, type } from "@/theme";

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
  quoteText: { ...fonts.regular, fontSize: 15, lineHeight: 22, color: colors.ink },
  reason: {
    flexDirection: "row",
    gap: space.sm,
    backgroundColor: colors.lavender,
    borderRadius: 12,
    padding: space.md,
  },
  sparkle: { ...fonts.regular, fontSize: 13, lineHeight: 20, color: colors.primary },
  reasonText: { flex: 1, ...fonts.regular, fontSize: 14, lineHeight: 20, color: colors.ink },
  error: { ...fonts.regular, fontSize: 14, color: colors.error },
  buttons: { flexDirection: "row", gap: space.md, marginTop: space.sm },
});
