import { useMutation, useQuery } from "convex/react";
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
import type { Doc } from "../../convex/_generated/dataModel";

const emptyForm = {
  title: "",
  address: "",
  neighborhood: "",
  rentMonthly: "",
  bedrooms: "",
  bathrooms: "",
  availableFrom: "",
  landlordName: "",
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
  {
    key: "rentMonthly",
    label: "Rent per month ($)",
    placeholder: "2200",
    numeric: true,
  },
  { key: "bedrooms", label: "Bedrooms", placeholder: "1", numeric: true },
  { key: "bathrooms", label: "Bathrooms", placeholder: "1", numeric: true },
  { key: "availableFrom", label: "Available from", placeholder: "2026-12-01" },
  { key: "landlordName", label: "Landlord name", placeholder: "Your name" },
  {
    key: "photoUrl",
    label: "Photo URL (optional)",
    placeholder: "https://...",
  },
];

function formatBeds(bedrooms: number) {
  if (bedrooms === 0) return "Studio";
  return `${bedrooms} bed${bedrooms === 1 ? "" : "s"}`;
}

function ListingCard({ listing }: { listing: Doc<"listings"> }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{listing.title}</Text>
      <Text style={styles.cardNeighborhood}>{listing.neighborhood}</Text>
      <View style={styles.cardRow}>
        <Text style={styles.cardRent}>
          ${listing.rentMonthly.toLocaleString("en-US")}/mo
        </Text>
        <Text style={styles.cardMeta}>
          {formatBeds(listing.bedrooms)} · {listing.bathrooms} bath
          {listing.bathrooms === 1 ? "" : "s"}
        </Text>
      </View>
    </View>
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
    setError(null);
    setSaving(true);
    try {
      await addListing({
        title: form.title.trim(),
        address: form.address.trim(),
        neighborhood: form.neighborhood.trim(),
        rentMonthly,
        bedrooms,
        bathrooms,
        availableFrom: form.availableFrom.trim(),
        landlordName: form.landlordName.trim(),
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
            placeholderTextColor="#9AA0A6"
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
      ListHeaderComponent={<AddListingForm />}
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
  screen: { flex: 1, backgroundColor: "#F6F5F2" },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2421",
    marginTop: 8,
  },
  form: { gap: 10 },
  field: { gap: 4 },
  label: { fontSize: 13, fontWeight: "600", color: "#4A514C" },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#C9CCC5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1F2421",
  },
  error: { color: "#B3261E", fontSize: 14 },
  button: {
    backgroundColor: "#2F6B4F",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonPressed: { opacity: 0.7 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 17, fontWeight: "600", color: "#1F2421" },
  cardNeighborhood: { fontSize: 14, color: "#5F6661" },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 6,
  },
  cardRent: { fontSize: 18, fontWeight: "700", color: "#2F6B4F" },
  cardMeta: { fontSize: 14, color: "#4A514C" },
  empty: { textAlign: "center", color: "#5F6661", marginTop: 24 },
});
