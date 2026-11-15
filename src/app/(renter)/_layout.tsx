import { Tabs } from "expo-router/js-tabs";

import { TabBar, type TabIcons } from "@/components/TabBar";
import { colors } from "@/theme";

const icons: TabIcons = {
  index: {
    icon: { ios: "magnifyingglass", android: "search", web: "search" },
    activeIcon: { ios: "magnifyingglass", android: "search", web: "search" },
  },
  saved: {
    icon: { ios: "heart", android: "favorite_border", web: "favorite_border" },
    activeIcon: { ios: "heart.fill", android: "favorite", web: "favorite" },
  },
  activity: {
    icon: { ios: "bolt", android: "bolt", web: "bolt" },
    activeIcon: { ios: "bolt.fill", android: "bolt", web: "bolt" },
  },
  home: {
    icon: { ios: "house", android: "home", web: "home" },
    activeIcon: { ios: "house.fill", android: "home", web: "home" },
  },
  profile: {
    icon: { ios: "person", android: "person_outline", web: "person_outline" },
    activeIcon: { ios: "person.fill", android: "person", web: "person" },
  },
};

export default function RenterTabs() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} icons={icons} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.canvas } }}
    >
      <Tabs.Screen name="index" options={{ title: "Discover" }} />
      <Tabs.Screen name="saved" options={{ title: "Saved" }} />
      <Tabs.Screen name="activity" options={{ title: "Activity" }} />
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
