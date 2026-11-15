import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AiCard } from "@/components/AiCard";
import { Icon } from "@/components/Icon";
import { Timeline } from "@/components/Timeline";
import { colors, fonts, radius, space, type, withAlpha } from "@/theme";

const samplePhoto =
  "https://images.unsplash.com/photo-1521207418485-99c705420785?auto=format&fit=crop&w=1200&q=80";

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/home");
}

export default function Maintenance() {
  const insets = useSafeAreaInsets();
  const [photo, setPhoto] = useState<string | null>(samplePhoto);
  const [issue, setIssue] = useState("Kitchen sink is leaking");
  const [submittedAt] = useState(() => Date.now());

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  }

  const submitted = new Date(submittedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.xxl }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
          <Icon name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} size={20} />
        </Pressable>
        <Text style={[type.title, styles.title]} accessibilityRole="header">
          Maintenance Request
        </Text>

        {photo ? (
          <View>
            <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" accessibilityLabel="Photo of the issue" />
            <Pressable
              testID="remove-photo"
              onPress={() => setPhoto(null)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              style={styles.removePhoto}
            >
              <Icon name={{ ios: "xmark", android: "close", web: "close" }} size={12} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            testID="add-photo"
            onPress={pickPhoto}
            accessibilityRole="button"
            accessibilityLabel="Add a photo"
            style={({ pressed }) => [styles.photo, styles.addPhoto, pressed && { opacity: 0.8 }]}
          >
            <Icon name={{ ios: "camera", android: "photo_camera", web: "photo_camera" }} size={24} color={colors.inkMuted} />
            <Text style={type.caption}>Add a photo</Text>
          </Pressable>
        )}

        <Text style={[type.label, styles.label]}>Issue</Text>
        <View style={styles.field}>
          <TextInput
            testID="issue-input"
            value={issue}
            onChangeText={setIssue}
            placeholder="What needs fixing?"
            placeholderTextColor={colors.inkMuted}
            style={styles.input}
            accessibilityLabel="Issue"
          />
          <Icon name={{ ios: "pencil", android: "edit", web: "edit" }} size={16} color={colors.inkMuted} />
        </View>

        <Text style={[type.label, styles.label]}>Status</Text>
        <Timeline
          steps={[
            { title: "Request submitted", detail: submitted, state: "done" },
            { title: "Reviewing & scheduling", detail: "Dweller is coordinating with your landlord.", state: "current" },
            { title: "Repair in progress", state: "upcoming" },
            { title: "Completed", state: "upcoming" },
          ]}
        />

        <View style={styles.agent}>
          <AiCard>Dweller is getting a repair quote and will lock in a time once approved.</AiCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  content: { paddingHorizontal: 20 },
  back: { width: 40, height: 40, justifyContent: "center" },
  title: { marginTop: space.sm, marginBottom: space.lg },
  photo: { width: "100%", aspectRatio: 2.2, borderRadius: radius.md + 2, backgroundColor: colors.canvas },
  addPhoto: {
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.hairline,
    borderStyle: "dashed",
  },
  removePhoto: {
    position: "absolute",
    top: space.md,
    right: space.md,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: `0 1px 4px ${withAlpha(colors.ink, 0.15)}`,
  },
  label: { marginTop: space.xl, marginBottom: space.sm },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 52,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.hairline,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.ink, paddingVertical: space.sm },
  agent: { marginTop: space.xl },
});
