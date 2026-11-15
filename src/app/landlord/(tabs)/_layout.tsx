import { Tabs } from "expo-router/js-tabs";

import { TabBar, type TabIcons } from "@/components/TabBar";
import { colors } from "@/theme";

const icons: TabIcons = {
  overview: {
    icon: { ios: "square.grid.2x2", android: "dashboard", web: "dashboard" },
    activeIcon: { ios: "square.grid.2x2.fill", android: "dashboard", web: "dashboard" },
  },
  properties: {
    icon: { ios: "building.2", android: "apartment", web: "apartment" },
    activeIcon: { ios: "building.2.fill", android: "apartment", web: "apartment" },
  },
  inbox: {
    icon: { ios: "tray", android: "inbox", web: "inbox" },
    activeIcon: { ios: "tray.fill", android: "inbox", web: "inbox" },
  },
  activity: {
    icon: { ios: "bolt", android: "bolt", web: "bolt" },
    activeIcon: { ios: "bolt.fill", android: "bolt", web: "bolt" },
  },
  profile: {
    icon: { ios: "person", android: "person_outline", web: "person_outline" },
    activeIcon: { ios: "person.fill", android: "person", web: "person" },
  },
};

export default function LandlordTabs() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} icons={icons} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.canvas } }}
    >
      <Tabs.Screen name="overview" options={{ title: "Overview" }} />
      <Tabs.Screen name="properties" options={{ title: "Properties" }} />
      <Tabs.Screen name="inbox" options={{ title: "Inbox" }} />
      <Tabs.Screen name="activity" options={{ title: "Activity" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
