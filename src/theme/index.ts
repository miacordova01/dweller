import type { TextStyle } from "react-native";

export const colors = {
  ink: "#0B1020",
  inkMuted: "#5A6478",
  canvas: "#F6F4FD",
  white: "#FFFFFF",
  primary: "#7C3AED",
  mist: "#F4F1FF",
  glow: "#FFF8EC",
  leafEdge: "#D6CDF4",
  lavender: "#F1EDFF",
  sky: "#A7D8FF",
  blue: "#477CF5",
  mint: "#D9FBE9",
  hairline: "#E3E6EF",
  error: "#B3261E",
} as const;

export function withAlpha(hex: string, alpha: number) {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, "0");
}

export const fonts = {
  regular: { fontFamily: "Arial", fontWeight: "400" },
  bold: { fontFamily: "Arial", fontWeight: "700" },
} as const satisfies Record<string, TextStyle>;

const tight = (size: number) => size * -0.02;

export const type = {
  wordmark: { ...fonts.regular, fontSize: 44, lineHeight: 52, letterSpacing: tight(44), color: colors.ink },
  display: { ...fonts.bold, fontSize: 36, lineHeight: 42, letterSpacing: tight(36), color: colors.ink },
  title: { ...fonts.bold, fontSize: 28, lineHeight: 34, letterSpacing: tight(28), color: colors.ink },
  section: { ...fonts.bold, fontSize: 20, lineHeight: 26, letterSpacing: tight(20), color: colors.ink },
  heading: { ...fonts.bold, fontSize: 18, lineHeight: 24, color: colors.ink },
  body: { ...fonts.regular, fontSize: 16, lineHeight: 24, color: colors.ink },
  bodyMuted: { ...fonts.regular, fontSize: 16, lineHeight: 24, color: colors.inkMuted },
  caption: { ...fonts.regular, fontSize: 13, lineHeight: 18, color: colors.inkMuted },
  label: { ...fonts.bold, fontSize: 14, lineHeight: 20, color: colors.ink },
  button: { ...fonts.bold, fontSize: 16, lineHeight: 22 },
  price: { ...fonts.bold, fontSize: 18, lineHeight: 24, fontVariant: ["tabular-nums"], color: colors.ink },
} satisfies Record<string, TextStyle>;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 10, md: 14, card: 16, lg: 20, pill: 999 } as const;

export const shadow = {
  card: `0 4px 16px ${withAlpha(colors.ink, 0.06)}, 0 1px 2px ${withAlpha(colors.ink, 0.04)}`,
  float: `0 2px 8px ${withAlpha(colors.ink, 0.12)}`,
} as const;

export const theme = { colors, fonts, type, space, radius, shadow };
