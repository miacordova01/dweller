import { useQuery } from "convex/react";
import { router } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../../convex/_generated/api";
import { Card } from "@/components/Card";
import { Screen } from "@/components/DwellerUI";
import { Icon, type IconName } from "@/components/Icon";
import { ScreenTitle } from "@/components/ScreenTitle";
import {
  useOnboarding,
  type Role,
} from "@/features/onboarding/OnboardingProvider";
import { demoRenter } from "@/lib/renter";
import { colors, fonts, radius, shadow, space, type, withAlpha } from "@/theme";

const roles: {
  role: Role;
  title: string;
  description: string;
  icon: IconName;
}[] = [
  {
    role: "renter",
    title: "Renter",
    description: "Find a home",
    icon: { ios: "house", android: "home", web: "home" },
  },
  {
    role: "landlord",
    title: "Landlord",
    description: "Manage properties",
    icon: { ios: "building.2", android: "apartment", web: "apartment" },
  },
];

function RoleOption({
  option,
  selected,
  onPress,
}: {
  option: (typeof roles)[number];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={`role-switch-${option.role}`}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`Use Dweller as a ${option.title.toLowerCase()}`}
      style={({ pressed }) => [
        styles.role,
        selected && styles.roleSelected,
        pressed && !selected && styles.pressed,
      ]}
    >
      <View style={styles.roleTop}>
        <Icon
          name={option.icon}
          size={22}
          color={selected ? colors.blue : colors.ink}
        />
        {selected && (
          <Icon
            name={{
              ios: "checkmark.circle.fill",
              android: "check_circle",
              web: "check_circle",
            }}
            size={18}
            color={colors.blue}
          />
        )}
      </View>
      <Text style={type.label}>{option.title}</Text>
      <Text style={type.caption}>{option.description}</Text>
    </Pressable>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={type.caption}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function LinkRow({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
    >
      <Icon name={icon} size={20} />
      <Text style={styles.linkLabel}>{label}</Text>
      <Icon
        name={{
          ios: "chevron.right",
          android: "chevron_right",
          web: "chevron_right",
        }}
        size={14}
        color={colors.inkMuted}
      />
    </Pressable>
  );
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { role, renter, landlord, setRole, startOver } = useOnboarding();
  const landlordProfile = useQuery(api.landlord.me);
  const current: Role = role ?? "renter";

  const name =
    current === "landlord"
      ? (landlordProfile?.name ?? "Landlord")
      : demoRenter.name;
  const location = (
    current === "landlord" ? landlord.location : renter.location
  ).trim();
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  const details =
    current === "renter"
      ? [
          { label: "Where", value: renter.location.trim() || "Anywhere" },
          { label: "Budget", value: renter.budget ?? "Not set" },
          { label: "Move-in", value: renter.moveIn ?? "Not set" },
          { label: "Bedrooms", value: renter.bedrooms ?? "Any" },
          { label: "Looking for", value: renter.space ?? "Not set" },
          {
            label: "Must-haves",
            value: renter.amenities.length
              ? renter.amenities.join(", ")
              : "None yet",
          },
        ]
      : [
          { label: "Properties", value: landlord.propertyCount ?? "Not set" },
          { label: "Where", value: landlord.location.trim() || "Not set" },
          { label: "Occupancy", value: landlord.occupied ?? "Not set" },
          {
            label: "List vacancies",
            value: landlord.listVacancies ?? "Not set",
          },
        ];

  function confirmStartOver() {
    Alert.alert(
      "Start over?",
      "You'll go back to the door and pick a role again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start over",
          style: "destructive",
          onPress: () => startOver(),
        },
      ],
    );
  }

  return (
    <Screen bare tab="Profile" landlord={current === "landlord"}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle title="Profile" />

        <Card style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={type.heading}>{name}</Text>
            <Text style={type.caption}>
              {current === "landlord" ? "Landlord" : "Renter"}
              {location ? ` · ${location}` : ""}
            </Text>
          </View>
        </Card>

        <Text style={[type.section, styles.section]}>Using Dweller as</Text>
        <View style={styles.roles} accessibilityRole="radiogroup">
          {roles.map((option) => (
            <RoleOption
              key={option.role}
              option={option}
              selected={option.role === current}
              onPress={() => option.role !== current && setRole(option.role)}
            />
          ))}
        </View>
        <Text style={[type.caption, styles.hint]}>
          Switch any time. Your answers for each role are kept.
        </Text>

        <Text style={[type.section, styles.section]}>
          {current === "renter" ? "Your search" : "Your properties"}
        </Text>
        <Card style={styles.flush}>
          {details.map((detail, index) => (
            <View key={detail.label}>
              {index > 0 && <View style={styles.divider} />}
              <Row label={detail.label} value={detail.value} />
            </View>
          ))}
        </Card>

        <Text style={[type.section, styles.section]}>Account</Text>
        <Card style={styles.flush}>
          <LinkRow
            testID="profile-list-your-place"
            icon={{ ios: "plus.square", android: "add_home", web: "add_home" }}
            label="List your place"
            onPress={() => router.push("/list-your-place")}
          />
          <View style={styles.divider} />
          <LinkRow
            testID="profile-start-over"
            icon={{
              ios: "arrow.counterclockwise",
              android: "restart_alt",
              web: "restart_alt",
            }}
            label="Start over"
            onPress={confirmStartOver}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, paddingBottom: space.xxl },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    marginTop: space.xl,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: withAlpha(colors.sky, 0.45),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...fonts.bold, fontSize: 20, color: colors.ink },
  identityText: { flex: 1, gap: 2 },
  section: { marginTop: space.xl, marginBottom: space.md },
  roles: { flexDirection: "row", gap: space.md },
  role: {
    flex: 1,
    gap: 2,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "transparent",
    boxShadow: shadow.card,
  },
  roleSelected: { borderColor: colors.blue },
  roleTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: space.sm,
  },
  pressed: { opacity: 0.7 },
  hint: { marginTop: space.sm },
  flush: { padding: 0 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginLeft: space.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.lg,
    minHeight: 52,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  rowValue: { ...type.label, flexShrink: 1, textAlign: "right" },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    minHeight: 56,
    paddingHorizontal: space.lg,
  },
  linkLabel: { flex: 1, ...fonts.bold, fontSize: 16, color: colors.ink },
});
