import { useQuery } from "convex/react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import {
  Avatar,
  Card,
  Chip,
  EmptyState,
  LandlordScreen,
  Loading,
  NoLandlord,
  ScreenHeader,
  timeAgo,
} from "@/features/landlord/ui";
import { colors, fonts, space, type } from "@/theme";

const statusLabels: Record<Doc<"inquiries">["status"], string> = {
  open: "Agent replying",
  touring: "Touring",
  applied: "Applied",
  closed: "Closed",
};

export default function LandlordInbox() {
  const inquiries = useQuery(api.landlord.inbox);

  if (inquiries === undefined) {
    return (
      <LandlordScreen>
        <Loading />
      </LandlordScreen>
    );
  }
  if (inquiries === null) {
    return (
      <LandlordScreen>
        <NoLandlord />
      </LandlordScreen>
    );
  }

  const active = inquiries.filter((i) => i.status !== "closed").length;

  return (
    <LandlordScreen>
      <ScreenHeader
        title="Inbox"
        subtitle={
          active === 0
            ? "No open conversations right now."
            : "Your leasing agent is handling " + active + (active === 1 ? " conversation." : " conversations.")
        }
      />
      {inquiries.length === 0 ? (
        <EmptyState
          title="No inquiries yet"
          body="When renters ask about your listings, the leasing agent answers and the thread shows up here."
        />
      ) : (
        inquiries.map((inquiry) => (
          <Card key={inquiry._id}>
            <View style={styles.row}>
              <Avatar name={inquiry.renterName} />
              <View style={styles.text}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {inquiry.renterName}
                  </Text>
                  <Text style={type.caption}>{timeAgo(inquiry.lastMessageAt)}</Text>
                </View>
                <Text style={type.caption} numberOfLines={1}>
                  {inquiry.listing ? inquiry.listing.address + " · " + inquiry.listing.neighborhood : "Listing removed"}
                </Text>
              </View>
            </View>
            {inquiry.lastMessage && (
              <Text style={styles.message} numberOfLines={2}>
                {inquiry.lastMessage.authorRole === "agent" && <Text style={styles.agent}>✦ Dweller: </Text>}
                {inquiry.lastMessage.text}
              </Text>
            )}
            <Chip tone={inquiry.status === "applied" ? "mint" : "neutral"} label={statusLabels[inquiry.status]} />
          </Card>
        ))
      )}
    </LandlordScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  text: { flex: 1, gap: 2 },
  nameRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: space.sm },
  name: { ...type.label, fontSize: 16, lineHeight: 22, flexShrink: 1 },
  message: { ...fonts.regular, fontSize: 15, lineHeight: 21, color: colors.ink },
  agent: { ...fonts.bold, color: colors.primary },
});
