import { useMutation, useQuery } from "convex/react";
import { Image } from "expo-image";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api } from "../../convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { ImportSheet } from "../components/discovery/ImportSheet";
import { AiMark } from "../components/discovery/AiMark";
import {
  formatBaths,
  formatBeds,
  formatRent,
  parseDate,
  sourceName,
} from "../lib/listings";
import { colors, fonts } from "@/theme";

const emptyForm = {
  title: "",
  address: "",
  neighborhood: "",
  city: "",
  rentMonthly: "",
  bedrooms: "",
  bathrooms: "",
  availableFrom: "",
  photoUrl: "",
};

type FormField = keyof typeof emptyForm;

const fields: {
  key: FormField;
  label: string;
  placeholder: string;
  numeric?: boolean;
}[] = [
  { key: "title", label: "Title", placeholder: "Bright room with bay window" },
  { key: "address", label: "Address", placeholder: "123 Valencia St" },
  {
    key: "neighborhood",
    label: "Neighborhood",
    placeholder: "Mission District",
  },
  { key: "city", label: "City", placeholder: "San Francisco" },
  {
    key: "rentMonthly",
    label: "Rent per month ($)",
    placeholder: "2200",
    numeric: true,
  },
  { key: "bedrooms", label: "Bedrooms", placeholder: "1", numeric: true },
  { key: "bathrooms", label: "Bathrooms", placeholder: "1", numeric: true },
  { key: "availableFrom", label: "Available from", placeholder: "2026-12-01" },
  {
    key: "photoUrl",
    label: "Photo URL (optional)",
    placeholder: "https://...",
  },
];

type FeedListing = FunctionReturnType<typeof api.listings.list>[number];

function ListingCard({ listing }: { listing: FeedListing }) {
  const imported = listing.source !== "dweller";
  const missing = new Set(listing.missingFields);
  const place = [listing.neighborhood, listing.city].filter(Boolean).join(", ");
  return (
    <View style={[styles.card, imported && styles.importedCard]}>
      {imported && (
        <View style={styles.sourceRow}>
          <AiMark label={`Imported from ${sourceName(listing.source)}`} />
          {missing.size > 0 && (
            <Text style={styles.cardMissing}>
              {missing.size} detail{missing.size === 1 ? "" : "s"} missing
            </Text>
          )}
        </View>
      )}
      <View style={styles.cardBody}>
        {imported && listing.photoUrl && (
          <Image
            source={{ uri: listing.photoUrl }}
            style={styles.cardPhoto}
            contentFit="cover"
            contentPosition="top"
          />
        )}
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{listing.title}</Text>
          <Text style={styles.cardNeighborhood}>
            {place || "Location unknown"}
          </Text>
        </View>
      </View>
      <View style={styles.cardRow}>
        <Text
          style={[
            styles.cardRent,
            missing.has("rentMonthlyCents") && styles.cardUnknown,
          ]}
        >
          {missing.has("rentMonthlyCents")
            ? "Rent unknown"
            : `${formatRent(listing.rentMonthlyCents)}/mo`}
        </Text>
        <Text style={styles.cardMeta}>
          {[
            missing.has("bedrooms") ? null : formatBeds(listing.bedrooms),
            missing.has("bathrooms") ? null : formatBaths(listing.bathrooms),
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
    </View>
  );
}

function ImportEntry() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        testID="open-import"
        accessibilityRole="button"
        accessibilityLabel="Add from link or screenshot"
        style={({ pressed }) => [
          styles.importEntry,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => setOpen(true)}
      >
        <AiMark size="large" />
        <View style={styles.cardText}>
          <Text style={styles.importTitle}>Add from link or screenshot</Text>
          <Text style={styles.importSubtitle}>
            Turn an Instagram, TikTok or Craigslist post into a listing card
          </Text>
        </View>
        <Text style={styles.importChevron}>›</Text>
      </Pressable>
      <ImportSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function AddListingForm() {
  const addListing = useMutation(api.listings.add);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    const missing = fields.find(
      (f) => f.key !== "photoUrl" && form[f.key].trim() === "",
    );
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    const rentMonthly = Number(form.rentMonthly);
    const bedrooms = Number(form.bedrooms);
    const bathrooms = Number(form.bathrooms);
    if (
      [rentMonthly, bedrooms, bathrooms].some(
        (n) => !Number.isFinite(n) || n < 0,
      )
    ) {
      setError("Rent, bedrooms, and bathrooms must be non-negative numbers.");
      return;
    }
    const availableFrom = parseDate(form.availableFrom);
    if (availableFrom === null) {
      setError("Available from must be a date like 2026-12-01.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await addListing({
        title: form.title.trim(),
        address: form.address.trim(),
        neighborhood: form.neighborhood.trim(),
        city: form.city.trim(),
        rentMonthlyCents: Math.round(rentMonthly * 100),
        bedrooms,
        bathrooms,
        availableFrom,
        photoUrl: form.photoUrl.trim() || undefined,
      });
      setForm(emptyForm);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the listing.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>List your place</Text>
      {fields.map((f) => (
        <View key={f.key} style={styles.field}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            testID={`input-${f.key}`}
            accessibilityLabel={f.label}
            style={styles.input}
            value={form[f.key]}
            placeholder={f.placeholder}
            placeholderTextColor={colors.inkMuted}
            keyboardType={f.numeric ? "decimal-pad" : "default"}
            autoCapitalize={f.key === "photoUrl" ? "none" : "sentences"}
            onChangeText={(text) =>
              setForm((prev) => ({ ...prev, [f.key]: text }))
            }
          />
        </View>
      ))}
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        testID="submit-listing"
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          (pressed || saving) && styles.buttonPressed,
        ]}
        onPress={submit}
        disabled={saving}
      >
        <Text style={styles.buttonText}>
          {saving ? "Saving..." : "Add listing"}
        </Text>
      </Pressable>
      <Text style={styles.sectionTitle}>Available now</Text>
    </View>
  );
}

