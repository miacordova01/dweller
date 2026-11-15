import { useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import {
  Action,
  C,
  Glyph,
  Panel,
  Pill,
  Screen,
  T,
} from "@/components/DwellerUI";
import { Timeline, type TimelineStep } from "@/components/Timeline";
import { fonts } from "@/theme";

type Ticket = Doc<"maintenanceTickets"> & { photoUrl: string | null };
type Category = Doc<"maintenanceTickets">["category"];
type Urgency = Doc<"maintenanceTickets">["urgency"];

const categories: [Category, string][] = [
  ["plumbing", "Plumbing"],
  ["electrical", "Electrical"],
  ["appliance", "Appliance"],
  ["hvac", "Heating & air"],
  ["pest", "Pests"],
  ["structural", "Structural"],
  ["other", "Other"],
];

const urgencies: [Urgency, string][] = [
  ["low", "Can wait"],
  ["normal", "This week"],
  ["high", "Soon"],
  ["emergency", "Emergency"],
];

const stage: Record<Ticket["status"], number> = {
  new: 1,
  triaging: 1,
  awaiting_approval: 1,
  scheduled: 2,
  in_progress: 2,
  resolved: 4,
  closed: 4,
};

function when(ms: number) {
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function steps(ticket: Ticket): TimelineStep[] {
  const reached = stage[ticket.status];
  const state = (index: number): TimelineStep["state"] =>
    index < reached || reached === 4
      ? "done"
      : index === reached
        ? "current"
        : "upcoming";
  return [
    {
      title: "Request submitted",
      detail: when(ticket._creationTime),
      state: "done",
    },
    {
      title: "Reviewing & scheduling",
      detail:
        reached === 1
          ? "Dweller is coordinating with your landlord."
          : undefined,
      state: state(1),
    },
    {
      title:
        ticket.status === "scheduled"
          ? "Repair scheduled"
          : "Repair in progress",
      detail: reached === 2 ? "A pro is booked for your place." : undefined,
      state: state(2),
    },
    {
      title: "Completed",
      detail: ticket.resolvedAt ? when(ticket.resolvedAt) : undefined,
      state: reached === 4 ? "done" : "upcoming",
    },
  ];
}

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: [T, string][];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map(([key, label]) => (
        <Pressable
          key={key}
          onPress={() => onChange(key)}
          accessibilityRole="button"
          accessibilityState={{ selected: value === key }}
          style={[styles.chip, value === key && styles.chipOn]}
        >
          <Text style={[styles.chipText, value === key && styles.chipTextOn]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function TicketView({ ticket }: { ticket: Ticket }) {
  const done = stage[ticket.status] === 4;
  return (
    <>
      {ticket.photoUrl && (
        <Image
          source={{ uri: ticket.photoUrl }}
          style={styles.photo}
          contentFit="cover"
          accessibilityLabel="Photo of the issue"
        />
      )}
      <View>
        <Text style={styles.label}>Issue</Text>
        <View style={styles.field}>
          <Text style={[T.body, styles.flex]}>{ticket.title}</Text>
          <Pill
            tone={done ? "mint" : "lavender"}
            label={
              done
                ? "Done"
                : ticket.urgency === "emergency"
                  ? "Emergency"
                  : "Open"
            }
          />
        </View>
      </View>
      <View>
        <Text style={styles.label}>Status</Text>
        <Timeline steps={steps(ticket)} />
      </View>
      {ticket.aiDiagnosis && (
        <View style={styles.agent}>
          <Glyph name="sparkles" size={20} color={C.purple} />
          <Text style={[T.body, styles.flex]}>{ticket.aiDiagnosis}</Text>
        </View>
      )}
    </>
  );
}

export default function Maintenance() {
  const tickets = useQuery(api.maintenance.mine);
  const create = useMutation(api.maintenance.create);
  const uploadUrl = useMutation(api.discovery.generateUploadUrl);
  const [composing, setComposing] = useState(false);
  const [selectedId, setSelectedId] = useState<Id<"maintenanceTickets"> | null>(
    null,
  );
  const [photo, setPhoto] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [urgency, setUrgency] = useState<Urgency>("normal");
  const [sending, setSending] = useState(false);

  const showForm = composing || tickets?.length === 0;
  const selected = tickets?.find((t) => t._id === selectedId) ?? tickets?.[0];
  const ready = title.trim() !== "" && category !== null && !sending;

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  }

  async function submit() {
    if (!ready || category === null) return;
    setSending(true);
    try {
      let photoStorageIds: Id<"_storage">[] | undefined;
      if (photo) {
        const blob = await (await fetch(photo)).blob();
        const response = await fetch(await uploadUrl(), {
          method: "POST",
          headers: { "Content-Type": blob.type || "image/jpeg" },
          body: blob,
        });
        const { storageId } = (await response.json()) as {
          storageId: Id<"_storage">;
        };
        photoStorageIds = [storageId];
      }
      const ticketId = await create({
        title: title.trim(),
        description: details.trim() || title.trim(),
        category,
        urgency,
        photoStorageIds,
      });
      setSelectedId(ticketId);
      setComposing(false);
      setTitle("");
      setDetails("");
      setPhoto(null);
      setCategory(null);
      setUrgency("normal");
    } catch (error) {
      Alert.alert(
        "Couldn’t send the request",
        error instanceof ConvexError
          ? String(error.data)
          : "Something went wrong. Try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen pushed tab="Home" title="Maintenance Request">
      {tickets === undefined ? (
        <ActivityIndicator color={C.muted} />
      ) : showForm ? (
        <>
          {photo ? (
            <View>
              <Image
                source={{ uri: photo }}
                style={styles.photo}
                contentFit="cover"
                accessibilityLabel="Photo of the issue"
              />
              <Pressable
                onPress={() => setPhoto(null)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
                style={styles.removePhoto}
              >
                <Glyph name="xmark" size={12} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              testID="add-photo"
              onPress={pickPhoto}
              accessibilityRole="button"
              accessibilityLabel="Add a photo"
              style={({ pressed }) => [
                styles.photo,
                styles.addPhoto,
                pressed && styles.pressed,
              ]}
            >
              <Glyph name="camera" size={24} color={C.muted} />
              <Text style={T.muted}>Add a photo</Text>
            </Pressable>
          )}
          <View>
            <Text style={styles.label}>Issue</Text>
            <View style={styles.field}>
              <TextInput
                testID="issue-input"
                value={title}
                onChangeText={setTitle}
                placeholder="Kitchen sink is leaking"
                placeholderTextColor={C.muted}
                style={styles.input}
                accessibilityLabel="Issue"
              />
              <Glyph name="pencil" size={16} color={C.muted} />
            </View>
          </View>
          <View>
            <Text style={styles.label}>Details</Text>
            <TextInput
              testID="issue-details"
              value={details}
              onChangeText={setDetails}
              placeholder="Where is it, when did it start?"
              placeholderTextColor={C.muted}
              multiline
              style={[styles.field, styles.input, styles.details]}
              accessibilityLabel="Details"
            />
          </View>
          <View>
            <Text style={styles.label}>Type</Text>
            <Chips
              options={categories}
              value={category}
              onChange={setCategory}
            />
          </View>
          <View>
            <Text style={styles.label}>How urgent</Text>
            <Chips options={urgencies} value={urgency} onChange={setUrgency} />
          </View>
          <View style={styles.actions}>
            {composing && (
              <Action
                label="Cancel"
                secondary
                onPress={() => setComposing(false)}
              />
            )}
            <Action
              testID="submit-repair"
              label={sending ? "Sending…" : "Send to landlord"}
              disabled={!ready}
              onPress={submit}
            />
          </View>
        </>
      ) : (
        selected && (
          <>
            <TicketView ticket={selected} />
            <Action
              testID="new-repair"
              label="Report another issue"
              secondary
              onPress={() => setComposing(true)}
            />
            {tickets.length > 1 && (
              <Panel>
                <Text style={[T.label, styles.earlierTitle]}>
                  Your requests
                </Text>
                {tickets.map((t) => (
                  <Pressable
                    key={t._id}
                    onPress={() => setSelectedId(t._id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: t._id === selected._id }}
                    style={styles.row}
                  >
                    <View style={styles.flex}>
                      <Text
                        style={[T.body, t._id === selected._id && styles.rowOn]}
                        numberOfLines={1}
                      >
                        {t.title}
                      </Text>
                      <Text style={T.muted}>{when(t._creationTime)}</Text>
                    </View>
                    <Pill
                      tone={stage[t.status] === 4 ? "mint" : "lavender"}
                      label={t.status.replace("_", " ")}
                    />
                  </Pressable>
                ))}
              </Panel>
            )}
          </>
        )
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.8 },
  photo: {
    width: "100%",
    aspectRatio: 2.2,
    borderRadius: 18,
    backgroundColor: C.lavender,
  },
  addPhoto: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: C.line,
    borderStyle: "dashed",
    backgroundColor: C.white,
  },
  removePhoto: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { ...T.label, marginBottom: 8 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  input: {
    flex: 1,
    ...fonts.regular,
    fontSize: 15,
    color: C.ink,
    paddingVertical: 10,
  },
  details: { minHeight: 88, textAlignVertical: "top", paddingTop: 14 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 13,
    minHeight: 36,
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.white,
  },
  chipOn: { backgroundColor: C.lavender, borderColor: C.purple },
  chipText: { ...fonts.regular, fontSize: 14, color: C.ink },
  chipTextOn: { ...fonts.bold, color: C.purple },
  actions: { flexDirection: "row", gap: 12 },
  agent: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: C.lavender,
  },
  earlierTitle: { marginBottom: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.line,
  },
  rowOn: { ...fonts.bold, color: C.purple },
});
