import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, space, type, withAlpha } from "@/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function usePressScale(amount = 0.03) {
  const pressed = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 - pressed.get() * amount }] }));
  return {
    style,
    onPressIn: () => pressed.set(withTiming(1, { duration: 90 })),
    onPressOut: () => pressed.set(withTiming(0, { duration: 160 })),
  };
}

export function StepScaffold({
  step,
  title,
  subtitle,
  children,
  footer,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Pressable
          testID="onboarding-back"
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.back}
        >
          <SymbolView
            name={{ ios: "chevron.left", android: "arrow_back" }}
            size={20}
            tintColor={colors.ink}
          />
        </Pressable>
        <View style={styles.dots} accessibilityLabel={`Step ${step} of 3`}>
          {[1, 2, 3].map((n) => (
            <View key={n} style={[styles.dot, n <= step && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.back} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: space.xl }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={type.title}>{title}</Text>
        {subtitle && <Text style={[type.bodyMuted, styles.subtitle]}>{subtitle}</Text>}
        <View style={styles.content}>{children}</View>
      </ScrollView>
      {footer && <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>{footer}</View>}
    </View>
  );
}

export function ChoiceCard({
  title,
  description,
  symbol,
  onPress,
  testID,
}: {
  title: string;
  description: string;
  symbol: { ios: "house" | "building.2"; android: "home" | "apartment" };
  onPress: () => void;
  testID?: string;
}) {
  const press = usePressScale(0.02);
  return (
    <Animated.View style={press.style}>
      <Pressable
        testID={testID}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={description}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.cardIcon}>
          <SymbolView name={symbol} size={24} tintColor={colors.primary} />
        </View>
        <Text style={[type.heading, styles.cardTitle]}>{title}</Text>
        <Text style={type.bodyMuted}>{description}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function Question({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.question}>
      <Text style={type.label}>{label}</Text>
      {children}
    </View>
  );
}

export function TextField(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={withAlpha(colors.inkMuted, 0.7)}
      style={styles.input}
      returnKeyType="done"
      {...props}
    />
  );
}

export function ChipGroup({
  options,
  selected,
  onToggle,
  testIDPrefix,
}: {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  testIDPrefix?: string;
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => (
        <Chip
          key={option}
          testID={testIDPrefix && `${testIDPrefix}-${option}`}
          label={option}
          selected={selected.includes(option)}
          onPress={() => onToggle(option)}
        />
      ))}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const press = usePressScale(0.05);
  return (
    <AnimatedPressable
      testID={testID}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected, press.style]}
    >
      <Text style={[type.label, { color: selected ? colors.primary : colors.ink }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const hairline = withAlpha(colors.inkMuted, 0.22);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  dots: { flexDirection: "row", gap: space.xs },
  dot: { width: 18, height: 4, borderRadius: 2, backgroundColor: hairline },
  dotActive: { backgroundColor: colors.primary },
  body: { paddingHorizontal: space.xl, paddingTop: space.md },
  subtitle: { marginTop: space.sm },
  content: { marginTop: space.xl, gap: space.xl },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md, backgroundColor: colors.white },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: hairline,
    backgroundColor: colors.white,
    padding: space.xl,
    gap: space.xs,
  },
  cardPressed: { backgroundColor: colors.lavender, borderColor: withAlpha(colors.primary, 0.3) },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.lavender,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.md,
  },
  cardTitle: { fontSize: 20 },
  question: { gap: space.md },
  input: {
    ...type.body,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: hairline,
    paddingHorizontal: space.lg,
    backgroundColor: colors.canvas,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: {
    minHeight: 40,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: hairline,
    justifyContent: "center",
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.lavender },
});
