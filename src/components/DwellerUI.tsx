import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import { SymbolView, type SFSymbol } from "expo-symbols";

import { Wordmark } from "@/components/Wordmark";
import { fonts } from "@/theme";

export const C = {
  ink: "#0B1020",
  purple: "#7C3AED",
  blue: "#477CF5",
  sky: "#A7D8FF",
  skySoft: "#DDF0FF",
  lavender: "#F1EDFF",
  canvas: "#FAFBFF",
  mint: "#D9FBE9",
  mintInk: "#13745B",
  success: "#14A87D",
  muted: "#5A6478",
  line: "#E5E5F2",
  lineSoft: "#F0EEF7",
  tabLine: "#F1EFF7",
  actionBorder: "#C9BDFB",
  white: "#FFFFFF",
} as const;

export const T = StyleSheet.create({
  h1: { ...fonts.bold, fontSize: 30, lineHeight: 36, letterSpacing: -1.1, color: C.ink },
  h2: { ...fonts.bold, fontSize: 20, lineHeight: 27, letterSpacing: -0.4, color: C.ink },
  body: { ...fonts.regular, fontSize: 14, lineHeight: 21, color: C.ink },
  muted: { ...fonts.regular, fontSize: 13, lineHeight: 19, color: C.muted },
  label: { ...fonts.bold, fontSize: 14, color: C.ink },
  price: { ...fonts.bold, fontSize: 25, letterSpacing: -0.7, color: C.ink },
});

const androidNames: Record<string, string> = {
  bell: "notifications",
  house: "home",
  "house.fill": "home",
  heart: "favorite_border",
  "heart.fill": "favorite",
  person: "person",
  "person.fill": "person",
  "person.2": "group",
  magnifyingglass: "search",
  sparkles: "auto_awesome",
  wrench: "build",
  "wrench.adjustable": "build",
  creditcard: "credit_card",
  "chevron.right": "chevron_right",
  "chevron.left": "arrow_back",
  "chevron.down": "expand_more",
  calendar: "calendar_today",
  "checkmark.circle.fill": "check_circle",
  doc: "description",
  "doc.text": "description",
  plus: "add",
  building: "apartment",
  "building.2": "apartment",
  tray: "inbox",
  clock: "schedule",
  bolt: "bolt",
  "slider.horizontal.3": "tune",
  "mappin.and.ellipse": "location_on",
  "square.and.arrow.up": "share",
};

export function Glyph({ name, size = 20, color = C.ink }: { name: string; size?: number; color?: string }) {
  const fallback = androidNames[name] ?? name;
  return (
    <SymbolView
      name={{ ios: name as SFSymbol, android: fallback, web: fallback } as never}
      size={size}
      tintColor={color}
    />
  );
}

export function Panel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

const pillTones = {
  lavender: { backgroundColor: C.lavender, color: C.purple },
  mint: { backgroundColor: C.mint, color: C.mintInk },
  sky: { backgroundColor: C.skySoft, color: C.purple },
} as const;

export function Pill({ label, tone = "lavender" }: { label: string; tone?: keyof typeof pillTones }) {
  const { backgroundColor, color } = pillTones[tone];
  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <Text style={[T.muted, styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function Action({
  label,
  onPress,
  secondary = false,
  blue = false,
  disabled = false,
  testID,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  blue?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor: secondary ? C.white : blue ? C.blue : C.purple },
        secondary && styles.actionSecondary,
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <Text style={[styles.actionText, { color: secondary ? C.ink : C.white }]}>{label}</Text>
    </Pressable>
  );
}

export function Screen({
  children,
  tab,
  landlord = false,
  title,
  topRight,
}: {
  children: ReactNode;
  tab?: string;
  landlord?: boolean;
  title?: string;
  topRight?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 12, paddingBottom: (tab ? 28 : 28 + insets.bottom) },
        ]}
      >
        <View style={styles.header}>
          {title ? <Text style={T.h2}>{title}</Text> : <Wordmark fontSize={29} />}
          {topRight ?? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications, unread"
              hitSlop={10}
              onPress={() => router.push(landlord ? "/landlord/approvals" : "/activity")}
            >
              <Glyph name="bell" size={22} />
              <View style={styles.bellDot} />
            </Pressable>
          )}
        </View>
        {children}
      </ScrollView>
      {tab && <Tabs selected={tab} landlord={landlord} />}
    </View>
  );
}

const renterTabs: [string, string, Href][] = [
  ["Discover", "magnifyingglass", "/"],
  ["Saved", "heart", "/saved"],
  ["Activity", "bolt", "/activity"],
  ["Home", "house", "/home"],
  ["Profile", "person", "/profile"],
];

const landlordTabs: [string, string, Href][] = [
  ["Overview", "house", "/landlord/overview"],
  ["Properties", "building.2", "/landlord/properties"],
  ["Inbox", "tray", "/landlord/inbox"],
  ["Activity", "bolt", "/landlord/activity"],
  ["Profile", "person", "/profile"],
];

export function Tabs({ selected, landlord = false }: { selected: string; landlord?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View role="tablist" style={[styles.tabs, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {(landlord ? landlordTabs : renterTabs).map(([label, icon, path]) => {
        const active = selected === label;
        return (
          <Pressable
            key={label}
            testID={`tab-${label.toLowerCase()}`}
            role="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
            onPress={() => !active && router.replace(path)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Glyph name={active && icon !== "magnifyingglass" ? `${icon}.fill` : icon} size={21} color={active ? C.purple : C.ink} />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Section({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={T.h2}>{title}</Text>
      {right}
    </View>
  );
}

export function RowLink({
  title,
  subtitle,
  icon,
  onPress,
  badge,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  onPress: () => void;
  badge?: string;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.dimmed]}>
      <View style={styles.rowIcon}>
        <Glyph name={icon} color={C.purple} />
      </View>
      <View style={styles.rowText}>
        <Text style={T.label}>{title}</Text>
        {subtitle && <Text style={T.muted}>{subtitle}</Text>}
      </View>
      {badge && <Pill label={badge} />}
      <Glyph name="chevron.right" color={C.muted} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  content: { paddingHorizontal: 20, gap: 18 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 42 },
  bellDot: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: C.purple,
  },
  panel: {
    backgroundColor: C.white,
    borderRadius: 19,
    borderColor: C.line,
    borderWidth: 1,
    padding: 15,
    shadowColor: C.ink,
    shadowOpacity: 0.035,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
  },
  pill: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 40, alignSelf: "flex-start" },
  pillText: { fontSize: 11 },
  action: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionSecondary: { borderWidth: 1, borderColor: C.actionBorder },
  actionText: { ...fonts.bold, fontSize: 14 },
  dimmed: { opacity: 0.55 },
  tabs: {
    backgroundColor: C.white,
    borderTopWidth: 1,
    borderColor: C.tabLine,
    flexDirection: "row",
    paddingTop: 8,
    paddingHorizontal: 10,
  },
  tab: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 7, borderRadius: 13 },
  tabActive: { backgroundColor: C.lavender },
  tabLabel: { ...fonts.regular, fontSize: 10, color: C.muted },
  tabLabelActive: { color: C.purple },
  section: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.lineSoft,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 3 },
});
