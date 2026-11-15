import { Stack, router } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Image } from "expo-image";
import type { ReactNode, Ref } from "react";
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

import { DoorMark } from "@/components/DoorMark";
import { colors, fonts, radius, space, type, withAlpha } from "@/theme";

export type Symbol = SymbolViewProps["name"];

const TIME_ZONE = "America/Los_Angeles";

export function formatWhen(ms: number) {
  const day = new Date(ms).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: TIME_ZONE,
  });
  const time = new Date(ms).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });
  return day + " · " + time;
}

export function formatDay(ms: number) {
  return new Date(ms).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: TIME_ZONE,
  });
}

export function timeAgo(ms: number) {
  const minutes = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.round(hours / 24);
  if (days < 7) return days + "d ago";
  return formatDay(ms);
}

export function LandlordScreen({
  children,
  scrollRef,
}: {
  children: ReactNode;
  scrollRef?: Ref<ScrollViewInstance>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        ref={scrollRef}
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xxxl },
        ]}
      >
        {children}
      </ScrollView>
    </>
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={count > 0 ? count + " approvals waiting" : "Approvals"}
      hitSlop={12}
      onPress={() => router.push("/landlord/approvals")}
    >
      <SymbolView
        name={{ ios: "bell", android: "notifications", web: "notifications" }}
        size={24}
        tintColor={colors.ink}
      />
      {count > 0 && <View style={styles.bellDot} />}
    </Pressable>
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

type ChipTone = "mint" | "lavender" | "neutral";

export function Chip({ label, tone = "neutral", icon }: { label: string; tone?: ChipTone; icon?: Symbol }) {
  return (
    <View style={[styles.chip, chipTones[tone]]}>
      {icon && <SymbolView name={icon} size={12} tintColor={tone === "lavender" ? colors.primary : colors.inkMuted} />}
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function AgentChip({ label }: { label: string }) {
  return (
    <View style={[styles.chip, chipTones.lavender]}>
      <Text style={styles.sparkle}>✦</Text>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function QuickAction({
  label,
  symbol,
  ai,
  badge,
  onPress,
}: {
  label: string;
  symbol: Symbol;
  ai?: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={badge ? label + ", " + badge + " waiting" : label}
      onPress={onPress}
      style={({ pressed }) => [styles.quick, ai && styles.quickAi, pressed && styles.pressed]}
    >
      <SymbolView name={symbol} size={24} tintColor={ai ? colors.primary : colors.ink} />
      <Text style={styles.quickLabel} numberOfLines={2}>
        {label}
      </Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
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

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <DoorMark size={56} strokeRatio={0.07} knobRatio={0.12} surface="transparent" />
      <Text style={[type.heading, styles.emptyTitle]}>{title}</Text>
      <Text style={[type.bodyMuted, styles.emptyBody]}>{body}</Text>
    </View>
  );
}

export function NoLandlord() {
  return (
    <EmptyState
      title="No properties yet"
      body="Once you list a place on Dweller, your units, inquiries and approvals show up here."
    />
  );
}

const chipTones = StyleSheet.create({
  mint: { backgroundColor: colors.mint },
  lavender: { backgroundColor: colors.lavender },
  neutral: { backgroundColor: withAlpha(colors.inkMuted, 0.08) },
});

const shadow = { boxShadow: "0px 4px 16px " + withAlpha(colors.ink, 0.07) };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, gap: space.lg },
  header: { gap: space.xs, marginBottom: space.sm },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 32, height: 32, justifyContent: "center", marginBottom: space.xs },
  bellDot: {
    position: "absolute",
    top: 0,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.canvas,
  },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: space.lg, gap: space.sm, ...shadow },
  pressed: { opacity: 0.7 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: space.sm,
  },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, color: colors.ink, letterSpacing: -0.4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: colors.ink },
  sparkle: { fontFamily: fonts.regular, fontSize: 11, color: colors.primary },
  quick: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: space.xs,
    ...shadow,
  },
  quickAi: { backgroundColor: colors.lavender },
  quickLabel: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 15, color: colors.ink, textAlign: "center" },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.white, fontVariant: ["tabular-nums"] },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: withAlpha(colors.sky, 0.45),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
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
  empty: { alignItems: "center", paddingVertical: space.xxxl, paddingHorizontal: space.xl, gap: space.sm },
  emptyTitle: { marginTop: space.md, textAlign: "center" },
  emptyBody: { textAlign: "center" },
});
