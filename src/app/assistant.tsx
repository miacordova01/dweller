import { router } from "expo-router";
import { useRef, useState, type ComponentRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "@/components/Card";
import { Icon, type IconName } from "@/components/Icon";
import { demoRenter } from "@/lib/renter";
import { colors, fonts, radius, shadow, space, type, withAlpha } from "@/theme";

const actions: { key: "tour" | "repair" | "lease" | "listings"; icon: IconName; title: string; description: string }[] = [
  {
    key: "tour",
    icon: { ios: "calendar", android: "calendar_today", web: "calendar_today" },
    title: "Schedule a tour",
    description: "Find a time that works",
  },
  {
    key: "repair",
    icon: { ios: "wrench.adjustable", android: "build", web: "build" },
    title: "Report a maintenance issue",
    description: "Get it fixed faster",
  },
  {
    key: "lease",
    icon: { ios: "creditcard", android: "credit_card", web: "credit_card" },
    title: "Ask about my lease",
    description: "Terms, policies, and more",
  },
  {
    key: "listings",
    icon: { ios: "magnifyingglass", android: "search", web: "search" },
    title: "Find new listings",
    description: "Tailored to your preferences",
  },
];

export default function Assistant() {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  function prefill(text: string) {
    setDraft(text);
    inputRef.current?.focus();
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    setSent(text);
    setDraft("");
  }

  function runAction(key: (typeof actions)[number]["key"]) {
    if (key === "tour") prefill("I'd like to tour ");
    if (key === "lease") prefill("Question about my lease: ");
    if (key === "repair") router.push("/maintenance");
    if (key === "listings") router.push("/");
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.wash} pointerEvents="none" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow} accessibilityRole="header">
          <Text style={styles.sparkle}>✦</Text>
          <Text style={styles.title}>Dweller AI</Text>
        </View>

        <View style={styles.greeting}>
          <Text style={type.display}>Hi {demoRenter.name},</Text>
          <Text style={styles.subtitle}>How can I help today?</Text>
        </View>

        <View style={styles.actions}>
          {actions.map((action) => (
            <Card
              key={action.key}
              testID={`assistant-${action.key}`}
              onPress={() => runAction(action.key)}
              accessibilityLabel={`${action.title}. ${action.description}`}
              style={styles.actionCard}
            >
              <View style={styles.actionIcon}>
                <Icon name={action.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={type.caption}>{action.description}</Text>
              </View>
            </Card>
          ))}
        </View>

        {sent && (
          <Text style={[type.caption, styles.note]} accessibilityLiveRegion="polite">
            Got it. Dweller will pick up “{sent}” once replies are switched on.
          </Text>
        )}
      </ScrollView>

      <View style={[styles.composerBar, { paddingBottom: insets.bottom + space.sm }]}>
        <View style={styles.composer}>
          <Text style={styles.composerSparkle}>✦</Text>
          <TextInput
            ref={inputRef}
            testID="assistant-input"
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask Dweller anything…"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={send}
            accessibilityLabel="Ask Dweller anything"
          />
          <Pressable
            testID="assistant-send"
            onPress={send}
            disabled={!draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: !draft.trim() }}
            style={({ pressed }) => [styles.send, pressed && { opacity: 0.85 }]}
          >
            <Icon name={{ ios: "arrow.up", android: "arrow_upward", web: "arrow_upward" }} size={16} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  wash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 360,
    backgroundImage: `linear-gradient(180deg, ${colors.lavender} 0%, ${withAlpha(colors.lavender, 0)} 100%)`,
  },
  content: { paddingHorizontal: 20, paddingBottom: space.xl },
  titleRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  sparkle: { ...fonts.regular, fontSize: 26, color: colors.primary },
  title: { ...type.title, fontSize: 26 },
  greeting: { marginTop: 72, gap: space.xs },
  subtitle: { ...type.heading, ...fonts.bold, fontSize: 20, lineHeight: 26 },
  actions: { marginTop: space.xl, gap: space.md },
  actionCard: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.md },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1, gap: 2 },
  actionTitle: { ...fonts.bold, fontSize: 15, lineHeight: 20, color: colors.ink },
  note: { marginTop: space.lg, textAlign: "center" },
  composerBar: { paddingHorizontal: 20, paddingTop: space.sm, backgroundColor: colors.canvas },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 52,
    paddingLeft: space.lg,
    paddingRight: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.hairline,
    boxShadow: shadow.card,
  },
  composerSparkle: { ...fonts.regular, fontSize: 16, color: colors.primary },
  input: { flex: 1, ...type.body, paddingVertical: space.sm },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
