import { StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/Icon";
import { colors, fonts, space, type } from "@/theme";

export type TimelineStep = {
  title: string;
  detail?: string;
  state: "done" | "current" | "upcoming";
};

const MARKER = 22;

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <View accessibilityRole="list">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <View
            key={step.title}
            style={styles.row}
            accessible
            accessibilityLabel={`${step.title}, ${step.state === "done" ? "done" : step.state === "current" ? "in progress" : "not started"}${step.detail ? `, ${step.detail}` : ""}`}
          >
            <View style={styles.rail}>
              <View
                style={[
                  styles.marker,
                  step.state === "done" && styles.markerDone,
                  step.state === "current" && styles.markerCurrent,
                ]}
              >
                {step.state === "done" && (
                  <Icon name={{ ios: "checkmark", android: "check", web: "check" }} size={12} color={colors.white} />
                )}
                {step.state === "current" && <View style={styles.markerDot} />}
              </View>
              {!last && <View style={[styles.line, step.state === "done" && styles.lineDone]} />}
            </View>
            <View style={[styles.text, !last && styles.textSpaced]}>
              <Text style={[styles.title, step.state === "upcoming" && styles.titleUpcoming]}>{step.title}</Text>
              {step.detail && <Text style={type.caption}>{step.detail}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space.md },
  rail: { width: MARKER, alignItems: "center" },
  marker: {
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  markerDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  markerCurrent: { borderColor: colors.primary, borderWidth: 2 },
  markerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  line: { flex: 1, width: 1.5, minHeight: space.lg, backgroundColor: colors.hairline, marginVertical: 2 },
  lineDone: { backgroundColor: colors.primary },
  text: { flex: 1, paddingTop: 1 },
  textSpaced: { paddingBottom: space.lg },
  title: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 20, color: colors.ink },
  titleUpcoming: { color: colors.inkMuted, fontFamily: fonts.regular },
});
