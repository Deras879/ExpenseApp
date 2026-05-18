import { IconSymbol } from "@/components/ui/icon-symbol";
import { TabProvider } from "@/contexts/tab-context";
import { useThemeColors } from "@/contexts/theme-context";
import { useUiPrefs } from "@/contexts/ui-prefs-context";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import AnalysisScreen from "./analysis";
import DashboardScreen from "./dashboard";
import GoalsScreen from "./goals";
import HistoryScreen from "./history";

const SCREEN_WIDTH = Dimensions.get("window").width;
const NUM_TABS = 4;
const SWIPE_VELOCITY = 500;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;

export default function HomeCarousel() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { soundEnabled, vibrationEnabled } = useUiPrefs();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const translateX = useSharedValue(0);
  const panStartX = useSharedValue(0);

  // Snap a un tab sin sonido (útil para swipes y para reutilizar desde goTo)
  const commitIndex = React.useCallback(
    (index: number, withHaptic = false) => {
      setActiveIndex((prev) => {
        if (prev !== index && withHaptic && vibrationEnabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return index;
      });
      translateX.value = withTiming(-index * SCREEN_WIDTH, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
    },
    [vibrationEnabled],
  );

  const goTo = React.useCallback(
    async (index: number) => {
      if (vibrationEnabled)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (soundEnabled) {
        try {
          const { sound } = await Audio.Sound.createAsync(
            require("@/assets/sounds/tap.mp3"),
            { volume: 0.5 },
          );
          await sound.playAsync();
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
          });
        } catch (_) {}
      }
      setActiveIndex(index);
      translateX.value = withTiming(-index * SCREEN_WIDTH, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    },
    [soundEnabled, vibrationEnabled],
  );

  // Gesto: arrastrar horizontalmente para cambiar de tab
  const panGesture = React.useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-15, 15])
        .failOffsetY([-15, 15])
        .onStart(() => {
          panStartX.value = translateX.value;
        })
        .onUpdate((e) => {
          let next = panStartX.value + e.translationX;
          const min = -(NUM_TABS - 1) * SCREEN_WIDTH;
          const max = 0;
          // Rubber-band en los extremos
          if (next > max) next = max + (next - max) * 0.3;
          if (next < min) next = min + (next - min) * 0.3;
          translateX.value = next;
        })
        .onEnd((e) => {
          const currentIndex = Math.round(-panStartX.value / SCREEN_WIDTH);
          const distance = e.translationX;
          const velocity = e.velocityX;
          let target = currentIndex;
          if (distance < -SWIPE_THRESHOLD || velocity < -SWIPE_VELOCITY) {
            target = currentIndex + 1;
          } else if (distance > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY) {
            target = currentIndex - 1;
          }
          target = Math.max(0, Math.min(NUM_TABS - 1, target));
          runOnJS(commitIndex)(target, target !== currentIndex);
        }),
    [commitIndex, panStartX, translateX],
  );

  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const activeColor = (i: number) =>
    activeIndex === i ? "#1457f6" : "#8e8e93";

  return (
    <TabProvider value={{ activeIndex, goTo }}>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top"]}
      >
        {/* Tira horizontal — todas las pantallas unidas */}
        <View style={{ flex: 1, overflow: "hidden" }}>
          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[
                {
                  flexDirection: "row",
                  width: SCREEN_WIDTH * 4,
                  flex: 1,
                },
                stripStyle,
              ]}
            >
              <View style={{ width: SCREEN_WIDTH }}>
                <DashboardScreen />
              </View>
              <View style={{ width: SCREEN_WIDTH }}>
                <HistoryScreen />
              </View>
              <View style={{ width: SCREEN_WIDTH }}>
                <AnalysisScreen />
              </View>
              <View style={{ width: SCREEN_WIDTH }}>
                <GoalsScreen />
              </View>
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Barra de tabs personalizada */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.tabBar,
            borderTopWidth: 1,
            borderTopColor: colors.tabBarBorder,
            paddingBottom: insets.bottom || 8,
          }}
        >
          {/* Inicio */}
          <Pressable
            style={{
              flex: 1,
              alignItems: "center",
              paddingTop: 10,
              paddingBottom: 4,
            }}
            onPress={() => goTo(0)}
          >
            <IconSymbol size={28} name="house.fill" color={activeColor(0)} />
            <Text style={{ fontSize: 10, color: activeColor(0), marginTop: 2 }}>
              Inicio
            </Text>
          </Pressable>

          {/* Historial */}
          <Pressable
            style={{
              flex: 1,
              alignItems: "center",
              paddingTop: 10,
              paddingBottom: 4,
            }}
            onPress={() => goTo(1)}
          >
            <IconSymbol size={28} name="clock.fill" color={activeColor(1)} />
            <Text style={{ fontSize: 10, color: activeColor(1), marginTop: 2 }}>
              Historial
            </Text>
          </Pressable>

          {/* Crear (botón central circular) */}
          <Pressable
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            onPress={() => router.push("/home/create" as any)}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#1755ec",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
                shadowColor: "#1755ec",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <IconSymbol size={32} name="plus" color="#fff" />
            </View>
          </Pressable>

          {/* Análisis */}
          <Pressable
            style={{
              flex: 1,
              alignItems: "center",
              paddingTop: 10,
              paddingBottom: 4,
            }}
            onPress={() => goTo(2)}
          >
            <IconSymbol
              size={28}
              name="chart.bar.fill"
              color={activeColor(2)}
            />
            <Text style={{ fontSize: 10, color: activeColor(2), marginTop: 2 }}>
              Análisis
            </Text>
          </Pressable>

          {/* Metas */}
          <Pressable
            style={{
              flex: 1,
              alignItems: "center",
              paddingTop: 10,
              paddingBottom: 4,
            }}
            onPress={() => goTo(3)}
          >
            <IconSymbol size={28} name="flag.fill" color={activeColor(3)} />
            <Text style={{ fontSize: 10, color: activeColor(3), marginTop: 2 }}>
              Metas
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </TabProvider>
  );
}
