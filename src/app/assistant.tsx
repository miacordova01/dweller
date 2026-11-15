import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAction, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { BackButton, C, Glyph, Pill, Screen, T } from "@/components/DwellerUI";
import { demoRenter } from "@/lib/renter";
import { fonts } from "@/theme";

type View_ = NonNullable<typeof api.assistant.conversation._returnType>;
type Message = View_["messages"][number];

const CONVERSATION_KEY = "dweller.assistant.conversation";

const CONTEXT_TAG = /\n\n\(About listing [^)]*\)$/;

const shortcuts = [
  {
    key: "tour",
    icon: "calendar",
    title: "Schedule a tour",
    description: "Find a time that works",
  },
  {
    key: "repair",
    icon: "wrench",
    title: "Report a maintenance issue",
    description: "Get it fixed faster",
  },
  {
    key: "lease",
    icon: "creditcard",
    title: "Ask about my lease",
    description: "Terms, policies, and more",
  },
  {
    key: "listings",
    icon: "magnifyingglass",
    title: "Find new listings",
    description: "Tailored to your preferences",
  },
] as const;

function formatWhen(ms: unknown) {
  if (typeof ms !== "number") return null;
  return new Date(ms).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ActionCard({ action }: { action: NonNullable<Message["action"]> }) {
  const waiting = action.status === "proposed" || action.status === "approved";
  const done = action.status === "executed";
  if (action.tool === "bookTour") {
    const when = formatWhen(action.args?.scheduledFor);
    return (
      <View style={styles.actionCard} testID="assistant-action-tour">
        <View style={styles.actionHead}>
          <View style={styles.actionIcon}>
            <Glyph name="calendar" size={16} color={C.purple} />
          </View>
          <Text style={[T.label, styles.flex]}>
            {done
              ? "Tour confirmed"
              : waiting
                ? "Tour requested"
                : "Tour not booked"}
          </Text>
          <Pill
            tone={done ? "mint" : "sky"}
            label={
              done
                ? "Confirmed"
                : waiting
                  ? "Awaiting approval"
                  : action.status === "rejected"
                    ? "Declined"
                    : "Failed"
            }
          />
        </View>
        {when && <Text style={T.body}>{when}</Text>}
        <Text style={T.muted}>
          {done
            ? "The owner approved it. It’s on your calendar."
            : waiting
              ? "Sent to the owner. Nothing is booked until they approve it."
              : action.status === "rejected"
                ? "The owner declined this time. Ask me for another."
                : "Something went wrong booking this one."}
        </Text>
      </View>
    );
  }
  if (action.tool === "createMaintenanceTicket") {
    return (
      <Pressable
        style={styles.actionCard}
        onPress={() => router.push("/maintenance")}
        accessibilityRole="button"
      >
        <View style={styles.actionHead}>
          <View style={styles.actionIcon}>
            <Glyph name="wrench" size={16} color={C.purple} />
          </View>
          <Text style={[T.label, styles.flex]}>Repair request filed</Text>
          <Glyph name="chevron.right" size={13} color={C.muted} />
        </View>
        <Text style={T.muted}>
          Your landlord has it. Track it in Maintenance.
        </Text>
      </Pressable>
    );
  }
  return null;
}

function Thinking() {
  const pulse = useSharedValue(0.35);
  useEffect(() => {
    pulse.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.35, { duration: 500 }),
        ),
        -1,
      ),
    );
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.get() }));
  return (
    <View
      style={[styles.bubble, styles.agent, styles.thinking]}
      accessibilityLiveRegion="polite"
      testID="assistant-pending"
    >
      <Animated.View style={style}>
        <Glyph name="sparkles" size={15} color={C.purple} />
      </Animated.View>
      <Text style={T.muted}>Dweller is working on it…</Text>
    </View>
  );
}

