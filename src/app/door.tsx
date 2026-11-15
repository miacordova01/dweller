import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { DoorMark } from '@/components/DoorMark';
import { Wordmark } from '@/components/Wordmark';
import { colors, fonts } from '@/theme';

// Reference: panel 2. Closed lavender door, purple knob, luminous white reveal.
// No photo/interior: the reveal is intentionally pure light.
export default function DoorScreen() {
  const reducedMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [started, setStarted] = useState(false);
  const locked = useRef(false);
  const hinge = useSharedValue(0); // 0 is fully CLOSED, not partly open
  const knob = useSharedValue(1);
  const reveal = useSharedValue(0);
  const bloom = useSharedValue(0);
  const size = Math.min(width * 0.53, 230);
  const radius = Math.hypot(width, height);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(hinge.value, [0, 0.12, 0.8], [0, 0.18, 1], 'clamp'),
    transform: [{ scale: interpolate(reveal.value, [0, 1], [0.55, radius / size * 3], 'clamp') }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: interpolate(reveal.value, [0, 0.6], [1, 0], 'clamp'),
    transform: [{ scale: interpolate(reveal.value, [0, 1], [1, 1.5], 'clamp') }],
  }));
  const whiteStyle = useAnimatedStyle(() => ({
    opacity: interpolate(bloom.value, [0, 1], [0, 1], 'clamp'),
  }));

  function finish() { router.replace('/welcome'); }
  function open() {
    if (locked.current) return;
    locked.current = true;
    setStarted(true);
    knob.value = withSequence(withTiming(0.72, { duration: 95 }), withSpring(1, { damping: 10 }));
    hinge.value = withDelay(130, withTiming(1, { duration: 950, easing: Easing.out(Easing.cubic) }));
    reveal.value = withDelay(680, withTiming(1, { duration: 1250, easing: Easing.inOut(Easing.cubic) }));
    bloom.value = withDelay(1550, withTiming(1, { duration: 620 }, (done) => { if (done) scheduleOnRN(finish); }));
  }
  if (reducedMotion) return <Redirect href="/welcome" />;

  return (
    <View style={styles.screen}>
      <Pressable accessibilityRole="button" accessibilityLabel="Tap to open Dweller" testID="door" onPress={open} style={styles.center}>
        <Animated.View style={[styles.logoStack, logoStyle]}>
          <View style={{ width: size * 0.8, height: size, justifyContent: 'center', alignItems: 'center' }}>
            <Animated.View pointerEvents="none" style={[styles.light, { width: size * 0.75, height: size * 0.92, borderRadius: size * 0.45 }, glowStyle]} />
            <DoorMark size={size} strokeRatio={0.066} knobRatio={0.07} surface={colors.mist} leafColor="#DCD2FF" lit hinge={hinge} knobScale={knob} />
          </View>
          <View style={styles.wordmark}><Wordmark fontSize={43} /></View>
          {!started && <Text style={styles.hint}>Tap to enter</Text>}
        </Animated.View>
      </Pressable>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }, whiteStyle]} />
      <Pressable onPress={finish} accessibilityRole="button" accessibilityLabel="Skip introduction" style={[styles.skip, { top: insets.top + 16 }]}><Text style={styles.skipText}>Skip</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F2FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoStack: { alignItems: 'center', justifyContent: 'center' },
  light: { position: 'absolute', backgroundColor: '#FFFFFF', shadowColor: '#FFFFFF', shadowOpacity: 1, shadowRadius: 55, shadowOffset: { width: 0, height: 0 } },
  wordmark: { marginTop: 28 },
  hint: { marginTop: 34, fontFamily: fonts.medium, color: '#7A728E', fontSize: 13, letterSpacing: 0.4 },
  skip: { position: 'absolute', right: 22, padding: 12 },
  skipText: { color: colors.inkMuted, fontFamily: fonts.medium, fontSize: 13 },
});