export default function ListingsScreen() {
  const listings = useQuery(api.listings.list);

  return (
    <FlatList
      data={listings ?? []}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => <ListingCard listing={item} />}
      ListHeaderComponent={
        <>
          <ImportEntry />
          <AddListingForm />
        </>
      }
      ListEmptyComponent={
        listings === undefined ? (
          <ActivityIndicator style={styles.empty} />
        ) : (
          <Text style={styles.empty}>
            No listings yet. Add the first one above.
          </Text>
        )
      }
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  sectionTitle: {
    fontSize: 20,
    fontFamily: fonts.semibold,
    color: colors.ink,
    letterSpacing: -0.4,
    marginTop: 8,
  },
  form: { gap: 10 },
  field: { gap: 4 },
  label: { fontSize: 13, fontFamily: fonts.medium, color: colors.inkMuted },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  error: { color: colors.error, fontFamily: fonts.regular, fontSize: 14 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonPressed: { opacity: 0.7 },
  buttonText: { color: colors.white, fontSize: 16, fontFamily: fonts.medium },
  importEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: 16,
    marginBottom: 8,
  },
  importTitle: { fontSize: 16, fontFamily: fonts.semibold, color: colors.ink },
  importSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
    marginTop: 2,
  },
  importChevron: {
    fontFamily: fonts.regular,
    fontSize: 24,
    color: colors.inkMuted,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  importedCard: { borderStyle: "dashed", borderColor: colors.primary, gap: 10 },
  sourceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardBody: { flexDirection: "row", gap: 12, alignItems: "center" },
  cardPhoto: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: colors.canvas,
  },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 17, fontFamily: fonts.semibold, color: colors.ink },
  cardNeighborhood: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.inkMuted,
  },
  cardMissing: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.inkMuted,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 6,
  },
  cardRent: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.ink,
    fontVariant: ["tabular-nums"],
  },
  cardUnknown: {
    fontSize: 15,
    fontFamily: fonts.medium,
    color: colors.inkMuted,
  },
  cardMeta: { fontFamily: fonts.regular, fontSize: 14, color: colors.inkMuted },
  empty: { textAlign: "center", color: colors.inkMuted, marginTop: 24 },
});
