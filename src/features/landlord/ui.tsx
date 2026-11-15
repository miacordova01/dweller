import { router } from "expo-router";
import { BottomTabBarHeightContext } from "expo-router/js-tabs";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Image } from "expo-image";
import { use, type ReactNode, type Ref } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BellButton as Bell } from "@/components/BellButton";
import { EmptyState } from "@/components/EmptyState";
import { colors, fonts, radius, shadow, space, type, withAlpha } from "@/theme";

export { Chip } from "@/components/Chip";
export { EmptyState } from "@/components/EmptyState";
export { QuickAction } from "@/components/QuickAction";
export { formatDay, formatWhen, timeAgo } from "@/lib/time";

export type Symbol = SymbolViewProps["name"];

export function LandlordScreen({
  children,
  scrollRef,
}: {
  children: ReactNode;
  scrollRef?: Ref<ScrollViewInstance>;
}) {
  const insets = useSafeAreaInsets();
  const inTabs = use(BottomTabBarHeightContext) !== undefined;
  return (
    <ScrollView
        ref={scrollRef}
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.md, paddingBottom: inTabs ? space.xxl : insets.bottom + space.xxxl },
        ]}
      >
        {children}
      </ScrollView>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      {router.canGoBack() && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.back}
        >
          <SymbolView
            name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
            size={20}
            tintColor={colors.ink}
          />
        </Pressable>
      )}
      <View style={styles.headerRow}>
        <Text style={type.title} accessibilityRole="header">
          {title}
        </Text>
        {right}
      </View>
      {subtitle ? <Text style={type.bodyMuted}>{subtitle}</Text> : null}
    </View>
  );
}

export function BellButton({ count }: { count: number }) {
  return (
    <Bell
      unread={count > 0}
      accessibilityLabel={count > 0 ? count + " approvals waiting" : "Approvals"}
      onPress={() => router.push("/landlord/approvals")}
    />
  );
}

export function Card({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

export function SectionHeading({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {right}
    </View>
  );
}

export function AgentChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.sparkle}>✦</Text>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function Thumb({ uri, size = 64 }: { uri: string | null | undefined; size?: number }) {
  return (
    <Image
      source={uri ? { uri } : undefined}
      style={{ width: size, height: size, borderRadius: radius.sm, backgroundColor: colors.lavender }}
      contentFit="cover"
      accessibilityIgnoresInvertColors
    />
  );
}

export function Chevron() {
  return (
    <SymbolView
      name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
      size={14}
      tintColor={colors.inkMuted}
    />
  );
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

export function ActionButton({
  label,
  variant,
  onPress,
  disabled,
}: {
  label: string;
  variant: "primary" | "secondary";
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        variant === "primary" ? styles.actionPrimary : styles.actionSecondary,
        (pressed || disabled) && styles.pressed,
      ]}
    >
      <Text style={[type.button, { color: variant === "primary" ? colors.white : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function Loading() {
  return <ActivityIndicator style={styles.loading} color={colors.inkMuted} />;
}

export function NoLandlord() {
  return (
    <EmptyState
      title="No properties yet"
      body="Once you list a place on Dweller, your units, inquiries and approvals show up here."
    />
  );
}


const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, gap: space.lg },
  header: { gap: space.xs, marginBottom: space.sm },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 32, height: 32, justifyContent: "center", marginBottom: space.xs },
  card: { backgroundColor: colors.white, borderRadius: radius.card, padding: space.lg, gap: space.sm, boxShadow: shadow.card },
  pressed: { opacity: 0.7 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: space.sm,
  },
  sectionTitle: type.section,
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.lavender,
  },
  chipText: { ...fonts.bold, fontSize: 12, lineHeight: 16, color: colors.ink },
  sparkle: { ...fonts.regular, fontSize: 11, color: colors.primary },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: withAlpha(colors.sky, 0.45),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...fonts.bold, fontSize: 15, color: colors.ink },
  action: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.lg,
  },
  actionPrimary: { backgroundColor: colors.blue },
  actionSecondary: {
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: withAlpha(colors.inkMuted, 0.25),
  },
  loading: { marginTop: space.xxxl },
});
