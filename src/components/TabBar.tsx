import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { Icon, type IconName } from "@/components/Icon";
import { colors, fonts, radius, space } from "@/theme";

export type TabIcons = Record<string, { icon: IconName; activeIcon: IconName }>;

function TabItem({
  label,
  icon,
  focused,
  index,
  count,
  onPress,
  onLongPress,
}: {
  label: string;
  icon: IconName;
  focused: boolean;
  index: number;
  count: number;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(focused ? 1 : 0, { duration: 180 }));
  }, [focused, progress]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scaleX: 0.8 + progress.get() * 0.2 }],
  }));

  return (
    <Pressable
      testID={`tab-${label.toLowerCase()}`}
      role="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={`${label}, tab, ${index + 1} of ${count}`}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.item, pressed && !focused && styles.pressed]}
    >
      <View style={styles.inner}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.pill, pillStyle]} />
        <Icon name={icon} size={22} color={focused ? colors.primary : colors.inkMuted} />
        <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

export function TabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
  icons,
}: BottomTabBarProps & { icons: TabIcons }) {
  return (
    <View role="tablist" style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
      {state.routes.map((route, index) => {
        const focused = index === state.index;
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const { icon, activeIcon } = icons[route.name];
        return (
          <TabItem
            key={route.key}
            label={label}
            icon={focused ? activeIcon : icon}
            focused={focused}
            index={index}
            count={state.routes.length}
            onPress={() => {
              const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            }}
            onLongPress={() => emitter.emit({ type: "tabLongPress", target: route.key })}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    paddingTop: space.sm,
    paddingHorizontal: space.sm,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  item: { flex: 1, alignItems: "center" },
  pressed: { opacity: 0.6 },
  inner: {
    alignItems: "center",
    gap: 3,
    minWidth: 64,
    paddingHorizontal: space.sm,
    paddingTop: 7,
    paddingBottom: 6,
  },
  pill: { backgroundColor: colors.lavender, borderRadius: radius.md },
  label: { ...fonts.regular, fontSize: 11, lineHeight: 14, color: colors.inkMuted },
  labelActive: { ...fonts.bold, color: colors.primary },
});
