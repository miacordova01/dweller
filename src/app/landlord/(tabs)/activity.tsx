import { useQuery } from "convex/react";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { api } from "../../../../convex/_generated/api";
import { ActivityRow } from "@/components/ActivityRow";
import { ScreenTitle } from "@/components/ScreenTitle";
import { agentNames, describe } from "@/features/landlord/describe";
import { EmptyState, LandlordScreen, Loading, NoLandlord } from "@/features/landlord/ui";
import { timeAgo } from "@/lib/time";
import { space, type } from "@/theme";

const outcome = {
  approved: { label: "Approved", tone: "mint" },
  executed: { label: "Done", tone: "mint" },
  rejected: { label: "Declined", tone: "neutral" },
  failed: { label: "Didn't go through", tone: "neutral" },
} as const;

export default function LandlordActivity() {
  const actions = useQuery(api.landlord.activity);
  const inbox = useQuery(api.landlord.inbox);

  if (actions === undefined || inbox === undefined) {
    return (
      <LandlordScreen>
        <Loading />
      </LandlordScreen>
    );
  }
  if (actions === null || inbox === null) {
    return (
      <LandlordScreen>
        <NoLandlord />
      </LandlordScreen>
    );
  }

  const waiting = actions.filter((action) => action.status === "proposed");
  const recent = [
    ...actions
      .filter((action) => action.status !== "proposed")
      .map((action) => {
        const { headline, detail } = describe(action);
        const status = outcome[action.status as keyof typeof outcome];
        return {
          key: action._id,
          at: action.decidedAt ?? action.proposedAt,
          title: headline,
          detail: `${agentNames[action.capability]}${detail ? " · " + detail : ""}`,
          chip: status,
          onPress: undefined,
        };
      }),
    ...inbox
      .filter((inquiry) => inquiry.lastMessage?.authorRole === "agent")
      .map((inquiry) => ({
        key: inquiry._id,
        at: inquiry.lastMessageAt,
        title: `Leasing agent replied to ${inquiry.renterName}`,
        detail: inquiry.lastMessage?.text ?? null,
        chip: undefined,
        onPress: () => router.navigate("/landlord/inbox"),
      })),
  ].sort((a, b) => b.at - a.at);

  return (
    <LandlordScreen>
      <ScreenTitle title="Activity" subtitle="What your agents did, and what they're waiting on." />

      {waiting.length > 0 && (
        <View style={styles.group}>
          <Text style={type.section}>Waiting on you</Text>
          {waiting.map((action) => {
            const { headline, detail } = describe(action);
            return (
              <ActivityRow
                key={action._id}
                ai
                title={headline}
                detail={`${agentNames[action.capability]}${detail ? " · " + detail : ""}`}
                when={timeAgo(action.proposedAt)}
                chip={{ label: "Needs your OK", tone: "lavender" }}
                onPress={() => router.push("/landlord/approvals")}
              />
            );
          })}
        </View>
      )}

      <View style={styles.group}>
        <Text style={type.section}>Recent</Text>
        {recent.length === 0 ? (
          <EmptyState title="Nothing yet" body="As your agents reply, book and send things, a record of it lands here." />
        ) : (
          recent.map((item) => (
            <ActivityRow
              key={item.key}
              ai
              title={item.title}
              detail={item.detail}
              when={timeAgo(item.at)}
              chip={item.chip}
              onPress={item.onPress}
            />
          ))
        )}
      </View>
    </LandlordScreen>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.md, marginTop: space.sm },
});
