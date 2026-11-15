import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from "@expo-google-fonts/manrope";
import type { TextStyle } from "react-native";

export const colors = {
  ink: "#0B1020",
  inkMuted: "#5A6478",
  canvas: "#FAFBFF",
  white: "#FFFFFF",
  primary: "#7C3AED",
  lavender: "#F1EDFF",
  sky: "#A7D8FF",
  blue: "#477CF5",
  mint: "#D9FBE9",
} as const;

export function withAlpha(hex: string, alpha: number) {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, "0");
}

export const fontAssets = {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
};

export const fonts = {
  light: "Manrope_300Light",
  regular: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
} as const;

const tight = (size: number) => size * -0.02;

export const type = {
  wordmark: { fontFamily: fonts.light, fontSize: 44, lineHeight: 52, letterSpacing: tight(44), color: colors.ink },
  display: { fontFamily: fonts.medium, fontSize: 36, lineHeight: 42, letterSpacing: tight(36), color: colors.ink },
  title: { fontFamily: fonts.medium, fontSize: 28, lineHeight: 34, letterSpacing: tight(28), color: colors.ink },
  heading: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.ink },
  bodyMuted: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.inkMuted },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.inkMuted },
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.ink },
  button: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  price: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, fontVariant: ["tabular-nums"], color: colors.ink },
} satisfies Record<string, TextStyle>;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;

export const theme = { colors, fonts, type, space, radius };
