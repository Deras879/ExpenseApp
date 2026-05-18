import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { AppThemeProvider, useAppTheme } from "@/contexts/theme-context";
import { ToastProvider } from "@/contexts/toast-context";
import { UiPrefsProvider } from "@/contexts/ui-prefs-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const unstable_settings = {
  anchor: "(tabs)",
};

function InnerLayout() {
  const colorScheme = useColorScheme();
  const { appTheme } = useAppTheme();
  const isDark =
    appTheme === "dark" || (appTheme === "system" && colorScheme === "dark");

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#1457f6" }}>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen
            name="start"
            options={{
              headerShown: false,
              animation: "none",
              contentStyle: { backgroundColor: "#1457f6" },
            }}
          />
          <Stack.Screen
            name="landing"
            options={{
              headerShown: false,
              animation: "none",
              contentStyle: { backgroundColor: "#1457f6" },
            }}
          />
          <Stack.Screen
            name="register"
            options={{
              headerShown: false,
              animation: "none",
              contentStyle: { backgroundColor: "#1457f6" },
            }}
          />
          <Stack.Screen
            name="home"
            options={{ headerShown: false, animation: "none" }}
          />
        </Stack>
        <StatusBar style={isDark ? "light" : "dark"} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <UiPrefsProvider>
        <ToastProvider>
          <InnerLayout />
        </ToastProvider>
      </UiPrefsProvider>
    </AppThemeProvider>
  );
}
