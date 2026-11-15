import { useQuery } from "convex/react";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "../../convex/_generated/api";
import { Action, C, T } from "@/components/DwellerUI";
import {
  bedroomOptions,
  moveInOptions,
  priceOptions,
  type DiscoverFilters,
} from "@/lib/filters";
import { fonts } from "@/theme";

const DAY = 86_400_000;

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipOn,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>
        {label}
      </Text>
    </Pressable>
  );
}

type SheetProps = {
  filters: DiscoverFilters;
  onClose: () => void;
  onApply: (filters: DiscoverFilters) => void;
};

export function FilterSheet({
  visible,
  ...props
}: SheetProps & { visible: boolean }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={props.onClose}
    >
      {visible && <SheetBody {...props} />}
    </Modal>
  );
}

function SheetBody({ filters, onClose, onApply }: SheetProps) {
  const insets = useSafeAreaInsets();
  const neighborhoods = useQuery(api.listings.neighborhoods);
  const [draft, setDraft] = useState(filters);
  const [moveInDays, setMoveInDays] = useState<number | undefined>(() =>
    filters.availableBy === undefined
      ? undefined
      : (moveInOptions.find(
          (o) =>
            o.days !== undefined &&
            Math.abs(Date.now() + o.days * DAY - filters.availableBy!) <
              2 * DAY,
        )?.days ?? -1),
  );

  const selectedHoods = draft.neighborhoods ?? [];
  const known = neighborhoods ?? [];
  const extra = selectedHoods.filter(
    (n) => !known.some((k) => k.toLowerCase() === n.toLowerCase()),
  );

  function toggleHood(name: string) {
    const lower = name.toLowerCase();
    const next = selectedHoods.some((n) => n.toLowerCase() === lower)
      ? selectedHoods.filter((n) => n.toLowerCase() !== lower)
      : [...selectedHoods, name];
    setDraft({ ...draft, neighborhoods: next.length ? next : undefined });
  }

  function apply() {
    onApply({
      ...draft,
      availableBy:
        moveInDays === undefined
          ? undefined
          : moveInDays === -1
            ? filters.availableBy
            : Date.now() + moveInDays * DAY,
    });
  }

  return (
    <>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close filters"
      />
      <View
        style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}
        testID="filter-sheet"
      >
        <View style={styles.grabber} />
        <View style={styles.head}>
          <Text style={T.h2}>Filters</Text>
          <Pressable
            onPress={() => {
              setDraft({});
              setMoveInDays(undefined);
            }}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.reset}>Reset</Text>
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Max rent</Text>
          <View style={styles.chips}>
            {priceOptions.map((o) => (
              <Chip
                key={o.label}
                label={o.label}
                selected={draft.maxRentCents === o.cents}
                onPress={() => setDraft({ ...draft, maxRentCents: o.cents })}
              />
            ))}
          </View>
          <Text style={styles.label}>Bedrooms</Text>
          <View style={styles.chips}>
            {bedroomOptions.map((o) => (
              <Chip
                key={o.label}
                label={o.label}
                selected={
                  draft.minBedrooms === o.min && draft.maxBedrooms === o.max
                }
                onPress={() =>
                  setDraft({ ...draft, minBedrooms: o.min, maxBedrooms: o.max })
                }
              />
            ))}
          </View>
          <Text style={styles.label}>Neighborhood</Text>
          <View style={styles.chips}>
            <Chip
              label="All of SF"
              selected={selectedHoods.length === 0}
              onPress={() => setDraft({ ...draft, neighborhoods: undefined })}
            />
            {[...extra, ...known].map((name) => (
              <Chip
                key={name}
                label={name}
                selected={selectedHoods.some(
                  (n) => n.toLowerCase() === name.toLowerCase(),
                )}
                onPress={() => toggleHood(name)}
              />
            ))}
          </View>
          <Text style={styles.label}>Move-in</Text>
          <View style={styles.chips}>
            {moveInOptions.map((o) => (
              <Chip
                key={o.label}
                label={o.label}
                selected={moveInDays === o.days}
                onPress={() => setMoveInDays(o.days)}
              />
            ))}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Action label="Cancel" secondary onPress={onClose} />
          <Action testID="filter-apply" label="Show homes" onPress={apply} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(11,16,32,0.35)" },
  sheet: {
    maxHeight: "82%",
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.line,
    marginTop: 8,
  },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  reset: { ...fonts.bold, fontSize: 15, color: C.purple },
  body: { paddingBottom: 16 },
  label: { ...T.label, fontSize: 15, marginTop: 14, marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    minHeight: 38,
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  chipOn: { backgroundColor: C.lavender, borderColor: C.purple },
  chipText: { ...fonts.regular, fontSize: 14, color: C.ink },
  chipTextOn: { ...fonts.bold, color: C.purple },
  pressed: { opacity: 0.7 },
  footer: { flexDirection: "row", gap: 12, paddingTop: 12 },
});
