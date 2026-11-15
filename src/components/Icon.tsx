import { SymbolView, type SymbolViewProps } from "expo-symbols";
import type { ColorValue } from "react-native";

import { colors } from "@/theme";

export type IconName = Exclude<SymbolViewProps["name"], string>;

export function Icon({ name, size = 20, color = colors.ink }: { name: IconName; size?: number; color?: ColorValue }) {
  return <SymbolView name={name} size={size} tintColor={color} />;
}
