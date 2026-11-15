import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";

const AJAR_ANGLE = 64;
const OPEN_ANGLE = 86;

export function DoorScene({
  size,
  hinge,
  peek,
  knobScale,
  expand,
}: {
  size: number;
  hinge: SharedValue<number>;
  peek: SharedValue<number>;
  knobScale: SharedValue<number>;
  expand: SharedValue<number>;
}) {
  const H = size;
  const W = Math.round(H * 0.82);
  const jamb = H * 0.085;
  const band = H * 0.095;
  const cx = W - H / 2;
  const r = H / 2 - band;
  const innerW = cx + r - jamb;
  const leafH = H * 1.06;
  const leafTop = -H * 0.005;
  const leafBox = { left: jamb * 0.85, top: leafTop, width: innerW * 0.92, height: leafH, transformOrigin: "left center" as const };
  const leafRadii = { borderTopRightRadius: H * 0.11, borderBottomRightRadius: H * 0.06, borderTopLeftRadius: H * 0.015, borderBottomLeftRadius: H * 0.015 };
  const edge = H * 0.05;
  const flatStroke = H * 0.04;

  const outer = `M0 0 H${cx} A${H / 2} ${H / 2} 0 0 1 ${cx} ${H} H0 Z`;
  const inner = `M${jamb} ${band} H${cx} A${r} ${r} 0 0 1 ${cx} ${H - band} H${jamb} Z`;
  const innerLocal = `M0 0 H${cx - jamb} A${r} ${r} 0 0 1 ${cx - jamb} ${2 * r} H0 Z`;

  const leafStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: H * 6 },
      { rotateY: `${-(hinge.get() * AJAR_ANGLE + peek.get() * (OPEN_ANGLE - AJAR_ANGLE))}deg` },
    ],
  }));
  const depthStyle = useAnimatedStyle(() => ({
    opacity: interpolate(hinge.get(), [0, 0.2], [0, 1], "clamp"),
  }));
  const flatStyle = useAnimatedStyle(() => ({
    opacity: interpolate(hinge.get(), [0, 0.2], [1, 0], "clamp"),
  }));
  const flatKnobStyle = useAnimatedStyle(() => ({ transform: [{ scale: knobScale.get() }] }));
  const knobStyle = useAnimatedStyle(() => ({ transform: [{ scale: knobScale.get() }] }));
  const photoStyle = useAnimatedStyle(() => ({
    opacity: peek.get(),
  }));
  const sceneStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(expand.get(), [0, 1], [1, 9]) }],
  }));
  const frameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(expand.get(), [0, 0.45], [1, 0], "clamp"),
    transform: [{ scale: interpolate(expand.get(), [0, 1], [1, 4]) }],
  }));
  const floorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(hinge.get(), [0.2, 1], [0, 1], "clamp") * interpolate(expand.get(), [0, 0.3], [1, 0], "clamp"),
  }));

  const interiorBox = { left: jamb, top: band, width: innerW, height: 2 * r };

  return (
    <View style={{ width: W, height: H }}>
      <Animated.View pointerEvents="none" style={[styles.abs, { left: -W, top: H * 0.7, width: W * 3, height: H * 0.7 }, floorStyle]}>
        <Svg width={W * 3} height={H * 0.7}>
          <Defs>
            <RadialGradient id="shadow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor="#7A7FDB" stopOpacity={0.3} />
              <Stop offset="0.35" stopColor="#8E91E2" stopOpacity={0.14} />
              <Stop offset="1" stopColor="#8E91E2" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="pool" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor="#A866F3" stopOpacity={0.8} />
              <Stop offset="0.45" stopColor="#C996F8" stopOpacity={0.3} />
              <Stop offset="1" stopColor="#E6D6FB" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={W * 0.6} cy={H * 0.34} rx={W * 1.05} ry={H * 0.22} fill="url(#shadow)" />
          <Ellipse cx={W * 1.6} cy={H * 0.36} rx={W * 0.7} ry={H * 0.2} fill="url(#pool)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, depthStyle]}>
      <Animated.View style={[styles.abs, interiorBox, styles.clip, { borderTopRightRadius: r, borderBottomRightRadius: r }, sceneStyle]}>
        <Svg width={innerW} height={2 * r} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="interior" cx="45%" cy="50%" rx="65%" ry="60%">
              <Stop offset="0" stopColor="#FFFFFF" />
              <Stop offset="0.5" stopColor="#FDF7FF" />
              <Stop offset="0.82" stopColor="#F1D9FD" />
              <Stop offset="1" stopColor="#D9A9F9" />
            </RadialGradient>
          </Defs>
          <Path d={innerLocal} fill="url(#interior)" />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
          <Image
            source={require("@/assets/images/door-interior.jpg")}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition={{ left: "40%", top: "35%" }}
            transition={0}
          />
        </Animated.View>
      </Animated.View>

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, frameStyle]}>
        <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="band" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#25206A" />
              <Stop offset="0.45" stopColor="#3D2A8E" />
              <Stop offset="1" stopColor="#6B3CC9" />
            </LinearGradient>
            <LinearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#9E6BEF" />
              <Stop offset="1" stopColor="#D69CFB" />
            </LinearGradient>
          </Defs>
          <Path d={`${outer} ${inner}`} fill="url(#band)" fillRule="evenodd" />
          <Path d={inner} fill="none" stroke="url(#rim)" strokeWidth={H * 0.014} />
        </Svg>


        <Animated.View style={[styles.abs, leafBox, leafStyle]}>
          <View style={[StyleSheet.absoluteFill, styles.clip, leafRadii]}>
            <Svg width={leafBox.width} height={leafH}>
              <Defs>
                <LinearGradient id="leaf" x1="0" y1="0" x2="0.4" y2="1">
                  <Stop offset="0" stopColor="#F1EFFC" />
                  <Stop offset="0.6" stopColor="#E3E0F8" />
                  <Stop offset="1" stopColor="#D2CDF2" />
                </LinearGradient>
              </Defs>
              <Path d={`M0 0 H${leafBox.width} V${leafH} H0 Z`} fill="url(#leaf)" />
              <Path d={`M0 0 H${edge} V${leafH} H0 Z`} fill="#9C9FEA" />
            </Svg>
          </View>
          <Animated.View
            style={[
              styles.knob,
              {
                width: H * 0.075,
                height: H * 0.075,
                borderRadius: H * 0.0375,
                left: leafBox.width * 0.8 - H * 0.0375,
                top: leafH * 0.6 - H * 0.0375,
              },
              knobStyle,
            ]}
          >
            <View style={[styles.knobLight, { width: H * 0.026, height: H * 0.026, borderRadius: H * 0.013, left: H * 0.014, top: H * 0.012 }]} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
      </Animated.View>

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, flatStyle]}>
        <Svg width={W} height={H}>
          <Path
            d={`M${flatStroke / 2} ${flatStroke / 2} H${cx} A${H / 2 - flatStroke / 2} ${H / 2 - flatStroke / 2} 0 0 1 ${cx} ${H - flatStroke / 2} H${flatStroke / 2} Z`}
            fill="none"
            stroke="#0B1020"
            strokeWidth={flatStroke}
            strokeLinejoin="miter"
          />
        </Svg>
        <Animated.View
          style={[
            styles.knob,
            {
              width: H * 0.075,
              height: H * 0.075,
              borderRadius: H * 0.0375,
              left: jamb * 0.85 + leafBox.width * 0.8 - H * 0.0375,
              top: leafTop + leafH * 0.6 - H * 0.0375,
            },
            flatKnobStyle,
          ]}
        >
          <View style={[styles.knobLight, { width: H * 0.026, height: H * 0.026, borderRadius: H * 0.013, left: H * 0.014, top: H * 0.012 }]} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: "absolute" },
  clip: { overflow: "hidden" },
  knob: {
    position: "absolute",
    backgroundColor: "#7C3AED",
    boxShadow: "0 2px 4px rgba(76, 29, 149, 0.35)",
  },
  knobLight: { position: "absolute", backgroundColor: "rgba(255,255,255,0.55)" },
});