export default function Assistant() {
  const { listingId } = useLocalSearchParams<{ listingId?: string }>();
  const listing = useQuery(
    api.detail.getListing,
    listingId ? { id: listingId } : "skip",
  );
  const ask = useAction(api.assistant.ask);
  const insets = useSafeAreaInsets();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [draft, setDraft] = useState("");
  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (listingId) return;
    AsyncStorage.getItem(CONVERSATION_KEY)
      .then((id) => id && setConversationId((current) => current ?? (id as Id<"conversations">)))
      .catch(() => {});
  }, [listingId]);
  const live = useQuery(
    api.assistant.conversation,
    conversationId ? { conversationId } : "skip",
  );
  const messages = live?.messages ?? [];
  const lastForAction = new Map(messages.filter((m) => m.agentActionId).map((m) => [m.agentActionId, m._id]));
  const busy = pending !== null;

  async function send(text = draft.trim()) {
    if (!text || busy) return;
    setDraft("");
    setError(null);
    setPending(text);
    const context = listing
      ? `\n\n(About listing ${listing.address}, listingId ${listing._id})`
      : "";
    try {
      const result = await ask({
        conversationId: conversationId ?? undefined,
        message: text + context,
        role: "renter",
      });
      setConversationId(result.conversation._id);
      AsyncStorage.setItem(CONVERSATION_KEY, result.conversation._id).catch(() => {});
    } catch (e) {
      setError(
        e instanceof ConvexError
          ? String(e.data)
          : "Dweller couldn’t answer just now. Try again.",
      );
      setDraft(text);
    } finally {
      setPending(null);
    }
  }

  function prefill(text: string) {
    setDraft(text);
    inputRef.current?.focus();
  }

  function runShortcut(key: (typeof shortcuts)[number]["key"]) {
    if (key === "tour")
      prefill(
        listing
          ? "Book me a tour of this place this Saturday morning"
          : "I'd like to tour ",
      );
    if (key === "repair") router.push("/maintenance");
    if (key === "lease") prefill("What does my lease say about ");
    if (key === "listings")
      send("Find me new listings that match what I'm looking for");
  }

  const started = messages.length > 0 || busy;

  return (
    <Screen bare pushed tab={listingId ? "Discover" : "Home"}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.wash} pointerEvents="none" />
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <BackButton />
        </View>
        <ScrollView
          ref={scrollRef}
          onContentSizeChange={() =>
            started && scrollRef.current?.scrollToEnd({ animated: true })
          }
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.titleRow} accessibilityRole="header">
            <Glyph name="sparkles" size={26} color={C.purple} />
            <Text style={styles.title}>Dweller AI</Text>
          </View>

          {!started ? (
            <>
              <View style={styles.greeting}>
                <Text style={styles.hi}>Hi {demoRenter.name},</Text>
                <Text style={styles.subtitle}>How can I help today?</Text>
              </View>
              <View style={styles.shortcuts}>
                {shortcuts.map((s) => (
                  <Pressable
                    key={s.key}
                    testID={`assistant-${s.key}`}
                    onPress={() => runShortcut(s.key)}
                    accessibilityRole="button"
                    accessibilityLabel={`${s.title}. ${s.description}`}
                    style={({ pressed }) => [
                      styles.shortcut,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.shortcutIcon}>
                      <Glyph name={s.icon} size={20} color={C.purple} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.shortcutTitle}>{s.title}</Text>
                      <Text style={T.muted}>{s.description}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.thread}>
              {messages.map((m) =>
                m.authorRole === "agent" ? (
                  <View key={m._id} style={styles.agentGroup}>
                    <View style={[styles.bubble, styles.agent]}>
                      <Text style={T.body}>{m.text}</Text>
                    </View>
                    {m.action && lastForAction.get(m.agentActionId) === m._id && <ActionCard action={m.action} />}
                  </View>
                ) : (
                  <View key={m._id} style={[styles.bubble, styles.mine]}>
                    <Text style={styles.mineText}>
                      {m.text.replace(CONTEXT_TAG, "")}
                    </Text>
                  </View>
                ),
              )}
              {pending !== null && (
                <>
                  <View style={[styles.bubble, styles.mine]}>
                    <Text style={styles.mineText}>{pending}</Text>
                  </View>
                  <Thinking />
                </>
              )}
            </View>
          )}
          {error && (
            <Text
              style={[T.muted, styles.error]}
              accessibilityLiveRegion="polite"
            >
              {error}
            </Text>
          )}
        </ScrollView>

        <View style={styles.composerBar}>
          {listing && (
            <View style={styles.context}>
              <Glyph name="mappin" size={12} color={C.purple} />
              <Text style={styles.contextText} numberOfLines={1}>
                About {listing.address}
              </Text>
            </View>
          )}
          <View style={styles.composer}>
            <Glyph name="sparkles" size={17} color={C.purple} />
            <TextInput
              ref={inputRef}
              testID="assistant-input"
              value={draft}
              onChangeText={setDraft}
              editable={!busy}
              placeholder={
                busy ? "Dweller is replying…" : "Ask Dweller anything..."
              }
              placeholderTextColor={C.muted}
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={() => send()}
              accessibilityLabel="Ask Dweller anything"
            />
            <Pressable
              testID="assistant-send"
              onPress={() => send()}
              disabled={busy || !draft.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send"
              accessibilityState={{ disabled: busy || !draft.trim(), busy }}
              style={({ pressed }) => [
                styles.send,
                (pressed || (!busy && !draft.trim())) && styles.pressed,
              ]}
            >
              {busy ? (
                <ActivityIndicator size="small" color={C.white} />
              ) : (
                <Glyph name="arrow.up" size={16} color={C.white} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.canvas },
  wash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    experimental_backgroundImage: `linear-gradient(180deg, ${C.lavender} 0%, ${C.canvas} 100%)`,
  },
  header: { paddingHorizontal: 16 },
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { ...fonts.bold, fontSize: 26, letterSpacing: -0.6, color: C.ink },
  greeting: { marginTop: 56, gap: 4 },
  hi: {
    ...fonts.bold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.8,
    color: C.ink,
  },
  subtitle: { ...fonts.regular, fontSize: 20, lineHeight: 26, color: C.ink },
  shortcuts: { marginTop: 28, gap: 12 },
  shortcut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 18,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.lineSoft,
    shadowColor: C.ink,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  shortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutTitle: { ...fonts.bold, fontSize: 15, lineHeight: 20, color: C.ink },
  thread: { marginTop: 24, gap: 12 },
  agentGroup: { gap: 8, alignSelf: "stretch" },
  bubble: {
    maxWidth: "86%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: C.purple,
    borderBottomRightRadius: 6,
  },
  mineText: { ...T.body, color: C.white },
  agent: {
    alignSelf: "flex-start",
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.lineSoft,
    borderBottomLeftRadius: 6,
  },
  thinking: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionCard: {
    alignSelf: "stretch",
    gap: 6,
    padding: 14,
    borderRadius: 18,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.actionBorder,
  },
  actionHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  actionIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: C.lavender,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { marginTop: 12, color: C.purple },
  composerBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: C.canvas,
  },
  context: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: C.lavender,
  },
  contextText: { ...fonts.regular, fontSize: 12, color: C.purple },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 54,
    paddingLeft: 16,
    paddingRight: 7,
    borderRadius: 27,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    shadowColor: C.ink,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  input: {
    flex: 1,
    ...fonts.regular,
    fontSize: 15,
    color: C.ink,
    paddingVertical: 10,
  },
  send: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.purple,
    alignItems: "center",
    justifyContent: "center",
  },
});
