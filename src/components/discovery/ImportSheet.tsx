import { useAction, useMutation, useQuery } from "convex/react";
import type { FunctionArgs } from "convex/server";
import { ConvexError } from "convex/values";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api } from "../../../convex/_generated/api";
import type { Doc, Id } from "../../../convex/_generated/dataModel";
import {
  formatBaths,
  formatBeds,
  formatDate,
  formatRent,
  parseDate,
  sourceName,
} from "../../lib/listings";
import { colors, fonts } from "@/theme";
import { AiMark } from "./AiMark";

type Phase =
  | { kind: "start" }
  | { kind: "working"; label: string }
  | { kind: "review"; listingId: Id<"listings"> };

type FieldKey =
  | "title"
  | "rentMonthlyCents"
  | "address"
  | "neighborhood"
  | "city"
  | "bedrooms"
  | "bathrooms"
  | "availableFrom"
  | "description";

const reviewFields: {
  key: FieldKey;
  label: string;
  placeholder: string;
  keyboard?: "decimal-pad" | "number-pad";
  show: (listing: Doc<"listings">) => string;
}[] = [
  {
    key: "rentMonthlyCents",
    label: "Rent per month ($)",
    placeholder: "2400",
    keyboard: "decimal-pad",
    show: (l) => `${formatRent(l.rentMonthlyCents)}/mo`,
  },
  {
    key: "address",
    label: "Address",
    placeholder: "1847 Echo Park Ave",
    show: (l) => l.address,
  },
  {
    key: "neighborhood",
    label: "Neighborhood",
    placeholder: "Echo Park",
    show: (l) => l.neighborhood,
  },
  {
    key: "city",
    label: "City",
    placeholder: "Los Angeles",
    show: (l) => l.city,
  },
  {
    key: "bedrooms",
    label: "Bedrooms",
    placeholder: "0 for a studio",
    keyboard: "decimal-pad",
    show: (l) => formatBeds(l.bedrooms),
  },
  {
    key: "bathrooms",
    label: "Bathrooms",
    placeholder: "1",
    keyboard: "decimal-pad",
    show: (l) => formatBaths(l.bathrooms),
  },
  {
    key: "availableFrom",
    label: "Available from",
    placeholder: "2026-12-01",
    show: (l) =>
      l.availableFrom === undefined ? "" : formatDate(l.availableFrom),
  },
  {
    key: "title",
    label: "Title",
    placeholder: "Sunny 2BR in Echo Park",
    show: (l) => l.title,
  },
  {
    key: "description",
    label: "Description",
    placeholder: "What makes this place worth a look",
    show: (l) => l.description ?? "",
  },
];

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ConvexError && typeof error.data === "string")
    return error.data;
  return fallback;
}

export function ImportSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const generateUploadUrl = useMutation(api.discovery.generateUploadUrl);
  const importFromScreenshot = useAction(api.discovery.importFromScreenshot);
  const importFromUrl = useAction(api.discovery.importFromUrl);
  const discardImport = useMutation(api.discovery.discardImport);
  const [phase, setPhase] = useState<Phase>({ kind: "start" });
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPhase({ kind: "start" });
    setUrl("");
    setError(null);
  }

  function close() {
    if (phase.kind === "working") return;
    if (phase.kind === "review") {
      void discardImport({ listingId: phase.listingId }).catch(() => {});
    }
    reset();
    onClose();
  }

  async function pickScreenshot() {
    setError(null);
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    setPhase({ kind: "working", label: "Reading your screenshot" });
    try {
      const uploadUrl = await generateUploadUrl();
      const image = await (await fetch(asset.uri)).blob();
      const upload = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": asset.mimeType ?? "image/jpeg" },
        body: image,
      });
      if (!upload.ok) throw new Error("upload failed");
      const { storageId } = (await upload.json()) as {
        storageId: Id<"_storage">;
      };
      const listingId = await importFromScreenshot({ storageId });
      setPhase({ kind: "review", listingId });
    } catch (e) {
      setError(
        errorMessage(
          e,
          "Couldn't read that screenshot. Check your connection and try again.",
        ),
      );
      setPhase({ kind: "start" });
    }
  }

  async function readLink() {
    if (url.trim() === "") {
      setError("Paste a link to a listing first.");
      return;
    }
    setError(null);
    setPhase({ kind: "working", label: "Reading the listing page" });
    try {
      const listingId = await importFromUrl({ url });
      setPhase({ kind: "review", listingId });
    } catch (e) {
      setError(
        errorMessage(
          e,
          "Couldn't read that link. Try again, or share a screenshot.",
        ),
      );
      setPhase({ kind: "start" });
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Add a rental</Text>
          {phase.kind !== "working" && (
            <Pressable accessibilityRole="button" onPress={close} hitSlop={12}>
              <Text style={styles.link}>
                {phase.kind === "review" ? "Discard" : "Cancel"}
              </Text>
            </Pressable>
          )}
        </View>
        {phase.kind === "start" && (
          <StartView
            url={url}
            error={error}
            onUrlChange={setUrl}
            onPickScreenshot={pickScreenshot}
            onReadLink={readLink}
          />
        )}
        {phase.kind === "working" && <WorkingView label={phase.label} />}
        {phase.kind === "review" && (
          <ReviewView
            listingId={phase.listingId}
            onSaved={() => {
              reset();
              onClose();
            }}
          />
        )}
      </View>
    </Modal>
  );
}

