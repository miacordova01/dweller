import { useMutation } from "convex/react";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../convex/_generated/api";
import { Icon } from "@/components/Icon";
import { InAppButton } from "@/components/InAppButton";
import { parseDate } from "@/lib/listings";
import { colors, fonts, radius, space, type } from "@/theme";

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
  { key: "neighborhood", label: "Neighborhood", placeholder: "Mission District" },
  { key: "city", label: "City", placeholder: "San Francisco" },
  { key: "rentMonthly", label: "Rent per month ($)", placeholder: "2200", numeric: true },
  { key: "bedrooms", label: "Bedrooms", placeholder: "1", numeric: true },
  { key: "bathrooms", label: "Bathrooms", placeholder: "1", numeric: true },
  { key: "availableFrom", label: "Available from", placeholder: "2026-12-01" },
  { key: "photoUrl", label: "Photo URL (optional)", placeholder: "https://..." },
];

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

export default function ListYourPlace() {
  const insets = useSafeAreaInsets();
  const addListing = useMutation(api.listings.add);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [listed, setListed] = useState<string | null>(null);

  async function submit() {
    const missing = fields.find((f) => f.key !== "photoUrl" && form[f.key].trim() === "");
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    const rentMonthly = Number(form.rentMonthly);
    const bedrooms = Number(form.bedrooms);
    const bathrooms = Number(form.bathrooms);
    if ([rentMonthly, bedrooms, bathrooms].some((n) => !Number.isFinite(n) || n < 0)) {
      setError("Rent, bedrooms, and bathrooms must be non-negative numbers.");
      return;
    }
    const availableFrom = parseDate(form.availableFrom);
    if (availableFrom === null) {
      setError("Available from must be a date like 2026-12-01.");
      return;
    }
    setError(null);
    setListed(null);
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
      setListed(form.title.trim());
      setForm(emptyForm);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the listing.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.xxl }]}
      automaticallyAdjustKeyboardInsets
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={goBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
        <Icon name={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }} size={20} />
      </Pressable>
      <Text style={type.title} accessibilityRole="header">
        List your place
      </Text>
      <Text style={[type.bodyMuted, styles.subtitle]}>It goes live on Discover as soon as you add it.</Text>

      <View style={styles.form}>
        {fields.map((f) => (
          <View key={f.key} style={styles.field}>
            <Text style={type.label}>{f.label}</Text>
            <TextInput
              testID={`input-${f.key}`}
              accessibilityLabel={f.label}
              style={styles.input}
              value={form[f.key]}
              placeholder={f.placeholder}
              placeholderTextColor={colors.inkMuted}
              keyboardType={f.numeric ? "decimal-pad" : "default"}
              autoCapitalize={f.key === "photoUrl" ? "none" : "sentences"}
              onChangeText={(text) => setForm((prev) => ({ ...prev, [f.key]: text }))}
            />
          </View>
        ))}
        {error && <Text style={styles.error}>{error}</Text>}
        {listed && (
          <Text style={styles.listed} accessibilityLiveRegion="polite">
            “{listed}” is live on Discover.
          </Text>
        )}
        <View style={styles.submit}>
          <InAppButton
            testID="submit-listing"
            label={saving ? "Saving..." : "Add listing"}
            onPress={submit}
            disabled={saving}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20 },
  back: { width: 40, height: 40, justifyContent: "center", marginBottom: space.sm },
  subtitle: { marginTop: space.xs },
  form: { gap: space.lg, marginTop: space.xl },
  field: { gap: space.sm },
  input: {
    minHeight: 52,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.hairline,
    paddingHorizontal: space.lg,
    ...fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  error: { ...fonts.regular, fontSize: 14, lineHeight: 20, color: colors.error },
  listed: { ...fonts.bold, fontSize: 14, lineHeight: 20, color: colors.ink },
  submit: { flexDirection: "row", marginTop: space.sm },
});
