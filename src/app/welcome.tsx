import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Wordmark } from "@/components/Wordmark";
import { colors, fonts, space, type, withAlpha } from "@/theme";

const rise = (index: number) => FadeInUp.delay(480 + index * 60).duration(420);

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View
        pointerEvents="none"
        style={[
          styles.wash,
          {
            backgroundImage: `linear-gradient(180deg, ${withAlpha(colors.sky, 0.6)} 0%, ${withAlpha(colors.sky, 0)} 100%)`,
          },
        ]}
      />
      <View style={[styles.content, { paddingTop: insets.top + space.xxxl, paddingBottom: insets.bottom + space.lg }]}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.top}>
          <Wordmark />
        </Animated.View>

        <View style={styles.middle}>
          <Animated.Text entering={FadeInUp.delay(160).duration(450)} style={[type.display, styles.center]}>
            Find home.
          </Animated.Text>
          <Animated.Text entering={FadeInUp.delay(260).duration(450)} style={[type.display, styles.center]}>
            Feel at home.
          </Animated.Text>
          <Animated.Text
            entering={FadeInUp.delay(360).duration(450)}
            style={[type.bodyMuted, styles.center, styles.support]}
          >
            Your next place, and everything after.
          </Animated.Text>
        </View>

        <View style={styles.bottom}>
          <Animated.View entering={rise(0)}>
            <Button testID="get-started" label="Get started" onPress={() => router.push("/onboarding")} />
          </Animated.View>
          <Animated.View entering={rise(1)}>
            <Button
              testID="have-account"
              label="I already have an account"
              variant="secondary"
              accessibilityHint="Sign in is coming soon"
            />
          </Animated.View>
          <Animated.View entering={rise(2)} style={styles.divider}>
            <View style={styles.rule} />
            <Text style={type.caption}>or</Text>
            <View style={styles.rule} />
          </Animated.View>
          <Animated.View entering={rise(3)}>
            <Button
              label="Continue with Apple"
              variant="plain"
              accessibilityHint="Coming soon"
              icon={
                <SymbolView
                  name={{ ios: "apple.logo" }}
                  size={20}
                  tintColor={colors.ink}
                />
              }
            />
          </Animated.View>
          <Animated.View entering={rise(4)}>
            <Button
              label="Continue with Google"
              variant="plain"
              accessibilityHint="Coming soon"
              icon={<Text style={styles.glyph}>G</Text>}
            />
          </Animated.View>
          <Animated.View entering={rise(5)}>
            <Button
              label="Continue with email"
              variant="plain"
              accessibilityHint="Coming soon"
              icon={<SymbolView name={{ ios: "envelope", android: "mail" }} size={20} tintColor={colors.ink} />}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  wash: { position: "absolute", top: 0, left: 0, right: 0, height: "45%" },
  content: { flex: 1, paddingHorizontal: space.xl },
  top: { alignItems: "center" },
  middle: { flex: 1, justifyContent: "center", alignItems: "center" },
  center: { textAlign: "center" },
  support: { marginTop: space.md },
  bottom: { gap: space.sm },
  divider: { flexDirection: "row", alignItems: "center", gap: space.md, marginVertical: space.xs },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: withAlpha(colors.inkMuted, 0.3) },
  glyph: { fontFamily: fonts.semibold, fontSize: 18, color: colors.ink },
});