function StartView({
  url,
  error,
  onUrlChange,
  onPickScreenshot,
  onReadLink,
}: {
  url: string;
  error: string | null;
  onUrlChange: (url: string) => void;
  onPickScreenshot: () => void;
  onReadLink: () => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <View style={styles.intro}>
        <AiMark size="large" />
        <Text style={styles.introText}>
          Found a place on Instagram, TikTok or Craigslist? Dweller reads it and
          builds a listing card. You check it before it&apos;s saved.
        </Text>
      </View>

      <Pressable
        testID="import-pick-screenshot"
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
        onPress={onPickScreenshot}
      >
        <Text style={styles.primaryButtonText}>Choose a screenshot</Text>
      </Pressable>
      <Text style={styles.hint}>Best for Instagram and TikTok posts.</Text>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or paste a link</Text>
        <View style={styles.dividerLine} />
      </View>

      <TextInput
        testID="import-url"
        accessibilityLabel="Listing link"
        style={styles.input}
        value={url}
        onChangeText={onUrlChange}
        placeholder="https://sfbay.craigslist.org/..."
        placeholderTextColor={colors.inkMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        returnKeyType="go"
        onSubmitEditing={onReadLink}
      />
      <Pressable
        testID="import-read-link"
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && styles.pressed,
        ]}
        onPress={onReadLink}
      >
        <Text style={styles.secondaryButtonText}>Read link</Text>
      </Pressable>
      <Text style={styles.hint}>
        Works with Craigslist and most listing sites. Instagram and TikTok links
        can&apos;t be read, so screenshot those posts instead.
      </Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function WorkingView({ label }: { label: string }) {
  return (
    <View style={styles.body}>
      <View style={styles.aiCard}>
        <AiMark size="large" />
        <View style={styles.flex}>
          <Text style={styles.aiCardTitle}>{label}</Text>
          <Text style={styles.aiCardText}>
            Pulling out the rent, location, rooms and move-in date. This takes a
            few seconds.
          </Text>
        </View>
        <ActivityIndicator color={colors.primary} />
      </View>
    </View>
  );
}

function ReviewView({
  listingId,
  onSaved,
}: {
  listingId: Id<"listings">;
  onSaved: () => void;
}) {
  const draft = useQuery(api.discovery.getDraft, { listingId });
  const saveImported = useMutation(api.discovery.saveImported);
  const [inputs, setInputs] = useState<Partial<Record<FieldKey, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (draft === undefined) {
    return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  }
  if (draft === null) {
    return (
      <Text style={[styles.hint, styles.body]}>
        This draft is gone. Start a new import.
      </Text>
    );
  }

  const missing = new Set(draft.missingFields);
  const found = reviewFields.filter((f) => !missing.has(f.key));
  const total = reviewFields.length;

  async function save() {
    const fields: FunctionArgs<typeof api.discovery.saveImported>["fields"] =
      {};
    for (const key of draft!.missingFields as FieldKey[]) {
      const text = inputs[key]?.trim();
      if (!text) continue;
      if (key === "availableFrom") {
        const date = parseDate(text);
        if (date === null)
          return setError("Available from must be a date like 2026-12-01.");
        Object.assign(fields, { [key]: date });
      } else if (
        key === "rentMonthlyCents" ||
        key === "bedrooms" ||
        key === "bathrooms"
      ) {
        const n = Number(text.replace(/[$,]/g, ""));
        if (!Number.isFinite(n) || n < 0) {
          return setError("Rent, bedrooms and bathrooms must be numbers.");
        }
        Object.assign(fields, {
          [key]: key === "rentMonthlyCents" ? Math.round(n * 100) : n,
        });
      } else {
        Object.assign(fields, { [key]: text });
      }
    }
    setError(null);
    setSaving(true);
    try {
      await saveImported({ listingId, fields });
      onSaved();
    } catch (e) {
      setError(errorMessage(e, "Couldn't save the listing. Try again."));
      setSaving(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="on-drag"
    >
      <View style={styles.aiCard}>
        <AiMark size="large" />
        <View style={styles.flex}>
          <Text style={styles.aiCardTitle}>
            Found {found.length} of {total} details
          </Text>
          <Text style={styles.aiCardText}>
            From {sourceName(draft.source)}.{" "}
            {missing.size > 0
              ? "Fill in what's missing, or leave it blank and ask the owner later."
              : "Check it over, then save."}
          </Text>
        </View>
      </View>

      <View style={styles.resultCard}>
        {(draft.screenshotUrl ?? draft.photoUrls[0]) && (
          <Image
            source={{ uri: draft.screenshotUrl ?? draft.photoUrls[0] }}
            style={styles.preview}
            contentFit="cover"
            contentPosition="top"
            accessibilityLabel="What Dweller read"
          />
        )}
        {reviewFields.map((field) =>
          missing.has(field.key) ? (
            <View key={field.key} style={styles.fieldRow}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.missingTag}>Not found</Text>
              </View>
              <TextInput
                testID={`import-field-${field.key}`}
                accessibilityLabel={field.label}
                style={[styles.input, styles.missingInput]}
                value={inputs[field.key] ?? ""}
                onChangeText={(text) =>
                  setInputs((prev) => ({ ...prev, [field.key]: text }))
                }
                placeholder={field.placeholder}
                placeholderTextColor={colors.inkMuted}
                keyboardType={field.keyboard ?? "default"}
                multiline={field.key === "description"}
              />
            </View>
          ) : (
            <View key={field.key} style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <Text style={styles.fieldValue}>{field.show(draft)}</Text>
            </View>
          ),
        )}
        {draft.amenities.length > 0 && (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Amenities</Text>
            <Text style={styles.fieldValue}>{draft.amenities.join(" · ")}</Text>
          </View>
        )}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <Pressable
        testID="import-save"
        accessibilityRole="button"
        disabled={saving}
        style={({ pressed }) => [
          styles.primaryButton,
          (pressed || saving) && styles.pressed,
        ]}
        onPress={save}
      >
        <Text style={styles.primaryButtonText}>
          {saving ? "Saving..." : "Save listing"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheet: { flex: 1, backgroundColor: colors.canvas },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sheetTitle: {
    fontSize: 22,
    ...fonts.bold,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  link: { fontSize: 16, color: colors.blue, ...fonts.bold },
  body: { padding: 20, paddingBottom: 48, gap: 12 },
  loading: { marginTop: 48 },
  intro: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  introText: {
    flex: 1,
    ...fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.inkMuted,
  },
  primaryButton: {
    backgroundColor: colors.blue,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    ...fonts.bold,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.ink,
    fontSize: 16,
    ...fonts.bold,
  },
  pressed: { opacity: 0.7 },
  hint: {
    ...fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
  },
  dividerText: {
    ...fonts.regular,
    fontSize: 13,
    color: colors.inkMuted,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 12,
    ...fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  missingInput: { borderColor: colors.primary, borderStyle: "dashed" },
  errorBox: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    ...fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  aiCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.lavender,
    borderRadius: 16,
    padding: 16,
  },
  aiCardTitle: { fontSize: 16, ...fonts.bold, color: colors.ink },
  aiCardText: {
    ...fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
    marginTop: 2,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  preview: { height: 180, borderRadius: 12, backgroundColor: colors.canvas },
  fieldRow: { gap: 4 },
  fieldLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fieldLabel: {
    fontSize: 13,
    ...fonts.bold,
    color: colors.inkMuted,
  },
  fieldValue: {
    ...fonts.regular,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 22,
  },
  missingTag: {
    fontSize: 11,
    ...fonts.bold,
    color: colors.primary,
    backgroundColor: colors.lavender,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: "hidden",
  },
});
